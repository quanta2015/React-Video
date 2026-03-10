import { VideoTemplate } from '../../types';

/** 简约风格模板 - 干净清爽 */
export const SimpleTemplate: VideoTemplate = {
  name: 'simple',
  description: '简约风格 - 干净清爽',

  subtitleStyles: {
    default: {
      fontFamily: 'PingFang SC',
      fontSize: 42,
      color: '#FFFFFF',
      fontWeight: 'normal',
    },
    emphasis: {
      fontFamily: 'PingFang SC',
      fontSize: 46,
      color: '#FFD700',
      fontWeight: 'bold',
    },
    tertiary: {
      fontFamily: 'PingFang SC',
      fontSize: 46,
      color: '#FFD700',
      fontWeight: 'bold',
    },
    keyword: {
      color: '#87CEEB',
    },
  },

  animations: {
    subtitleIn: 'fadeIn',
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },

  sfxSequence: [{ sfx: 'ding', subtitleScreen: 1 }],

  layout: {
    subtitleBottom: 120,
    lineHeight: 80,
    title: {
      top: 100,
      fontSize: 48,
      fontFamily: 'PingFang SC, sans-serif',
      color: '#FFFFFF',
      strokeWidth: 0,
      lineHeight: 1.3,
    },
    speaker: {
      left: 100,
      top: 1000,
      fontFamily: 'PingFang SC, sans-serif',
      nameSize: 28,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 0,
      titleSize: 18,
      titleColor: '#CCCCCC',
      titleMarginTop: 10,
    },
  },
};
