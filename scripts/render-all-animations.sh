#!/bin/bash

# 渲染所有 39 种动画特效为一个视频文件
# 输出文件：output/all-animations-demo.mp4

set -e

cd "$(dirname "$0")/.."

echo "🎬 开始渲染所有动画特效..."
echo "📁 输出文件：output/all-animations-demo.mp4"
echo "⏱️  总时长：39 种动画 × 3 秒 = 117 秒（约 2 分钟）"

# 创建输出目录（如果不存在）
mkdir -p output

# 执行渲染
npx remotion render src/remotion/index.ts AllAnimationsPreview output/all-animations-demo.mp4

echo ""
echo "✅ 渲染完成！"
echo "📁 输出文件：$(pwd)/output/all-animations-demo.mp4"
