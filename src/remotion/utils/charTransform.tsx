import React from 'react';

export interface CharTransformOptions {
  transform?: string;
  transformOrigin?: string;
}

export const getCharTransformSpanStyle = (
  options?: CharTransformOptions
): React.CSSProperties | undefined => {
  const transform = options?.transform?.trim();
  if (!transform) return undefined;
  return {
    display: 'inline-block',
    transform,
    transformOrigin: options?.transformOrigin || 'center center',
  };
};

export const renderPerCharText = (
  text: string,
  options?: CharTransformOptions,
  keyPrefix = 'char'
): React.ReactNode => {
  const style = getCharTransformSpanStyle(options);
  if (!style) return text;

  return Array.from(text).map((char, index) => (
    <span key={`${keyPrefix}-${index}`} style={style}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
};

