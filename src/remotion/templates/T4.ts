import { VideoTemplate } from '../../types'

/** 第四套模板 - 标题志向黑，字幕极宋/玄宋 */
export const T4Template: VideoTemplate = {
  name: 't4',
  description: '第四套模板 - 标题志向黑，字幕极宋/玄宋，线性蒙版/弹入/放大',

  subtitleStyles: {
    default: {
      fontFamily: '玄宋',
      fontSize: 90,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    emphasis: {
      fontFamily: '玄宋',
      fontSize: 90,
      color: '#F4D41A',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    tertiary: {
      fontFamily: '玄宋',
      fontSize: 95,
      color: '#F4D41A',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 关键词高亮
    keyword: {
      color: '#F4D41A',
    },
  },

  // 字体动画：线性蒙版，弹入，放大
  animations: {
    subtitleIn: ['none', 'linearMask', 'bounce', 'zoomIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },
  subtitleAnimationSequence: [
    { subtitleScreen: 2, animationIn: 'carrySplit' },
  ],

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'spotlightCenter', startSec: 0, endAfterSubtitleScreen: 2, animationIn: 'none', startSfx: 'introDong' },
    { effect: 'swipeFromRight', subtitleScreen: 7, startSfx: 'transitionWhoosh' },
    { effect: 'snapZoomSmoothDown', subtitleScreen: 9 },
    { effect: 'zoomIn', subtitleScreen: 12, startSfx: 'duangCorrect' },
  ],
  pipAnimations: ['zoomIn'],

  sfxSequence: [{ sfx: 'ding', subtitleScreen: 1 }],

  layout: {
    subtitleBottom: 320,
    lineHeight: 130,
    subtitleLayoutPreset: 'singleCenter10',
    subtitleCarrySplit: {
      enabled: true,
      transitionFrames: 4,
      offsetY: 30,
      centerGap: 8,
      opacity: 1,
      holdToNextEnd: true,
    },
    // 标题配置：志向黑，白色/黄色 + 黑阴影
    title: {
      top: 135,
      fontSize: 108,
      fontFamily: '励字志向黑简 特粗',
      color: '#FFFFFF',
      secondLineColor: '#F4D41A',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
      display: {
        startSubtitleScreen: 3,
        endSubtitleScreen: 6,
      },
    },

    // 主讲人配置：姓名新青年体、名片系统
    speaker: {
      left: 164,
      top: 1034,
      fontFamily: 'System',
      nameFontFamily: '新青年体',
      nameFontWeight: 600,
      nameFontStyle: 'italic',
      titleFontFamily: 'System',
      titleFontWeight: 700,
      titleFontStyle: 'italic',
      nameSize: 72,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 0,
      nameShadow: '0 0 4px rgba(0,0,0,1)',
      titleSize: 32,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 4px rgba(0,0,0,1)',
      titleLineHeight: 1.12,
      textAlign: 'left',
      titleMarginTop: 12,
      titleLeft: 155,
      titleTop: 1128,
      display: {
        startSubtitleScreen: 3,
        endSubtitleScreen: 6,
      },
      accentLine: {
        left: 126,
        width: 5,
        color: '#F4D41A',
        topOffset: 14,
        bottomOffset: 8,
        borderRadius: 3,
        rotateDeg: 9,
      },
    },
  },
}
