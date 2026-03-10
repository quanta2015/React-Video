import { VideoTemplate } from '../../types'

/** 第十六套模板 - 标题汉仪尚巍手书，字幕榜楷体 */
export const T16Template: VideoTemplate = {
  name: 't16',
  description: '第十六套模板 - 手书标题，榜楷体字幕，放大/收拢/打字光标/开幕',

  subtitleStyles: {
    // 白色 - 默认样式（11号）
    default: {
      fontFamily: '三极榜楷简体',
      fontSize: 76,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 黄色 - 强调样式（9号）
    emphasis: {
      fontFamily: '三极榜楷简体',
      fontSize: 84,
      color: 'rgba(248, 217, 111, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色 - 第三句样式
    tertiary: {
      fontFamily: '三极榜楷简体',
      fontSize: 84,
      color: 'rgba(248, 217, 111, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    keyword: {
      color: 'rgba(248, 217, 111, 1)',
    },
  },

  // 字体动画：放大，收拢，打字光标，开幕
  animations: {
    subtitleIn: ['zoomIn', 'contract', 'typeWriter', 'blurIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },


  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'zoomIn', subtitleScreen: 1 }
  ],
  // 字幕时间轴（按截图逐屏配置）
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'blurIn', startSfx: 'victoryVarietyDengdeng' }, // 渐显 + 胜利-综艺-噔噔噔噔
    { subtitleScreen: 2, animationIn: 'centerWipe', startSfx: 'waterDropSingle' }, // 从小向两边变大 + 一滴水
    { subtitleScreen: 3, animationIn: 'centerWipe', startSfx: 'none' }, // 从小向两边变大
    { subtitleScreen: 4, animationIn: 'contract', startSfx: 'none' }, // 2边向中间收缩
    { subtitleScreen: 5, animationIn: 'typeWriter', startSfx: 'none' }, // 打字机
    { subtitleScreen: 6, animationIn: 'blurIn', startSfx: 'none' }, // 大变小（从模糊变清晰）
    { subtitleScreen: 7, animationIn: 'typeWriter', startSfx: 'none' }, // 打字机
    { subtitleScreen: 8, animationIn: 'typeWriter', startSfx: 'none' }, // 打字机
    { subtitleScreen: 9, animationIn: 'popUp', startSfx: 'dingMetal' }, // 弹出 + 叮-金属声
    { subtitleScreen: 10, animationIn: 'contract', startSfx: 'none' }, // 2边向中间收缩
    { subtitleScreen: 11, animationIn: 'fadeIn', startSfx: 'none' }, // 渐显
    { subtitleScreen: 12, animationIn: 'bounce', startSfx: 'none' }, // 小弹大
    { subtitleScreen: 13, animationIn: 'wipeRight', startSfx: 'waterDropSingle' }, // 左向右显示 + 一滴水
    { subtitleScreen: 14, animationIn: 'contract', startSfx: 'none' }, // 两边向中间收缩（渐显）
    { subtitleScreen: 15, animationIn: 'typeWriter', startSfx: 'none' }, // 打字机
    { subtitleScreen: 16, animationIn: 'fadeIn', startSfx: 'none' }, // 出现
    { subtitleScreen: 17, animationIn: 'contract', startSfx: 'none' }, // 两边向中间收缩（渐显）
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleCenter',
    title: {
      top: 136,
      fontSize: 100,
      fontFamily: '汉仪尚巍手书',
      color: '#FFFFFF',
      secondLineColor: 'rgba(248, 217, 111, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.16,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 170,
      top: 1008,
      fontFamily: 'System',
      nameSize: 46,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 34,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 8,
    },
  },
}
