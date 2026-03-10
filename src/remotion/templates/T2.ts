import { VideoTemplate } from '../../types'

/** 第二套模板 - 浅绿/白色字体配思源粗宋 */
export const T2Template: VideoTemplate = {
  name: 't2',
  description: '清新风格 - 浅绿/白色思源粗宋配放大波浪动画',

  subtitleStyles: {
    // 白色 - 默认样式
    default: {
      fontFamily: '思源粗宋体',
      fontSize: 85,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.57)',
    },
    // 浅绿 - 强调样式
    emphasis: {
      fontFamily: '思源粗宋体',
      fontSize: 85,
      color: 'rgba(144, 251, 181, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.57)',
    },
    // 浅绿粗体 - 第三句样式
    tertiary: {
      fontFamily: '思源粗宋体',
      fontSize: 90,
      color: 'rgba(144, 251, 181, 1)',
      strokeWidth: 6,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
      filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.3))',
    },
    // 浅绿 - 关键词高亮
    keyword: {
    },
  },

  // 字幕动画：放大 + 波浪弹入
  animations: {
    subtitleIn: ['zoomIn', 'waveIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },
  subtitleAnimationSequence: [
  ],

  videoEffectSequence: [
    { effect: 'zoomIn', subtitleScreen: 1, animationIn: 'centerWipe', startSfx: 'introDong' },
    { effect: 'snapZoom', subtitleScreen: 4, animationIn: 'waveIn', startSfx: 'dingShortBright' }
  ],
  // 画中画动效
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 350,
    lineHeight: 130,
    subtitleLayoutPreset: 'doubleCenter',
    // 标题配置
    title: {
      top: 130,
      fontSize: 90,
      fontFamily: '思源粗宋体',
      fontStyle: 'italic',
      color: '#FFFFFF',
      secondLineColor: 'rgba(144, 251, 181, 1)',
      textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
      lineHeight: 1.3,
      lineAlign: ['left', 'right'],
      display: {
        startSec: 0,
        endSubtitleScreen: 3,
      },
      background: {
        color: 'rgba(0, 0, 0, 0.45)',
        paddingX: 30,
        paddingY: 12,
        borderRadius: 0,
      },
    },
    // 主讲人配置
    speaker: {
      left: 180,
      top: 1000,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: 'rgba(144, 251, 181, 1)',
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
