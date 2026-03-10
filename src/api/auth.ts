import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
});

/**
 * HMAC 签名鉴权中间件
 *
 * 请求头：
 *   x-timestamp: 秒级时间戳
 *   x-nonce: 随机字符串
 *   x-signature: HMAC-SHA256(timestamp + nonce + body, secret)
 */
export function hmacAuth(req: Request, res: Response, next: NextFunction) {
  const secret = config.server.apiSecret;
  if (!secret) return next(); // 未配置密钥则跳过鉴权

  const timestamp = req.headers['x-timestamp'] as string;
  const nonce = req.headers['x-nonce'] as string;
  const signature = req.headers['x-signature'] as string;

  if (!timestamp || !nonce || !signature) {
    return res.status(401).json({ error: '缺少鉴权参数' });
  }

  // 检查时间戳是否在容差范围内
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > config.server.nonceExpiry) {
    return res.status(401).json({ error: '请求已过期' });
  }

  // 验证签名
  const body = req.method === 'GET' ? '' : JSON.stringify(req.body || {});
  const expected = crypto
    .createHmac('sha256', secret)
    .update(timestamp + nonce + body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: '签名无效' });
  }

  // nonce 防重放
  const nonceKey = `nonce:${nonce}`;
  redis.set(nonceKey, '1', 'EX', config.server.nonceExpiry, 'NX')
    .then((result) => {
      if (!result) {
        return res.status(401).json({ error: 'nonce 已使用' });
      }
      next();
    })
    .catch(() => {
      res.status(500).json({ error: '鉴权服务异常' });
    });
}
