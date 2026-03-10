-- 数据库初始化脚本
-- 运行方式: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS video_generator
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE video_generator;

-- 任务表
CREATE TABLE IF NOT EXISTS video_tasks (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '任务ID (UUID)',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '任务状态: pending, processing, completed, failed',
  priority INT NOT NULL DEFAULT 0 COMMENT '优先级 (数值越大越高)',
  video_url TEXT NOT NULL COMMENT '原始视频链接',
  callback_url TEXT COMMENT '回调地址',
  options JSON COMMENT '任务选项',
  result JSON COMMENT '任务结果',
  progress INT NOT NULL DEFAULT 0 COMMENT '进度 (0-100)',
  current_step VARCHAR(255) COMMENT '当前步骤',
  retry_count INT NOT NULL DEFAULT 0 COMMENT '重试次数',
  error_message TEXT COMMENT '错误信息',
  created_at VARCHAR(30) NOT NULL COMMENT '创建时间',
  started_at VARCHAR(30) COMMENT '开始时间',
  completed_at VARCHAR(30) COMMENT '完成时间',
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority DESC, created_at ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频生成任务表';

-- 任务日志表
CREATE TABLE IF NOT EXISTS task_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  task_id VARCHAR(36) NOT NULL COMMENT '任务ID',
  level VARCHAR(10) NOT NULL DEFAULT 'info' COMMENT '日志级别',
  step VARCHAR(100) COMMENT '步骤名称',
  message TEXT NOT NULL COMMENT '日志内容',
  data JSON COMMENT '日志数据',
  created_at VARCHAR(30) NOT NULL COMMENT '创建时间',
  INDEX idx_logs_task_id (task_id),
  FOREIGN KEY (task_id) REFERENCES video_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务执行日志表';

-- 模板信息表
CREATE TABLE IF NOT EXISTS video_templates (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增ID',
  template_key VARCHAR(50) NOT NULL UNIQUE COMMENT '模板key，如 t1',
  template_name VARCHAR(255) NOT NULL COMMENT '模板名称',
  template_video_url TEXT COMMENT '模板视频URL',
  template_cover_url TEXT COMMENT '模板封面URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_templates_key (template_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板信息表';

-- 默认模板数据由应用启动时 initDatabase 自动写入（仅插入不存在项）
