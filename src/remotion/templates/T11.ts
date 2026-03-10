import { VideoTemplate } from '../../types'

/** 第十一套模板 - 标题倔强黑，字幕倔强黑 */
export const T11Template: VideoTemplate = {
  name: 't11',
  description: '第十一套模板 - 倔强黑白橙粉字幕，弹入/上滑/渐显/滑出',

  subtitleStyles: {
    // 白色 - 默认样式（11号）
    default: {
      fontFamily: '倔强黑',
      fontSize: 84,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
    },
    // 黄色橙调 - 强调样式（8号）
    emphasis: {
      fontFamily: '倔强黑',
      fontSize: 72,
      color: 'rgba(237, 164, 59, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
    },
    // 粉色 - 第三句样式（7号）
    tertiary: {
      fontFamily: '倔强黑',
      fontSize: 64,
      color: 'rgba(229, 84, 86, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
    },
    keyword: {
      color: 'rgba(237, 164, 59, 1)',
    },
  },

  // 字体动画：弹入，向上滑动，渐隐，放大，渐显，向右滑出
  animations: {
    subtitleIn: ['bounce', 'slideUp', 'zoomIn', 'fadeIn', 'slideRightOut'],
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
    lineHeight: 120,
    title: {
      top: 142,
      fontSize: 88,
      fontFamily: '倔强黑',
      color: '#FFFFFF',
      secondLineColor: 'rgba(237, 164, 59, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
      lineHeight: 1.2,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 170,
      top: 1010,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: 'rgba(237, 164, 59, 1)',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 32,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 10,
    },
  },
}

