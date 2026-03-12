// import "dotenv/config";
// import express from "express";
// import { createRouter } from "./api/routes";
// import { hmacAuth } from "./api/auth";
// import { JobDispatcher } from "./queue/JobDispatcher";
// import { initDatabase, closeDatabase } from "./database";

// const PORT = Number(process.env.PORT || 3000);

// async function main() {
//   console.log("[Server] 启动中...");
//   console.log(`[Server] PORT=${PORT}`);

//   console.log("[Server] 开始初始化数据库...");
//   await initDatabase();
//   console.log("[Server] 数据库初始化完成");

//   console.log("[Server] 开始初始化任务分发器...");
//   const dispatcher = new JobDispatcher();
//   console.log("[Server] 任务分发器初始化完成");

//   const app = express();
//   app.use(express.json());

//   app.use("/api", hmacAuth, createRouter(dispatcher));

//   app.get("/health", (_req, res) => {
//     res.json({ status: "ok", timestamp: new Date().toISOString() });
//   });

//   const server = app.listen(PORT, "0.0.0.0", () => {
//     console.log(`[Server] HTTP 服务启动: http://0.0.0.0:${PORT}`);
//     console.log("[Server] 任务将通过 Redis 分发给 Worker 处理");
//   });

//   const shutdown = async () => {
//     console.log("\n[Server] 收到关闭信号，正在优雅关闭...");
//     await dispatcher.close();
//     server.close(async () => {
//       await closeDatabase();
//       console.log("[Server] 服务已关闭");
//       process.exit(0);
//     });
//   };

//   process.on("SIGTERM", shutdown);
//   process.on("SIGINT", shutdown);
// }

// main().catch((err) => {
//   console.error("[Server] 启动失败:", err);
//   process.exit(1);
// });

import "dotenv/config";
import express from "express";
import { createRouter } from "./api/routes";
import { hmacAuth } from "./api/auth";
import { JobDispatcher } from "./queue/JobDispatcher";
import { initDatabase, closeDatabase } from "./database";

const PORT = Number(process.env.PORT || 3000);

async function main() {
  console.log("[Server] 启动中...");
  console.log(`[Server] PORT=${PORT}`);

  console.log("[Server] 开始初始化数据库...");
  await initDatabase();
  console.log("[Server] 数据库初始化完成");

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/", (_req, res) => {
    res.type("text/plain").send("server is running");
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] HTTP 服务启动: http://0.0.0.0:${PORT}`);
  });

  console.log("[Server] 开始初始化任务分发器...");
  const dispatcher = new JobDispatcher();
  console.log("[Server] 任务分发器初始化完成");

  app.use("/api", hmacAuth, createRouter(dispatcher));
  console.log("[Server] API 路由注册完成");
  console.log("[Server] 任务将通过 Redis 分发给 Worker 处理");

  const shutdown = async () => {
    console.log("\n[Server] 收到关闭信号，正在优雅关闭...");
    try {
      await dispatcher.close();
    } catch (err) {
      console.error("[Server] 关闭 dispatcher 失败:", err);
    }

    server.close(async () => {
      try {
        await closeDatabase();
      } catch (err) {
        console.error("[Server] 关闭数据库失败:", err);
      }
      console.log("[Server] 服务已关闭");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[Server] 启动失败:", err);
  process.exit(1);
});
