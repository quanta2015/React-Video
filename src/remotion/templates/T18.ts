import { VideoTemplate } from '../../types'

/** 第十八套模板 - 标题志向黑，字幕极宋 */
export const T18Template: VideoTemplate = {
  name: 't18',
  description: '第十八套模板 - 志向黑灰调标题，极宋/圆体字幕，羽化擦除+渐显',

  subtitleStyles: {
    // 绿色 - 默认样式（6号）
    default: {
      fontFamily: '宋体',
      fontSize: 64,
      color: '#ffffff',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色 - 强调样式（12号）
    emphasis: {
      fontFamily: '宋体',
      fontSize: 74,
      color: 'rgba(121, 172, 144, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色斜体 - 第三句样式
    tertiary: {
      fontFamily: '宋体',
      fontSize: 74,
      color: 'rgba(121, 172, 144, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    keyword: {
      color: 'rgba(121, 172, 144, 1)',
      fontSize: 74,
    },
  },

  // 字体动画：羽化向右擦除，渐显
  animations: {
    subtitleIn: ['featherWipeRight', 'fadeIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    { effect: 'zoomInSnapDown', startSec: 0 },
    { effect: 'snapZoom', subtitleScreen: 3 },
    { effect: 'zoomIn', subtitleScreen: 6 },
  ],
  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    // 开场音效：用字幕序列的 startSec 锚点，避免与字幕音效出现优先级冲突压制
    { startSec: 0, startSfx: 'introDong' },

    // 开场行未指定字幕动效，显式静音占位，避免默认 ding
    { subtitleScreen: 1, animationIn: 'none', startSfx: 'none' },
    { subtitleScreen: 2, animationIn: 'popUp', startSfx: 'boBubble' }, // 关键词划重点
    { subtitleScreen: 3, animationIn: 'popUp', startSfx: 'none' }, // 关键词划重点
    { subtitleScreen: 4, animationIn: 'featherWipeRight', startSfx: 'none' }, // 白大字：向右渐显
    { subtitleScreen: 5, animationIn: 'featherWipeRight', startSfx: 'none' }, // 绿大字：向右渐显
    { subtitleScreen: 6, animationIn: 'featherWipeRight', startSfx: 'quickSwipe' }, // 白大字：向右渐显
    { subtitleScreen: 7, animationIn: 'featherWipeRight', startSfx: 'none' }, // 绿大字：向右渐显
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 430,
    lineHeight: 128,
    subtitleLayoutPreset: 'singleCenter10',
    title: {
      top: 56,
      fontSize: 102,
      fontFamily: '励字志向黑简 特粗',
      fontStyle: 'italic',
      color: '#F3F1E8',
      secondLineColor: '#F3F1E8',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.08,
      lineAlign: ['center', 'center'],
      display: {
        startSec: 0
      },
      background: {
        color: 'rgba(50, 51, 48, 0.85)',
        paddingX: 0,
        paddingY: 68,
        borderRadius: 0,
        topOffset: -56,
        fitContent: false,
      },
    },
    speaker: {
      left: 214,
      top: 1588,
      fontFamily: 'System',
      nameFontFamily: 'System',
      titleFontFamily: '宋体',
      nameSize: 50,
      nameColor: '#ECECEC',
      nameStrokeWidth: 0,
      nameShadow: '0 2px 6px rgba(0,0,0,0.85)',
      titleSize: 26,
      titleColor: '#DCDCDC',
      titleStrokeWidth: 0,
      titleShadow: '0 2px 6px rgba(0,0,0,0.85)',
      textAlign: 'left',
      alwaysVisible: true,
      titleMarginTop: 0,
      titleLeft: 560,
      titleTop: 1590,
      titleLineHeight: 1.15,
      display: {
        startSec: 0
      },
      background: {
        color: 'rgba(50, 51, 48, 0.85)', // 0~1，越小越透明
        top: 1504,
        bottom: 0,
        borderRadius: 0,
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,255,255,0.42)',
      },
      accentLine: {
        left: 526,
        top: 1590,
        width: 3,
        height: 78,
        color: 'rgba(255,255,255,0.72)',
        borderRadius: 2,
      },
    },
  },
}
