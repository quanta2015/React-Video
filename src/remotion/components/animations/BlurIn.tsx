import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { ManualAnimationProps } from './animations';

export const BlurIn: React.FC<ManualAnimationProps> = ({ children, durationFrames }) => {
    const frame = useCurrentFrame();
    const duration = 20; // Default duration ~2/3 second

    const opacity = interpolate(frame, [0, duration], [0, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.ease),
    });

    const blur = interpolate(frame, [0, duration], [10, 0], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.ease),
    });

    return (
        <div
            style={{
                width: '100%',
                opacity,
                filter: `blur(${blur}px)`,
                transform: 'translateZ(0)', // Force GPU acceleration
            }}
        >
            {children}
        </div>
    );
};
