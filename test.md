npx ts-node src/index.ts generate \
 --video "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4" \
 --no-upload-oss \
 --title "图灵AI身份ID\n每个人的数字财富" \
 --speaker "图灵张教主" \
 --speaker-title "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵AI破局俱乐部发起人" \
 --bgm-url "https://flowx-img.oss-cn-beijing.aliyuncs.com/bgm.mp3" \
 --original-text "朋友们，我提出了 AI 时代伟大愿景，Idea to money OS，想法到钱操作系统。为此我们设计了 AI 时代人人都需要的资产，图灵 AI 身份ID。专属每一位创造者。正如王坚院士所言，算力革命能实现一度电创造十度电的价值。而图灵 AI 从不是替代人类。而是用 AI 放大你的创造力。以 Idea to Money OS 为核心，你只需一个想法，所有繁琐流程全由 AI 搞定，直达财富结果。全链路商业 Agent 塔，搭配三大 AI 克隆，轻松策划、推广、成交。初始发行1万枚专属 ID，由100位创始会员推动。邀请制加积分激励，藏着 AI 时代全新红利。记住口号，人类负责创造真正价值，其他的交给你的图灵 AI 分身。如何拿到专属ID，抢占先机？评论区扣入局，我悄悄告诉你答案。" \
 --template t1 \
 --pip "http://e.hiphotos.baidu.com/image/pic/item/a1ec08fa513d2697e542494057fbb2fb4316d81e.jpg" "http://g.hiphotos.baidu.com/image/pic/item/55e736d12f2eb938d5277fd5d0628535e5dd6f4a.jpg" "https://flowx-img.oss-cn-beijing.aliyuncs.com/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260210112650_826_938.png" \
 --pip-tags "||||名言,王坚院士" \
 --output ./output/final.mp4

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4",
    "callbackUrl": "https://example.com/callback",
    "priority": 10,
    "options": {
      "template": "t1",
      "title": "图灵AI身份ID\n每个人的数字财富",
      "speaker": "图灵张教主",
      "speakerTitle": "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵AI破局俱乐部发起人",
      "bgmUrl": "https://flowx-img.oss-cn-beijing.aliyuncs.com/bgm.mp3",
      "pip": [
        "https://flowx-img.oss-cn-beijing.aliyuncs.com/image1.png",
        { "url": "https://flowx-img.oss-cn-beijing.aliyuncs.com/image2.jpg", "tags": ["图灵AI身份ID", "卡片样式"] },
        { "url": "https://flowx-img.oss-cn-beijing.aliyuncs.com/image3.png", "tags": ["图灵AI分身", "克隆示意图"] }
      ],
      "originalText": "朋友们，我提出了 AI 时代伟大愿景，Idea to money OS，想法到钱操作系统。为此我们设计了 AI 时代人人都需要的资产，图灵 AI 身份ID。专属每一位创造者。正如王坚院士所言，算力革命能实现一度电创造十度电的价值。而图灵 AI 从不是替代人类。而是用 AI 放大你的创造力。以 Idea to Money OS 为核心，你只需一个想法，所有繁琐流程全由 AI 搞定，直达财富结果。全链路商业 Agent 塔，搭配三大 AI 克隆，轻松策划、推广、成交。初始发行1万枚专属 ID，由100位创始会员推动。邀请制加积分激励，藏着 AI 时代全新红利。记住口号，人类负责创造真正价值，其他的交给你的图灵 AI 分身。如何拿到专属ID，抢占先机？评论区扣入局，我悄悄告诉你答案。"
    }
  }'
```

1 2 3 4 6 7 8 10 12 14 16 17 18 19 22 24 26 27


npx ts-node src/index.ts generate \
  --audio "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b∂2cf0ce6%20%281%29.mp3" \
  --avatar "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvsIh4X_nyenZ1en0X9pXLE6MpN8R8HmIl5A&s" \
  --no-upload-oss \
  --title "图灵AI身份ID\n每个人的数字财富" \
  --speaker "图灵张教主" \
  --speaker-title "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵AI破局俱乐部发起人" \
  --original-text "朋友们，我提出了 AI 时代伟大愿景，Idea to money OS，想法到钱操作系统。为此我们设计了 AI 时代人人都需要的资产，图灵 AI 身份ID。专属每一位创造者。正如王坚院士所言，算力革命能实现一度电创造十度电的价值。而图灵 AI 从不是替代人类。 而是用 AI 放大你的创造力。以 Idea to Money OS 为核心，你只需一个想法，所有繁琐流程全由 AI 搞定，直达财富结果。全链路商业 Agent 塔，搭配三大 AI 克隆，轻松策划、推广、成交。初始发行1万枚专属 ID，由100位创始会员推动。邀请制加积分激励，藏着 AI 时代 全新红利。记住口号，人类负责创造真正价值，其他的交给你的图灵 AI 分身。如何拿到专属ID，抢占先机？评论区扣入局，我悄悄告诉你答案。" \
  --template tx2 \
  --output "./output/tx2.mp4"


API_SECRET='LTAI5tJV7Mwt78YRQRb2XwSo' ./scripts/sign-curl.sh --exec POST http://127.0.0.1:3000/api/tasks '{"videoUrl":"https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4","options":{"template":"t1","title":"图灵AI身份ID\n每个人的数字财富","speaker":"图灵张教主","speakerTitle":"北大畅销书作家\n多家亿级企业增长破局顾问\n图灵AI破局俱乐部发起人","originalText":"朋友们，我提出了 AI 时代伟大愿景，Idea to money OS，想法到钱操作系统。为此我们设计了 AI 时代人人都需要的资产，图灵 AI 身份ID。专属每一位创造者。正如王坚院士所言，算力革命能实现一度电创造十度电的价值。而图灵 AI 从不是替代人类。 而是用 AI 放大你的创造力。以 Idea to Money OS 为核心，你只需一个想法，所有繁琐流程全由 AI 搞定，直达财富结果。全链路商业 Agent 塔，搭配三大 AI 克隆，轻松策划、推广、成交。初始发行1万枚专属 ID，由100位创始会员推动。邀请制加积分激励，藏着 AI 时代 全新红利。记住口号，人类负责创造真正价值，其他的交给你的图灵 AI 分身。如何拿到专属ID，抢占先机？评论区扣入局，我悄悄告诉你答案。","pip":["http://e.hiphotos.baidu.com/image/pic/item/a1ec08fa513d2697e542494057fbb2fb4316d81e.jpg","http://g.hiphotos.baidu.com/image/pic/item/55e736d12f2eb938d5277fd5d0628535e5dd6f4a.jpg","https://flowx-img.oss-cn-beijing.aliyuncs.com/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260210112650_826_938.png"]}}'



API_SECRET='LTAI5tJV7Mwt78YRQRb2XwSo' ./scripts/sign-curl.sh --exec POST http://156.254.6.45:3000/api/tasks '{"videoUrl":"https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/video/20260206/202602061149141974c2015.MP4","options":{"pip": [], "title": "只要迈出第一步\n你就成功了一半", "bgmUrl": "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/file/20260301/20260301190452a20de9134.MP3", "speaker": "图灵张教主", "template": "t8", "avatarUrl": "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/images/20260206/20260206114916032335365.jpg", "originalText": "创业一次，你就已经悄悄跟普通人拉开差距了——不是因为赚了多少钱，而是你正在做一件“普通人几年甚至一辈子都难碰一次”的事：短时间逼自己突破所有边界。\n\n一旦选了创业，你就再也不是“只做一件事的小角色”了：得懂运营、会销售、能管理、善沟通，还得摸透技术逻辑、拿捏人性分寸、扛住人情世故。说白了，创业就是给你开了“强制进化外挂”——先把你所有短板全暴露出来，再逼着你亲手一点点补全。\n\n这个过程疼吗？太疼了：吃不下饭、睡不着觉，身心像被反复拉扯；但熬过去呢？你会在一次次崩溃里，炼出一颗“刀枪不入”的内心。从你扛过那些风雨、见识过刀锋的那一刻起，人生就没什么能吓倒你了。\n\n所以我常说：创业从来不是“赚快钱的机会”，它是一份“不可复制的高价值学历”——成功了，你拿时间自由、财富自由、思维自由；就算失败了，也别沮丧——就当交了学费，换一身“扛事的底气”和“解决问题的能力”。\n\n带着这些东西再回职场、再做生意，你到哪都是“香饽饽”——社会永远高薪抢着要“真正做过决策、扛过责任、干过实战”的人。所以怕什么失败？最该怕的是：你连第一步都没踏出去。只要你敢开始，就已经赢过了99%的普通人。\n\n我是张教主，关注我，2026我们一起用AI破局，一个人顶100人生产力，后续内容中我将持续揭秘新计划！", "speakerTitle": "图灵Ai创始人\n北大畅销书作家\n上市公司增长顾问"}}'

npx ts-node src/index.ts generate \
  --video "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/video/20260130/202601301605598d5480723.mp4" \
  --no-upload-oss \
  --title "人活一世要心怀感恩，懂得感恩，不要把别人的付出，全当做理所当然，懂得感恩是为自己留路，常行善事就是给自己积福#做人不忘恩 #做人 #感恩 #清茶朗读 #抖音小助手" \
  --speaker "范伟" \
  --speaker-title "索能环境 创始人\n大学客座教授\n含山县政府招商顾问\n图灵Ai破局俱乐部联合发起人" \
  --original-text "金句1：别人的付出从来不是理所当然，能被善待是藏在日常里的福分。\n佐证：同事主动帮你分担紧急任务，不是他的职责；朋友深夜陪你解闷，不是他的义务——这些细碎的善意，都是旁人愿意为你多走一步的温暖，该当珍惜。\n\n金句2：滴水之恩需铭记于心，常行善事是给自己积下的福报。\n佐证：韩信早年受漂母一饭之恩，后来封王仍以千金报恩，善念的种子终会开花；生活中有人帮陌生人扶起倒地的自行车，不久后自己忘带钥匙时，也会有邻居主动递来备用钥匙——善意从来不是单向的，藏着彼此的呼应。" \
  --template t1 \
  --pip "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/image/20260301/202603012301564f1d27508.jpg" \
  --output "./output/t1-test.mp4"


{"outputUrl": "https://flowx-img.oss-cn-beijing.aliyuncs.com/video-results/2026/03/02/89d1c032-33dc-4429-9aaf-5a432e3430be.mp4"}


API_SECRET='LTAI5tJV7Mwt78YRQRb2XwSo' ./scripts/sign-curl.sh --exec POST http://156.254.6.45:3000/api/tasks '{"videoUrl":"https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/video/20260206/202602061149141974c2015.MP4","options":{"pip": ["https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152948c3ad53452.mp4"], "title": "只要迈出第一步\n你就成功了一半", "bgmUrl": "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/file/20260301/20260301190452a20de9134.MP3", "speaker": "图灵张教主", "template": "t8", "avatarUrl": "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/images/20260206/20260206114916032335365.jpg", "originalText": "创业一次，你就已经悄悄跟普通人拉开差距了——不是因为赚了多少钱，而是你正在做一件“普通人几年甚至一辈子都难碰一次”的事：短时间逼自己突破所有边界。\n\n一旦选了创业，你就再也不是“只做一件事的小角色”了：得懂运营、会销售、能管理、善沟通 ，还得摸透技术逻辑、拿捏人性分寸、扛住人情世故。说白了，创业就是给你开了“强制进化外挂”——先把你所有短板全暴露出来，再逼着你亲手一点点补全。\n\n这个过程疼吗？太疼了：吃不下饭、睡不着觉，身心像被反复拉扯；但熬过去呢？你会在一次次崩溃里，炼出一颗“刀枪不入”的内心。从你扛过那些风雨、见识过刀锋的那一刻起，人生就没什么能吓倒你了。\n\n所以我常说：创业从来不是“赚快钱的机会”，它是一份“不可复制的高价值学历”——成功了，你拿时间自由、财富自由、思维自由；就算失败了，也别沮丧——就当交了学费，换一身“ 扛事的底气”和“解决问题的能力”。\n\n带着这些东西再回职场、再做生意，你到哪都是“香饽饽”——社会永远高薪抢着要“真正做过决策、扛过责任、干过实战”的人。所以怕什么失败？最该怕的是：你连第一步都没踏出去。只要你敢开始，就已经赢过了99%的普通人。\n\n我是 张教主，关注我，2026我们一起用AI破局，一个人顶100人生产力，后续内容中我将持续揭秘新计划！", "speakerTitle": "图灵Ai创始人\n北大畅销书作家\n上市公司增长顾问"}}'

npx ts-node src/index.ts generate \
  --video "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/video/20260206/202602061149141974c2015.MP4" \
  --no-upload-oss \
  --template "t8" \
  --title $'只要迈出第一步\n你就成功了一半' \
  --speaker "图灵张教主" \
  --speaker-title $'图灵Ai创始人\n北大畅销书作家\n上市公司增长顾问' \
  --avatar "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/images/20260206/20260206114916032335365.jpg" \
  --bgm-url "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/file/20260301/20260301190452a20de9134.MP3" \
  --original-text $'创业一次，你就已经悄悄跟普通人拉开差距了——不是因为赚了多少钱，而是你正在做一件“普通人几年甚至一辈子都难碰一次”的事：短时间逼自己突破所有边界。\n\n一旦选了创业，你就再也不是“只做一件事的小角色”了：得懂运营、会销售、能管理、善沟通 ，还得摸透技术逻辑、拿捏人性分寸、扛住人情世故。说白了，创业就是给你开了“强制进化外挂”——先把你所有短板全暴露出来，再逼着你亲手一点点补全。\n\n这个过程疼吗？太疼了：吃不下饭、睡不着觉，身心像被反复拉扯；但熬过去呢？你会在一次次崩溃里，炼出一颗“刀枪不入”的内心。从你扛过那些风雨、见识过刀锋的那一刻起，人生就没什么能吓倒你了。\n\n所以我常说：创业从来不是“赚快钱的机会”，它是一份“不可复制的高价值学历”——成功了，你拿时间自由、财富自由、思维自由；就算失败了，也别沮丧——就当交了学费，换一身“ 扛事的底气”和“解决问题的能力”。\n\n带着这些东西再回职场、再做生意，你到哪都是“香饽饽”——社会永远高薪抢着要“真正做过决策、扛过责任、干过实战”的人。所以怕什么失败？最该怕的是：你连第一步都没踏出去。只要你敢开始，就已经赢过了99%的普通人。\n\n我是 张教主，关注我，2026我们一起用AI破局，一个人顶100人生产力，后续内容中我将持续揭秘新计划！' \
  --pip \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152948c3ad53452.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152857e676d9869.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/202603031528257c3054569.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/202603031528009be2c7342.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/202603031527282a09f1816.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/2026030315270351f532961.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152623678fa7390.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152605f06981784.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152542a8e0e5011.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152446450d17198.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/2026030315242307b7f6270.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152356f90ac8683.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152327c2ab74345.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/20260303152308179170744.mp4" \
  "https://tulingai-1318672529.cos.ap-shanghai.myqcloud.com/uploads/material/video/20260303/202603031522163e4713459.mp4"


  