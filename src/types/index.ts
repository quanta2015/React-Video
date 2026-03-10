// Types for video subtitle generator

// ============================================
// ASR 相关类型
// ============================================

/** ASR 识别的单个词 */
export interface Word {
  text: string;
  start: number; // 毫秒
  end: number;
}

/** ASR 原始字幕 */
export interface RawSubtitle {
  start: number;
  end: number;
  text: string;
  words: Word[];
}

/** ASR 识别结果 */
export interface ASRResult {
  subtitles: RawSubtitle[];
  text: string;
  duration: number;
}

// ============================================
// 字幕相关类型
// ============================================

/** 分句后的字幕 */
export interface SplitSubtitle {
  start: number;
  end: number;
  groupStart: number; // group 的开始时间
  groupEnd: number; // group 的结束时间，用于保持显示
  text: string;
  enText?: string;
  groupId: number;
  position: number;
  totalInGroup: number;
  keyword?: string;
  words?: Word[];
}

/** 带样式的字幕（可扩展自定义样式名，保留 default/emphasis/tertiary 语义） */
export type SubtitleStyleType = string;

export interface StyledSubtitle extends SplitSubtitle {
  styleType: SubtitleStyleType;
  /** 当前字幕行的样式覆盖（由按屏变体随机选出） */
  styleOverride?: Partial<SubtitleStyle>;
  /** 当前屏关键词高亮样式覆盖（由按屏变体随机选出） */
  keywordStyleOverride?: Partial<SubtitleStyle>;
  /** 当前字幕行额外垂直偏移（像素，设计稿坐标；正值上移） */
  lineOffsetYOverride?: number;
  animationIn: AnimationName;
  animationOut: AnimationName;
}

/** 单个句数档位的样式池（每屏随机挑选） */
export interface SubtitleStyleVariantConfig {
  default?: Partial<SubtitleStyle>[];
  emphasis?: Partial<SubtitleStyle>[];
  tertiary?: Partial<SubtitleStyle>[];
  keyword?: Partial<SubtitleStyle>[];
  /** 字幕行偏移方案池：每项是按句位置(position)的偏移数组，可用于控制是否重叠 */
  lineOffsetY?: number[][];
}

/** 每屏字幕样式变体（按句数分档） */
export interface SubtitleStyleVariants {
  /** 每屏 1 句时，default/emphasis/keyword（及可选 tertiary）的样式池 */
  oneLine?: SubtitleStyleVariantConfig;
  /** 每屏 2 句时，default/emphasis/keyword（及可选 tertiary）的样式池 */
  twoLine?: SubtitleStyleVariantConfig;
  /** 每屏 3 句时，default/emphasis/tertiary/keyword 的样式池 */
  threeLine?: SubtitleStyleVariantConfig;
}

/** 字幕组（同一主句的多行） */
export interface SubtitleGroup {
  groupId: number;
  items: StyledSubtitle[];
}

export interface TitleHighlightStyle {
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textShadow?: string;
}

export interface TitleHighlight extends TitleHighlightStyle {
  keyword: string;
}

// ============================================
// 静态信息
// ============================================

export interface StaticInfo {
  title?: string;
  /** 运行时标题关键词高亮（通常由 AI 提取后注入） */
  titleHighlights?: TitleHighlight[];
  speaker?: string;
  speakerTitle?: string;
  /** 用户头像 URL（http/https 或可访问的本地静态路径） */
  avatarUrl?: string;
}

// ============================================
// 画中画配置
// ============================================

/** 画中画素材类型 */
export type PipMediaType = "image" | "video";

/** 画中画素材 */
export interface PipMedia {
  url: string;
  type: PipMediaType;
  /** 素材原始宽度（像素），用于判断宽高比 */
  width?: number;
  /** 素材原始高度（像素），用于判断宽高比 */
  height?: number;
  /** 视频素材原始时长（秒），用于优先按素材本身时长调度 */
  durationSec?: number;
  /** 素材标签（用于 AI 语义匹配插入位置） */
  tags?: string[];
  /** AI 匹配到的目标字幕组 ID（由 PipMatcher 设置） */
  targetGroupId?: number;
}

/** 画中画动画类型 */
export type PipAnimationType = "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "panUp" | "panDown" | "none";

/** 画中画显示项（计算后） */
export interface PipItem {
  media: PipMedia;
  startFrame: number;
  durationFrames: number;
  animation: PipAnimationType;
}

// ============================================
// 动画相关类型
// ============================================

export type AnimationName =
  | "fadeIn"
  | "fadeOut"
  | "scaleIn"
  | "scaleOut"
  | "slideUp"
  | "slideDown"
  | "bounce"
  | "typeWriter"
  | "none"
  | "wipeRight"
  | "centerWipe"
  | "slideLeft"
  | "slideRight"
  | "flipUp"
  | "blurIn"
  | "zoomIn"
  | "zoomOut"
  | "waveIn"
  | "contract"
  | "linearMask"
  | "springUp"
  | "springDown"
  | "swingIn"
  | "wave"
  | "revealDown"
  | "revealUp"
  | "featherWipeRight"
  | "pageTurn"
  | "popUp"
  | "shake"
  | "grow"
  | "rotate"
  | "trail"
  | "popIn"
  | "bouncePopIn"
  | "slideUpReturn"
  | "slideDownReturn"
  | "slideRightOut"
  | "slideLeftIn"
  | "slideDownSimple"
  | "carrySplit";

/** 标题入场动效类型（独立于字幕动画） */
export type TitleAnimationName = "none" | "fadeIn" | "popUpFromBottom";

export type VideoEffectName =
  | "zoomIn" // 渐渐放大
  | "zoomInSnapDown" // 渐进放大 + 突然缩小
  | "snapZoom" // 瞬间放大
  | "snapZoomSmoothDown" // 瞬间放大 + 平滑缩小
  | "blurSnapClear" // 强模糊快速拉清（带轻微推镜）
  | "ellipseMaskZoomOut" // 椭圆蒙版 + 缩小，蒙版延迟消失
  | "rectangleMaskSnapZoom" // 长方形蒙版 + 快速放大缩回（蒙版0.5秒后消失）
  | "zoomOut" // 渐渐缩小
  | "panLeft" // 向左滑动
  | "swipeFromRight" // 右侧副本向左刷入
  | "panRight" // 向右滑动
  | "shake" // 晃动
  | "magnifier" // 放大镜
  | "spotlight" // 暗角聚光 (原 circle)
  | "spotlightPulse" // 暗角聚光 + 回弹脉冲
  | "spotlightExtreme" // 特强圆形聚光：周围近乎全黑，仅保留光晕
  | "spotlightCenter" // 中心亮圈聚光：仅中心亮圈，外围纯黑
  | "rectangleMask" // 长方形蒙版（适用于短视频）
  | "blurGlow"; // 模糊发光

/** 背景画面动效序列项（按数组顺序依次排期） */
export interface VideoEffectSequenceItem {
  /** 动效类型 */
  effect: VideoEffectName;
  /** 关联字幕入场动效（命中锚点时覆盖该屏随机字幕入场动画） */
  animationIn?: AnimationName;
  /** 关联字幕出场动效（命中锚点时覆盖该屏随机字幕出场动画） */
  animationOut?: AnimationName;
  /** 指定开始秒数触发（>=0，优先级高于 subtitleGroupId / subtitleScreen） */
  startSec?: number;
  /** 指定第几屏字幕触发（从 1 开始） */
  subtitleScreen?: number;
  /** 指定字幕组 ID 触发（从 0 开始，优先级高于 subtitleScreen） */
  subtitleGroupId?: number;
  /** 在第几屏字幕结束后回收（从 1 开始；回收点=下一屏开始） */
  endAfterSubtitleScreen?: number;
  /** 在指定字幕组结束后回收（从 0 开始；回收点=下一组开始） */
  endAfterSubtitleGroupId?: number;
  /** 动效开始时播放的音效（配置名/文件名/相对路径/绝对路径/URL；`none` 表示静音占位） */
  startSfx?: string;
  /** 动效结束时播放的音效（配置名/文件名/相对路径/绝对路径/URL；`none` 表示静音占位） */
  endSfx?: string;
}

/** 音效序列项（按数组顺序依次排期） */
export interface SfxSequenceItem {
  /** 音效（配置名/文件名/相对路径/绝对路径/URL；`none` 表示静音占位） */
  sfx: string;
  /** 指定开始秒数触发（>=0，优先级高于 subtitleGroupId / subtitleScreen） */
  startSec?: number;
  /** 指定第几屏字幕触发（从 1 开始） */
  subtitleScreen?: number;
  /** 指定字幕组 ID 触发（从 0 开始，优先级高于 subtitleScreen） */
  subtitleGroupId?: number;
}

/** 字幕动效序列项（按数组顺序覆盖指定字幕屏的入/出场动效） */
export interface SubtitleAnimationSequenceItem {
  /** 指定入场动效（不填则保持随机） */
  animationIn?: AnimationName;
  /** 指定出场动效（不填则保持随机） */
  animationOut?: AnimationName;
  /** 字幕入场时播放音效（支持单个，或数组随机选一个；`none` 表示静音占位） */
  startSfx?: string | string[];
  /** 指定开始秒数触发（>=0，优先级高于 subtitleGroupId / subtitleScreen） */
  startSec?: number;
  /** 指定第几屏字幕触发（从 1 开始） */
  subtitleScreen?: number;
  /** 指定字幕组 ID 触发（从 0 开始，优先级高于 subtitleScreen） */
  subtitleGroupId?: number;
  /** 指定第几句字幕（从 1 开始；用于同屏多句精确控制） */
  subtitleLine?: number;
  /** 指定句内位置（从 0 开始；优先级高于 subtitleLine） */
  subtitlePosition?: number;
}

/** 字幕入场动效对应的音效池（命中时随机选 1 个） */
export type SubtitleAnimationSfxMap = Partial<Record<AnimationName, string[]>>;

/** 上一句分裂保留基础配置 */
export interface SubtitleCarrySplitConfig {
  enabled: boolean;
  /** 最多触发几次分裂过渡（按字幕顺序），不填表示不限制 */
  maxTransitions?: number;
  /** 分裂过渡帧数，默认 5 */
  transitionFrames?: number;
  /** 上下层位移（像素，设计稿坐标），默认 32 */
  offsetY?: number;
  /** 中间留白（像素，设计稿坐标），默认 6 */
  centerGap?: number;
  /** 分裂层透明度（0-1），默认 1 */
  opacity?: number;
  /** 是否保持到下一句结束，默认 true */
  holdToNextEnd?: boolean;
  /** holdToNextEnd=false 时生效：保留帧数，默认 14 */
  holdFrames?: number;
}

/** 计算后的背景动效排期（用于渲染和音频混合） */
export interface PlannedVideoEffect {
  type: VideoEffectName;
  startFrame: number;
  durationFrames?: number;
  subtitleGroupId?: number;
  startSfx?: string;
  endSfx?: string;
}

// Note: AnimationParams 和 Animation 接口已移除
// 现在使用 remotion-animated 库处理动画

// ============================================
// 视频模板相关类型
// ============================================

export type SubtitleLayoutPresetName =
  | "singleCenter4"
  | "singleCenter10"
  | "threeLineOverlay"
  | "doubleCenter"
  | "doubleLeftRight8"
  | "doubleLeftLeft10";

export interface SubtitleSplitConfig {
  /** 每行最大字符数（可选，通常由 layout preset 决定） */
  maxChars?: number;
  /** 每屏最大行数（可选，通常由 layout preset 决定） */
  maxLines?: number;
  /** 字幕显示时长缩放因子（0-1），越小显示时间越短，默认 1.0 */
  displayDurationScale?: number;
  /** 字幕结束时间提前量（毫秒），设置后优先于 displayDurationScale */
  groupEndOffset?: number;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight?: "normal" | "bold";
  /** 同句双层渲染：底层按当前样式，顶层叠加一层更小文本 */
  doubleLayer?: {
    enabled?: boolean;
    /** 叠加层字号（绝对值，设计稿坐标） */
    fontSize?: number;
    /** 叠加层字号比例（相对底层），默认 0.62 */
    fontSizeScale?: number;
    fontFamily?: string;
    color?: string;
    fontWeight?: "normal" | "bold" | number;
    textShadow?: string;
    letterSpacing?: number;
    strokeWidth?: number;
    strokeColor?: string;
    paintOrder?: string;
    filter?: string;
    /** 叠加层偏移（设计稿坐标；正值右移/下移） */
    offsetX?: number;
    offsetY?: number;
    /** 叠加层每个字单独 transform */
    charTransform?: string;
    charTransformOrigin?: string;
  };
  /** 每个字单独应用的 transform（如 skewY(-4deg)） */
  charTransform?: string;
  /** 每个字单独应用 transform 的原点 */
  charTransformOrigin?: string;
  textShadow?: string;
  letterSpacing?: number;
  strokeWidth?: number;
  strokeColor?: string;
  paintOrder?: string;
  lineHeight?: number;
  filter?: string;
  /** 字幕行背景（可用于白底字） */
  background?: {
    color: string;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
    /** true: 按文字包裹；false: 铺满整行 */
    fitContent?: boolean;
  };
}

/** 标题/主讲人显示窗口（按时间或字幕时间轴锚点） */
export interface DisplayWindowConfig {
  /** 开始秒（>=0），优先级高于字幕锚点 */
  startSec?: number;
  /** 结束秒（>=0），优先级高于字幕锚点 */
  endSec?: number;
  /** 开始字幕屏（从 1 开始） */
  startSubtitleScreen?: number;
  /** 结束字幕屏（从 1 开始，按该屏结束时间） */
  endSubtitleScreen?: number;
  /** 开始字幕组 ID（从 0 开始） */
  startSubtitleGroupId?: number;
  /** 结束字幕组 ID（从 0 开始，按该组结束时间） */
  endSubtitleGroupId?: number;
}

export interface LayoutConfig {
  /** 背景填充色（当模板不使用背景视频时生效） */
  backgroundColor?: string;
  subtitleBottom: number;
  lineHeight: number;
  /** 字幕布局 preset（决定排版和默认分句参数） */
  subtitleLayoutPreset?: SubtitleLayoutPresetName;
  /** 字幕分句配置（控制显示时长等） */
  subtitleSplit?: SubtitleSplitConfig;
  /** 双语字幕配置（英文跟随中文同布局显示） */
  bilingual?: {
    enabled: boolean;
    /** 3句布局下是否隐藏第3句英文，默认 true */
    hideEnglishOnThirdLine?: boolean;
    /** 英文字幕字体 */
    fontFamily?: string;
    /** 英文字号（绝对值，设计稿坐标；设置后优先于 fontSizeScale） */
    fontSize?: number;
    /** 英文字号相对中文比例，默认 0.32 */
    fontSizeScale?: number;
    /** 中英间距（像素，设计稿坐标） */
    lineGap?: number;
    /** 多句字幕时，每层之间额外保留的最小垂直间距（像素，设计稿坐标） */
    stackExtraGap?: number;
    /** 英文字体颜色 */
    color?: string;
    /** 英文字重 */
    fontWeight?: "normal" | "bold" | number;
    /** 每行英文建议最大单词数，用于翻译约束 */
    maxEnglishWords?: number;
  };
  /** 字幕对齐方式，覆盖默认的左右交替逻辑 */
  subtitleAlign?: "left" | "center" | "right";
  /** 字幕按句位置额外垂直偏移（像素，设计稿坐标；正值上移） */
  subtitleLineOffsetY?: number[];
  /** 字幕垂直居中锚点（按视频实际高度计算） */
  subtitleVerticalCenter?: {
    enabled: boolean;
    /** 目标中心高度比例（0-1），默认 0.5 */
    centerYRatio?: number;
    /** 整体垂直偏移（像素，设计稿坐标；正值下移） */
    offsetY?: number;
  };
  /**
   * 上一句保留分裂效果（下一句出现时，将上一句切成上下两层并让出中间位置）
   * 常用于“单句接力”字幕风格。
   */
  subtitleCarrySplit?: SubtitleCarrySplitConfig;
  /** 头像配置（可选） */
  avatar?: {
    left: number;
    top: number;
    size: number;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    backgroundColor?: string;
    shadow?: string;
    objectFit?: "cover" | "contain";
    /** 是否全片常驻显示（不按 5 秒自动淡出） */
    alwaysVisible?: boolean;
    /** 头像下方音频柱条装饰（可选） */
    indicator?: {
      enabled?: boolean;
      /** 相对头像容器顶部偏移；默认 size + 18 */
      top?: number;
      width?: number;
      gap?: number;
      color?: string;
      bars?: number;
      /** 每根柱条高度（设计稿坐标） */
      barHeights?: number[];
      borderRadius?: number;
      /** 是否启用动态柱条动效，默认 true */
      animated?: boolean;
      /** 动画速度（每秒循环次数），默认 4.2 */
      speed?: number;
      /** 最小高度比例（0-1），默认 0.28 */
      minScale?: number;
      /** 最大高度比例（0-1），默认 1 */
      maxScale?: number;
    };
  };
  // 标题配置
  title: {
    top: number;
    left?: number;
    right?: number;
    width?: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    secondLineFontFamily?: string; // 第二行字体（不设置则与 fontFamily 相同）
    secondLineColor?: string;
    secondLineFontSize?: number; // 第二行字体大小（不设置则与 fontSize 相同）
    secondLineStrokeWidth?: number; // 第二行描边宽度（不设置则与 strokeWidth 相同）
    strokeWidth?: number; // 描边宽度，默认 8
    strokeColor?: string; // 描边颜色，默认 black
    fontWeight?: "normal" | "bold" | number; // 字重（不设置时按组件默认）
    textShadow?: string; // 文字阴影
    letterSpacing?: number; // 字间距（像素）
    fontStyle?: "normal" | "italic" | "oblique";
    transform?: string; // 标题整体 transform（如 skewX(-5deg)）
    transformOrigin?: string; // 标题 transform 原点（如 'center center'）
    charTransform?: string; // 标题每个字单独 transform（如 skewY(-4deg)）
    charTransformOrigin?: string; // 标题每个字 transform 原点
    lineHeight?: number; // 行高，默认 1.3
    paintOrder?: string; // 描边绘制顺序，默认 'stroke fill'
    strokeAlign?: "center" | "outside"; // 描边对齐方式，默认 'center'
    background?: {
      color: string; // 背景颜色，如 'rgba(0,0,0,0.5)'
      paddingX: number; // 水平内边距
      paddingY: number; // 垂直内边距
      borderRadius: number; // 圆角
      /** 背景整体顶部偏移（像素，设计稿坐标；负值可向上扩展到屏幕顶端） */
      topOffset?: number;
      /** 是否仅包裹标题内容（而非铺满整行） */
      fitContent?: boolean;
    };
    /** 按行渲染底条背景（每行自适应宽度） */
    lineBackground?: {
      color: string;
      /** 按行背景色，优先级高于 color（如第1行红、第2行蓝） */
      colors?: string[];
      paddingX: number;
      paddingY: number;
      borderRadius: number;
      marginBottom?: number;
      /** box: 整块包裹；stripe: 仅渲染半高底条 */
      mode?: "box" | "stripe";
      /** stripe 模式下底条高度占字体大小比例，默认 0.5 */
      heightRatio?: number;
      /** stripe 模式下底条起始位置占字体大小比例，默认 0.5（即从字高中部开始） */
      topRatio?: number;
    };
    /** 标题关键词着色（可实现同一行内多颜色） */
    highlights?: TitleHighlight[];
    /** 标题关键词样式池（与 keywordCount 搭配，供 AI 提取结果随机套用） */
    keywordStyles?: TitleHighlightStyle[];
    /** 标题关键词提取数量（默认 2，<=0 表示禁用） */
    keywordCount?: number;
    /** 多行对齐方式，如 ['left', 'right'] 表示第一行左对齐、第二行右对齐 */
    lineAlign?: ("left" | "center" | "right")[];
    /** 整块文本默认对齐方式（行级 lineAlign 不配置时生效） */
    textAlign?: "left" | "center" | "right";
    /** 每行额外垂直偏移（像素，设计稿坐标；负值可实现上下行叠压） */
    lineOffsetY?: number[];
    /** 标题显示窗口（按秒/字幕锚点控制显示区间） */
    display?: DisplayWindowConfig;
    /** 标题入场动效（默认 fadeIn） */
    animationIn?: TitleAnimationName;
    /** 标题入场动效时长（毫秒），默认 520 */
    animationInDurationMs?: number;
    /** 标题入场初始 Y 偏移（像素，设计稿坐标），默认 110 */
    animationInOffsetY?: number;
  };
  // 主讲人配置
  speaker: {
    left: number;
    top: number;
    fontFamily: string;
    /** 姓名字体（可选，不填则使用 fontFamily） */
    nameFontFamily?: string;
    /** 姓名字重（可选，默认 bold） */
    nameFontWeight?: "normal" | "bold" | number;
    /** 姓名字形（可选） */
    nameFontStyle?: "normal" | "italic" | "oblique";
    /** 姓名每个字单独 transform（如 skewY(-4deg)） */
    nameCharTransform?: string;
    /** 姓名每个字 transform 原点 */
    nameCharTransformOrigin?: string;
    /** 头衔字体（可选，不填则使用 fontFamily） */
    titleFontFamily?: string;
    /** 头衔字重（可选，默认 bold） */
    titleFontWeight?: "normal" | "bold" | number;
    /** 头衔字形（可选） */
    titleFontStyle?: "normal" | "italic" | "oblique";
    /** 头衔每个字单独 transform（如 skewY(-4deg)） */
    titleCharTransform?: string;
    /** 头衔每个字 transform 原点 */
    titleCharTransformOrigin?: string;
    nameSize: number;
    nameColor: string;
    nameStrokeWidth?: number; // 名字描边宽度，默认 4
    nameStrokeColor?: string; // 名字描边颜色，默认 black
    nameShadow?: string; // 名字阴影
    titleSize: number;
    titleColor: string;
    titleStrokeWidth?: number; // 职称描边宽度，默认 nameStrokeWidth * 0.8
    titleShadow?: string; // 职称阴影
    titleMarginTop?: number; // 职称与名字间距，默认 10
    titleLeft?: number; // 职称独立 X 坐标（选填，若设置则覆盖自动居中）
    titleTop?: number; // 职称独立 Y 坐标（选填，若设置则覆盖 titleMarginTop）
    titleLineHeight?: number; // 头衔行高（默认 1.2）
    textAlign?: "left" | "center" | "right"; // 文本对齐方式，默认 center
    /** 是否全片常驻显示（不按 5 秒自动淡出） */
    alwaysVisible?: boolean;
    /** 主讲人显示窗口（按秒/字幕锚点控制显示区间） */
    display?: DisplayWindowConfig;
    /** 主讲人底条背景（可选） */
    background?: {
      color: string;
      top: number;
      height?: number;
      /** 底部锚点（像素，设计稿坐标）；设置后优先于 height 计算 */
      bottom?: number;
      left?: number;
      right?: number;
      borderRadius?: number;
      borderTopWidth?: number;
      borderTopColor?: string;
    };
    /** 主讲人左侧装饰线（可选） */
    accentLine?: {
      left: number;
      width: number;
      color: string;
      /** 装饰线覆盖范围：title 仅覆盖头衔区域；card 覆盖姓名+头衔整体 */
      cover?: "title" | "card";
      /** 装饰线顶部（可选，不填时按名片顶部 + topOffset 自动计算） */
      top?: number;
      /** 装饰线高度（可选，不填时按名片实际高度自动计算） */
      height?: number;
      /** 自动定位时，顶部相对名片顶部的偏移 */
      topOffset?: number;
      /** 自动计算高度时，底部相对名片底部的偏移 */
      bottomOffset?: number;
      borderRadius?: number;
      rotateDeg?: number;
      shadow?: string;
    };
  };
}

export interface VideoTemplate {
  name: string;
  description: string;
  /** 模板渲染模式：normal=背景视频（默认）；pipOnly=纯画中画；podcast=纯音频播客画面 */
  mode?: "normal" | "pipOnly" | "podcast";
  /** 字幕入场动画策略：sparse=稀疏触发（默认）；sequence=每条按顺序触发 */
  subtitleAnimationStrategy?: "sparse" | "sequence";
  subtitleStyles: {
    default: SubtitleStyle;
    emphasis: SubtitleStyle;
    tertiary: SubtitleStyle;
    keyword: Partial<SubtitleStyle>;
    [styleName: string]: SubtitleStyle | Partial<SubtitleStyle>;
  };
  animations: {
    subtitleIn: AnimationName | AnimationName[];
    subtitleOut: AnimationName | AnimationName[];
    keywordEffect: AnimationName | AnimationName[];
  };
  /** 字幕样式变体：按句数配置各角色样式池（每屏随机选） */
  subtitleStyleVariants?: SubtitleStyleVariants;
  videoEffects?: VideoEffectName[]; // 允许使用的背景画面特效列表
  /** 显式动效排期（按顺序执行，可指定字幕屏与开始音效） */
  videoEffectSequence?: VideoEffectSequenceItem[];
  /** 显式音效排期（按顺序执行，可指定字幕屏） */
  sfxSequence?: SfxSequenceItem[];
  /** 显式字幕动效排期（按顺序覆盖指定字幕屏的入/出场动效） */
  subtitleAnimationSequence?: SubtitleAnimationSequenceItem[];
  /** 字幕入场动效音效池（优先级低于显式序列，高于系统默认 ding） */
  subtitleAnimationSfxMap?: SubtitleAnimationSfxMap;
  pipAnimations?: PipAnimationType[]; // 允许使用的画中画动画列表
  layout: LayoutConfig;
}

// ============================================
// 视频配置
// ============================================

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
}

// ============================================
// 任务队列相关类型
// ============================================

/** 任务状态 */
export type TaskStatus = "pending" | "processing" | "completed" | "failed";

/** 任务处理选项 */
/** 画中画素材输入项（支持纯 URL 或带标签的对象） */
export type PipInputItem = string | { url: string; tags?: string[] };

export interface TaskOptions {
  template?: string;
  title?: string;
  speaker?: string;
  speakerTitle?: string;
  /** 头像 URL（别名，兼容旧入参） */
  avatar?: string;
  /** 头像 URL（推荐字段） */
  avatarUrl?: string;
  pip?: PipInputItem[];
  bgmUrl?: string; // 用户传入的背景音乐 URL（建议 mp3）
  uploadToOss?: boolean; // 是否上传结果视频到 OSS，默认 true
  skipAsr?: boolean;
  subtitlePath?: string;
  splitSubtitlePath?: string; // 指定已有分句字幕文件路径（subtitle_split.json）
  useAI?: boolean; // 默认使用 AI 分句；传 false 则回退规则分句
  originalText?: string; // 用户提供的原始文案，用于校正 ASR 错别字
}

/** 任务日志条目 */
export interface TaskLog {
  id: number;
  taskId: string;
  level: "info" | "warn" | "error";
  step: string;
  message: string;
  data?: string;
  createdAt: string;
}

/** 任务处理结果 */
export interface TaskResult {
  outputPath?: string;
  outputUrl?: string;
  duration?: number;
  timing?: Record<string, number>;
}

/** 视频处理任务 */
export interface VideoTask {
  id: string;
  status: TaskStatus;
  priority: number;
  /** 输入媒体 URL（兼容旧字段名，可能是视频或音频） */
  videoUrl: string;
  callbackUrl?: string;
  options: TaskOptions;
  result?: TaskResult;
  progress: number;
  currentStep?: string;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/** 创建任务请求 */
export interface CreateTaskRequest {
  /** 背景视频 URL（当所选模板 mode=normal 时必需） */
  videoUrl?: string;
  /** 主音频 URL（当所选模板 mode=pipOnly/podcast 时可仅传该字段） */
  audioUrl?: string;
  callbackUrl?: string;
  options?: TaskOptions;
  priority?: number;
}

/** 任务响应 */
export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  progress?: number;
  currentStep?: string;
  result?: TaskResult;
  errorMessage?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

/** 模板列表项 */
export interface TemplateListItem {
  templateKey: string;
  templateName: string;
  templateVideoUrl: string;
  templateCoverUrl: string;
}

/** 回调通知数据 */
export interface CallbackPayload {
  taskId: string;
  status: TaskStatus;
  result?: TaskResult;
  error?: string;
}
