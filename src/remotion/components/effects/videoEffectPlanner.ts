import {
  PipMedia,
  PlannedVideoEffect,
  StyledSubtitle,
  VideoEffectName,
  VideoEffectSequenceItem,
  VideoTemplate,
} from '../../../types'
import {
  calculatePipItems,
  DEFAULT_PIP_ANIMATIONS,
  getGroupStartFrameMap,
  PIP_SAFE_MARGIN_SECONDS,
} from '../pip/pipPlanner'

/** 背景动效安全区间（秒） */
export const VIDEO_EFFECT_SAFE_MARGIN_SECONDS = 2
/** 背景动效持续时间（秒） */
export const VIDEO_EFFECT_DURATION_SECONDS = 3
/** 背景动效与 PIP 之间的间隔（秒） */
const EFFECT_PIP_GAP_SECONDS = 1

/** 时间区间 */
interface TimeRange {
  start: number
  end: number
}

interface GroupStartItem {
  groupId: number
  frame: number
}

/** 排期参数 */
export interface PlanVideoEffectsParams {
  durationInFrames: number
  fps: number
  template?: VideoTemplate
  pipMediaList?: PipMedia[]
  subtitles?: StyledSubtitle[]
}

const VIDEO_EFFECT_NAME_SET = new Set<VideoEffectName>([
  'zoomIn',
  'zoomInSnapDown',
  'snapZoom',
  'snapZoomSmoothDown',
  'blurSnapClear',
  'ellipseMaskZoomOut',
  'rectangleMaskSnapZoom',
  'zoomOut',
  'panLeft',
  'swipeFromRight',
  'panRight',
  'shake',
  'magnifier',
  'spotlight',
  'spotlightPulse',
  'spotlightExtreme',
  'spotlightCenter',
  'rectangleMask',
  'blurGlow',
])

/** 使用固定种子生成伪随机数 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** 检查时间点是否与 PIP 时间区间重叠 */
function isOverlappingWithPip(startFrame: number, durationFrames: number, pipRanges: TimeRange[]): boolean {
  const endFrame = startFrame + durationFrames
  return pipRanges.some(range => !(endFrame <= range.start || startFrame >= range.end))
}

/** 检查两个特效时间区间是否重叠 */
function isOverlappingWithEffects(startFrame: number, durationFrames: number, effectRanges: TimeRange[]): boolean {
  const endFrame = startFrame + durationFrames
  return effectRanges.some(range => !(endFrame <= range.start || startFrame >= range.end))
}

/** 计算 PIP 占用的时间区间 */
function calculatePipTimeRanges(
  pipMediaList: PipMedia[] | undefined,
  durationInFrames: number,
  fps: number,
  noGapMode: boolean,
  subtitles: StyledSubtitle[] | undefined,
  template: VideoTemplate | undefined
): TimeRange[] {
  if (!pipMediaList || pipMediaList.length === 0) return []

  const safeMarginFrames = PIP_SAFE_MARGIN_SECONDS * fps
  const gapFrames = EFFECT_PIP_GAP_SECONDS * fps
  const pipItems = calculatePipItems(
    pipMediaList,
    durationInFrames,
    fps,
    noGapMode,
    template?.pipAnimations ?? DEFAULT_PIP_ANIMATIONS,
    subtitles
  )

  return pipItems
    .map((item) => ({
      start: item.startFrame - gapFrames,
      end: item.startFrame + item.durationFrames + gapFrames,
    }))
    .filter((range) => range.end > safeMarginFrames)
}

function isVideoEffectName(value: unknown): value is VideoEffectName {
  return typeof value === 'string' && VIDEO_EFFECT_NAME_SET.has(value as VideoEffectName)
}

function sanitizeVideoEffectSequence(sequence: VideoTemplate['videoEffectSequence']): VideoEffectSequenceItem[] {
  if (!Array.isArray(sequence)) return []
  return sequence.filter((item): item is VideoEffectSequenceItem => {
    if (!item || typeof item !== 'object') return false
    return isVideoEffectName((item as VideoEffectSequenceItem).effect)
  })
}

function resolveSubtitleGroupId(item: VideoEffectSequenceItem): number | undefined {
  if (Number.isInteger(item.subtitleGroupId) && (item.subtitleGroupId as number) >= 0) {
    return item.subtitleGroupId
  }
  return undefined
}

function resolveStartFrameBySecond(item: VideoEffectSequenceItem, fps: number): number | undefined {
  if (typeof item.startSec !== 'number' || !Number.isFinite(item.startSec) || item.startSec < 0) {
    return undefined
  }
  return Math.floor(item.startSec * fps)
}

function isValidStartFrame(
  frame: number,
  minStartFrame: number,
  latestStart: number,
  effectDurationFrames: number,
  pipRanges: TimeRange[],
  effectRanges: TimeRange[],
  options?: { ignorePip?: boolean; maxEndFrame?: number }
): boolean {
  if (!Number.isFinite(frame)) return false
  if (frame < minStartFrame || frame > latestStart) return false
  if (Number.isFinite(options?.maxEndFrame) && frame + effectDurationFrames > (options?.maxEndFrame as number)) return false
  if (!options?.ignorePip && isOverlappingWithPip(frame, effectDurationFrames, pipRanges)) return false
  if (isOverlappingWithEffects(frame, effectDurationFrames, effectRanges)) return false
  return true
}

function pickDeterministicFrame(candidates: number[], seed: number): number | null {
  if (candidates.length === 0) return null
  const index = Math.floor(seededRandom(seed) * candidates.length)
  return candidates[index]
}

function findValidRandomFrame(
  minStartFrame: number,
  latestStart: number,
  resolveDurationFrames: (startFrame: number) => number | null,
  pipRanges: TimeRange[],
  effectRanges: TimeRange[],
  seed: number,
  options?: { maxEndFrame?: number }
): { frame: number; durationFrames: number } | null {
  if (latestStart < minStartFrame) return null
  const span = Math.max(1, latestStart - minStartFrame)
  for (let attempt = 0; attempt < 10; attempt++) {
    const time = minStartFrame + seededRandom(seed + attempt * 7) * span
    const frame = Math.floor(time)
    const durationFrames = resolveDurationFrames(frame)
    if (durationFrames === null) continue
    if (!isValidStartFrame(frame, minStartFrame, latestStart, durationFrames, pipRanges, effectRanges, { maxEndFrame: options?.maxEndFrame })) continue
    return { frame, durationFrames }
  }
  return null
}

function resolveEndFrameByAfterSubtitle(
  item: VideoEffectSequenceItem,
  orderedGroups: GroupStartItem[],
  durationInFrames: number
): number | undefined {
  if (Number.isInteger(item.endAfterSubtitleGroupId) && (item.endAfterSubtitleGroupId as number) >= 0) {
    const groupId = item.endAfterSubtitleGroupId as number
    const index = orderedGroups.findIndex((group) => group.groupId === groupId)
    if (index >= 0) {
      const nextGroup = orderedGroups[index + 1]
      return nextGroup ? nextGroup.frame : durationInFrames
    }
  }

  if (Number.isInteger(item.endAfterSubtitleScreen) && (item.endAfterSubtitleScreen as number) > 0) {
    const nextGroup = orderedGroups[item.endAfterSubtitleScreen as number]
    return nextGroup ? nextGroup.frame : durationInFrames
  }

  return undefined
}

/** 按显式序列（顺序 + 指定字幕屏）计算背景动效 */
function calculateSequencedEffects(
  durationInFrames: number,
  fps: number,
  sequence: VideoEffectSequenceItem[],
  pipRanges: TimeRange[],
  subtitles: StyledSubtitle[] | undefined
): PlannedVideoEffect[] {
  const safeMarginFrames = VIDEO_EFFECT_SAFE_MARGIN_SECONDS * fps
  const defaultEffectDurationFrames = Math.max(1, Math.floor(VIDEO_EFFECT_DURATION_SECONDS * fps))
  const latestStartSafe = durationInFrames - safeMarginFrames - 1
  const latestStartRaw = durationInFrames - 1
  if (latestStartRaw < 0) return []

  // 注意：这里要拿“完整字幕屏序”做 subtitleScreen 映射，不能先按安全边界裁剪。
  // 否则前几屏会被过滤掉，导致 subtitleScreen N 映射错位。
  const allGroupIdToFrame = getGroupStartFrameMap(subtitles, fps, 0, durationInFrames)
  const orderedGroups: GroupStartItem[] = Array.from(allGroupIdToFrame.entries())
    .map(([groupId, frame]) => ({ groupId, frame }))
    .sort((a, b) => a.frame - b.frame)
  const groupStartFrames = orderedGroups.map((item) => item.frame)

  const effects: PlannedVideoEffect[] = []
  const effectRanges: TimeRange[] = []
  // 序列顺序约束：后一条动效的开始帧，不能早于前一条动效结束帧。
  let nextAvailableFrame = 0

  const resolvePreferredTarget = (item: VideoEffectSequenceItem): { groupId?: number; frame?: number } => {
    const startFrameBySec = resolveStartFrameBySecond(item, fps)
    if (startFrameBySec !== undefined) {
      return { frame: startFrameBySec }
    }

    const explicitGroupId = resolveSubtitleGroupId(item)
    if (explicitGroupId !== undefined) {
      return {
        groupId: explicitGroupId,
        frame: allGroupIdToFrame.get(explicitGroupId),
      }
    }

    if (Number.isInteger(item.subtitleScreen) && (item.subtitleScreen as number) > 0) {
      const target = orderedGroups[(item.subtitleScreen as number) - 1]
      if (target) return { groupId: target.groupId, frame: target.frame }
    }
    return {}
  }

  for (let i = 0; i < sequence.length; i++) {
    const item = sequence[i]
    const preferredTarget = resolvePreferredTarget(item)
    const preferredGroupId = preferredTarget.groupId
    const preferredFrame = preferredTarget.frame
    const hasExplicitStartSec = typeof item.startSec === 'number' && Number.isFinite(item.startSec) && item.startSec >= 0
    const hasExplicitSubtitleGroup = Number.isInteger(item.subtitleGroupId) && (item.subtitleGroupId as number) >= 0
    const hasExplicitSubtitleScreen = Number.isInteger(item.subtitleScreen) && (item.subtitleScreen as number) > 0
    const recoverFrameBySubtitle = resolveEndFrameByAfterSubtitle(item, orderedGroups, durationInFrames)
    const hasExplicitRecoverTarget = recoverFrameBySubtitle !== undefined
    const hasExplicitTarget = hasExplicitStartSec
      || hasExplicitSubtitleGroup
      || hasExplicitSubtitleScreen
      || hasExplicitRecoverTarget
    const maxEndFrame = hasExplicitTarget ? durationInFrames : durationInFrames - safeMarginFrames
    // 手动指定：忽略安全边界；自动/回退：沿用安全边界。
    const currentMinStart = hasExplicitTarget
      ? nextAvailableFrame
      : Math.max(nextAvailableFrame, safeMarginFrames)
    const currentLatestStart = hasExplicitTarget ? latestStartRaw : latestStartSafe
    if (currentLatestStart < currentMinStart || maxEndFrame <= currentMinStart) continue

    const resolveDurationFrames = (startFrame: number): number | null => {
      const maxDuration = maxEndFrame - startFrame
      if (!Number.isFinite(maxDuration) || maxDuration <= 0) return null
      if (recoverFrameBySubtitle !== undefined) {
        const durationBySubtitle = recoverFrameBySubtitle - startFrame
        if (durationBySubtitle <= 0) return null
        return Math.min(maxDuration, durationBySubtitle)
      }
      if (maxDuration < defaultEffectDurationFrames) return null
      return defaultEffectDurationFrames
    }

    let pickedFrame: number | null = null
    let pickedDurationFrames: number | null = null
    const pickIfValid = (frame: number, options?: { ignorePip?: boolean }): boolean => {
      const durationFrames = resolveDurationFrames(frame)
      if (durationFrames === null) return false
      if (!isValidStartFrame(
        frame,
        currentMinStart,
        currentLatestStart,
        durationFrames,
        pipRanges,
        effectRanges,
        { ignorePip: options?.ignorePip, maxEndFrame }
      )) return false
      pickedFrame = frame
      pickedDurationFrames = durationFrames
      return true
    }

    if (preferredFrame !== undefined && pickIfValid(preferredFrame)) {
      // picked by preferred target
    } else if (preferredFrame !== undefined && hasExplicitTarget && pickIfValid(preferredFrame, { ignorePip: true })) {
      // 显式指定屏位时，若仅与 PIP 冲突，优先尊重用户锚点，避免被漂移到视频尾部。
      // picked by preferred target with PIP ignored
    } else {
      const validGroupCandidates = groupStartFrames
        .map((frame) => {
          const durationFrames = resolveDurationFrames(frame)
          if (durationFrames === null) return null
          if (!isValidStartFrame(
            frame,
            currentMinStart,
            currentLatestStart,
            durationFrames,
            pipRanges,
            effectRanges,
            { maxEndFrame }
          )) return null
          return { frame, durationFrames }
        })
        .filter((candidate): candidate is { frame: number; durationFrames: number } => candidate !== null)

      if (validGroupCandidates.length > 0) {
        let pickedCandidate: { frame: number; durationFrames: number } | null = null
        if (preferredFrame !== undefined) {
          pickedCandidate = [...validGroupCandidates].sort((a, b) => {
            return Math.abs(a.frame - preferredFrame) - Math.abs(b.frame - preferredFrame)
          })[0]
        } else {
          const pickedFrameBySeed = pickDeterministicFrame(validGroupCandidates.map((candidate) => candidate.frame), durationInFrames + i * 19)
          if (pickedFrameBySeed !== null) {
            pickedCandidate = validGroupCandidates.find((candidate) => candidate.frame === pickedFrameBySeed) ?? null
          }
        }
        if (pickedCandidate) {
          pickedFrame = pickedCandidate.frame
          pickedDurationFrames = pickedCandidate.durationFrames
        }
      }
    }

    if (pickedFrame === null && preferredFrame !== undefined && hasExplicitTarget) {
      const validIgnoringPip = groupStartFrames
        .map((frame) => {
          const durationFrames = resolveDurationFrames(frame)
          if (durationFrames === null) return null
          if (!isValidStartFrame(
            frame,
            currentMinStart,
            currentLatestStart,
            durationFrames,
            pipRanges,
            effectRanges,
            { ignorePip: true, maxEndFrame }
          )) return null
          return { frame, durationFrames }
        })
        .filter((candidate): candidate is { frame: number; durationFrames: number } => candidate !== null)
      if (validIgnoringPip.length > 0) {
        const pickedCandidate = [...validIgnoringPip].sort((a, b) => {
          return Math.abs(a.frame - preferredFrame) - Math.abs(b.frame - preferredFrame)
        })[0]
        pickedFrame = pickedCandidate.frame
        pickedDurationFrames = pickedCandidate.durationFrames
      }
    }

    if (pickedFrame === null && !hasExplicitTarget) {
      const randomPick = findValidRandomFrame(
        currentMinStart,
        currentLatestStart,
        resolveDurationFrames,
        pipRanges,
        effectRanges,
        durationInFrames + i * 31 + 5,
        { maxEndFrame }
      )
      if (randomPick) {
        pickedFrame = randomPick.frame
        pickedDurationFrames = randomPick.durationFrames
      }
    }

    if (pickedFrame === null || pickedDurationFrames === null) continue

    const resolvedGroupId = orderedGroups.find((group) => group.frame === pickedFrame)?.groupId

    effects.push({
      type: item.effect,
      startFrame: pickedFrame,
      durationFrames: pickedDurationFrames,
      subtitleGroupId: resolvedGroupId ?? preferredGroupId,
      startSfx: typeof item.startSfx === 'string' && item.startSfx.trim()
        ? item.startSfx.trim()
      : undefined,
      endSfx: typeof item.endSfx === 'string' && item.endSfx.trim()
        ? item.endSfx.trim()
        : undefined,
    })
    effectRanges.push({ start: pickedFrame, end: pickedFrame + pickedDurationFrames })
    nextAvailableFrame = pickedFrame + pickedDurationFrames
  }

  return effects
}

/** 计算背景动效排期（仅使用显式序列） */
export function planVideoEffects(params: PlanVideoEffectsParams): PlannedVideoEffect[] {
  const { durationInFrames, fps, template, pipMediaList, subtitles } = params
  const noGapMode = template?.name?.includes('人物画中画') ?? false
  const pipRanges = calculatePipTimeRanges(
    pipMediaList,
    durationInFrames,
    fps,
    noGapMode,
    subtitles,
    template
  )

  const sequence = sanitizeVideoEffectSequence(template?.videoEffectSequence)
  return calculateSequencedEffects(durationInFrames, fps, sequence, pipRanges, subtitles)
}
