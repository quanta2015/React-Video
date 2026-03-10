import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type SpringConfig = {
  mass?: number;
  damping?: number;
  stiffness?: number;
  overshootClamping?: boolean;
  restSpeedThreshold?: number;
  restDisplacementThreshold?: number;
};

type BaseAnimationOptions = SpringConfig & {
  start?: number;
  duration?: number;
};

type AnimationValues = {
  opacity?: number;
  width?: number | string;
  height?: number | string;
  translateX?: number;
  translateY?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
};

export type Animation = {
  in: number;
  valuesAt: (frame: number, fps: number) => AnimationValues;
};

type FadeOptions = BaseAnimationOptions & {
  to: number;
  initial?: number;
};

type MoveOptions = BaseAnimationOptions & {
  x?: number;
  y?: number;
  initialX?: number;
  initialY?: number;
};

type ScaleOptions = BaseAnimationOptions & {
  by?: number;
  x?: number;
  y?: number;
  initial?: number;
  initialX?: number;
  initialY?: number;
};

type RotateOptions = BaseAnimationOptions & {
  degrees: number;
  initial?: number;
};

type AnimatedProps = {
  animations: Animation[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  absolute?: boolean;
  delay?: number;
  in?: number;
  out?: number;
};

const DEFAULT_SMOOTH_SPRING: SpringConfig = {
  mass: 1,
  stiffness: 100,
  damping: 15,
  overshootClamping: false
};

const DEFAULT_FADE_DURATION = 45; // 1.5 seconds at 30fps - slower for better visibility

const interpolateValue = (progress: number, to?: number, initial: number = 0, fallback: number = initial): number => {
  if (to === undefined) return fallback;
  return interpolate(progress, [0, 1], [initial, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
};

const smoothSpring = (frame: number, fps: number, options: BaseAnimationOptions = {}): number => {
  const cfg: SpringConfig = {
    ...DEFAULT_SMOOTH_SPRING,
    mass: options.mass,
    damping: options.damping,
    stiffness: options.stiffness,
    overshootClamping: options.overshootClamping,
    restSpeedThreshold: options.restSpeedThreshold,
    restDisplacementThreshold: options.restDisplacementThreshold
  };
  const cleanedCfg = Object.fromEntries(Object.entries(cfg).filter(([, value]) => value !== undefined)) as SpringConfig;

  return spring({
    fps,
    frame: frame - (options.start ?? 0),
    durationInFrames: options.duration,
    config: cleanedCfg
  });
};

const reduceValue = (property: keyof AnimationValues, incoming: number, prev?: number): number => {
  if (prev === undefined) return incoming;
  if (property === "translateX" || property === "translateY" || property === "rotate") {
    return prev + incoming;
  }
  if (property === "scaleX" || property === "scaleY") {
    return prev * incoming;
  }
  return incoming;
};

const mergeAnimatedValues = (valueLists: AnimationValues[]): AnimationValues => {
  return valueLists.reduce<AnimationValues>((acc, values) => {
    const next: AnimationValues = { ...acc };
    const nextMutable = next as Record<string, unknown>;
    (Object.keys(values) as (keyof AnimationValues)[]).forEach((key) => {
      const current = values[key];
      if (current === undefined) return;
      if (typeof current === "number") {
        const prev = typeof next[key] === "number" ? (next[key] as number) : undefined;
        nextMutable[key] = reduceValue(key, current, prev);
      } else {
        nextMutable[key] = current;
      }
    });
    return next;
  }, {});
};

const transformFromValues = (values: AnimationValues): string | undefined => {
  let translate: string | undefined;
  let scale: string | undefined;
  let rotate: string | undefined;

  if (values.translateX !== undefined || values.translateY !== undefined) {
    translate = `translate(${(values.translateX ?? 0).toFixed(4)}px, ${(values.translateY ?? 0).toFixed(4)}px)`;
  }
  if (values.scaleX !== undefined || values.scaleY !== undefined) {
    scale = `scale(${(values.scaleX ?? 1).toFixed(4)}, ${(values.scaleY ?? 1).toFixed(4)})`;
  }
  if (values.rotate !== undefined) {
    rotate = `rotate(${values.rotate.toFixed(4)}deg)`;
  }

  const transform = [translate, scale, rotate].filter(Boolean).join(" ").trim();
  return transform || undefined;
};

const stylesFromAnimatedValues = (values: AnimationValues): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  if (values.opacity !== undefined) styles.opacity = values.opacity;
  if (values.width !== undefined) styles.width = values.width;
  if (values.height !== undefined) styles.height = values.height;
  const transform = transformFromValues(values);
  if (transform) styles.transform = transform;
  return styles;
};

export const Fade = (options: FadeOptions): Animation => {
  const duration = options.duration ?? DEFAULT_FADE_DURATION;
  const start = options.start ?? 0;
  return {
    in: start,
    valuesAt: (frame) => ({
      opacity: interpolate(frame, [start, start + duration], [options.initial ?? 1, options.to], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp"
      })
    })
  };
};

export const Move = (options: MoveOptions): Animation => {
  return {
    in: options.start ?? 0,
    valuesAt: (frame, fps) => {
      const progress = smoothSpring(frame, fps, options);
      return {
        translateX: interpolateValue(progress, options.x, options.initialX),
        translateY: interpolateValue(progress, options.y, options.initialY)
      };
    }
  };
};

export const Scale = (options: ScaleOptions): Animation => {
  return {
    in: options.start ?? 0,
    valuesAt: (frame, fps) => {
      const progress = smoothSpring(frame, fps, options);
      const initial = options.initial ?? 1;
      const initialX = options.initialX ?? initial;
      const initialY = options.initialY ?? initial;
      return {
        scaleX: interpolateValue(progress, options.x ?? options.by, initialX, initialX),
        scaleY: interpolateValue(progress, options.y ?? options.by, initialY, initialY)
      };
    }
  };
};

export const Rotate = (options: RotateOptions): Animation => {
  return {
    in: options.start ?? 0,
    valuesAt: (frame, fps) => {
      const progress = smoothSpring(frame, fps, options);
      return {
        rotate: interpolateValue(progress, options.degrees, options.initial ?? 1, options.initial ?? 1)
      };
    }
  };
};

export const Animated: React.FC<AnimatedProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const animationFrame = frame - (props.delay ?? 0);

  const isBeforeInPoint = props.in !== undefined && frame < props.in;
  const isAfterOutPoint = props.out !== undefined && frame > props.out;
  if (isBeforeInPoint || isAfterOutPoint) {
    return null;
  }

  const animatedStyles = useMemo(() => {
    const active = props.animations.filter((animation) => animation.in <= animationFrame);
    const computed = active.map((animation) => animation.valuesAt(animationFrame, fps) ?? {});
    const reduced = mergeAnimatedValues(computed);
    return stylesFromAnimatedValues(reduced);
  }, [animationFrame, fps, props.animations]);

  return (
    <div
      className={props.className}
      style={{
        ...props.style,
        ...animatedStyles,
        position: props.absolute ? "absolute" : props.style?.position
      }}
    >
      {props.children}
    </div>
  );
};
