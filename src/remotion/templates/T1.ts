import { VideoTemplate } from "../../types";

/** 叫主风格模板 - 棕色/白色/橙色字体配多种动画 */
export const T1Template: VideoTemplate = {
  name: "t1",
  description: "叫主风格 - 棕色/白色/橙色字体配多种动画",
  subtitleAnimationStrategy: "sequence",

  subtitleStyles: {
    // 白色粗体 - 默认样式
    default: {
      fontFamily: "微软雅黑",
      fontSize: 90,
      color: "#FFFFFF",
      textShadow: "0 5px 10px rgba(0,0,0,0.84)"
    },
    // 橙色粗体 - 强调样式
    emphasis: {
      fontFamily: "SanjiJiSong",
      fontSize: 90,
      color: "#E6782D",
      textShadow: "0 5px 10px rgba(0,0,0,0.84)"
    },
    // 橙色粗体 - 第三句样式
    tertiary: {
      fontFamily: "SanjiJiSong",
      fontSize: 110,
      color: "#E6782D",
      strokeWidth: 8,
      strokeColor: "#000000",
      paintOrder: "stroke fill",
      filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.2))"
    },
    // 棕色 - 关键词高亮
    keyword: {
      color: "#E6782D"
    }
  },
  // 字幕动画 - 指定序列
  animations: {
    subtitleIn: [
      "revealUp", // 向上弹入
      "wipeRight", // 向右擦除
      "fadeIn", // 淡入
      "slideUp", // 向上滑动
      "slideRight", // 向右弹出
      "zoomIn", // 放大
      "blurIn" // 模糊
    ],
    subtitleOut: "fadeOut",
    keywordEffect: "none"
  },
  // 字幕动画序列 - 按脚本配置每屏字幕动画和音效
  subtitleAnimationSequence: [
    { subtitleScreen: 1, animationIn: "revealUp", startSfx: "quickSwipe" },
    { subtitleScreen: 2, animationIn: "wipeRight", startSfx: "memorySwipeFast" },
    { subtitleScreen: 3, animationIn: "fadeIn", startSfx: "none" },
    { subtitleScreen: 4, animationIn: "slideUp", startSfx: "swoosh" },
    { subtitleScreen: 5, animationIn: "slideRight", startSfx: "none" },
    { subtitleScreen: 6, animationIn: "fadeIn", startSfx: "fadeFlashback" },
    { subtitleScreen: 7, animationIn: "revealUp", startSfx: "none" },
    { subtitleScreen: 8, animationIn: "zoomIn", startSfx: "none" },
    { subtitleScreen: 9, animationIn: "blurIn", startSfx: "dingCute" },
    { subtitleScreen: 10, animationIn: "slideUp", startSfx: "none" },
    { subtitleScreen: 11, animationIn: "fadeIn", startSfx: "none" },
    { subtitleScreen: 12, animationIn: "slideUp", startSfx: "none" },
    { subtitleScreen: 13, animationIn: "zoomIn", startSfx: "none" },
    { subtitleScreen: 14, animationIn: "zoomIn", startSfx: "dingShortBright" },
    { subtitleScreen: 15, animationIn: "fadeIn", startSfx: "none" }
  ],

  // 背景动效：按脚本顺序执行
  videoEffectSequence: [
    { effect: "zoomIn", subtitleScreen: 1 }, // 第 1 句：出现
    { effect: "snapZoom", subtitleScreen: 2 }, // 第 2 句：快速放大
    { effect: "zoomOut", subtitleScreen: 3 }, // 第 3 句：快速缩小
    // 第 4-5 句：无画面特效
    { effect: "spotlight", subtitleScreen: 6 }, // 第 6 句半：画面四周变暗，聚焦中间点 + fadeFlashback
    // 第 7 句：画面焦距消失（spotlight 自然结束）
    // 第 8-10 句：无画面特效
    { effect: "zoomIn", subtitleGroupId: 10 } // 第 11 句：渐进（缓慢）放大
  ],
  // 画中画动效
  pipAnimations: ["zoomIn", "zoomOut", "panLeft", "panRight"],

  layout: {
    subtitleBottom: 350,
    lineHeight: 140,
    subtitleLayoutPreset: "threeLineOverlay",
    // 字幕显示时长缩放因子（0-1），越小显示时间越短
    subtitleSplit: {
      displayDurationScale: 0.7 // 缩短为原来的 70%
    },

    // 标题配置
    title: {
      top: 140,
      fontSize: 110,
      fontFamily: "SanjiJiSong",
      color: "#EB8436",
      secondLineColor: "#FFFFFF",
      strokeWidth: 12,
      strokeColor: "black",
      lineHeight: 1.3,
      display: {
        endSec: 6 // 指定 6 秒后消失
      }
    },
    // 主讲人配置
    speaker: {
      left: 180, // 名字中心 X 坐标
      top: 1000, // 名字中心 Y 坐标 (或顶部)
      fontFamily: "System",
      nameSize: 50,
      nameColor: "#E6782D",
      nameStrokeWidth: 4,
      nameStrokeColor: "black",
      nameShadow: "0 0 0.04em rgba(0,0,0,1)", // 模糊度 4%，透明度 100%
      titleSize: 30,
      titleColor: "#FFFFFF",
      titleStrokeWidth: 2, // 2 号
      titleShadow: "0 0 0.04em rgba(0,0,0,1)", // 模糊度 4%，透明度 100%
      textAlign: "left",
      titleMarginTop: 10
    }
  }
};
