import { VideoTemplate } from '../../types'

/** 第六套模板 - 标题博洋柳体，字幕博洋柳体/系统 */
export const T6Template: VideoTemplate = {
  name: 't6',
  description: '第六套模板 - 博洋柳体标题，博洋柳体/系统字幕，打字光标与波浪弹入',

  subtitleStyleVariants: {
    oneLine: {
      default: [
        { fontFamily: 'system' },
        { fontFamily: '博洋柳体', fontSize: 95, textShadow: '0 4px 7px rgba(0,0,0,0.95)', strokeWidth: 2, strokeColor: '#000000', paintOrder: 'stroke fill' },
      ],
      emphasis: [{ color: 'rgba(251, 246, 157, 1)' }, { color: 'rgba(213, 51, 37, 1)' }],
      keyword: [{ color: 'rgba(214, 186, 84, 1)' }],
    },
    twoLine: {
      default: [
        { fontFamily: '博洋柳体', fontSize: 95, textShadow: '0 4px 7px rgba(0,0,0,0.95)', strokeWidth: 2, strokeColor: '#000000', paintOrder: 'stroke fill' },
      ],
      emphasis: [{ color: 'rgba(213, 51, 37, 1)' }, { color: 'rgba(251, 246, 157, 1)' }],
      keyword: [],
    },
  },

  subtitleStyles: {
    default: {
      fontFamily: 'system',
      fontSize: 75,
      color: '#FFFFFF',
    },
    // 黄色 - 强调样式（系统，8号）
    emphasis: {
      fontFamily: '博洋柳体',
      fontSize: 95,
      color: 'rgba(251, 246, 157, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.95)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 棕色 - 第三句样式（系统，8号）
    tertiary: {
      fontFamily: '博洋柳体',
      fontSize: 95,
      color: 'rgba(214, 186, 84, 1)',
      textShadow: '0 4px 7px rgba(4, 2, 2, 0.95)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 白色 - 关键词/局部高亮
    keyword: {
      color: 'rgba(213, 51, 37, 1)',
      strokeWidth: 2,
      strokeColor: '#000000',
    },
  },

  // 字体动画：向下滑动，打字，波浪弹入
  animations: {
    subtitleIn: ['slideDown', 'slideRight', 'typeWriter', 'waveIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  subtitleAnimationSfxMap: {
    typeWriter: ['typingSubtitle4'],
    waveIn: ['messageNotify', 'duDongPlain', 'popBubble'],
    slideDown: ['memorySwipeFast', 'transitionWhoosh'],
    slideRight: ['memorySwipeFast', 'transitionWhoosh'],
  },

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'snapZoom', subtitleScreen: 1, startSfx: 'quickSwipe', endSfx: 'cartoonBounce' },
    { effect: 'zoomInSnapDown', subtitleScreen: 5 },
    { effect: 'rectangleMask', subtitleScreen: 8, startSfx: 'duangCorrect' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleCenter',
    // 标题配置：博洋柳体，白色/红色，黑阴影距离13
    title: {
      top: 136,
      fontSize: 110,
      fontFamily: '博洋柳体',
      color: '#FFFFFF',
      secondLineColor: '#fe0000',
      strokeWidth: 5,
      strokeColor: '#000000',
      textShadow: '13px 13px 0px rgba(0,0,0,0.95)',
      lineHeight: 1.2,
      lineAlign: ['center', 'center'],
    },

    // 主讲人信息：简宋
    speaker: {
      left: 270,
      top: 1020,
      fontFamily: 'System',
      nameFontFamily: '简宋',
      titleFontFamily: '简宋',
      nameSize: 58,
      nameColor: 'rgba(214, 186, 84, 1)',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 32,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'center',
      titleMarginTop: 10,
    },
  },
}
