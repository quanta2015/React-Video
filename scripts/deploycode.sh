#!/bin/bash

#===============================================================================
# 视频生成项目代码部署脚本
# 用途：仅部署代码（假设系统依赖已安装）
# 使用方法：sudo ./deploycode.sh
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

echo ""
echo "==============================================================================="
echo "                      代码部署脚本"
echo "==============================================================================="
echo ""

# 创建目录
log_info "创建项目目录..."
mkdir -p /opt/video-demo/nodejs
mkdir -p /opt/video-demo/output
mkdir -p /opt/video-demo/public
mkdir -p /var/log/video-demo

cd /opt/video-demo

# 询问 Git 仓库地址
read -p "请输入 Git 仓库地址：" repo_url
if [ -z "$repo_url" ]; then
    log_error "仓库地址不能为空"
    exit 1
fi

# 检查并克隆/更新代码
if [ -d "nodejs/.git" ]; then
    log_info "检测到现有 Git 仓库，更新代码..."
    cd nodejs && git pull || log_warn "git pull 失败，继续执行"
elif [ -d "nodejs" ] && [ "$(ls -A nodejs)" ]; then
    log_warn "nodejs 目录已存在且不为空，跳过克隆"
else
    log_info "克隆代码..."
    if [ -d "nodejs" ]; then
        rm -rf nodejs
    fi
    git clone "$repo_url" nodejs || {
        log_error "克隆失败，请检查仓库地址"
        exit 1
    }
fi

# 检查 nodejs 目录
if [ ! -d "nodejs" ]; then
    log_error "nodejs 目录不存在"
    exit 1
fi

cd /opt/video-demo/nodejs

# 安装依赖
log_info "安装 npm 依赖..."
npm install --legacy-peer-deps

# 构建
log_info "构建 TypeScript..."
npm run build || log_warn "构建失败，但继续执行"

# 生成环境配置
log_info "生成环境配置文件..."

# 读取 MySQL 密码（如果存在）
if [ -f /opt/video-demo/.mysql_credentials ]; then
    MYSQL_PASSWORD=$(grep "MySQL 密码：" /opt/video-demo/.mysql_credentials | cut -d' ' -f3)
else
    MYSQL_PASSWORD="video_password"
fi

# 生成随机 API Secret
API_SECRET=$(openssl rand -hex 32)

cat > .env <<EOF
# ============================================
# 火山引擎 ASR 配置
# ============================================
VOLCENGINE_APP_ID=your_app_id
VOLCENGINE_ACCESS_TOKEN=your_access_token
VOLCENGINE_AI_API_KEY=your_api_key

# ============================================
# 阿里云 OSS 配置
# ============================================
ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
ALIYUN_OSS_BUCKET=your_bucket_name
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_PREFIX=video-results

# ============================================
# MySQL 数据库配置
# ============================================
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=video_user
MYSQL_PASSWORD=${MYSQL_PASSWORD}
MYSQL_DATABASE=video_generator

# ============================================
# Redis 配置
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ============================================
# API 密钥配置
# ============================================
API_SECRET=${API_SECRET}

# ============================================
# 服务器配置
# ============================================
PORT=3000
NODE_ENV=production
EOF

chmod 600 .env
log_success "环境配置文件已生成"

# 初始化数据库（如果未初始化）
log_info "初始化数据库..."
if [ -f /opt/video-demo/.db_initialized ]; then
    log_warn "数据库已初始化，跳过"
elif [ -f schema.sql ]; then
    if mysql -u video_user -p"${MYSQL_PASSWORD}" video_generator -e "SELECT 1 FROM video_tasks LIMIT 1" 2>/dev/null; then
        log_warn "数据库表已存在，跳过初始化"
        touch /opt/video-demo/.db_initialized
    elif mysql -u video_user -p"${MYSQL_PASSWORD}" video_generator < schema.sql 2>/dev/null; then
        touch /opt/video-demo/.db_initialized
        log_success "数据库初始化完成"
    else
        log_warn "数据库初始化失败，请手动执行：mysql -u video_user -p video_generator < schema.sql"
    fi
fi

# 配置 PM2
log_info "配置 PM2..."

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'video-server',
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
      script: 'npm',
      args: 'run worker --concurrency 2',
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
};
EOF

# 启动服务
log_info "启动服务..."
pm2 start ecosystem.config.js
pm2 save

# 配置开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true

log_success "PM2 服务已启动"

echo ""
echo "==============================================================================="
log_success "代码部署完成！"
echo "==============================================================================="
echo ""
echo "下一步操作："
echo "1. 编辑 /opt/video-demo/nodejs/.env 文件，填入正确的 API 密钥"
echo "2. 测试 API: curl http://localhost:3000/health"
echo "3. 查看日志：pm2 logs"
echo ""
