import React from "react";
import { StyledSubtitle, SubtitleCarrySplitConfig, VideoTemplate } from "../../types";
import { SubtitleLine } from "./SubtitleLine";
import { useVideoConfig } from "remotion";
import { frameToMs } from "../../utils/time";

/** 字幕提前结束时间（毫秒） */
const SUBTITLE_EARLY_END_MS = -500;

interface Props {
  subtitles: StyledSubtitle[];
  template: VideoTemplate;
}

type RuntimeCarrySplitConfig = Pick<
  SubtitleCarrySplitConfig,
  "transitionFrames" | "offsetY" | "centerGap" | "opacity" | "holdToNextEnd" | "holdFrames"
>;

export const SubtitleGroup: React.FC<Props> = ({ subtitles, template }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const videoDurationMs = (durationInFrames / fps) * 1000;
  const carrySplitConfig = template.layout.subtitleCarrySplit;
  const carrySplitEnabled = carrySplitConfig?.enabled ?? true;
  const carrySplitMaxTransitions = (() => {
    if (carrySplitConfig?.maxTransitions === undefined) return Number.POSITIVE_INFINITY;
    if (!Number.isFinite(carrySplitConfig.maxTransitions)) return 0;
    return Math.max(0, Math.floor(carrySplitConfig.maxTransitions));
  })();
  let carrySplitUsedCount = 0;

  return (
    <>
      {subtitles.map((subtitle, index) => {
        const nextSubtitleRaw = subtitles[index + 1];
        const shouldTriggerCarrySplit = Boolean(
          carrySplitEnabled &&
          nextSubtitleRaw &&
          nextSubtitleRaw.groupId !== subtitle.groupId &&
          nextSubtitleRaw.animationIn === "carrySplit" &&
          carrySplitUsedCount < carrySplitMaxTransitions
        );
        if (shouldTriggerCarrySplit) {
          carrySplitUsedCount += 1;
        }
        const nextSubtitle = shouldTriggerCarrySplit ? nextSubtitleRaw : undefined;
        const activeCarrySplitConfig: RuntimeCarrySplitConfig | undefined = shouldTriggerCarrySplit
          ? (carrySplitConfig ?? {})
          : undefined;

        // 检查是否是最后一组字幕
        const lastSubtitle = subtitles[subtitles.length - 1];
        const isLastGroup = lastSubtitle && subtitle.groupId === lastSubtitle.groupId;

        let effectiveGroupEnd = subtitle.groupEnd - SUBTITLE_EARLY_END_MS;
        if (nextSubtitle) {
          const holdToNextEnd = activeCarrySplitConfig?.holdToNextEnd ?? true;
          const fallbackHoldFrames = activeCarrySplitConfig?.holdFrames ?? 14;
          const holdEndMs = holdToNextEnd
            ? nextSubtitle.groupEnd - SUBTITLE_EARLY_END_MS
            : nextSubtitle.start + frameToMs(fallbackHoldFrames, fps);
          effectiveGroupEnd = Math.max(effectiveGroupEnd, holdEndMs);
        }
        effectiveGroupEnd = Math.min(effectiveGroupEnd, videoDurationMs - SUBTITLE_EARLY_END_MS);

        const effectiveSubtitle = {
          ...subtitle,
          groupEnd: effectiveGroupEnd,
          end: isLastGroup ? videoDurationMs - SUBTITLE_EARLY_END_MS : subtitle.end
        };

        return (
          <SubtitleLine
            key={`${effectiveSubtitle.groupId}-${effectiveSubtitle.start}-${effectiveSubtitle.end}-${index}`}
            subtitle={effectiveSubtitle}
            nextSubtitle={nextSubtitle}
            carrySplitConfig={nextSubtitle ? activeCarrySplitConfig : undefined}
            template={template}
          />
        );
      })}
    </>
  );
};
