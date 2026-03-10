import { PipInputItem, PipMedia } from '../types'

interface ParsePipMediaOptions {
  onWarn?: (message: string) => void
}

const VIDEO_EXTS = ['.mp4', '.webm', '.mov']

/** 将 PIP 输入解析为标准素材列表，并补充可用的尺寸信息 */
export async function parsePipMedia(items?: PipInputItem[], options?: ParsePipMediaOptions): Promise<PipMedia[]> {
  if (!items || items.length === 0) return []

  const results = await Promise.all(
    items.map(async (item) => {
      // 支持纯 URL 字符串或 { url, tags } 对象
      const url = typeof item === 'string' ? item : item.url
      const tags = typeof item === 'string' ? undefined : normalizePipTags(item.tags)

      const isVideo = VIDEO_EXTS.some(ext => url.toLowerCase().includes(ext))
      const media: PipMedia = { url, type: isVideo ? 'video' : 'image' }

      if (tags && tags.length > 0) {
        media.tags = tags
      }

      // 用 ffprobe 探测素材元信息（支持远程 URL）
      try {
        const metadata = await probeMediaMetadata(url)
        if (metadata?.width && metadata?.height) {
          media.width = metadata.width
          media.height = metadata.height
        }
        if (media.type === 'video' && typeof metadata?.durationSec === 'number') {
          media.durationSec = metadata.durationSec
        }
      } catch {
        options?.onWarn?.(`无法探测素材元信息（尺寸/时长），将使用默认规则: ${url}`)
      }

      return media
    })
  )

  return results
}

function normalizePipTags(tags?: string[]): string[] | undefined {
  if (!Array.isArray(tags)) return undefined
  const normalized = tags.map(tag => tag.trim()).filter(Boolean)
  if (normalized.length === 0) return undefined
  return Array.from(new Set(normalized))
}

interface PipMediaMetadata {
  width?: number
  height?: number
  durationSec?: number
}

/** 用 ffprobe 探测远程/本地素材的宽高与时长 */
async function probeMediaMetadata(url: string): Promise<PipMediaMetadata | null> {
  const ffmpeg = await import('fluent-ffmpeg')
  return new Promise((resolve) => {
    ffmpeg.default.ffprobe(url, (err, data) => {
      if (err) return resolve(null)
      const metadata: PipMediaMetadata = {}
      const video = data.streams.find((s) => s.codec_type === 'video')
      if (video?.width && video?.height) {
        metadata.width = video.width
        metadata.height = video.height
      }

      const streamDurations = data.streams
        .filter((stream) => stream.codec_type === 'video')
        .map((stream) => Number(stream.duration))
        .filter((duration) => Number.isFinite(duration) && duration > 0)
      const durationCandidates = [Number(data.format.duration), ...streamDurations]
        .filter((duration) => Number.isFinite(duration) && duration > 0)
      if (durationCandidates.length > 0) {
        metadata.durationSec = Math.max(...durationCandidates)
      }

      if (!metadata.width && !metadata.height && typeof metadata.durationSec !== 'number') {
        return resolve(null)
      }
      resolve(metadata)
    })
  })
}
