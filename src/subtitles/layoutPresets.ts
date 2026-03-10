import { LayoutConfig, SubtitleLayoutPresetName, SubtitleSplitConfig } from '../types'

export interface SubtitleLayoutResolveInput {
  layout: LayoutConfig
  position: number
  totalInGroup: number
  scaleX: number
  scaleY: number
}

export interface SubtitleLinePlacement {
  textAlign: 'left' | 'center' | 'right'
  paddingLeft: number
  paddingRight: number
  bottom: number
}

export interface SubtitleLayoutPreset {
  name: SubtitleLayoutPresetName
  label: string
  description: string
  split: SubtitleSplitConfig
  resolveLinePlacement: (input: SubtitleLayoutResolveInput) => SubtitleLinePlacement
}

export const DEFAULT_SUBTITLE_LAYOUT_PRESET: SubtitleLayoutPresetName = 'threeLineOverlay'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const calculateStackBottom = (layout: LayoutConfig, scaleY: number, position: number, totalInGroup: number): number => {
  const safeTotal = Math.max(totalInGroup, 1)
  const safePosition = clamp(position, 0, safeTotal - 1)
  const scaledBottom = layout.subtitleBottom * scaleY
  const scaledLineHeight = layout.lineHeight * scaleY
  return scaledBottom + (safeTotal - 1 - safePosition) * scaledLineHeight
}

const singleCenter10Preset: SubtitleLayoutPreset = {
  name: 'singleCenter10',
  label: 'Single Center 10',
  description: '每屏一句，居中显示，每行最多 10 字。',
  split: {
    maxChars: 10,
    maxLines: 1,
  },
  resolveLinePlacement: ({ layout, position, totalInGroup, scaleY }) => ({
    textAlign: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    bottom: calculateStackBottom(layout, scaleY, position, totalInGroup),
  }),
}

const singleCenter4Preset: SubtitleLayoutPreset = {
  name: 'singleCenter4',
  label: 'Single Center 4',
  description: '每屏一句，居中显示，每行最多 4 字。',
  split: {
    maxChars: 4,
    maxLines: 1,
  },
  resolveLinePlacement: ({ layout, position, totalInGroup, scaleY }) => ({
    textAlign: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    bottom: calculateStackBottom(layout, scaleY, position, totalInGroup),
  }),
}

const threeLineOverlayPreset: SubtitleLayoutPreset = {
  name: 'threeLineOverlay',
  label: 'Three Line Overlay',
  description: '每屏最多 3 句：第一句左、第二句右、第三句居中覆盖。',
  split: {
    maxChars: 8,
    maxLines: 3,
  },
  resolveLinePlacement: ({ layout, position, totalInGroup, scaleX, scaleY }) => {
    const safeTotal = Math.max(totalInGroup, 1)
    const safePosition = clamp(position, 0, safeTotal - 1)
    const scaledBottom = layout.subtitleBottom * scaleY
    const scaledLineHeight = layout.lineHeight * scaleY
    const horizontalPadding = 110 * scaleX

    if (safeTotal >= 3) {
      if (safePosition === 0) {
        return {
          textAlign: 'left',
          paddingLeft: horizontalPadding,
          paddingRight: 0,
          bottom: scaledBottom + scaledLineHeight,
        }
      }
      if (safePosition === 1) {
        return {
          textAlign: 'right',
          paddingLeft: 0,
          paddingRight: horizontalPadding,
          bottom: scaledBottom,
        }
      }
      return {
        textAlign: 'center',
        paddingLeft: 0,
        paddingRight: 0,
        bottom: scaledBottom + 0.5 * scaledLineHeight,
      }
    }

    if (safeTotal === 2) {
      if (safePosition === 0) {
        return {
          textAlign: 'left',
          paddingLeft: horizontalPadding,
          paddingRight: 0,
          bottom: scaledBottom + scaledLineHeight,
        }
      }
      return {
        textAlign: 'right',
        paddingLeft: 0,
        paddingRight: horizontalPadding,
        bottom: scaledBottom,
      }
    }

    return {
      textAlign: 'center',
      paddingLeft: 0,
      paddingRight: 0,
      bottom: scaledBottom,
    }
  },
}

const doubleCenterPreset: SubtitleLayoutPreset = {
  name: 'doubleCenter',
  label: 'Double Center',
  description: '每屏最多 2 句，全部居中显示。',
  split: {
    maxChars: 10,
    maxLines: 2,
  },
  resolveLinePlacement: ({ layout, position, totalInGroup, scaleY }) => ({
    textAlign: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    bottom: calculateStackBottom(layout, scaleY, position, totalInGroup),
  }),
}

const doubleLeftRight8Preset: SubtitleLayoutPreset = {
  name: 'doubleLeftRight8',
  label: 'Double Left Right 8',
  description: '每屏最多 2 句，第一句左、第二句右，每行最多 8 字。',
  split: {
    maxChars: 8,
    maxLines: 2,
  },
  resolveLinePlacement: ({ layout, position, totalInGroup, scaleX, scaleY }) => {
    const safeTotal = Math.max(totalInGroup, 1)
    const safePosition = clamp(position, 0, safeTotal - 1)
    const scaledBottom = layout.subtitleBottom * scaleY
    const scaledLineHeight = layout.lineHeight * scaleY
    const horizontalPadding = 110 * scaleX

    if (safeTotal >= 2) {
      if (safePosition === 0) {
        return {
          textAlign: 'left',
          paddingLeft: horizontalPadding,
          paddingRight: 0,
          bottom: scaledBottom + scaledLineHeight,
        }
      }
      return {
        textAlign: 'right',
        paddingLeft: 0,
        paddingRight: horizontalPadding,
        bottom: scaledBottom,
      }
    }

    return {
      textAlign: 'center',
      paddingLeft: 0,
      paddingRight: 0,
      bottom: scaledBottom,
    }
  },
}

const doubleLeftLeft10Preset: SubtitleLayoutPreset = {
  name: 'doubleLeftLeft10',
  label: 'Double Left Left 10',
  description: '每屏最多 2 句；只有 1 句时居中，2 句时都居左；每行最多 10 字。',
  split: {
    maxChars: 10,
    maxLines: 2,
  },
  resolveLinePlacement: ({ layout, position, totalInGroup, scaleX, scaleY }) => {
    const safeTotal = Math.max(totalInGroup, 1)
    const safePosition = clamp(position, 0, safeTotal - 1)
    const scaledBottom = layout.subtitleBottom * scaleY
    const scaledLineHeight = layout.lineHeight * scaleY
    const horizontalPadding = 110 * scaleX

    if (safeTotal >= 2) {
      if (safePosition === 0) {
        return {
          textAlign: 'left',
          paddingLeft: horizontalPadding,
          paddingRight: 0,
          bottom: scaledBottom + scaledLineHeight,
        }
      }
      return {
        textAlign: 'left',
        paddingLeft: horizontalPadding,
        paddingRight: 0,
        bottom: scaledBottom,
      }
    }

    return {
      textAlign: 'center',
      paddingLeft: 0,
      paddingRight: 0,
      bottom: scaledBottom,
    }
  },
}

const PRESETS: Record<SubtitleLayoutPresetName, SubtitleLayoutPreset> = {
  singleCenter4: singleCenter4Preset,
  singleCenter10: singleCenter10Preset,
  threeLineOverlay: threeLineOverlayPreset,
  doubleCenter: doubleCenterPreset,
  doubleLeftRight8: doubleLeftRight8Preset,
  doubleLeftLeft10: doubleLeftLeft10Preset,
}

export const getSubtitleLayoutPreset = (name?: SubtitleLayoutPresetName): SubtitleLayoutPreset => {
  return PRESETS[name ?? DEFAULT_SUBTITLE_LAYOUT_PRESET] ?? PRESETS[DEFAULT_SUBTITLE_LAYOUT_PRESET]
}

export const listSubtitleLayoutPresets = (): SubtitleLayoutPreset[] => Object.values(PRESETS)

export const resolveSubtitleLinePlacement = (input: SubtitleLayoutResolveInput): SubtitleLinePlacement => {
  const preset = getSubtitleLayoutPreset(input.layout.subtitleLayoutPreset)
  return preset.resolveLinePlacement(input)
}
