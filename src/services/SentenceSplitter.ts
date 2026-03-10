import { RawSubtitle, SplitSubtitle, Word } from "../types";
import { cut, add_word } from "jieba-wasm";
import { config } from "../config";
import type { SubtitleLayoutPresetName } from "../types";

export interface SplitterOptions {
  maxChars: number;
  maxLines: number;
  subtitleLayoutPreset?: SubtitleLayoutPresetName;
  /** 字幕显示时长缩放因子（0-1），越小显示时间越短，默认 1.0 */
  displayDurationScale?: number;
  /** 字幕结束时间提前量（毫秒），设置后优先于 displayDurationScale */
  groupEndOffset?: number;
}

/** 带时间信息的行 */
interface TimedLine {
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export class SentenceSplitter {
  constructor(private options: SplitterOptions) {}

  async init(): Promise<void> {
    for (const word of config.subtitle.customWords) {
      add_word(word);
    }
  }

  /** 主入口 */
  process(subtitles: RawSubtitle[]): SplitSubtitle[] {
    const result: SplitSubtitle[] = [];
    let groupId = 0;

    for (const sub of subtitles) {
      // 1. 分割文本并计算每行时间
      const timedLines = this.splitWithTiming(sub.text, sub.words, sub.start, sub.end);

      // 2. 按 maxLines 分组（二次切割）
      const groups = this.groupByMaxLines(timedLines);

      // 3. 构建字幕对象
      for (const group of groups) {
        const splits = this.buildSubtitles(group, groupId);
        result.push(...splits);
        groupId++;
      }
    }

    if (this.shouldApplyEarlyStartOptimizations()) {
      // 4. 尾句优化 - 短尾句提前到前一句最后两个字的时间
      this.adjustShortTailStart(result);

      // 5. 短屏优化 - 整屏字幕总字数 < 4，提前到前一屏最后两个字的时间
      this.adjustShortScreenStart(result);
    }

    return result;
  }

  /** singleCenter4 场景禁用提前显示，避免上一屏未结束就切到下一屏 */
  private shouldApplyEarlyStartOptimizations(): boolean {
    return this.options.subtitleLayoutPreset !== "singleCenter4";
  }

  /** 分割文本并计算每行时间 */
  private splitWithTiming(text: string, words: Word[], start: number, end: number): TimedLine[] {
    // 1. 先按标点和长度分割文本
    const lines = this.splitText(text);

    // 2. 为每行计算时间
    return this.assignTimingToLines(lines, words, start, end);
  }

  /** 为每行分配时间 */
  private assignTimingToLines(lines: string[], words: Word[], start: number, end: number): TimedLine[] {
    const result: TimedLine[] = [];
    let wordIndex = 0;
    const totalDuration = end - start;

    for (const line of lines) {
      // 找到这行文本对应的 words
      const lineChars = line.replace(/[，。！？、；：,!?;:\s]/g, "");
      let lineStart = -1;
      let lineEnd = -1;
      let matchedChars = 0;
      const matchedWords: Word[] = [];

      // 遍历 words 找到匹配的时间范围
      for (let i = wordIndex; i < words.length && matchedChars < lineChars.length; i++) {
        const word = words[i];
        const wordText = word.text.replace(/[，。！？、；：,!?;:\s]/g, "");

        if (lineStart === -1) {
          lineStart = word.start;
        }
        lineEnd = word.end;
        matchedChars += wordText.length;
        matchedWords.push(word);

        if (matchedChars >= lineChars.length) {
          wordIndex = i + 1;
          break;
        }
      }

      // 如果没找到匹配，使用均分时间
      if (lineStart === -1) {
        const lineRatio = line.length / lines.reduce((sum, l) => sum + l.length, 0);
        const prevEnd = result.length > 0 ? result[result.length - 1].end : start;
        lineStart = prevEnd;
        lineEnd = prevEnd + totalDuration * lineRatio;
      }

      result.push({
        text: line,
        start: lineStart,
        end: lineEnd,
        words: matchedWords
      });
    }

    return result;
  }

  /** 按 maxLines 分组（二次切割） */
  private groupByMaxLines(lines: TimedLine[]): TimedLine[][] {
    const groups: TimedLine[][] = [];
    const { maxLines } = this.options;

    for (let i = 0; i < lines.length; i += maxLines) {
      groups.push(lines.slice(i, i + maxLines));
    }

    return groups;
  }

  /** 核心：按标点分割文本，太长则用分词细分 */
  private splitText(text: string): string[] {
    // 1. 先按标点符号分割
    const segments = this.splitByPunctuation(text);

    // 2. 对每个片段检查长度，太长则用分词细分
    let rawLines: string[] = [];
    for (const seg of segments) {
      if (this.getVisualLength(seg) <= this.options.maxChars) {
        rawLines.push(seg);
      } else {
        const subLines = this.splitByWords(seg);
        rawLines.push(...subLines);
      }
    }

    // 3. 再次检查：合并过短的孤儿行（防止一闪而过）
    const mergedLines: string[] = [];
    if (rawLines.length > 0) {
      mergedLines.push(rawLines[0]);
      for (let i = 1; i < rawLines.length; i++) {
        const prev = mergedLines[mergedLines.length - 1];
        const curr = rawLines[i];

        // 如果当前行太短（< 5字符），且合并后不超过最大长度，则合并
        // 注意：这里允许合并后稍微超过一点点 maxChars (1.2倍)，以保证阅读体验优于换行
        // 孤儿行判定阈值 (视觉长度少于5个字)
        const isShort = this.getVisualLength(curr) < 5;

        if (isShort) {
          // 策略升级：遇到孤儿行，与上一行合并，然后重新“均衡切割”
          // 因为 splitByWords 内部使用 jieba 分词，所以绝对不会把一个词拆成两半。
          // 例如：Prev="我们正在做项目开发", Curr="中" (假设 limit=10)
          // 合并后="我们正在做项目开发中" -> rebalance -> "我们正在做" + "项目开发中"
          const combined = prev + curr;

          // 移除旧的 prev
          mergedLines.pop();

          // 重新切分 (如果 combined <= maxChars，会直接返回一行；如果超长，会均衡切成多行)
          const rebalanced = this.splitByWords(combined);
          mergedLines.push(...rebalanced);
        } else {
          mergedLines.push(curr);
        }
      }
    }

    return mergedLines;
  }

  /** 按标点符号分割，标点跟随前面的文字 */
  private splitByPunctuation(text: string): string[] {
    const punctuation = /([，。！？、；：,!?;:])/g;
    const parts = text.split(punctuation).filter((s) => s);

    const segments: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (punctuation.test(parts[i]) && segments.length > 0) {
        segments[segments.length - 1] += parts[i];
      } else {
        segments.push(parts[i]);
      }
    }

    return segments;
  }

  /** 用分词分割长文本 (均衡分割策略) */
  private splitByWords(text: string): string[] {
    const words = cut(text, false);
    const totalLen = this.getVisualLength(text);
    const maxChars = this.options.maxChars;

    // 如果总长度没超过，直接返回
    if (totalLen <= maxChars) {
      return [text];
    }

    // 计算逻辑：与其填满第一行留个尾巴，不如平均分配
    const chunkCount = Math.ceil(totalLen / maxChars);
    const targetLength = totalLen / chunkCount;

    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      // 核心判断：使用视觉长度
      const currentLen = this.getVisualLength(currentLine);
      const wordLen = this.getVisualLength(word);

      if (currentLine.length > 0 && currentLen + wordLen > targetLength) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /** 获取视觉长度：2个数字算1个字，其他算1个字 */
  /** 获取视觉长度：2个数字/字母算1个字，其他算1个字 */
  private getVisualLength(text: string): number {
    // 匹配数字和英文字母
    const halfWidthCount = (text.match(/[0-9a-zA-Z]/g) || []).length;
    const otherCount = text.length - halfWidthCount;
    return otherCount + Math.ceil(halfWidthCount / 2);
  }

  /** 构建字幕对象 */
  private buildSubtitles(lines: TimedLine[], groupId: number): SplitSubtitle[] {
    // 计算 group 的开始和结束时间
    const groupStart = lines[0].start;
    let groupEnd = lines[lines.length - 1].end;

    // 应用显示时长缩放因子
    const { displayDurationScale, groupEndOffset } = this.options;
    if (groupEndOffset !== undefined) {
      // 优先使用固定偏移量（毫秒）
      groupEnd = groupEnd - groupEndOffset;
    } else if (displayDurationScale !== undefined && displayDurationScale > 0 && displayDurationScale < 1) {
      // 使用缩放因子缩短显示时长
      const groupDuration = groupEnd - groupStart;
      groupEnd = groupStart + groupDuration * displayDurationScale;
    }

    const results: SplitSubtitle[] = [];

    lines.forEach((line, position) => {
      // 去掉标点符号，但保留单词间的空格
      const cleanText = this.removePunctuation(line.text);

      // 过滤掉空行
      if (!cleanText || !cleanText.trim()) {
        return;
      }

      results.push({
        start: line.start,
        end: line.end,
        groupStart,
        groupEnd,
        text: cleanText,
        groupId,
        position: results.length, // 使用实际的 index
        totalInGroup: lines.length, // 注意：这里可能不准，如果过滤了空行。但通常 totalInGroup 用于样式，暂时保持原义或修正
        keyword: this.extractKeyword(cleanText),
        words: line.words
      });
    });

    // 修正 totalInGroup 和 position
    return results.map((item, index) => ({
      ...item,
      position: index,
      totalInGroup: results.length
    }));
  }

  /** 去掉标点符号 */
  private removePunctuation(text: string): string {
    // 仅移除标点，保留空格
    // 替换中文标点和英文标点，但不包含 \s
    return text.replace(/[，。！？、；：,!?;:]/g, "").trim();
  }

  /** 提取关键词 */
  private extractKeyword(text: string): string | undefined {
    const words = cut(text, false);
    const sorted = words.filter((w) => w.length > 1).sort((a, b) => b.length - a.length);
    return sorted[0];
  }

  /**
   * 尾句优化：如果组内最后一句 <= 4 个视觉字符，提前到前一句最后两个字的时间开始显示
   */
  private adjustShortTailStart(result: SplitSubtitle[]): void {
    for (let i = 0; i < result.length; i++) {
      const sub = result[i];
      if (sub.totalInGroup <= 1 || sub.position !== sub.totalInGroup - 1) continue;
      if (this.getVisualLength(sub.text) > 4) continue;

      const prev = result[i - 1];
      if (!prev || prev.groupId !== sub.groupId || !prev.words?.length) continue;

      const prevWords = prev.words;
      const offsetWord = prevWords.length >= 2 ? prevWords[prevWords.length - 2] : prevWords[prevWords.length - 1];

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
      const offsetWord = prevWords.length >= 2 ? prevWords[prevWords.length - 2] : prevWords[prevWords.length - 1];

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
}
