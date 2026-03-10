import { VideoTemplate } from '../../types'

/** 第十三套模板 - 标题经典黑，字幕云黑/倔强黑 */
export const T13Template: VideoTemplate = {
  name: 't13',
  description: '第十三套模板 - 经典黑标题，云黑/倔强黑字幕，模糊与滑动混合动画',

  subtitleStyles: {
    // 浅金色 - 默认样式（12号）
    default: {
      fontFamily: '云黑',
      fontSize: 92,
      color: 'rgba(232, 215, 168, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 橙色 - 强调样式（10号）
    emphasis: {
      fontFamily: '倔强黑',
      fontSize: 84,
      color: 'rgba(230, 178, 76, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 白色 - 第三句样式（9号）
    tertiary: {
      fontFamily: '倔强黑',
      fontSize: 78,
      color: 'rgba(251, 251, 251, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(230, 178, 76, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
  },

  // 字体动画：模糊发光，向左滑动，向上滑动，渐隐，放大，渐显，缩小
  animations: {
    subtitleIn: ['blurIn', 'slideLeft', 'slideUp', 'zoomIn', 'fadeIn', 'zoomOut'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'bounce',
  },

  // 画面特效：放大，缩小
  videoEffects: ['magnifier', 'zoomOut'],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    { effect: 'zoomIn', subtitleScreen: 1, startSfx: 'transitionWhoosh' },
    { effect: 'snapZoom', subtitleScreen: 3, startSfx: 'transitionWhoosh' }
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 326,
    lineHeight: 124,
    title: {
      top: 132,
      fontSize: 108,
      fontFamily: '经典黑',
      color: '#000000',
      secondLineColor: '#000000',
      strokeWidth: 6,
      strokeColor: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.14,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 180,
      top: 1000,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: '#FFFFFF',
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

