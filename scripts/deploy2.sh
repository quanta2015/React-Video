#!/bin/bash
#===============================================================================
# 视频生成项目一键部署脚本（应用用户版）
# 适用系统：Ubuntu 24.04 LTS
# 修复点：
# 1. 不再要求输入 MySQL root 密码，优先通过 socket 自动管理 MySQL
# 2. 自动创建业务数据库和应用用户 video_app
# 3. 应用统一使用 video_app / 12345678 通过 TCP 连接 127.0.0.1
# 4. 部署时执行 schema.sql 自动建库建表
# 5. 启动时只检查数据库连接，不重复导入 schema.sql
# 6. server.ts 改为先启动 HTTP /health，再初始化 JobDispatcher
# 7. 默认关闭 AI 分句，避免火山引擎 AI 调用卡死
# 8. 健康检查改为轮询并输出关键日志
# 9. 修复 heredoc 结束符导致 TS 文件写坏的问题
#===============================================================================

set -Eeuo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_ROOT="/opt/video-demo"
APP_DIR="$APP_ROOT/nodejs"
LOG_DIR="/var/log/video-demo"

MYSQL_ROOT_SOCKET_CONF="$APP_ROOT/.mysql_root_socket.cnf"
MYSQL_APP_CONF_FILE="$APP_ROOT/.mysql_app.cnf"
MYSQL_RUNTIME_FILE="$APP_ROOT/.mysql_runtime"

DB_NAME="video_generator"
DB_APP_USER="video_app"
DB_APP_PASSWORD="12345678"
APP_PORT="3000"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

trap 'log_error "脚本执行失败，位置：${BASH_SOURCE[0]}:${LINENO}，命令：${BASH_COMMAND}"' ERR

check_root() {
  if [ "${EUID}" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
  fi
}

check_system() {
  if [ ! -f /etc/os-release ]; then
    log_error "无法识别系统版本"
    exit 1
  fi
  # shellcheck disable=SC1091
  . /etc/os-release
  if [ "${ID:-}" != "ubuntu" ]; then
    log_warn "此脚本为 Ubuntu 设计，当前系统：${PRETTY_NAME:-unknown}"
  fi
}

create_directories() {
  mkdir -p "$APP_DIR" "$APP_ROOT/output" "$APP_ROOT/public" "$LOG_DIR"
  chmod 755 "$APP_ROOT" "$APP_ROOT/output" "$APP_ROOT/public" "$LOG_DIR"
}

install_system_packages() {
  log_info "安装系统依赖..."
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl git wget unzip ffmpeg redis-server mysql-server nginx ufw \
    supervisor build-essential ca-certificates gnupg lsb-release \
    python3 openssl lsof
}

install_nodejs() {
  if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v20\.'; then
    log_info "安装 Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi

  npm install -g pm2
  log_success "Node.js: $(node -v), npm: $(npm -v)"
}

setup_redis() {
  log_info "启动 Redis..."
  systemctl enable redis-server
  systemctl restart redis-server
  redis-cli ping | grep -q PONG
  log_success "Redis 已启动"
}

ensure_mysql_root_socket_access() {
  log_info "检查 MySQL root 的本机 socket 管理权限..."

  systemctl enable mysql
  systemctl restart mysql

  if mysql -uroot -e "SELECT 1" >/dev/null 2>&1; then
    cat > "$MYSQL_ROOT_SOCKET_CONF" <<EOF
[client]
user=root
EOF
    chmod 600 "$MYSQL_ROOT_SOCKET_CONF"
    log_success "检测到 root 可通过本机 socket 登录"
    return 0
  fi

  if sudo mysql -uroot -e "SELECT 1" >/dev/null 2>&1; then
    cat > "$MYSQL_ROOT_SOCKET_CONF" <<EOF
[client]
user=root
EOF
    chmod 600 "$MYSQL_ROOT_SOCKET_CONF"
    log_success "检测到可通过 sudo mysql 使用 root 的 socket 登录"
    return 0
  fi

  log_error "无法通过本机 socket 访问 MySQL root，无法自动创建应用用户"
  exit 1
}

mysql_root_exec() {
  local sql="$1"
  mysql --defaults-extra-file="$MYSQL_ROOT_SOCKET_CONF" -e "$sql"
}

mysql_app_exec() {
  # shellcheck disable=SC1090
  . "$MYSQL_RUNTIME_FILE"
  local sql="$1"

  mysql -h127.0.0.1 -P3306 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -D"$MYSQL_DATABASE" -e "$sql"
}

mysql_import_file() {
  # shellcheck disable=SC1090
  . "$MYSQL_RUNTIME_FILE"
  local file="$1"

  mysql -h127.0.0.1 -P3306 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$file"
}

write_mysql_client_conf() {
  cat > "$MYSQL_APP_CONF_FILE" <<EOF
[client]
host=127.0.0.1
port=3306
user=${DB_APP_USER}
password=${DB_APP_PASSWORD}
protocol=tcp
database=${DB_NAME}
EOF

  chmod 600 "$MYSQL_APP_CONF_FILE"
}

setup_mysql() {
  log_info "配置 MySQL 数据库和应用用户..."

  ensure_mysql_root_socket_access

  mysql_root_exec "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"
  mysql_root_exec "CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_APP_PASSWORD}';"
  mysql_root_exec "CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'localhost' IDENTIFIED BY '${DB_APP_PASSWORD}';"
  mysql_root_exec "ALTER USER '${DB_APP_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_APP_PASSWORD}';"
  mysql_root_exec "ALTER USER '${DB_APP_USER}'@'localhost' IDENTIFIED BY '${DB_APP_PASSWORD}';"
  mysql_root_exec "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_APP_USER}'@'127.0.0.1';"
  mysql_root_exec "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_APP_USER}'@'localhost';"
  mysql_root_exec "FLUSH PRIVILEGES;"

  cat > "$MYSQL_RUNTIME_FILE" <<EOF
MYSQL_LOGIN_MODE=password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=${DB_APP_USER}
MYSQL_PASSWORD=${DB_APP_PASSWORD}
MYSQL_DATABASE=${DB_NAME}
EOF
  chmod 600 "$MYSQL_RUNTIME_FILE"

  write_mysql_client_conf

  cat > "$APP_ROOT/.db_credentials" <<EOF
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=${DB_APP_USER}
MYSQL_PASSWORD=${DB_APP_PASSWORD}
MYSQL_DATABASE=${DB_NAME}
MYSQL_LOGIN_MODE=password
EOF
  chmod 600 "$APP_ROOT/.db_credentials"

  if mysql -h127.0.0.1 -P3306 -u"${DB_APP_USER}" -p"${DB_APP_PASSWORD}" -D"${DB_NAME}" -e "SELECT 1" >/dev/null 2>&1; then
    log_success "MySQL 配置完成（应用将使用 ${DB_APP_USER} + TCP 连接）"
  else
    log_error "应用用户创建成功，但 TCP 验证失败"
    exit 1
  fi
}

setup_code() {
  log_info "部署项目代码..."
  cd "$APP_ROOT"

  local repo_url="https://github.com/quanta2015/React-Video.git"

  if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch --all --prune || true
    git reset --hard origin/main || git pull --ff-only || true
  elif [ -d "$APP_DIR" ] && [ -n "$(find "$APP_DIR" -mindepth 1 -maxdepth 1 2>/dev/null)" ]; then
    log_warn "$APP_DIR 非空，跳过 git clone，请确认代码已存在"
  else
    rm -rf "$APP_DIR"
    git clone "$repo_url" "$APP_DIR"
  fi

  cd "$APP_DIR"
  npm install

  if npm run build; then
    log_success "项目构建成功"
  else
    log_warn "TypeScript 构建失败，项目将继续按 npm run server / ts-node 方式运行"
  fi
}

patch_runtime_defaults() {
  log_info "写入运行时修复补丁..."

  cat > "$APP_DIR/src/database/index.ts" <<'EOF'
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'video_app',
      password: process.env.MYSQL_PASSWORD || '12345678',
      database: process.env.MYSQL_DATABASE || 'video_generator',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  const p = getPool();
  await p.query('SELECT 1');
  console.log('[Database] 数据库连接成功');
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
EOF

  cat > "$APP_DIR/src/server.ts" <<'EOF'
import 'dotenv/config';
import express from 'express';
import { createRouter } from './api/routes';
import { hmacAuth } from './api/auth';
import { JobDispatcher } from './queue/JobDispatcher';
import { initDatabase, closeDatabase } from './database';

const PORT = Number(process.env.PORT || 3000);

async function main() {
  console.log('[Server] 启动中...');
  console.log(`[Server] PORT=${PORT}`);

  console.log('[Server] 开始初始化数据库...');
  await initDatabase();
  console.log('[Server] 数据库初始化完成');

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    res.type('text/plain').send('server is running');
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] HTTP 服务启动: http://0.0.0.0:${PORT}`);
  });

  console.log('[Server] 开始初始化任务分发器...');
  const dispatcher = new JobDispatcher();
  console.log('[Server] 任务分发器初始化完成');

  app.use('/api', hmacAuth, createRouter(dispatcher));
  console.log('[Server] API 路由注册完成');
  console.log('[Server] 任务将通过 Redis 分发给 Worker 处理');

  const shutdown = async () => {
    console.log('\n[Server] 收到关闭信号，正在优雅关闭...');
    try {
      await dispatcher.close();
    } catch (err) {
      console.error('[Server] 关闭 dispatcher 失败:', err);
    }

    server.close(async () => {
      try {
        await closeDatabase();
      } catch (err) {
        console.error('[Server] 关闭数据库失败:', err);
      }
      console.log('[Server] 服务已关闭');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[Server] 启动失败:', err);
  process.exit(1);
});
EOF

  python3 - <<'EOF'
from pathlib import Path

p = Path('/opt/video-demo/nodejs/src/services/VideoProcessor.ts')
if p.exists():
    text = p.read_text(encoding='utf-8')
    old = "const useAI = options.useAI !== false;"
    new = "const useAI = options.useAI === true; // 修复：默认关闭 AI 分句，显式传 true 才调用火山引擎 AI"
    if old in text:
        text = text.replace(old, new, 1)
        p.write_text(text, encoding='utf-8')
EOF
}

verify_patched_files() {
  log_info "校验补丁文件..."

  if grep -qE 'EOF2|python3 - <<|from pathlib import Path|# 2\)' "$APP_DIR/src/database/index.ts"; then
    log_error "src/database/index.ts 内容异常，疑似 heredoc 写入失败"
    sed -n '1,120p' "$APP_DIR/src/database/index.ts" || true
    exit 1
  fi

  if grep -qE 'EOF2|python3 - <<|from pathlib import Path|# 2\)' "$APP_DIR/src/server.ts"; then
    log_error "src/server.ts 内容异常，疑似 heredoc 写入失败"
    sed -n '1,160p' "$APP_DIR/src/server.ts" || true
    exit 1
  fi

  log_success "补丁文件校验通过"
}

setup_env() {
  log_info "生成 .env ..."

  local api_secret
  api_secret=$(openssl rand -hex 32)

  cat > "$APP_DIR/.env" <<EOF
# ============================================
# 火山引擎 ASR 配置（按业务需要填写）
# ============================================
VOLCENGINE_APP_ID=6456990513
VOLCENGINE_ACCESS_TOKEN=0NZqwSrxfbymzz4UgnveU2JTDxBYIkIm
VOLCENGINE_AI_API_KEY=a396a7c4-9928-4195-8120-ec954099d60e


# ============================================
# 阿里云 OSS 配置（可选）
# ============================================
ALIYUN_OSS_ENDPOINT=
ALIYUN_OSS_BUCKET=
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_OSS_PREFIX=video-results
ALIYUN_OSS_PUBLIC_BASE_URL=
ALIYUN_OSS_TIMEOUT_MS=120000

# ============================================
# MySQL 数据库配置（统一使用应用用户）
# ============================================
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=${DB_APP_USER}
MYSQL_PASSWORD=${DB_APP_PASSWORD}
MYSQL_DATABASE=${DB_NAME}

# ============================================
# Redis 配置
# ============================================
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ============================================
# API 鉴权
# ============================================
API_SECRET=${api_secret}

# ============================================
# 服务器配置
# ============================================
PORT=${APP_PORT}
NODE_ENV=production
EOF

  chmod 600 "$APP_DIR/.env"
  log_success ".env 已生成（已写入应用用户数据库配置）"
}

init_database() {
  log_info "执行 schema.sql，初始化数据库表..."
  cd "$APP_DIR"

  if [ ! -f schema.sql ]; then
    log_error "未找到 schema.sql"
    exit 1
  fi

  mysql_import_file "$APP_DIR/schema.sql"
  mysql --defaults-extra-file="$MYSQL_APP_CONF_FILE" -N -B -e "SHOW TABLES LIKE 'video_tasks';" | grep -q '^video_tasks$'
  log_success "数据库建表完成"
}

setup_pm2() {
  log_info "配置 PM2..."
  cd "$APP_DIR"

  cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'video-server',
      cwd: '${APP_DIR}',
      script: 'npm',
      args: 'run server',
      env: {
        NODE_ENV: 'production',
        PORT: ${APP_PORT}
      },
      error_file: '${LOG_DIR}/server-error.log',
      out_file: '${LOG_DIR}/server-out.log',
      log_file: '${LOG_DIR}/server-combined.log',
      time: true,
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G'
    },
    {
      name: 'video-worker',
      cwd: '${APP_DIR}',
      script: 'npm',
      args: 'run worker -- --concurrency 2',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '${LOG_DIR}/worker-error.log',
      out_file: '${LOG_DIR}/worker-out.log',
      log_file: '${LOG_DIR}/worker-combined.log',
      time: true,
      instances: 1,
      autorestart: true,
      max_memory_restart: '4G'
    }
  ]
}
EOF

  pm2 delete video-server video-worker >/dev/null 2>&1 || true
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
  log_success "PM2 已启动"
}

setup_nginx() {
  log_info "配置 Nginx..."

  rm -f /etc/nginx/sites-enabled/default

  cat > /etc/nginx/sites-available/video-demo <<'EOF'
server {
    listen 80 default_server;
    server_name _;

    access_log /var/log/video-demo/nginx-access.log;
    error_log  /var/log/video-demo/nginx-error.log;

    client_max_body_size 500M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 600s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
    }

    location = /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /public/ {
        alias /opt/video-demo/public/;
        autoindex off;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /static/ {
        alias /opt/video-demo/public/;
        autoindex off;
        expires 7d;
        add_header Cache-Control "public";
    }

    location = / {
        default_type text/plain;
        return 200 "React-Video API is running\nhealth: /health\napi: /api/\n";
    }
}
EOF

  if ! grep -q 'map $http_upgrade $connection_upgrade' /etc/nginx/nginx.conf; then
    python3 - <<'EOF'
from pathlib import Path

p = Path('/etc/nginx/nginx.conf')
text = p.read_text(encoding='utf-8')
needle = 'http {'
insert = """http {
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
"""
if needle in text and 'map $http_upgrade $connection_upgrade' not in text:
    text = text.replace(needle, insert, 1)
    p.write_text(text, encoding='utf-8')
EOF
  fi

  ln -sf /etc/nginx/sites-available/video-demo /etc/nginx/sites-enabled/video-demo
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
  log_success "Nginx 配置完成"
}

setup_firewall() {
  ufw allow ssh || true
  ufw allow http || true
  ufw allow https || true
  ufw --force enable || true
}

health_check() {
  log_info "执行部署后自检..."

  local ok=0
  local i

  for i in {1..30}; do
    if curl -fsS "http://127.0.0.1:${APP_PORT}/health" >/dev/null 2>&1; then
      ok=1
      break
    fi
    sleep 2
  done

  if [ "$ok" != "1" ]; then
    log_error "应用未在 ${APP_PORT} 端口成功提供 /health"
    echo "---------- pm2 status ----------"
    pm2 status || true
    echo "---------- pm2 logs video-server ----------"
    pm2 logs video-server --lines 120 --nostream || true
    echo "---------- ss -lntp ----------"
    ss -lntp | grep -E ":${APP_PORT}|node" || true
    echo "---------- lsof ----------"
    lsof -iTCP -sTCP:LISTEN -P -n | grep -E ":${APP_PORT}|node" || true
    exit 1
  fi

  mysql --defaults-extra-file="$MYSQL_APP_CONF_FILE" -N -B -e "SELECT COUNT(*) FROM video_tasks;" >/dev/null
  redis-cli ping | grep -q PONG
  log_success "健康检查通过"
}

create_report() {
  local ip
  ip=$(hostname -I | awk '{print $1}')

  cat > "$APP_ROOT/DEPLOYMENT_REPORT.txt" <<EOF
================================================================================
React-Video 部署报告（应用用户版）
================================================================================
部署时间：$(date '+%Y-%m-%d %H:%M:%S')
服务器 IP：${ip}

访问地址：
- 健康检查：http://${ip}/health
- API 根路径：http://${ip}/api/

数据库：
- Host: 127.0.0.1
- Port: 3306
- User: ${DB_APP_USER}
- Password: ${DB_APP_PASSWORD}
- Database: ${DB_NAME}
- MySQL 应用客户端配置文件：${MYSQL_APP_CONF_FILE}

关键修复：
1. 不再要求输入 MySQL root 密码
2. 自动创建应用数据库用户 ${DB_APP_USER}
3. 应用统一使用 ${DB_APP_USER} + 密码 + TCP
4. 部署时执行 schema.sql 自动建表
5. 启动时数据库只做连通性检查，不重复执行 schema.sql
6. server.ts 改为先启动 /health，再初始化 JobDispatcher
7. 默认关闭 AI 分句，避免任务卡在 30%
8. 健康检查失败时输出 PM2 日志和监听端口

常用命令：
- pm2 status
- pm2 logs video-server
- pm2 logs video-worker
- systemctl status nginx
- systemctl status mysql
- systemctl status redis-server
EOF
}

main() {
  check_root
  check_system
  create_directories
  install_system_packages
  install_nodejs
  setup_redis
  setup_mysql
  setup_code
  patch_runtime_defaults
  verify_patched_files
  setup_env
  init_database
  setup_pm2
  setup_nginx
  setup_firewall
  health_check
  create_report
  log_success "部署完成：$APP_ROOT/DEPLOYMENT_REPORT.txt"
}

main