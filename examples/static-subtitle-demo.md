# 静态字幕使用范例

本文档基于 `test.md` 中的实际配置，演示如何使用静态字幕执行视频渲染，以及生成视频的位置。

---

## 范例 1：使用分句字幕（跳过 ASR 和分句）

### 步骤 1：准备分句字幕文件

创建 `subtitle_split.json` 文件：

```json
{
  "subtitles": [
    {
      "start": 0,
      "end": 2500,
      "groupStart": 0,
      "groupEnd": 2500,
      "text": "朋友们，我提出了 AI 时代伟大愿景",
      "groupId": 0,
      "position": 0,
      "totalInGroup": 1
    },
    {
      "start": 2500,
      "end": 5000,
      "groupStart": 2500,
      "groupEnd": 5000,
      "text": "Idea to money OS，想法到钱操作系统",
      "groupId": 1,
      "position": 0,
      "totalInGroup": 1
    },
    {
      "start": 5000,
      "end": 8000,
      "groupStart": 5000,
      "groupEnd": 8000,
      "text": "为此我们设计了 AI 时代人人都需要的资产",
      "groupId": 2,
      "position": 0,
      "totalInGroup": 1
    },
    {
      "start": 8000,
      "end": 10000,
      "groupStart": 8000,
      "groupEnd": 10000,
      "text": "图灵 AI 身份 ID，专属每一位创造者",
      "groupId": 3,
      "position": 0,
      "totalInGroup": 1
    }
  ]
}
```

### 步骤 2：执行命令

```bash
cd /Users/quanta/Downloads/demo/video-demo/nodejs

npx ts-node src/index.ts generate \
  --video "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4" \
  --no-upload-oss \
  --title "图灵 AI 身份 ID\n每个人的数字财富" \
  --speaker "图灵张教主" \
  --speaker-title "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵 AI 破局俱乐部发起人" \
  --template t1 \
  --split-subtitle "./examples/subtitle_split_example.json" \
  --output "./output/t1-static.mp4"
```

### 步骤 3：查看生成的视频

**生成位置**：`/Users/quanta/Downloads/demo/video-demo/nodejs/output/t1-static.mp4`

---

## 范例 2：使用原始字幕（跳过 ASR，保留智能分句）

### 步骤 1：准备原始字幕文件

创建 `subtitle_raw.json` 文件：

```json
{
  "subtitles": [
    {
      "start": 0,
      "end": 1000,
      "text": "朋友们",
      "words": [
        { "text": "朋", "start": 0, "end": 500 },
        { "text": "友", "start": 500, "end": 750 },
        { "text": "们", "start": 750, "end": 1000 }
      ]
    },
    {
      "start": 1000,
      "end": 2000,
      "text": "我提出了",
      "words": [
        { "text": "我", "start": 1000, "end": 1300 },
        { "text": "提", "start": 1300, "end": 1600 },
        { "text": "出", "start": 1600, "end": 1800 },
        { "text": "了", "start": 1800, "end": 2000 }
      ]
    },
    {
      "start": 2000,
      "end": 3500,
      "text": "AI 时代伟大愿景",
      "words": [
        { "text": "AI", "start": 2000, "end": 2400 },
        { "text": "时", "start": 2400, "end": 2700 },
        { "text": "代", "start": 2700, "end": 3000 },
        { "text": "伟", "start": 3000, "end": 3200 },
        { "text": "大", "start": 3200, "end": 3400 },
        { "text": "愿", "start": 3400, "end": 3500 },
        { "text": "景", "start": 3500, "end": 3700 }
      ]
    }
  ],
  "text": "朋友们我提出了 AI 时代伟大愿景",
  "duration": 3.7
}
```

### 步骤 2：执行命令

```bash
cd /Users/quanta/Downloads/demo/video-demo/nodejs

npx ts-node src/index.ts generate \
  --video "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4" \
  --no-upload-oss \
  --title "图灵 AI 身份 ID\n每个人的数字财富" \
  --speaker "图灵张教主" \
  --speaker-title "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵 AI 破局俱乐部发起人" \
  --template t1 \
  --subtitle "./examples/subtitle_raw.json" \
  --original-text "朋友们，我提出了 AI 时代伟大愿景，Idea to money OS，想法到钱操作系统。为此我们设计了 AI 时代人人都需要的资产，图灵 AI 身份 ID。" \
  --output "./output/t1-raw-subtitle.mp4"
```

### 步骤 3：查看生成的视频

**生成位置**：`/Users/quanta/Downloads/demo/video-demo/nodejs/output/t1-raw-subtitle.mp4`

---

## 范例 3：完整配置（带画中画和背景音乐）

### 步骤 1：准备分句字幕文件

```json
{
  "subtitles": [
    {
      "start": 0,
      "end": 3000,
      "groupStart": 0,
      "groupEnd": 3000,
      "text": "创业一次，你就已经悄悄跟普通人拉开差距了",
      "groupId": 0,
      "position": 0,
      "totalInGroup": 1
    },
    {
      "start": 3000,
      "end": 6000,
      "groupStart": 3000,
      "groupEnd": 6000,
      "text": "不是因为赚了多少钱",
      "groupId": 1,
      "position": 0,
      "totalInGroup": 1
    },
    {
      "start": 6000,
      "end": 9000,
      "groupStart": 6000,
      "groupEnd": 9000,
      "text": "而是你正在做一件普通人几年甚至一辈子都难碰一次的事",
      "groupId": 2,
      "position": 0,
      "totalInGroup": 1
    },
    {
      "start": 9000,
      "end": 12000,
      "groupStart": 9000,
      "groupEnd": 12000,
      "text": "短时间逼自己突破所有边界",
      "groupId": 3,
      "position": 0,
      "totalInGroup": 1
    }
  ]
}
```

### 步骤 2：执行命令

```bash
cd /Users/quanta/Downloads/demo/video-demo/nodejs

npx ts-node src/index.ts generate \
  --video "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/video/20260206/202602061149141974c2015.MP4" \
  --no-upload-oss \
  --template "t8" \
  --title $'只要迈出第一步\n你就成功了一半' \
  --speaker "图灵张教主" \
  --speaker-title $'图灵 Ai 创始人\n北大畅销书作家\n上市公司增长顾问' \
  --avatar "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/images/20260206/20260206114916032335365.jpg" \
  --bgm-url "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/file/20260301/20260301190452a20de9134.MP3" \
  --split-subtitle "./examples/subtitle_split.json" \
  --pip \
    "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152948c3ad53452.mp4" \
    "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152857e676d9869.mp4" \
  --output "./output/t8-static.mp4"
```

### 步骤 3：查看生成的视频

**生成位置**：`/Users/quanta/Downloads/demo/video-demo/nodejs/output/t8-static.mp4`

---

## 输出位置说明

### 本地输出（`--no-upload-oss`）

当使用 `--no-upload-oss` 参数时，生成的视频保存在：

```
/Users/quanta/Downloads/demo/video-demo/nodejs/output/<自定义文件名>.mp4
```

如果不指定 `--output` 参数，默认输出路径为：

```
/Users/quanta/Downloads/demo/video-demo/nodejs/output/final.mp4
```

### OSS 输出（默认上传）

如果不使用 `--no-upload-oss` 参数（默认行为），视频会上传到阿里云 OSS，输出地址类似：

```
https://flowx-img.oss-cn-beijing.aliyuncs.com/video-results/2026/03/09/<taskId>.mp4
```

OSS 路径由以下配置决定（见 [`.env`](../.env)）：

```
ALIYUN_OSS_BUCKET=your_bucket_name
ALIYUN_OSS_PREFIX=video-results
```

---

## 快速测试脚本

使用提供的快速测试脚本：

```bash
cd /Users/quanta/Downloads/demo/video-demo/nodejs/examples

# 使用示例分句字幕运行
./run-with-static-subtitle.sh t1 \
  "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4" \
  "./subtitle_split_example.json" \
  "静态字幕测试" \
  "测试演讲者"

# 生成的视频位置：
# /Users/quanta/Downloads/demo/video-demo/nodejs/output/final.mp4
```

---

## 字幕文件格式参考

### 分句字幕格式 (`subtitle_split.json`)

```json
{
  "subtitles": [
    {
      "start": 0, // 开始时间（毫秒）
      "end": 3000, // 结束时间（毫秒）
      "groupStart": 0, // 所属组开始时间
      "groupEnd": 3000, // 所属组结束时间
      "text": "字幕文本", // 中文字幕
      "enText": "English", // 英文字幕（可选）
      "groupId": 0, // 组 ID
      "position": 0, // 在组中的位置
      "totalInGroup": 1 // 组内总句数
    }
  ]
}
```

### 原始字幕格式 (`subtitle_raw.json`)

```json
{
  "subtitles": [
    {
      "start": 0, // 开始时间（毫秒）
      "end": 1500, // 结束时间（毫秒）
      "text": "字幕", // 字幕文本
      "words": [
        // 单词级别时间戳（可选）
        { "text": "字", "start": 0, "end": 750 },
        { "text": "幕", "start": 750, "end": 1500 }
      ]
    }
  ],
  "text": "字幕文本全文", // 完整文本
  "duration": 1.5 // 总时长（秒）
}
```

---

## 常见问题

### Q: 生成的视频在哪里？

**A:** 取决于是否使用 `--no-upload-oss` 参数：

- **本地保存**：`nodejs/output/` 目录下
- **OSS 保存**：阿里云 OSS bucket 中，地址在命令行输出中显示

### Q: 如何指定输出路径？

**A:** 使用 `--output` 参数：

```bash
--output "./output/my-video.mp4"
```

### Q: 字幕时间单位是什么？

**A:** 所有时间字段都是**毫秒**（ms）

### Q: 如何跳过 OSS 上传？

**A:** 添加 `--no-upload-oss` 参数
