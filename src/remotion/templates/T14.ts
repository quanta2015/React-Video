import { VideoTemplate } from '../../types'

/** 第十四套模板 - 标题/字幕思源粗宋 */
export const T14Template: VideoTemplate = {
  name: 't14',
  description: '第十四套模板 - 思源粗宋主视觉，黑边白黄字幕，露出动画',

  subtitleStyles: {
    // 白色黑边 - 默认样式（8号）
    default: {
      fontFamily: '思源粗宋体',
      fontSize: 72,
      color: '#FFFFFF',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
    // 黄色黑边 - 强调样式（9号）
    emphasis: {
      fontFamily: '思源粗宋体',
      fontSize: 72,
      color: 'rgba(249, 246, 133, 1)',
      strokeWidth: 2,
      strokeColor: '#FFFFFF',
    },
    // 黑色 - 第三句样式
    tertiary: {
      fontFamily: '思源粗宋体',
      fontSize: 76,
      color: 'rgba(249, 246, 133, 1)',
      strokeWidth: 2,
      strokeColor: '#FFFFF',
    },
    keyword: {
      color: 'rgba(249, 246, 133, 1)',
      strokeWidth: 2,
      strokeColor: '#FFFFFF',
    },
  },

  // 字体动画：向左滑动，向上滑动，渐隐，放大，渐显，向下露出
  animations: {
    subtitleIn: ['slideLeft', 'slideUp', 'zoomIn', 'fadeIn', 'revealDown'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'zoomInSnapDown', subtitleScreen: 3, startSfx: 'boBubble' },
    { effect: 'swipeFromRight', subtitleScreen: 6, startSfx: 'transitionWhoosh' },
    { effect: 'snapZoom', subtitleScreen: 9, startSfx: 'quickSwipe' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 122,
    subtitleLayoutPreset: 'singleCenter10',
    title: {
      top: 136,
      fontSize: 92,
      fontFamily: '思源粗宋体',
      fontStyle: 'italic',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      strokeWidth: 4,
      strokeColor: '#000000',
      lineHeight: 1.2,
      lineAlign: ['center', 'center'],
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
    },
    speaker: {
      left: 168,
      top: 1010,
      fontFamily: 'System',
      nameFontFamily: '思源中宋体',
      titleFontFamily: '思源中宋体',
      nameSize: 54,
      nameColor: 'rgba(249, 246, 133, 1)',
      nameStrokeWidth: 2,
      nameStrokeColor: '#000000',
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 34,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 2,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 8,
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
    },
  },
}
