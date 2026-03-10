import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { StyledSubtitle, StaticInfo, VideoTemplate, PipMedia, PlannedVideoEffect } from '../types';
import { RenderTiming } from '../utils/Timer';
import { config } from '../config';
import { WorkerRegistry } from './WorkerRegistry';

export interface PrepareOptions {
  /** 输入媒体文件（可为视频或音频） */
  inputMedia: string;
  /** 是否将输入媒体作为背景视频拷贝到 public，默认 true */
  hasBackgroundVideo?: boolean;
  taskId?: string;
}

export interface PrepareResult {
  bundleUrl: string;
  videoInfo: { width: number; height: number; duration: number; fps: number };
  videoFileName: string;
  publicDir: string;
  timing: { bundle: number; getVideoInfo: number; copyFiles: number };
}

export interface RenderOptions {
  subtitles: StyledSubtitle[];
  staticInfo?: StaticInfo;
  /** 输入媒体文件（可为视频或音频） */
  inputMedia?: string;
  /** 是否启用背景视频模式，默认 true */
  hasBackgroundVideo?: boolean;
  outputPath: string;
  template: VideoTemplate;
  pipMediaList?: PipMedia[];
  plannedVideoEffects?: PlannedVideoEffect[];
  prepareResult?: PrepareResult;
}

export interface RenderResult {
  outputPath: string;
  timing: RenderTiming;
}

interface MediaInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
}

export class VideoRenderer {
  private bundled: string | null = null;
  private workerRegistry?: WorkerRegistry;

  constructor(workerRegistry?: WorkerRegistry) {
    this.workerRegistry = workerRegistry;
  }

  /** 预准备：打包 + 获取时长信息 +（可选）复制背景视频文件（不依赖字幕） */
  async prepare(options: PrepareOptions): Promise<PrepareResult> {
    const { inputMedia, hasBackgroundVideo = true, taskId } = options;
    const timing = { bundle: 0, getVideoInfo: 0, copyFiles: 0 };

    const publicDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    let videoFileName = '';

    // 仅在“有背景视频”模式下复制源文件到 public 目录
    if (hasBackgroundVideo) {
      const copyStart = Date.now();
      videoFileName = taskId
        ? `${taskId}_${path.basename(inputMedia)}`
        : path.basename(inputMedia);
      fs.copyFileSync(inputMedia, path.join(publicDir, videoFileName));
      timing.copyFiles = Date.now() - copyStart;
    }

    // 并行执行 bundle 和 getVideoInfo
    const parallelStart = Date.now();
    const [bundleUrl, videoInfo] = await Promise.all([
      (async () => {
        if (!this.bundled) {
          const bundled = await this.bundleProject(publicDir);
          this.bundled = bundled;
        }
        return this.bundled;
      })(),
      this.getVideoInfo(inputMedia),
    ]);
    timing.bundle = Date.now() - parallelStart;
    timing.getVideoInfo = Date.now() - parallelStart;

    return { bundleUrl, videoInfo, videoFileName, publicDir, timing };
  }

  /** 渲染视频 */
  async render(options: RenderOptions): Promise<RenderResult> {
    const {
      subtitles,
      staticInfo,
      inputMedia,
      hasBackgroundVideo = true,
      outputPath,
      template,
      pipMediaList,
      plannedVideoEffects,
      prepareResult,
    } = options;
    const timing: RenderTiming = {
      prepare: 0,
      bundle: 0,
      getVideoInfo: 0,
      selectComposition: 0,
      renderMedia: 0,
      total: 0,
    };
    const totalStart = Date.now();
    const pipOnlyMode = template.mode === 'pipOnly';

    let bundleUrl: string;
    let videoInfo: MediaInfo;
    let videoFileName: string;

    if (prepareResult) {
      // 使用预准备结果，跳过已完成的步骤
      bundleUrl = prepareResult.bundleUrl;
      videoInfo = prepareResult.videoInfo;
      videoFileName = prepareResult.videoFileName;
      this.bundled = bundleUrl;
      timing.prepare = prepareResult.timing.bundle;
      timing.bundle = prepareResult.timing.bundle;
      timing.getVideoInfo = prepareResult.timing.getVideoInfo;
    } else {
      // 未预准备，执行完整流程（向后兼容）
      if (!inputMedia) {
        throw new Error('缺少 inputMedia，无法进行渲染预准备');
      }
      const prepared = await this.prepare({ inputMedia, hasBackgroundVideo });
      bundleUrl = prepared.bundleUrl;
      videoInfo = prepared.videoInfo;
      videoFileName = prepared.videoFileName;
      timing.prepare = prepared.timing.bundle;
      timing.bundle = prepared.timing.bundle;
      timing.getVideoInfo = prepared.timing.getVideoInfo;
    }

    // 3. 选择合成
    let stepStart = Date.now();
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: 'VideoComposition',
      inputProps: {
        subtitles,
        staticInfo,
        videoSrc: hasBackgroundVideo ? videoFileName : '',
        pipOnlyMode,
        template,
        pipMediaList,
        plannedVideoEffects,
      },
    });

    // 使用配置的视频尺寸输出，保持原视频帧率避免抖动
    const isPortrait = videoInfo.height > videoInfo.width;
    composition.width = isPortrait ? config.video.width : config.video.height;
    composition.height = isPortrait ? config.video.height : config.video.width;
    const safeFps = Number.isFinite(videoInfo.fps) && videoInfo.fps > 0 ? videoInfo.fps : config.video.fps;
    const safeDurationInFrames = Math.max(1, Math.ceil(Math.max(0, videoInfo.duration) * safeFps));
    composition.fps = safeFps;
    composition.durationInFrames = safeDurationInFrames;
    timing.selectComposition = Date.now() - stepStart;

    // 4. 渲染
    stepStart = Date.now();
    const concurrency = this.workerRegistry
      ? await this.workerRegistry.getRenderConcurrency()
      : Math.max(4, Math.min(16, Math.floor(os.cpus().length * 0.8)));
    await renderMedia({
      composition,
      serveUrl: bundleUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        subtitles,
        staticInfo,
        videoSrc: hasBackgroundVideo ? videoFileName : '',
        pipOnlyMode,
        template,
        pipMediaList,
        plannedVideoEffects,
      },
      // 远程/大体积素材首帧解码可能较慢，放宽超时避免误判失败
      timeoutInMilliseconds: 180000,
      concurrency,
      // 性能优化参数
      chromiumOptions: {
        disableWebSecurity: true,
        gl: 'angle', // 使用 ANGLE 进行 GPU 加速
      },
      // 使用更快的编码预设，veryfast 比 ultrafast 压缩率更好
      x264Preset: 'veryfast',
      // 控制质量和文件大小，值越大文件越小（18-28 常用范围）
      crf: 23,
    });
    timing.renderMedia = Date.now() - stepStart;

    timing.total = Date.now() - totalStart;

    return { outputPath, timing };
  }

  /** 打包 Remotion 项目 */
  private async bundleProject(publicDir: string): Promise<string> {
    const entryPoint = path.join(__dirname, '../remotion/index.ts');
    return await bundle({ entryPoint, publicDir });
  }

  /** 获取视频信息 */
  private async getVideoInfo(videoPath: string): Promise<MediaInfo> {
    const ffmpeg = await import('fluent-ffmpeg');

    return new Promise((resolve, reject) => {
      ffmpeg.default.ffprobe(videoPath, (err, data) => {
        if (err) return reject(err);

        const video = data.streams.find((s) => s.codec_type === 'video');
        const parseRate = (value?: string): number | null => {
          if (!value) return null;
          const [numRaw, denRaw] = value.split('/');
          const num = Number(numRaw);
          const den = denRaw === undefined ? 1 : Number(denRaw);
          if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
          const parsed = num / den;
          return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        };
        const fps = parseRate(video?.r_frame_rate) ?? parseRate(video?.avg_frame_rate) ?? config.video.fps;
        const streamDurations = data.streams
          .map((stream) => Number(stream.duration))
          .filter((duration) => Number.isFinite(duration) && duration > 0);
        const durationCandidates = [Number(data.format.duration), ...streamDurations]
          .filter((duration) => Number.isFinite(duration) && duration > 0);
        const duration = durationCandidates.length > 0 ? Math.max(...durationCandidates) : 0;

        resolve({
          width: video?.width || config.video.width,
          height: video?.height || config.video.height,
          duration,
          fps,
        });
      });
    });
  }
}
