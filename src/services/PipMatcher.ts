import OpenAI from 'openai'
import { config } from '../config'
import { PipMedia, StyledSubtitle } from '../types'

/** AI 匹配结果项 */
interface PipMatchResult {
    /** 素材索引（对应 pipMediaList 中的下标） */
    pipIndex: number
    /** 匹配到的字幕组 ID */
    groupId: number
}

/**
 * 画中画 AI 语义匹配器
 *
 * 批量将带标签的画中画素材发给 AI，让 AI 根据标签与字幕内容
 * 选择最佳的字幕组（groupId）作为插入位置。
 */
export class PipMatcher {
    private client: OpenAI

    constructor() {
        this.client = new OpenAI({
            baseURL: config.volcengineAI.baseUrl,
            apiKey: config.volcengineAI.apiKey,
        })
    }

    /**
     * 对画中画素材进行 AI 语义匹配
     * - 只处理有 tags 的素材
     * - 无标签素材不受影响（保持 targetGroupId 为 undefined）
     * - AI 调用失败时静默回退，不影响原有流程
     */
    async match(
        pipMediaList: PipMedia[],
        subtitles: StyledSubtitle[],
    ): Promise<void> {
        // 筛选出带标签的素材及其原始索引
        const itemsWithTags = pipMediaList
            .map((media, index) => ({ media, index }))
            .filter(item => this.getSemanticTags(item.media).length > 0)

        if (itemsWithTags.length === 0) {
            console.log('[PipMatcher] 无带标签的素材，跳过 AI 匹配')
            return
        }

        // 构建字幕组列表：groupId → 合并文本
        const groupTexts = this.buildGroupTexts(subtitles)
        if (groupTexts.length === 0) {
            console.log('[PipMatcher] 无字幕组数据，跳过 AI 匹配')
            return
        }

        console.log(`[PipMatcher] 开始 AI 匹配: ${itemsWithTags.length} 个素材 × ${groupTexts.length} 个字幕组`)

        try {
            const results = await this.callAI(itemsWithTags, groupTexts)

            // 将匹配结果写回 pipMediaList
            for (const result of results) {
                if (result.pipIndex >= 0 && result.pipIndex < pipMediaList.length) {
                    const media = pipMediaList[result.pipIndex]
                    media.targetGroupId = result.groupId
                    const tagsText = this.getSemanticTags(media).join('、')
                    console.log(
                        `[PipMatcher] 素材 #${result.pipIndex} [${tagsText || '无标签'}] → 字幕组 #${result.groupId}`,
                    )
                }
            }
        } catch (error: any) {
            console.error(`[PipMatcher] AI 匹配失败，回退随机模式: ${error.message}`)
            // 不抛出异常，让后续流程继续使用随机逻辑
        }
    }

    /** 构建字幕组摘要：groupId → 合并文本 */
    private buildGroupTexts(
        subtitles: StyledSubtitle[],
    ): { groupId: number; text: string }[] {
        const groupMap = new Map<number, string[]>()

        for (const sub of subtitles) {
            const list = groupMap.get(sub.groupId) || []
            list.push(sub.text)
            groupMap.set(sub.groupId, list)
        }

        return Array.from(groupMap.entries())
            .map(([groupId, texts]) => ({ groupId, text: texts.join('') }))
            .sort((a, b) => a.groupId - b.groupId)
    }

    /** 批量调用 AI 进行语义匹配 */
    private async callAI(
        items: { media: PipMedia; index: number }[],
        groupTexts: { groupId: number; text: string }[],
    ): Promise<PipMatchResult[]> {
        const prompt = this.buildPrompt(items, groupTexts)

        const response = await this.client.chat.completions.create({
            model: config.volcengineAI.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            maxOutputTokens: 4096,
            topP: 0.95,
            thinking: {
                type: 'disabled',
            },
        } as any)

        const content = response.choices[0]?.message?.content || '[]'
        console.log('[PipMatcher] AI 原始响应:', content)

        const jsonStr = this.extractJson(content)
        const results = JSON.parse(jsonStr) as PipMatchResult[]

        // 校验结果
        const validGroupIds = new Set(groupTexts.map(g => g.groupId))
        return results.filter(r => validGroupIds.has(r.groupId))
    }

    /** 构建 AI Prompt */
    private buildPrompt(
        items: { media: PipMedia; index: number }[],
        groupTexts: { groupId: number; text: string }[],
    ): string {
        const subtitleList = groupTexts
            .map(g => `  { "groupId": ${g.groupId}, "text": "${g.text}" }`)
            .join(',\n')

        const pipList = items
            .map(item => `  { "pipIndex": ${item.index}, "tags": ${JSON.stringify(this.getSemanticTags(item.media))} }`)
            .join(',\n')

        return `你是一个视频编辑助手。现在需要为"画中画"素材选择最佳的显示时机。

## 字幕组列表（按时间顺序）
每个字幕组代表视频中一屏字幕，groupId 是唯一标识：
[
${subtitleList}
]

## 画中画素材列表
每个素材有 tags（标签数组）描述素材语义：
[
${pipList}
]

## 任务
根据每个画中画素材的 tags，从字幕组列表中选择**语义最相关**的字幕组，让素材在该字幕播放时显示。

## 规则
1. 每个素材必须匹配到一个不同的字幕组（不能重复选择同一个 groupId）
2. 选择语义最契合的字幕组——素材标签应与字幕讨论的话题相关
3. 尽量让素材分散在视频的不同部分，避免都集中在开头或结尾
4. 如果多个字幕组都与某素材相关，优先选择语义匹配度最高的

## 输出格式
仅输出 JSON 数组，不要任何其他文字：
[
  { "pipIndex": 0, "groupId": 3 },
  { "pipIndex": 1, "groupId": 7 }
]`
    }

    private getSemanticTags(media: PipMedia): string[] {
        if (Array.isArray(media.tags)) {
            const tags = media.tags.map(tag => tag.trim()).filter(Boolean)
            if (tags.length > 0) return tags
        }
        return []
    }

    /** 从 AI 响应中提取 JSON */
    private extractJson(content: string): string {
        // 处理 markdown 代码块包裹
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) return match[1].trim()
        // 尝试直接解析
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) return jsonMatch[0]
        return content.trim()
    }
}
