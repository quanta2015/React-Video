import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

interface Props {
    children: React.ReactNode;
    duration?: number;
}

export const WipeRight: React.FC<Props> = ({ children, duration = 30 }) => {
    const frame = useCurrentFrame();

    const progress = interpolate(frame, [0, duration], [100, 0], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.ease),
    });

    return (
        <div
            style={{
                width: '100%',
                clipPath: `inset(0 ${progress}% 0 0)`,
                WebkitClipPath: `inset(0 ${progress}% 0 0)`,
            }}
        >
            {children}
        </div>
    );
};
