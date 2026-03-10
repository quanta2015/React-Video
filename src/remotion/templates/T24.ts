import { VideoTemplate } from '../../types'

/** 第二十四套模板 - 金色斜体标题，黑底白字字幕 */
export const T24Template: VideoTemplate = {
  name: 't24',
  description: '第二十四套模板 - 金色斜体标题，黑底白字字幕',

  subtitleStyleVariants: {
    oneLine: {
      default: [
        {
          background: {
            color: '#000000',
            paddingX: 26,
            paddingY: 10,
            borderRadius: 18,
            fitContent: true,
          },
        },
      ],
      emphasis: [{ color: '#FFFFFF' }, { color: 'rgba(255, 242, 127, 1)' }],
    },
    twoLine: {
      default: [{ fontSize: 88, fontFamily: '新青年体' }],
      emphasis: [{ color: 'rgba(235, 166, 99, 1)' }, { color: 'rgba(255, 242, 127, 1)' }],
    },
  },

  subtitleStyles: {
    // 白字黑底 - 默认样式
    default: {
      fontFamily: '站酷庆科黄油体',
      fontSize: 78,
      lineHeight: 1,
      charTransform: 'translateY(-0.06em)',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textShadow: '0 0 3px rgba(0,0,0,0.52)',
    },
    // 白字黑底 - 强调样式
    emphasis: {
      fontFamily: '新青年体',
      fontSize: 78,
      lineHeight: 1,
      charTransform: 'translateY(-0.06em)',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textShadow: '0 0 3px rgba(0,0,0,0.52)',
    },
    // 白字黑底 - 第三句样式
    tertiary: {
      fontFamily: '新青年体',
      fontSize: 78,
      lineHeight: 1,
      charTransform: 'translateY(-0.06em)',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textShadow: '0 0 3px rgba(0,0,0,0.52)',
    },
    keyword: {
      color: 'rgba(255, 242, 127, 1)',
    },
  },

  // 字体动画池（未命中时间轴时兜底）
  animations: {
    subtitleIn: ['springUp', 'slideDownSimple', 'slideRight', 'slideLeftIn', 'shake', 'fadeIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'none', startSfx: 'none' }, // 正常
    { subtitleScreen: 2, animationIn: 'springUp', startSfx: 'none' }, // 从下向上弹入
    { subtitleScreen: 3, animationIn: 'springUp', startSfx: 'boBubble' }, // 大字：向上弹入 + 气泡
    { subtitleScreen: 4, animationIn: 'springUp', startSfx: 'none' }, // 大字：向上弹入（黄字）
    { subtitleScreen: 5, animationIn: 'slideDownSimple', startSfx: 'none' }, // 向下淡入
    { subtitleScreen: 6, animationIn: 'slideRight', startSfx: 'dingMetal' }, // 左向右弹入 + 金属叮
    { subtitleScreen: 7, animationIn: 'slideLeftIn', startSfx: 'none' }, // 右向左弹入（黄字）
    { subtitleScreen: 8, animationIn: 'shake', startSfx: 'boBubble' }, // 扭动弹出 + 气泡
    { subtitleScreen: 9, animationIn: 'fadeIn', startSfx: 'none' }, // 出现
  ],
  // 新规则：按顺序执行
  videoEffectSequence: [
    // 正常后触发：向左快速滑入 + 嗖-很轻-短.mp3
    { effect: 'swipeFromRight', subtitleScreen: 2, startSfx: 'lightSwooshShort' },
    { effect: 'snapZoom', subtitleScreen: 5 },
    { effect: 'spotlight', subtitleScreen: 8 },
    { effect: 'zoomIn', subtitleScreen: 11 },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 110,
    subtitleLayoutPreset: 'doubleLeftRight8',
    title: {
      top: 132,
      fontSize: 100,
      fontWeight: 'normal',
      fontFamily: '三极极宋 超粗',
      fontStyle: 'italic',
      color: 'rgba(245, 229, 142, 1)',
      secondLineColor: 'rgba(245, 229, 142, 1)',
      textShadow: '0 6px 10px rgba(0,0,0,0.72)',
      lineHeight: 1.1,
      letterSpacing: 1,
      lineAlign: ['center', 'center'],
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
      background: {
        color: 'rgba(16, 34, 30, 0.38)',
        paddingX: 0,
        paddingY: 20,
        borderRadius: 0,
        fitContent: false,
      },
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
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
    },
  },
}
