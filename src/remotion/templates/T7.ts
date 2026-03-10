import { VideoTemplate } from '../../types'

/** 第七套模板 - 标题极宋，字幕极宋 */
export const T7Template: VideoTemplate = {
  name: 't7',
  description: '第七套模板 - 极宋红白主题，擦除/弹入/模糊/放大/渐显',

  subtitleStyles: {
    // 白色 - 默认样式（10号，黑阴影）
    default: {
      fontFamily: '三极极宋 超粗',
      fontSize: 84,
      color: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
    },
    // 红色 - 强调样式（10号，白边）
    emphasis: {
      fontFamily: '三极极宋 超粗',
      fontSize: 84,
      color: 'rgba(141, 29, 39, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 3,
      strokeColor: '#FFFFFF',
      paintOrder: 'stroke fill',
    },
    // 红色 - 第三句样式（用于三行字幕底行）
    tertiary: {
      fontFamily: '三极极宋 超粗',
      fontSize: 84,
      color: 'rgba(141, 29, 39, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 3,
      strokeColor: '#FFFFFF',
      paintOrder: 'stroke fill',
    },
    keyword: {

    },
  },

  // 字体动画：向右擦除，弹入，模糊，弹入，放大，渐显
  animations: {
    subtitleIn: ['wipeRight', 'bounce', 'blurIn', 'popIn', 'zoomIn', 'fadeIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: 'wipeRight' },
    { subtitleScreen: 2, animationIn: 'none', startSfx: ['popBubble'] }
  ],

  // 新规则：按顺序执行
  videoEffectSequence: [
    { effect: 'swipeFromRight', subtitleScreen: 4, startSfx: 'transitionWhoosh' }
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 320,
    lineHeight: 126,
    subtitleLayoutPreset: 'doubleLeftRight8',
    bilingual: {
      enabled: true,
      fontFamily: 'System',
      fontSize: 30,
      color: '#FFFFFF',
      fontWeight: 'normal'
    },

    // 标题：极宋，红色白边，13号
    title: {
      top: 130,
      fontSize: 96,
      fontFamily: '三极极宋 超粗',
      color: 'rgba(141, 29, 39, 1)',
      secondLineColor: 'rgba(141, 29, 39, 1)',
      strokeWidth: 6,
      strokeColor: '#FFFFFF',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.12,
      lineAlign: ['center', 'center'],
    },

    // 主讲人配置：默认白色方案
    speaker: {
      left: 180,
      top: 1000,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 2,
      nameStrokeColor: 'rgba(120,120,120,1)',
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 32,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 1,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 10,
    },
  },
}

