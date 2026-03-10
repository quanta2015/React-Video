import { ConnectionOptions } from 'bullmq'

export const QUEUE_NAME = 'video-tasks'

export function getRedisConnection(): ConnectionOptions {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: null,
  }
}
