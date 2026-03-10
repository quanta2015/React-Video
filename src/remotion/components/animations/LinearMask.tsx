import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { ManualAnimationProps } from './animations';

export const LinearMask: React.FC<ManualAnimationProps> = ({ children, durationFrames }) => {
    const frame = useCurrentFrame();
    const duration = 30; // Default duration

    const progress = interpolate(frame, [0, duration], [0, 100], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.ease),
    });

    const gradient = `linear-gradient(90deg, black ${progress}%, transparent ${progress + 20}%)`;

    return (
        <div
            style={{
                width: '100%',
                maskImage: gradient,
                WebkitMaskImage: gradient,
            }}
        >
            {children}
        </div>
    );
};
