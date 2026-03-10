import 'dotenv/config'
import { Worker, Job, UnrecoverableError } from 'bullmq'
import { getRedisConnection, QUEUE_NAME } from './config/redis'
import { initDatabase, closeDatabase } from './database'
import { TaskRepository } from './database/TaskRepository'
import { TaskLogger } from './database/TaskLogger'
import { VideoProcessor } from './services/VideoProcessor'
import { CallbackService } from './services/CallbackService'
import { OssUploadService } from './services/OssUploadService'
import { WorkerRegistry } from './services/WorkerRegistry'
import { config } from './config'
import fs from 'fs'

// 解析 CLI 参数
const args = process.argv.slice(2)
let concurrency = 1
const concurrencyIdx = args.indexOf('--concurrency')
if (concurrencyIdx !== -1 && args[concurrencyIdx + 1]) {
  concurrency = parseInt(args[concurrencyIdx + 1]) || 1
}

// 初始化
const repository = new TaskRepository()
const callbackService = new CallbackService()
const ossUploadService = new OssUploadService(config.oss)
const workerRegistry = new WorkerRegistry()

async function processJob(job: Job<{ taskId: string }>): Promise<void> {
  const { taskId } = job.data
  const task = await repository.findById(taskId)

  if (!task) {
    throw new Error(`任务 ${taskId} 不存在`)
  }

  if (task.status === 'completed') {
    console.log(`[Worker] 任务 ${taskId} 已完成，跳过`)
    return
  }

  if (task.status === 'failed') {
    console.log(`[Worker] 任务 ${taskId} 已失败，跳过`)
    return
  }

  if (task.status === 'processing') {
    console.log(`[Worker] 任务 ${taskId} 状态为 'processing'，按重试任务继续执行`)
  } else if (task.status !== 'pending') {
    console.log(`[Worker] 任务 ${taskId} 状态为 '${task.status}'，跳过`)
    return
  }

  // 标记为处理中
  await repository.updateStatus(taskId, 'processing')

  const logger = new TaskLogger(taskId)
  await logger.info('worker', '开始处理任务', { taskId, workerId: process.pid })

  try {
    const processor = new VideoProcessor(taskId, {
      onProgress: async (progress, step) => {
        await repository.updateProgress(taskId, progress, step)
        await job.updateProgress(progress)
      },
      onLog: async (level, step, message, data) => {
        await logger[level](step, message, data)
      },
      cleanupTemp: true,
      workerRegistry,
    })

    const result = await processor.process(task.videoUrl, task.options)
    const shouldUploadToOss = task.options.uploadToOss !== false
    let outputUrl: string | undefined

    if (shouldUploadToOss) {
      await logger.info('oss', '开始上传结果视频到 OSS', { outputPath: result.outputPath })
      const uploadResult = await ossUploadService.uploadTaskVideo(taskId, result.outputPath)
      outputUrl = uploadResult.url
      await logger.info('oss', '结果视频上传 OSS 完成', { outputUrl })

      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath)
        await logger.info('cleanup', '已删除本地输出文件', { outputPath: result.outputPath })
      }
    } else {
      await logger.info('oss', '已跳过 OSS 上传（uploadToOss=false）')
    }

    await repository.updateStatus(taskId, 'completed', {
      result: { outputPath: result.outputPath, outputUrl, timing: result.timing },
    })

    await logger.info('worker', '任务处理完成')

    if (task.callbackUrl) {
      await callbackService.notify(task.callbackUrl, {
        taskId,
        status: 'completed',
        result: { outputPath: result.outputPath, outputUrl, timing: result.timing },
      }, taskId)
    }
  } catch (error: any) {
    const errMsg = error.message || '未知错误'
    await logger.error('worker', `任务处理失败: ${errMsg}`, { stack: error.stack })

    await repository.updateStatus(taskId, 'failed', { errorMessage: errMsg })

    if (task.callbackUrl) {
      await callbackService.notify(task.callbackUrl, {
        taskId,
        status: 'failed',
        error: errMsg,
      }, taskId)
    }

    // 显式声明为不可恢复错误，防止 BullMQ 进行自动重试（包括历史 attempts>1 的任务）
    throw new UnrecoverableError(errMsg)
  }
}

// 入口：初始化数据库后再启动 Worker
async function main() {
  await initDatabase()
  workerRegistry.start()

  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: getRedisConnection(),
    concurrency,
  })

  worker.on('ready', () => {
    console.log(`[Worker] PID ${process.pid} 已就绪，并发数=${concurrency}`)
  })

  worker.on('completed', (job) => {
    console.log(`[Worker] 任务 ${job.id} 处理完成`)
  })

  worker.on('failed', (job, err) => {
    console.log(`[Worker] 任务 ${job?.id} 处理失败: ${err.message}`)
  })

  // 优雅关闭
  async function shutdown() {
    console.log('\n[Worker] 正在优雅关闭，等待当前任务完成...')
    await worker.close()
    await workerRegistry.stop()
    await closeDatabase()
    console.log('[Worker] 已关闭')
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch(console.error)
