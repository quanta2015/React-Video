import React from 'react'
import { AbsoluteFill, Audio, Sequence, Series, staticFile, useCurrentFrame } from 'remotion'
import { config } from '../config'

export const SFX_PREVIEW_DURATION_FRAMES = 120
const SFX_PREVIEW_CLIP_FRAMES = 90
const SFX_AUDIO_START_OFFSET_FRAMES = 12

type SfxItem = (typeof config.sfx)[number]

const isValidSfxItem = (item: unknown): item is SfxItem => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false
  const candidate = item as Partial<SfxItem>
  return typeof candidate.name === 'string'
    && candidate.name.trim().length > 0
    && typeof candidate.file === 'string'
    && candidate.file.trim().length > 0
}

export const SFX_LIST: SfxItem[] = (Array.isArray(config.sfx) ? config.sfx : []).filter(isValidSfxItem)
export const SFX_PREVIEW_COUNT = Math.max(SFX_LIST.length, 1)

const SfxPreviewItem: React.FC<{ sfx: SfxItem; index: number }> = ({ sfx, index }) => {
  const frame = useCurrentFrame()
  const progress = Math.min(frame / SFX_PREVIEW_DURATION_FRAMES, 1)

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 20% 20%, #1e293b 0%, #0f172a 42%, #020617 100%)',
        color: '#f8fafc',
        padding: 64,
        boxSizing: 'border-box',
      }}
    >
      <Sequence from={SFX_AUDIO_START_OFFSET_FRAMES}>
        <Audio
          src={staticFile(`sfx/${sfx.file}`)}
          trimAfter={SFX_PREVIEW_CLIP_FRAMES}
          volume={0.9}
        />
      </Sequence>

      <div
        style={{
          alignSelf: 'flex-start',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(148, 163, 184, 0.45)',
          borderRadius: 999,
          padding: '8px 18px',
          fontSize: 28,
          fontFamily: 'sans-serif',
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        SFX {index + 1} / {SFX_LIST.length}
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 42,
          borderRadius: 24,
          background: 'linear-gradient(140deg, rgba(15,23,42,0.72), rgba(30,41,59,0.52))',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, fontFamily: 'sans-serif' }}>
          {sfx.name}
        </div>
        <div
          style={{
            fontSize: 30,
            color: '#cbd5e1',
            fontFamily: 'monospace',
            lineHeight: 1.4,
            wordBreak: 'break-all',
          }}
        >
          {sfx.file}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.18)',
              color: '#93c5fd',
              border: '1px solid rgba(147, 197, 253, 0.35)',
              fontFamily: 'sans-serif',
            }}
          >
            role: {sfx.role ?? 'fx'}
          </span>
          <span style={{ fontSize: 22, color: '#94a3b8', fontFamily: 'sans-serif' }}>
            public/sfx/{sfx.file}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 36,
          height: 14,
          borderRadius: 999,
          background: 'rgba(148, 163, 184, 0.28)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #38bdf8, #60a5fa)',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 22,
          color: '#94a3b8',
          fontFamily: 'sans-serif',
        }}
      >
        提示: 预览音频读取 `public/sfx` 目录，请确保音效文件已同步到该目录。
      </div>
    </AbsoluteFill>
  )
}

const EmptySfxPreview: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: '#020617',
        color: '#e2e8f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 800 }}>No SFX Configured</div>
      <div style={{ fontSize: 28, color: '#94a3b8' }}>请先在 config.sfx 中配置音效映射</div>
    </AbsoluteFill>
  )
}

export const AllSfxPreview: React.FC = () => {
  if (SFX_LIST.length === 0) {
    return <EmptySfxPreview />
  }

  return (
    <Series>
      {SFX_LIST.map((sfx, index) => (
        <Series.Sequence key={`${sfx.name}-${index}`} durationInFrames={SFX_PREVIEW_DURATION_FRAMES}>
          <SfxPreviewItem sfx={sfx} index={index} />
        </Series.Sequence>
      ))}
    </Series>
  )
}
