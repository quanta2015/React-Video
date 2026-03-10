import { VideoTemplate } from '../../types'

/** 第八套模板 - 标题极宋，字幕宋体 */
export const T8Template: VideoTemplate = {
  name: 't8',
  description: '第八套模板 - 极宋标题，宋体字幕，弹入/放大/波浪弹入',

  subtitleStyles: {
    // 黄色 - 默认样式（8号）
    default: {
      fontFamily: '宋体',
      fontSize: 72,
      color: 'rgba(247, 238, 165, 1)',
      textShadow: '3px 4px 10px rgba(0, 0, 0, 0.6)',
      charTransform: 'skewY(-4deg)',
      charTransformOrigin: 'center center',
    },
    // 白色 - 强调样式（9号）
    emphasis: {
      fontFamily: '宋体',
      fontSize: 76,
      color: '#FFFFFF',
      textShadow: '3px 4px 10px rgba(0, 0, 0, 0.6)',
      charTransform: 'skewY(-4deg)',
      charTransformOrigin: 'center center',
    },
    // 黄色 - 第三句样式
    tertiary: {
      fontFamily: '宋体',
      fontSize: 72,
      color: 'rgba(247, 238, 165, 1)',
      textShadow: '3px 4px 10px rgba(0, 0, 0, 0.6)',
      charTransform: 'skewY(-4deg)',
      charTransformOrigin: 'center center',
    },
    keyword: {
      color: 'rgba(247, 238, 165, 1)',
    },
  },

  // 字体动画：弹入，放大，波浪弹入
  animations: {
    subtitleIn: ['bounce', 'zoomIn', 'waveIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },
  subtitleAnimationSequence: [
    { subtitleScreen: 2, animationIn: 'waveIn' },
  ],

  // 新规则：按顺序执行（
  videoEffectSequence: [
    { effect: 'ellipseMaskZoomOut', startSec: 0, startSfx: 'introDong' },
    { effect: 'zoomInSnapDown', animationIn: "wipeRight", subtitleScreen: 3, startSfx: 'popBubble' },
    { effect: 'rectangleMaskSnapZoom', animationIn: "wipeRight", subtitleScreen: 6, startSfx: 'quickSwipe' },
    { effect: 'spotlightExtreme', subtitleScreen: 9, startSfx: 'dingMetal' }
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 122,
    subtitleLayoutPreset: 'singleCenter10',
    title: {
      top: 138,
      fontSize: 104,
      fontWeight: 'normal',
      fontFamily: '三极极宋 超粗',
      // 厚重柔和阴影：增大模糊半径+适中透明度
      textShadow: '3px 4px 10px rgba(0, 0, 0, 0.6)',
      color: '#FFFFFF',
      secondLineColor: 'rgba(247, 238, 165, 1)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
      charTransform: 'skewY(-4deg)',
      charTransformOrigin: 'center center',
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
