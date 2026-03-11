#!/bin/bash
# Fix Nginx configuration for video-demo

cat > /etc/nginx/sites-available/video-demo <<'EOF'
server {
    listen 80;
    server_name _;

    # 日志配置
    access_log /var/log/video-demo/nginx-access.log;
    error_log /var/log/video-demo/nginx-error.log;

    # 客户端最大上传大小
    client_max_body_size 500M;

    # API 代理 - 必须放在前面，因为 /api/ 是具体路径
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

    # 默认位置 - 返回 404 或其他处理
    location / {
        return 404 "Video Demo API Server\n";
    }
}
EOF

# 确保符号链接存在
ln -sf /etc/nginx/sites-available/video-demo /etc/nginx/sites-enabled/video-demo

# 移除其他可能冲突的配置
rm -f /etc/nginx/sites-enabled/default

# 创建日志目录
mkdir -p /var/log/video-demo

# 测试并重载
nginx -t && systemctl reload nginx

echo "Nginx 配置已更新！"
echo "测试：curl http://localhost/health"
