import React from 'react';
import { Animated, Scale } from './animations/remotionAnimatedCompat';
import { SubtitleStyle, VideoTemplate, AnimationName } from '../../types';
import { renderPerCharText } from '../utils/charTransform';

interface Props {
  text: string;
  keyword: string;
  keywordStyle: Partial<SubtitleStyle>;
  template: VideoTemplate;
  disableAnimation?: boolean;
  charTransform?: string;
  charTransformOrigin?: string;
}

/** 根据动画名称生成关键词动画配置 */
function getKeywordAnimation(name: AnimationName | AnimationName[]) {
  const animName = Array.isArray(name) ? name[0] : name;
  switch (animName) {
    case 'bounce':
      return [Scale({ by: 1, initial: 0.8, duration: 20, mass: 30 })];
    case 'scaleIn':
      return [Scale({ by: 1, initial: 0.5, duration: 15 })];
    default:
      return [];
  }
}

export const KeywordHighlight: React.FC<Props> = ({
  text,
  keyword,
  keywordStyle,
  template,
  disableAnimation = false,
  charTransform,
  charTransformOrigin,
}) => {
  // 分割文本
  const parts = text.split(keyword);
  if (parts.length === 1) {
    return <>{text}</>;
  }

  // 关键词动画
  const animations = disableAnimation ? [] : getKeywordAnimation(template.animations.keywordEffect);
  const keywordCss: React.CSSProperties = {
    display: 'inline-block',
    color: keywordStyle.color,
    fontFamily: keywordStyle.fontFamily,
    fontSize: keywordStyle.fontSize,
    fontWeight: keywordStyle.fontWeight,
    textShadow: keywordStyle.textShadow,
    letterSpacing: keywordStyle.letterSpacing,
    WebkitTextStroke: keywordStyle.strokeWidth
      ? `${keywordStyle.strokeWidth}px ${keywordStyle.strokeColor || 'black'}`
      : undefined,
    paintOrder: keywordStyle.paintOrder as any,
    filter: keywordStyle.filter,
  };
  const keywordCharTransform = keywordStyle.charTransform ?? charTransform;
  const keywordCharTransformOrigin = keywordStyle.charTransformOrigin ?? charTransformOrigin;

  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {renderPerCharText(
            part,
            {
              transform: charTransform,
              transformOrigin: charTransformOrigin,
            },
            `keyword-part-${index}`
          )}
          {index < parts.length - 1 && (
            <Animated
              animations={animations}
              style={keywordCss}
            >
              {renderPerCharText(
                keyword,
                {
                  transform: keywordCharTransform,
                  transformOrigin: keywordCharTransformOrigin,
                },
                `keyword-hit-${index}`
              )}
            </Animated>
          )}
        </React.Fragment>
      ))}
    </>
  );
};
