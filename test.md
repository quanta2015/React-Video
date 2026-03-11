# AI 智能分句功能 - 直接调用火山引擎大模型 API 范例

## 功能说明

AI 智能分句功能基于火山引擎 AI API（DeepSeek-V3 模型），能够根据语义自动将长文本拆分成适合短视频展示的短句，并支持关键词高亮。

### API 配置

| 配置项       | 值                                         |
| ------------ | ------------------------------------------ |
| **Base URL** | `https://ark.cn-beijing.volces.com/api/v3` |
| **Model**    | `deepseek-v3-2-251201`                     |
| **认证方式** | Bearer Token (API Key)                     |

### 核心特性

- **标点主导，短句优先**：确保观众一口气读完一个完整意群
- **视觉字符限制**：每行严格 ≤ 8 个视觉字符（1 汉字=1 字，2 英文/数字/空格=1 字）
- **屏幕行数限制**：每个 mainId 最多 3 行，越少越好
- **关键词提取**：自动提取金钱、数字、痛点、动词等刺激转化的词
- **防闪烁兜底**：每屏最后一行至少 4 个视觉字符，防止画面频闪

---

## cURL 调用范例

### 1. 准备环境变量

```bash
# 设置火山引擎 API Key
export VOLCENGINE_AI_API_KEY='your_volcengine_api_key_here'
```

### 2. 构建 Prompt

AI 分句的核心在于 Prompt 设计。以下是完整的 Prompt 模板：

```
# Role:

你是 Alex Hormozi 风格的短视频字幕逻辑专家。你的核心能力是平衡"语义完整性"与"视觉冲击力"。

# 【核心使命】

将文本转化为 JSON 格式字幕，遵循"标点主导，短句优先"的原则，确保观众一口气读完一个完整意群，绝不卡顿。
一个 senseGroups 对应一个意群。
一个 mainId 对应一个屏幕。

# 待处理文本
[你的文本内容]

# 【处理逻辑算法】(请严格按此步骤执行)

**第一步：原子切分 (Atomic Slicing)**
将每个"意群"切分为若干个屏幕和若干个"视觉行" (Line)。

- **字数限制**：每行严格 ≤ 8 个视觉字符。
- **计算规则**：1 汉字 = 1 字，2 英文/数字/空格 = 1 字。

**第二步：屏幕组装 (Screen Assembly)**
根据切分出的行数，决定如何分配 mainId。

- **目标**：尽量让一个"意群"在同一个 mainId 中展示完毕，不同意群不能在同一个 mainId 中展示。
- **上限规则**：每个 mainId 最多 3 行，越少越好。
- **溢出规则**：若一个意群切分后超过 3 行，必须按语义拆分为多个 mainId，并保证每屏都不超过 3 行。

# 【Hormozi 视觉规范】

1. **防闪烁兜底**：
   - 虽然"1 行/屏"优先级最高，但如果该行仅有 1-2 个无意义虚词（如"如果"、"那么"），**必须**将其与后文合并，牺牲"1 行"追求"2 行"，防止画面频闪。
   - **重要规则**：每个意群的最后一行文本必须至少包含 4 个视觉字符，如果少于 4 个字符，必须与前一行合并。

2. **关键词高亮**：
   - 在 JSON 的 keyword 字段中，提取当前行最能刺激转化的词（金钱、数字、痛点、动词）。

# 【输出格式】

纯 JSON 数组，无需 Markdown 包装：

[
{"text": "第一行字幕", "mainId": 1, senseGroups: 1, "keyword": "关键词"},
{"text": "第二行字幕", "mainId": 1, senseGroups: 1, "keyword": ""},
{"text": "新的意群开始", "mainId": 2, senseGroups: 2, "keyword": "意群"},
{"text": "意群太长被拆分", "mainId": 3, senseGroups: 3, "keyword": ""},
{"text": "拆分后的下半部分", "mainId": 3, senseGroups": 3, "keyword": ""}
]
```

### 3. 完整 cURL 命令

```bash
#!/bin/bash

# 设置 API Key
API_KEY='your_volcengine_api_key_here'

# 待处理的文本（按标点符号拆分成意群）
TEXT='[{"text": "朋友们，我提出了 AI 时代伟大愿景", "senseGroups": 1}, {"text": "Idea to money OS，想法到钱操作系统", "senseGroups": 2}, {"text": "为此我们设计了 AI 时代人人都需要的资产", "senseGroups": 3}, {"text": "图灵 AI 身份 ID，专属每一位创造者", "senseGroups": 4}]'

# 构建 Prompt
PROMPT=$(cat <<'EOF'
# Role:

你是 Alex Hormozi 风格的短视频字幕逻辑专家。你的核心能力是平衡"语义完整性"与"视觉冲击力"。

# 【核心使命】

将文本转化为 JSON 格式字幕，遵循"标点主导，短句优先"的原则，确保观众一口气读完一个完整意群，绝不卡顿。
一个 senseGroups 对应一个意群。
一个 mainId 对应一个屏幕。

# 待处理文本
EOF
)
PROMPT="${PROMPT}
${TEXT}

# 【处理逻辑算法】(请严格按此步骤执行)

**第一步：原子切分 (Atomic Slicing)**
将每个"意群"切分为若干个屏幕和若干个"视觉行" (Line)。

- **字数限制**：每行严格 ≤ 8 个视觉字符。
- **计算规则**：1 汉字 = 1 字，2 英文/数字/空格 = 1 字。

**第二步：屏幕组装 (Screen Assembly)**
根据切分出的行数，决定如何分配 mainId。

- **目标**：尽量让一个"意群"在同一个 mainId 中展示完毕，不同意群不能在同一个 mainId 中展示。
- **上限规则**：每个 mainId 最多 3 行，越少越好。
- **溢出规则**：若一个意群切分后超过 3 行，必须按语义拆分为多个 mainId，并保证每屏都不超过 3 行。

# 【Hormozi 视觉规范】

1. **防闪烁兜底**：
   - 虽然"1 行/屏"优先级最高，但如果该行仅有 1-2 个无意义虚词（如"如果"、"那么"），**必须**将其与后文合并，牺牲"1 行"追求"2 行"，防止画面频闪。
   - **重要规则**：每个意群的最后一行文本必须至少包含 4 个视觉字符，如果少于 4 个字符，必须与前一行合并。

2. **关键词高亮**：
   - 在 JSON 的 keyword 字段中，提取当前行最能刺激转化的词（金钱、数字、痛点、动词）。

# 【输出格式】

纯 JSON 数组，无需 Markdown 包装：

[
{"text": "第一行字幕", "mainId": 1, "senseGroups": 1, "keyword": "关键词"},
{"text": "第二行字幕", "mainId": 1, "senseGroups": 1, "keyword": ""}
]
EOF
)

# 发送请求
curl -X POST 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"model\": \"deepseek-v3-2-251201\",
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"${PROMPT//\"/\\\"}\"
      }
    ],
    \"temperature\": 0.1,
    \"max_output_tokens\": 32768,
    \"top_p\": 0.95,
    \"thinking\": {
      \"type\": \"disabled\"
    }
  }"
```

---

## 简化版 cURL 命令（推荐）

```bash
API_KEY='a396a7c4-9928-4195-8120-ec954099d60e'

curl -X POST 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v3-2-251201",
    "messages": [
      {
        "role": "user",
        "content": "# Role:\n\n你是 Alex Hormozi 风格的短视频字幕逻辑专家。\n\n# 待处理文本\n[{\"text\": \"朋友们，我提出了 AI 时代伟大愿景\", \"senseGroups\": 1}, {\"text\": \"Idea to money OS，想法到钱操作系统\", \"senseGroups\": 2}, {\"text\": \"为此我们设计了 AI 时代人人都需要的资产\", \"senseGroups\": 3}, {\"text\": \"图灵 AI 身份 ID，专属每一位创造者\", \"senseGroups\": 4}]\n\n# 要求\n- 每行严格 ≤ 8 个视觉字符（1 汉字=1 字，2 英文/数字/空格=1 字）\n- 每个 mainId 最多 3 行\n- 每个意群的最后一行至少 4 个视觉字符\n- 提取每行的关键词（金钱、数字、痛点、动词）\n\n# 输出格式\n纯 JSON 数组：[{\"text\": \"...\", \"mainId\": 1, \"senseGroups\": 1, \"keyword\": \"...\"}]"
      }
    ],
    "temperature": 0.1,
    "max_output_tokens": 32768,
    "top_p": 0.95
  }'
```

---

## 响应示例

```json
{
  "id": "chat-2026031112345678",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "[\n  {\"text\": \"朋友们\", \"mainId\": 1, \"senseGroups\": 1, \"keyword\": \"\"},\n  {\"text\": \"我提出了\", \"mainId\": 1, \"senseGroups\": 1, \"keyword\": \"提出\"},\n  {\"text\": \"AI 时代\", \"mainId\": 1, \"senseGroups\": 1, \"keyword\": \"AI 时代\"},\n  {\"text\": \"伟大愿景\", \"mainId\": 1, \"senseGroups\": 1, \"keyword\": \"伟大愿景\"},\n  {\"text\": \"Idea to\", \"mainId\": 2, \"senseGroups\": 2, \"keyword\": \"Idea\"},\n  {\"text\": \"money OS\", \"mainId\": 2, \"senseGroups\": 2, \"keyword\": \"money\"},\n  {\"text\": \"想法到钱\", \"mainId\": 2, \"senseGroups\": 2, \"keyword\": \"钱\"},\n  {\"text\": \"操作系统\", \"mainId\": 2, \"senseGroups\": 2, \"keyword\": \"系统\"},\n  {\"text\": \"为此我们\", \"mainId\": 3, \"senseGroups\": 3, \"keyword\": \"\"},\n  {\"text\": \"设计了\", \"mainId\": 3, \"senseGroups\": 3, \"keyword\": \"设计\"},\n  {\"text\": \"AI 时代\", \"mainId\": 3, \"senseGroups\": 3, \"keyword\": \"AI\"},\n  {\"text\": \"人人都需要\", \"mainId\": 3, \"senseGroups\": 3, \"keyword\": \"需要\"},\n  {\"text\": \"的资产\", \"mainId\": 3, \"senseGroups\": 3, \"keyword\": \"资产\"},\n  {\"text\": \"图灵 AI\", \"mainId\": 4, \"senseGroups\": 4, \"keyword\": \"图灵 AI\"},\n  {\"text\": \"身份 ID\", \"mainId\": 4, \"senseGroups\": 4, \"keyword\": \"身份\"},\n  {\"text\": \"专属\", \"mainId\": 4, \"senseGroups\": 4, \"keyword\": \"专属\"},\n  {\"text\": \"每一位创造者\", \"mainId\": 4, \"senseGroups\": 4, \"keyword\": \"创造者\"}\n]"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 256,
    "completion_tokens": 512,
    "total_tokens": 768
  }
}
```

---

## 提取 JSON 结果

```bash
# 使用 jq 提取 JSON 结果
curl -s -X POST 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d '{...}' | jq -r '.choices[0].message.content'
```

---

## 参数说明

### 请求参数

| 参数                 | 类型   | 必填 | 说明                                  |
| -------------------- | ------ | ---- | ------------------------------------- |
| `model`              | string | 是   | 模型名称，使用 `deepseek-v3-2-251201` |
| `messages`           | array  | 是   | 对话消息列表                          |
| `messages[].role`    | string | 是   | 角色，使用 `user`                     |
| `messages[].content` | string | 是   | Prompt 内容                           |
| `temperature`        | number | 否   | 温度，建议 0.1（低温度保证稳定输出）  |
| `max_output_tokens`  | number | 否   | 最大输出 token 数，建议 32768         |
| `top_p`              | number | 否   | 核采样参数，建议 0.95                 |
| `thinking.type`      | string | 否   | 思考模式，使用 `disabled`             |

### 输出字段说明

| 字段          | 说明                                    |
| ------------- | --------------------------------------- |
| `text`        | 分句后的文本内容                        |
| `mainId`      | 屏幕 ID，相同 mainId 的内容在同一屏显示 |
| `senseGroups` | 意群 ID，标识语义完整的意群             |
| `keyword`     | 关键词，用于高亮显示                    |

---

## 注意事项

1. **API Key 安全**：不要将 API Key 硬编码在代码中，建议使用环境变量
2. **视觉字符计算**：1 汉字 = 1 字，2 英文/数字/空格 = 1 字
3. **温度设置**：使用 0.1 低温度保证输出稳定性
4. **JSON 解析**：AI 返回的内容可能包含 Markdown 代码块，需要提取纯 JSON
5. **错误处理**：建议添加重试机制处理网络错误

---

## 完整脚本示例

````bash
#!/bin/bash

# 火山引擎 AI 分句脚本

API_KEY="${VOLCENGINE_AI_API_KEY:-your_api_key}"
INPUT_TEXT='[{"text": "朋友们，我提出了 AI 时代伟大愿景", "senseGroups": 1}, {"text": "Idea to money OS，想法到钱操作系统", "senseGroups": 2}]'

RESPONSE=$(curl -s -X POST 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' \
  -H "Authorization: Bearer ${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"model\": \"deepseek-v3-2-251201\",
    \"messages\": [{
      \"role\": \"user\",
      \"content\": \"# Role: 字幕分句专家\\n\\n# 待处理文本\\n${INPUT_TEXT}\\n\\n# 要求\\n- 每行≤8 个视觉字符\\n- 每屏最多 3 行\\n- 每屏最后一行至少 4 个字符\\n- 提取关键词\\n\\n# 输出\\n纯 JSON 数组\"
    }],
    \"temperature\": 0.1,
    \"max_output_tokens\": 32768
  }")

# 提取并解析 JSON 结果
RESULT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content' | sed 's/```json//g' | sed 's/```//g')

echo "AI 分句结果:"
echo "$RESULT" | jq .
````
