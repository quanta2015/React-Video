import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { TitleAnimationName, TitleHighlight, TitleHighlightStyle, VideoTemplate } from '../../../types';
import { renderPerCharText } from '../../utils/charTransform';

/** 淡入淡出时长（毫秒） */
const FADE_DURATION_MS = 500;
/** 标题入场动效默认时长（毫秒） */
const TITLE_ANIMATION_DURATION_MS = 520;
/** 标题从下向上弹出的默认位移（设计稿像素） */
const TITLE_POP_UP_OFFSET_Y = 110;

interface Props {
  title: string;
  config: VideoTemplate['layout']['title'];
  scaleX: number;
  scaleY: number;
  fps: number;
  durationInFrames: number;
}

function clampNumber(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function computeFadeOpacity(
  frame: number,
  fps: number,
  durationInFrames: number
): number {
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

function resolveTitleAnimationDurationFrames(
  fps: number,
  animationInDurationMs?: number
): number {
  const rawDurationMs = typeof animationInDurationMs === 'number' && Number.isFinite(animationInDurationMs)
    ? animationInDurationMs
    : TITLE_ANIMATION_DURATION_MS;
  const clampedDurationMs = clampNumber(rawDurationMs, 80, 3000);
  return Math.max(1, Math.round((clampedDurationMs / 1000) * fps));
}

function computeTitleEnterState(options: {
  frame: number;
  fps: number;
  scaleY: number;
  animationIn?: TitleAnimationName;
  animationInDurationMs?: number;
  animationInOffsetY?: number;
}): { opacity: number; transform?: string } {
  const animationIn = options.animationIn ?? 'fadeIn';
  if (animationIn === 'none') {
    return { opacity: 1 };
  }

  const durationFrames = resolveTitleAnimationDurationFrames(options.fps, options.animationInDurationMs);
  const clampedFrame = clampNumber(options.frame, 0, durationFrames);

  if (animationIn === 'fadeIn') {
    return {
      opacity: interpolate(clampedFrame, [0, durationFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    };
  }

  const progress = spring({
    frame: clampedFrame,
    fps: options.fps,
    durationInFrames: durationFrames,
    config: {
      damping: 11,
      stiffness: 180,
      mass: 0.7,
    },
  });
  const offsetY = (
    typeof options.animationInOffsetY === 'number' && Number.isFinite(options.animationInOffsetY)
      ? options.animationInOffsetY
      : TITLE_POP_UP_OFFSET_Y
  ) * options.scaleY;
  const translateY = interpolate(
    progress,
    [0, 0.82, 1.04, 1.12],
    [offsetY, 7 * options.scaleY, -10 * options.scaleY, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const scale = interpolate(progress, [0, 0.78, 1.02, 1.12], [0.93, 1.01, 1.045, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(progress, [0, 0.2, 1], [0, 0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    opacity,
    transform: `translateY(${translateY}px) scale(${scale})`,
  };
}

export const TitleWithFade: React.FC<Props> = ({
  title,
  config,
  scaleX,
  scaleY,
  fps,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = computeFadeOpacity(frame, fps, durationInFrames);
  const enterState = computeTitleEnterState({
    frame,
    fps,
    scaleY,
    animationIn: config.animationIn,
    animationInDurationMs: config.animationInDurationMs,
    animationInOffsetY: config.animationInOffsetY,
  });

  const normalizedTitle = title.replace(/\\n/g, '\n');
  const lines = normalizedTitle.split('\n');

  const bg = config.background;

  const useFitContentBackground = Boolean(bg?.fitContent);
  const titleTransform = [
    useFitContentBackground ? 'translateX(-50%)' : '',
    config.transform || '',
  ]
    .filter(Boolean)
    .join(' ');
  const titleContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: config.top * scaleY,
    fontFamily: config.fontFamily,
    fontWeight: config.fontWeight ?? 'bold',
    fontStyle: config.fontStyle,
    opacity: opacity * enterState.opacity,
    transform: enterState.transform,
    transformOrigin: 'center bottom',
  };
  titleContainerStyle.left = (config.left ?? 0) * scaleX;
  if (config.width !== undefined) {
    titleContainerStyle.width = config.width * scaleX;
  } else {
    titleContainerStyle.right = (config.right ?? 0) * scaleX;
  }
  if (config.right !== undefined && config.width !== undefined) {
    titleContainerStyle.right = config.right * scaleX;
  }

  return (
    <div style={titleContainerStyle}>
      {bg && !useFitContentBackground && (
        <div
          style={{
            position: 'absolute',
            top: (bg.topOffset ?? 0) * scaleY,
            left: 0,
            right: 0,
            bottom: 0,
            background: bg.color,
            borderRadius: bg.borderRadius * scaleY,
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          padding: bg ? `${bg.paddingY * scaleY}px ${bg.paddingX * scaleX}px` : undefined,
          background: useFitContentBackground ? bg?.color : undefined,
          borderRadius: useFitContentBackground ? (bg?.borderRadius ?? 0) * scaleY : undefined,
          display: useFitContentBackground ? 'inline-block' : undefined,
          left: useFitContentBackground ? '50%' : undefined,
          transform: titleTransform || undefined,
          transformOrigin: config.transformOrigin,
        }}
      >
        {lines.map((line, index) => {
          const lineFontFamily = index === 0 ? config.fontFamily : (config.secondLineFontFamily ?? config.fontFamily);
          const lineFontSize = index === 0 ? config.fontSize : (config.secondLineFontSize ?? config.fontSize);
          const lineStrokeWidth = index === 0 ? config.strokeWidth : (config.secondLineStrokeWidth ?? config.strokeWidth);
          const isOutsideStroke = config.strokeAlign === 'outside' && (lineStrokeWidth ?? 0) > 0;
          const lineDefaultColor = index === 0 ? config.color : (config.secondLineColor || config.color);
          const titleHighlights = (config.highlights ?? []).filter((item): item is TitleHighlight =>
            Boolean(item?.keyword) && typeof item.keyword === 'string'
          );

          const renderText = (
            textContent: string,
            lineIndex: number,
            segmentKey: string,
            styleOverride?: {
              color?: string;
              strokeColor?: string;
              strokeWidth?: number;
              textShadow?: string;
            } | TitleHighlightStyle
          ) => {
            const resolvedColor = styleOverride?.color ?? lineDefaultColor;
            const resolvedStrokeColor = styleOverride?.strokeColor ?? config.strokeColor ?? 'black';
            const resolvedStrokeWidth = styleOverride?.strokeWidth ?? lineStrokeWidth;
            const resolvedTextShadow = styleOverride?.textShadow ?? config.textShadow;
            const baseTextStyle: React.CSSProperties = {
              display: 'inline-block',
              fontFamily: lineFontFamily,
              lineHeight: config.lineHeight ?? 1.3,
              fontSize: lineFontSize * scaleY,
              color: resolvedColor,
              letterSpacing: config.letterSpacing ? config.letterSpacing * scaleX : undefined,
              textShadow: resolvedTextShadow,
            };
            const centerStrokeStyle: React.CSSProperties = {
              ...baseTextStyle,
              WebkitTextStroke: resolvedStrokeWidth
                ? `${resolvedStrokeWidth * scaleY}px ${resolvedStrokeColor}`
                : undefined,
              paintOrder: (config.paintOrder ?? 'stroke fill') as any,
            };
            const perCharText = renderPerCharText(
              textContent,
              {
                transform: config.charTransform,
                transformOrigin: config.charTransformOrigin,
              },
              `title-line-${lineIndex}-${segmentKey}`
            );
            if (isOutsideStroke) {
              const strokePx = (resolvedStrokeWidth ?? 0) * scaleY;
              return (
                // 使用同一网格叠层，避免绝对定位带来的字形错位
                <span style={{ display: 'inline-grid' }} key={`title-seg-${lineIndex}-${segmentKey}`}>
                  <span
                    style={{
                      ...baseTextStyle,
                      gridArea: '1 / 1',
                      WebkitTextStroke: `${strokePx * 2}px ${resolvedStrokeColor}`,
                      color: 'transparent',
                      textShadow: undefined,
                      paintOrder: (config.paintOrder ?? 'stroke fill') as any,
                    }}
                    aria-hidden
                  >
                    {perCharText}
                  </span>
                  <span style={{ ...baseTextStyle, gridArea: '1 / 1' }}>{perCharText}</span>
                </span>
              );
            }
            return <span style={centerStrokeStyle} key={`title-seg-${lineIndex}-${segmentKey}`}>{perCharText}</span>;
          };

          const splitByHighlights = (lineText: string) => {
            if (titleHighlights.length === 0) return [{ text: lineText }];
            const segments: Array<{
              text: string;
              highlight?: TitleHighlightStyle;
            }> = [];
            let cursor = 0;

            while (cursor < lineText.length) {
              let bestMatch: { start: number; keyword: string; index: number } | undefined;
              titleHighlights.forEach((item, itemIndex) => {
                const start = lineText.indexOf(item.keyword, cursor);
                if (start < 0) return;
                if (!bestMatch || start < bestMatch.start) {
                  bestMatch = { start, keyword: item.keyword, index: itemIndex };
                  return;
                }
                if (start === bestMatch.start && item.keyword.length > bestMatch.keyword.length) {
                  bestMatch = { start, keyword: item.keyword, index: itemIndex };
                }
              });

              if (!bestMatch) {
                const plain = lineText.slice(cursor);
                if (plain) segments.push({ text: plain });
                break;
              }

              if (bestMatch.start > cursor) {
                segments.push({ text: lineText.slice(cursor, bestMatch.start) });
              }

              const matchedConfig = titleHighlights[bestMatch.index];
              segments.push({
                text: bestMatch.keyword,
                highlight: {
                  color: matchedConfig.color,
                  strokeColor: matchedConfig.strokeColor,
                  strokeWidth: matchedConfig.strokeWidth,
                  textShadow: matchedConfig.textShadow,
                },
              });
              cursor = bestMatch.start + bestMatch.keyword.length;
            }

            return segments.filter((item) => item.text.length > 0);
          };

          const renderLineText = (lineText: string, lineIndex: number) => {
            const segments = splitByHighlights(lineText);
            if (segments.length === 1 && !segments[0].highlight) {
              return renderText(segments[0].text, lineIndex, 'whole');
            }
            return (
              <span style={{ display: 'inline' }}>
                {segments.map((segment, segmentIndex) =>
                  renderText(
                    segment.text,
                    lineIndex,
                    `seg-${segmentIndex}`,
                    segment.highlight
                  )
                )}
              </span>
            );
          };

          const useLineBackground = Boolean(config.lineBackground);
          const lineBackground = config.lineBackground;
          const lineBackgroundColor = lineBackground?.colors?.[index] ?? lineBackground?.color;
          const backgroundMode = lineBackground?.mode ?? 'box';
          const isStripeBackground = useLineBackground && backgroundMode === 'stripe';
          return (
            <div
              key={index}
              style={{
                textAlign: config.lineAlign?.[index] ?? config.textAlign ?? 'center',
                marginTop: (config.lineOffsetY?.[index] ?? 0) * scaleY,
                marginBottom: index < lines.length - 1 && lineBackground?.marginBottom
                  ? lineBackground.marginBottom * scaleY
                  : 0,
              }}
            >
              {useLineBackground ? (
                isStripeBackground ? (
                  <span
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: -((lineBackground?.paddingX ?? 0) * scaleX),
                        right: -((lineBackground?.paddingX ?? 0) * scaleX),
                        top: (((lineBackground?.topRatio ?? 0.5) * lineFontSize) + (lineBackground?.paddingY ?? 0)) * scaleY,
                        height: ((lineBackground?.heightRatio ?? 0.5) * lineFontSize) * scaleY,
                        background: lineBackgroundColor,
                        borderRadius: (lineBackground?.borderRadius ?? 0) * scaleY,
                        zIndex: 0,
                      }}
                    />
                    <span style={{ position: 'relative', zIndex: 1 }}>{renderLineText(line, index)}</span>
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      background: lineBackgroundColor,
                      padding: `${(lineBackground?.paddingY ?? 0) * scaleY}px ${(lineBackground?.paddingX ?? 0) * scaleX}px`,
                      borderRadius: (lineBackground?.borderRadius ?? 0) * scaleY,
                    }}
                  >
                    {renderLineText(line, index)}
                  </span>
                )
              ) : (
                renderLineText(line, index)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
