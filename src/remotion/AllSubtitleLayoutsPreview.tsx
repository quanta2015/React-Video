import React, { useMemo } from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { StyledSubtitle, SubtitleLayoutPresetName, VideoTemplate } from '../types';
import { SubtitleGroup } from './components/SubtitleGroup';
import { getSubtitleLayoutPreset } from '../subtitles/layoutPresets';

const PREVIEW_DURATION_FRAMES = 180; // 6 seconds per layout
const GROUP_DURATION_MS = 1700;
const GROUP_GAP_MS = 250;
const LINE_STAGGER_MS = 220;

interface LayoutDemoCase {
  preset: SubtitleLayoutPresetName;
  groups: string[][];
}

const LAYOUT_DEMO_CASES: LayoutDemoCase[] = [
  {
    preset: 'singleCenter4',
    groups: [
      ['每屏四字'],
      ['冲击更强'],
      ['节奏更快'],
    ],
  },
  {
    preset: 'singleCenter10',
    groups: [
      ['每屏只放一句'],
      ['十字内更利落'],
      ['节奏稳且有力'],
    ],
  },
  {
    preset: 'threeLineOverlay',
    groups: [
      ['先抛出结论', '再补充反差', '最后打关键词'],
      ['第一句靠左', '第二句靠右', '第三句居中'],
    ],
  },
  {
    preset: 'doubleCenter',
    groups: [
      ['一屏最多两句', '信息更聚焦'],
      ['两句都居中', '阅读更稳定'],
    ],
  },
  {
    preset: 'doubleLeftRight8',
    groups: [
      ['第一句靠左', '第二句靠右'],
      ['最多八个字', '节奏更干脆'],
    ],
  },
  {
    preset: 'doubleLeftLeft10',
    groups: [
      ['只有一句居中'],
      ['两句都靠左边', '保持同向阅读'],
    ],
  },
];

const buildSubtitles = (groups: string[][]): StyledSubtitle[] => {
  const subtitles: StyledSubtitle[] = [];
  let timelineMs = 0;

  groups.forEach((lines, groupId) => {
    const groupStart = timelineMs;
    const groupEnd = groupStart + GROUP_DURATION_MS;

    lines.forEach((text, position) => {
      const start = groupStart + position * LINE_STAGGER_MS;
      subtitles.push({
        start,
        end: start + 350,
        groupStart,
        groupEnd,
        text,
        groupId,
        position,
        totalInGroup: lines.length,
        keyword: position === lines.length - 1 ? text.slice(0, 2) : undefined,
        styleType: position === lines.length - 1 && lines.length === 3 ? 'tertiary' : 'default',
        animationIn: 'fadeIn',
        animationOut: 'fadeOut',
      });
    });

    timelineMs = groupEnd + GROUP_GAP_MS;
  });

  return subtitles;
};

const createPreviewTemplate = (preset: SubtitleLayoutPresetName): VideoTemplate => ({
  name: `subtitle-layout-demo-${preset}`,
  description: '字幕布局演示模板',
  subtitleStyles: {
    default: {
      fontFamily: 'System',
      fontSize: 86,
      color: '#FFFFFF',
      fontWeight: 'bold',
      textShadow: '0 4px 12px rgba(0,0,0,0.8)',
    },
    emphasis: {
      fontFamily: 'System',
      fontSize: 86,
      color: '#6BE7FF',
      fontWeight: 'bold',
      textShadow: '0 4px 12px rgba(0,0,0,0.8)',
    },
    tertiary: {
      fontFamily: 'System',
      fontSize: 112,
      color: '#FFD84D',
      fontWeight: 'bold',
      strokeWidth: 3,
      strokeColor: '#000000',
      paintOrder: 'stroke fill',
      textShadow: '0 4px 12px rgba(0,0,0,0.8)',
    },
    keyword: {
      color: '#6BE7FF',
    },
  },
  animations: {
    subtitleIn: 'fadeIn',
    subtitleOut: 'fadeOut',
    keywordEffect: 'none',
  },
  layout: {
    subtitleBottom: 320,
    lineHeight: 130,
    subtitleLayoutPreset: preset,
    title: {
      top: 100,
      fontSize: 48,
      fontFamily: 'System, sans-serif',
      color: '#FFFFFF',
      strokeWidth: 0,
      lineHeight: 1.3,
    },
    speaker: {
      left: 100,
      top: 1000,
      fontFamily: 'System, sans-serif',
      nameSize: 28,
      nameColor: '#FFFFFF',
      nameStrokeWidth: 0,
      titleSize: 18,
      titleColor: '#CCCCCC',
      titleMarginTop: 10,
    },
  },
});

const LayoutPreviewItem: React.FC<{ demoCase: LayoutDemoCase }> = ({ demoCase }) => {
  const preset = getSubtitleLayoutPreset(demoCase.preset);
  const subtitles = useMemo(() => buildSubtitles(demoCase.groups), [demoCase.groups]);
  const template = useMemo(() => createPreviewTemplate(demoCase.preset), [demoCase.preset]);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 15% 20%, rgba(59,130,246,0.55), transparent 42%), radial-gradient(circle at 85% 30%, rgba(20,184,166,0.45), transparent 35%), linear-gradient(180deg, #0f172a 0%, #020617 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 88,
          left: 70,
          right: 70,
          color: '#E2E8F0',
          fontFamily: 'System, sans-serif',
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
          lineHeight: 1.4,
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 700, color: '#F8FAFC' }}>{preset.label}</div>
        <div style={{ marginTop: 10, fontSize: 34 }}>{preset.description}</div>
        <div style={{ marginTop: 8, fontSize: 28, color: '#93C5FD' }}>
          分句设定: 每行 {preset.split.maxChars} 字 | 每屏最多 {preset.split.maxLines} 句
        </div>
      </div>

      <SubtitleGroup subtitles={subtitles} template={template} />
    </AbsoluteFill>
  );
};

export const SUBTITLE_LAYOUT_PREVIEW_DURATION_FRAMES = PREVIEW_DURATION_FRAMES;
export const SUBTITLE_LAYOUT_PREVIEW_COUNT = LAYOUT_DEMO_CASES.length;

export const AllSubtitleLayoutsPreview: React.FC = () => {
  return (
    <Series>
      {LAYOUT_DEMO_CASES.map((item) => (
        <Series.Sequence key={item.preset} durationInFrames={PREVIEW_DURATION_FRAMES}>
          <LayoutPreviewItem demoCase={item} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
