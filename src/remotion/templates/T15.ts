import { VideoTemplate } from '../../types'

/** 第十五套模板 - 标题/字幕抖音体 */
export const T15Template: VideoTemplate = {
  name: 't15',
  description: '第十五套模板 - 抖音体紫白风格，打字动画',

  subtitleStyles: {
    // 白色 - 默认样式（8号）
    default: {
      fontFamily: '抖音美好体',
      fontSize: 72,
      color: '#FFFFFF',
    },
    // 紫色 - 强调样式（8号）
    emphasis: {
      fontFamily: '抖音美好体',
      fontSize: 72,
      color: 'rgba(104, 99, 217, 1)',
    },
    // 白色 - 第三句样式
    tertiary: {
      fontFamily: '抖音美好体',
      fontSize: 72,
      color: '#FFFFFF',
    },
    keyword: {
      color: 'rgba(104, 99, 217, 1)',
    },
  },

  // 字体动画：打字
  animations: {
    subtitleIn: ['typeWriter'],
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
    subtitleBottom: 336,
    lineHeight: 120,
    title: {
      top: 142,
      fontSize: 76,
      fontFamily: '抖音美好体',
      fontStyle: 'italic',
      color: 'rgba(104, 99, 217, 1)',
      secondLineColor: '#FFFFFF',
      lineHeight: 1.2,
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

