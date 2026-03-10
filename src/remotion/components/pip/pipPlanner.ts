import { PipAnimationType, PipItem, PipMedia, StyledSubtitle } from '../../../types'

/** 画中画安全区间（秒） */
export const PIP_SAFE_MARGIN_SECONDS = 3
/** 画中画显示时长范围（秒） */
const PIP_DURATION_MIN = 5
const PIP_DURATION_MAX = 8
/** 画中画间隔范围（秒） */
const PIP_GAP_MIN = 3

/** 默认的 PIP 动画类型 */
export const DEFAULT_PIP_ANIMATIONS: PipAnimationType[] = ['zoomIn', 'zoomOut', 'panLeft', 'panRight']
/** 仅缩放动画（竖屏素材保护） */
const ZOOM_ONLY_ANIMATIONS: PipAnimationType[] = ['zoomIn', 'zoomOut']
/** 禁用动画（静态展示） */
const NO_PIP_ANIMATIONS: PipAnimationType[] = ['none']
/** 平移类动画 */
const PAN_ANIMATIONS: PipAnimationType[] = ['panLeft', 'panRight', 'panUp', 'panDown']

/** 使用固定种子生成伪随机数 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** 毫秒转帧 */
function msToFrame(ms: number, fps: number): number {
  return Math.floor((ms / 1000) * fps)
}

/**
 * 判断素材是否为竖屏（9:16 或接近竖屏比例）
 * 竖屏素材：高度 > 宽度 * 1.3（即比例接近或超过 9:16）
 */
function isPortraitMedia(media: PipMedia): boolean {
  if (!media.width || !media.height) return false
  return media.height > media.width * 1.3
}

/**
 * 根据素材宽高比过滤可用动画
 * - 9:16 竖屏素材：仅允许缩放，禁止平移
 * - 其他比例素材：允许所有动画
 */
function filterAnimationsForMedia(
  animations: PipAnimationType[],
  media: PipMedia
): PipAnimationType[] {
  if (isPortraitMedia(media)) {
    // 竖屏素材保护：仅保留缩放动画
    const zoomOnly = animations.filter((a) => !PAN_ANIMATIONS.includes(a))
    return zoomOnly.length > 0 ? zoomOnly : NO_PIP_ANIMATIONS
  }
  return animations
}

/** 获取每一屏字幕（group）的首字开始帧映射 */
export function getGroupStartFrameMap(
  subtitles: StyledSubtitle[] | undefined,
  fps: number,
  minFrame: number,
  maxFrame: number
): Map<number, number> {
  const groupIdToFrame = new Map<number, number>()
  if (!subtitles || subtitles.length === 0) return groupIdToFrame

  const groupStartMsMap = new Map<number, number>()
  for (const sub of subtitles) {
    const startMs = Number.isFinite(sub.groupStart) ? sub.groupStart : sub.start
    const prev = groupStartMsMap.get(sub.groupId)
    if (prev === undefined || startMs < prev) {
      groupStartMsMap.set(sub.groupId, startMs)
    }
  }

  groupStartMsMap.forEach((startMs, groupId) => {
    const frame = msToFrame(startMs, fps)
    if (frame >= minFrame && frame <= maxFrame) {
      groupIdToFrame.set(groupId, frame)
    }
  })

  return groupIdToFrame
}

/** 获取每一屏字幕（group）的首字开始帧数组（升序） */
export function getGroupStartFrames(
  subtitles: StyledSubtitle[] | undefined,
  fps: number,
  minFrame: number,
  maxFrame: number
): number[] {
  const groupStartMap = getGroupStartFrameMap(subtitles, fps, minFrame, maxFrame)
  return Array.from(groupStartMap.values()).sort((a, b) => a - b)
}

/** 计算某个素材的显示时长（帧） */
function calculateDurationFramesForMedia(
  media: PipMedia,
  durationInFrames: number,
  fps: number,
  mediaIndex: number
): number {
  const randomDurationSeconds = PIP_DURATION_MIN
    + seededRandom(durationInFrames + mediaIndex * 17) * (PIP_DURATION_MAX - PIP_DURATION_MIN)
  const randomDurationFrames = Math.max(1, Math.floor(randomDurationSeconds * fps))

  // 视频素材优先使用真实时长；仅当过长（>8s）时回落到 5~8s 随机段长。
  const mediaDurationSeconds = media.type === 'video' ? media.durationSec : undefined
  if (typeof mediaDurationSeconds === 'number' && Number.isFinite(mediaDurationSeconds) && mediaDurationSeconds > 0) {
    if (mediaDurationSeconds <= PIP_DURATION_MAX) {
      return Math.max(1, Math.floor(mediaDurationSeconds * fps))
    }
  }

  return randomDurationFrames
}

/** 根据素材和配置挑选动画 */
function pickAnimationForMedia(
  media: PipMedia,
  effectiveAnimations: PipAnimationType[],
  durationInFrames: number,
  mediaIndex: number
): PipAnimationType {
  const allowedAnimations = filterAnimationsForMedia(effectiveAnimations, media)
  const animationPool = allowedAnimations.length > 0 ? allowedAnimations : NO_PIP_ANIMATIONS
  const animationIndex = Math.floor(seededRandom(durationInFrames + mediaIndex * 31) * animationPool.length)
  return animationPool[animationIndex]
}

/** 全时间线拼接：从第 0 帧开始连续排布素材，直到覆盖完整时长 */
function buildFillTimelinePipItems(
  mediaList: PipMedia[],
  durationInFrames: number,
  fps: number,
  effectiveAnimations: PipAnimationType[]
): PipItem[] {
  if (mediaList.length === 0 || durationInFrames <= 0) return []

  const items: PipItem[] = []
  let cursorFrame = 0
  let sequenceIndex = 0

  while (cursorFrame < durationInFrames) {
    const mediaIndex = sequenceIndex % mediaList.length
    const media = mediaList[mediaIndex]
    const suggestedDuration = calculateDurationFramesForMedia(media, durationInFrames, fps, sequenceIndex)
    const durationFrames = Math.min(suggestedDuration, durationInFrames - cursorFrame)

    items.push({
      media,
      startFrame: cursorFrame,
      durationFrames,
      animation: pickAnimationForMedia(media, effectiveAnimations, durationInFrames, sequenceIndex),
    })

    cursorFrame += durationFrames
    sequenceIndex++
  }

  return items
}

/** 计算画中画显示时间点（支持 AI 匹配 + 随机混合模式） */
export function calculatePipItems(
  mediaList: PipMedia[],
  durationInFrames: number,
  fps: number,
  noGapMode: boolean,
  animations?: PipAnimationType[],
  subtitles?: StyledSubtitle[],
  fillTimelineMode = false
): PipItem[] {
  if (mediaList.length === 0) return []

  // undefined => 使用默认动画池；[] => 明确禁用动效（静态展示）
  const effectiveAnimations = Array.isArray(animations) ? animations : DEFAULT_PIP_ANIMATIONS
  if (fillTimelineMode) {
    return buildFillTimelinePipItems(mediaList, durationInFrames, fps, effectiveAnimations)
  }

  const safeMarginFrames = PIP_SAFE_MARGIN_SECONDS * fps
  const latestStart = durationInFrames - safeMarginFrames
  const groupStartFrames = getGroupStartFrames(subtitles, fps, safeMarginFrames, latestStart)

  if (groupStartFrames.length === 0) return []

  const items: PipItem[] = []
  const gapFrames = noGapMode ? 0 : Math.floor(PIP_GAP_MIN * fps)

  /** 检查候选位置是否与已放置的项冲突 */
  const isConflict = (startFrame: number, durationFrames: number): boolean => {
    return items.some((item) => {
      const candidateStart = startFrame - gapFrames
      const candidateEnd = startFrame + durationFrames + gapFrames
      const itemStart = item.startFrame
      const itemEnd = item.startFrame + item.durationFrames
      return !(candidateEnd <= itemStart || candidateStart >= itemEnd)
    })
  }

  // 构建 groupId → startFrame 的映射（用于 AI 匹配定位）
  const groupIdToFrame = getGroupStartFrameMap(subtitles, fps, safeMarginFrames, latestStart)

  // === 第一轮：优先放置有 targetGroupId 的素材（AI 匹配） ===
  const aiMatchedIndices = new Set<number>()
  for (let i = 0; i < mediaList.length; i++) {
    const media = mediaList[i]
    if (media.targetGroupId === undefined) continue

    const targetFrame = groupIdToFrame.get(media.targetGroupId)
    if (targetFrame === undefined) continue

    const durationFrames = calculateDurationFramesForMedia(media, durationInFrames, fps, i)
    const latestAllowedStart = durationInFrames - safeMarginFrames - durationFrames
    if (targetFrame > latestAllowedStart) continue

    // 检查是否与已放置项冲突
    if (isConflict(targetFrame, durationFrames)) continue

    items.push({
      media,
      startFrame: targetFrame,
      durationFrames,
      animation: pickAnimationForMedia(media, effectiveAnimations, durationInFrames, i),
    })
    aiMatchedIndices.add(i)
  }

  // === 第二轮：随机放置无 targetGroupId 的素材 ===
  for (let mediaIndex = 0; mediaIndex < mediaList.length; mediaIndex++) {
    if (aiMatchedIndices.has(mediaIndex)) continue

    const media = mediaList[mediaIndex]
    const durationFrames = calculateDurationFramesForMedia(media, durationInFrames, fps, mediaIndex)
    const latestAllowedStart = durationInFrames - safeMarginFrames - durationFrames

    const candidates = groupStartFrames.filter((startFrame) => {
      if (startFrame > latestAllowedStart) return false
      return !isConflict(startFrame, durationFrames)
    })

    if (candidates.length === 0) break

    const pickIndex = Math.floor(seededRandom(durationInFrames + mediaIndex * 101) * candidates.length)
    const startFrame = candidates[pickIndex]

    items.push({
      media,
      startFrame,
      durationFrames,
      animation: pickAnimationForMedia(media, effectiveAnimations, durationInFrames, mediaIndex),
    })
  }

  return items.sort((a, b) => a.startFrame - b.startFrame)
}
