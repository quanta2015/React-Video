
import React from 'react';
import { AbsoluteFill, Series, useVideoConfig } from 'remotion';
import { VideoEffectName } from '../types';
import { ZoomAction, ZoomInSnapDownAction, SnapZoomAction, SnapZoomSmoothDownAction, BlurSnapClearAction, EllipseMaskZoomOutAction, RectangleMaskSnapZoomAction, ShakeAction, PanAction, ZoomOutAction, FocusZoomAction, SwipeFromRightAction } from './components/effects/TransformEffects';
import { SpotlightAction, SpotlightPulseAction, SpotlightExtremeAction, SpotlightCenterAction, RectangleMaskAction } from './components/effects/OverlayEffects';
import { BlurGlowAction } from './components/effects/FilterEffects';

export const VIDEO_EFFECTS_PREVIEW_LIST: VideoEffectName[] = [
    'zoomIn',
    'zoomInSnapDown',
    'snapZoom',
    'snapZoomSmoothDown',
    'blurSnapClear',
    'ellipseMaskZoomOut',
    'rectangleMaskSnapZoom',
    'zoomOut',
    'panLeft',
    'swipeFromRight',
    'panRight',
    'magnifier',
    'shake',
    'blurGlow',
    'spotlight',
    'spotlightPulse',
    'spotlightExtreme',
    'spotlightCenter',
    'rectangleMask',
];

export const VIDEO_EFFECT_PREVIEW_DURATION = 90; // 3 seconds per effect

const EffectPreviewItem: React.FC<{ effectName: VideoEffectName }> = ({ effectName }) => {
    const { width, height, fps } = useVideoConfig();
    const durationFrames = VIDEO_EFFECT_PREVIEW_DURATION;

    // Common props for effects
    const effectProps = {
        startFrame: 0,
        durationFrames: durationFrames,
    };

    // Render the content with background pattern
    let content = (
        <AbsoluteFill style={{
            backgroundColor: '#333',
            background: 'repeating-linear-gradient(45deg, #333 0, #333 20px, #444 20px, #444 40px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <div style={{
                fontSize: 100,
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                zIndex: 5
            }}>
                Background Content
            </div>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                border: '20px solid #E6782D',
                opacity: 0.5
            }} />
        </AbsoluteFill>
    );

    // Apply wrapper effects
    switch (effectName) {
        case 'zoomIn':
            content = <ZoomAction {...effectProps}>{content}</ZoomAction>;
            break;
        case 'zoomInSnapDown':
            content = <ZoomInSnapDownAction {...effectProps}>{content}</ZoomInSnapDownAction>;
            break;
        case 'snapZoom':
            content = <SnapZoomAction {...effectProps}>{content}</SnapZoomAction>;
            break;
        case 'snapZoomSmoothDown':
            content = <SnapZoomSmoothDownAction {...effectProps}>{content}</SnapZoomSmoothDownAction>;
            break;
        case 'blurSnapClear':
            content = <BlurSnapClearAction {...effectProps}>{content}</BlurSnapClearAction>;
            break;
        case 'ellipseMaskZoomOut':
            content = <EllipseMaskZoomOutAction {...effectProps}>{content}</EllipseMaskZoomOutAction>;
            break;
        case 'rectangleMaskSnapZoom':
            content = <RectangleMaskSnapZoomAction {...effectProps}>{content}</RectangleMaskSnapZoomAction>;
            break;
        case 'zoomOut':
            content = <ZoomOutAction {...effectProps}>{content}</ZoomOutAction>;
            break;
        case 'magnifier':
            content = <FocusZoomAction {...effectProps}>{content}</FocusZoomAction>;
            break;
        case 'panLeft':
            content = <PanAction {...effectProps} direction="left">{content}</PanAction>;
            break;
        case 'swipeFromRight':
            content = <SwipeFromRightAction {...effectProps}>{content}</SwipeFromRightAction>;
            break;
        case 'panRight':
            content = <PanAction {...effectProps} direction="right">{content}</PanAction>;
            break;
        case 'shake':
            content = <ShakeAction {...effectProps}>{content}</ShakeAction>;
            break;
        case 'blurGlow':
            content = <BlurGlowAction {...effectProps}>{content}</BlurGlowAction>;
            break;
        // spotlight is an overlay, handled separately below
    }

    return (
        <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
            {content}

            {/* Overlay Effects */}
            {effectName === 'spotlight' && (
                <SpotlightAction
                    startFrame={0}
                    durationFrames={durationFrames}
                    width={width}
                    height={height}
                />
            )}
            {effectName === 'spotlightPulse' && (
                <SpotlightPulseAction
                    startFrame={0}
                    durationFrames={durationFrames}
                    width={width}
                    height={height}
                />
            )}
            {effectName === 'spotlightExtreme' && (
                <SpotlightExtremeAction
                    startFrame={0}
                    durationFrames={durationFrames}
                    width={width}
                    height={height}
                />
            )}
            {effectName === 'spotlightCenter' && (
                <SpotlightCenterAction
                    startFrame={0}
                    durationFrames={durationFrames}
                    width={width}
                    height={height}
                />
            )}
            {effectName === 'rectangleMask' && (
                <RectangleMaskAction
                    startFrame={0}
                    durationFrames={durationFrames}
                    width={width}
                    height={height}
                />
            )}

            {/* Label */}
            <div style={{
                position: 'absolute',
                top: 50,
                left: 50,
                color: 'white',
                fontSize: 40,
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                zIndex: 100
            }}>
                Effect: <span style={{ color: '#4facfe' }}>{effectName}</span>
            </div>
        </AbsoluteFill>
    );
};

export const AllVideoEffectsPreview: React.FC = () => {
    return (
        <Series>
            {VIDEO_EFFECTS_PREVIEW_LIST.map((effect) => (
                <Series.Sequence key={effect} durationInFrames={VIDEO_EFFECT_PREVIEW_DURATION}>
                    <EffectPreviewItem effectName={effect} />
                </Series.Sequence>
            ))}
        </Series>
    );
};
