import fs from "fs";
import path from "path";
import { config } from "../config";
import {
  PlannedVideoEffect,
  SfxSequenceItem,
  StyledSubtitle,
  SubtitleAnimationSequenceItem,
  SubtitleAnimationSfxMap
} from "../types";
import { frameToMs } from "../utils/time";
import { VIDEO_EFFECT_DURATION_SECONDS } from "../remotion/components/effects/videoEffectPlanner";
import { SfxTrigger } from "./AudioMixer";

/** 不同来源音效冲突避让间隔（毫秒） */
const SOURCE_PRIORITY_MIN_GAP_MS = 800;

function clampFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 0;
  return Math.max(0, Math.floor(frame));
}

function frameByProgress(startFrame: number, durationFrames: number, progress: number): number {
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  return clampFrame(startFrame + Math.round(durationFrames * normalizedProgress));
}

/**
 * endSfx 触发点统一对齐到“动效回收点”：
 * - 提前回收：按组件内部关键进度点（例如 snap/clear）
 * - 带额外蒙版窗口：按蒙版完全结束
 * - 其他默认：动效尾帧
 */
function resolveEffectRecoveryFrame(effect: PlannedVideoEffect, effectDurationFrames: number, fps: number): number {
  const oneSecondFrames = Math.max(1, Math.round(fps));
  switch (effect.type) {
    case "zoomInSnapDown":
      // TransformEffects.tsx: snapPoint = 0.64
      return frameByProgress(effect.startFrame, effectDurationFrames, 0.64);
    case "snapZoom":
      // TransformEffects.tsx: snapBackAt = 0.9
      return frameByProgress(effect.startFrame, effectDurationFrames, 0.9);
    case "blurSnapClear":
      // TransformEffects.tsx: settleEnd = 0.46（到此已回到清晰）
      return frameByProgress(effect.startFrame, effectDurationFrames, 0.46);
    case "swipeFromRight":
      // TransformEffects.tsx: swipeEnd = 0.06（到此已完成从右向左刷入）
      return frameByProgress(effect.startFrame, effectDurationFrames, 0.06);
    case "rectangleMaskSnapZoom":
      // TransformEffects.tsx: maskWindowFrames = fps * 1
      return clampFrame(effect.startFrame + oneSecondFrames);
    case "ellipseMaskZoomOut":
      // TransformEffects.tsx: maskEndFrame = start + duration + fps
      return clampFrame(effect.startFrame + effectDurationFrames + oneSecondFrames);
    default:
      return clampFrame(effect.startFrame + effectDurationFrames);
  }
}

interface GenerateSfxTriggerOptions {
  plannedVideoEffects?: PlannedVideoEffect[];
  sfxSequence?: SfxSequenceItem[];
  subtitleAnimationSequence?: SubtitleAnimationSequenceItem[];
  subtitleAnimationSfxMap?: SubtitleAnimationSfxMap;
  fps?: number;
}

interface SfxMapItem {
  name: string;
  file: string;
  role?: "ding" | "fx" | string;
}

interface ResolvedSfxItem extends SfxMapItem {
  sfxPath: string;
}

interface SubtitleScreenAnchor {
  groupId: number;
  startMs: number;
}

interface SubtitleAnimationAnchor {
  groupId: number;
  startMs: number;
  animationIn: StyledSubtitle["animationIn"];
}

type SubtitleAnimationSequenceAnchorItem = Pick<
  SubtitleAnimationSequenceItem,
  "startSec" | "subtitleGroupId" | "subtitleScreen" | "subtitleLine" | "subtitlePosition"
>;

interface PriorityAnchor {
  time: number;
}

interface SfxPlanResult {
  triggers: SfxTrigger[];
  blockers: number[];
}

interface PickedSfxCandidate {
  value?: string;
  isNone: boolean;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isNoneSfx(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "none";
}

function resolveConfiguredSfx(sfxDir: string): ResolvedSfxItem[] {
  if (!fs.existsSync(sfxDir)) return [];
  const source = Array.isArray(config.sfx) ? config.sfx : [];

  const seenNames = new Set<string>();
  const resolved: ResolvedSfxItem[] = [];

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const file = typeof item.file === "string" ? item.file.trim() : "";
    if (!name || !file) continue;
    if (seenNames.has(name.toLowerCase())) continue;

    const sfxPath = path.join(sfxDir, file);
    if (!fs.existsSync(sfxPath)) continue;

    seenNames.add(name.toLowerCase());
    resolved.push({
      name,
      file,
      role: item.role,
      sfxPath
    });
  }

  return resolved;
}

function resolveSfxPath(
  rawValue: string,
  sfxDir: string,
  sfxFiles: string[],
  configuredSfx: ResolvedSfxItem[]
): string | undefined {
  const value = rawValue.trim();
  if (!value) return undefined;

  if (isHttpUrl(value)) return value;

  if (path.isAbsolute(value)) {
    return fs.existsSync(value) ? value : undefined;
  }

  const directPath = path.join(sfxDir, value);
  if (fs.existsSync(directPath)) return directPath;

  const normalized = value.toLowerCase();
  const mapped =
    configuredSfx.find((item) => item.name.toLowerCase() === normalized) ??
    configuredSfx.find((item) => item.file.toLowerCase() === normalized) ??
    configuredSfx.find((item) => path.parse(item.file).name.toLowerCase() === normalized) ??
    configuredSfx.find((item) => item.name.toLowerCase().includes(normalized));

  if (mapped) return mapped.sfxPath;

  if (sfxFiles.length === 0) return undefined;
  const matchedFile =
    sfxFiles.find((file) => file.toLowerCase() === normalized) ??
    sfxFiles.find((file) => path.parse(file).name.toLowerCase() === normalized) ??
    sfxFiles.find((file) => file.toLowerCase().includes(normalized));

  if (!matchedFile) return undefined;
  return path.join(sfxDir, matchedFile);
}

function buildSubtitleScreenAnchors(subtitles: StyledSubtitle[]): SubtitleScreenAnchor[] {
  const groupStartMap = new Map<number, number>();

  for (const sub of subtitles) {
    const anchor = Number.isFinite(sub.groupStart) ? sub.groupStart : sub.start;
    const prev = groupStartMap.get(sub.groupId);
    if (prev === undefined || anchor < prev) {
      groupStartMap.set(sub.groupId, anchor);
    }
  }

  return Array.from(groupStartMap.entries())
    .map(([groupId, startMs]) => ({ groupId, startMs }))
    .sort((a, b) => a.startMs - b.startMs);
}

function buildSubtitleLineKey(groupId: number, position: number): string {
  return `${groupId}:${position}`;
}

function buildGroupLineCountMap(subtitles: StyledSubtitle[]): Map<number, number> {
  const groupLineCountMap = new Map<number, number>();
  for (const subtitle of subtitles) {
    const nextCount = Math.max(groupLineCountMap.get(subtitle.groupId) ?? 0, subtitle.position + 1);
    groupLineCountMap.set(subtitle.groupId, nextCount);
  }
  return groupLineCountMap;
}

function buildLineStartMap(subtitles: StyledSubtitle[]): Map<string, number> {
  const lineStartMap = new Map<string, number>();
  for (const subtitle of subtitles) {
    const key = buildSubtitleLineKey(subtitle.groupId, subtitle.position);
    const anchor = Number.isFinite(subtitle.start) ? subtitle.start : subtitle.groupStart;
    const clampedAnchor = Math.max(0, Math.floor(anchor));
    const prev = lineStartMap.get(key);
    if (prev === undefined || clampedAnchor < prev) {
      lineStartMap.set(key, clampedAnchor);
    }
  }
  return lineStartMap;
}

function normalizeSubtitleLinePosition(
  item: Pick<SubtitleAnimationSequenceItem, "subtitleLine" | "subtitlePosition">
): number | undefined {
  if (Number.isInteger(item.subtitlePosition) && (item.subtitlePosition as number) >= 0) {
    return item.subtitlePosition as number;
  }
  if (Number.isInteger(item.subtitleLine) && (item.subtitleLine as number) > 0) {
    return (item.subtitleLine as number) - 1;
  }
  return undefined;
}

function resolveSubtitleAnimationTargetGroupId(
  item: SubtitleAnimationSequenceAnchorItem,
  orderedAnchors: SubtitleScreenAnchor[],
  groupStartMap: Map<number, number>
): number | undefined {
  if (typeof item.startSec === "number" && Number.isFinite(item.startSec) && item.startSec >= 0) {
    const targetMs = Math.floor(item.startSec * 1000);
    return orderedAnchors.find((anchor) => anchor.startMs >= targetMs)?.groupId;
  }

  if (Number.isInteger(item.subtitleGroupId) && (item.subtitleGroupId as number) >= 0) {
    const groupId = item.subtitleGroupId as number;
    return groupStartMap.has(groupId) ? groupId : undefined;
  }

  if (Number.isInteger(item.subtitleScreen) && (item.subtitleScreen as number) > 0) {
    return orderedAnchors[(item.subtitleScreen as number) - 1]?.groupId;
  }

  return undefined;
}

function buildSubtitleAnimationAnchors(subtitles: StyledSubtitle[]): SubtitleAnimationAnchor[] {
  const orderedAnchors = buildSubtitleScreenAnchors(subtitles);
  const groupedSubtitles = new Map<number, StyledSubtitle[]>();

  for (const subtitle of subtitles) {
    const prev = groupedSubtitles.get(subtitle.groupId);
    if (prev) {
      prev.push(subtitle);
    } else {
      groupedSubtitles.set(subtitle.groupId, [subtitle]);
    }
  }

  return orderedAnchors.map((anchor) => {
    const groupLines = (groupedSubtitles.get(anchor.groupId) ?? []).slice().sort((a, b) => {
      return a.position - b.position || a.start - b.start;
    });
    const emphasizedLine = groupLines.find((item) => item.styleType !== "default");
    const animatedLine = groupLines.find((item) => item.animationIn !== "none");
    const representativeLine = emphasizedLine ?? animatedLine ?? groupLines[0];

    return {
      groupId: anchor.groupId,
      startMs: Math.max(0, anchor.startMs),
      animationIn: representativeLine?.animationIn ?? "none"
    };
  });
}

function resolveAnchoredTime(
  item: Pick<SfxSequenceItem, "startSec" | "subtitleGroupId" | "subtitleScreen">,
  orderedAnchors: SubtitleScreenAnchor[],
  groupStartMap: Map<number, number>
): number | undefined {
  if (typeof item.startSec === "number" && Number.isFinite(item.startSec) && item.startSec >= 0) {
    return Math.floor(item.startSec * 1000);
  }

  if (Number.isInteger(item.subtitleGroupId) && (item.subtitleGroupId as number) >= 0) {
    return groupStartMap.get(item.subtitleGroupId as number);
  }

  if (Number.isInteger(item.subtitleScreen) && (item.subtitleScreen as number) > 0) {
    const target = orderedAnchors[(item.subtitleScreen as number) - 1];
    return target?.startMs;
  }

  return undefined;
}

function buildTimelineSfxPlan(
  sfxSequence: SfxSequenceItem[] | undefined,
  subtitles: StyledSubtitle[],
  sfxDir: string,
  sfxFiles: string[],
  configuredSfx: ResolvedSfxItem[]
): SfxPlanResult {
  if (!Array.isArray(sfxSequence) || sfxSequence.length === 0) {
    return { triggers: [], blockers: [] };
  }

  const orderedAnchors = buildSubtitleScreenAnchors(subtitles);
  const groupStartMap = new Map<number, number>(orderedAnchors.map((item) => [item.groupId, item.startMs]));
  const triggers: SfxTrigger[] = [];
  const blockers: number[] = [];

  for (const item of sfxSequence) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.sfx !== "string" || item.sfx.trim().length === 0) continue;

    const time = resolveAnchoredTime(item, orderedAnchors, groupStartMap);
    if (time === undefined) continue;

    const clampedTime = Math.max(0, time);
    if (isNoneSfx(item.sfx)) {
      blockers.push(clampedTime);
      continue;
    }

    const sfxPath = resolveSfxPath(item.sfx, sfxDir, sfxFiles, configuredSfx);
    if (!sfxPath) continue;

    triggers.push({
      time: clampedTime,
      sfxPath
    });
  }

  return {
    triggers: triggers.sort((a, b) => a.time - b.time),
    blockers: blockers.sort((a, b) => a - b)
  };
}

function pickRandomSfxCandidate(raw: string | string[] | undefined): PickedSfxCandidate {
  if (typeof raw === "string") {
    const value = raw.trim();
    if (value.length === 0) return { isNone: false };
    return isNoneSfx(value) ? { isNone: true } : { value, isNone: false };
  }

  if (!Array.isArray(raw) || raw.length === 0) return { isNone: false };
  const candidates = raw
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());

  if (candidates.length === 0) return { isNone: false };
  const index = Math.floor(Math.random() * candidates.length);
  const picked = candidates[index];
  return isNoneSfx(picked) ? { isNone: true } : { value: picked, isNone: false };
}

function buildSubtitleAnimationSfxPlan(
  subtitleAnimationSequence: SubtitleAnimationSequenceItem[] | undefined,
  subtitles: StyledSubtitle[],
  sfxDir: string,
  sfxFiles: string[],
  configuredSfx: ResolvedSfxItem[]
): SfxPlanResult {
  if (!Array.isArray(subtitleAnimationSequence) || subtitleAnimationSequence.length === 0) {
    return { triggers: [], blockers: [] };
  }

  // Build ordered anchors for unique groups (each group has one sound effect)
  const orderedAnchors = buildSubtitleScreenAnchors(subtitles);
  const groupStartMap = new Map<number, number>(orderedAnchors.map((item) => [item.groupId, item.startMs]));

  const triggers: SfxTrigger[] = [];
  const blockers: number[] = [];

  // Build a lookup map from the sequence for efficient matching
  const sequenceLength = subtitleAnimationSequence.length;
  const sequenceMap = new Map<number, SubtitleAnimationSequenceItem>();
  for (const item of subtitleAnimationSequence) {
    if (item && typeof item === "object" && item.subtitleScreen) {
      sequenceMap.set(item.subtitleScreen, item);
    }
  }

  // Iterate through all unique groups in sequential order
  // subtitleScreen is 1-indexed sequential group number (each group has one sound)
  // The sequence loops cyclically: groups 1-15 use entries 1-15, groups 16-30 loop back to entries 1-15, etc.
  for (let i = 0; i < orderedAnchors.length; i++) {
    const anchor = orderedAnchors[i];
    const screenNumber = i + 1; // 1-based sequential group number
    // Loop the sequence cyclically using modulo: screen 16 -> entry 1, screen 17 -> entry 2, etc.
    const sequenceIndex = ((screenNumber - 1) % sequenceLength) + 1;
    const item = sequenceMap.get(sequenceIndex);

    if (!item) continue;

    const pickedSfx = pickRandomSfxCandidate(item.startSfx);
    if (!pickedSfx.isNone && !pickedSfx.value) continue;

    const time = groupStartMap.get(anchor.groupId);
    if (time === undefined) continue;

    const clampedTime = Math.max(0, time);
    if (pickedSfx.isNone) {
      // Create a blocker for explicit "none" to prevent default ding from being applied
      // This ensures groups with startSfx: "none" don't get any sound effect
      blockers.push(clampedTime);
      continue;
    }

    const sfxPath = resolveSfxPath(pickedSfx.value as string, sfxDir, sfxFiles, configuredSfx);
    if (!sfxPath) continue;

    triggers.push({
      time: clampedTime,
      sfxPath
    });
  }

  return {
    triggers: triggers.sort((a, b) => a.time - b.time),
    blockers: blockers.sort((a, b) => a - b)
  };
}

function buildEffectSfxPlan(
  plannedVideoEffects: PlannedVideoEffect[] | undefined,
  fps: number | undefined,
  sfxDir: string,
  sfxFiles: string[],
  configuredSfx: ResolvedSfxItem[]
): SfxPlanResult {
  if (!Array.isArray(plannedVideoEffects) || plannedVideoEffects.length === 0) {
    return { triggers: [], blockers: [] };
  }
  if (!fps || !Number.isFinite(fps) || fps <= 0) {
    return { triggers: [], blockers: [] };
  }

  const defaultEffectDurationFrames = Math.max(1, Math.floor(VIDEO_EFFECT_DURATION_SECONDS * fps));
  const triggers: SfxTrigger[] = [];
  const blockers: number[] = [];

  const appendResolvedTrigger = (rawValue: string | undefined, frame: number): void => {
    if (!rawValue) return;
    const time = Math.max(0, frameToMs(frame, fps));
    if (isNoneSfx(rawValue)) {
      // Don't create blockers for "none" - it only means "no sound for this effect", not "block all sounds"
      // Blockers should only be created for explicit timeline sfx (sfxSequence) to avoid suppressing other sound sources
      return;
    }
    const resolvedPath = resolveSfxPath(rawValue, sfxDir, sfxFiles, configuredSfx);
    if (!resolvedPath) return;
    triggers.push({
      time,
      sfxPath: resolvedPath
    });
  };

  for (const effect of plannedVideoEffects) {
    const effectDurationFrames = Math.max(1, Math.floor(effect.durationFrames ?? defaultEffectDurationFrames));
    appendResolvedTrigger(effect.startSfx, effect.startFrame);
    appendResolvedTrigger(effect.endSfx, resolveEffectRecoveryFrame(effect, effectDurationFrames, fps));
  }
  return {
    triggers: triggers.sort((a, b) => a.time - b.time),
    blockers: blockers.sort((a, b) => a - b)
  };
}

function resolveDefaultDingSfxPath(
  sfxDir: string,
  sfxFiles: string[],
  configuredSfx: ResolvedSfxItem[]
): string | undefined {
  const dingItem =
    configuredSfx.find((item) => item.role === "ding") ??
    configuredSfx.find((item) => /ding|叮|成功/i.test(item.name)) ??
    configuredSfx.find((item) => /ding|叮|成功/i.test(item.file));
  if (dingItem) return dingItem.sfxPath;

  const dingFile = sfxFiles.find((file) => /ding|叮|成功/i.test(file));
  if (!dingFile) return undefined;
  return path.join(sfxDir, dingFile);
}

function buildTemplateSubtitleAnimationSfxPlan(
  subtitleAnimationSfxMap: SubtitleAnimationSfxMap | undefined,
  subtitles: StyledSubtitle[],
  sfxDir: string,
  sfxFiles: string[],
  configuredSfx: ResolvedSfxItem[]
): SfxPlanResult {
  if (!subtitleAnimationSfxMap || typeof subtitleAnimationSfxMap !== "object") {
    return { triggers: [], blockers: [] };
  }

  const animationAnchors = buildSubtitleAnimationAnchors(subtitles);
  const triggers: SfxTrigger[] = [];
  const blockers: number[] = [];

  for (const anchor of animationAnchors) {
    const pool = subtitleAnimationSfxMap[anchor.animationIn];
    const pickedSfx = pickRandomSfxCandidate(pool);
    if (!pickedSfx.isNone && !pickedSfx.value) continue;

    if (pickedSfx.isNone) {
      blockers.push(anchor.startMs);
      continue;
    }

    const sfxPath = resolveSfxPath(pickedSfx.value as string, sfxDir, sfxFiles, configuredSfx);
    if (!sfxPath) continue;

    triggers.push({
      time: anchor.startMs,
      sfxPath
    });
  }

  return {
    triggers: triggers.sort((a, b) => a.time - b.time),
    blockers: blockers.sort((a, b) => a - b)
  };
}

function buildDefaultSubtitleSfxPlan(subtitles: StyledSubtitle[], defaultSfxPath: string | undefined): SfxPlanResult {
  if (!defaultSfxPath) {
    return { triggers: [], blockers: [] };
  }

  const triggers: SfxTrigger[] = [];
  const animationAnchors = buildSubtitleAnimationAnchors(subtitles);

  for (const anchor of animationAnchors) {
    if (anchor.animationIn === "none") continue;
    triggers.push({
      time: anchor.startMs,
      sfxPath: defaultSfxPath
    });
  }

  return {
    triggers: triggers.sort((a, b) => a.time - b.time),
    blockers: []
  };
}

function filterTriggersByPriority(
  lowerPriorityTriggers: SfxTrigger[],
  higherPriorityAnchors: PriorityAnchor[],
  minGapMs: number
): SfxTrigger[] {
  if (higherPriorityAnchors.length === 0) return lowerPriorityTriggers;
  return lowerPriorityTriggers.filter(
    (candidate) => !higherPriorityAnchors.some((existing) => Math.abs(existing.time - candidate.time) < minGapMs)
  );
}

function toPriorityAnchors(plan: SfxPlanResult): PriorityAnchor[] {
  return [...plan.triggers.map((item) => ({ time: item.time })), ...plan.blockers.map((time) => ({ time }))];
}

/** 基于字幕时间线生成音效触发点 */
export function generateSfxTriggers(subtitles: StyledSubtitle[], options?: GenerateSfxTriggerOptions): SfxTrigger[] {
  const sfxDir = config.paths.sfx;
  const hasLocalSfxDir = fs.existsSync(sfxDir);
  // 获取所有本地音效文件（用于默认 ding 与相对文件名解析）
  const sfxFiles = hasLocalSfxDir ? fs.readdirSync(sfxDir).filter((f) => f.endsWith(".mp3") || f.endsWith(".wav")) : [];
  const configuredSfx = resolveConfiguredSfx(sfxDir);

  const triggers: SfxTrigger[] = [];
  const higherPriorityAnchors: PriorityAnchor[] = [];

  // 1) 时间轴音效（最高优先级）
  const timelinePlan = buildTimelineSfxPlan(options?.sfxSequence, subtitles, sfxDir, sfxFiles, configuredSfx);
  triggers.push(...timelinePlan.triggers);
  higherPriorityAnchors.push(...toPriorityAnchors(timelinePlan));

  // 2) 背景动效音效（中优先级，避让时间轴）
  const effectPlan = buildEffectSfxPlan(options?.plannedVideoEffects, options?.fps, sfxDir, sfxFiles, configuredSfx);
  const effectTriggers = filterTriggersByPriority(
    effectPlan.triggers,
    higherPriorityAnchors,
    SOURCE_PRIORITY_MIN_GAP_MS
  );
  triggers.push(...effectTriggers);
  higherPriorityAnchors.push(...effectTriggers.map((item) => ({ time: item.time })));
  higherPriorityAnchors.push(...effectPlan.blockers.map((time) => ({ time })));

  // 3) 字幕动效序列音效（低于时间轴/背景动效，高于模板随机池与系统默认）
  console.log(
    "[DEBUG] Before subtitleAnimationPlan - higherPriorityAnchors:",
    higherPriorityAnchors
      .map((a) => a.time)
      .slice(0, 10)
      .join(", ")
  );
  const subtitleAnimationPlan = buildSubtitleAnimationSfxPlan(
    options?.subtitleAnimationSequence,
    subtitles,
    sfxDir,
    sfxFiles,
    configuredSfx
  );
  console.log(
    "[DEBUG] subtitleAnimationPlan.triggers:",
    subtitleAnimationPlan.triggers.map((t) => `time=${t.time},sfx=${t.sfxPath.split("/").pop()}`).join("; ")
  );
  const subtitleAnimationTriggers = filterTriggersByPriority(
    subtitleAnimationPlan.triggers,
    higherPriorityAnchors,
    SOURCE_PRIORITY_MIN_GAP_MS
  );
  console.log(
    "[DEBUG] After filter - subtitleAnimationTriggers:",
    subtitleAnimationTriggers.map((t) => `time=${t.time},sfx=${t.sfxPath.split("/").pop()}`).join("; ")
  );
  triggers.push(...subtitleAnimationTriggers);
  higherPriorityAnchors.push(...subtitleAnimationTriggers.map((item) => ({ time: item.time })));
  higherPriorityAnchors.push(...subtitleAnimationPlan.blockers.map((time) => ({ time })));

  // 4) 模板字幕动效音效池（低于显式序列，高于系统默认）
  const templateSubtitleAnimationPlan = buildTemplateSubtitleAnimationSfxPlan(
    options?.subtitleAnimationSfxMap,
    subtitles,
    sfxDir,
    sfxFiles,
    configuredSfx
  );
  const templateSubtitleAnimationTriggers = filterTriggersByPriority(
    templateSubtitleAnimationPlan.triggers,
    higherPriorityAnchors,
    SOURCE_PRIORITY_MIN_GAP_MS
  );
  triggers.push(...templateSubtitleAnimationTriggers);
  higherPriorityAnchors.push(...templateSubtitleAnimationTriggers.map((item) => ({ time: item.time })));
  higherPriorityAnchors.push(...templateSubtitleAnimationPlan.blockers.map((time) => ({ time })));

  // 5) 系统默认字幕音效（最低优先级，兜底使用 ding）
  const defaultSubtitlePlan = buildDefaultSubtitleSfxPlan(
    subtitles,
    resolveDefaultDingSfxPath(sfxDir, sfxFiles, configuredSfx)
  );
  const defaultSubtitleTriggers = filterTriggersByPriority(
    defaultSubtitlePlan.triggers,
    higherPriorityAnchors,
    SOURCE_PRIORITY_MIN_GAP_MS
  );
  triggers.push(...defaultSubtitleTriggers);

  return triggers.sort((a, b) => a.time - b.time);
}
