#!/bin/bash

# ============================================
# 使用静态字幕运行视频渲染脚本
# ============================================
# 使用方法:
#   ./run-with-static-subtitle.sh <template> <video-url> <subtitle-file>
#
# 示例:
#   ./run-with-static-subtitle.sh t1 https://example.com/video.mp4 ./subtitle_split_example.json
# ============================================

TEMPLATE=${1:-t1}
VIDEO_URL=${2:-"https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4"}
SUBTITLE_FILE=${3:-"./subtitle_split_example.json"}
TITLE=${4:-"静态字幕测试"}
SPEAKER=${5:-"测试演讲者"}

echo "============================================"
echo "使用静态字幕渲染视频"
echo "============================================"
echo "模板：$TEMPLATE"
echo "视频：$VIDEO_URL"
echo "字幕：$SUBTITLE_FILE"
echo "标题：$TITLE"
echo "演讲者：$SPEAKER"
echo "============================================"

cd "$(dirname "$0")/.."

npx ts-node src/index.ts \
  --video-url "$VIDEO_URL" \
  --template "$TEMPLATE" \
  --title "$TITLE" \
  --speaker "$SPEAKER" \
  --split-subtitle "$SUBTITLE_FILE"

echo "============================================"
echo "渲染完成"
echo "============================================"
