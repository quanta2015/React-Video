import React from 'react';
import { useCurrentFrame, spring } from 'remotion';
import { ManualAnimationProps } from './animations';
import { getCharTransformSpanStyle } from '../../utils/charTransform';

const injectAnimatedLineContent = (
    children: React.ReactNode,
    lineIndex: number,
    animatedContent: React.ReactNode
): React.ReactNode | null => {
    const safeContent = animatedContent ?? null;
    const replacementNode = <>{safeContent}</>;
    const isSingleDomWrapper = (node: React.ReactNode): node is React.ReactElement<any> => {
        return React.isValidElement(node) && typeof (node as React.ReactElement<any>).type === 'string';
    };
    if (!React.isValidElement(children)) {
        return null;
    }

    const root = children as React.ReactElement<any>;
    const rootChildren = React.Children.toArray(root.props.children);
    if (lineIndex >= rootChildren.length) {
        return root;
    }

    const lineNode = rootChildren[lineIndex];
    if (!React.isValidElement(lineNode)) {
        const nextChildren = [...rootChildren];
        nextChildren[lineIndex] = replacementNode;
        return React.cloneElement(root, {}, ...nextChildren);
    }

    const lineElement = lineNode as React.ReactElement<any>;
    const lineChildren = React.Children.toArray(lineElement.props.children);

    // If the line is already split into per-char spans, replace the whole line to avoid residual chars.
    const nextLine: React.ReactElement<any> = lineChildren.length === 1 && isSingleDomWrapper(lineChildren[0])
        ? React.cloneElement(
            lineElement,
            {},
            React.cloneElement(lineChildren[0], {}, replacementNode)
        )
        : React.cloneElement(lineElement, {}, replacementNode);

    const nextRootChildren = [...rootChildren];
    nextRootChildren[lineIndex] = nextLine;
    return React.cloneElement(root, {}, ...nextRootChildren);
};

const findRanges = (text: string, keyword?: string): [number, number][] => {
    if (!text || !keyword) return [];
    const ranges: [number, number][] = [];
    let startIndex = 0;
    let index = -1;
    while ((index = text.indexOf(keyword, startIndex)) !== -1) {
        ranges.push([index, index + keyword.length]);
        startIndex = index + keyword.length;
    }
    return ranges;
};

const isInRanges = (index: number, ranges: [number, number][]) => {
    return ranges.some(([start, end]) => index >= start && index < end);
};

const buildKeywordStyle = (
    baseStyle: {
        color?: string;
        strokeWidth?: number;
        strokeColor?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: any;
        textShadow?: string;
        letterSpacing?: number;
        paintOrder?: string;
        filter?: string;
        charTransform?: string;
        charTransformOrigin?: string;
    },
    fallback: {
        color?: string;
        strokeWidth?: number;
        strokeColor?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: any;
        textShadow?: string;
        letterSpacing?: number;
        paintOrder?: string;
        filter?: string;
        charTransform?: string;
        charTransformOrigin?: string;
    }
) => {
    const strokeWidth = baseStyle.strokeWidth ?? fallback.strokeWidth;
    const strokeColor = baseStyle.strokeColor ?? fallback.strokeColor;
    return {
        style: {
            color: baseStyle.color ?? fallback.color,
            fontFamily: baseStyle.fontFamily ?? fallback.fontFamily,
            fontSize: baseStyle.fontSize ?? fallback.fontSize,
            fontWeight: baseStyle.fontWeight ?? fallback.fontWeight,
            textShadow: baseStyle.textShadow ?? fallback.textShadow,
            letterSpacing: baseStyle.letterSpacing ?? fallback.letterSpacing,
            WebkitTextStroke: strokeWidth ? `${strokeWidth}px ${strokeColor || 'black'}` : undefined,
            paintOrder: (baseStyle.paintOrder ?? fallback.paintOrder) as any,
            filter: baseStyle.filter ?? fallback.filter,
        } as React.CSSProperties,
        baseTransformStyle: getCharTransformSpanStyle({
            transform: fallback.charTransform,
            transformOrigin: fallback.charTransformOrigin,
        }),
        keywordTransformStyle: getCharTransformSpanStyle({
            transform: baseStyle.charTransform ?? fallback.charTransform,
            transformOrigin: baseStyle.charTransformOrigin ?? fallback.charTransformOrigin,
        }),
    };
};

const buildWaveChars = (
    text: string,
    keywordRanges: [number, number][],
    fps: number,
    frame: number,
    baseTransformStyle: React.CSSProperties | undefined,
    keywordTransformStyle: React.CSSProperties | undefined,
    keywordStyle: React.CSSProperties
) => {
    return text.split('').map((char, index) => {
        const delay = index * 2;
        const spr = spring({
            fps,
            frame: frame - delay,
            config: {
                damping: 12,
                stiffness: 100,
                mass: 0.5,
            },
        });

        const isKeywordChar = isInRanges(index, keywordRanges);
        const translateY = (1 - spr) * 20;
        const charStyle = isKeywordChar ? keywordStyle : {};
        const transformStyle = isKeywordChar
            ? { ...(baseTransformStyle || {}), ...(keywordTransformStyle || {}) }
            : (baseTransformStyle || {});

        return (
            <span
                key={`${char}-${index}`}
                style={{
                    display: 'inline-block',
                    transform: `translateY(${translateY}px)`,
                    opacity: spr,
                }}
            >
                <span style={{ ...transformStyle, ...charStyle }}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            </span>
        );
    });
};

export const WaveIn: React.FC<ManualAnimationProps> = ({
    children,
    fps,
    subtitle,
    template,
    styleConfig,
}) => {
    const frame = useCurrentFrame();
    const skipKeyword = subtitle.totalInGroup === 3;

    const keywordStyleConfig = {
        ...(template?.subtitleStyles?.keyword || {}),
        ...(subtitle.keywordStyleOverride || {}),
    };
    const chineseKeyword = buildKeywordStyle(
        keywordStyleConfig,
        {
            color: styleConfig.color,
            strokeWidth: styleConfig.strokeWidth,
            strokeColor: styleConfig.strokeColor,
            fontFamily: styleConfig.fontFamily,
            fontSize: styleConfig.fontSize,
            fontWeight: styleConfig.fontWeight,
            textShadow: styleConfig.textShadow,
            letterSpacing: styleConfig.letterSpacing,
            paintOrder: styleConfig.paintOrder,
            filter: styleConfig.filter,
            charTransform: styleConfig.charTransform,
            charTransformOrigin: styleConfig.charTransformOrigin,
        }
    );
    const zhRanges = !skipKeyword ? findRanges(subtitle.text || '', subtitle.keyword) : [];
    const animatedChinese = buildWaveChars(
        subtitle.text || '',
        zhRanges,
        fps,
        frame,
        chineseKeyword.baseTransformStyle,
        chineseKeyword.keywordTransformStyle,
        chineseKeyword.style
    );

    let injected = injectAnimatedLineContent(children, 0, animatedChinese);
    if (injected) {
        return injected;
    }

    return <>{animatedChinese}</>;
};
