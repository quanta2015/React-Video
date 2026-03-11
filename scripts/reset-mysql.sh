#!/bin/bash

#===============================================================================
# MySQL 重置脚本
# 用途：当首次部署失败后，重置 MySQL 配置以便重新运行部署脚本
# 使用方法：sudo ./reset-mysql.sh
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
echo "                      MySQL 重置脚本"
echo "==============================================================================="
echo ""

# 停止 MySQL
log_info "停止 MySQL 服务..."
systemctl stop mysql || true

# 清理数据目录（谨慎操作）
log_warn "即将清理 MySQL 数据..."
read -p "是否继续？这将删除所有 MySQL 数据！(y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    log_info "已取消"
    exit 0
fi

# 备份现有数据（如果存在）
backup_dir="/var/lib/mysql.backup.$(date +%Y%m%d%H%M%S)"
if [ -d /var/lib/mysql ]; then
    log_info "备份现有 MySQL 数据到 $backup_dir..."
    mv /var/lib/mysql "$backup_dir" || {
        log_error "数据备份失败"
        exit 1
    }
fi

# 关键修复：创建 mysql 目录并设置正确的权限
log_info "创建 MySQL 数据目录并设置权限..."
mkdir -p /var/lib/mysql || {
    log_error "无法创建 MySQL 数据目录"
    exit 1
}
chown -R mysql:mysql /var/lib/mysql || {
    log_error "无法设置 MySQL 数据目录权限"
    exit 1
}
chmod 700 /var/lib/mysql || {
    log_error "无法设置 MySQL 数据目录访问权限"
    exit 1
}

# 重新初始化 MySQL
log_info "重新初始化 MySQL..."
mysqld --initialize-insecure --user=mysql || {
    log_error "MySQL 初始化失败"
    exit 1
}

# 启动 MySQL
log_info "启动 MySQL 服务..."
systemctl start mysql || {
    log_error "MySQL 服务启动失败"
    exit 1
}

# 等待 MySQL 完全启动
log_info "等待 MySQL 服务初始化..."
sleep 5

# 验证 MySQL 运行状态
if systemctl is-active --quiet mysql; then
    log_success "MySQL 服务已启动"
else
    log_error "MySQL 服务启动失败，请检查日志: journalctl -u mysql"
    exit 1
fi

# 配置 MySQL（空密码）
log_info "配置 MySQL 数据库和用户..."
mysql -u root -h 127.0.0.1 <<EOF
-- 创建数据库
CREATE DATABASE IF NOT EXISTS video_generator 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建用户（空密码，稍后由部署脚本设置）
CREATE USER IF NOT EXISTS 'video_user'@'localhost' IDENTIFIED BY 'video_password';
GRANT ALL PRIVILEGES ON video_generator.* TO 'video_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 删除部署标记文件
log_info "清理部署标记文件..."
rm -f /opt/video-demo/.mysql_credentials
rm -f /opt/video-demo/.db_initialized

log_success "MySQL 已重置完成！"
echo ""
log_info "现在可以重新运行部署脚本：sudo ./deploy-ubuntu24.sh"
echo ""