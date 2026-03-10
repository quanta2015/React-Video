import { RawSubtitle, Word } from '../types'

/** diff 操作类型 */
type DiffOp = 'equal' | 'replace' | 'insert' | 'delete'

/** diff 操作项 */
interface DiffItem {
  op: DiffOp
  asrToken?: string
  correctToken?: string // 原始大小写
  asrIndex?: number
  correctIndex?: number
}

/** 校正统计 */
export interface CorrectionStats {
  totalTokens: number
  replaced: number
  inserted: number
  deleted: number
}

export class SubtitleCorrector {
  correct(rawSubtitles: RawSubtitle[], originalText: string): {
    subtitles: RawSubtitle[]
    stats: CorrectionStats
  } {
    // 1. 展平 ASR words（跳过空格占位符）
    const asrWords = this.flattenWords(rawSubtitles)
    const asrTokensLower = asrWords.map(w => w.text.toLowerCase())

    // 2. 原始文案分词（保留原始大小写）
    const correctTokens = this.tokenize(originalText)
    const correctTokensLower = correctTokens.map(t => t.toLowerCase())

    // 3. LCS 词级对齐（小写比较）
    const diffOps = this.alignTokens(asrTokensLower, correctTokensLower)

    // 4. 回填原始大小写
    for (const op of diffOps) {
      if (op.correctIndex !== undefined) {
        op.correctToken = correctTokens[op.correctIndex]
      }
    }

    // 5. 生成校正后的 words
    const correctedWords = this.applyDiff(diffOps, asrWords)

    // 6. 重建 subtitles（时间戳归属 + 标点还原）
    const subtitles = this.rebuildSubtitles(rawSubtitles, correctedWords, originalText)

    const stats: CorrectionStats = {
      totalTokens: correctTokens.length,
      replaced: diffOps.filter(d => d.op === 'replace').length,
      inserted: diffOps.filter(d => d.op === 'insert').length,
      deleted: diffOps.filter(d => d.op === 'delete').length,
    }

    return { subtitles, stats }
  }

  /** 展平所有 words，跳过空格占位符 */
  private flattenWords(subtitles: RawSubtitle[]): Word[] {
    const words: Word[] = []
    for (const sub of subtitles) {
      for (const w of sub.words) {
        if (w.start === -1 && w.end === -1) continue
        words.push(w)
      }
    }
    return words
  }

  /**
   * 分词：中文逐字，英文/数字按整词，去掉标点和空白
   * 保留原始大小写
   */
  private tokenize(text: string): string[] {
    const tokens: string[] = []
    const re = /[a-zA-Z0-9]+|[\u4e00-\u9fff]/g
    let match
    while ((match = re.exec(text)) !== null) {
      tokens.push(match[0])
    }
    return tokens
  }

  /** LCS 词级对齐 */
  private alignTokens(asrTokens: string[], correctTokens: string[]): DiffItem[] {
    const m = asrTokens.length
    const n = correctTokens.length

    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (asrTokens[i - 1] === correctTokens[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    return this.backtrack(dp, asrTokens, correctTokens, m, n)
  }

  /** 回溯 LCS 矩阵 */
  private backtrack(
    dp: number[][],
    asrTokens: string[],
    correctTokens: string[],
    m: number,
    n: number
  ): DiffItem[] {
    const ops: DiffItem[] = []
    let i = m
    let j = n

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && asrTokens[i - 1] === correctTokens[j - 1]) {
        ops.push({ op: 'equal', asrIndex: i - 1, correctIndex: j - 1 })
        i--; j--
      } else if (
        i > 0 && j > 0 &&
        dp[i - 1][j - 1] >= dp[i - 1][j] &&
        dp[i - 1][j - 1] >= dp[i][j - 1]
      ) {
        ops.push({ op: 'replace', asrIndex: i - 1, correctIndex: j - 1 })
        i--; j--
      } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
        ops.push({ op: 'delete', asrIndex: i - 1 })
        i--
      } else {
        ops.push({ op: 'insert', correctIndex: j - 1 })
        j--
      }
    }

    return ops.reverse()
  }

  /** 根据 diff 生成校正后的 Word 数组 */
  private applyDiff(diffOps: DiffItem[], asrWords: Word[]): Word[] {
    const result: Word[] = []

    for (let i = 0; i < diffOps.length; i++) {
      const op = diffOps[i]
      switch (op.op) {
        case 'equal':
          result.push({ ...asrWords[op.asrIndex!] })
          break
        case 'replace':
          result.push({
            text: op.correctToken!,
            start: asrWords[op.asrIndex!].start,
            end: asrWords[op.asrIndex!].end,
          })
          break
        case 'insert': {
          const ts = this.interpolateTimestamp(result, diffOps, i, asrWords)
          result.push({ text: op.correctToken!, start: ts.start, end: ts.end })
          break
        }
        case 'delete':
          break
      }
    }
    return result
  }

  /** 为插入的字计算插值时间戳 */
  private interpolateTimestamp(
    resultSoFar: Word[],
    diffOps: DiffItem[],
    currentIndex: number,
    asrWords: Word[]
  ): { start: number; end: number } {
    const prevWord = resultSoFar.length > 0
      ? resultSoFar[resultSoFar.length - 1]
      : null

    let nextWord: Word | null = null
    for (let j = currentIndex + 1; j < diffOps.length; j++) {
      if (diffOps[j].asrIndex !== undefined && diffOps[j].op !== 'delete') {
        nextWord = asrWords[diffOps[j].asrIndex!]
        break
      }
    }

    let insertCount = 1
    let insertPos = 0
    for (let j = currentIndex - 1; j >= 0 && diffOps[j].op === 'insert'; j--) {
      insertCount++; insertPos++
    }
    for (let j = currentIndex + 1; j < diffOps.length && diffOps[j].op === 'insert'; j++) {
      insertCount++
    }

    if (prevWord && nextWord) {
      const gap = nextWord.start - prevWord.end
      const step = gap / (insertCount + 1)
      const start = Math.round(prevWord.end + step * (insertPos + 1))
      const duration = Math.round(step * 0.8)
      return { start, end: start + Math.max(duration, 50) }
    } else if (prevWord) {
      const avg = this.estimateCharDuration(asrWords)
      return { start: prevWord.end + 10, end: prevWord.end + 10 + avg }
    } else if (nextWord) {
      const avg = this.estimateCharDuration(asrWords)
      const end = nextWord.start - 10
      return { start: Math.max(0, end - avg), end }
    }
    return { start: 0, end: 100 }
  }

  private estimateCharDuration(words: Word[]): number {
    const valid = words.filter(w => w.start >= 0 && w.end >= 0)
    if (valid.length === 0) return 150
    return Math.round(valid.reduce((s, w) => s + (w.end - w.start), 0) / valid.length)
  }

  /**
   * 重建 subtitles：
   * 1. 按时间戳把校正后的 words 分配到原始句子
   * 2. 从原始文案中提取对应的标点，还原到句子 text
   */
  private rebuildSubtitles(
    originalSubtitles: RawSubtitle[],
    correctedWords: Word[],
    originalText: string
  ): RawSubtitle[] {
    // 从原始文案中提取标点映射：tokenIndex → 后面跟的标点
    const punctuationMap = this.buildPunctuationMap(originalText)

    // 给每个 correctedWord 标记全局序号和对应的后缀标点
    const wordMetas: { word: Word; globalIndex: number; trailingPunct: string }[] =
      correctedWords.map((w, i) => ({
        word: w,
        globalIndex: i,
        trailingPunct: punctuationMap.get(i) || '',
      }))

    // 按时间戳分桶
    const buckets: typeof wordMetas[number][][] = originalSubtitles.map(() => [])
    for (const meta of wordMetas) {
      const idx = this.findBestSentenceIndex(meta.word, originalSubtitles)
      buckets[idx].push(meta)
    }

    const result: RawSubtitle[] = []
    for (let i = 0; i < originalSubtitles.length; i++) {
      const metas = buckets[i]
      if (metas.length === 0) continue

      const words = metas.map(m => m.word)
      const rebuiltWords = this.rebuildWordsWithSpaces(words)

      // 生成带标点的 text
      const text = this.buildTextWithPunctuation(metas)

      const validWords = rebuiltWords.filter(w => w.start >= 0)
      const start = validWords.length > 0 ? validWords[0].start : originalSubtitles[i].start
      const end = validWords.length > 0 ? validWords[validWords.length - 1].end : originalSubtitles[i].end

      result.push({ start, end, text, words: rebuiltWords })
    }

    return result
  }

  /** 根据时间戳找到 word 最匹配的句子索引 */
  private findBestSentenceIndex(word: Word, subtitles: RawSubtitle[]): number {
    const mid = (word.start + word.end) / 2

    for (let i = 0; i < subtitles.length; i++) {
      if (mid >= subtitles[i].start && mid <= subtitles[i].end) {
        return i
      }
    }

    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < subtitles.length; i++) {
      const dist = Math.min(
        Math.abs(mid - subtitles[i].start),
        Math.abs(mid - subtitles[i].end)
      )
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    return bestIdx
  }

  /**
   * 构建标点映射：记录原始文案中每个有效 token 后面跟着什么标点
   * 例如 "朋友们，Idea to money OS，想法" →
   *   { "朋": "", "友": "", "们": "，", "Idea": "", "to": "", "money": "", "OS": "，", "想": "", "法": "" }
   * key 用 "token_index" 避免重复
   */
  private buildPunctuationMap(text: string): Map<number, string> {
    const map = new Map<number, string>()
    const re = /([a-zA-Z0-9]+|[\u4e00-\u9fff])|([，。！？、；：""''（）《》【】…—·,.!?;:'"()\[\]{}<>]+)/g
    let match
    let tokenIndex = 0
    let pendingPunct = ''

    while ((match = re.exec(text)) !== null) {
      if (match[1]) {
        // 这是一个有效 token
        if (tokenIndex > 0 && pendingPunct) {
          // 把之前积累的标点挂到上一个 token
          map.set(tokenIndex - 1, (map.get(tokenIndex - 1) || '') + pendingPunct)
          pendingPunct = ''
        }
        tokenIndex++
      } else if (match[2]) {
        // 这是标点
        pendingPunct += match[2]
      }
    }

    // 最后一个 token 后面的标点
    if (tokenIndex > 0 && pendingPunct) {
      map.set(tokenIndex - 1, (map.get(tokenIndex - 1) || '') + pendingPunct)
    }

    return map
  }

  /**
   * 根据 word metas（含标点信息），生成带标点和空格的 text
   */
  private buildTextWithPunctuation(
    metas: { word: Word; globalIndex: number; trailingPunct: string }[]
  ): string {
    let text = ''
    for (let i = 0; i < metas.length; i++) {
      const meta = metas[i]
      const prev = i > 0 ? metas[i - 1] : null

      // 插入空格（中英之间、英英之间）
      if (prev) {
        const prevText = prev.word.text + prev.trailingPunct
        const prevIsLatin = /[a-zA-Z0-9]$/.test(prev.word.text)
        const currIsLatin = /^[a-zA-Z0-9]/.test(meta.word.text)
        const prevIsChinese = /[\u4e00-\u9fff]$/.test(prevText)
        const currIsChinese = /^[\u4e00-\u9fff]/.test(meta.word.text)

        if (!prev.trailingPunct) {
          // 前一个词没有标点，需要判断是否插空格
          if ((prevIsLatin && currIsChinese) || (prevIsChinese && currIsLatin) ||
              (prevIsLatin && currIsLatin)) {
            text += ' '
          }
        }
      }

      text += meta.word.text + meta.trailingPunct
    }
    return text
  }

  /** 插入空格占位符 */
  private rebuildWordsWithSpaces(words: Word[]): Word[] {
    const result: Word[] = []
    const spaceWord: Word = { text: ' ', start: -1, end: -1 }

    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      const prev = i > 0 ? words[i - 1] : null

      if (prev) {
        const prevIsLatin = /[a-zA-Z0-9]$/.test(prev.text)
        const currIsLatin = /^[a-zA-Z0-9]/.test(w.text)
        const prevIsChinese = /[\u4e00-\u9fff]$/.test(prev.text)
        const currIsChinese = /^[\u4e00-\u9fff]/.test(w.text)

        // 中英之间 或 英英之间 插入空格
        if ((prevIsLatin && currIsChinese) || (prevIsChinese && currIsLatin) ||
            (prevIsLatin && currIsLatin)) {
          result.push({ ...spaceWord })
        }
      }

      result.push(w)
    }

    return result
  }
}
