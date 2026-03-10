/** 时间统计工具 */
export class Timer {
  private startTime: number = 0;
  private steps: Map<string, { start: number; end?: number }> = new Map();

  /** 开始计时 */
  start(): void {
    this.startTime = Date.now();
  }

  /** 开始一个步骤 */
  startStep(name: string): void {
    this.steps.set(name, { start: Date.now() });
  }

  /** 结束一个步骤 */
  endStep(name: string): number {
    const step = this.steps.get(name);
    if (step) {
      step.end = Date.now();
      return step.end - step.start;
    }
    return 0;
  }

  /** 获取步骤耗时（毫秒） */
  getStepDuration(name: string): number {
    const step = this.steps.get(name);
    if (step && step.end) {
      return step.end - step.start;
    }
    return 0;
  }

  /** 获取总耗时（毫秒） */
  getTotalDuration(): number {
    return Date.now() - this.startTime;
  }

  /** 格式化时间显示 */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(2);
    return `${minutes}m ${remainingSeconds}s`;
  }

  /** 打印步骤耗时 */
  printStep(name: string, indent: string = '  '): void {
    const duration = this.getStepDuration(name);
    console.log(`${indent}${name}: ${Timer.formatDuration(duration)}`);
  }

  /** 打印所有步骤 */
  printAllSteps(indent: string = '  '): void {
    for (const [name] of this.steps) {
      this.printStep(name, indent);
    }
  }
}

/** 渲染步骤时间统计 */
export interface RenderTiming {
  prepare: number;
  bundle: number;
  getVideoInfo: number;
  selectComposition: number;
  renderMedia: number;
  total: number;
}

/** 音频混合时间统计 */
export interface MixTiming {
  buildCommand: number;
  execute: number;
  total: number;
}
