import OpenAI from 'openai'
import { config } from '../config'

interface ExtractTitleKeywordsOptions {
  count: number
}

interface ExtractTitleKeywordsResponse {
  keywords: string[]
}

/**
 * 标题关键词提取器
 * - 仅负责从标题文本中提取可命中的关键词（原文子串）
 * - 不负责样式分配，样式由调用方按模板配置随机选择
 */
export class TitleKeywordExtractor {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      baseURL: config.volcengineAI.baseUrl,
      apiKey: config.volcengineAI.apiKey,
    })
  }

  async extract(title: string, options: ExtractTitleKeywordsOptions): Promise<string[]> {
    const normalizedTitle = title.replace(/\\n/g, '\n').trim()
    const count = Math.max(0, Math.floor(options.count))

    if (!normalizedTitle || count <= 0) return []
    if (!config.volcengineAI.apiKey) {
      console.warn('[TitleKeywordExtractor] 缺少 VOLCENGINE_AI_API_KEY，跳过标题关键词提取')
      return []
    }

    const prompt = this.buildPrompt(normalizedTitle, count)
    const response = await this.client.chat.completions.create({
      model: config.volcengineAI.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      thinking: { type: 'disabled' },
    } as any)

    const content = response.choices[0]?.message?.content || '{"keywords":[]}'
    const jsonText = this.extractJson(content)

    let parsed: ExtractTitleKeywordsResponse | string[]
    try {
      parsed = JSON.parse(jsonText) as ExtractTitleKeywordsResponse | string[]
    } catch {
      return []
    }

    const rawKeywords = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed.keywords) ? parsed.keywords : [])

    return this.normalizeKeywords(rawKeywords, normalizedTitle, count)
  }

  private buildPrompt(title: string, count: number): string {
    return `你是短视频标题优化助手。请从标题中提取最值得强调的关键词，用于上屏高亮。

标题：
${JSON.stringify(title)}

要求：
1. 返回不超过 ${count} 个关键词。
2. 每个关键词必须是标题中的原文子串，不能改写、不能造词。
3. 关键词优先选择：数字、金额、强动词、痛点词、冲突词、结果词。
4. 不要返回空字符串，不要重复。
5. 尽量避免只提取标点或纯功能词（如“的”“了”）。

仅输出 JSON（不要 markdown）：
{"keywords":["词1","词2"]}`
  }

  private extractJson(content: string): string {
    const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlock) return codeBlock[1].trim()

    const objectMatch = content.match(/\{[\s\S]*\}/)
    if (objectMatch) return objectMatch[0]

    const arrayMatch = content.match(/\[[\s\S]*\]/)
    if (arrayMatch) return `{"keywords":${arrayMatch[0]}}`

    return content.trim()
  }

  private normalizeKeywords(items: string[], title: string, maxCount: number): string[] {
    const seen = new Set<string>()
    const result: string[] = []

    for (const raw of items) {
      const keyword = (raw || '').replace(/\s+/g, ' ').trim()
      if (!keyword) continue
      if (!title.includes(keyword)) continue
      if (seen.has(keyword)) continue

      seen.add(keyword)
      result.push(keyword)
      if (result.length >= maxCount) break
    }

    return result
  }
}

