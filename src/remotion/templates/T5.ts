import { VideoTemplate } from '../../types'

/** 第五套模板 - 标题国潮体花字，字幕畅黑/瑞云飞宋 */
export const T5Template: VideoTemplate = {
  name: 't5',
  description: '第五套模板 - 国潮体花字标题，畅黑/瑞云飞宋字幕',

  subtitleStyles: {
    // 棕色米黄 - 默认样式（畅黑，11号）
    default: {
      fontFamily: '畅黑',
      fontSize: 92,
      color: 'rgba(246, 220, 165, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: 'rgba(133, 133, 133, 1)',
      paintOrder: 'stroke fill',
    },
    // 浅灰米色 - 强调样式（瑞云飞宋，10号）
    emphasis: {
      fontFamily: '瑞云飞宋',
      fontSize: 84,
      color: 'rgba(242, 229, 206, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: 'rgba(88, 74, 61, 1)',
      paintOrder: 'stroke fill',
    },
    // 深棕色 - 第三句样式
    tertiary: {
      fontFamily: '畅黑',
      fontSize: 88,
      color: 'rgba(88, 74, 61, 1)',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      strokeWidth: 2,
      strokeColor: 'rgba(242, 229, 206, 1)',
      paintOrder: 'stroke fill',
    },
    // 关键词高亮
    keyword: {
      color: 'rgba(242, 229, 206, 1)',
    },
  },

  // 字体动画：收拢，打字，弹入，向下弹入，向上滑动
  animations: {
    subtitleIn: ['contract', 'typeWriter', 'bounce', 'revealDown', 'slideUp'],
    subtitleOut: 'fadeOut',
    keywordEffect: 'bounce',
  },

  // 画面特效：渐渐放大，侧滑
  videoEffects: ['zoomIn', 'panLeft', 'panRight'],
  // 新规则：按顺序执行（优先级高于 videoEffects）
  videoEffectSequence: [
    { effect: 'zoomIn', subtitleScreen: 1, startSfx: 'transitionWhoosh' },
    { effect: 'snapZoom', subtitleScreen: 3, startSfx: 'transitionWhoosh' }
  ],
  pipAnimations: ['zoomIn'],

  layout: {
    subtitleBottom: 330,
    lineHeight: 126,

    // 标题配置：国潮体花字，13号
    title: {
      top: 140,
      fontSize: 96,
      fontFamily: '国潮体',
      color: '#FFFFFF',
      secondLineColor: '#F6DC8A',
      strokeWidth: 7,
      strokeColor: 'black',
      textShadow: '0 4px 7px rgba(0,0,0,0.84)',
      lineHeight: 1.18,
      lineAlign: ['center', 'center'],
    },

    // 主讲人配置沿用简洁白色方案
    speaker: {
      left: 180,
      top: 1000,
      fontFamily: 'System',
      nameSize: 50,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 2,
      nameStrokeColor: 'rgba(90,90,90,1)',
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

