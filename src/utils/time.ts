/** 毫秒转帧数 */
export function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

/** 帧数转毫秒 */
export function frameToMs(frame: number, fps: number): number {
  return Math.round((frame / fps) * 1000);
}

/** 格式化时间为 ASS 格式 (H:MM:SS.cc) */
export function formatAssTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
