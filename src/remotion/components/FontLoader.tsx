import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import { config } from '../../config';

interface FontLoaderProps {
    children: React.ReactNode;
    requiredFonts?: string[];
}

export const FontLoader: React.FC<FontLoaderProps> = ({ children, requiredFonts }) => {
    const [handle] = useState(() => delayRender('Loading fonts...'));
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        const loadFonts = async () => {
            const fontsToLoad = requiredFonts
                ? config.fonts.filter((font) => font.type !== 'system' && requiredFonts.includes(font.name))
                : config.fonts.filter((font) => font.type !== 'system');

            // Register 'System' font using 微软雅黑 as fallback for servers without Chinese system fonts
            const fallbackFont = config.fonts.find((f) => f.name === '微软雅黑');
            if (fallbackFont) {
                fontsToLoad.push({ ...fallbackFont, name: 'System' });
            }

            const promises = fontsToLoad.map(async (font) => {

                const fontFace = new FontFace(
                    font.name,
                    `url('${staticFile(`fonts/${font.file}`)}')`,
                    {
                        weight: font.weight ? String(font.weight) : 'normal',
                        style: 'normal',
                    }
                );

                try {
                    await fontFace.load();
                    // @ts-ignore
                    document.fonts.add(fontFace);
                } catch (err) {
                    console.error(`Failed to load font ${font.name}:`, err);
                }
            });

            await Promise.all(promises);
            setFontsLoaded(true);
            continueRender(handle);
        };

        loadFonts();
    }, [handle]);

    if (!fontsLoaded) {
        return null;
    }

    return <>{children}</>;
};
