import { VideoTemplate } from '../../types'

/** 第十七套模板 - 标题方正超粗黑，字幕极宋 */
export const T17Template: VideoTemplate = {
  name: 't17',
  description: '第十七套模板 - 方正超粗黑标题，极宋字幕，滑出/拖尾/翻页/弹出',

  subtitleStyles: {
    // 白色 - 默认样式（11号）
    default: {
      fontFamily: '三极极宋 超粗',
      fontSize: 90,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 黄色 - 强调样式（9号）
    emphasis: {
      fontFamily: '得意黑 斜体',
      fontSize: 90,
      color: 'rgba(249, 246, 133, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 红色 - 第三句样式（9号）
    tertiary: {
      fontFamily: '得意黑 斜体',
      fontSize: 95,
      color: 'rgba(213, 51, 37, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    keyword: {
      color: 'rgba(249, 246, 133, 1)',
    },
  },

  // 字体动画：向右滑出，拖尾，翻页，向上弹出
  animations: {
    subtitleIn: ['slideRightOut', 'trail', 'pageTurn', 'popUp'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'bounce',
  },

  // 画面特效：渐渐放大，缩小
  videoEffects: ['zoomIn', 'zoomOut'],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    { effect: 'blurSnapClear', startSec: 0 },
    { effect: 'zoomInSnapDown', subtitleScreen: 3 },
    { effect: 'snapZoom', subtitleScreen: 6 }
  ],
  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'slideRightOut', startSfx: 'dagger' }, // 左向右移入 + 匕首
    { subtitleScreen: 2, animationIn: 'slideRight', startSfx: 'none' }, // 左向右滑入
    { subtitleScreen: 3, animationIn: 'popUp', startSfx: 'none' }, // 弹出（从小变大）黄色字
    { subtitleScreen: 4, animationIn: 'contract', startSfx: 'fadeFlashback' }, // 弹性收缩（大变小）
    { subtitleScreen: 5, animationIn: 'wipeRight', startSfx: 'lightSwooshShort' }, // 从左向右展开
    { subtitleScreen: 6, animationIn: 'zoomOut', startSfx: 'fadeFlashback' }, // 大弹小（重点字）
    { subtitleScreen: 7, animationIn: 'zoomOut', startSfx: 'lightSwooshShort' }, // 大弹小（重点字）
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleLeftLeft10',
    title: {
      top: 136,
      fontSize: 105,
      fontFamily: '方正超粗黑',
      fontWeight: 'normal',
      fontStyle: 'italic',
      letterSpacing: 3.5,
      color: 'rgba(213, 51, 37, 1)',
      secondLineColor: 'rgba(213, 51, 37, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
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
