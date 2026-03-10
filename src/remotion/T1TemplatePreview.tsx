import React from "react";
import { AbsoluteFill, Series, useVideoConfig, staticFile } from "remotion";
import { SubtitleGroup } from "./components/SubtitleGroup";
import { VideoWithEffects } from "./components/VideoEffects";
import { T1Template } from "./templates/T1";
import { SplitSubtitle, StyledSubtitle } from "../types";
import { assignStyles } from "../services/SubtitleStyleAssigner";

export const PREVIEW_DURATION_FRAMES = 150; // 5 seconds per subtitle screen

/**
 * Calculate video duration in frames based on the last subtitle's groupEnd time.
 * This ensures the preview duration matches the actual video content.
 * @param subtitles - Array of subtitle objects with timing information
 * @param fps - Frames per second (default: 30)
 * @returns Duration in frames
 */
export function calculateVideoDurationFrames(subtitles: SplitSubtitle[], fps: number = 30): number {
  if (!subtitles || subtitles.length === 0) {
    return fps * 60; // Default to 60 seconds if no subtitles
  }
  const lastSubtitle = subtitles[subtitles.length - 1];
  const durationMs = lastSubtitle.groupEnd || lastSubtitle.end;
  // Add a small buffer (1 second) to ensure the video doesn't cut off abruptly
  const durationWithBuffer = durationMs + 1000;
  return Math.ceil((durationWithBuffer / 1000) * fps);
}

// 从 JSON 文件加载字幕数据
import subtitleData from "../../examples/subtitle_split_example.json";
import videoData from "../../examples/demo.mp4";

// 将 JSON 数据转换为 SplitSubtitle 类型
const RAW_SUBTITLES: SplitSubtitle[] = subtitleData.subtitles.map((sub: any) => ({
  start: sub.start,
  end: sub.end,
  groupStart: sub.groupStart,
  groupEnd: sub.groupEnd,
  text: sub.text,
  groupId: sub.groupId,
  position: sub.position,
  totalInGroup: sub.totalInGroup,
  keyword: sub.keyword || ""
}));

// 使用 T1 模板的动画配置动态生成样式
const STYLED_SUBTITLES: StyledSubtitle[] = assignStyles(RAW_SUBTITLES, T1Template);

// Calculate video duration based on subtitle data (automatically computed from demo.mp4 timing)
export const VIDEO_DURATION_FRAMES = calculateVideoDurationFrames(RAW_SUBTITLES, 30);

export const T1TemplatePreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 背景视频（带动画特效）- 使用 VideoWithEffects 组件渲染 videoEffectSequence */}
      <VideoWithEffects videoSrc={videoData} template={T1Template} subtitles={STYLED_SUBTITLES} />
      {/* 字幕层 */}
      <SubtitleGroup subtitles={STYLED_SUBTITLES} template={T1Template} />
    </AbsoluteFill>
  );
};

// 可选：逐个动画预览的序列版本
const T1AnimationSequencePreview: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      {STYLED_SUBTITLES.map((subtitle, index) => (
        <Series.Sequence key={subtitle.groupId} durationInFrames={PREVIEW_DURATION_FRAMES}>
          <AbsoluteFill style={{ backgroundColor: "#000" }}>
            <div
              style={{
                position: "absolute",
                top: 50,
                left: 50,
                color: "white",
                fontSize: 32,
                fontFamily: "sans-serif",
                zIndex: 100
              }}
            >
              #{index + 1} - {subtitle.animationIn}
            </div>
            <VideoWithEffects videoSrc={videoData} template={T1Template} subtitles={[subtitle]} />
            <SubtitleGroup subtitles={[subtitle]} template={T1Template} />
          </AbsoluteFill>
        </Series.Sequence>
      ))}
    </Series>
  );
};

export { T1AnimationSequencePreview };

// Export the subtitle count for use in Root.tsx
export const SUBTITLE_COUNT = STYLED_SUBTITLES.length;
