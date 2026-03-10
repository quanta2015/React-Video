npx ts-node src/index.ts generate \
  --video "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4" \
  --no-upload-oss \
  --title "图灵 AI 身份 ID\n每个人的数字财富" \
  --speaker "图灵张教主" \
  --speaker-title "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵 AI 破局俱乐部发起人" \
  --template t1 \
  --split-subtitle "./examples/subtitle_split.json" \
  --output "./output/t1-static.mp4"




npx ts-node src/index.ts generate \
  --video "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4" \
  --no-upload-oss \
  --title "图灵 AI 身份 ID\n每个人的数字财富" \
  --speaker "图灵张教主" \
  --speaker-title "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵 AI 破局俱乐部发起人" \
  --template t1 \
  --split-subtitle "./examples/subtitle_split.json" \
   --pip "http://e.hiphotos.baidu.com/image/pic/item/a1ec08fa513d2697e542494057fbb2fb4316d81e.jpg" "http://g.hiphotos.baidu.com/image/pic/item/55e736d12f2eb938d5277fd5d0628535e5dd6f4a.jpg" "https://flowx-img.oss-cn-beijing.aliyuncs.com/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260210112650_826_938.png" \
  --pip-tags "||||名言,王坚院士" \
  --output "./output/t1-static.mp4"


方面一：AI 分句逻辑优化

文件：src/services/AISentenceSplitter.ts

1. 修改 AI Prompt（第228-235行）
  - 新增规则：每个意群的最后一行文本必须至少包含4个视觉字符
  - 如果少于4个字符，必须与前一行合并
2. 修改尾句优化逻辑（第406-407行）
  - 将判断阈值从 <= 3 改为 < 4
  - 确保视觉长度少于4个字符的尾句会被提前显示

方面二：字幕转场动画策略优化

文件：src/services/SubtitleStyleAssigner.ts

1. 修改短尾句动画策略（第385-390行）
  - 将判断阈值从 sub.text.length < 5 改为 sub.text.length < 4
  - 对于少于4个字符的尾句，强制使用快速动画（如 fadeIn, none 等）
  - 避免使用慢速动画（如 wipeRight, blurIn, typeWriter 等）

效果说明

这两个修改的组合效果：

1. AI 分句时：会尽量避免生成少于4个字符的最后一行
2. 如果仍然存在短尾句：
  - 会提前开始显示，增加实际显示时间
  - 使用快速动画（如淡入），而不是慢速动画（如擦除、打字机效果）
  - 这样即使文本较短，观众也能看清内容

这样就解决了短尾句显示时间过短、看不清楚的问题。





支持的 display 配置选项：

endSec: number - 按秒数指定结束时间
startSec: number - 按秒数指定开始时间
endSubtitleScreen: number - 按字幕屏数指定结束
startSubtitleScreen: number - 按字幕屏数指定开始
endSubtitleGroupId: number - 按字幕组 ID 指定结束
startSubtitleGroupId: number - 按字幕组 ID 指定开始