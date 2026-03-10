import { VideoTemplate } from '../../types'

/** 第九套模板 - 标题云黑，字幕云黑 */
export const T9Template: VideoTemplate = {
  name: 't9',
  description: '第九套模板 - 云黑黄棕白字幕，打字/甩入/波浪系列动画',

  subtitleStyles: {
    // 黄色 - 默认样式（9号）
    default: {
      fontFamily: '云黑',
      fontSize: 78,
      color: 'rgba(237, 225, 79, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 棕色 - 强调样式（8号）
    emphasis: {
      fontFamily: '云黑',
      fontSize: 72,
      color: 'rgba(239, 187, 86, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 白色 - 第三句样式（8号）
    tertiary: {
      fontFamily: '云黑',
      fontSize: 72,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(237, 225, 79, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
  },

  // 字体动画：放大，渐显，向下滑动，打字，甩入，波浪，波浪弹入
  animations: {
    subtitleIn: ['zoomIn', 'fadeIn', 'slideDown', 'typeWriter', 'swingIn', 'wave', 'waveIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'bounce',
  },

  // 画面特效：渐渐放大，缩小，放大镜
  videoEffects: ['zoomIn', 'zoomOut', 'magnifier'],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    { effect: 'zoomIn', subtitleScreen: 1, startSfx: 'transitionWhoosh' },
    { effect: 'snapZoom', subtitleScreen: 3, startSfx: 'transitionWhoosh' }
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 328,
    lineHeight: 122,
    title: {
      top: 140,
      fontSize: 88,
      fontFamily: '云黑',
      color: 'rgba(237, 225, 79, 1)',
      secondLineColor: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
      lineHeight: 1.2,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 170,
      top: 1008,
      fontFamily: 'System',
      nameSize: 46,
      nameColor: 'rgba(237, 225, 79, 1)',
      nameStrokeWidth: 2,
      nameStrokeColor: '#000000',
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 34,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 2,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 8,
    },
  },
}

