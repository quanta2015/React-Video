import { Scale, Fade, Move, Rotate, Animation } from "./remotionAnimatedCompat";
import { AnimationName, StyledSubtitle, VideoTemplate, SubtitleStyle } from "../../../types";
import { WipeRight } from "./WipeRight";
import { FeatherWipeRight } from "./FeatherWipeRight";
import { TypeWriterText } from "./TypeWriterText";
import { BlurIn } from "./BlurIn";
import { LinearMask } from "./LinearMask";
import { WaveIn } from "./WaveIn";
import { BouncePopIn } from "./BouncePopIn";
import { CenterWipe } from "./CenterWipe";

export interface ManualAnimationProps {
  children: React.ReactNode;
  subtitle: StyledSubtitle;
  template: VideoTemplate;
  fps: number;
  durationFrames: number;
  styleConfig: SubtitleStyle;
  scaledFontSize: number;
}

/** 手动实现的动画组件映射 */
export const MANUAL_ANIMATION_COMPONENTS: Partial<Record<AnimationName, React.FC<ManualAnimationProps>>> = {
  wipeRight: WipeRight,
  featherWipeRight: FeatherWipeRight,
  typeWriter: TypeWriterText,
  blurIn: BlurIn,
  linearMask: LinearMask,
  centerWipe: CenterWipe,
  waveIn: WaveIn,
  wave: WaveIn,
  bouncePopIn: BouncePopIn
};

/** 入场节奏较慢的动画：短尾句时应尽量避免 */
export const SLOW_ANIMATIONS: AnimationName[] = [
  "wipeRight",
  "featherWipeRight",
  "blurIn",
  "typeWriter",
  "linearMask",
  "centerWipe",
  "waveIn",
  "wave"
];

/**
 * 这些入场动画会对整句做明显位移/缩放/旋转，
 * 与关键词回弹叠加时容易放大“抖动感”。
 */
const KEYWORD_EFFECT_CONFLICTING_IN_ANIMATIONS = new Set<AnimationName>([
  "scaleIn",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "bounce",
  "flipUp",
  "popIn",
  "bouncePopIn",
  "popUp",
  "zoomIn",
  "zoomOut",
  "contract",
  "springUp",
  "springDown",
  "swingIn",
  "waveIn",
  "wave",
  "revealDown",
  "revealUp",
  "pageTurn",
  "shake",
  "grow",
  "rotate",
  "slideUpReturn",
  "slideDownReturn",
  "slideRightOut",
  "slideLeftIn",
  "slideDownSimple"
]);

export const shouldDisableKeywordEffect = (animationIn?: AnimationName): boolean => {
  if (!animationIn) return false;
  return KEYWORD_EFFECT_CONFLICTING_IN_ANIMATIONS.has(animationIn);
};

/** 默认动画持续帧数 - 1.5 seconds at 30fps */
export const DEFAULT_ANIMATION_DURATION = 10;

/** 根据动画名称生成入场动画配置 */
export function getInAnimation(
  name: AnimationName,
  durationFrames: number,
  durationFnString?: number
): Animation | Animation[] | null {
  const duration = durationFnString || DEFAULT_ANIMATION_DURATION;

  switch (name) {
    case "scaleIn": // 缩放进入
      return Scale({ by: 1, initial: 0, duration });
    case "typeWriter": // 打字机
      return null; // Handle manually in render
    case "fadeIn": // 渐显
      return Fade({ to: 1, initial: 0, duration });
    case "linearMask": // 线性蒙版
    case "centerWipe": // 中线向两侧展开
      return null; // Handle manually in component
    case "slideUp": // 向上滑动
      return Move({ y: 0, initialY: 50, duration });
    case "slideDown": // 向下滑动
      return Move({ y: 0, initialY: -50, duration });
    case "slideLeft": // 向左滑动
      return Move({ x: 0, initialX: 50, duration });
    case "slideRight": // 向右滑动
      return Move({ x: 0, initialX: -50, duration });
    case "bounce": // 弹入
      return Scale({ by: 1, initial: 0, duration, mass: 50 });

    case "flipUp": // 向上翻转
      return Scale({ y: 1, initialY: 0, duration }); // Rotate supports Z only, utilize Scale Y for flip effect
    case "popIn": // 向上弹出
    case "popUp":
      return Scale({ by: 1, initial: 0, duration, mass: 0.6, damping: 200, stiffness: 250 });
    case "bouncePopIn": // 跳出 -> 轻蹲 -> 回正（由手写组件处理）
      return null;
    case "blurIn": // 模糊
      return null; // Handle manually in component
    case "zoomIn": // 放大
      return Scale({ by: 1, initial: 0, duration });
    case "zoomOut": // 缩小
      return Scale({ by: 1, initial: 1.5, duration });
    case "contract": // 收拢
      return Scale({ by: 1, initial: 1.2, duration });
    case "springUp": // 向上露出
      return Move({ y: 0, initialY: 100, duration, mass: 2, damping: 200, stiffness: 200 });
    case "springDown": // 向下露出
      return Move({ y: 0, initialY: -100, duration, mass: 2, damping: 200, stiffness: 200 });
    case "swingIn": // 甩入
      return Rotate({ degrees: 0, initial: -30, duration });
    case "waveIn": // 波浪弹入 (简单模拟)
    case "wave": // 波浪
      return null; // Handle manually in component
    case "revealDown": // 向下弹入
      return Move({ y: 0, initialY: -30, duration });
    case "revealUp": // 向上弹入
      return Move({ y: 0, initialY: 30, duration });
    case "wipeRight": // 向右擦除
    case "featherWipeRight": // 羽化向右擦除
      return null; // Handle manually in component
    case "pageTurn": // 翻页
      return Scale({ x: 1, initialX: 0, duration }); // Scale X to simulate page turn
    case "shake": // 抖动
      return Rotate({ degrees: 0, initial: 10, duration }); // loop unsupported
    case "grow": // 生长
      return Scale({ by: 1, initial: 0.5, duration });
    case "rotate": // 旋转
      return Rotate({ degrees: 360, initial: 0, duration });
    case "trail": // 拖尾
      return Fade({ to: 1, initial: 0.5, duration });
    case "slideUpReturn": // 向上滑动(大幅)
      return Move({ y: 0, initialY: 100, duration });
    case "slideDownReturn": // 向下滑动(大幅)
      return Move({ y: 0, initialY: -100, duration });
    case "slideRightOut": // 向右滑出(这里作为入场反向)
      return Move({ x: 0, initialX: -100, duration });
    case "slideLeftIn": // 向左滑入
      return Move({ x: 0, initialX: 100, duration });
    case "slideDownSimple": // 下滑
      return Move({ y: 0, initialY: -50, duration });
    case "carrySplit": // 上一句分裂保留（当前句不做额外入场）
      return null;
    default:
      return null;
  }
}

/** 根据动画名称生成出场动画配置 */
export function getOutAnimation(name: AnimationName, durationFrames: number, durationFnString?: number) {
  const duration = durationFnString || DEFAULT_ANIMATION_DURATION;
  const outStart = Math.max(0, durationFrames - duration);

  switch (name) {
    case "scaleOut": // 缩放退出
    case "zoomOut": // 缩小
      return Scale({ by: 0, start: outStart, duration });
    case "fadeOut": // 渐隐
    case "none": // 无
      return Fade({ to: 0, start: outStart, duration });
    case "slideUp": // 向上划走
      return Move({ y: -50, start: outStart, duration });
    case "slideDown": // 向下划走
      return Move({ y: 50, start: outStart, duration });
    case "slideLeft": // 向左划走
      return Move({ x: -50, start: outStart, duration });
    case "slideRight": // 向右划走
      return Move({ x: 50, start: outStart, duration });
    case "wipeRight": // 向右擦除
      return Move({ x: 50, start: outStart, duration });
    case "flipUp": // 向上翻转消失
      return Scale({ y: 0, start: outStart, duration });
    case "contract": // 收拢消失
      return Scale({ by: 0.8, start: outStart, duration });
    case "slideRightOut": // 向右滑出
      return Move({ x: 100, start: outStart, duration });
    default:
      return null;
  }
}
