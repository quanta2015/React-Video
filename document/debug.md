curl -X POST http://localhost:3000/api/tasks \
 -H "Content-Type: application/json" \
 -d '{
"videoUrl": "https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4",
"options": {
"template": "t1",
"title": "图灵 AI 身份 ID\n每个人的数字财富",
"speaker": "图灵张教主",
"speakerTitle": "北大畅销书作家\n多家亿级企业增长破局顾问\n图灵 AI 破局俱乐部发起人",
"splitSubtitlePath": "./examples/subtitle_split.json",
"uploadToOss": false,
"pip": [
{ "url": "http://e.hiphotos.baidu.com/image/pic/item/a1ec08fa513d2697e542494057fbb2fb4316d81e.jpg", "tags": [] },
{ "url": "http://g.hiphotos.baidu.com/image/pic/item/55e736d12f2eb938d5277fd5d0628535e5dd6f4a.jpg", "tags": [] },
{ "url": "https://flowx-img.oss-cn-beijing.aliyuncs.com/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260210112650_826_938.png", "tags": ["名言", "王坚院士"] }
]
}
}'

curl http://localhost:3000/api/tasks -H "x-timestamp: $(date +%s)" -H "x-nonce: $(openssl rand -hex 16)" -H "x-signature: aa8354117956aceb08cf10a1f814be7184f013114b0d618afab6c86c7d316921" -d '{}'

./scripts/sign-curl.sh --exec GET http://localhost:3000/api/tasks/cd2d0c25-b0b7-485a-a371-7207d8bb2810

./scripts/sign-curl.sh --exec GET http://localhost:3000/api/tasks/b3359009-0960-46e4-9b94-c08603775542/logs

export API_SECRET="aa8354117956aceb08cf10a1f814be7184f013114b0d618afab6c86c7d316921"

API_SECRET="aa8354117956aceb08cf10a1f814be7184f013114b0d618afab6c86c7d316921"

# Generate timestamp and nonce

TIMESTAMP=$(date +%s)
NONCE=$(openssl rand -hex 16)

# Your request body (must be single line, no extra spaces)

BODY='{"videoUrl":"https://flowx-img.oss-cn-beijing.aliyuncs.com/b7389c29178df8e3079c2bd4b2cf0ce6.mp4","options":{"template":"t1","title":"图灵 AI 身份 ID\n每个人的数字财富","speaker":"图灵张教主","speakerTitle":"北大畅销书作家\n多家亿级企业增长破局顾问\n图灵 AI 破局俱乐部发起人","pip":[{"url":"http://e.hiphotos.baidu.com/image/pic/item/a1ec08fa513d2697e542494057fbb2fb4316d81e.jpg","tags":[]},{"url":"http://g.hiphotos.baidu.com/image/pic/item/55e736d12f2eb938d5277fd5d0628535e5dd6f4a.jpg","tags":[]},{"url":"https://flowx-img.oss-cn-beijing.aliyuncs.com/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260210112650_826_938.png","tags":["名言","王坚院士"]}]}}'

# Generate signature

SIGNATURE=$(printf '%s' "${TIMESTAMP}${NONCE}${BODY}" | openssl dgst -sha256 -hmac "$API_SECRET" | awk '{print $NF}')

# Send request with auth headers

curl -X POST http://108.160.141.45/api/tasks \
 -H "Content-Type: application/json" \
 -H "x-timestamp: $TIMESTAMP" \
  -H "x-nonce: $NONCE" \
  -H "x-signature: $SIGNATURE" \
  -d "$BODY"
