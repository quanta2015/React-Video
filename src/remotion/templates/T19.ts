import { VideoTemplate } from '../../types'

/** 第十九套模板 - 标题极宋，字幕风骨楷体 */
export const T19Template: VideoTemplate = {
  name: 't19',
  description: '第十九套模板 - 极宋标题，风骨楷体字幕',

  subtitleStyleVariants: {
    oneLine: {},
    twoLine: {},
  },

  subtitleStyles: {
    // 黄色 - 默认样式（9号）
    default: {
      fontFamily: '风骨楷体',
      fontSize: 76,
      color: '#ffffff',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色 - 强调样式（12号）
    emphasis: {
      fontFamily: '风骨楷体',
      fontSize: 76,
      color: 'rgba(255, 242, 127, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 黄色 - 第三句样式（13号）
    tertiary: {
      fontFamily: '风骨楷体',
      fontSize: 76,
      color: 'rgba(255, 242, 127, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    keyword: {
      color: 'rgba(255, 242, 127, 1)',
    },
  },

  // 字体动画池（未命中时间轴时兜底）：向上弹入/弹出、小弹大、左右滑入、打字、向下弹入
  animations: {
    subtitleIn: ['revealUp', 'popIn', 'bounce', 'slideRight', 'slideLeftIn', 'typeWriter', 'revealDown'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'revealUp', startSfx: 'none' },
    // 小弹大 + 气泡
    { subtitleScreen: 2, animationIn: 'bounce', startSfx: 'boBubble' },
    // 左向右滑入 + 嗖
    { subtitleScreen: 3, animationIn: 'slideRight', startSfx: 'lightSwooshShort' },
    // 右向左滑入
    { subtitleScreen: 4, animationIn: 'slideLeftIn', startSfx: 'none' },
    // 打字机
    { subtitleScreen: 5, animationIn: 'typeWriter', startSfx: 'none' },
    // 上向下弹出
    { subtitleScreen: 6, animationIn: 'revealDown', startSfx: 'none' },
  ],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    // 向左快速滑入翻页 + 嗖-很轻-短.mp3
    { effect: 'swipeFromRight', subtitleScreen: 7, startSfx: 'lightSwooshShort' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleLeftRight8',
    subtitleLineOffsetY: [0, 36],
    title: {
      top: 138,
      fontSize: 102,
      fontFamily: '汉仪尚巍手书',
      fontWeight: 'normal',
      color: '#ddd7cc',
      animationIn: 'popUpFromBottom', // 新增：从下向上弹出
      secondLineFontFamily: '三极极宋 超粗',
      secondLineColor: 'rgba(255, 242, 127, 1)',
      secondLineFontSize: 108,
      secondLineStrokeWidth: 0,
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
      lineOffsetY: [0, -68],
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
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
