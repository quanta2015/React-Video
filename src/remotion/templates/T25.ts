import { VideoTemplate } from '../../types'

/** 第二十五套模板 - 标题经典黑（花字），字幕黑体/粗斜体 */
export const T25Template: VideoTemplate = {
  name: 't25',
  description: '第二十五套模板 - 经典黑花字标题，黑体/粗斜体字幕',

  subtitleStyles: {
    // 粉色 - 默认样式（8号）
    default: {
      fontFamily: '方正黑体',
      fontSize: 68,
      color: 'rgba(238, 136, 202, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 黄色 - 强调样式（6号）
    emphasis: {
      fontFamily: '得意黑 斜体',
      fontSize: 58,
      color: 'rgba(233, 181, 80, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 白色 - 第三句样式（6号）
    tertiary: {
      fontFamily: '方正黑体',
      fontSize: 58,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(233, 181, 80, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
  },

  // 字体动画：向右擦除，向左滑动，旋转，弹入，放大，渐显
  animations: {
    subtitleIn: ['wipeRight', 'slideLeft', 'rotate', 'bounce', 'zoomIn', 'fadeIn'],
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
    subtitleBottom: 336,
    lineHeight: 118,
    title: {
      top: 142,
      fontSize: 88,
      fontFamily: '经典黑',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
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

