import 'dotenv/config'
import { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import { config } from './config'
import { TemplateRegistry } from './remotion/templates'
import { TaskRepository } from './database/TaskRepository'
import { TaskLogger } from './database/TaskLogger'
import { VideoProcessor } from './services/VideoProcessor'
import { OssUploadService } from './services/OssUploadService'
import { initDatabase } from './database'
import { Timer } from './utils/Timer'

const program = new Command()

program.name('video-subtitle').description('视频字幕自动生成工具').version('1.0.0')

program
  .command('generate')
  .description('生成带字幕的视频')
  .option('--video <url>', '背景视频 URL（模板 mode=normal 时需要）')
  .option('--audio <url>', '主音频 URL（模板 mode=pipOnly/podcast 时可单独传）')
  .option('--output <path>', '输出视频路径')
  .option('--skip-asr', '跳过语音识别')
  .option('--subtitle <path>', '已有字幕文件')
  .option('--template <name>', '字幕模板名称', 't1')
  .option('--title <text>', '视频标题')
  .option('--speaker <name>', '主讲人名称')
  .option('--speaker-title <title>', '主讲人头衔')
  .option('--avatar <url>', '头像图片 URL（用于模板头像组件）')
  .option('--pip <urls...>', '画中画素材链接（支持多个图片/视频URL）')
  .option('--pip-tags <tagGroups>', '画中画素材标签（用 || 分隔素材、每个素材内用 , 分隔标签；与 --pip 一一对应）')
  .option('--bgm-url <url>', '背景音乐 mp3 URL 地址')
  .option('--split-subtitle <path>', '已有分句字幕文件路径（subtitle_split.json，传入后自动跳过 ASR 与分句）')
  .option('--no-use-ai', '禁用 AI 分句器（默认开启 AI 分句）')
  .option('--no-upload-oss', '处理完成后不上传 OSS（默认上传）')
  .option('--original-text <text>', '原始文案（用于校正 ASR 错别字）')
  .action(handleGenerate)

program
  .command('list-templates')
  .description('列出所有可用模板')
  .action(() => {
    const templates = TemplateRegistry.list()
    console.log('\n可用模板:\n')
    templates.forEach(t => {
      console.log(`  ${t.name} - ${t.description}`)
    })
    console.log('')
  })

/** 处理生成命令 */
async function handleGenerate(options: any) {
  console.log('开始处理...\n')
  const totalTimer = new Timer()
  totalTimer.start()

  // 初始化数据库
  await initDatabase()
  const shouldSkipSplit = Boolean(options.splitSubtitle)
  const template = TemplateRegistry.get(options.template || 't1')
  const templateMode = template.mode ?? 'normal'
  const requiresBackgroundVideo = templateMode === 'normal'
  const requiresPipMedia = templateMode === 'pipOnly'
  const sourceMediaUrl: string | undefined = options.video || options.audio

  if (requiresBackgroundVideo && !options.video) {
    throw new Error(`模板 ${template.name} mode=normal，需要 --video`)
  }
  if (!sourceMediaUrl) {
    throw new Error('缺少输入媒体，请传 --video 或 --audio')
  }
  if (requiresPipMedia && (!options.pip || options.pip.length === 0)) {
    throw new Error(`模板 ${template.name} mode=pipOnly，至少需要传一个 --pip 素材`)
  }

  // 创建任务
  const repository = new TaskRepository()
  const task = await repository.create({
    videoUrl: sourceMediaUrl,
    options: {
      skipAsr: options.skipAsr || shouldSkipSplit,
      subtitlePath: options.subtitle,
      splitSubtitlePath: options.splitSubtitle,
      template: options.template,
      title: options.title,
      speaker: options.speaker,
      speakerTitle: options.speakerTitle,
      avatarUrl: options.avatar,
      bgmUrl: options.bgmUrl,
      pip: (() => {
        const urls: string[] | undefined = options.pip
        const tagGroupsStr: string | undefined = options.pipTags
        if (!urls || urls.length === 0) return undefined
        if (!tagGroupsStr) return urls // 无标签，原样传入纯 URL 数组
        const tagGroups = tagGroupsStr.split('||').map((group: string) =>
          group
            .split(/[，,]/)
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        )
        return urls.map((url: string, i: number) => {
          const tags = tagGroups[i]
          return tags && tags.length > 0 ? { url, tags } : url
        })
      })(),
      useAI: options.useAi !== false,
      uploadToOss: options.uploadOss !== false,
      originalText: options.originalText,
    },
  })

  console.log(`任务已创建: ${task.id}\n`)

  // 创建日志记录器
  const logger = new TaskLogger(task.id)

  // 更新状态为处理中
  await repository.updateStatus(task.id, 'processing')

  try {
    // 创建处理器
    const processor = new VideoProcessor(task.id, {
      onProgress: async (progress, step) => {
        await repository.updateProgress(task.id, progress, step)
        console.log(`[${progress}%] ${step}`)
      },
      onLog: async (level, step, message, data) => {
        await logger[level](step, message, data)
        if (level === 'info') {
          console.log(`  ${message}`)
          if (step === 'subtitle-debug' && data) {
            const lines = Array.isArray(data?.lines) ? data.lines : []
            for (const line of lines) {
              console.log(`    [${line.index}] ${line.text} | 动效: ${line.animation} | 音效: ${line.sfx}`)
            }
          }
        } else if (level === 'error') {
          console.error(`  错误: ${message}`)
        }
      },
    })

    // 执行处理
    const outputPath = options.output || path.join(config.paths.output, 'final.mp4')
    const result = await processor.process(sourceMediaUrl, task.options, outputPath)
    let outputUrl: string | undefined

    if (task.options.uploadToOss !== false) {
      console.log('  开始上传结果视频到 OSS')
      const uploader = new OssUploadService(config.oss)
      const uploadResult = await uploader.uploadTaskVideo(task.id, result.outputPath)
      outputUrl = uploadResult.url
      console.log(`  OSS 上传完成: ${outputUrl}`)
    } else {
      console.log('  已跳过 OSS 上传（uploadToOss=false）')
    }

    // 更新任务状态
    await repository.updateStatus(task.id, 'completed', {
      result: { outputPath: result.outputPath, outputUrl, timing: result.timing },
    })

    // 输出统计
    console.log('\n========== 耗时统计 ==========')
    console.log(`总耗时: ${Timer.formatDuration(totalTimer.getTotalDuration())}`)
    if (result.timing.download) console.log(`  下载媒体: ${Timer.formatDuration(result.timing.download)}`)
    if (result.timing.asr) console.log(`  语音识别: ${Timer.formatDuration(result.timing.asr)}`)
    if (result.timing.correct) console.log(`  字幕校正: ${Timer.formatDuration(result.timing.correct)}`)
    if (result.timing.split) console.log(`  智能分句: ${Timer.formatDuration(result.timing.split)}`)
    if (result.timing.pipMatch) console.log(`  画中画AI匹配: ${Timer.formatDuration(result.timing.pipMatch)}`)
    if (result.timing.render) console.log(`  视频渲染: ${Timer.formatDuration(result.timing.render)}`)
    if (result.timing.mix) console.log(`  音频混合: ${Timer.formatDuration(result.timing.mix)}`)
    console.log('==============================\n')
    console.log(`输出文件: ${result.outputPath}`)
    if (outputUrl) {
      console.log(`OSS 地址: ${outputUrl}`)
    }

    // CLI 模式：清理 public 目录中该任务的临时视频文件
    cleanupPublicFiles(task.id)
  } catch (error: any) {
    cleanupPublicFiles(task.id)
    await repository.updateStatus(task.id, 'failed', { errorMessage: error.message })
    await logger.error('cli', `处理失败: ${error.message}`, { stack: error.stack })
    console.error(`\n处理失败: ${error.message}`)
    process.exit(1)
  }
}

/** 清理 public 目录中指定任务的临时视频文件 */
function cleanupPublicFiles(taskId: string) {
  const publicDir = path.join(__dirname, '../public')
  if (!fs.existsSync(publicDir)) return
  for (const file of fs.readdirSync(publicDir)) {
    if (file.startsWith(taskId) && !fs.statSync(path.join(publicDir, file)).isDirectory()) {
      fs.unlinkSync(path.join(publicDir, file))
      console.log(`  已清理 public 临时文件: ${file}`)
    }
  }
}

// 启动程序
program.parse()
