import 'dotenv/config';
import express from 'express';
import { createRouter } from './api/routes';
import { hmacAuth } from './api/auth';
import { JobDispatcher } from './queue/JobDispatcher';
import { initDatabase, closeDatabase } from './database';

const PORT = process.env.PORT || 3000;

async function main() {
  // 初始化数据库
  await initDatabase();
  console.log('[Server] 数据库初始化完成');

  // 创建任务分发器（连接 Redis）
  const dispatcher = new JobDispatcher();

  // 创建 Express 应用
  const app = express();
  app.use(express.json());

  // 注册路由（鉴权）
  app.use('/api', hmacAuth, createRouter(dispatcher));

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 启动服务
  const server = app.listen(PORT, () => {
    console.log(`[Server] HTTP 服务启动: http://localhost:${PORT}`);
    console.log('[Server] 任务将通过 Redis 分发给 Worker 处理');
  });

  // 优雅关闭
  const shutdown = async () => {
    console.log('\n[Server] 收到关闭信号，正在优雅关闭...');
    await dispatcher.close();
    server.close(async () => {
      await closeDatabase();
      console.log('[Server] 服务已关闭');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(console.error);
