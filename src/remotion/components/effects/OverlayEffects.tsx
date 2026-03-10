import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { OverlayEffectProps } from './types';

/**
 * 聚光灯特效 (Spotlight / Circle Mask)
 * 产生一个径向渐变的暗角，突出中心
 */
export const SpotlightAction: React.FC<OverlayEffectProps> = ({
    startFrame,
    durationFrames,
    width,
    height,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const endFrame = startFrame + durationFrames;

    // 检查当前帧是否在特效区间内
    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    // 椭圆形蒙版 - 增大中间可见区域
    const ellipseWidth = width * 0.55;   // 椭圆宽度（水平半径）
    const ellipseHeight = height * 0.5;  // 椭圆高度（垂直半径）
    // 蒙版中心位置
    const maskX = width / 2;
    const maskY = height / 2;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(ellipse ${ellipseWidth}px ${ellipseHeight}px at ${maskX}px ${maskY}px, transparent 50%, rgba(0,0,0,1) 100%)`,
                pointerEvents: 'none',
                zIndex: 1, // 在视频层内部的最上方
            }}
        />
    );
};

/**
 * 聚光灯脉冲特效 (Spotlight Pulse)
 * 深色暗角 + 中心小圆先缩后回弹，并伴随细微呼吸脉冲
 */
export const SpotlightPulseAction: React.FC<OverlayEffectProps> = ({
    startFrame,
    durationFrames,
    width,
    height,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const endFrame = startFrame + durationFrames;

    if (durationFrames <= 0 || frame < startFrame || frame > endFrame) {
        return null;
    }

    const localFrame = frame - startFrame;
    const progress = Math.min(1, Math.max(0, localFrame / durationFrames));
    const settleFrames = Math.max(8, Math.floor(durationFrames * 0.45));

    const springProgress = spring({
        frame: localFrame,
        fps,
        durationInFrames: settleFrames,
        config: { damping: 9, stiffness: 190, mass: 0.75 },
    });

    // 先收缩再回弹；叠加一层衰减脉冲，模拟“缩小后微微弹回”
    const baseScale = 1.12 - springProgress * 0.23;
    const reboundPulse =
        Math.sin(localFrame * 0.42) *
        0.016 *
        Math.exp(-localFrame / Math.max(1, durationFrames * 0.6));
    const breathePulse = Math.sin(localFrame * 0.14) * 0.008;
    const radiusScale = Math.min(1.15, Math.max(0.86, baseScale + reboundPulse + breathePulse));

    // 目标：小圆聚光，但保证人物面部/胸口区域可辨识
    const baseRadius = Math.max(95, Math.min(Math.min(width, height) * 0.11, 145));
    const spotlightRadius = baseRadius * radiusScale * 5;
    const maskX = width / 2;
    const maskY = height * 0.46;

    // 保持暗角明显，但避免“整屏发黑看不见主体”
    const outerDarkness = interpolate(progress, [0, 0.2, 1], [0.50, 0.68, 0.62], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });
    const midDarkness = outerDarkness * 0.56;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle ${spotlightRadius}px at ${maskX}px ${maskY}px, rgba(0,0,0,0) 58%, rgba(0,0,0,${midDarkness}) 80%, rgba(0,0,0,${outerDarkness}) 100%)`,
                pointerEvents: 'none',
                zIndex: 1,
            }}
        />
    );
};

/**
 * 特强圆形聚光 (Extreme Spotlight)
 * 周围几乎全黑，仅保留中心圆窗与弱光晕。
 */
export const SpotlightExtremeAction: React.FC<OverlayEffectProps> = ({
    startFrame,
    durationFrames,
    width,
    height,
}) => {
    const frame = useCurrentFrame();
    const endFrame = startFrame + durationFrames;

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    const localFrame = frame - startFrame;
    const pulse = 1 + Math.sin(localFrame * 0.12) * 0.05;

    const diameter = Math.min(width * 0.72, height * 0.44);
    const radius = diameter / 2;
    const maskX = width / 2;
    const maskY = height * 0.46;
    const borderWidth = Math.max(2, Math.round(diameter * 0.0045));
    const darknessRadius = Math.round(radius * 1.9);
    const darknessClearStop = (radius / Math.max(1, darknessRadius)) * 100;
    const darknessMidStop1 = Math.min(92, darknessClearStop + 7);
    const darknessMidStop2 = Math.min(96, darknessClearStop + 17);
    const haloRadius = Math.round(radius * 1.35);

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 2,
            }}
        >
            {/* 黑场层：从圆边外开始快速压暗，外部保持纯黑 */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle ${darknessRadius}px at ${maskX}px ${maskY}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${darknessClearStop.toFixed(2)}%, rgba(0,0,0,0.62) ${darknessMidStop1.toFixed(2)}%, rgba(0,0,0,0.88) ${darknessMidStop2.toFixed(2)}%, rgba(0,0,0,1) 100%)`,
                }}
            />

            {/* 圆环主体：亮边 + 发光圈 */}
            <div
                style={{
                    position: 'absolute',
                    left: maskX - radius,
                    top: maskY - radius,
                    width: diameter,
                    height: diameter,
                    borderRadius: '50%',
                    border: `${borderWidth}px solid rgba(208, 236, 255, 0.88)`,
                    boxShadow: `
                        0 0 ${Math.round(radius * 0.18)}px rgba(220, 242, 255, ${0.62 * pulse}),
                        0 0 ${Math.round(radius * 0.46)}px rgba(255, 208, 132, ${0.30 * pulse}),
                        0 0 ${Math.round(radius * 0.72)}px rgba(255, 208, 132, ${0.18 * pulse})
                    `,
                }}
            />

            {/* 贴边光晕：参考图的暖色柔和圈，不侵入中心圆窗 */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle ${haloRadius}px at ${maskX}px ${maskY}px, rgba(255,228,170,0) 0%, rgba(255,228,170,0) 74%, rgba(255,228,170,${(0.18 * pulse).toFixed(3)}) 84%, rgba(255,228,170,${(0.1 * pulse).toFixed(3)}) 92%, rgba(255,228,170,0.02) 98%, rgba(255,228,170,0) 100%)`,
                    mixBlendMode: 'screen',
                }}
            />

        </div>
    );
};

/**
 * 中心亮圈聚光 (Spotlight Center)
 * 仅保留中心亮圈，外围直接压成黑场，不叠加外圈光晕。
 */
export const SpotlightCenterAction: React.FC<OverlayEffectProps> = ({
    startFrame,
    durationFrames,
    width,
    height,
}) => {
    const frame = useCurrentFrame();
    const endFrame = startFrame + durationFrames;

    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    const diameter = Math.min(width * 0.64, height * 0.38);
    const radius = diameter / 2;
    const maskX = width / 2;
    const maskY = height * 0.46;
    const darknessRadius = Math.round(radius * 1.02);
    const darknessClearStop = 92;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 2,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle ${darknessRadius}px at ${maskX}px ${maskY}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${darknessClearStop}%, rgba(0,0,0,1) 100%)`,
                }}
            />
        </div>
    );
};

/**
 * 长方形蒙版特效 (Rectangle Mask)
 * 产生一个长方形的暗角蒙版，适用于竖屏短视频 (9:16)
 * 通过柔和的边缘渐变突出中心内容区域
 */
export const RectangleMaskAction: React.FC<OverlayEffectProps> = ({
    startFrame,
    durationFrames,
    width,
    height,
}) => {
    const frame = useCurrentFrame();
    const endFrame = startFrame + durationFrames;

    // 检查当前帧是否在特效区间内
    if (frame < startFrame || frame > endFrame) {
        return null;
    }

    // 长方形蒙版参数 - 针对竖屏短视频优化
    const maskWidth = width * 0.75;   // 可见区域宽度
    const maskHeight = height * 0.65; // 可见区域高度
    const feather = Math.min(width, height) * 0.15; // 羽化边缘大小

    // 蒙版中心位置
    const maskX = width / 2;
    const maskY = height / 2;

    // 计算矩形可见区域的边界
    const left = maskX - maskWidth / 2;
    const top = maskY - maskHeight / 2;
    const right = maskX + maskWidth / 2;
    const bottom = maskY + maskHeight / 2;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 1,
            }}
        >
            {/* 使用 SVG 实现带羽化效果的长方形蒙版 */}
            <svg
                width={width}
                height={height}
                style={{ position: 'absolute', top: 0, left: 0 }}
            >
                <defs>
                    <filter id="rect-feather" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={feather} />
                    </filter>
                    <mask id="rect-mask">
                        {/* 白色背景 = 全部可见 */}
                        <rect x="0" y="0" width={width} height={height} fill="white" />
                        {/* 黑色矩形 = 中心透明区域，带羽化 */}
                        <rect
                            x={left}
                            y={top}
                            width={maskWidth}
                            height={maskHeight}
                            rx={feather * 0.3}
                            ry={feather * 0.3}
                            fill="black"
                            filter="url(#rect-feather)"
                        />
                    </mask>
                </defs>
                {/* 应用蒙版的黑色覆盖层 */}
                <rect
                    x="0"
                    y="0"
                    width={width}
                    height={height}
                    fill="rgba(0,0,0,1)"
                    mask="url(#rect-mask)"
                />
            </svg>
        </div>
    );
};
