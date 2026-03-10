import React from 'react';
import { Animated, Fade } from './animations/remotionAnimatedCompat';
import { Word, SubtitleStyle, VideoTemplate } from '../../types';
import { msToFrame } from '../../utils/time';

interface Props {
    words: Word[];
    fps: number;
    subtitleStart: number;
    keyword?: string;
    styleConfig: SubtitleStyle;
    template: VideoTemplate;
    fontSize: number;
}

export const TypeWriterText: React.FC<Props> = ({
    words,
    fps,
    subtitleStart,
    keyword,
    styleConfig,
    template,
    fontSize,
}) => {
    return (
        <>
            {words.map((word, index) => {
                const wordStartFrame = msToFrame(word.start - subtitleStart, fps);

                // Keyword check matches original logic
                const isKeyword = keyword && keyword.includes(word.text);
                const currentStyle = isKeyword && template.subtitleStyles.keyword
                    ? { ...styleConfig, ...template.subtitleStyles.keyword }
                    : styleConfig;

                return (
                    <Animated
                        key={index}
                        animations={[
                            Fade({ to: 1, initial: 0, start: wordStartFrame, duration: 5 })
                        ]}
                        style={{
                            display: 'inline-block',
                            opacity: 0, // Ensure initial invisibility
                            color: currentStyle.color,
                            fontSize,
                            fontWeight: currentStyle.fontWeight,
                            fontFamily: currentStyle.fontFamily,
                            // Add other style properties if needed, essentially inheriting/overriding
                        }}
                    >
                        {word.text}
                    </Animated>
                );
            })}
        </>
    );
};
