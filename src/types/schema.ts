import { z } from 'zod';
import { VideoTemplate } from './index';

// 定义 Zod Schema 以匹配 VideoCompositionProps
// 注意：对于复杂的嵌套对象（如 VideoTemplate），Zod 可能难以完全表达类型，
// 因此对于复杂对象我们可能需要使用 z.any() 或简化版 schema，
// 或者在 index.ts 中将 VideoTemplate 定义为 Zod schema 推导出的类型。
// 为了由简入繁，这里先对基础类型进行校验，复杂对象使用 z.custom 或 z.any。

export const videoCompositionSchema = z.object({
    // 基础类型直接校验
    videoSrc: z.string().describe('背景视频路径'),
    pipOnlyMode: z.boolean().optional().describe('是否启用纯画中画拼接模式'),

    // 复杂对象，为了不仅能过类型检查，还能在 Studio 中有一点提示（尽管 Studio 对复杂对象支持有限）
    // 这里先用 any() 或者是 custom()，但在 Remotion Studio 中，object 会显示为 JSON 编辑器
    subtitles: z.array(z.any()).describe('字幕数据列表'),
    staticInfo: z.object({
        title: z.string().optional(),
        titleHighlights: z.array(z.object({
            keyword: z.string(),
            color: z.string().optional(),
            strokeColor: z.string().optional(),
            strokeWidth: z.number().optional(),
            textShadow: z.string().optional(),
        })).optional(),
        speaker: z.string().optional(),
        speakerTitle: z.string().optional(),
        avatarUrl: z.string().optional(),
    }).optional().describe('静态信息（标题/讲者）'),

    // Template 对象非常复杂，通常不建议在 Studio 中直接编辑整个 Template
    // 但我们需要校验它存在
    template: z.any().describe('视频模板配置'),

    pipMediaList: z.array(z.any()).optional().describe('画中画素材列表'),
    plannedVideoEffects: z.array(z.any()).optional().describe('背景动效排期列表'),
});

// 从 Schema 推导类型（可选，如果想替换 index.ts 中的定义）
// export type VideoCompositionSchemaType = z.infer<typeof videoCompositionSchema>;
