import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { ManualAnimationProps } from './animations';

export const BouncePopIn: React.FC<ManualAnimationProps> = ({ children }) => {
    const frame = useCurrentFrame();
    const t = Math.max(0, Math.min(frame, 22));

    const opacity = interpolate(t, [0, 4], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
    });

    // 三段式：从下往上跳出 -> 落地轻蹲 -> 回正站起
    const translateY = interpolate(t, [0, 6, 11, 16, 22], [56, -12, 8, -2, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
    });

    // 缩放只做“蹲下/回弹”辅助，避免“从远处靠近”的视觉
    const scaleX = interpolate(t, [0, 6, 11, 16, 22], [0.98, 1.03, 1.08, 0.995, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
    });

    const scaleY = interpolate(t, [0, 6, 11, 16, 22], [0.92, 1.05, 0.9, 1.015, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
    });

    return (
        <div
            style={{
                width: '100%',
                opacity,
                transform: `translateY(${translateY}px) scale(${scaleX}, ${scaleY})`,
                transformOrigin: '50% 50%',
                willChange: 'transform, opacity',
            }}
        >
            {children}
        </div>
    );
};
