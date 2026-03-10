import React from 'react';
import { useVideoConfig, useCurrentFrame, Sequence, interpolate, Img } from 'remotion';
import {
  DisplayWindowConfig,
  StaticInfo,
  StyledSubtitle,
  TitleHighlight,
  VideoTemplate,
} from '../../types';
import { renderPerCharText } from '../utils/charTransform';
import { TitleWithFade } from './title/TitleWithFade';

/** 设计基准尺寸 */
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;

/** 淡入淡出时长（毫秒） */
const FADE_DURATION_MS = 500;
/** 主讲人显示时长（秒） */
const SPEAKER_DISPLAY_SECONDS = 5;

interface Props {
  info: StaticInfo;
  template: VideoTemplate;
  subtitles?: StyledSubtitle[];
}

/** 主讲人显示组件 */
interface SpeakerProps {
  name: string;
  title?: string;
  config: {
    left: number;
    top: number;
    fontFamily: string;
    nameFontFamily?: string;
    nameFontWeight?: 'normal' | 'bold' | number;
    nameFontStyle?: 'normal' | 'italic' | 'oblique';
    nameCharTransform?: string;
    nameCharTransformOrigin?: string;
    titleFontFamily?: string;
    titleFontWeight?: 'normal' | 'bold' | number;
    titleFontStyle?: 'normal' | 'italic' | 'oblique';
    titleCharTransform?: string;
    titleCharTransformOrigin?: string;
    nameSize: number;
    nameColor: string;
    nameStrokeWidth?: number;
    nameStrokeColor?: string;
    nameShadow?: string;
    titleSize: number;
    titleColor: string;
    titleStrokeWidth?: number;
    titleShadow?: string;
    titleMarginTop?: number;
    titleLeft?: number;
    titleTop?: number;
    titleLineHeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    alwaysVisible?: boolean;
    display?: DisplayWindowConfig;
    background?: {
      color: string;
      top: number;
      height?: number;
      bottom?: number;
      left?: number;
      right?: number;
      borderRadius?: number;
      borderTopWidth?: number;
      borderTopColor?: string;
    };
    accentLine?: {
      left: number;
      width: number;
      color: string;
      cover?: 'title' | 'card';
      top?: number;
      height?: number;
      topOffset?: number;
      bottomOffset?: number;
      borderRadius?: number;
      rotateDeg?: number;
      shadow?: string;
    };
  };
  scaleX: number;
  scaleY: number;
}

interface AvatarProps {
  avatarUrl: string;
  config: {
    left: number;
    top: number;
    size: number;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    backgroundColor?: string;
    shadow?: string;
    objectFit?: 'cover' | 'contain';
    alwaysVisible?: boolean;
    indicator?: {
      enabled?: boolean;
      top?: number;
      width?: number;
      gap?: number;
      color?: string;
      bars?: number;
      barHeights?: number[];
      borderRadius?: number;
      animated?: boolean;
      speed?: number;
      minScale?: number;
      maxScale?: number;
    };
  };
  scaleX: number;
  scaleY: number;
}

interface SubtitleTimelineItem {
  groupId: number;
  startFrame: number;
  endFrame: number;
}

interface DisplayRange {
  from: number;
  durationInFrames: number;
  disableFade: boolean;
}

function clampNumber(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function hasDisplayWindow(display?: DisplayWindowConfig): boolean {
  if (!display) return false;
  return [
    display.startSec,
    display.endSec,
    display.startSubtitleScreen,
    display.endSubtitleScreen,
    display.startSubtitleGroupId,
    display.endSubtitleGroupId,
  ].some((value) => value !== undefined);
}

function buildSubtitleTimeline(subtitles: StyledSubtitle[] | undefined, fps: number): SubtitleTimelineItem[] {
  if (!Array.isArray(subtitles) || subtitles.length === 0) return [];

  const groupRanges = new Map<number, { startMs: number; endMs: number }>();
  for (const subtitle of subtitles) {
    const startMsRaw = Number.isFinite(subtitle.groupStart) ? subtitle.groupStart : subtitle.start;
    const endMsRaw = Number.isFinite(subtitle.groupEnd) ? subtitle.groupEnd : subtitle.end;
    const startMs = Math.max(0, startMsRaw);
    const endMs = Math.max(startMs, endMsRaw);

    const existing = groupRanges.get(subtitle.groupId);
    if (!existing) {
      groupRanges.set(subtitle.groupId, { startMs, endMs });
      continue;
    }

    existing.startMs = Math.min(existing.startMs, startMs);
    existing.endMs = Math.max(existing.endMs, endMs);
  }

  return Array.from(groupRanges.entries())
    .map(([groupId, range]) => {
      const startFrame = Math.max(0, Math.floor((range.startMs / 1000) * fps));
      const endFrameRaw = Math.max(1, Math.ceil((range.endMs / 1000) * fps));
      const endFrame = Math.max(startFrame + 1, endFrameRaw);
      return { groupId, startFrame, endFrame };
    })
    .sort((a, b) => a.startFrame - b.startFrame || a.groupId - b.groupId);
}

function resolveStartFrame(display: DisplayWindowConfig | undefined, timeline: SubtitleTimelineItem[], fps: number): number | undefined {
  if (!display) return undefined;
  if (typeof display.startSec === 'number' && Number.isFinite(display.startSec) && display.startSec >= 0) {
    return Math.floor(display.startSec * fps);
  }
  if (Number.isInteger(display.startSubtitleGroupId) && (display.startSubtitleGroupId as number) >= 0) {
    return timeline.find((item) => item.groupId === display.startSubtitleGroupId)?.startFrame;
  }
  if (Number.isInteger(display.startSubtitleScreen) && (display.startSubtitleScreen as number) > 0) {
    return timeline[(display.startSubtitleScreen as number) - 1]?.startFrame;
  }
  return undefined;
}

function resolveEndFrame(display: DisplayWindowConfig | undefined, timeline: SubtitleTimelineItem[], fps: number): number | undefined {
  if (!display) return undefined;
  if (typeof display.endSec === 'number' && Number.isFinite(display.endSec) && display.endSec >= 0) {
    return Math.ceil(display.endSec * fps);
  }
  if (Number.isInteger(display.endSubtitleGroupId) && (display.endSubtitleGroupId as number) >= 0) {
    return timeline.find((item) => item.groupId === display.endSubtitleGroupId)?.endFrame;
  }
  if (Number.isInteger(display.endSubtitleScreen) && (display.endSubtitleScreen as number) > 0) {
    return timeline[(display.endSubtitleScreen as number) - 1]?.endFrame;
  }
  return undefined;
}

function resolveDisplayRange(
  options: {
    display?: DisplayWindowConfig;
    alwaysVisible?: boolean;
    defaultDurationFrames: number;
  },
  timeline: SubtitleTimelineItem[],
  fps: number,
  durationInFrames: number
): DisplayRange {
  const totalFrames = Math.max(1, Math.floor(durationInFrames));
  const fallbackDuration = Math.max(1, Math.floor(options.defaultDurationFrames));
  const hasCustomDisplay = hasDisplayWindow(options.display);
  const isAlwaysVisible = Boolean(options.alwaysVisible) && !hasCustomDisplay;

  if (isAlwaysVisible) {
    return {
      from: 0,
      durationInFrames: totalFrames,
      disableFade: true,
    };
  }

  const rawStartFrame = hasCustomDisplay
    ? (resolveStartFrame(options.display, timeline, fps) ?? 0)
    : 0;
  const from = clampNumber(rawStartFrame, 0, Math.max(0, totalFrames - 1));

  const rawFallbackEnd = hasCustomDisplay ? from + fallbackDuration : fallbackDuration;
  const rawEndFrame = hasCustomDisplay
    ? (resolveEndFrame(options.display, timeline, fps) ?? rawFallbackEnd)
    : rawFallbackEnd;
  const end = clampNumber(rawEndFrame, from + 1, totalFrames);

  return {
    from,
    durationInFrames: end - from,
    disableFade: false,
  };
}

function computeFadeOpacity(
  frame: number,
  fps: number,
  durationInFrames: number,
  disableFade = false
): number {
  if (disableFade) return 1;

  const totalFrames = Math.max(1, Math.floor(durationInFrames));
  if (totalFrames <= 2) return 1;

  const configuredFadeFrames = Math.max(1, Math.round((FADE_DURATION_MS / 1000) * fps));
  const maxFadeFrames = Math.max(1, Math.floor((totalFrames - 1) / 2));
  const fadeFrames = Math.min(configuredFadeFrames, maxFadeFrames);
  const fadeOutStart = totalFrames - fadeFrames;

  return interpolate(
    frame,
    [0, fadeFrames, fadeOutStart, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
}

const AvatarWithFade: React.FC<AvatarProps & { fps: number; durationInFrames: number }> = ({
  avatarUrl,
  config,
  scaleX,
  scaleY,
  fps,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const fadeFrames = Math.round((FADE_DURATION_MS / 1000) * fps);
  const totalFrames = config.alwaysVisible ? durationInFrames : SPEAKER_DISPLAY_SECONDS * fps;
  const safeTotalFrames = Math.max(totalFrames, fadeFrames * 2 + 1);
  const opacity = config.alwaysVisible
    ? 1
    : interpolate(
      frame,
      [0, fadeFrames, safeTotalFrames - fadeFrames, safeTotalFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

  const uniformScale = Math.min(scaleX, scaleY);
  const avatarSize = config.size * uniformScale;
  const indicator = config.indicator;
  const shouldShowIndicator = Boolean(indicator?.enabled);
  const barCount = Math.max(1, indicator?.bars ?? 5);
  const defaultBarHeights = [48, 78, 60, 78, 48];
  const indicatorAnimated = indicator?.animated !== false;
  const t = frame / fps;
  const speed = indicator?.speed ?? 4.2;
  const minScaleRaw = indicator?.minScale ?? 0.28;
  const maxScaleRaw = indicator?.maxScale ?? 1;
  const minScale = Math.max(0.05, Math.min(minScaleRaw, 1));
  const maxScale = Math.max(minScale, Math.min(maxScaleRaw, 1));

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: config.left * scaleX,
          top: config.top * scaleY,
          width: avatarSize,
          height: avatarSize,
          borderRadius: (config.borderRadius ?? config.size / 2) * uniformScale,
          overflow: 'hidden',
          border: `${(config.borderWidth ?? 10) * uniformScale}px solid ${config.borderColor ?? '#FFFFFF'}`,
          background: config.backgroundColor ?? '#FFFFFF',
          boxShadow: config.shadow,
          opacity,
          zIndex: 2,
        }}
      >
        <Img
          src={avatarUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: config.objectFit ?? 'cover',
          }}
        />
      </div>

      {shouldShowIndicator && (
        <div
          style={{
            position: 'absolute',
            left: (config.left + config.size / 2) * scaleX,
            top: (config.top + (indicator?.top ?? (config.size + 18))) * scaleY,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: (indicator?.gap ?? 10) * uniformScale,
            opacity,
            zIndex: 3,
          }}
        >
          {Array.from({ length: barCount }).map((_, index) => {
            const customHeight = indicator?.barHeights?.[index];
            const fallbackHeight = defaultBarHeights[index % defaultBarHeights.length];
            const baseHeight = customHeight ?? fallbackHeight;
            const phaseOffset = index * 0.55;
            const wave1 = Math.sin((t * speed + phaseOffset) * Math.PI * 2);
            const wave2 = Math.sin((t * speed * 1.93 + phaseOffset * 1.7) * Math.PI * 2);
            const mixedWave = wave1 * 0.65 + wave2 * 0.35;
            const normalized = (mixedWave + 1) / 2;
            const scale = indicatorAnimated
              ? (minScale + normalized * (maxScale - minScale))
              : 1;
            return (
              <div
                key={`avatar-indicator-${index}`}
                style={{
                  width: (indicator?.width ?? 8) * uniformScale,
                  height: baseHeight * scale * uniformScale,
                  borderRadius: (indicator?.borderRadius ?? 8) * uniformScale,
                  background: indicator?.color ?? '#FFD126',
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

/** 带淡入淡出的主讲人组件 */
const SpeakerWithFade: React.FC<SpeakerProps & { fps: number; durationInFrames: number; disableFade?: boolean }> = ({
  name,
  title,
  config,
  scaleX,
  scaleY,
  fps,
  durationInFrames,
  disableFade = false,
}) => {
  const frame = useCurrentFrame();
  const opacity = computeFadeOpacity(frame, fps, durationInFrames, disableFade);

  const normalizedTitle = title ? title.replace(/\\n/g, '\n') : '';
  const titleLines = normalizedTitle ? normalizedTitle.split('\n') : [];
  const titleLineHeight = config.titleLineHeight ?? 1.2;

  // 如果定义了 titleTop，则使用独立定位逻辑
  const useIndependentPositioning = config.titleTop !== undefined;
  // 独立定位时的默认标题起点（未显式设置 titleTop 时使用）
  const minTitleTop = config.top + config.nameSize + (config.titleMarginTop ?? 10);
  const resolvedTitleTop = useIndependentPositioning
    ? (config.titleTop ?? minTitleTop)
    : undefined;

  const nameTop = config.top;
  const nameBottom = config.top + config.nameSize;
  const titleTopInCard = titleLines.length > 0
    ? (useIndependentPositioning
      ? (resolvedTitleTop ?? minTitleTop)
      : (nameBottom + (config.titleMarginTop ?? 10)))
    : undefined;
  const titleBottomInCard = titleTopInCard !== undefined
    ? titleTopInCard + titleLines.length * config.titleSize * titleLineHeight
    : nameBottom;
  const cardTop = Math.min(nameTop, titleTopInCard ?? nameTop);
  const cardBottom = Math.max(nameBottom, titleBottomInCard);
  const accentCover = config.accentLine?.cover ?? 'card';
  const accentBaseTop = accentCover === 'title'
    ? (titleTopInCard ?? cardTop)
    : cardTop;
  const accentBaseBottom = accentCover === 'title'
    ? (titleBottomInCard ?? cardBottom)
    : cardBottom;
  const accentLineTop = config.accentLine
    ? (config.accentLine.top ?? (accentBaseTop + (config.accentLine.topOffset ?? 0)))
    : 0;
  const accentLineHeight = config.accentLine
    ? (config.accentLine.height ?? Math.max(1, (accentBaseBottom + (config.accentLine.bottomOffset ?? 0)) - accentLineTop))
    : 0;

  return (
    <>
      {config.background && (
        <div
          style={{
            position: 'absolute',
            left: (config.background.left ?? 0) * scaleX,
            right: (config.background.right ?? 0) * scaleX,
            top: config.background.top * scaleY,
            height: config.background.bottom === undefined
              ? (config.background.height ?? 0) * scaleY
              : undefined,
            bottom: config.background.bottom !== undefined
              ? config.background.bottom * scaleY
              : undefined,
            background: config.background.color,
            borderRadius: (config.background.borderRadius ?? 0) * scaleY,
            borderTop: (config.background.borderTopWidth ?? 0) > 0
              ? `${(config.background.borderTopWidth ?? 0) * scaleY}px solid ${config.background.borderTopColor ?? 'rgba(255,255,255,0.35)'}`
              : undefined,
            opacity,
          }}
        />
      )}

      {config.accentLine && (
        <div
          style={{
            position: 'absolute',
            left: config.accentLine.left * scaleX,
            top: accentLineTop * scaleY,
            width: config.accentLine.width * scaleX,
            height: accentLineHeight * scaleY,
            background: config.accentLine.color,
            borderRadius: (config.accentLine.borderRadius ?? 0) * scaleY,
            transform: `rotate(${config.accentLine.rotateDeg ?? 0}deg)`,
            transformOrigin: 'center',
            boxShadow: config.accentLine.shadow,
            opacity,
            zIndex: 1,
          }}
        />
      )}

      {/* 名字部分 */}
      <div
        style={{
          position: 'absolute',
          left: config.left * scaleX,
          top: config.top * scaleY,

          transform: config.textAlign === 'left' ? 'translateX(0)' : config.textAlign === 'right' ? 'translateX(-100%)' : 'translateX(-50%)',
          fontFamily: config.nameFontFamily || config.fontFamily,
          opacity,
          width: 'fit-content', // Allow width to fit for proper centering/alignment behavior
          textAlign: config.textAlign || 'center',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: config.nameSize * scaleY,
            color: config.nameColor,
            fontWeight: config.nameFontWeight ?? 'bold',
            fontStyle: config.nameFontStyle,
            WebkitTextStroke: (config.nameStrokeWidth ?? 4) > 0
              ? `${(config.nameStrokeWidth ?? 4) * scaleY}px ${config.nameStrokeColor ?? 'black'}`
              : undefined,
            textShadow: config.nameShadow,
            paintOrder: 'stroke fill',
          }}
        >
          {renderPerCharText(
            name,
            {
              transform: config.nameCharTransform,
              transformOrigin: config.nameCharTransformOrigin,
            },
            'speaker-name'
          )}
        </div>

        {/* 如果没有独立定位，标题紧跟名字下方 */}
        {!useIndependentPositioning && titleLines.map((line, index) => (
          <div
            key={index}
            style={{
              fontFamily: config.titleFontFamily || config.fontFamily,
              fontSize: config.titleSize * scaleY,
              color: config.titleColor,
              fontWeight: config.titleFontWeight ?? 'bold',
              fontStyle: config.titleFontStyle,
              marginTop: index === 0 ? (config.titleMarginTop ?? 10) * scaleY : undefined,
              lineHeight: titleLineHeight,
              WebkitTextStroke: (config.titleStrokeWidth ?? ((config.nameStrokeWidth ?? 4) * 0.8)) > 0
                ? `${(config.titleStrokeWidth ?? ((config.nameStrokeWidth ?? 4) * 0.8)) * scaleY}px ${config.nameStrokeColor ?? 'black'}`
                : undefined,
              textShadow: config.titleShadow,
              paintOrder: 'stroke fill',
            }}
          >
            {renderPerCharText(
              line,
              {
                transform: config.titleCharTransform,
                transformOrigin: config.titleCharTransformOrigin,
              },
              `speaker-title-inline-${index}`
            )}
          </div>
        ))}
      </div>

      {/* 独立定位的标题部分 */}
      {useIndependentPositioning && (
        <div
          style={{
            position: 'absolute',
            left: (config.titleLeft ?? config.left) * scaleX,
            top: (resolvedTitleTop ?? 0) * scaleY,

            transform: config.textAlign === 'left' ? 'translateX(0)' : config.textAlign === 'right' ? 'translateX(-100%)' : 'translateX(-50%)',
            fontFamily: config.titleFontFamily || config.fontFamily,
            opacity,
            textAlign: config.textAlign || 'center',
            zIndex: 1,
          }}
        >
          {titleLines.map((line, index) => (
            <div
              key={index}
              style={{
                fontFamily: config.titleFontFamily || config.fontFamily,
                fontSize: config.titleSize * scaleY,
                color: config.titleColor,
                fontWeight: config.titleFontWeight ?? 'bold',
                fontStyle: config.titleFontStyle,
                lineHeight: titleLineHeight,
                WebkitTextStroke: (config.titleStrokeWidth ?? ((config.nameStrokeWidth ?? 4) * 0.8)) > 0
                  ? `${(config.titleStrokeWidth ?? ((config.nameStrokeWidth ?? 4) * 0.8)) * scaleY}px ${config.nameStrokeColor ?? 'black'}`
                  : undefined,
                textShadow: config.titleShadow,
                paintOrder: 'stroke fill',
              }}
            >
              {renderPerCharText(
                line,
                {
                  transform: config.titleCharTransform,
                  transformOrigin: config.titleCharTransformOrigin,
                },
                `speaker-title-independent-${index}`
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export const StaticInfoDisplay: React.FC<Props> = ({ info, template, subtitles }) => {
  const { layout } = template;
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // 计算缩放比例
  const scaleX = width / DESIGN_WIDTH;
  const scaleY = height / DESIGN_HEIGHT;

  const subtitleTimeline = buildSubtitleTimeline(subtitles, fps);
  const titleDisplayRange = resolveDisplayRange(
    {
      display: layout.title?.display,
      defaultDurationFrames: durationInFrames,
    },
    subtitleTimeline,
    fps,
    durationInFrames
  );
  const speakerDisplayRange = resolveDisplayRange(
    {
      display: layout.speaker?.display,
      alwaysVisible: layout.speaker?.alwaysVisible,
      defaultDurationFrames: SPEAKER_DISPLAY_SECONDS * fps,
    },
    subtitleTimeline,
    fps,
    durationInFrames
  );
  const avatarDurationFrames = layout.avatar?.alwaysVisible
    ? durationInFrames
    : SPEAKER_DISPLAY_SECONDS * fps;
  const mergedTitleHighlights: TitleHighlight[] = [
    ...(Array.isArray(info.titleHighlights) ? info.titleHighlights : []),
    ...(Array.isArray(layout.title?.highlights) ? layout.title.highlights : []),
  ].filter((item): item is TitleHighlight => {
    return Boolean(item?.keyword) && typeof item.keyword === 'string';
  });

  return (
    <>
      {info.avatarUrl && layout.avatar && (
        <Sequence from={0} durationInFrames={avatarDurationFrames}>
          <AvatarWithFade
            avatarUrl={info.avatarUrl}
            config={layout.avatar}
            scaleX={scaleX}
            scaleY={scaleY}
            fps={fps}
            durationInFrames={durationInFrames}
          />
        </Sequence>
      )}
      {info.title && layout.title && (
        <Sequence from={titleDisplayRange.from} durationInFrames={titleDisplayRange.durationInFrames}>
          <TitleWithFade
            title={info.title}
            config={{
              ...layout.title,
              highlights: mergedTitleHighlights,
            }}
            scaleX={scaleX}
            scaleY={scaleY}
            fps={fps}
            durationInFrames={titleDisplayRange.durationInFrames}
          />
        </Sequence>
      )}
      {info.speaker && layout.speaker && (
        <Sequence from={speakerDisplayRange.from} durationInFrames={speakerDisplayRange.durationInFrames}>
          <SpeakerWithFade
            name={info.speaker}
            title={info.speakerTitle}
            config={layout.speaker}
            scaleX={scaleX}
            scaleY={scaleY}
            fps={fps}
            durationInFrames={speakerDisplayRange.durationInFrames}
            disableFade={speakerDisplayRange.disableFade}
          />
        </Sequence>
      )}
    </>
  );
};
