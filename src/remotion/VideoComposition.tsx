import React, { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { StyledSubtitle, StaticInfo, VideoTemplate, PipMedia, SubtitleStyle } from '../types';
import { SubtitleGroup } from './components/SubtitleGroup';
import { StaticInfoDisplay } from './components/StaticInfo';
import { VideoWithEffects } from './components/VideoEffects';
import { PictureInPicture } from './components/PictureInPicture';
import { FontLoader } from './components/FontLoader';

import { z } from 'zod';
import { videoCompositionSchema } from '../types/schema';

export type VideoCompositionProps = z.infer<typeof videoCompositionSchema>;

/**
 * Remotion 主合成组件：
 * - 负责组织背景视频 / 画中画 / 静态信息 / 字幕四层
 * - 在渲染前收集并预加载当前模板会用到的字体
 */
export const VideoComposition: React.FC<VideoCompositionProps> = ({
  subtitles,
  staticInfo,
  videoSrc,
  pipOnlyMode = false,
  template,
  pipMediaList,
  plannedVideoEffects,
}) => {
  // 仅根据模板配置收集字体，避免全量加载字体导致首帧等待过长。
  const requiredFonts = useMemo(() => {
    const fonts = new Set<string>();
    const { subtitleStyles, layout } = template;

    // 防御式校验：仅接受包含 fontFamily 的样式对象。
    const isRenderableStyle = (style: unknown): style is SubtitleStyle => {
      if (!style || typeof style !== 'object') return false;
      const candidate = style as Partial<SubtitleStyle>;
      return typeof candidate.fontFamily === 'string' && candidate.fontFamily.length > 0;
    };

    // 基础字幕样式字体。
    Object.entries(subtitleStyles).forEach(([styleName, style]) => {
      if (!isRenderableStyle(style)) return;
      // 模板里常写 "FontA, sans-serif"，这里只取第一候选字体名用于 FontLoader 匹配。
      fonts.add(style.fontFamily.split(',')[0].trim());
    });

    // 变体样式池（oneLine/twoLine/threeLine）里可能引入额外字体，也需要纳入预加载。
    const variantConfigs = [
      template.subtitleStyleVariants?.oneLine,
      template.subtitleStyleVariants?.twoLine,
      template.subtitleStyleVariants?.threeLine,
    ];
    variantConfigs.forEach((variant) => {
      if (!variant) return;
      const pools = [variant.default, variant.emphasis, variant.tertiary, variant.keyword];
      pools.forEach((pool) => {
        if (!Array.isArray(pool)) return;
        pool.forEach((style) => {
          if (!isRenderableStyle(style)) return;
          fonts.add(style.fontFamily.split(',')[0].trim());
        });
      });
    });

    // 标题与主讲人区域使用的字体。
    fonts.add(layout.title.fontFamily.split(',')[0].trim());
    if (layout.title.secondLineFontFamily) {
      fonts.add(layout.title.secondLineFontFamily.split(',')[0].trim());
    }
    fonts.add(layout.speaker.fontFamily.split(',')[0].trim());
    if (layout.speaker.nameFontFamily) {
      fonts.add(layout.speaker.nameFontFamily.split(',')[0].trim());
    }
    if (layout.speaker.titleFontFamily) {
      fonts.add(layout.speaker.titleFontFamily.split(',')[0].trim());
    }
    return Array.from(fonts);
  }, [template]);

  return (
    // 等字体准备好再继续渲染，避免首帧闪烁/字体回退造成布局抖动。
    <FontLoader requiredFonts={requiredFonts}>
      <AbsoluteFill>
        {/* 背景视频（带特效） - z-index: 10 */}
        <AbsoluteFill style={{ zIndex: 10 }}>
          <VideoWithEffects
            videoSrc={videoSrc}
            template={template}
            pipMediaList={pipMediaList}
            subtitles={subtitles}
            plannedEffects={plannedVideoEffects}
          />
        </AbsoluteFill>

        {/* 静态信息层 - z-index: 100 */}
        <AbsoluteFill style={{ zIndex: 100 }}>
          {staticInfo && (
            <StaticInfoDisplay info={staticInfo} template={template} subtitles={subtitles} />
          )}
        </AbsoluteFill>

        {/* 画中画层 - z-index: 200（覆盖标题/主讲人静态信息） */}
        {pipMediaList && pipMediaList.length > 0 && (
          <AbsoluteFill style={{ zIndex: 200 }}>
            <PictureInPicture
              // 人物画中画模板会启用 noGap 模式（PIP 片段之间不强制留空档）。
              mediaList={pipMediaList}
              noGapMode={pipOnlyMode || template.name.includes('人物画中画')}
              fillTimelineMode={pipOnlyMode}
              template={template}
              subtitles={subtitles}
            />
          </AbsoluteFill>
        )}

        {/* 字幕层 - z-index: 300 */}
        <AbsoluteFill style={{ zIndex: 300 }}>
          <SubtitleGroup subtitles={subtitles} template={template} />
        </AbsoluteFill>
      </AbsoluteFill>
    </FontLoader>
  );
};
