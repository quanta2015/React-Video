import OpenAI from 'openai'
import { config } from '../config'
import { LayoutConfig, SplitSubtitle } from '../types'

interface TranslationInputRow {
  id: number
  text: string
  groupId: number
  position: number
  totalInGroup: number
}

interface TranslationOutputRow {
  id: number
  enText: string
}

const BATCH_SIZE = 100

export class SubtitleTranslator {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      baseURL: config.volcengineAI.baseUrl,
      apiKey: config.volcengineAI.apiKey,
    })
  }

  async translate(
    subtitles: SplitSubtitle[],
    bilingualConfig: NonNullable<LayoutConfig['bilingual']>,
  ): Promise<SplitSubtitle[]> {
    if (!config.volcengineAI.apiKey) {
      console.warn('[SubtitleTranslator] 缺少 VOLCENGINE_AI_API_KEY，跳过英文翻译')
      return subtitles
    }

    const rows: TranslationInputRow[] = subtitles.map((sub, index) => ({
      id: index,
      text: sub.text,
      groupId: sub.groupId,
      position: sub.position,
      totalInGroup: sub.totalInGroup,
    }))

    const merged = new Map<number, string>()
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const batch = rows.slice(start, start + BATCH_SIZE)
      const translated = await this.translateBatch(batch, bilingualConfig)
      translated.forEach(item => {
        merged.set(item.id, this.cleanEnglish(item.enText))
      })
    }

    return subtitles.map((sub, index) => {
      const enText = merged.get(index)
      return {
        ...sub,
        enText: enText || undefined,
      }
    })
  }

  private async translateBatch(
    rows: TranslationInputRow[],
    bilingualConfig: NonNullable<LayoutConfig['bilingual']>,
  ): Promise<TranslationOutputRow[]> {
    const prompt = this.buildPrompt(rows, bilingualConfig)
    const response = await this.client.chat.completions.create({
      model: config.volcengineAI.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      thinking: { type: 'disabled' },
    } as any)

    const content = response.choices[0]?.message?.content || '[]'
    const jsonText = this.extractJson(content)
    const parsed = JSON.parse(jsonText) as TranslationOutputRow[]
    const byId = new Map(parsed.map(row => [row.id, row.enText]))

    return rows.map(row => ({
      id: row.id,
      enText: byId.get(row.id) || '',
    }))
  }

  private buildPrompt(
    rows: TranslationInputRow[],
    bilingualConfig: NonNullable<LayoutConfig['bilingual']>,
  ): string {
    const maxEnglishWords = bilingualConfig.maxEnglishWords ?? 8
    const hideThirdLine = bilingualConfig.hideEnglishOnThirdLine ?? true
    return `你是短视频字幕翻译助手。请把下面的中文分句翻译成简洁自然的英文字幕。

要求：
1. 必须一条输入对应一条输出，保持 id 一一对应。
2. 英文要短促有力，口语化，避免生硬直译。
3. 单条英文尽量不超过 ${maxEnglishWords} 个英文单词。
3.1 优先保留核心信息，尽量删掉不必要的冠词、修饰词和连接词。
4. 不要合并或拆分，不要改变顺序。
5. 如果输入本身是英文，做轻量润色即可。
6. ${
      hideThirdLine
        ? '当 totalInGroup=3 且 position=2 时，enText 必须输出空字符串。'
        : '所有条目都需要给出英文。'
    }

输入 JSON：
${JSON.stringify(rows)}

输出纯 JSON 数组（不要 markdown）：
[{"id":0,"enText":"..."},{"id":1,"enText":"..."}]`
  }

  private extractJson(content: string): string {
    const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlock) return codeBlock[1].trim()

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) return jsonMatch[0]

    return content.trim()
  }

  private cleanEnglish(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }
}
