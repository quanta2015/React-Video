
#!/bin/bash
#===============================================================================
# 视频生成项目一键部署脚本（修正版）
# 适用系统：Ubuntu 24.04 LTS
# 重点修复：
# 1. 数据库统一使用 root + 安装时密码/Socket
# 2. 自动建库建表（执行 schema.sql）
# 3. Nginx 反向代理与根路径配置修正
# 4. 默认关闭 AI 分句，避免火山引擎 AI 调用卡死；增加关键自检
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
MYSQL_CONF_FILE="$APP_ROOT/.mysql_root.cnf"
MYSQL_RUNTIME_FILE="$APP_ROOT/.mysql_runtime"
DB_NAME="video_generator"
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
  . /etc/os-release
  if [ "$ID" != "ubuntu" ]; then
    log_warn "此脚本为 Ubuntu 设计，当前系统：$PRETTY_NAME"
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
    supervisor build-essential ca-certificates gnupg lsb-release
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
  systemctl enable redis-server
  systemctl restart redis-server
  redis-cli ping | grep -q PONG
  log_success "Redis 已启动"
}

prompt_mysql_runtime() {
  if [ -f "$MYSQL_RUNTIME_FILE" ]; then
    # shellcheck disable=SC1090
    . "$MYSQL_RUNTIME_FILE"
    return 0
  fi

  log_info "检测 MySQL root 认证方式..."
  local auth_plugin
  auth_plugin=$(mysql -N -B -uroot -e "SELECT plugin FROM mysql.user WHERE user='root' AND host='localhost' LIMIT 1;" 2>/dev/null || true)

  if mysql -uroot -e "SELECT 1" >/dev/null 2>&1; then
    cat > "$MYSQL_RUNTIME_FILE" <<EOF2
MYSQL_LOGIN_MODE=socket
MYSQL_ROOT_USER=root
MYSQL_ROOT_PASSWORD=
EOF2
    chmod 600 "$MYSQL_RUNTIME_FILE"
    log_success "MySQL root 当前可通过本机 socket 直连"
    return 0
  fi

  local root_pw=""
  echo ""
  echo "请输入当前 MySQL root 密码（安装时设置的密码）"
  read -r -s -p "MySQL root 密码: " root_pw
  echo ""

  if mysql -uroot -p"$root_pw" -e "SELECT 1" >/dev/null 2>&1; then
    cat > "$MYSQL_RUNTIME_FILE" <<EOF2
MYSQL_LOGIN_MODE=password
MYSQL_ROOT_USER=root
MYSQL_ROOT_PASSWORD=$root_pw
EOF2
    chmod 600 "$MYSQL_RUNTIME_FILE"
    log_success "MySQL root 密码验证通过"
    return 0
  fi

  log_error "无法使用当前 root 凭证连接 MySQL"
  exit 1
}

mysql_exec() {
  # shellcheck disable=SC1090
  . "$MYSQL_RUNTIME_FILE"
  local sql="$1"
  if [ "$MYSQL_LOGIN_MODE" = "socket" ]; then
    mysql -uroot -e "$sql"
  else
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "$sql"
  fi
}

mysql_import_file() {
  # shellcheck disable=SC1090
  . "$MYSQL_RUNTIME_FILE"
  local file="$1"
  if [ "$MYSQL_LOGIN_MODE" = "socket" ]; then
    mysql -uroot < "$file"
  else
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < "$file"
  fi
}

write_mysql_client_conf() {
  # shellcheck disable=SC1090
  . "$MYSQL_RUNTIME_FILE"
  if [ "$MYSQL_LOGIN_MODE" = "socket" ]; then
    cat > "$MYSQL_CONF_FILE" <<EOF2
[client]
user=root
EOF2
  else
    cat > "$MYSQL_CONF_FILE" <<EOF2
[client]
user=root
password=$MYSQL_ROOT_PASSWORD
EOF2
  fi
  chmod 600 "$MYSQL_CONF_FILE"
}

setup_mysql() {
  log_info "配置 MySQL..."
  systemctl enable mysql
  systemctl restart mysql

  prompt_mysql_runtime
  write_mysql_client_conf

  mysql_exec "CREATE DATABASE IF NOT EXISTS ${DB_NAME} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"

  cat > "$APP_ROOT/.db_credentials" <<EOF2
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_DATABASE=${DB_NAME}
MYSQL_LOGIN_MODE=$(grep '^MYSQL_LOGIN_MODE=' "$MYSQL_RUNTIME_FILE" | cut -d= -f2-)
EOF2
  chmod 600 "$APP_ROOT/.db_credentials"

  log_success "MySQL 基础配置完成（应用将直接使用 root 账号）"
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
  npm run build || log_warn "TypeScript 构建失败，稍后将直接用 ts-node 运行"
}

patch_runtime_defaults() {
  log_info "写入运行时修复补丁..."

  # 1) 数据库初始化：启动时自动建表，而不是只测连通性
  cat > "$APP_DIR/src/database/index.ts" <<'EOF2'
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'video_generator',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });
  }
  return pool;
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .replace(/\r/g, '\n')
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith('--'));
}

export async function initDatabase(): Promise<void> {
  const p = getPool();
  await p.query('SELECT 1');

  const schemaPath = path.resolve(process.cwd(), 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn(`[Database] schema.sql 不存在，跳过建表: ${schemaPath}`);
    return;
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8')
    .replace(/CREATE DATABASE IF NOT EXISTS\s+`?video_generator`?.*?;/i, '')
    .replace(/USE\s+`?video_generator`?\s*;/i, '');

  const statements = splitSqlStatements(schema);
  for (const statement of statements) {
    await p.query(statement);
  }
  console.log('[Database] schema.sql 已自动执行');
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
EOF2

  # 2) 智能分句默认关闭 AI，避免火山引擎 AI/Ark 无 key 或响应慢时卡在 30%
  python3 - <<'EOF2'
from pathlib import Path
p = Path('/opt/video-demo/nodejs/src/services/VideoProcessor.ts')
text = p.read_text(encoding='utf-8')
old = "const useAI = options.useAI !== false;"
new = "const useAI = options.useAI === true; // 修复：默认关闭 AI 分句，显式传 true 才调用火山引擎 AI"
if old in text:
    text = text.replace(old, new, 1)
    p.write_text(text, encoding='utf-8')
EOF2
}

setup_env() {
  log_info "生成 .env ..."

  # shellcheck disable=SC1090
  . "$MYSQL_RUNTIME_FILE"
  local mysql_password_line=""
  if [ "$MYSQL_LOGIN_MODE" = "password" ]; then
    mysql_password_line="MYSQL_PASSWORD=${MYSQL_ROOT_PASSWORD}"
  else
    mysql_password_line="MYSQL_PASSWORD="
  fi

  local api_secret
  api_secret=$(openssl rand -hex 32)

  cat > "$APP_DIR/.env" <<EOF2
# ============================================
# 火山引擎 ASR 配置（必填）
# ============================================
VOLCENGINE_APP_ID=
VOLCENGINE_ACCESS_TOKEN=

# ============================================
# 火山引擎 AI / Ark 配置（可选）
# 不填则默认不启用 AI 分句
# ============================================
VOLCENGINE_AI_API_KEY=

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
# MySQL 数据库配置（统一使用 root）
# ============================================
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
${mysql_password_line}
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
EOF2

  chmod 600 "$APP_DIR/.env"
  log_success ".env 已生成"
}

init_database() {
  log_info "执行 schema.sql，初始化数据库表..."
  cd "$APP_DIR"

  if [ ! -f schema.sql ]; then
    log_error "未找到 schema.sql"
    exit 1
  fi

  mysql_import_file "$APP_DIR/schema.sql"

  # 再次验证核心表
  if [ -f "$MYSQL_CONF_FILE" ]; then
    mysql --defaults-extra-file="$MYSQL_CONF_FILE" -D "$DB_NAME" -N -B -e "SHOW TABLES LIKE 'video_tasks';" | grep -q '^video_tasks$'
  fi

  log_success "数据库建表完成"
}

setup_pm2() {
  log_info "配置 PM2..."
  cd "$APP_DIR"

  cat > ecosystem.config.js <<'EOF2'
module.exports = {
  apps: [
    {
      name: 'video-server',
      cwd: '/opt/video-demo/nodejs',
      script: 'npm',
      args: 'run server',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/video-demo/server-error.log',
      out_file: '/var/log/video-demo/server-out.log',
      log_file: '/var/log/video-demo/server-combined.log',
      time: true,
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G'
    },
    {
      name: 'video-worker',
      cwd: '/opt/video-demo/nodejs',
      script: 'npm',
      args: 'run worker -- --concurrency 2',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/video-demo/worker-error.log',
      out_file: '/var/log/video-demo/worker-out.log',
      log_file: '/var/log/video-demo/worker-combined.log',
      time: true,
      instances: 1,
      autorestart: true,
      max_memory_restart: '4G'
    }
  ]
}
EOF2

  pm2 delete video-server video-worker >/dev/null 2>&1 || true
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
  log_success "PM2 已启动"
}

setup_nginx() {
  log_info "配置 Nginx..."

  rm -f /etc/nginx/sites-enabled/default

  cat > /etc/nginx/sites-available/video-demo <<'EOF2'
server {
    listen 80 default_server;
    server_name _;

    access_log /var/log/video-demo/nginx-access.log;
    error_log  /var/log/video-demo/nginx-error.log;

    client_max_body_size 500M;

    # API
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

    # 健康检查
    location = /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 任务输出与静态资源
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

    # 根路径给出可见响应，避免 404/空白页
    location = / {
        default_type text/plain;
        return 200 "React-Video API is running\nhealth: /health\napi: /api/\n";
    }
}
EOF2

  # 修复 map 指令位置：放到 nginx.conf 的 http 段中更稳妥
  if ! grep -q 'connection_upgrade' /etc/nginx/nginx.conf; then
    python3 - <<'EOF2'
from pathlib import Path
p = Path('/etc/nginx/nginx.conf')
text = p.read_text(encoding='utf-8')
needle = 'http {'
insert = "http {\n    map $http_upgrade $connection_upgrade {\n        default upgrade;\n        '' close;\n    }\n"
if needle in text and 'map $http_upgrade $connection_upgrade' not in text:
    text = text.replace(needle, insert, 1)
    p.write_text(text, encoding='utf-8')
EOF2
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
  sleep 3
  curl -fsS "http://127.0.0.1:${APP_PORT}/health" >/dev/null
  mysql --defaults-extra-file="$MYSQL_CONF_FILE" -D "$DB_NAME" -N -B -e "SELECT COUNT(*) FROM video_tasks;" >/dev/null
  redis-cli ping | grep -q PONG
  log_success "健康检查通过"
}

create_report() {
  local ip
  ip=$(hostname -I | awk '{print $1}')
  cat > "$APP_ROOT/DEPLOYMENT_REPORT.txt" <<EOF2
================================================================================
React-Video 部署报告（修正版）
================================================================================
部署时间：$(date '+%Y-%m-%d %H:%M:%S')
服务器 IP：${ip}

访问地址：
- 健康检查：http://${ip}/health
- API 根路径：http://${ip}/api/

数据库：
- Host: 127.0.0.1
- Port: 3306
- User: root
- Database: ${DB_NAME}
- MySQL 客户端配置文件：${MYSQL_CONF_FILE}

关键修复：
1. 应用数据库用户统一改为 root
2. 部署时执行 schema.sql 自动建表
3. Nginx 移除默认站点并修正反向代理/根路径
4. 默认关闭 AI 分句，避免任务卡在 30% 的“智能分句 & 渲染预准备”阶段

常用命令：
- pm2 status
- pm2 logs video-server
- pm2 logs video-worker
- systemctl status nginx
- systemctl status mysql
- systemctl status redis-server
EOF2
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