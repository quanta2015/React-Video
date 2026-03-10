import { VideoTemplate } from '../../types'

/** 第二十三套模板 - 标题叙黑体，字幕叙黑体 */
export const T23Template: VideoTemplate = {
  name: 't23',
  description: '第二十三套模板 - 叙黑体棕白字幕，放大动画',

  subtitleStyles: {
    // 棕色 - 默认样式（12号）
    default: {
      fontFamily: '字语叙黑体Bold',
      fontSize: 92,
      color: 'rgba(245, 183, 72, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色 - 强调样式（10号）
    emphasis: {
      fontFamily: '字语叙黑体Bold',
      fontSize: 84,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色 - 第三句样式（9号）
    tertiary: {
      fontFamily: '字语叙黑体Bold',
      fontSize: 76,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    keyword: {
      color: 'rgba(245, 183, 72, 1)',
    },
  },

  // 字体动画：放大
  animations: {
    subtitleIn: ['zoomIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'bounce',
  },

  // 画面特效：渐渐放大，缩小
  videoEffects: ['zoomIn', 'zoomOut'],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    { effect: 'zoomIn', subtitleScreen: 1, startSfx: 'transitionWhoosh' },
    { effect: 'snapZoom', subtitleScreen: 3, startSfx: 'transitionWhoosh' }
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 122,
    title: {
      top: 134,
      fontSize: 104,
      fontFamily: '字语叙黑体Bold',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 170,
      top: 1010,
      fontFamily: 'System',
      nameFontFamily: '三极榜楷简体',
      titleFontFamily: '三极榜楷简体',
      nameSize: 46,
      nameColor: '#000000',
      nameStrokeWidth: 0,
      nameShadow: 'none',
      titleSize: 34,
      titleColor: '#000000',
      titleStrokeWidth: 0,
      titleShadow: 'none',
      textAlign: 'left',
      titleMarginTop: 8,
    },
  },
}

