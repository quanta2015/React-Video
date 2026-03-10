import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence, Easing, interpolate } from 'remotion';
import { Animated, type Animation } from './animations/remotionAnimatedCompat';
import { StyledSubtitle, SubtitleCarrySplitConfig, SubtitleStyle, VideoTemplate } from '../../types';
import { msToFrame } from '../../utils/time';
import { KeywordHighlight } from './KeywordHighlight';
import {
  getInAnimation,
  getOutAnimation,
  MANUAL_ANIMATION_COMPONENTS,
  shouldDisableKeywordEffect,
} from './animations/animations';
import { getSubtitleLayoutPreset, resolveSubtitleLinePlacement } from '../../subtitles/layoutPresets';
import { renderPerCharText } from '../utils/charTransform';


interface Props {
  subtitle: StyledSubtitle;
  nextSubtitle?: StyledSubtitle;
  carrySplitConfig?: Pick<SubtitleCarrySplitConfig, 'transitionFrames' | 'offsetY' | 'centerGap' | 'opacity'>;
  template: VideoTemplate;
}


/** 设计基准尺寸 */
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;

export const SubtitleLine: React.FC<Props> = ({ subtitle, nextSubtitle, carrySplitConfig, template }) => {
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const subtitleLayoutPreset = getSubtitleLayoutPreset(template.layout.subtitleLayoutPreset);
  const bilingualConfig = template.layout.bilingual;

  // 计算缩放比例
  const scaleX = width / DESIGN_WIDTH;
  const scaleY = height / DESIGN_HEIGHT;

  const startFrame = msToFrame(subtitle.start, fps);
  const groupEndFrame = msToFrame(subtitle.groupEnd, fps);
  // 从自己的 start 开始显示，持续到 group 结束
  const durationFrames = Math.max(1, groupEndFrame - startFrame);
  const localFrame = frame - startFrame;

  // 获取样式
  let effectiveStyleType = subtitle.styleType;
  const useScreenStyleVariants = Boolean(template.subtitleStyleVariants);
  const isRenderableStyle = (style: unknown): style is SubtitleStyle => {
    if (!style || typeof style !== 'object') return false;
    const candidate = style as Partial<SubtitleStyle>;
    return (
      typeof candidate.fontFamily === 'string' &&
      typeof candidate.fontSize === 'number' &&
      typeof candidate.color === 'string'
    );
  };
  // 三行混排布局下，第3句使用 tertiary 样式
  if (!useScreenStyleVariants && subtitleLayoutPreset.name === 'threeLineOverlay' && subtitle.totalInGroup === 3) {
    if (subtitle.position === 0 || subtitle.position === 1) {
      effectiveStyleType = 'default';
    } else if (subtitle.position === 2) {
      effectiveStyleType = 'tertiary';
    }
  }
  const styleCandidate = effectiveStyleType === 'keyword' ? undefined : template.subtitleStyles[effectiveStyleType];
  const baseStyleConfig = isRenderableStyle(styleCandidate) ? styleCandidate : template.subtitleStyles.default;
  const styleConfig: SubtitleStyle = {
    ...baseStyleConfig,
    ...(subtitle.styleOverride || {}),
  };
  const keywordStyleBase: Partial<SubtitleStyle> = {
    ...template.subtitleStyles.keyword,
    ...(subtitle.keywordStyleOverride || {}),
  };
  const keywordStyleConfig: Partial<SubtitleStyle> = {
    ...keywordStyleBase,
    strokeWidth: keywordStyleBase.strokeWidth ?? styleConfig.strokeWidth,
    strokeColor: keywordStyleBase.strokeColor ?? styleConfig.strokeColor,
    paintOrder: keywordStyleBase.paintOrder ?? styleConfig.paintOrder,
  };
  const showEnglishByConfig = (() => {
    if (!bilingualConfig?.enabled) return false;
    if (!subtitle.enText) return false;
    if ((bilingualConfig.hideEnglishOnThirdLine ?? true) && subtitle.totalInGroup === 3 && subtitle.position === 2) {
      return false;
    }
    return true;
  })();

  // 构建动画数组 - 使用字幕自身的动画配置
  const animations: Animation[] = [];
  const inAnim = getInAnimation(subtitle.animationIn, durationFrames);
  const outAnim = getOutAnimation(subtitle.animationOut, durationFrames);
  if (inAnim) {
    if (Array.isArray(inAnim)) animations.push(...inAnim);
    else animations.push(inAnim);
  }
  if (outAnim) animations.push(outAnim);

  const linePlacement = resolveSubtitleLinePlacement({
    layout: template.layout,
    position: subtitle.position,
    totalInGroup: subtitle.totalInGroup,
    scaleX,
    scaleY,
  });
  // 缩放字体大小
  const scaledFontSize = (styleConfig.fontSize || 50) * scaleY;
  const scaledEnglishFontSize =
    bilingualConfig?.fontSize !== undefined
      ? bilingualConfig.fontSize * scaleY
      : scaledFontSize * (bilingualConfig?.fontSizeScale ?? 0.32);
  const scaledEnglishGap =
    bilingualConfig?.lineGap !== undefined
      ? bilingualConfig.lineGap * scaleY
      : Math.max(8 * scaleY, scaledEnglishFontSize * 0.14);
  const baseStackStep = template.layout.lineHeight * scaleY;
  const chineseSafetyPadding = scaledFontSize * 0.12;
  const englishVerticalDemand = showEnglishByConfig ? scaledEnglishFontSize + scaledEnglishGap : 0;
  const subtitleBlockHeight = scaledFontSize + chineseSafetyPadding + englishVerticalDemand;
  const stackMinExtra = (bilingualConfig?.stackExtraGap ?? 0) * scaleY;
  const effectiveStackStep = Math.max(baseStackStep + stackMinExtra, subtitleBlockHeight);
  const additionalStep = Math.max(0, effectiveStackStep - baseStackStep);
  const bilingualStackOffset = (() => {
    if (!bilingualConfig?.enabled || subtitle.totalInGroup <= 1) {
      return 0;
    }

    // 三句覆盖布局：保持第3句始终位于第1句与第2句的垂直中点
    if (subtitleLayoutPreset.name === 'threeLineOverlay' && subtitle.totalInGroup === 3) {
      if (subtitle.position === 0) return additionalStep;
      if (subtitle.position === 1) return 0;
      return additionalStep * 0.5;
    }

    // 双句左右布局：提高第1句，保持第2句锚定
    if (subtitleLayoutPreset.name === 'threeLineOverlay' && subtitle.totalInGroup === 2) {
      return subtitle.position === 0 ? additionalStep : 0;
    }

    return additionalStep * (subtitle.totalInGroup - 1 - subtitle.position);
  })();
  const subtitleLineOffsetY = (
    subtitle.lineOffsetYOverride
    ?? template.layout.subtitleLineOffsetY?.[subtitle.position]
    ?? 0
  ) * scaleY;
  const subtitleVerticalCenter = template.layout.subtitleVerticalCenter;
  const resolvedBottom = (() => {
    if (!subtitleVerticalCenter?.enabled || subtitleLayoutPreset.name === 'threeLineOverlay') {
      return linePlacement.bottom + bilingualStackOffset + subtitleLineOffsetY;
    }

    const safeTotal = Math.max(subtitle.totalInGroup, 1);
    const centerYRatioRaw = subtitleVerticalCenter.centerYRatio;
    const centerYRatio = typeof centerYRatioRaw === 'number' && Number.isFinite(centerYRatioRaw)
      ? Math.min(Math.max(centerYRatioRaw, 0), 1)
      : 0.5;
    const centerY = height * centerYRatio + (subtitleVerticalCenter.offsetY ?? 0) * scaleY;
    const groupTotalHeight = subtitleBlockHeight + (safeTotal - 1) * effectiveStackStep;
    const groupTop = centerY - groupTotalHeight / 2;
    const currentLineTop = groupTop + subtitle.position * effectiveStackStep;
    const centeredBottom = height - currentLineTop - subtitleBlockHeight;
    return centeredBottom + subtitleLineOffsetY;
  })();

  // 检查是否有手动实现的动画组件
  const ManualAnimationComponent = subtitle.animationIn ? MANUAL_ANIMATION_COMPONENTS[subtitle.animationIn] : undefined;
  const disableKeywordAnimation = shouldDisableKeywordEffect(subtitle.animationIn);

  const chineseContent = (subtitle.keyword && subtitle.totalInGroup !== 3) ? (
    <KeywordHighlight
      text={subtitle.text}
      keyword={subtitle.keyword}
      keywordStyle={keywordStyleConfig}
      template={template}
      disableAnimation={disableKeywordAnimation}
      charTransform={styleConfig.charTransform}
      charTransformOrigin={styleConfig.charTransformOrigin}
    />
  ) : (
    renderPerCharText(
      subtitle.text,
      {
        transform: styleConfig.charTransform,
        transformOrigin: styleConfig.charTransformOrigin,
      },
      `subtitle-${subtitle.groupId}-${subtitle.position}`
    )
  );
  const doubleLayer = styleConfig.doubleLayer;
  const useDoubleLayer = Boolean(doubleLayer?.enabled);
  const overlayFontSize = doubleLayer?.fontSize !== undefined
    ? doubleLayer.fontSize * scaleY
    : scaledFontSize * (doubleLayer?.fontSizeScale ?? 0.62);
  const overlayStrokeWidth = doubleLayer?.strokeWidth ?? styleConfig.strokeWidth;
  const overlayStrokeColor = doubleLayer?.strokeColor ?? styleConfig.strokeColor ?? 'black';
  const overlayCharTransform = doubleLayer?.charTransform ?? styleConfig.charTransform;
  const overlayCharTransformOrigin = doubleLayer?.charTransformOrigin ?? styleConfig.charTransformOrigin;
  const layeredChineseContent = useDoubleLayer ? (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <span>{chineseContent}</span>
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${(doubleLayer?.offsetX ?? 0) * scaleX}px, ${(doubleLayer?.offsetY ?? 0) * scaleY}px)`,
          fontFamily: doubleLayer?.fontFamily ?? styleConfig.fontFamily,
          fontSize: overlayFontSize,
          color: doubleLayer?.color ?? styleConfig.color,
          fontWeight: doubleLayer?.fontWeight ?? styleConfig.fontWeight,
          lineHeight: styleConfig.lineHeight ?? 1.2,
          letterSpacing: doubleLayer?.letterSpacing ?? styleConfig.letterSpacing,
          textShadow: doubleLayer?.textShadow ?? styleConfig.textShadow,
          WebkitTextStroke: overlayStrokeWidth ? `${overlayStrokeWidth}px ${overlayStrokeColor}` : undefined,
          paintOrder: (doubleLayer?.paintOrder ?? styleConfig.paintOrder) as any,
          filter: doubleLayer?.filter ?? styleConfig.filter,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {renderPerCharText(
          subtitle.text,
          {
            transform: overlayCharTransform,
            transformOrigin: overlayCharTransformOrigin,
          },
          `subtitle-double-layer-${subtitle.groupId}-${subtitle.position}`
        )}
      </span>
    </span>
  ) : chineseContent;

  const content = (
    <div
      style={{
        width: '100%',
        textAlign: template.layout.subtitleAlign || linePlacement.textAlign,
        paddingLeft: template.layout.subtitleAlign ? 0 : linePlacement.paddingLeft,
        paddingRight: template.layout.subtitleAlign ? 0 : linePlacement.paddingRight,
        fontFamily: styleConfig.fontFamily,
        fontSize: scaledFontSize,
        lineHeight: styleConfig.lineHeight ?? 1.2,
        color: styleConfig.color,
        fontWeight: styleConfig.fontWeight,
        textShadow: styleConfig.textShadow,
        letterSpacing: styleConfig.letterSpacing,
        WebkitTextStroke: styleConfig.strokeWidth ? `${styleConfig.strokeWidth}px ${styleConfig.strokeColor || 'black'}` : undefined,
        paintOrder: styleConfig.paintOrder as any,
        filter: styleConfig.filter,
      }}
    >
      <div>
        {styleConfig.background ? (
          <span
            style={{
              display: styleConfig.background.fitContent === false ? 'block' : 'inline-block',
              background: styleConfig.background.color,
              padding: `${(styleConfig.background.paddingY ?? 0) * scaleY}px ${(styleConfig.background.paddingX ?? 0) * scaleX}px`,
              borderRadius: (styleConfig.background.borderRadius ?? 0) * scaleY,
            }}
          >
            {layeredChineseContent}
          </span>
        ) : (
          layeredChineseContent
        )}
      </div>
      {showEnglishByConfig && (
        <div
          style={{
            marginTop: scaledEnglishGap,
            fontFamily: bilingualConfig?.fontFamily || 'System',
            fontSize: scaledEnglishFontSize,
            color: bilingualConfig?.color || '#F8FAFC',
            fontWeight: bilingualConfig?.fontWeight || 'normal',
            lineHeight: 1.05,
            letterSpacing: 0.15 * scaleX,
            textShadow: styleConfig.textShadow,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {subtitle.enText}
        </div>
      )}
    </div>
  );

  const shouldEnableCarrySplit = Boolean(
    carrySplitConfig &&
    nextSubtitle &&
    nextSubtitle.start > subtitle.start &&
    !showEnglishByConfig
  );
  const splitTransitionFrames = Math.max(1, Math.round(carrySplitConfig?.transitionFrames ?? 5));
  const splitOffsetYBase = (carrySplitConfig?.offsetY ?? 32) * scaleY;
  const splitCenterGapBase = (carrySplitConfig?.centerGap ?? 6) * scaleY;
  const splitOpacity = Math.min(Math.max(carrySplitConfig?.opacity ?? 1, 0), 1);
  const splitStartFrame = shouldEnableCarrySplit
    ? msToFrame((nextSubtitle!.start - subtitle.start), fps)
    : 0;
  const splitProgress = shouldEnableCarrySplit
    ? interpolate(
      localFrame,
      [splitStartFrame, splitStartFrame + splitTransitionFrames],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      }
    )
    : 0;
  const splitActivated = shouldEnableCarrySplit && splitProgress > 0.0001;
  const splitOffsetY = splitOffsetYBase * splitProgress;
  const splitCenterGapHalf = (splitCenterGapBase * splitProgress) / 2;
  const splitTopClipBottom = `calc(50% - ${splitCenterGapHalf}px)`;
  const splitBottomClipTop = `calc(50% + ${splitCenterGapHalf}px)`;

  const contentWithCarrySplit = splitActivated ? (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      {/* 占位层：保留内容真实高度，避免 absolute 分层后撑不开布局 */}
      <div
        style={{
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {content}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          opacity: splitOpacity,
          clipPath: `inset(0 0 ${splitTopClipBottom} 0)`,
          WebkitClipPath: `inset(0 0 ${splitTopClipBottom} 0)`,
          transform: `translateY(${-splitOffsetY}px)`,
          willChange: 'transform, clip-path',
        }}
      >
        {content}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          opacity: splitOpacity,
          clipPath: `inset(${splitBottomClipTop} 0 0 0)`,
          WebkitClipPath: `inset(${splitBottomClipTop} 0 0 0)`,
          transform: `translateY(${splitOffsetY}px)`,
          willChange: 'transform, clip-path',
        }}
      >
        {content}
      </div>
    </div>
  ) : content;

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <Animated
        absolute
        animations={animations}
        style={{
          bottom: resolvedBottom,
          width: '100%',
          // 如果有 manual animation，这里就不应该再 apply 会冲突的样式，
          // 但目前 manual animation 是处理内部 clip-path/mask，外部定位由 Animated 处理
        }}
      >
        {ManualAnimationComponent ? (
          <ManualAnimationComponent
            subtitle={subtitle}
            template={template}
            fps={fps}
            durationFrames={durationFrames}
            styleConfig={styleConfig}
            scaledFontSize={scaledFontSize}
          >
            {contentWithCarrySplit}
          </ManualAnimationComponent>
        ) : (
          contentWithCarrySplit
        )}
      </Animated>
    </Sequence>
  );
};
