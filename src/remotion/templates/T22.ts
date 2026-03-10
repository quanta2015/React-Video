import { VideoTemplate } from '../../types'

/** 第二十二套模板 - 标题经典黑，字幕圆绒体 */
export const T22Template: VideoTemplate = {
  name: 't22',
  description: '第二十二套模板 - 经典黑标题，圆绒体黄白字幕',

  subtitleStyles: {
    // 黄色 - 默认样式（9号）
    default: {
      fontFamily: '圆绒体',
      fontSize: 76,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 白色黑边 - 强调样式（9号）
    emphasis: {
      fontFamily: '圆绒体',
      fontSize: 76,
      color: 'rgba(235, 195, 96, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 黄色 - 第三句样式
    tertiary: {
      fontFamily: '圆绒体',
      fontSize: 84,
      color: 'rgba(235, 195, 96, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    keyword: {
      color: 'rgba(235, 195, 96, 1)',
    },
  },

  // 字体动画：向上弹入，弹入
  animations: {
    subtitleIn: ['springUp', 'bounce'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    // 开场：关键词划重点（不额外做入场，避免默认 ding）
    { subtitleScreen: 1, animationIn: 'none', startSfx: 'none' },
    // 向上弹入
    { subtitleScreen: 2, animationIn: 'springUp', startSfx: 'none' },
    // 弹出（粗-黄字）
    { subtitleScreen: 3, animationIn: 'bounce', startSfx: 'none' },
  ],
  // 新规则：按顺序执行
  videoEffectSequence: [
    // 开场：弹出变大 -> 快速变小（恢复）
    { effect: 'zoomInSnapDown', subtitleScreen: 1, startSfx: 'none' },
    // 第二次：弹出变大 -> 快速变小（恢复）
    { effect: 'zoomInSnapDown', subtitleScreen: 4, startSfx: 'none' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 122,
    subtitleLayoutPreset: 'singleCenter10',
    title: {
      top: 132,
      fontSize: 88,
      fontFamily: '经典黑',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      strokeWidth: 0,
      textShadow: '0 2px 4px rgba(0,0,0,0.22)',
      lineHeight: 1.12,
      lineAlign: ['center', 'center'],
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
      background: {
        color: 'linear-gradient(90deg, rgba(241,138,55,0) 0%, rgba(241,138,55,0.62) 20%, rgba(241,138,55,0.82) 50%, rgba(241,138,55,0.62) 80%, rgba(241,138,55,0) 100%)',
        paddingX: 42,
        paddingY: 10,
        borderRadius: 2,
        fitContent: true,
      },
    },
    speaker: {
      left: 150,
      top: 1010,
      fontFamily: 'System',
      nameFontFamily: '方正黑体',
      titleFontFamily: '方正黑体',
      nameSize: 55,
      nameColor: 'rgba(235, 195, 96, 1)',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 35,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 8,
    },
  },
}
