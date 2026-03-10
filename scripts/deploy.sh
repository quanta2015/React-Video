#!/bin/bash

#===============================================================================
# 视频生成项目一键部署脚本
# 适用系统：Ubuntu 24.04 LTS
# 使用方法：curl -O https://your-repo/scripts/deploy-ubuntu24.sh && chmod +x deploy-ubuntu24.sh && sudo ./deploy-ubuntu24.sh
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查是否以 root 运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        echo "用法：sudo ./deploy-ubuntu24.sh"
        exit 1
    fi
}

# 检查系统版本
check_system() {
    if [ ! -f /etc/os-release ]; then
        log_error "无法识别系统版本"
        exit 1
    fi
    
    source /etc/os-release
    if [ "$ID" != "ubuntu" ]; then
        log_warn "此脚本为 Ubuntu 24.04 设计，当前系统：$PRETTY_NAME"
        read -p "是否继续？(y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            exit 1
        fi
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建项目目录..."
    mkdir -p /opt/video-demo/nodejs
    mkdir -p /opt/video-demo/output
    mkdir -p /opt/video-demo/public
    mkdir -p /var/log/video-demo
}

# 更新系统并安装依赖
install_system_packages() {
    log_info "更新系统软件包..."
    apt-get update
    
    log_info "安装系统依赖..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        curl \
        git \
        wget \
        ffmpeg \
        redis-server \
        mysql-server \
        nginx \
        ufw \
        supervisor \
        build-essential \
        ca-certificates \
        gnupg \
        lsb-release
    
    log_success "系统依赖安装完成"
}

# 安装 Node.js 20 LTS
install_nodejs() {
    log_info "安装 Node.js 20 LTS..."
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_warn "已安装 Node.js: $NODE_VERSION"
        read -p "是否重新安装？(y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            return
        fi
    fi
    
    # 使用 NodeSource 安装
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # 安装 PM2
    npm install -g pm2
    
    log_success "Node.js $(node -v) 和 npm $(npm -v) 安装完成"
}

# 配置并启动 Redis
setup_redis() {
    log_info "配置 Redis..."
    
    systemctl enable redis-server
    systemctl start redis-server
    
    # 验证 Redis
    if redis-cli ping | grep -q "PONG"; then
        log_success "Redis 启动成功"
    else
        log_error "Redis 启动失败"
        exit 1
    fi
}

# 配置并启动 MySQL
setup_mysql() {
    log_info "配置 MySQL..."
    
    systemctl enable mysql
    systemctl start mysql
    
    # 检查是否已配置（支持重复执行）
    if [ -f /opt/video-demo/.mysql_credentials ]; then
        log_warn "检测到 MySQL 已配置，跳过初始化"
        return 0
    fi
    
    # 生成随机密码
    MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
    MYSQL_USER_PASSWORD=$(openssl rand -base64 16)
    
    # 配置 MySQL（使用空密码登录，因为首次安装）
    if mysql -u root -e "SELECT 1" 2>/dev/null; then
        # 可以无密码登录，执行初始化
        mysql -u root <<MYSQL_EOF
-- 设置 root 密码（如果未设置）
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';
FLUSH PRIVILEGES;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS video_generator
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'video_user'@'localhost' IDENTIFIED BY '${MYSQL_USER_PASSWORD}';
GRANT ALL PRIVILEGES ON video_generator.* TO 'video_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_EOF
        
        if [ $? -eq 0 ]; then
            # 保存密码到文件
            cat > /opt/video-demo/.mysql_credentials <<CREDS_EOF
MySQL Root 密码：${MYSQL_ROOT_PASSWORD}
MySQL 用户：video_user
MySQL 密码：${MYSQL_USER_PASSWORD}
数据库：video_generator
CREDS_EOF
            chmod 600 /opt/video-demo/.mysql_credentials
            log_success "MySQL 配置完成，密码已保存到 /opt/video-demo/.mysql_credentials"
        else
            log_error "MySQL 初始化失败"
            return 1
        fi
    else
        log_error "MySQL 初始化失败，可能已配置过密码"
        log_info "如需重置，请执行：sudo ./reset-mysql.sh"
        return 1
    fi
}

# 克隆或更新项目代码
setup_code() {
    log_info "部署项目代码..."
    
    cd /opt/video-demo
    
    # 询问是否使用 Git 仓库
    read -p "是否从 Git 仓库克隆代码？(Y/n): " use_git
    if [ "$use_git" != "n" ] && [ "$use_git" != "N" ]; then
        read -p "请输入 Git 仓库地址：" repo_url
        if [ -n "$repo_url" ]; then
            # 检查是否已经是 git 仓库
            if [ -d "nodejs/.git" ]; then
                log_info "检测到现有 Git 仓库，更新代码..."
                cd nodejs && git pull || log_warn "git pull 失败，继续执行"
            elif [ -d ".git" ]; then
                # 当前目录是 git 仓库，检查 remote
                current_remote=$(git remote get-url origin 2>/dev/null || echo "")
                if [ "$current_remote" = "$repo_url" ]; then
                    log_info "检测到现有 Git 仓库，更新代码..."
                    git pull || log_warn "git pull 失败，继续执行"
                else
                    log_warn "当前目录已存在 Git 仓库，但 remote 不匹配"
                    log_info "跳过克隆，继续执行后续步骤..."
                fi
            elif [ -d "nodejs" ] && [ "$(ls -A nodejs)" ]; then
                log_warn "nodejs 目录已存在且不为空，跳过克隆"
                log_info "继续安装依赖..."
            else
                # 目录为空或不存在，可以克隆
                if [ -d "nodejs" ]; then
                    rmdir nodejs 2>/dev/null || true
                fi
                log_info "克隆代码..."
                git clone "$repo_url" nodejs || {
                    log_error "克隆失败，请检查仓库地址"
                    return 1
                }
            fi
        fi
    fi
    
    # 检查 nodejs 目录是否存在
    if [ ! -d "nodejs" ]; then
        log_error "nodejs 目录不存在，请检查是否克隆成功"
        return 1
    fi
    
    # 安装 npm 依赖
    cd /opt/video-demo/nodejs
    log_info "安装 npm 依赖..."
    npm install
    
    # 构建 TypeScript
    log_info "构建 TypeScript..."
    npm run build || log_warn "构建失败，但继续执行"
}

# 生成环境配置文件
setup_env() {
    log_info "生成环境配置文件..."
    
    cd /opt/video-demo/nodejs
    
    # 生成随机 API Secret
    API_SECRET=$(openssl rand -hex 32)
    
    # 读取 MySQL 密码
    if [ -f /opt/video-demo/.mysql_credentials ]; then
        MYSQL_PASSWORD=$(grep "MySQL 密码：" /opt/video-demo/.mysql_credentials | cut -d' ' -f3)
    else
        MYSQL_PASSWORD="video_password"
    fi
    
    # 创建 .env 文件
    cat > .env <<EOF
# ============================================
# 火山引擎 ASR 配置
# 获取方式：https://console.volcengine.com/speech
# ============================================
VOLCENGINE_APP_ID=your_app_id
VOLCENGINE_ACCESS_TOKEN=your_access_token
VOLCENGINE_AI_API_KEY=your_api_key

# ============================================
# 阿里云 OSS 配置
# 获取方式：https://oss.console.aliyun.com
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
# API 密钥配置（用于接口鉴权）
# ============================================
API_SECRET=${API_SECRET}

# ============================================
# 服务器配置
# ============================================
PORT=3000
NODE_ENV=production
EOF
    
    chmod 600 .env
    log_success "环境配置文件已生成，请编辑 .env 文件填入正确的密钥"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    cd /opt/video-demo/nodejs
    
    # 检查数据库是否已初始化
    if [ -f /opt/video-demo/.db_initialized ]; then
        log_warn "数据库已初始化，跳过"
        return 0
    fi
    
    if [ -f schema.sql ]; then
        # 读取 MySQL 密码
        if [ -f /opt/video-demo/.mysql_credentials ]; then
            MYSQL_PASSWORD=$(grep "MySQL 密码：" /opt/video-demo/.mysql_credentials | cut -d' ' -f3)
        else
            log_warn "MySQL 凭证不存在，使用默认密码"
            MYSQL_PASSWORD="video_password"
        fi
        
        # 检查数据库是否已存在表
        if mysql -u video_user -p"${MYSQL_PASSWORD}" video_generator -e "SELECT 1 FROM video_tasks LIMIT 1" 2>/dev/null; then
            log_warn "数据库表已存在，跳过初始化"
            touch /opt/video-demo/.db_initialized
            return 0
        fi
        
        if mysql -u video_user -p"${MYSQL_PASSWORD}" video_generator < schema.sql 2>/dev/null; then
            touch /opt/video-demo/.db_initialized
            log_success "数据库初始化完成"
        else
            log_warn "数据库初始化失败，请检查 MySQL 配置"
        fi
    else
        log_warn "schema.sql 不存在，跳过数据库初始化"
    fi
}

# 配置 PM2
setup_pm2() {
    log_info "配置 PM2..."
    
    cd /opt/video-demo/nodejs
    
    # 创建 PM2 配置文件
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
    pm2 startup systemd -u root --hp /root
    log_success "PM2 服务已启动并配置开机自启"
}

# 配置 Nginx
setup_nginx() {
    log_info "配置 Nginx..."
    
    # 备份默认配置
    cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak 2>/dev/null || true
    
    # 创建站点配置
    cat > /etc/nginx/sites-available/video-demo <<'EOF'
server {
    listen 80;
    server_name _;
    
    # 日志配置
    access_log /var/log/video-demo/nginx-access.log;
    error_log /var/log/video-demo/nginx-error.log;
    
    # 客户端最大上传大小
    client_max_body_size 500M;
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # 静态文件（可选）
    location /static/ {
        alias /opt/video-demo/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/video-demo /etc/nginx/sites-enabled/
    
    # 测试并重载
    nginx -t && systemctl reload nginx
    
    log_success "Nginx 配置完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    # 启用 UFW
    ufw --force enable || true
    
    # 允许 SSH
    ufw allow ssh
    
    # 允许 HTTP/HTTPS
    ufw allow http
    ufw allow https
    
    log_success "防火墙配置完成（开放端口：22, 80, 443）"
}

# 创建部署报告
create_report() {
    log_info "生成部署报告..."
    
    cat > /opt/video-demo/DEPLOYMENT_REPORT.txt <<EOF
================================================================================
                        视频生成项目部署报告
================================================================================
部署时间：$(date '+%Y-%m-%d %H:%M:%S')
服务器 IP: $(hostname -I | awk '{print $1}')
系统版本：$(lsb_release -ds)

================================================================================
                              服务状态
================================================================================
$(pm2 status)

================================================================================
                              访问地址
================================================================================
API 地址：http://$(hostname -I | awk '{print $1}')/api/
健康检查：http://$(hostname -I | awk '{print $1}')/health

================================================================================
                              数据库信息
================================================================================
$(cat /opt/video-demo/.mysql_credentials)

================================================================================
                              配置文件
================================================================================
环境配置：/opt/video-demo/nodejs/.env
PM2 配置：/opt/video-demo/nodejs/ecosystem.config.js
Nginx 配置：/etc/nginx/sites-available/video-demo

================================================================================
                              常用命令
================================================================================
查看服务状态：pm2 status
查看服务日志：pm2 logs
重启服务：pm2 restart all
停止服务：pm2 stop all
查看 Nginx 状态：systemctl status nginx
查看 Redis 状态：systemctl status redis-server
查看 MySQL 状态：systemctl status mysql

================================================================================
                              下一步操作
================================================================================
1. 编辑 /opt/video-demo/nodejs/.env 文件，填入正确的密钥：
   - 火山引擎 ASR 配置
   - 阿里云 OSS 配置

2. 测试 API：
   curl http://localhost:3000/health

3. 创建第一个任务：
   curl -X POST http://localhost:3000/api/tasks \\
     -H "Content-Type: application/json" \\
     -d '{"videoUrl": "your_video_url", "options": {"template": "t1"}}'

================================================================================
EOF
    
    log_success "部署报告已保存到 /opt/video-demo/DEPLOYMENT_REPORT.txt"
}

# 主函数
main() {
    echo ""
    echo "==============================================================================="
    echo "           视频生成项目一键部署脚本 (Ubuntu 24.04)"
    echo "==============================================================================="
    echo ""
    
    check_root
    check_system
    
    log_info "开始部署..."
    
    create_directories
    install_system_packages
    install_nodejs
    setup_redis
    setup_mysql
    setup_code
    setup_env
    init_database
    setup_pm2
    setup_nginx
    setup_firewall
    create_report
    
    echo ""
    echo "==============================================================================="
    log_success "部署完成！"
    echo "==============================================================================="
    echo ""
    echo "请查看部署报告：/opt/video-demo/DEPLOYMENT_REPORT.txt"
    echo ""
    echo "重要：请编辑 /opt/video-demo/nodejs/.env 文件，填入正确的 API 密钥！"
    echo ""
}

# 运行主函数
main
