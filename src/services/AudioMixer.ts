import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { MixTiming } from '../utils/Timer';

/** 音效触发点 */
export interface SfxTrigger {
  time: number; // 毫秒
  sfxPath: string;
}

export interface MixOptions {
  videoPath: string;
  originalAudio: string;
  bgmPath?: string;
  sfxTriggers?: SfxTrigger[];
  outputPath: string;
}

export interface MixResult {
  outputPath: string;
  timing: MixTiming;
}

export class AudioMixer {
  /** 混合音频到视频 */
  async mix(options: MixOptions): Promise<MixResult> {
    const { videoPath, originalAudio, bgmPath, sfxTriggers, outputPath } = options;
    const timing: MixTiming = {
      buildCommand: 0,
      execute: 0,
      total: 0,
    };
    const totalStart = Date.now();

    // 确保输出目录存在
    const absOutputPath = path.resolve(outputPath);
    const outputDir = path.dirname(absOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const absVideoPath = path.resolve(videoPath);
    const absOriginalAudio = path.resolve(originalAudio);

    // 构建 FFmpeg 命令
    let stepStart = Date.now();
    const cmd = this.buildCommand(
      absVideoPath,
      absOriginalAudio,
      bgmPath ? this.normalizeInputPath(bgmPath) : undefined,
      sfxTriggers,
      absOutputPath
    );
    timing.buildCommand = Date.now() - stepStart;

    // 执行命令
    stepStart = Date.now();
    await new Promise<void>((resolve, reject) => {
      exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    timing.execute = Date.now() - stepStart;

    timing.total = Date.now() - totalStart;

    return { outputPath: absOutputPath, timing };
  }

  /** 构建 FFmpeg 命令 */
  private buildCommand(
    videoPath: string,
    audioPath: string,
    bgmPath?: string,
    sfxTriggers?: SfxTrigger[],
    outputPath?: string
  ): string {
    const inputs = [`-i "${videoPath}"`, `-i "${audioPath}"`];
    let inputIndex = 2;
    let bgmIndex: number | undefined;

    // 添加 BGM 输入
    if (bgmPath) {
      inputs.push(`-i "${bgmPath}"`);
      bgmIndex = inputIndex;
      inputIndex++;
    }

    // 添加音效输入
    const sfxInputs: { index: number; time: number }[] = [];
    if (sfxTriggers && sfxTriggers.length > 0) {
      for (const sfx of sfxTriggers) {
        inputs.push(`-i "${sfx.sfxPath}"`);
        sfxInputs.push({ index: inputIndex, time: sfx.time });
        inputIndex++;
      }
    }

    // 构建滤镜
    const filters = this.buildFilters(bgmIndex, sfxInputs);

    const filterStr = filters.join(';');
    // 优化参数：-c:v copy 直接复制视频流不重新编码，-threads 0 自动使用最优线程数
    return `ffmpeg ${inputs.join(' ')} -filter_complex "${filterStr}" -map 0:v -map "[aout]" -c:v copy -threads 0 -y "${outputPath}"`;
  }

  /** 本地路径转绝对路径；远程 URL 直接透传给 ffmpeg */
  private normalizeInputPath(input: string): string {
    return this.isHttpUrl(input) ? input : path.resolve(input);
  }

  private isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  /** 构建音频滤镜 */
  private buildFilters(bgmIndex?: number, sfxInputs?: { index: number; time: number }[]): string[] {
    const filters: string[] = [];

    // 原声处理
    filters.push('[1:a]volume=1.0[original]');

    // BGM 处理
    const mixInputs = ['[original]'];
    if (bgmIndex !== undefined) {
      filters.push(`[${bgmIndex}:a]volume=0.15,aloop=loop=-1:size=2e9[bgm]`);
      mixInputs.push('[bgm]');
    }

    // 音效处理
    if (sfxInputs && sfxInputs.length > 0) {
      for (let i = 0; i < sfxInputs.length; i++) {
        const sfx = sfxInputs[i];
        const delayMs = sfx.time;
        filters.push(`[${sfx.index}:a]volume=0.5,adelay=${delayMs}|${delayMs}[sfx${i}]`);
        mixInputs.push(`[sfx${i}]`);
      }
    }

    // 混合所有音频
    const mixCount = mixInputs.length;
    filters.push(`${mixInputs.join('')}amix=inputs=${mixCount}:duration=first[aout]`);

    return filters;
  }
}
