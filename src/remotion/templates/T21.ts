import { VideoTemplate } from '../../types'

/** 第二十一套模板 - 标题叙黑体，字幕经典黑/叙黑体/宋体 */
export const T21Template: VideoTemplate = {
  name: 't21',
  description: '第二十一套模板 - 叙黑体标题，经典黑/叙黑体/宋体混合字幕',

  subtitleStyles: {
    // 黄色 - 默认样式（经典黑，9号）
    default: {
      fontFamily: '经典黑',
      fontSize: 76,
      color: 'rgba(241, 215, 79, 1)',
      textShadow: '0 3px 5px rgba(0,0,0,0.8)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 棕色 - 强调样式（叙黑体，11号）
    emphasis: {
      fontFamily: '字语叙黑体Bold',
      fontSize: 92,
      color: 'rgba(238, 159, 57, 1)',
      textShadow: '0 3px 5px rgba(0,0,0,0.8)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 白色 - 第三句样式（宋体，10号）
    tertiary: {
      fontFamily: '宋体',
      fontSize: 84,
      color: '#FFFFFF',
      textShadow: '0 3px 5px rgba(0,0,0,0.8)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(241, 215, 79, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
  },

  // 字体动画：向上弹入，弹入，放大，渐显，抖动
  animations: {
    subtitleIn: ['springUp', 'bounce', 'zoomIn', 'fadeIn', 'shake'],
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
      top: 132,
      fontSize: 112,
      fontFamily: '字语叙黑体Bold',
      color: 'rgba(241, 215, 79, 1)',
      secondLineColor: '#FFFFFF',
      strokeWidth: 4,
      strokeColor: '#000000',
      lineHeight: 1.16,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 170,
      top: 1010,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 30,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 8,
    },
  },
}

