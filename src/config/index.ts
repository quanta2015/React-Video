// 环境变量加载已移至入口文件 (server.ts, index.ts) 或由 Remotion 自动处理

export const config = {
  // 火山引擎 ASR 配置
  volcengine: {
    appId: process.env.VOLCENGINE_APP_ID || '',
    accessToken: process.env.VOLCENGINE_ACCESS_TOKEN || '',
    resourceId: 'volc.bigasr.auc',
    submitUrl: 'https://openspeech.bytedance.com/api/v1/auc/submit',
    queryUrl: 'https://openspeech.bytedance.com/api/v1/auc/query',
  },

  // 火山引擎 AI 配置 (用于 AI 分句)
  volcengineAI: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.VOLCENGINE_AI_API_KEY || '',
    model: 'deepseek-v3-2-251201',

    // baseUrl: 'https://code.newcli.com/gemini',
    // apiKey: process.env.GEMINI_API_KEY || '',
    // model: 'gemini-3-pro-preview',
  },

  // 字幕配置
  subtitle: {
    maxChars: 8,
    maxLines: 3,
    defaultTemplate: 'simple',
    // 自定义词汇表（用于分词优化）
    // 自定义词汇表（用于分词优化）
    customWords: ['愿景', '伟大愿景', '时代伟大愿景', '操作系统'],
  },

  // 视频配置
  video: {
    width: 1080,
    height: 1920,
    fps: 30,
  },

  // 路径配置
  paths: {
    fonts: './public/fonts',
    bgm: './assets/bgm',
    sfx: './assets/sfx',
    output: './output',
    database: './data',
  },

  // 服务配置
  server: {
    port: parseInt(process.env.PORT || '3000'),
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10'),
    apiSecret: process.env.API_SECRET || '',
    nonceExpiry: 300, // nonce 过期时间（秒），同时也是时间戳容差
  },

  // 阿里云 OSS 配置
  oss: {
    endpoint: process.env.ALIYUN_OSS_ENDPOINT || '',
    bucket: process.env.ALIYUN_OSS_BUCKET || '',
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
    securityToken: process.env.ALIYUN_OSS_SECURITY_TOKEN || '',
    prefix: process.env.ALIYUN_OSS_PREFIX || 'video-results',
    // 可选：自定义公网访问域名（例如 CDN 域名）
    publicBaseUrl: process.env.ALIYUN_OSS_PUBLIC_BASE_URL || '',
    timeoutMs: parseInt(process.env.ALIYUN_OSS_TIMEOUT_MS || '120000'),
  },

  // 字体配置
  fonts: [
    { name: 'System', file: '', type: 'system' }, // 系统默认字体
    { name: 'SanjiJiSong', file: 'sanjijisongchaocu.ttf', format: 'truetype', weight: 'bold' },
    { name: '新青年体', file: 'WenYue-XinQingNianTi-W8-J-2.otf', format: 'truetype' },
    { name: 'HarmonyOS Sans', file: 'HarmonyOS_Sans_Bold.ttf', format: 'truetype', weight: 'bold' },
    { name: '微软雅黑', file: '微软雅黑.ttf', format: 'truetype' },
    { name: '三极极宋 超粗', file: '三极极宋 超粗.ttf', format: 'truetype' },
    { name: '三极榜楷简体', file: '三极榜楷简体.ttf', format: 'truetype' },
    { name: '文悦挥墨手书', file: 'WenYueHuiMoShouShu.otf', format: 'truetype' },
    { name: '抖音美好体', file: 'DouyinSansBold.ttf', format: 'truetype' },
    { name: '三极黑宋体 中粗', file: '三极黑宋体 中粗.ttf', format: 'truetype' },
    { name: '云黑', file: '云黑.ttf', format: 'truetype' },
    { name: '倔强黑', file: '倔强黑.ttf', format: 'truetype' },
    { name: '励字志向黑简 特粗', file: '励字志向黑简 特粗.ttf', format: 'truetype' },
    { name: '励字玉树临风简', file: '励字玉树临风简.ttf', format: 'truetype' },
    { name: '博洋柳体', file: '博洋柳体.ttf', format: 'truetype' },
    { name: '国潮体', file: '国潮体.ttf', format: 'truetype' },
    { name: '圆体-汉仪中圆简', file: '圆体-汉仪中圆简.ttf', format: 'truetype' },
    { name: '圆绒体', file: '圆绒体.ttf', format: 'truetype' },
    { name: '字语叙黑体Bold', file: '字语叙黑体Bold.ttf', format: 'truetype' },
    { name: '字语叙黑体', file: '字语叙黑体.ttf', format: 'truetype' },
    { name: '字语圆体', file: '字语圆体.ttf', format: 'truetype' },
    { name: '宋体-粗体', file: '宋体-粗体.ttf', format: 'truetype' },
    { name: '宋体', file: '宋体.TTF', format: 'truetype' },
    { name: '得意黑 斜体', file: '得意黑 斜体.otf', format: 'opentype' },
    { name: '得意黑', file: '得意黑.otf', format: 'opentype' },
    { name: '思源中宋体', file: '思源中宋体.otf', format: 'opentype' },
    { name: '思源粗宋体', file: '思源粗宋体.otf', format: 'opentype' },
    { name: '抖音美好体', file: '抖音美好体.otf', format: 'opentype' },
    { name: '新青年体', file: '新青年体.OTF', format: 'opentype' },
    { name: '方正超粗黑', file: '方正超粗黑.ttf', format: 'truetype' },
    { name: '方正黑体', file: '方正黑体.ttf', format: 'truetype' },
    { name: '汉仪尚巍手书', file: '汉仪尚巍手书.ttf', format: 'truetype' },
    { name: '玄宋', file: '玄宋.ttf', format: 'truetype' },
    { name: '瑞云飞宋', file: '瑞云飞宋.ttf', format: 'truetype' },
    { name: '畅黑', file: '畅黑.ttf', format: 'truetype' },
    { name: '站酷庆科黄油体', file: 'ZCOOLQingKeHuangYou-Regular.ttf', format: 'truetype' },
    { name: '简宋', file: '简宋.ttf', format: 'truetype' },
    { name: '经典黑', file: '经典黑.ttf', format: 'truetype' },
    { name: '褚体拼音体', file: '褚体拼音体.ttf', format: 'truetype' },
    { name: '靓丽体', file: '靓丽体.ttf', format: 'truetype' },
    { name: '风骨楷体', file: '风骨楷体.ttf', format: 'truetype' },
    { name: '鸿朗体', file: '鸿朗体.otf', format: 'opentype' },
    { name: '鸿蒙体粗', file: '鸿蒙体粗.ttf', format: 'truetype' },
  ],

  // 音效配置（名称 -> 文件映射，优先用于 startSfx 与随机音效）
  sfx: [
    { name: 'ding', file: 'ding-sfx-472366.mp3', role: 'fx' },
    { name: 'dingCute', file: 'ding可爱提示_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'swoosh', file: 'swoosh-023-454830.mp3', role: 'fx' },
    { name: 'whoosh', file: 'whoosh-motion-405445.mp3', role: 'fx' },
    { name: 'starBell', file: '升级提示音效-星星铃铛-通关成功_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'glitterDing', file: '发光声-简短叮-系统ui-提示音(Glittering So_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'dingSuccess', file: '叮-成功提示音_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'dingCn', file: '叮_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'dangerDingdong', file: '叮咚危险靠近紧张刺激_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'dong', file: '咚_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'bo', file: '啵_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'duDong', file: '嘟咚音效_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'errorBeepA', file: '嘟嘟嘟！错误失败不正确解答错误音【34-1】-拟声词-游戏_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'errorBeepB', file: '嘟嘟嘟！错误失败不正确解答错误音【34-1】-拟声词-游戏_爱给网_aigei_com (1).mp3', role: 'fx' },
    { name: 'deng', file: '噔_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'memorySwipe', file: '回忆-刷一下（18）_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'mailNotify', file: '多媒体短音频标志 17-电子邮件 通知-按钮声音-叮当声_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'pop', file: '弹出_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'pop2', file: '弹出声_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'checkinDing', file: '打卡声，叮，ding~_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'waterDrop', file: '水滴 咚 滴答声 转场 01_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'messageNotify', file: '消息提示音_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'fireWhoosh', file: '火炬运动火球通过快速 01-燃烧-噼啪作响-旋风_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'ideaBell', file: '玻璃叮或铃-叮当声-有想法 好主意_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'keyboardEnter', file: '电脑键盘输入（回车键）-打字-短的_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'varietyBo', file: '综艺弹出啵~_爱给网_aigei_com.wav', role: 'fx' },
    { name: 'transitionWhoosh', file: '转场_Woosh_01_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'windWhoosh', file: '风的唰、嗖声_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'dagger', file: '匕首.mp3', role: 'fx' },
    { name: 'fadeFlashback', file: '变暗过渡-闪回.mp3', role: 'fx' },
    { name: 'boBubble', file: '啵，气泡.mp3', role: 'fx' },
    { name: 'glassClink', file: '餐厅碰杯声.mp3', role: 'fx' },
    { name: 'typingSubtitle4', file: '打字-字幕-4声.mp3', role: 'fx' },
    { name: 'clickTech', file: '单击科技.mp3', role: 'fx' },
    { name: 'popBubble', file: '弹出声-气泡.mp3', role: 'fx' },
    { name: 'dingSuccessShort', file: '叮-成功提示音-短.mp3', role: 'fx' },
    { name: 'dingShortBright', file: '叮-短-清脆.mp3', role: 'ding' },
    { name: 'dingMetal', file: '叮-金属声.mp3', role: 'fx' },
    { name: 'duDongPlain', file: '嘟咚音效.mp3', role: 'ding' },
    { name: 'windBreath', file: '呼-风声.mp3', role: 'fx' },
    { name: 'memorySwipeFast', file: '回忆-刷一下-快.mp3', role: 'ding' },
    { name: 'cartoonBounce', file: '卡通Q弹-弹跳音.mp3', role: 'fx' },
    { name: 'introDong', file: '开场音效-咚.mp3', role: 'fx' },
    { name: 'techActivate', file: '科技-激活出现提示.mp3', role: 'fx' },
    { name: 'quickSwipe', file: '快刷.mp3', role: 'ding' },
    { name: 'victoryVarietyDengdeng', file: '胜利-综艺-噔噔噔噔.mp3', role: 'fx' },
    { name: 'lightSwooshShort', file: '嗖-很轻-短.mp3', role: 'fx' },
    { name: 'wowCheer', file: '哇呜-欢呼.mp3', role: 'fx' },
    { name: 'messageNotifyLite', file: '消息提示音.mp3', role: 'fx' },
    { name: 'waterDropSingle', file: '一滴水.mp3', role: 'fx' },
    { name: 'transitionSwipeWhoosh', file: '风的唰、嗖声_爱给网_aigei_com.mp3', role: 'fx' },
    { name: 'varietyBoAlt', file: '综艺啵声.mp3', role: 'fx' },
    { name: 'varietyBoCute', file: '综艺弹出啵-可爱.wav', role: 'fx' },
    { name: 'varietyTenseDeng', file: '综艺紧张-噔噔.mp3', role: 'fx' },
    { name: 'dingCuteLongEcho', file: 'ding可爱提示-长-回音.mp3', role: 'ding' },
    { name: 'duangCorrect', file: 'duang-正确.mp3', role: 'fx' },
  ],
}
