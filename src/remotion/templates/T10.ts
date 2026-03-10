import { VideoTemplate } from '../../types'

/** 第十套模板 - 标题思源粗宋，字幕叙黑体 */
export const T10Template: VideoTemplate = {
  name: 't10',
  description: '第十套模板 - 思源粗宋标题，叙黑体红蓝字幕，放大/渐显',

  subtitleStyles: {
    // 蓝色白边 - 默认样式（10号）
    default: {
      fontFamily: '字语叙黑体',
      fontSize: 72,
      color: 'rgba(32, 48, 101, 1)',
      strokeWidth: 3,
      strokeColor: '#FFFFFF',
      paintOrder: 'stroke fill',
    },
    // 红色白边 - 强调样式（8号）
    emphasis: {
      fontFamily: '字语叙黑体',
      fontSize: 84,
      color: 'rgba(122, 58, 51, 1)',
      strokeWidth: 3,
      strokeColor: '#FFFFFF',
      paintOrder: 'stroke fill',
    },
    // 白色蓝边 - 第三句样式
    tertiary: {
      fontFamily: '字语叙黑体',
      fontSize: 84,
      color: 'rgba(122, 58, 51, 1)',
      strokeWidth: 3,
      strokeColor: '#FFFFFF',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(122, 58, 51, 1)',
      fontSize: 84,
    },
  },

  // 字体动画：弹出，放大，渐显
  animations: {
    subtitleIn: ['popUp', 'zoomIn', 'fadeIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  subtitleAnimationSfxMap: {
    popUp: ['popBubble'],
  },

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'zoomOut', startSec: 0 },
    { effect: 'spotlightPulse', subtitleScreen: 4, startSfx: 'boBubble' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 122,
    subtitleLayoutPreset: 'singleCenter10',
    title: {
      top: 136,
      fontSize: 96,
      fontFamily: '思源粗宋体',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      lineHeight: 1.2,
      lineAlign: ['center', 'center'],
      display: {
        startSec: 0,
        endSubtitleScreen: 4,
      },
      lineBackground: {
        color: 'rgba(122, 58, 51, 0.95)',
        colors: ['rgba(122, 58, 51, 0.95)', 'rgba(32, 48, 101, 0.95)'],
        paddingX: 20,
        paddingY: 4,
        borderRadius: 2,
        marginBottom: 12,
        mode: 'box',
      },
    },
    speaker: {
      left: 170,
      top: 1010,
      fontFamily: 'System',
      nameFontFamily: '三极极宋 超粗',
      titleFontFamily: 'System',
      nameSize: 52,
      nameColor: 'rgba(228, 72, 88, 1)',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 32,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 10,
      display: {
        startSec: 0,
        endSubtitleScreen: 4,
      },
      accentLine: {
        left: 144,
        width: 5,
        color: 'rgba(228, 72, 88, 1)',
        cover: 'title',
        topOffset: 0,
        bottomOffset: 0,
        borderRadius: 3,
        rotateDeg: 10,
      },
    },
  },
}
