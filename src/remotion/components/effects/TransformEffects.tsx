import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill, Easing } from 'remotion';
import { TransformEffectProps, PanEffectProps } from './types';
import { RectangleMaskAction } from './OverlayEffects';

const getActiveProgress = (
    frame: number,
    startFrame: number,
    durationFrames: number
): number | null => {
    if (durationFrames <= 0) return null;
    const endFrame = startFrame + durationFrames;
    if (frame < startFrame || frame > endFrame) return null;
    return Math.min(1, Math.max(0, (frame - startFrame) / durationFrames));
};

/**
 * 放大特效 (Zoom In)
 * 先放大，再在尾段回落到 1.0，避免连续放大时第二段不明显
 */
export const ZoomAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);
    let scale = 1.0;

    if (progress !== null) {
        const peakScale = 1.3;
        const riseEnd = 0.58;
        const holdEnd = 0.74;

        if (progress <= riseEnd) {
            scale = interpolate(progress, [0, riseEnd], [1.0, peakScale], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        } else if (progress <= holdEnd) {
            scale = peakScale;
        } else {
            scale = interpolate(progress, [holdEnd, 1], [peakScale, 1.0], {
                easing: Easing.inOut(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        }
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 放大后突缩特效 (Zoom In + Snap Down)
 * 先渐进放大，再在中后段瞬间缩回到 1.0 并保持。
 * 注意：不能缩到 1.0 以下，否则会露出容器底色黑边。
 */
export const ZoomInSnapDownAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);
    let scale = 1.0;

    if (progress !== null) {
        const peakScale = 1.28;
        const snapScale = 1.0;
        const zoomEnd = 0.62;
        const snapPoint = 0.64;

        if (progress <= zoomEnd) {
            scale = interpolate(progress, [0, zoomEnd], [1.0, peakScale], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        } else if (progress < snapPoint) {
            scale = peakScale;
        } else {
            // 在 snapPoint 直接硬切到 1.0，尾段不做回弹/恢复。
            scale = snapScale;
        }
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 瞬时放大特效 (Snap Zoom)
 * 起始帧立即跳到峰值，尾段也以硬切方式瞬间缩回到 1.0（不做平滑过渡）。
 */
export const SnapZoomAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);
    let scale = 1.0;

    if (progress !== null) {
        const peakScale = 1.3;
        // 尾段硬切回收点：进入最后 10% 时直接从峰值跳回 1.0。
        const snapBackAt = 0.9;
        scale = progress < snapBackAt ? peakScale : 1.0;
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 瞬时放大 + 平滑回收特效 (Snap Zoom Smooth Down)
 * 起始帧立即跳到峰值，随后平滑缩回到 1.0。
 */
export const SnapZoomSmoothDownAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);
    let scale = 1.0;

    if (progress !== null) {
        const peakScale = 1.3;
        const holdEnd = 0.08;

        if (progress <= holdEnd) {
            // 起始瞬时放大后保持极短时间，保留“冲击感”。
            scale = peakScale;
        } else {
            scale = interpolate(progress, [holdEnd, 1], [peakScale, 1.0], {
                easing: Easing.inOut(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        }
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 强模糊快速拉清特效 (Blur Snap Clear)
 * 开始阶段强模糊并轻微推镜，随后在前段快速恢复清晰。
 */
export const BlurSnapClearAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);

    let blur = 0;
    let scale = 1.0;
    let brightness = 1.0;

    if (progress !== null) {
        const revealEnd = 0.33;
        const settleEnd = 0.46;
        const startBlur = 30;
        const midBlur = 1.5;
        const startScale = 1.1;
        const midScale = 1.015;

        if (progress <= revealEnd) {
            const revealProgress = interpolate(progress, [0, revealEnd], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
            blur = interpolate(revealProgress, [0, 1], [startBlur, midBlur], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
            scale = interpolate(revealProgress, [0, 1], [startScale, midScale], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
            brightness = interpolate(revealProgress, [0, 1], [1.08, 1.02], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        } else if (progress <= settleEnd) {
            const settleProgress = interpolate(progress, [revealEnd, settleEnd], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
            blur = interpolate(settleProgress, [0, 1], [midBlur, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
            scale = interpolate(settleProgress, [0, 1], [midScale, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
            brightness = interpolate(settleProgress, [0, 1], [1.02, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        }
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                filter: `blur(${blur}px) brightness(${brightness})`,
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 椭圆蒙版 + 缩小特效 (Ellipse Mask + Zoom Out)
 * - 在 startFrame 开始执行 zoomOut
 * - 椭圆蒙版在 zoomOut 结束后额外保留 1 秒再消失
 */
export const EllipseMaskZoomOutAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const progress = getActiveProgress(frame, startFrame, durationFrames);

    const maskEndFrame = startFrame + durationFrames + fps;
    const isMaskVisible = frame >= startFrame && frame <= maskEndFrame;

    // 非激活期直接透传，避免无意义包裹影响其他特效
    if (!isMaskVisible && progress === null) {
        return <>{children}</>;
    }

    let scale = 1.0;
    if (progress !== null) {
        scale = interpolate(progress, [0, 1], [1.12, 1.0], {
            easing: Easing.inOut(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
    }

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* 仅背景画面参与 zoomOut，蒙版层保持固定尺寸 */}
            <AbsoluteFill
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                }}
            >
                {children}
            </AbsoluteFill>

            {isMaskVisible && (
                <AbsoluteFill style={{ pointerEvents: 'none' }}>
                    {/* 主暗角：椭圆宽高都与视频一致，外围半透明压暗 */}
                    <AbsoluteFill
                        style={{
                            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.56) 62%, rgba(0,0,0,0.84) 80%, rgba(0,0,0,0.96) 100%)',
                        }}
                    />

                    {/* 轻微暖色光晕：参考示例的中心泛光 */}
                    <AbsoluteFill
                        style={{
                            background: 'radial-gradient(ellipse 100% 100% at 50% 48%, rgba(255,216,156,0.05) 0%, rgba(255,216,156,0.02) 42%, rgba(255,216,156,0) 74%)',
                        }}
                    />
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};

/**
 * 长方形蒙版 + 快速 SnapZoom (Rectangle Mask + Snap Zoom)
 * - 开始后 0.2 秒内快速放大再缩回
 * - 长方形蒙版保持 1 秒后消失
 */
export const RectangleMaskSnapZoomAction: React.FC<TransformEffectProps> = ({
    startFrame,
    children,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const zoomWindowFrames = Math.max(2, Math.round(fps * 0.2));
    const maskWindowFrames = Math.max(2, Math.round(fps * 1));

    const zoomStart = startFrame;
    const zoomEnd = startFrame + zoomWindowFrames;
    const maskEnd = startFrame + maskWindowFrames;

    const isInZoomWindow = frame >= zoomStart && frame <= zoomEnd;
    const isMaskVisible = frame >= startFrame && frame <= maskEnd;

    if (!isMaskVisible && !isInZoomWindow) {
        return <>{children}</>;
    }

    let scale = 1.0;
    if (isInZoomWindow) {
        const quickProgress = (frame - zoomStart) / Math.max(1, zoomWindowFrames);
        const zoomInEnd = 0.35;
        const peakScale = 1.24;

        if (quickProgress <= zoomInEnd) {
            scale = interpolate(quickProgress, [0, zoomInEnd], [1.0, peakScale], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        } else {
            scale = interpolate(quickProgress, [zoomInEnd, 1], [peakScale, 1.0], {
                easing: Easing.inOut(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        }
    }

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            <AbsoluteFill
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                }}
            >
                {children}
            </AbsoluteFill>

            {/* 蒙版独立叠加：样式与 RectangleMask 保持一致，且不跟随背景缩放 */}
            {isMaskVisible && (
                <RectangleMaskAction
                    startFrame={startFrame}
                    durationFrames={maskWindowFrames}
                    width={width}
                    height={height}
                />
            )}
        </AbsoluteFill>
    );
};

/**
 * 抖动特效 (Shake)
 * 简单的随机位置抖动
 */
export const ShakeAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const endFrame = startFrame + durationFrames;

    let x = 0;
    let y = 0;

    if (frame >= startFrame && frame < endFrame) {
        const progress = (frame - startFrame) / durationFrames;
        const intensity = 10 * (1 - progress); // 随时间减弱
        x = (Math.random() - 0.5) * intensity;
        y = (Math.random() - 0.5) * intensity;
    }

    return (
        <AbsoluteFill
            style={{
                transform: `translate(${x}px, ${y}px)`,
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 平移特效 (Pan)
 * 向左或向右滑动
 */
export const PanAction: React.FC<PanEffectProps> = ({
    startFrame,
    durationFrames,
    direction,
    distance = 4, // 默认移动 4%，更接近参考视频的轻微推镜头
    motionEndProgress = 0.7,
    children,
}) => {
    const frame = useCurrentFrame();
    const endFrame = startFrame + durationFrames;

    let translateX = 0;
    let scale = 1;

    if (frame >= startFrame && frame <= endFrame) {
        const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });

        const clampedMotionEnd = Math.min(0.95, Math.max(0.05, motionEndProgress));
        const motionProgress = interpolate(progress, [0, clampedMotionEnd, 1], [0, 1, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
        const easedProgress = Easing.out(Easing.cubic)(motionProgress);

        const offset = direction === 'left' ? -distance : distance;
        translateX = offset * easedProgress;

        // 平移时做轻微放大，防止边缘露出底色黑边。
        // 公式：scale >= 1 + 2 * |translateX|max / 100
        const minScale = 1 + (Math.abs(distance) * 2) / 100;
        scale = minScale + 0.01; // 预留 1% 安全余量，避免子像素取整露边
    }

    return (
        <AbsoluteFill
            style={{ overflow: 'hidden' }}
        >
            <AbsoluteFill
                style={{
                    transform: `translateX(${translateX}%) scale(${scale})`,
                    transformOrigin: 'center center',
                }}
            >
                {children}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

/**
 * 右向左刷入特效 (Swipe From Right)
 * 通过同源副本层从右向左快速掠过，底层保持静止，避免“回落/复位感”。
 */
export const SwipeFromRightAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);

    if (progress === null) {
        return <>{children}</>;
    }

    // 在动效前 6% 完成刷入，尾随 2% 快速消除拖影。
    const swipeEnd = 0.06;
    const blurEnd = 0.08;
    if (progress >= blurEnd) {
        return <>{children}</>;
    }

    const translateX = interpolate(progress, [0, swipeEnd], [100, 0], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const blur = interpolate(progress, [0, swipeEnd, blurEnd], [10, 2, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <AbsoluteFill>{children}</AbsoluteFill>
            <AbsoluteFill
                style={{
                    transform: `translateX(${translateX}%)`,
                    transformOrigin: 'center center',
                    filter: blur > 0 ? `blur(${blur}px)` : undefined,
                }}
            >
                {children}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

/**
 * 缩小特效 (Zoom Out)
 * 从 1.1 缩小到 1.0
 */
export const ZoomOutAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);
    let scale = 1.0;

    if (progress !== null) {
        scale = interpolate(progress, [0, 1], [1.1, 1.0], {
            easing: Easing.inOut(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
            }}
        >
            {children}
        </AbsoluteFill>
    );
};

/**
 * 聚焦放大特效 (Focus Zoom / Magnifier)
 * 强烈的放大效果，模拟放大镜
 */
export const FocusZoomAction: React.FC<TransformEffectProps> = ({
    startFrame,
    durationFrames,
    children,
}) => {
    const frame = useCurrentFrame();
    const progress = getActiveProgress(frame, startFrame, durationFrames);

    let scale = 1.0;

    if (progress !== null) {
        const peakScale = 1.5;
        const inEnd = 0.16;
        const outStart = 0.78;

        if (progress <= inEnd) {
            scale = interpolate(progress, [0, inEnd], [1.0, peakScale], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        } else if (progress < outStart) {
            scale = peakScale;
        } else {
            scale = interpolate(progress, [outStart, 1], [peakScale, 1.0], {
                easing: Easing.inOut(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            });
        }
    }

    return (
        <AbsoluteFill
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
            }}
        >
            {children}
        </AbsoluteFill>
    );
};
