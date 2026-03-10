import React from "react";
import { useVideoConfig, OffthreadVideo, staticFile, AbsoluteFill } from "remotion";
import {
  ZoomAction,
  ZoomInSnapDownAction,
  SnapZoomAction,
  SnapZoomSmoothDownAction,
  BlurSnapClearAction,
  EllipseMaskZoomOutAction,
  RectangleMaskSnapZoomAction,
  ShakeAction,
  PanAction,
  ZoomOutAction,
  FocusZoomAction,
  SwipeFromRightAction
} from "./effects/TransformEffects";
import {
  SpotlightAction,
  SpotlightPulseAction,
  SpotlightExtremeAction,
  SpotlightCenterAction,
  RectangleMaskAction
} from "./effects/OverlayEffects";
import { BlurGlowAction } from "./effects/FilterEffects";
import { VideoTemplate, VideoEffectName, PipMedia, StyledSubtitle, PlannedVideoEffect } from "../../types";
import { planVideoEffects, VIDEO_EFFECT_DURATION_SECONDS } from "./effects/videoEffectPlanner";

interface Props {
  videoSrc: string;
  template?: VideoTemplate;
  pipMediaList?: PipMedia[];
  subtitles?: StyledSubtitle[];
  /** 外部已计算好的背景动效排期；传入后将直接使用，不再在组件内重算 */
  plannedEffects?: PlannedVideoEffect[];
}

export const VideoWithEffects: React.FC<Props> = ({ videoSrc, template, pipMediaList, subtitles, plannedEffects }) => {
  const { durationInFrames, fps, width, height } = useVideoConfig();
  const fallbackBackgroundColor = template?.layout.backgroundColor ?? "#202020";

  const effects = React.useMemo(() => {
    if (plannedEffects) return plannedEffects;
    return planVideoEffects({
      durationInFrames,
      fps,
      template,
      pipMediaList,
      subtitles
    });
  }, [plannedEffects, durationInFrames, fps, template, pipMediaList, subtitles]);

  const defaultEffectDurationFrames = VIDEO_EFFECT_DURATION_SECONDS * fps;

  // 基础视频组件
  let content = videoSrc ? (
    <AbsoluteFill>
      <OffthreadVideo
        src={videoSrc.startsWith("http://") || videoSrc.startsWith("https://") ? videoSrc : staticFile(videoSrc)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ backgroundColor: fallbackBackgroundColor }} />
  );

  // 分离 Overlay 类和其他类
  const overlayTypes: VideoEffectName[] = [
    "spotlight",
    "spotlightPulse",
    "spotlightExtreme",
    "spotlightCenter",
    "rectangleMask"
  ];
  const overlayEffects = effects.filter((e) => overlayTypes.includes(e.type));
  const wrapperEffects = effects.filter((e) => !overlayTypes.includes(e.type));

  // 为了确保指定顺序生效，按 effects 顺序进行包裹
  wrapperEffects.forEach((effect) => {
    const effectDurationFrames = Math.max(1, Math.floor(effect.durationFrames ?? defaultEffectDurationFrames));
    const props = {
      startFrame: effect.startFrame,
      durationFrames: effectDurationFrames
    };

    switch (effect.type) {
      case "zoomIn":
        content = <ZoomAction {...props}>{content}</ZoomAction>;
        break;
      case "zoomInSnapDown":
        content = <ZoomInSnapDownAction {...props}>{content}</ZoomInSnapDownAction>;
        break;
      case "snapZoom":
        content = <SnapZoomAction {...props}>{content}</SnapZoomAction>;
        break;
      case "snapZoomSmoothDown":
        content = <SnapZoomSmoothDownAction {...props}>{content}</SnapZoomSmoothDownAction>;
        break;
      case "blurSnapClear":
        content = <BlurSnapClearAction {...props}>{content}</BlurSnapClearAction>;
        break;
      case "ellipseMaskZoomOut":
        content = <EllipseMaskZoomOutAction {...props}>{content}</EllipseMaskZoomOutAction>;
        break;
      case "rectangleMaskSnapZoom":
        content = <RectangleMaskSnapZoomAction {...props}>{content}</RectangleMaskSnapZoomAction>;
        break;
      case "zoomOut":
        content = <ZoomOutAction {...props}>{content}</ZoomOutAction>;
        break;
      case "magnifier":
        content = <FocusZoomAction {...props}>{content}</FocusZoomAction>;
        break;
      case "panLeft":
        content = (
          <PanAction {...props} direction="left">
            {content}
          </PanAction>
        );
        break;
      case "swipeFromRight":
        content = <SwipeFromRightAction {...props}>{content}</SwipeFromRightAction>;
        break;
      case "panRight":
        content = (
          <PanAction {...props} direction="right">
            {content}
          </PanAction>
        );
        break;
      case "shake":
        content = <ShakeAction {...props}>{content}</ShakeAction>;
        break;
      case "blurGlow":
        content = <BlurGlowAction {...props}>{content}</BlurGlowAction>;
        break;
    }
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {content}

      {/* 叠加层特效 */}
      {overlayEffects.map((effect, index) => {
        const effectDurationFrames = Math.max(1, Math.floor(effect.durationFrames ?? defaultEffectDurationFrames));
        const overlayProps = {
          key: `overlay-${index}`,
          startFrame: effect.startFrame,
          durationFrames: effectDurationFrames,
          width,
          height
        };
        switch (effect.type) {
          case "spotlight":
            return <SpotlightAction {...overlayProps} />;
          case "spotlightPulse":
            return <SpotlightPulseAction {...overlayProps} />;
          case "spotlightExtreme":
            return <SpotlightExtremeAction {...overlayProps} />;
          case "spotlightCenter":
            return <SpotlightCenterAction {...overlayProps} />;
          case "rectangleMask":
            return <RectangleMaskAction {...overlayProps} />;
          default:
            return null;
        }
      })}
    </AbsoluteFill>
  );
};
