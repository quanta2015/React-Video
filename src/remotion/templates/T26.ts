import { VideoTemplate } from '../../types'

/** 第二十六套模板 - 标题云黑/粗斜体，字幕云黑体 */
export const T26Template: VideoTemplate = {
  name: 't26',
  description: '第二十六套模板 - 云黑标题，黄白字幕，羽化擦除与生长动画',

  subtitleStyles: {
    // 黄色 - 默认样式（9号）
    default: {
      fontFamily: '云黑',
      fontSize: 76,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
    },
    // 白色 - 强调样式（9号）
    emphasis: {
      fontFamily: '云黑',
      fontSize: 76,
      color: 'rgba(248, 217, 111, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
    },
    // 黄色 - 第三句样式
    tertiary: {
      fontFamily: '云黑',
      fontSize: 76,
      color: 'rgba(248, 217, 111, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
    },
    keyword: {
      color: 'rgba(248, 217, 111, 1)',
    },
  },

  // 字体动画池（未命中时间轴时兜底）
  animations: {
    subtitleIn: ['fadeIn', 'wipeRight', 'slideRight', 'grow', 'typeWriter'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'none', startSfx: 'none' }, // 正常
    { subtitleScreen: 3, animationIn: 'wipeRight', startSfx: 'none' }, // 向右显示
    { subtitleScreen: 6, animationIn: 'typeWriter', startSfx: 'none' }, // 打字机
  ],
  // 新规则：按顺序执行
  videoEffectSequence: [
    // 突然变大 + 快速变小（恢复）
    { effect: 'zoomInSnapDown', subtitleScreen: 3, startSfx: 'lightSwooshShort' },
    // 向左快速滑入专场
    { effect: 'swipeFromRight', subtitleScreen: 5, startSfx: 'quickSwipe' },
    // 快速变大 + 快速变小（恢复）
    { effect: 'snapZoom', subtitleScreen: 7, startSfx: 'none' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleCenter',
    title: {
      top: 136,
      fontSize: 96,
      fontFamily: '云黑',
      fontStyle: 'italic',
      color: 'rgba(248, 217, 111, 1)',
      secondLineColor: '#FFFFFF',
      strokeWidth: 4,
      secondLineStrokeWidth: 4,
      strokeColor: '#000000',
      textShadow: '0 4px 7px rgba(0,0,0,0.9)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
    },
    speaker: {
      left: 260,
      top: 1010,
      fontFamily: 'System',
      nameFontFamily: '云黑',
      titleFontFamily: '云黑',
      nameSize: 48,
      nameColor: 'rgba(248, 217, 111, 1)',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 30,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'center',
      titleMarginTop: 8,
      alwaysVisible: true
    }
  },
}
