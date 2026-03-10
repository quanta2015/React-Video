import { VideoTemplate } from '../../types'

/** 第三套模板 - 圆体/得意体暖色风格 */
export const T3Template: VideoTemplate = {
  name: 't3',
  description: '第三套模板 - 圆体/得意体，收拢/缩小/上滑字幕',

  subtitleStyleVariants: {
    oneLine: {
      emphasis: [{ color: 'rgba(244, 247, 175, 1)' }, { color: 'rgba(244, 148, 74, 1)' }]
    },
    twoLine: {
      emphasis: [{ color: 'rgba(244, 247, 175, 1)' }, { color: 'rgba(244, 148, 74, 1)' }]
    },
  },

  subtitleStyles: {
    default: {
      fontFamily: '圆体-汉仪中圆简',
      fontSize: 85,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.92)',
    },
    emphasis: {
      fontFamily: '得意黑 斜体',
      fontSize: 90,
      color: 'rgba(244, 247, 175, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.92)',
    },
    // 黄色 - 第三句样式（19号）
    tertiary: {
      fontFamily: '得意黑',
      fontSize: 90,
      color: 'rgba(244, 148, 74, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.92)',
      strokeWidth: 4,
      strokeColor: 'rgba(0,0,0,0.92)',
      paintOrder: 'stroke fill',
    },
    // 关键词高亮
    keyword: {

    },
  },

  // 字体动画：收拢，缩小，向上滑动
  animations: {
    subtitleIn: ['contract', 'zoomOut', 'slideUp'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'zoomOut', startSec: 0, animationIn: 'fadeIn', startSfx: 'introDong' },
    { effect: 'zoomInSnapDown', subtitleScreen: 3, animationIn: 'contract', startSfx: 'popBubble', endSfx: 'popBubble' },
    { effect: 'zoomOut', subtitleScreen: 6, startSfx: 'duangCorrect' },
    { effect: 'swipeFromRight', subtitleScreen: 9, startSfx: 'transitionSwipeWhoosh' }

  ],
  pipAnimations: ['zoomIn'],


  layout: {
    subtitleBottom: 340,
    lineHeight: 136,
    subtitleLayoutPreset: 'doubleLeftRight8',

    // 标题配置（圆体 + 粗斜体风格）
    title: {
      top: 140,
      fontSize: 108,
      fontFamily: '圆体-汉仪中圆简',
      fontStyle: 'italic',
      color: 'rgba(244, 247, 175, 1)',
      secondLineColor: '#FFFFFF',
      strokeWidth: 6,
      strokeColor: 'black',
      textShadow: '8px 8px 0px #000000',
      lineHeight: 1.03,
      lineAlign: ['center', 'center'],
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
      lineBackground: {
        color: 'rgba(250, 148, 42, 1)',
        paddingX: 24,
        paddingY: 0,
        borderRadius: 0,
        marginBottom: 20,
        mode: 'stripe',
        heightRatio: 0.52,
        topRatio: 0.5,
      },
    },

    // 主讲人配置（沿用系统字体，避免干扰模板主视觉）
    speaker: {
      left: 180,
      top: 1000,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: 'rgba(244, 148, 74, 1)',
      nameStrokeWidth: 3,
      nameStrokeColor: 'black',
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 32,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 2,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 10,
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
    },
  },
}
