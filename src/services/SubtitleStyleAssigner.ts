import { getSubtitleLayoutPreset } from "../subtitles/layoutPresets";
import {
  AnimationName,
  SubtitleAnimationSequenceItem,
  SplitSubtitle,
  StyledSubtitle,
  SubtitleStyle,
  SubtitleStyleType,
  VideoTemplate
} from "../types";
import { SLOW_ANIMATIONS } from "../remotion/components/animations/animations";

interface GroupStyleVariant {
  default?: Partial<SubtitleStyle>;
  emphasis?: Partial<SubtitleStyle>;
  tertiary?: Partial<SubtitleStyle>;
  keyword?: Partial<SubtitleStyle>;
  lineOffsetY?: number[];
}

interface SubtitleScreenAnchor {
  groupId: number;
  startMs: number;
}

interface SubtitleAnimationOverride {
  animationIn?: AnimationName;
  animationOut?: AnimationName;
}

interface SubtitleAnimationOverrideMaps {
  groupMap: Map<number, SubtitleAnimationOverride>;
  lineMap: Map<string, SubtitleAnimationOverride>;
}

type SubtitleAnimationTargetItem = Pick<
  SubtitleAnimationSequenceItem,
  | "animationIn"
  | "animationOut"
  | "startSec"
  | "subtitleScreen"
  | "subtitleGroupId"
  | "subtitleLine"
  | "subtitlePosition"
>;

function buildSubtitleLineKey(groupId: number, position: number): string {
  return `${groupId}:${position}`;
}

function buildSubtitleScreenAnchors(subtitles: SplitSubtitle[]): SubtitleScreenAnchor[] {
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

function resolveSequenceTargetGroupId(
  item: SubtitleAnimationTargetItem,
  orderedAnchors: SubtitleScreenAnchor[],
  groupIdSet: Set<number>
): number | undefined {
  if (typeof item.startSec === "number" && Number.isFinite(item.startSec) && item.startSec >= 0) {
    const startMs = Math.round(item.startSec * 1000);
    const target = orderedAnchors.find((anchor) => anchor.startMs >= startMs);
    return target?.groupId;
  }

  if (Number.isInteger(item.subtitleGroupId) && (item.subtitleGroupId as number) >= 0) {
    const targetGroupId = item.subtitleGroupId as number;
    return groupIdSet.has(targetGroupId) ? targetGroupId : undefined;
  }

  if (Number.isInteger(item.subtitleScreen) && (item.subtitleScreen as number) > 0) {
    const target = orderedAnchors[(item.subtitleScreen as number) - 1];
    return target?.groupId;
  }

  return undefined;
}

function normalizeAnimationName(value: unknown): AnimationName | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed as AnimationName;
}

function normalizeSubtitleLinePosition(
  item: Pick<SubtitleAnimationTargetItem, "subtitleLine" | "subtitlePosition">
): number | undefined {
  if (Number.isInteger(item.subtitlePosition) && (item.subtitlePosition as number) >= 0) {
    return item.subtitlePosition as number;
  }
  if (Number.isInteger(item.subtitleLine) && (item.subtitleLine as number) > 0) {
    return (item.subtitleLine as number) - 1;
  }
  return undefined;
}

function buildGroupLineCountMap(subtitles: SplitSubtitle[]): Map<number, number> {
  const groupLineCountMap = new Map<number, number>();
  for (const sub of subtitles) {
    const nextCount = Math.max(groupLineCountMap.get(sub.groupId) ?? 0, sub.position + 1);
    groupLineCountMap.set(sub.groupId, nextCount);
  }
  return groupLineCountMap;
}

function mergeOverrideMap<K extends number | string>(
  base: Map<K, SubtitleAnimationOverride>,
  override: Map<K, SubtitleAnimationOverride>
): Map<K, SubtitleAnimationOverride> {
  const merged = new Map<K, SubtitleAnimationOverride>(base);
  for (const [key, item] of override.entries()) {
    const prev = merged.get(key);
    merged.set(key, {
      animationIn: item.animationIn ?? prev?.animationIn,
      animationOut: item.animationOut ?? prev?.animationOut
    });
  }
  return merged;
}

function buildSubtitleAnimationOverrideMap(
  subtitles: SplitSubtitle[],
  sequence: SubtitleAnimationTargetItem[] | undefined
): SubtitleAnimationOverrideMaps {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return {
      groupMap: new Map<number, SubtitleAnimationOverride>(),
      lineMap: new Map<string, SubtitleAnimationOverride>()
    };
  }

  const orderedAnchors = buildSubtitleScreenAnchors(subtitles);
  const groupIdSet = new Set<number>(orderedAnchors.map((item) => item.groupId));
  const groupLineCountMap = buildGroupLineCountMap(subtitles);
  const groupMap = new Map<number, SubtitleAnimationOverride>();
  const lineMap = new Map<string, SubtitleAnimationOverride>();

  // Build a lookup map from the sequence by subtitleScreen for efficient matching
  const sequenceMap = new Map<number, SubtitleAnimationTargetItem>();
  for (const item of sequence) {
    if (item && typeof item === "object" && item.subtitleScreen) {
      sequenceMap.set(item.subtitleScreen, item);
    }
  }
  const sequenceLength = sequence.length;

  // Iterate through all unique groups and apply sequence cyclically
  // Groups 1-15 use entries 1-15, groups 16-30 loop back to entries 1-15, etc.
  for (let i = 0; i < orderedAnchors.length; i++) {
    const anchor = orderedAnchors[i];
    const screenNumber = i + 1; // 1-based sequential group number
    // Loop the sequence cyclically using modulo: screen 16 -> entry 1, screen 17 -> entry 2, etc.
    const sequenceIndex = ((screenNumber - 1) % sequenceLength) + 1;
    const item = sequenceMap.get(sequenceIndex);

    if (!item) continue;

    const targetGroupId = anchor.groupId;
    const animationIn = normalizeAnimationName(item.animationIn);
    const animationOut = normalizeAnimationName(item.animationOut);
    if (!animationIn && !animationOut) continue;

    const subtitlePosition = normalizeSubtitleLinePosition(item);
    if (subtitlePosition !== undefined) {
      const lineCount = groupLineCountMap.get(targetGroupId) ?? 0;
      if (subtitlePosition >= lineCount) continue;
      const lineKey = buildSubtitleLineKey(targetGroupId, subtitlePosition);
      const prev = lineMap.get(lineKey);
      lineMap.set(lineKey, {
        animationIn: animationIn ?? prev?.animationIn,
        animationOut: animationOut ?? prev?.animationOut
      });
      continue;
    }

    const prev = groupMap.get(targetGroupId);
    groupMap.set(targetGroupId, {
      animationIn: animationIn ?? prev?.animationIn,
      animationOut: animationOut ?? prev?.animationOut
    });
  }

  return {
    groupMap,
    lineMap
  };
}

function mergeSubtitleAnimationOverrideMaps(
  base: SubtitleAnimationOverrideMaps,
  override: SubtitleAnimationOverrideMaps
): SubtitleAnimationOverrideMaps {
  return {
    groupMap: mergeOverrideMap(base.groupMap, override.groupMap),
    lineMap: mergeOverrideMap(base.lineMap, override.lineMap)
  };
}

function extractVideoEffectSubtitleAnimations(
  sequence: VideoTemplate["videoEffectSequence"]
): SubtitleAnimationTargetItem[] {
  if (!Array.isArray(sequence) || sequence.length === 0) return [];

  const result: SubtitleAnimationTargetItem[] = [];
  for (const item of sequence) {
    if (!item || typeof item !== "object") continue;

    const animationIn = normalizeAnimationName(item.animationIn);
    const animationOut = normalizeAnimationName(item.animationOut);
    if (!animationIn && !animationOut) continue;

    const hasStartSec = typeof item.startSec === "number" && Number.isFinite(item.startSec) && item.startSec >= 0;
    const hasSubtitleGroup = Number.isInteger(item.subtitleGroupId) && (item.subtitleGroupId as number) >= 0;
    const hasSubtitleScreen = Number.isInteger(item.subtitleScreen) && (item.subtitleScreen as number) > 0;
    if (!hasStartSec && !hasSubtitleGroup && !hasSubtitleScreen) continue;

    result.push({
      animationIn,
      animationOut,
      startSec: hasStartSec ? item.startSec : undefined,
      subtitleGroupId: hasSubtitleGroup ? item.subtitleGroupId : undefined,
      subtitleScreen: hasSubtitleScreen ? item.subtitleScreen : undefined
    });
  }

  return result;
}

/** 将分句字幕映射为可渲染字幕样式 */
export function assignStyles(subtitles: SplitSubtitle[], template: VideoTemplate): StyledSubtitle[] {
  const subtitleAnimationStrategy = template.subtitleAnimationStrategy ?? "sparse";
  // 按顺序使用动画序列中的动画
  let subtitleInIndex = 0;
  const getAnimationInSequence = (anim: AnimationName | AnimationName[]) => {
    if (Array.isArray(anim)) {
      const result = anim[subtitleInIndex % anim.length];
      subtitleInIndex++;
      return result;
    }
    return anim;
  };

  // 从动画池中随机取一个；若不是数组则直接返回固定动画
  const getAnimation = (anim: AnimationName | AnimationName[]) => {
    if (Array.isArray(anim)) {
      return anim[Math.floor(Math.random() * anim.length)];
    }
    return anim;
  };

  // 从样式池里随机抽一个合法对象（用于按屏随机样式）
  const pickStyleOverride = (pool: Partial<SubtitleStyle>[] | undefined): Partial<SubtitleStyle> | undefined => {
    if (!Array.isArray(pool) || pool.length === 0) return undefined;
    const valid = pool.filter((item): item is Partial<SubtitleStyle> => {
      return Boolean(item) && typeof item === "object" && !Array.isArray(item);
    });
    if (valid.length === 0) return undefined;
    return valid[Math.floor(Math.random() * valid.length)];
  };

  // 从 lineOffsetY 方案池里随机抽一套“整屏偏移方案”
  const pickLineOffsetY = (pool: number[][] | undefined): number[] | undefined => {
    if (!Array.isArray(pool) || pool.length === 0) return undefined;
    const valid = pool.filter((item): item is number[] => {
      return Array.isArray(item) && item.every((n) => typeof n === "number" && Number.isFinite(n));
    });
    if (valid.length === 0) return undefined;
    return valid[Math.floor(Math.random() * valid.length)];
  };

  const getStyleVariantConfig = (totalInGroup: number) => {
    if (!template.subtitleStyleVariants) return undefined;
    if (totalInGroup === 1) return template.subtitleStyleVariants.oneLine;
    if (totalInGroup === 2) return template.subtitleStyleVariants.twoLine;
    if (totalInGroup === 3) return template.subtitleStyleVariants.threeLine;
    return undefined;
  };

  // groupId -> 该屏被抽中的样式变体（整屏共享，避免同屏每行风格乱跳）
  const groupStyleMap = new Map<number, GroupStyleVariant>();

  // groupId -> 该屏行数（用于决定 oneLine/twoLine/threeLine 变体池）
  const groupLineCountMap = new Map<number, number>();
  for (const sub of subtitles) {
    if (!groupLineCountMap.has(sub.groupId)) {
      groupLineCountMap.set(sub.groupId, sub.totalInGroup);
    }
  }

  // 先为每个屏预抽样一次，后面映射每行时只做读取
  for (const [groupId, totalInGroup] of groupLineCountMap) {
    const variant = getStyleVariantConfig(totalInGroup);
    if (!variant) continue;

    groupStyleMap.set(groupId, {
      default: pickStyleOverride(variant.default),
      emphasis: pickStyleOverride(variant.emphasis),
      tertiary: pickStyleOverride(variant.tertiary),
      keyword: pickStyleOverride(variant.keyword),
      lineOffsetY: pickLineOffsetY(variant.lineOffsetY)
    });
  }

  const subtitleLayoutPreset = getSubtitleLayoutPreset(template.layout.subtitleLayoutPreset);
  const useThreeLineOverlayTailStyle = subtitleLayoutPreset.name === "threeLineOverlay";
  const videoEffectSubtitleAnimationOverrideMap = buildSubtitleAnimationOverrideMap(
    subtitles,
    extractVideoEffectSubtitleAnimations(template.videoEffectSequence)
  );
  const subtitleAnimationSequenceOverrideMap = buildSubtitleAnimationOverrideMap(
    subtitles,
    template.subtitleAnimationSequence
  );
  // 专用字幕序列优先级高于 videoEffectSequence 内联字幕动效，便于逐步迁移旧配置。
  const subtitleAnimationOverrideMaps = mergeSubtitleAnimationOverrideMaps(
    videoEffectSubtitleAnimationOverrideMap,
    subtitleAnimationSequenceOverrideMap
  );
  const defaultAnimationIn = Array.isArray(template.animations.subtitleIn)
    ? template.animations.subtitleIn[0]
    : template.animations.subtitleIn;

  return subtitles.map((sub) => {
    // threeLineOverlay 下三句屏的第 3 句固定 tertiary（保证视觉层次）
    const isTertiaryTail = useThreeLineOverlayTailStyle && sub.totalInGroup === 3 && sub.position === 2;

    // 非第三句尾句时，10% 概率提升为 emphasis（前提是有 keyword）
    const isEmphasis = !isTertiaryTail && Math.random() < 0.1 && sub.keyword;

    // 只有非 emphasis 行才再判断是否展示关键词高亮（50% 概率）
    const hasKeyword = !isEmphasis && Math.random() < 0.5 && sub.keyword;

    // 每行最终的基础角色样式
    const baseStyleType: "default" | "emphasis" | "tertiary" = isTertiaryTail
      ? "tertiary"
      : isEmphasis
        ? "emphasis"
        : "default";

    // 从“该屏预抽样结果”中取当前行所需覆盖项
    const variant = groupStyleMap.get(sub.groupId);
    const styleOverride = variant?.[baseStyleType];
    const keywordStyleOverride = variant?.keyword;
    const lineOffsetYOverride = variant?.lineOffsetY?.[sub.position];

    const isKeySentence = baseStyleType !== "default";
    const lineAnimationOverride = subtitleAnimationOverrideMaps.lineMap.get(
      buildSubtitleLineKey(sub.groupId, sub.position)
    );
    const groupAnimationOverride = subtitleAnimationOverrideMaps.groupMap.get(sub.groupId);
    const animationOverride =
      lineAnimationOverride || groupAnimationOverride
        ? {
            animationIn: lineAnimationOverride?.animationIn ?? groupAnimationOverride?.animationIn,
            animationOut: lineAnimationOverride?.animationOut ?? groupAnimationOverride?.animationOut
          }
        : undefined;
    const hasAnimationInOverride = animationOverride?.animationIn !== undefined;
    const hasAnimationOutOverride = animationOverride?.animationOut !== undefined;
    const sequenceAnimationIn =
      subtitleAnimationStrategy === "sequence" ? getAnimationInSequence(template.animations.subtitleIn) : undefined;
    let animationIn = hasAnimationInOverride
      ? (animationOverride!.animationIn as AnimationName)
      : subtitleAnimationStrategy === "sequence"
        ? (sequenceAnimationIn as AnimationName)
        : isKeySentence
          ? getAnimationInSequence(template.animations.subtitleIn)
          : Math.random() < 0.2
            ? getAnimationInSequence(template.animations.subtitleIn)
            : "none";

    // 尾句强制使用快速动画，避免动画还没播完字幕就消失
    const isTail = sub.position === sub.totalInGroup - 1;
    // 短尾句（< 4 个视觉字符）必须避开慢速动画，使用快速动画
    if (!hasAnimationInOverride && isTail && sub.text.length < 4 && SLOW_ANIMATIONS.includes(animationIn)) {
      animationIn =
        subtitleAnimationStrategy === "sequence" ? defaultAnimationIn : isKeySentence ? defaultAnimationIn : "none";
    }

    return {
      ...sub,
      // keyword 字段会驱动渲染层高亮组件；不命中时显式置空
      keyword: hasKeyword ? sub.keyword : undefined,
      styleType: baseStyleType as SubtitleStyleType,
      styleOverride,
      keywordStyleOverride,
      lineOffsetYOverride,
      animationIn,
      // 命中序列时使用显式出场动画；未命中则按配置池随机
      animationOut: hasAnimationOutOverride
        ? (animationOverride!.animationOut as AnimationName)
        : getAnimation(template.animations.subtitleOut)
    };
  });
}
