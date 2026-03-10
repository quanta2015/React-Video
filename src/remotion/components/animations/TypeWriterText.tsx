import React from 'react';
import { useCurrentFrame } from 'remotion';
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
            WebkitTextStroke: strokeWidth ? `${strokeWidth}px ${strokeColor || 'black'}` : undefined,
            textShadow: baseStyle.textShadow ?? fallback.textShadow,
            letterSpacing: baseStyle.letterSpacing ?? fallback.letterSpacing,
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

export const TypeWriterText: React.FC<ManualAnimationProps> = ({
    children,
    subtitle,
    styleConfig,
    template,
    scaledFontSize,
}) => {
    const frame = useCurrentFrame();
    const charStepFrames = 2;
    const visibleCountFor = (text: string) =>
        Math.max(0, Math.min(text.length, Math.floor(frame / charStepFrames) + 1));

    const text = subtitle.text || '';
    const chars = text.split('');
    const visibleCount = visibleCountFor(text);
    const visibleChars = chars.slice(0, visibleCount);
    const keyword = subtitle.keyword;
    const isTyping = visibleCount < chars.length;
    const blinkOn = Math.floor(frame / 10) % 2 === 0;
    const skipKeyword = subtitle.totalInGroup === 3;

    const keywordStyleConfig = {
        ...template.subtitleStyles.keyword,
        ...(subtitle.keywordStyleOverride || {}),
    };
    const chineseKeyword = buildKeywordStyle(
        keywordStyleConfig,
        {
            color: styleConfig.color,
            strokeWidth: styleConfig.strokeWidth,
            strokeColor: styleConfig.strokeColor,
            textShadow: styleConfig.textShadow,
            letterSpacing: styleConfig.letterSpacing,
            paintOrder: styleConfig.paintOrder,
            filter: styleConfig.filter,
            charTransform: styleConfig.charTransform,
            charTransformOrigin: styleConfig.charTransformOrigin,
        }
    );
    const keywordRanges = !skipKeyword ? findRanges(text, keyword) : [];

    const animatedChinese = (
        <>
            {visibleChars.map((char, index) => {
                const isKeywordChar = isInRanges(index, keywordRanges);
                return (
                    <span
                        key={`zh-${char}-${index}`}
                        style={{
                            ...(chineseKeyword.baseTransformStyle || {}),
                            ...(isKeywordChar ? (chineseKeyword.keywordTransformStyle || {}) : {}),
                            ...(isKeywordChar ? chineseKeyword.style : {}),
                        }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                );
            })}
            {isTyping && (
                <span
                    style={{
                        opacity: blinkOn ? 1 : 0,
                        marginLeft: 2,
                        fontSize: scaledFontSize,
                    }}
                >
                    |
                </span>
            )}
        </>
    );

    let injected = injectAnimatedLineContent(children, 0, animatedChinese);
    if (injected) {
        return injected;
    }

    const fallbackStyle: React.CSSProperties = {
        color: styleConfig.color,
        fontSize: scaledFontSize,
        fontWeight: styleConfig.fontWeight,
        fontFamily: styleConfig.fontFamily,
        textShadow: styleConfig.textShadow,
        letterSpacing: styleConfig.letterSpacing,
        WebkitTextStroke: styleConfig.strokeWidth
            ? `${styleConfig.strokeWidth}px ${styleConfig.strokeColor || 'black'}`
            : undefined,
        paintOrder: styleConfig.paintOrder as any,
        filter: styleConfig.filter,
        whiteSpace: 'pre',
    };

    return (
        <span style={fallbackStyle}>
            {animatedChinese}
        </span>
    );
};
