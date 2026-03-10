import { VideoTemplate } from '../../types'

/** Tx1 模板 - 左上头像 + 资讯风粗描边标题字幕 */
export const Tx1Template: VideoTemplate = {
  name: 'tx1',
  description: '第x1套模板 - 科技资讯封面（头像+粗描边字幕）',

  mode: 'pipOnly',

  subtitleStyles: {
    // 主行样式：亮黄填充 + 黑描边（贴近示例图字幕）
    default: {
      fontFamily: '经典黑',
      fontSize: 64,
      color: '#FFD42B',
      textShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
      strokeWidth: 8,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 强调样式：红字黑描边
    emphasis: {
      fontFamily: '经典黑',
      fontSize: 64,
      color: '#FFD42B',
      textShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
      strokeWidth: 8,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    // 第三句样式：白字黑描边
    tertiary: {
      fontFamily: '经典黑',
      fontSize: 64,
      color: '#FFD42B',
      textShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
      strokeWidth: 8,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
    },
    keyword: {
    },
  },

  // 字体动画：向右擦除，弹入，放大，渐显，收拢
  animations: {
    subtitleIn: 'zoomIn',
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 画面特效
  videoEffects: [],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [

  ],
  pipAnimations: [],

  layout: {
    subtitleBottom: 300,
    lineHeight: 110,
    subtitleLayoutPreset: 'singleCenter10',
    avatar: {
      left: 84,
      top: 176,
      size: 226,
      borderWidth: 10,
      borderColor: '#FFFFFF',
      borderRadius: 113,
      shadow: '0 14px 30px rgba(0, 0, 0, 0.32)',
      objectFit: 'cover',
      alwaysVisible: true,
      indicator: {
        enabled: true,
        // 相对头像顶部上移，形成与头像底部重合覆盖效果
        top: 188,
        width: 9,
        gap: 9,
        color: '#FFC61A',
        bars: 5,
        barHeights: [56, 84, 64, 84, 56],
        borderRadius: 6,
        animated: true,
        speed: 2.1,
        minScale: 0.22,
        maxScale: 1,
      },
    },
    title: {
      top: 198,
      left: 364,
      width: 664,
      fontSize: 68,
      fontFamily: '经典黑',
      fontWeight: 'bold',
      color: '#FFFFFF',
      secondLineColor: '#FFFFFF',
      paintOrder: 'stroke fill',
      strokeWidth: 8,
      secondLineStrokeWidth: 8,
      strokeColor: '#000000',
      letterSpacing: 2,
      lineHeight: 1.15,
      keywordCount: 3,
      keywordStyles: [
        {
          color: '#FFE02F',
          strokeColor: '#000000',
          strokeWidth: 8,
          textShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
        },
        {
          color: '#FF1F1F',
          strokeColor: '#000000',
          strokeWidth: 8,
          textShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
        },
      ],
      lineAlign: ['left', 'left'],
      textAlign: 'left',
      lineOffsetY: [0, 8],
    },
    speaker: {
      left: 170,
      top: 1010,
      fontFamily: 'system',
      nameFontFamily: 'system',
      titleFontFamily: 'system',
      nameSize: 54,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 0,
      nameShadow: '0 0 0.04em rgba(0,0,0,1)',
      titleSize: 36,
      titleColor: '#FFFFFF',
      titleStrokeWidth: 0,
      titleShadow: '0 0 0.04em rgba(0,0,0,1)',
      textAlign: 'left',
      titleMarginTop: 8,
    },
  },
}
