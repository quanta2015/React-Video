import { VideoTemplate } from '../../types'

/** 第二十套模板 - 标题鸿朗体，字幕圆体 */
export const T20Template: VideoTemplate = {
  name: 't20',
  description: '第二十套模板 - 鸿朗体花字标题，圆体黄蓝粉字幕',

  subtitleStyles: {
    // 黄色 - 默认样式（11号）
    default: {
      fontFamily: '圆体-汉仪中圆简',
      fontSize: 84,
      color: 'rgba(249, 252, 215, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 蓝色 - 强调样式（11号）
    emphasis: {
      fontFamily: '圆体-汉仪中圆简',
      fontSize: 84,
      color: 'rgba(223, 237, 255, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 粉色 - 第三句样式（11号）
    tertiary: {
      fontFamily: '圆体-汉仪中圆简',
      fontSize: 84,
      color: 'rgba(235, 195, 206, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(223, 237, 255, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
  },

  // 字体动画：波浪弹入，收拢，放大，弹入，向右滑入
  animations: {
    subtitleIn: ['waveIn', 'contract', 'zoomIn', 'bounce', 'slideRight'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'bounce',
  },

  // 画面特效：渐渐放大
  videoEffects: ['zoomIn'],
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
      fontFamily: '鸿朗体',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.18,
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

