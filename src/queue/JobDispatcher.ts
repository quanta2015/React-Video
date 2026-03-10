import { Queue } from 'bullmq'
import { getRedisConnection, QUEUE_NAME } from '../config/redis'

export class JobDispatcher {
  private queue: Queue

  constructor() {
    this.queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    })
  }

  /** 将任务推入 Redis 队列，只传 taskId */
  async dispatch(taskId: string, priority: number = 0): Promise<void> {
    await this.queue.add('process-video', { taskId }, {
      priority,
      jobId: taskId,
    })
  }

  /** 获取队列状态 */
  async getStatus() {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    return counts
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
