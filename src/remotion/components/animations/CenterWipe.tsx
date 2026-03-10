import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { ManualAnimationProps } from './animations';

export const CenterWipe: React.FC<ManualAnimationProps> = ({ children, durationFrames }) => {
    const frame = useCurrentFrame();
    const duration = Math.max(14, Math.min(34, durationFrames));
    const squashEnd = Math.max(2, Math.floor(duration * 0.38));
    const overshootEnd = Math.max(squashEnd + 1, Math.floor(duration * 0.72));

    // All characters are visible from frame 0, only shape changes.
    const scaleX = interpolate(frame, [0, squashEnd, overshootEnd, duration], [0.46, 1.18, 0.98, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
    });
    const scaleY = interpolate(frame, [0, squashEnd, overshootEnd, duration], [1.28, 0.86, 1.02, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
    });

    return (
        <div
            style={{
                width: '100%',
            }}
        >
            <div
                style={{
                    transform: `scale(${scaleX}, ${scaleY})`,
                    transformOrigin: '50% 50%',
                    willChange: 'transform',
                }}
            >
                {children}
            </div>
        </div>
    );
};
