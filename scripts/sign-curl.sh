#!/bin/bash
# 用法:
#   ./scripts/sign-curl.sh <method> <url> [body]          # 输出 curl 命令
#   ./scripts/sign-curl.sh --exec <method> <url> [body]    # 直接执行
#   echo '{"key":"val"}' | ./scripts/sign-curl.sh POST url # 从 stdin 读 body
#
# 示例:
#   ./scripts/sign-curl.sh --exec POST http://localhost:3000/api/tasks '{"videoUrl":"https://example.com/v.mp4"}'
#   ./scripts/sign-curl.sh GET http://localhost:3000/api/tasks/abc123

EXEC=false
if [ "$1" = "--exec" ]; then
  EXEC=true; shift
fi

SECRET="${API_SECRET:?请设置 API_SECRET 环境变量}"
METHOD="${1:?用法: $0 [--exec] <METHOD> <URL> [BODY]}"
URL="${2:?用法: $0 [--exec] <METHOD> <URL> [BODY]}"
BODY="${3:-}"

# 无 body 参数且 stdin 不是终端时，从 stdin 读取并压缩为单行
if [ -z "$BODY" ] && [ ! -t 0 ]; then
  BODY=$(cat | tr -d '\n' | sed 's/  */ /g')
fi

TIMESTAMP=$(date +%s)
NONCE=$(openssl rand -hex 16)
SIGNATURE=$(printf '%s' "${TIMESTAMP}${NONCE}${BODY}" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

if [ "$EXEC" = true ]; then
  if [ "$METHOD" = "GET" ]; then
    curl -X GET "$URL" \
      -H "x-timestamp: $TIMESTAMP" \
      -H "x-nonce: $NONCE" \
      -H "x-signature: $SIGNATURE"
  else
    curl -X "$METHOD" "$URL" \
      -H "Content-Type: application/json" \
      -H "x-timestamp: $TIMESTAMP" \
      -H "x-nonce: $NONCE" \
      -H "x-signature: $SIGNATURE" \
      -d "$BODY"
  fi
else
  if [ "$METHOD" = "GET" ]; then
    echo "curl -X GET \"$URL\" \\"
    echo "  -H \"x-timestamp: $TIMESTAMP\" \\"
    echo "  -H \"x-nonce: $NONCE\" \\"
    echo "  -H \"x-signature: $SIGNATURE\""
  else
    echo "curl -X $METHOD \"$URL\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -H \"x-timestamp: $TIMESTAMP\" \\"
    echo "  -H \"x-nonce: $NONCE\" \\"
    echo "  -H \"x-signature: $SIGNATURE\" \\"
    echo "  -d '$BODY'"
  fi
fi
