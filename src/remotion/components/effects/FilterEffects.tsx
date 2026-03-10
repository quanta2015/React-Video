import React from 'react';
import { interpolate, useCurrentFrame, AbsoluteFill } from 'remotion';
import { FilterEffectProps } from './types';

/**
 * 模糊发光特效 (Blur Glow)
 * 产生朦胧的发光感
 */
export const BlurGlowAction: React.FC<FilterEffectProps> = ({
    startFrame,
    durationFrames,
    intensity = 1.0,
    children,
}) => {
    const frame = useCurrentFrame();
    const endFrame = startFrame + durationFrames;

    let blur = 0;
    let brightness = 1.0;

    if (frame >= startFrame && frame <= endFrame) {
        // 呼吸式效果
        const progress = interpolate(frame, [startFrame, endFrame], [0, Math.PI * 2]);
        const wave = (Math.sin(progress) + 1) / 2; // 0 -> 1 -> 0

        blur = wave * 5 * intensity; // Max 5px blur
        brightness = 1.0 + wave * 0.3 * intensity; // Max 1.3 brightness
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                filter: `blur(${blur}px) brightness(${brightness})`,
            }}
        >
            {children}
        </div>
    );
};
