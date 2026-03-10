import path from "path";
import fs from "fs";
import { config } from "../config";
import { VolcengineASR } from "./VolcengineASR";
import { SentenceSplitter } from "./SentenceSplitter";
import { AISentenceSplitter } from "./AISentenceSplitter";
import { SubtitleTranslator } from "./SubtitleTranslator";
import { SubtitleCorrector } from "./SubtitleCorrector";
import { VideoRenderer } from "./VideoRenderer";
import { AudioMixer, SfxTrigger } from "./AudioMixer";
import { PipMatcher } from "./PipMatcher";
import { TitleKeywordExtractor } from "./TitleKeywordExtractor";
import { assignStyles } from "./SubtitleStyleAssigner";
import { generateSfxTriggers } from "./SfxTriggerGenerator";
import { parsePipMedia } from "./PipMediaResolver";
import { planVideoEffects } from "../remotion/components/effects/videoEffectPlanner";
import { WorkerRegistry } from "./WorkerRegistry";
import { TemplateRegistry } from "../remotion/templates";
import { PipMedia, StaticInfo, SplitSubtitle, StyledSubtitle, TaskOptions, TitleHighlightStyle } from "../types";
import { downloadFile, getFileNameFromUrl } from "../utils/download";
import { getSubtitleLayoutPreset } from "../subtitles/layoutPresets";

/** 进度回调函数类型 */
export type ProgressCallback = (progress: number, step: string) => void | Promise<void>;

/** 日志回调函数类型 */
export type LogCallback = (
  level: "info" | "warn" | "error",
  step: string,
  message: string,
  data?: any
) => void | Promise<void>;

/** 处理结果 */
export interface ProcessResult {
  outputPath: string;
  timing: Record<string, any>;
}

/** 处理器选项 */
export interface ProcessorCallbacks {
  onProgress?: ProgressCallback;
  onLog?: LogCallback;
  /** 处理完成后是否清理临时文件，默认 false */
  cleanupTemp?: boolean;
  /** Worker 注册中心，用于动态计算渲染并发数 */
  workerRegistry?: WorkerRegistry;
}

export class VideoProcessor {
  private taskId: string;
  private onProgress?: ProgressCallback;
  private onLog?: LogCallback;
  private cleanupTemp: boolean;
  private workerRegistry?: WorkerRegistry;

  constructor(taskId: string, callbacks?: ProcessorCallbacks) {
    this.taskId = taskId;
    this.onProgress = callbacks?.onProgress;
    this.onLog = callbacks?.onLog;
    this.cleanupTemp = callbacks?.cleanupTemp ?? false;
    this.workerRegistry = callbacks?.workerRegistry;
  }

  /** 处理媒体（视频/音频） */
  async process(sourceMediaUrl: string, options: TaskOptions, outputPath?: string): Promise<ProcessResult> {
    const timing: Record<string, any> = {};
    const baseTemplate = TemplateRegistry.get(options.template || "simple");
    const template = baseTemplate;
    const tempDir = path.join(config.paths.output, "temp", this.taskId);
    const finalOutputPath = outputPath || path.join(config.paths.output, `${this.taskId}.mp4`);
    const templateMode = template.mode ?? "normal";
    const hasBackgroundVideo = templateMode === "normal";
    const requiresPipMedia = templateMode === "pipOnly";

    try {
      const sourceFileName = getFileNameFromUrl(sourceMediaUrl);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const localMediaPath = path.join(tempDir, sourceFileName);

      const renderer = new VideoRenderer(this.workerRegistry);
      const pipMediaList = await parsePipMedia(options.pip, {
        onWarn: (message) => this.log("warn", "pip", message)
      });
      if (requiresPipMedia && pipMediaList.length === 0) {
        throw new Error(`模板 ${template.name} mode=pipOnly，至少需要传入一个 pip 素材`);
      }
      this.updateProgress(4, "画中画素材预处理");
      const startPreparePipMedia = Date.now();
      const renderPipMediaList = await this.stagePipMediaForRender(pipMediaList);
      timing.preparePipMedia = Date.now() - startPreparePipMedia;
      const stagedPipCount = renderPipMediaList.filter((media, index) => media.url !== pipMediaList[index]?.url).length;
      if (renderPipMediaList.length > 0) {
        this.log("info", "pip", "画中画素材预处理完成", {
          total: renderPipMediaList.length,
          staged: stagedPipCount
        });
      }
      const silentOutput = path.join(tempDir, "temp_silent.mp4");

      let splitSubtitles: SplitSubtitle[];
      let prepareResult: any;

      const shouldSkipSplit = Boolean(options.splitSubtitlePath);
      if (shouldSkipSplit) {
        // 跳过 ASR + 分句，直接加载已有的 subtitle_split.json
        this.updateProgress(5, "加载已有分句字幕");

        const splitPath = path.isAbsolute(options.splitSubtitlePath!)
          ? options.splitSubtitlePath!
          : path.resolve(options.splitSubtitlePath!);
        if (!fs.existsSync(splitPath)) {
          throw new Error(`未找到分句字幕文件: ${splitPath}，请检查 splitSubtitlePath 配置`);
        }
        const data = JSON.parse(fs.readFileSync(splitPath, "utf-8"));
        splitSubtitles = data.subtitles;
        this.log("info", "split", "加载已有分句字幕", { path: splitPath, count: splitSubtitles.length });

        // 先下载输入媒体，再渲染预准备（prepare 依赖媒体文件）
        this.updateProgress(10, "下载媒体");
        this.log("info", "download", "开始下载媒体", { url: sourceMediaUrl });
        const startDownload = Date.now();
        await downloadFile(sourceMediaUrl, localMediaPath);
        timing.download = Date.now() - startDownload;
        this.log("info", "download", "媒体下载完成", { duration: timing.download });

        this.updateProgress(20, "渲染预准备");
        this.log("info", "prepare", "开始渲染预准备（打包 + 媒体信息）");
        const startPrepare = Date.now();
        prepareResult = await renderer.prepare({
          inputMedia: localMediaPath,
          hasBackgroundVideo,
          taskId: this.taskId
        });
        timing.prepare = Date.now() - startPrepare;
        this.log("info", "prepare", "渲染预准备完成", { timing: prepareResult.timing });
      } else {
        // 正常流程：ASR + 分句
        let rawSubtitles;

        // 步骤0 & 1: 并行执行下载和语音识别
        this.updateProgress(5, "开始下载与识别");
        this.log("info", "process", "并行执行媒体下载和语音识别");

        // 启动下载任务
        const downloadTask = (async () => {
          this.log("info", "download", "开始下载媒体", { url: sourceMediaUrl });
          const start = Date.now();
          await downloadFile(sourceMediaUrl, localMediaPath);
          timing.download = Date.now() - start;
          this.log("info", "download", "媒体下载完成", { duration: timing.download });
        })();

        // 启动 ASR 任务
        let asrTask: Promise<void> | undefined;
        if (!options.skipAsr) {
          asrTask = (async () => {
            this.log("info", "asr", "开始语音识别");
            const start = Date.now();
            const asr = new VolcengineASR(config.volcengine);
            const result = await asr.recognize(sourceMediaUrl);
            rawSubtitles = result.subtitles;
            this.saveJson(tempDir, "subtitle_raw.json", result);
            timing.asr = Date.now() - start;
            this.log("info", "asr", "语音识别完成", { subtitleCount: rawSubtitles.length });
          })();
        } else if (options.subtitlePath) {
          const data = JSON.parse(fs.readFileSync(options.subtitlePath, "utf-8"));
          rawSubtitles = data.subtitles;
          this.log("info", "asr", "加载已有字幕", { path: options.subtitlePath });
        } else {
          const defaultSubtitle = path.join(tempDir, "subtitle_raw.json");
          if (fs.existsSync(defaultSubtitle)) {
            const data = JSON.parse(fs.readFileSync(defaultSubtitle, "utf-8"));
            rawSubtitles = data.subtitles;
            this.log("info", "asr", "加载默认字幕文件", { path: defaultSubtitle });
          }
        }

        // 等待所有任务完成
        await Promise.all([downloadTask, asrTask ? asrTask : Promise.resolve()]);

        if (!rawSubtitles && !options.skipAsr) {
          throw new Error("语音识别失败，未获取到字幕");
        } else if (!rawSubtitles) {
          throw new Error("需要提供字幕文件或启用语音识别");
        }

        // 步骤1.5: 字幕校正（如果提供了原始文案）
        if (options.originalText) {
          this.updateProgress(20, "字幕校正");
          this.log("info", "correct", "开始字幕校正");
          const startCorrect = Date.now();
          const corrector = new SubtitleCorrector();
          const correctionResult = corrector.correct(rawSubtitles, options.originalText);
          rawSubtitles = correctionResult.subtitles;
          timing.correct = Date.now() - startCorrect;
          this.log("info", "correct", "字幕校正完成", correctionResult.stats);
          this.saveJson(tempDir, "subtitle_corrected.json", { subtitles: rawSubtitles });
        }

        // 步骤2 & 渲染预准备: 并行执行智能分句和渲染预准备
        this.updateProgress(30, "智能分句 & 渲染预准备");
        this.log("info", "parallel", "并行执行智能分句和渲染预准备");

        // 任务A: 智能分句
        const splitTask = (async () => {
          const useAI = options.useAI !== false;
          this.log("info", "split", "开始智能分句", { useAI });
          const startSplit = Date.now();

          const subtitleLayoutPreset = getSubtitleLayoutPreset(template.layout.subtitleLayoutPreset);
          const subtitleSplitConfig = template.layout.subtitleSplit;
          const splitterOptions = {
            maxChars: subtitleLayoutPreset.split.maxChars || config.subtitle.maxChars,
            maxLines: subtitleLayoutPreset.split.maxLines || config.subtitle.maxLines,
            subtitleLayoutPreset: subtitleLayoutPreset.name,
            displayDurationScale: subtitleSplitConfig?.displayDurationScale,
            groupEndOffset: subtitleSplitConfig?.groupEndOffset
          };
          this.log("info", "split", "分句参数来源", {
            subtitleLayoutPreset: subtitleLayoutPreset.name,
            maxChars: splitterOptions.maxChars,
            maxLines: splitterOptions.maxLines,
            source: "template"
          });

          let result: SplitSubtitle[];
          if (useAI) {
            const aiSplitter = new AISentenceSplitter(splitterOptions);
            const aiResult = await aiSplitter.process(rawSubtitles);
            result = aiResult.subtitles;
            this.log("info", "split", "AI 分句配置", aiResult.logs.config);
            this.log("info", "split", "AI 输入文本", { text: aiResult.logs.inputText });
            this.log("info", "split", "AI 原始响应", { response: aiResult.logs.aiResponse });
            this.log("info", "split", "AI 解析结果", { parsed: aiResult.logs.parsedResult });
          } else {
            const splitter = new SentenceSplitter(splitterOptions);
            await splitter.init();
            result = splitter.process(rawSubtitles);
          }
          this.saveJson(tempDir, "subtitle_split.json", { subtitles: result });
          timing.split = Date.now() - startSplit;
          this.log("info", "split", "智能分句完成", { count: result.length });
          let finalSubtitles = result;

          // 中英双语翻译（模板驱动）
          const bilingualConfig = template.layout.bilingual;
          if (bilingualConfig?.enabled) {
            this.updateProgress(40, "英文字幕翻译");
            this.log("info", "translate", "开始英文字幕翻译");
            const startTranslate = Date.now();
            try {
              const translator = new SubtitleTranslator();
              finalSubtitles = await translator.translate(result, bilingualConfig);
              timing.translate = Date.now() - startTranslate;
              this.saveJson(tempDir, "subtitle_bilingual.json", { subtitles: finalSubtitles });
              this.log("info", "translate", "英文字幕翻译完成", { count: finalSubtitles.length });
            } catch (error: any) {
              timing.translate = Date.now() - startTranslate;
              this.log("warn", "translate", `英文字幕翻译失败，已跳过: ${error.message}`);
            }
          }

          return finalSubtitles;
        })();

        // 任务B: 渲染预准备（bundle + getVideoInfo + 可选复制背景视频）
        const prepareTask = (async () => {
          this.log("info", "prepare", "开始渲染预准备（打包 + 媒体信息）");
          const startPrepare = Date.now();
          const result = await renderer.prepare({
            inputMedia: localMediaPath,
            hasBackgroundVideo,
            taskId: this.taskId
          });
          timing.prepare = Date.now() - startPrepare;
          this.log("info", "prepare", "渲染预准备完成", { timing: result.timing });
          return result;
        })();

        // 等待两个并行任务完成
        const [splitResult, prepResult] = await Promise.all([splitTask, prepareTask]);
        splitSubtitles = splitResult;
        prepareResult = prepResult;
      }

      // 步骤3: 样式分配
      this.updateProgress(45, "样式分配");
      const startStyle = Date.now();
      const styledSubtitles = assignStyles(splitSubtitles, template);
      timing.style = Date.now() - startStyle;
      this.log("info", "style", "样式分配完成");

      // 步骤3.5: 画中画 AI 语义匹配（如果有带标签的素材）
      const hasTags = renderPipMediaList.some((m) => m.tags && m.tags.length > 0);
      if (hasTags) {
        this.updateProgress(47, "画中画 AI 匹配");
        this.log("info", "pip-match", "开始画中画 AI 语义匹配");
        const startPipMatch = Date.now();
        try {
          const matcher = new PipMatcher();
          await matcher.match(renderPipMediaList, styledSubtitles);
          timing.pipMatch = Date.now() - startPipMatch;
          this.log("info", "pip-match", "画中画 AI 匹配完成", {
            matched: renderPipMediaList.filter((m) => m.targetGroupId !== undefined).length,
            total: renderPipMediaList.length
          });
        } catch (error: any) {
          timing.pipMatch = Date.now() - startPipMatch;
          this.log("warn", "pip-match", `画中画 AI 匹配失败，回退随机模式: ${error.message}`);
        }
      }

      const videoFps =
        Number.isFinite(prepareResult.videoInfo.fps) && prepareResult.videoInfo.fps > 0
          ? prepareResult.videoInfo.fps
          : config.video.fps;
      const videoDurationInFrames = Math.max(1, Math.ceil(Math.max(0, prepareResult.videoInfo.duration) * videoFps));
      const plannedVideoEffects = hasBackgroundVideo
        ? planVideoEffects({
            durationInFrames: videoDurationInFrames,
            fps: videoFps,
            template,
            pipMediaList: renderPipMediaList,
            subtitles: styledSubtitles
          })
        : [];
      if (hasBackgroundVideo) {
        this.log("info", "effects", "背景动效排期完成", {
          count: plannedVideoEffects.length,
          effects: plannedVideoEffects.map((item) => ({
            type: item.type,
            startFrame: item.startFrame,
            subtitleGroupId: item.subtitleGroupId,
            startSfx: item.startSfx,
            endSfx: item.endSfx
          }))
        });
      } else {
        this.log("info", "effects", "pipOnly 模式下跳过背景动效排期");
      }

      const staticInfo: StaticInfo = {
        title: options.title,
        speaker: options.speaker,
        speakerTitle: options.speakerTitle,
        avatarUrl: options.avatarUrl || options.avatar
      };
      const titleKeywordStyles = Array.isArray(template.layout.title.keywordStyles)
        ? template.layout.title.keywordStyles.filter(this.isTitleKeywordStyle)
        : [];
      const configuredKeywordCount = template.layout.title.keywordCount;
      const titleKeywordCount =
        typeof configuredKeywordCount === "number" ? Math.max(0, Math.floor(configuredKeywordCount)) : 2;

      // 仅当模板明确提供了标题关键词样式池时，才触发标题 AI 关键词提取。
      if (options.title && titleKeywordStyles.length > 0 && titleKeywordCount > 0) {
        this.updateProgress(48, "标题关键词提取");
        this.log("info", "title-keyword", "开始标题关键词提取", {
          keywordCount: titleKeywordCount,
          styleCount: titleKeywordStyles.length
        });
        const startTitleKeyword = Date.now();
        try {
          const extractor = new TitleKeywordExtractor();
          const keywords = await extractor.extract(options.title, { count: titleKeywordCount });
          const titleHighlights = keywords.map((keyword) => ({
            keyword,
            ...titleKeywordStyles[Math.floor(Math.random() * titleKeywordStyles.length)]
          }));

          if (titleHighlights.length > 0) {
            staticInfo.titleHighlights = titleHighlights;
          }

          timing.titleKeyword = Date.now() - startTitleKeyword;
          this.log("info", "title-keyword", "标题关键词提取完成", {
            requested: titleKeywordCount,
            extracted: keywords.length,
            keywords
          });
        } catch (error: any) {
          timing.titleKeyword = Date.now() - startTitleKeyword;
          this.log("warn", "title-keyword", `标题关键词提取失败，已跳过: ${error.message}`);
        }
      } else if (options.title && titleKeywordStyles.length === 0) {
        this.log("info", "title-keyword", "模板未配置标题关键词样式，跳过标题关键词提取");
      } else if (options.title && titleKeywordCount <= 0) {
        this.log("info", "title-keyword", "标题关键词数量配置 <= 0，跳过标题关键词提取");
      }

      // 步骤4: 视频渲染
      this.updateProgress(50, "视频渲染");
      this.log("info", "render", "开始视频渲染");
      const startRender = Date.now();

      const renderResult = await renderer.render({
        subtitles: styledSubtitles,
        staticInfo,
        inputMedia: localMediaPath,
        hasBackgroundVideo,
        outputPath: silentOutput,
        template,
        pipMediaList: renderPipMediaList,
        plannedVideoEffects,
        prepareResult
      });

      timing.render = Date.now() - startRender;
      timing.renderDetail = renderResult.timing;
      this.log("info", "render", "视频渲染完成", { timing: renderResult.timing });

      // 步骤5: 音频混合
      this.updateProgress(85, "音频混合");
      this.log("info", "mix", "开始音频混合");
      const startMix = Date.now();

      const mixer = new AudioMixer();
      const bgmPath = options.bgmUrl?.trim();
      if (bgmPath) {
        this.log("info", "mix", "使用用户传入背景音乐", { bgmUrl: bgmPath });
      } else {
        this.log("info", "mix", "未传 bgmUrl，将不添加背景音乐");
      }
      const sfxTriggers = generateSfxTriggers(styledSubtitles, {
        plannedVideoEffects,
        sfxSequence: template.sfxSequence,
        subtitleAnimationSequence: template.subtitleAnimationSequence,
        subtitleAnimationSfxMap: template.subtitleAnimationSfxMap,
        fps: videoFps
      });
      this.logSubtitleAnimationSfxDetails(styledSubtitles, sfxTriggers);

      const mixResult = await mixer.mix({
        videoPath: renderResult.outputPath,
        originalAudio: localMediaPath,
        bgmPath,
        sfxTriggers,
        outputPath: finalOutputPath
      });

      timing.mix = Date.now() - startMix;
      timing.mixDetail = mixResult.timing;
      this.log("info", "mix", "音频混合完成");

      this.updateProgress(100, "处理完成");
      this.log("info", "complete", "视频处理完成", { outputPath: finalOutputPath, timing });

      return { outputPath: finalOutputPath, timing };
    } finally {
      // 清理临时文件（仅 API 模式）
      if (this.cleanupTemp) {
        if (fs.existsSync(tempDir)) {
          this.log("info", "cleanup", "清理临时文件", { tempDir });
          fs.rmSync(tempDir, { recursive: true });
        }
        // 清理 public 目录中该任务的视频文件
        const publicDir = path.join(__dirname, "../../public");
        if (fs.existsSync(publicDir)) {
          for (const file of fs.readdirSync(publicDir)) {
            if (file.startsWith(this.taskId) && !fs.statSync(path.join(publicDir, file)).isDirectory()) {
              fs.unlinkSync(path.join(publicDir, file));
              this.log("info", "cleanup", "清理 public 视频文件", { file });
            }
          }
        }
      }
    }
  }

  private updateProgress(progress: number, step: string): void {
    if (!this.onProgress) return;
    try {
      const result = this.onProgress(progress, step);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch((error) => {
          this.reportCallbackError("progress", error, { progress, step });
        });
      }
    } catch (error) {
      this.reportCallbackError("progress", error, { progress, step });
    }
  }

  private async stagePipMediaForRender(pipMediaList: PipMedia[]): Promise<PipMedia[]> {
    if (!Array.isArray(pipMediaList) || pipMediaList.length === 0) {
      return [];
    }

    const publicDir = path.join(__dirname, "../../public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const stagedByUrl = new Map<string, string>();
    const result: PipMedia[] = [];

    for (let index = 0; index < pipMediaList.length; index += 1) {
      const media = pipMediaList[index];
      const originalUrl = typeof media.url === "string" ? media.url.trim() : "";
      if (!originalUrl) {
        result.push(media);
        continue;
      }

      const cached = stagedByUrl.get(originalUrl);
      if (cached) {
        result.push({ ...media, url: cached });
        continue;
      }

      if (!this.shouldStagePipMedia(originalUrl)) {
        result.push(media);
        continue;
      }

      const fallbackExt = media.type === "video" ? ".mp4" : ".jpg";
      const mediaExt = this.getMediaExtension(originalUrl, fallbackExt);
      const stagedFileName =
        media.type === "video" ? `${this.taskId}_pip_${index}.mp4` : `${this.taskId}_pip_${index}${mediaExt}`;
      const stagedPath = path.join(publicDir, stagedFileName);
      const sourceFileName = media.type === "video" ? `${this.taskId}_pip_${index}_src${mediaExt}` : stagedFileName;
      const sourcePath = path.join(publicDir, sourceFileName);

      try {
        if (this.isHttpUrl(originalUrl)) {
          await downloadFile(originalUrl, sourcePath);
        } else {
          const absolutePath = path.isAbsolute(originalUrl) ? originalUrl : path.resolve(originalUrl);
          if (!fs.existsSync(absolutePath)) {
            this.log("warn", "pip", `画中画素材不存在，跳过本地化: ${originalUrl}`);
            result.push(media);
            continue;
          }
          fs.copyFileSync(absolutePath, sourcePath);
        }

        if (media.type === "video") {
          await this.transcodePipVideoForRender(sourcePath, stagedPath);
          if (sourcePath !== stagedPath && fs.existsSync(sourcePath)) {
            fs.unlinkSync(sourcePath);
          }
        }

        stagedByUrl.set(originalUrl, stagedFileName);
        result.push({ ...media, url: stagedFileName });
      } catch (error: any) {
        this.log("warn", "pip", `画中画素材本地化失败，保留原地址: ${originalUrl}`, {
          error: error?.message ?? String(error)
        });
        result.push(media);
      }
    }

    return result;
  }

  private shouldStagePipMedia(url: string): boolean {
    if (this.isHttpUrl(url)) return true;
    if (url.startsWith("data:")) return false;
    if (path.isAbsolute(url)) return true;
    if (url.startsWith("./") || url.startsWith("../")) return true;
    return false;
  }

  private isHttpUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private getMediaExtension(url: string, fallbackExt: string): string {
    const normalizeExt = (ext: string) => (ext && ext.startsWith(".") ? ext : fallbackExt);
    if (this.isHttpUrl(url)) {
      try {
        const parsedUrl = new URL(url);
        return normalizeExt(path.extname(parsedUrl.pathname) || fallbackExt);
      } catch {
        return fallbackExt;
      }
    }
    return normalizeExt(path.extname(url) || fallbackExt);
  }

  private async transcodePipVideoForRender(inputPath: string, outputPath: string): Promise<void> {
    const ffmpeg = await import("fluent-ffmpeg");
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg
        .default(inputPath)
        .outputOptions([
          "-an",
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-preset veryfast",
          "-crf 23",
          "-movflags +faststart"
        ])
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });
  }

  private log(level: "info" | "warn" | "error", step: string, message: string, data?: any): void {
    if (!this.onLog) return;
    try {
      const result = this.onLog(level, step, message, data);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch((error) => {
          this.reportCallbackError("log", error, { level, step, message });
        });
      }
    } catch (error) {
      this.reportCallbackError("log", error, { level, step, message });
    }
  }

  private reportCallbackError(callback: "progress" | "log", error: unknown, context: Record<string, any>): void {
    const errText = error instanceof Error ? error.stack || error.message : String(error);
    console.error(`[VideoProcessor] ${callback} callback failed for task ${this.taskId}`, {
      ...context,
      error: errText
    });
  }

  private saveJson(dir: string, filename: string, data: any): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
  }

  private isTitleKeywordStyle(value: unknown): value is TitleHighlightStyle {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const style = value as TitleHighlightStyle;
    const hasColor = typeof style.color === "string" && style.color.trim().length > 0;
    const hasStrokeColor = typeof style.strokeColor === "string" && style.strokeColor.trim().length > 0;
    const hasStrokeWidth = typeof style.strokeWidth === "number" && Number.isFinite(style.strokeWidth);
    const hasTextShadow = typeof style.textShadow === "string" && style.textShadow.trim().length > 0;
    return hasColor || hasStrokeColor || hasStrokeWidth || hasTextShadow;
  }

  private logSubtitleAnimationSfxDetails(subtitles: StyledSubtitle[], sfxTriggers: SfxTrigger[]): void {
    const sortedSubtitles = Array.isArray(subtitles)
      ? subtitles.slice().sort((a, b) => a.groupId - b.groupId || a.position - b.position || a.start - b.start)
      : [];

    // Build a map of sfx filename -> configured name
    const sfxFilenameToName = new Map<string, string>();
    const configuredSfx = Array.isArray(config.sfx) ? config.sfx : [];
    for (const item of configuredSfx) {
      if (item && typeof item === "object" && typeof item.file === "string" && typeof item.name === "string") {
        sfxFilenameToName.set(item.file, item.name);
      }
    }

    // Build a map of groupStart time -> sfx display name
    // Each group has exactly one sound effect (generated by buildSubtitleAnimationSfxPlan)
    const sfxByGroupStartTime = new Map<number, string>();
    for (const trigger of sfxTriggers) {
      const sfxFilename = path.basename(trigger.sfxPath);
      // Try to get the configured name, fallback to filename
      const sfxName = sfxFilenameToName.get(sfxFilename) ?? sfxFilename;
      sfxByGroupStartTime.set(trigger.time, sfxName);
    }

    // Track which groups we've already shown the sound for
    const shownGroupSounds = new Set<number>();

    const lines = sortedSubtitles.map((sub, index) => {
      const anchorTime = this.getSubtitleAnchorTime(sub);

      // Only show sound for the first line of each group
      // Lines within the same group share the same groupStart time
      const groupId = sub.groupId;
      let sfx: string;

      if (shownGroupSounds.has(groupId)) {
        // This is not the first line of this group - show empty
        sfx = "none";
      } else {
        // First line of this group - show the sound if exists
        const sfxName = sfxByGroupStartTime.get(anchorTime);
        sfx = sfxName ?? "none";
        shownGroupSounds.add(groupId);
      }

      return {
        index: index + 1,
        text: sub.text,
        animation: `${sub.animationIn} -> ${sub.animationOut}`,
        sfx
      };
    });

    this.log("info", "subtitle-debug", "字幕逐句明细（内容/动效/音效）", {
      lines
    });
  }

  private getSubtitleAnchorTime(sub: Pick<StyledSubtitle, "groupStart" | "start">): number {
    const rawAnchor = Number.isFinite(sub.groupStart) ? sub.groupStart : sub.start;
    return Math.max(0, Math.floor(rawAnchor));
  }
}
