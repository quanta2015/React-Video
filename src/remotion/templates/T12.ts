import { VideoTemplate } from '../../types'

/** 第十二套模板 - 标题玉树临风/粗斜体，字幕志向黑 */
export const T12Template: VideoTemplate = {
  name: 't12',
  description: '第十二套模板 - 玉树临风标题，志向黑字幕，左右/上滑与波浪弹入',

  subtitleStyleVariants: {
    oneLine: {
      default: [],
      emphasis: [],
      keyword: [{ color: 'rgba(234, 128, 62, 1)' }, { color: '#FFFFFF', strokeWidth: 4 }],
    },
    twoLine: {},
  },

  subtitleStyles: {
    // 白色黑边 - 默认样式（11号）
    default: {
      fontFamily: '励字玉树临风简',
      fontSize: 84,
      color: '#000000',
      strokeWidth: 3,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
      background: {
        color: '#FFFFFF',
        paddingX: 24,
        paddingY: 4,
        borderRadius: 0,
        fitContent: true,
      },
    },
    // 橙色黑边 - 强调样式（7号）
    emphasis: {
      fontFamily: '励字玉树临风简',
      fontSize: 84,
      color: 'rgba(234, 128, 62, 1)',
      strokeWidth: 3,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 橙色 - 第三句样式
    tertiary: {
      fontFamily: '励字玉树临风简',
      fontSize: 84,
      color: 'rgba(234, 128, 62, 1)',
      strokeWidth: 3,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: 'rgba(234, 128, 62, 1)',
    },
  },

  // 字体动画：向左滑动，向右滑动，向上滑动，渐隐，放大，渐显，波浪弹入
  animations: {
    subtitleIn: ['slideLeft', 'slideRight', 'shake'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'none' },
    { subtitleScreen: 2, animationIn: 'slideRight' },
    { subtitleScreen: 3, animationIn: 'slideLeft' },
    { subtitleScreen: 6, animationIn: 'shake', startSfx: ['varietyBoAlt'] },
  ],

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'swipeFromRight', subtitleScreen: 4, startSfx: 'transitionWhoosh' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleCenter',
    title: {
      top: 136,
      fontSize: 100,
      fontFamily: '励字玉树临风简',
      fontStyle: 'italic',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      strokeWidth: 4,
      strokeColor: '#000000',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.2,
      lineAlign: ['center', 'center'],
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
    speaker: {
      left: 170,
      top: 1010,
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
