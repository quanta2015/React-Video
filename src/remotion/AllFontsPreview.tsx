import React from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { config } from '../config'
import { FontLoader } from './components/FontLoader'

const FONTS_PER_PAGE = 6 // 每页显示 6 个字体 (2列 x 3行)
const PAGE_DURATION = 150 // 每页停留 5 秒

const PREVIEW_TEXT = '夏季养生三不要'
const PREVIEW_TEXT_2 = '你知道是什么吗'

const FontCard: React.FC<{ fontName: string; fontFile: string; index: number }> = ({
  fontName,
  fontFile,
  index,
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #2a2a2a, #1e1e1e)',
        borderRadius: 20,
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* 字体名 + 序号标签 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            background: 'linear-gradient(135deg, #E6782D, #F5A623)',
            color: '#fff',
            fontSize: 22,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              color: '#fff',
              fontSize: 26,
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
            }}
          >
            {fontName}
          </span>
          <span
            style={{
              color: '#666',
              fontSize: 16,
              fontFamily: 'sans-serif',
            }}
          >
            {fontFile || 'System Font'}
          </span>
        </div>
      </div>

      {/* 预览文字 */}
      <div
        style={{
          fontFamily: fontName,
          fontSize: 52,
          color: '#f0f0f0',
          lineHeight: 1.5,
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <div>{PREVIEW_TEXT}</div>
        <div style={{ fontSize: 36, color: '#E6782D' }}>{PREVIEW_TEXT_2}</div>
      </div>
    </div>
  )
}

const FontPage: React.FC<{ fonts: typeof config.fonts; startIndex: number; pageIndex: number; totalPages: number }> = ({
  fonts,
  startIndex,
  pageIndex,
  totalPages,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#111',
        padding: '60px 50px 50px',
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}
    >
      {/* 页头 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: 36,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
          }}
        >
          字体预览
        </div>
        <div
          style={{
            color: '#888',
            fontSize: 28,
            fontFamily: 'sans-serif',
          }}
        >
          {pageIndex + 1} / {totalPages}
        </div>
      </div>

      {/* 字体网格: 2列 x 3行 */}
      <div
        style={{
          flex: 1,
          display: 'grid' as any,
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          gap: 24,
        }}
      >
        {fonts.map((font, i) => (
          <FontCard key={font.name} fontName={font.name} fontFile={font.file} index={startIndex + i} />
        ))}
      </div>
    </AbsoluteFill>
  )
}

export const AllFontsPreview: React.FC = () => {
  const allFonts = config.fonts
  const totalPages = Math.ceil(allFonts.length / FONTS_PER_PAGE)

  const pages: (typeof config.fonts)[] = []
  for (let i = 0; i < allFonts.length; i += FONTS_PER_PAGE) {
    pages.push(allFonts.slice(i, i + FONTS_PER_PAGE))
  }

  return (
    <FontLoader>
      <AbsoluteFill style={{ backgroundColor: '#000' }}>
        <Series>
          {pages.map((pageFonts, pageIndex) => (
            <Series.Sequence key={pageIndex} durationInFrames={PAGE_DURATION}>
              <FontPage
                fonts={pageFonts}
                startIndex={pageIndex * FONTS_PER_PAGE}
                pageIndex={pageIndex}
                totalPages={totalPages}
              />
            </Series.Sequence>
          ))}
        </Series>
      </AbsoluteFill>
    </FontLoader>
  )
}
