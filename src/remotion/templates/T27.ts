import { VideoTemplate } from '../../types'

/** 第二十七套模板 - 标题黄油体，字幕黄油体复古描边 */
export const T27Template: VideoTemplate = {
  name: 't27',
  description: '第二十七套模板 - 黄油体标题，浅米与深棕反转字幕',

  subtitleStyles: {
    // 主行样式：浅米色填充 + 深棕描边
    default: {
      fontFamily: '抖音美好体',
      fontSize: 85,
      color: '#fff1e1',
      textShadow: '0 3px 5px rgba(108, 94, 85, 0.55)',
      strokeWidth: 6,
      strokeColor: '#625242',
      paintOrder: 'stroke fill',
    },
    // 反转样式：深棕填充 + 浅米描边
    emphasis: {
      fontFamily: '三极榜楷简体',
      fontSize: 85,
      color: '#625242',
      textShadow: '0 3px 5px rgba(108, 94, 85, 0.45)',
      strokeWidth: 6,
      strokeColor: '#fff1e1',
      paintOrder: 'stroke fill',
    },
    // 第三句样式保持与反转样式一致
    tertiary: {
      fontFamily: '三极榜楷简体',
      fontSize: 90,
      color: '#625242',
      textShadow: '0 3px 5px rgba(108, 94, 85, 0.45)',
      strokeWidth: 6,
      strokeColor: '#fff1e1',
      paintOrder: 'stroke fill',
    },
    keyword: {
      color: '#625242',
      strokeColor: '#fff1e1',
    },
  },

  // 字体动画池（未命中时间轴时兜底）
  animations: {
    subtitleIn: ['bounce', 'typeWriter', 'contract', 'fadeIn'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  // 字幕时间轴（按参考图逐屏配置）
  subtitleAnimationSequence: [
    // 开场音效：duang-正确.mp3
    { startSec: 0, startSfx: 'duangCorrect' },
    // 小弹大
    { subtitleScreen: 1, animationIn: 'bounce', startSfx: 'none' },
    // 打字 + 打字-字幕-4声.mp3
    { subtitleScreen: 2, animationIn: 'typeWriter', startSfx: 'typingSubtitle4' },
    // 两边向中间收缩
    { subtitleScreen: 6, animationIn: 'contract', startSfx: 'none' },
  ],
  // 新规则：按顺序执行
  videoEffectSequence: [
    // 直接专场 + 啵，气泡.mp3
    { effect: 'spotlight', startSec: 0 },
    // 突然变大（含突然变小恢复） + 综艺弹出啵-可爱.wav
    { effect: 'snapZoom', subtitleScreen: 4, startSfx: 'varietyBoCute' },
    // 向左快速滑入 + 啵，气泡.mp3
    { effect: 'swipeFromRight', subtitleScreen: 5, startSfx: 'boBubble' },
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 332,
    lineHeight: 122,
    subtitleLayoutPreset: 'doubleCenter',
    title: {
      top: 136,
      fontSize: 96,
      fontFamily: '三极榜楷简体',
      fontWeight: 'normal', // 避免合成粗体吃掉细笔画（如“夏”字内部线条）
      color: '#F9E7B8', // 暖调米黄，提升字身视觉厚度
      secondLineColor: '#F9E7B8',
      paintOrder: 'stroke fill', // 保留粗描边的质感
      strokeWidth: 6, // 进一步收窄外描边，提升细节可读性
      strokeColor: '#391f1a', // 纯黑描边保证对比度
      letterSpacing: 6, // 适当收紧字距，增强整体感
      strokeAlign: 'outside', // 描边不覆盖字身，保持字形清晰
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
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
