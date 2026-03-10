import OpenAI from 'openai';
import { config } from '../config';
import { RawSubtitle, SplitSubtitle, Word } from '../types';
import type { SubtitleLayoutPresetName } from '../types';

/** AI 分句结果 */
interface AISentenceResult {
    text: string;
    mainId: number;
    keyword: string;
    senseGroups?: number;
}

interface SenseGroupResplitTask {
    senseGroups: number;
    mainId: number;
    text: string;
}

/** 分句选项 */
export interface AISplitterOptions {
    maxChars: number;
    maxLines: number;
    subtitleLayoutPreset?: SubtitleLayoutPresetName;
}

/** AI 分句处理结果 */
export interface AISplitterResult {
    subtitles: SplitSubtitle[];
    logs: {
        inputText: string;
        config: { maxChars: number; maxLines: number; model: string };
        aiResponse: string;
        parsedResult: AISentenceResult[];
    };
}

/**
 * AI 分句器 - 使用火山引擎 AI API 进行智能分句
 */
export class AISentenceSplitter {
    private client: OpenAI;
    private options: AISplitterOptions;

    constructor(options: AISplitterOptions) {
        this.options = options;
        this.client = new OpenAI({
            baseURL: config.volcengineAI.baseUrl,
            apiKey: config.volcengineAI.apiKey,
        });
    }

    /**
     * 主入口：处理 ASR 原始字幕，返回分句后的字幕和日志
     */
    async process(subtitles: RawSubtitle[]): Promise<AISplitterResult> {
        // 1. 合并所有文本
        const fullText = subtitles.map(s => s.text).join('');
        console.log('[AISentenceSplitter] 输入文本:', fullText);

        // 2. 合并所有 words
        const allWords = subtitles.flatMap(s => s.words);

        // 3. 调用 AI 分句
        const { aiResults, aiResponse, aiConfig } = await this.callAI(fullText);
        console.log('[AISentenceSplitter] AI 分句结果:', JSON.stringify(aiResults, null, 2));

        // 4. 匹配时间信息
        const splitSubtitles = this.matchTiming(aiResults, allWords);

        return {
            subtitles: splitSubtitles,
            logs: {
                inputText: fullText,
                config: aiConfig,
                aiResponse,
                parsedResult: aiResults,
            },
        };
    }

    private splitSentences(text: string): string {
        const sentences = text.split(/([。？！；，]+)/);

        const result = [];
        for (let i = 0; i < sentences.length; i += 1) {
            // 如果text为空或者标点符号 跳过
            if (!sentences[i].trim()) {
                continue;
            }

            // 如果text是标点符号 跳过
            if (sentences[i].trim() === '。' || sentences[i].trim() === '？' || sentences[i].trim() === '！' || sentences[i].trim() === '；' || sentences[i].trim() === '、' || sentences[i].trim() === '，') {
                continue;
            }

            // 删除顿号
            sentences[i] = sentences[i].replace(/、/g, '');

            result.push({
                text: sentences[i],
                senseGroups: i,
            });
        }

        // json转string
        const jsonStr = JSON.stringify(result);

        return jsonStr;
    }

    /**
     * 调用 AI API 进行分句
     */
    private async callAI(text: string): Promise<{
        aiResults: AISentenceResult[];
        aiResponse: string;
        aiConfig: { maxChars: number; maxLines: number; model: string };
    }> {
        const aiConfig = {
            maxChars: this.options.maxChars,
            maxLines: this.options.maxLines,
            model: config.volcengineAI.model,
        };
        console.log('[AISentenceSplitter] 配置参数:', aiConfig);
        text = this.cleanSpaces(text);

        // 将text按标点符号拆分成若干个“原始意群”，输出json数组
        const sentences = this.splitSentences(text);
        console.log('[AISentenceSplitter] 拆分后的意群:', JSON.stringify(sentences, null, 2));

        const prompt = this.buildPrompt(sentences);

        const response = await this.client.chat.completions.create({
            model: config.volcengineAI.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1, // 低温度保证稳定输出,
            maxOutputTokens: 32768,
            topP: 0.95,
            thinking: {
                type: 'disabled',
            },
        } as any);

        const content = response.choices[0]?.message?.content || '[]';
        console.log('[AISentenceSplitter] AI 原始响应:', content);

        // 解析 JSON，处理可能的 markdown 代码块包裹
        const jsonStr = this.extractJson(content);

        try {
            const aiResults = JSON.parse(jsonStr) as AISentenceResult[];
            for (const item of aiResults) {
                item.text = this.cleanSpaces(item.text);
                if (item.keyword) {
                    item.keyword = this.cleanSpaces(item.keyword);
                }
            }
            // 校验每行是否超过当前模板配置的最大视觉字符数，超过的交给 AI 二次处理
            const validated = await this.validateAndFixOverlong(aiResults);
            // 强制保障：每个 mainId 最多 maxLines 行，超出自动拆到新屏
            const finalized = this.enforceMainIdLineLimits(validated);

            return { aiResults: finalized, aiResponse: content, aiConfig };
        } catch (error) {
            console.error('Failed to parse AI response:', content);
            throw new Error(`AI 返回格式错误: ${error}`);
        }
    }

    /**
     * 清理文本中的空格：只保留英文单词之间的空格
     * - 删除中文与中文之间的空格
     * - 删除中文与英文之间的空格
     * - 删除中文与数字之间的空格
     * - 保留英文单词之间的空格
     */
    private cleanSpaces(text: string): string {
        // 中文字符范围
        const chinese = '[\u4e00-\u9fa5]';
        // 英文字母和数字
        const alphanumeric = '[a-zA-Z0-9]';

        // 删除中文和中文之间的空格
        text = text.replace(new RegExp(`(${chinese})\\s+(${chinese})`, 'g'), '$1$2');
        // 删除中文和英文/数字之间的空格
        text = text.replace(new RegExp(`(${chinese})\\s+(${alphanumeric})`, 'g'), '$1$2');
        text = text.replace(new RegExp(`(${alphanumeric})\\s+(${chinese})`, 'g'), '$1$2');

        return text;
    }

    /**
     * 构建 AI Prompt
     */
    private buildPrompt(text: string): string {
        const { maxChars, maxLines } = this.options;
        return `# Role:

你是 Alex Hormozi 风格的短视频字幕逻辑专家。你的核心能力是平衡“语义完整性”与“视觉冲击力”。

# 【核心使命】

将文本转化为 JSON 格式字幕，遵循“标点主导，短句优先”的原则，确保观众一口气读完一个完整意群，绝不卡顿。
一个 senseGroups 对应一个意群。
一个 mainId 对应一个屏幕。

# 待处理文本
${text}

# 【处理逻辑算法】(请严格按此步骤执行)

**第一步：原子切分 (Atomic Slicing)**
将每个“意群”切分为若干个屏幕和若干个“视觉行” (Line)。

- **字数限制**：每行严格 ≤ ${maxChars} 个视觉字符。
- **计算规则**：1 汉字 = 1 字，2 英文/数字/空格 = 1 字。

**第二步：屏幕组装 (Screen Assembly)**
根据切分出的行数，决定如何分配 mainId。

- **目标**：尽量让一个“意群”在同一个 mainId 中展示完毕，不同意群不能在同一个 mainId 中展示。
- **上限规则**：每个 mainId 最多 ${maxLines} 行，越少越好。
- **溢出规则**：若一个意群切分后超过 ${maxLines} 行，必须按语义拆分为多个 mainId，并保证每屏都不超过 ${maxLines} 行。

# 【Hormozi 视觉规范】

1.  **防闪烁兜底**：
    - 虽然“1行/屏”优先级最高，但如果该行仅有 1-2 个无意义虚词（如“如果”、“那么”），**必须**将其与后文合并，牺牲“1行”追求“2行”，防止画面频闪。
    - **重要规则**：每个意群的最后一行文本必须至少包含4个视觉字符，如果少于4个字符，必须与前一行合并。

2.  **关键词高亮**：
    - 在 JSON 的 keyword 字段中，提取当前行最能刺激转化的词（金钱、数字、痛点、动词）。

# 【输出格式】

纯 JSON 数组，无需 Markdown 包装：

[
{"text": "第一行字幕", "mainId": 1, senseGroups: 1, "keyword": "关键词"},
{"text": "第二行字幕", "mainId": 1, senseGroups: 1, "keyword": ""},
{"text": "新的意群开始", "mainId": 2, senseGroups: 2, "keyword": "意群"},
{"text": "意群太长被拆分", "mainId": 3, senseGroups: 3, "keyword": ""},
{"text": "拆分后的下半部分", "mainId": 3, senseGroups: 3, "keyword": ""}
]`;
    }

    /**
     * 从 AI 响应中提取 JSON
     */
    private extractJson(content: string): string {
        // 尝试匹配 markdown 代码块
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }

        // 尝试匹配 JSON 数组
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return jsonMatch[0];
        }

        return content.trim();
    }

    /**
     * 根据 AI 分句结果匹配时间信息
     */
    private matchTiming(aiResults: AISentenceResult[], words: Word[]): SplitSubtitle[] {
        const result: SplitSubtitle[] = [];
        let wordIndex = 0;

        // 按 mainId 分组，记录每个组的成员
        const groups = new Map<number, AISentenceResult[]>();
        for (const item of aiResults) {
            const existing = groups.get(item.mainId) || [];
            existing.push(item);
            groups.set(item.mainId, existing);
        }

        // 第一步：匹配所有分句的时间信息
        for (const item of aiResults) {
            const group = groups.get(item.mainId) || [];

            // 匹配当前分句的时间范围
            const { start, end, matchedWords, newWordIndex } = this.matchSentenceWords(
                item.text,
                words,
                wordIndex
            );
            wordIndex = newWordIndex;

            // 计算在 group 中的位置
            const position = group.findIndex(g => g.text === item.text);
            const totalInGroup = group.length;

            result.push({
                start,
                end,
                groupStart: 0, // 临时值，后面会更新
                groupEnd: 0, // 临时值，后面会更新
                text: item.text,
                groupId: item.mainId - 1, // mainId 从 1 开始，groupId 从 0 开始
                position,
                totalInGroup,
                keyword: item.keyword || undefined,
                words: matchedWords,
            });
        }

        // 第二步：计算每个 group 的 groupStart 和 groupEnd
        const groupEndMap = new Map<number, number>();
        const groupStartMap = new Map<number, number>();
        for (const sub of result) {
            const currentEnd = groupEndMap.get(sub.groupId) || 0;
            if (sub.end > currentEnd) {
                groupEndMap.set(sub.groupId, sub.end);
            }
            const currentStart = groupStartMap.get(sub.groupId);
            if (currentStart === undefined || sub.start < currentStart) {
                groupStartMap.set(sub.groupId, sub.start);
            }
        }

        // 第三步：更新每个分句的 groupStart 和 groupEnd
        for (const sub of result) {
            sub.groupStart = groupStartMap.get(sub.groupId) || sub.start;
            sub.groupEnd = groupEndMap.get(sub.groupId) || sub.end;
        }

        if (this.shouldApplyEarlyStartOptimizations()) {
            // 第四步：尾句优化 - 如果组内最后一句 <= 4 个视觉字符，提前到前一句最后两个字的时间
            this.adjustShortTailStart(result);

            // 第五步：短屏优化 - 如果整屏字幕总字数 < 4，提前到前一屏最后两个字的时间
            this.adjustShortScreenStart(result);
        }

        return result;
    }

    /** singleCenter4 场景禁用提前显示，避免上一屏未结束就切到下一屏 */
    private shouldApplyEarlyStartOptimizations(): boolean {
        return this.options.subtitleLayoutPreset !== 'singleCenter4';
    }

    /**
     * 匹配单个分句对应的 words
     */
    private matchSentenceWords(
        text: string,
        words: Word[],
        startIndex: number
    ): { start: number; end: number; matchedWords: Word[]; newWordIndex: number } {
        const matchedWords: Word[] = [];
        let start = -1;
        let end = -1;

        // 清理文本，移除空格用于匹配
        const cleanText = text.replace(/\s+/g, '');
        let matchedChars = 0;
        let i = startIndex;

        while (i < words.length && matchedChars < cleanText.length) {
            const word = words[i];
            const wordText = word.text.replace(/[，。！？、；：,!?;:\s]/g, '');

            // 跳过空白 word
            if (!wordText || word.start === -1) {
                i++;
                continue;
            }

            if (start === -1) {
                start = word.start;
            }
            end = word.end;
            matchedWords.push(word);
            matchedChars += wordText.length;
            i++;
        }

        // 如果没找到，使用默认值
        if (start === -1) {
            start = matchedWords.length > 0 ? matchedWords[0].start : 0;
            end = matchedWords.length > 0 ? matchedWords[matchedWords.length - 1].end : 0;
        }

        return {
            start,
            end,
            matchedWords,
            newWordIndex: i,
        };
    }

    /**
     * 尾句优化：如果组内最后一句 < 4 个视觉字符，提前到前一句最后两个字的时间开始显示
     */
    private adjustShortTailStart(result: SplitSubtitle[]): void {
        for (let i = 0; i < result.length; i++) {
            const sub = result[i];
            // 必须是组内最后一句，且组内有多于1句
            if (sub.totalInGroup <= 1 || sub.position !== sub.totalInGroup - 1) continue;
            // 视觉长度 < 4 才需要提前（确保至少4个字符）
            if (this.getVisualLength(sub.text) >= 4) continue;

            // 找到同组的前一句
            const prev = result[i - 1];
            if (!prev || prev.groupId !== sub.groupId || !prev.words?.length) continue;

            // 取前一句最后一个字（word）的起始时间
            const prevWords = prev.words;
            const offsetWord = prevWords[prevWords.length - 1];

            sub.start = offsetWord.start;
        }
    }

    /**
     * 短屏优化：如果整屏字幕总字数 < 4，提前到前一屏最后两个字的时间开始显示
     */
    private adjustShortScreenStart(result: SplitSubtitle[]): void {
        // 按 groupId 分组
        const groups = new Map<number, SplitSubtitle[]>();
        for (const sub of result) {
            const list = groups.get(sub.groupId) || [];
            list.push(sub);
            groups.set(sub.groupId, list);
        }

        const groupIds = [...groups.keys()].sort((a, b) => a - b);

        for (let g = 1; g < groupIds.length; g++) {
            const currentGroup = groups.get(groupIds[g])!;
            const prevGroup = groups.get(groupIds[g - 1])!;

            // 计算当前屏总视觉字数
            const totalLen = currentGroup.reduce((sum, s) => sum + this.getVisualLength(s.text), 0);
            if (totalLen >= 4) continue;

            // 找前一屏最后一句的 words
            const prevLast = prevGroup[prevGroup.length - 1];
            if (!prevLast.words?.length) continue;

            const prevWords = prevLast.words;
            const offsetWord = prevWords[prevWords.length - 1];

            // 将当前屏所有字幕的 start 提前，同时更新 groupStart
            const newStart = offsetWord.start;
            for (const sub of currentGroup) {
                if (sub.position === 0) {
                    sub.start = newStart;
                    sub.groupStart = newStart;
                } else {
                    sub.groupStart = newStart;
                }
            }
        }
    }

    /** 获取视觉长度：2个数字/字母算1个字，其他算1个字 */
    private getVisualLength(text: string): number {
        const halfWidthCount = (text.match(/[0-9a-zA-Z]/g) || []).length;
        const otherCount = text.length - halfWidthCount;
        return otherCount + Math.ceil(halfWidthCount / 2);
    }

    /**
     * 校验 AI 分句结果，找出包含超长行的意群，整体交给 AI 重新分句
     */
    private async validateAndFixOverlong(aiResults: AISentenceResult[]): Promise<AISentenceResult[]> {
        const overlongItems = aiResults.filter(
            item => this.getVisualLength(item.text) > this.options.maxChars
        );

        if (overlongItems.length === 0) {
            return aiResults;
        }

        console.log(
            '[AISentenceSplitter] 发现超长行:',
            overlongItems.map(i => `"${i.text}" (视觉长度: ${this.getVisualLength(i.text)})`),
        );

        // 找出包含超长行的意群 ID
        const badSenseGroups = new Set(
            overlongItems
                .map(i => i.senseGroups)
                .filter((id): id is number => typeof id === 'number')
        );

        // 按意群收集需要修复的任务，批量发给 AI
        const tasks: SenseGroupResplitTask[] = [];
        for (const sgId of badSenseGroups) {
            const groupItems = aiResults.filter(i => i.senseGroups === sgId);
            if (groupItems.length === 0) {
                continue;
            }

            tasks.push({
                senseGroups: sgId,
                mainId: groupItems[0].mainId,
                text: groupItems.map(i => i.text).join(''),
            });
        }

        if (tasks.length === 0) {
            return aiResults;
        }

        const fixMap = await this.resplitSenseGroupsBatch(tasks);

        // 用重新分句的结果替换原意群
        const finalResults: AISentenceResult[] = [];
        const replaced = new Set<number>();
        for (const item of aiResults) {
            const sgId = item.senseGroups;
            if (typeof sgId !== 'number') {
                finalResults.push(item);
                continue;
            }

            const fixed = fixMap.get(sgId);
            if (fixed) {
                if (!replaced.has(sgId)) {
                    finalResults.push(...fixed);
                    replaced.add(sgId);
                }
                // 跳过该意群的后续原始行
            } else {
                finalResults.push(item);
            }
        }

        // 重新分句会只改局部意群，可能产生 mainId 冲突（例如替换结果占用了后续已有 mainId）。
        // 这里按当前顺序重建连续的 mainId，保证每个连续屏组唯一且递增。
        return this.normalizeMainIdsByOrder(finalResults);
    }

    /**
     * 将多个超长意群一次性发给 AI 重新分句，失败时回退为逐个重分句
     */
    private async resplitSenseGroupsBatch(tasks: SenseGroupResplitTask[]): Promise<Map<number, AISentenceResult[]>> {
        const taskJson = JSON.stringify(tasks, null, 2);
        const prompt = `你是字幕拆分专家。下面是多个需要修复的意群任务，请一次性完成全部任务并返回结果。

计算规则：1 汉字 = 1 字，2 英文字母/数字/空格 = 1 字。每行严格 ≤ ${this.options.maxChars} 个视觉字符。

每个任务字段说明：
- senseGroups: 意群 ID，必须原样保留
- mainId: 该意群起始 mainId
- text: 该意群完整原文

输入任务（JSON）：
${taskJson}

要求：
- 必须覆盖所有输入任务，不能漏掉任何 senseGroups
- 按语义合理断句，不要拆词，不要改动原文文字
- keyword 字段：提取当前行最能刺激转化的词，没有则留空字符串
- 对每个 senseGroups 独立处理：
  - 若拆分后行数 ≤ ${this.options.maxLines}，保持同一个 mainId
  - 若超过 ${this.options.maxLines} 行，按语义拆成递增 mainId，且每屏最多 ${this.options.maxLines} 行
- 不同 senseGroups 不要合并或交叉输出

输出格式：
- 仅输出合法 JSON 数组，不要 Markdown 包裹
- 每个元素格式：
  {"text":"...", "mainId":123, "senseGroups":22, "keyword":"..."}
`;

        try {
            const response = await this.client.chat.completions.create({
                model: config.volcengineAI.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                maxOutputTokens: 32768,
                thinking: { type: 'disabled' },
            } as any);

            const content = response.choices[0]?.message?.content || '[]';
            console.log(`[AISentenceSplitter] 意群批量重新分句(${tasks.length}组) => ${content}`);

            const jsonStr = this.extractJson(content);
            const results = JSON.parse(jsonStr) as AISentenceResult[];

            const validSenseGroups = new Set(tasks.map(t => t.senseGroups));
            const grouped = new Map<number, AISentenceResult[]>();

            for (const r of results) {
                if (typeof r.senseGroups !== 'number' || !validSenseGroups.has(r.senseGroups)) {
                    continue;
                }

                r.text = this.cleanSpaces(r.text);
                if (r.keyword) r.keyword = this.cleanSpaces(r.keyword);

                const list = grouped.get(r.senseGroups) || [];
                list.push(r);
                grouped.set(r.senseGroups, list);
            }

            const missing = tasks
                .filter(t => !grouped.has(t.senseGroups))
                .map(t => t.senseGroups);
            if (missing.length > 0) {
                throw new Error(`批量结果缺少 senseGroups: ${missing.join(', ')}`);
            }

            return grouped;
        } catch (error) {
            console.error('[AISentenceSplitter] 意群批量重新分句失败，回退为逐个重分句', error);

            const fallback = new Map<number, AISentenceResult[]>();
            for (const task of tasks) {
                const fixed = await this.resplitSenseGroup(task.text, task.mainId, task.senseGroups);
                fallback.set(task.senseGroups, fixed);
            }
            return fallback;
        }
    }

    /**
     * 按结果顺序归一化 mainId：
     * - 同一连续屏组（相邻行 mainId 相同）保持同一个新 mainId
     * - 屏组切换时 mainId 递增，避免非连续复用导致的冲突与乱序
     */
    private normalizeMainIdsByOrder(aiResults: AISentenceResult[]): AISentenceResult[] {
        if (aiResults.length === 0) {
            return aiResults;
        }

        let currentSourceMainId = aiResults[0].mainId;
        let normalizedMainId = aiResults[0].mainId;

        return aiResults.map(item => {
            if (item.mainId !== currentSourceMainId) {
                currentSourceMainId = item.mainId;
                normalizedMainId += 1;
            }

            return {
                ...item,
                mainId: normalizedMainId,
            };
        });
    }

    /**
     * 强制约束每个 mainId 的行数上限：
     * - 同一连续 source mainId 视为同一“候选屏组”
     * - 若该屏组行数超过 maxLines，超出的行自动拆到新的 mainId
     * - 统一按输出顺序生成连续 mainId，避免冲突与复用
     */
    private enforceMainIdLineLimits(aiResults: AISentenceResult[]): AISentenceResult[] {
        if (aiResults.length <= 1) {
            return aiResults;
        }

        const maxLines = Math.max(1, this.options.maxLines || 1);
        const startMainId = aiResults[0].mainId > 0 ? aiResults[0].mainId : 1;
        let currentSourceMainId = aiResults[0].mainId;
        let assignedMainId = startMainId;
        let assignedLineCount = 0;
        let changed = false;

        const fixed = aiResults.map(item => {
            // source mainId 切换：开启下一屏
            if (item.mainId !== currentSourceMainId) {
                currentSourceMainId = item.mainId;
                assignedMainId += 1;
                assignedLineCount = 0;
            }

            // 超出当前屏行数上限：拆到新屏
            if (assignedLineCount >= maxLines) {
                assignedMainId += 1;
                assignedLineCount = 0;
            }

            const next = {
                ...item,
                mainId: assignedMainId,
            };
            assignedLineCount += 1;
            if (next.mainId !== item.mainId) {
                changed = true;
            }
            return next;
        });

        if (changed) {
            console.warn(
                '[AISentenceSplitter] 已按 maxLines 强制修正 mainId（超行自动拆屏）',
                {
                    maxLines,
                    before: aiResults.map(i => i.mainId),
                    after: fixed.map(i => i.mainId),
                },
            );
        }

        return fixed;
    }

    /**
     * 将整个意群的文本交给 AI 重新整体分句
     */
    private async resplitSenseGroup(
        fullText: string,
        mainId: number,
        senseGroups: number,
    ): Promise<AISentenceResult[]> {
        const prompt = `你是字幕拆分专家。下面这段文本之前的分句有行超过了 ${this.options.maxChars} 个视觉字符的限制，请重新整体分句。

计算规则：1 汉字 = 1 字，2 英文字母/数字/空格 = 1 字。每行严格 ≤ ${this.options.maxChars} 个视觉字符。

要求：
- 整体重新分配，让每行字数尽量均匀，不要出现一行很长一行很短的情况
- 按语义合理断句，不要把词拆开
- 保持原文不变，不要增删改任何文字
- keyword 字段：提取当前行最能刺激转化的词，没有则留空字符串

原文: "${fullText}"
senseGroups: ${senseGroups}
起始 mainId: ${mainId}

如果拆分后行数 ≤ ${this.options.maxLines}，使用同一个 mainId。如果超过 ${this.options.maxLines} 行，按语义拆分为递增的 mainId，且每屏最多 ${this.options.maxLines} 行。

输出纯 JSON 数组，格式：
[{"text": "第一行", "mainId": ${mainId}, "senseGroups": ${senseGroups}, "keyword": ""}]`;

        try {
            const response = await this.client.chat.completions.create({
                model: config.volcengineAI.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                thinking: { type: 'disabled' },
            } as any);

            const content = response.choices[0]?.message?.content || '[]';
            console.log(`[AISentenceSplitter] 意群重新分句 "${fullText}" => ${content}`);

            const jsonStr = this.extractJson(content);
            const results = JSON.parse(jsonStr) as AISentenceResult[];

            for (const r of results) {
                r.text = this.cleanSpaces(r.text);
                if (r.keyword) r.keyword = this.cleanSpaces(r.keyword);
            }

            return results;
        } catch (error) {
            console.error(`[AISentenceSplitter] 意群重新分句失败，保留原文: "${fullText}"`, error);
            return [{ text: fullText, mainId, keyword: '', senseGroups }];
        }
    }
}
