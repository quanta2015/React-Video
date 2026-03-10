import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

interface Props {
    children: React.ReactNode;
    duration?: number;
}

export const FeatherWipeRight: React.FC<Props> = ({ children, duration = 30 }) => {
    const frame = useCurrentFrame();

    // 范围从 -20% 到 120% 以确保 completely clear
    const progress = interpolate(frame, [0, duration], [0, 120], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.ease),
    });

    const gradient = `linear-gradient(90deg, black ${progress - 20}%, transparent ${progress}%)`;

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
