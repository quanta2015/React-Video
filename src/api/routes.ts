import { Router, Request, Response } from 'express';
import { TaskRepository } from '../database/TaskRepository';
import { TaskLogger } from '../database/TaskLogger';
import { TemplateRepository } from '../database/TemplateRepository';
import { JobDispatcher } from '../queue/JobDispatcher';
import { CreateTaskRequest, TaskOptions, TaskResponse } from '../types';
import { TemplateRegistry } from '../remotion/templates';

export function createRouter(dispatcher: JobDispatcher): Router {
  const router = Router();
  const repository = new TaskRepository();
  const templateRepository = new TemplateRepository();

  // 创建任务
  router.post('/tasks', async (req: Request, res: Response) => {
    try {
      const body: CreateTaskRequest = req.body;

      const sanitizedOptions = body.options
        ? (({ skipSplit: _skipSplit, ...rest }) => rest as TaskOptions)(body.options as any)
        : undefined;
      const templateKey = sanitizedOptions?.template || 'simple';
      if (!TemplateRegistry.has(templateKey)) {
        return res.status(400).json({ error: `模板不存在: ${templateKey}` });
      }
      const template = TemplateRegistry.get(templateKey);
      const templateMode = template.mode ?? 'normal';
      const requiresBackgroundVideo = templateMode === 'normal';
      const requiresPipMedia = templateMode === 'pipOnly';
      const sourceMediaUrl = body.videoUrl || body.audioUrl;

      if (requiresBackgroundVideo && !body.videoUrl) {
        return res.status(400).json({ error: `模板 ${templateKey} mode=normal，需要 videoUrl 参数` });
      }
      if (!sourceMediaUrl) {
        return res.status(400).json({ error: '缺少输入媒体 URL（videoUrl 或 audioUrl）' });
      }
      if (requiresPipMedia && (!sanitizedOptions?.pip || sanitizedOptions.pip.length === 0)) {
        return res.status(400).json({ error: `模板 ${templateKey} mode=pipOnly，至少需要传入一个 pip 素材` });
      }

      const task = await repository.create({
        videoUrl: sourceMediaUrl,
        callbackUrl: body.callbackUrl,
        options: sanitizedOptions,
        priority: body.priority,
      });

      // 推送到 Redis 队列，由 Worker 处理
      await dispatcher.dispatch(task.id, body.priority || 0);

      const response: TaskResponse = {
        taskId: task.id,
        status: task.status,
        createdAt: task.createdAt,
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 查询任务状态
  router.get('/tasks/:taskId', async (req: Request, res: Response) => {
    try {
      const taskId = req.params.taskId as string;
      const task = await repository.findById(taskId);

      if (!task) {
        return res.status(404).json({ error: '任务不存在' });
      }

      const response: TaskResponse = {
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        currentStep: task.currentStep,
        result: task.result ? { outputUrl: task.result.outputUrl } : undefined,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 查询任务日志
  router.get('/tasks/:taskId/logs', async (req: Request, res: Response) => {
    try {
      const taskId = req.params.taskId as string;
      const task = await repository.findById(taskId);
      if (!task) {
        return res.status(404).json({ error: '任务不存在' });
      }

      const logs = await TaskLogger.getLogs(taskId);
      res.json({ taskId, logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取任务列表
  router.get('/tasks', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const tasks = await repository.list({
        status: status as any,
        limit,
        offset,
      });

      res.json({
        tasks: tasks.map(t => ({
          taskId: t.id,
          status: t.status,
          progress: t.progress,
          currentStep: t.currentStep,
          createdAt: t.createdAt,
        })),
        total: tasks.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 队列状态
  router.get('/queue/status', async (_req: Request, res: Response) => {
    try {
      const counts = await dispatcher.getStatus();
      res.json({ mode: 'redis-worker', ...counts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 模板列表（鉴权由上层 /api 中间件统一处理）
  router.get('/templates', async (_req: Request, res: Response) => {
    try {
      const templates = await templateRepository.list();
      res.json({
        templates,
        total: templates.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
