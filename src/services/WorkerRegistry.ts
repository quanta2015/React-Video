import os from 'os'
import Redis from 'ioredis'

const WORKER_KEY_PREFIX = 'worker:active:'
const HEARTBEAT_INTERVAL = 10_000 // 10秒
const HEARTBEAT_TTL = 30 // 30秒过期

/**
 * Worker 注册中心
 * 通过 Redis 心跳自动感知同一台机器上的活跃 worker 数量，动态计算渲染并发数
 */
export class WorkerRegistry {
    private redis: Redis
    private hostname: string
    private workerId: string
    private timer: NodeJS.Timeout | null = null

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB || '0'),
            maxRetriesPerRequest: null,
        })
        this.hostname = os.hostname()
        this.workerId = `${this.hostname}:${process.pid}`
    }

    /** 注册 worker 并开始心跳 */
    async start(): Promise<void> {
        await this.heartbeat()
        this.timer = setInterval(() => {
            void this.heartbeat()
        }, HEARTBEAT_INTERVAL)
        const count = await this.getActiveWorkerCount()
        const concurrency = await this.getRenderConcurrency()
        console.log(`[WorkerRegistry] 已注册 workerId=${this.workerId}, 本机活跃worker=${count}, 渲染并发数=${concurrency}`)
    }

    /** 注销 worker 并停止心跳 */
    async stop(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        await this.redis.del(`${WORKER_KEY_PREFIX}${this.workerId}`)
        await this.redis.quit()
    }

    /** 获取当前机器上的活跃 worker 数量 */
    async getActiveWorkerCount(): Promise<number> {
        const keys = await this.redis.keys(`${WORKER_KEY_PREFIX}${this.hostname}:*`)
        return Math.max(1, keys.length)
    }

    /** 根据活跃 worker 数量计算渲染并发数 */
    async getRenderConcurrency(): Promise<number> {
        const cpuCount = os.cpus().length
        const workerCount = await this.getActiveWorkerCount()
        // 总渲染并发 = CPU 80%，再按本机 worker 数平分，每个至少 2
        const totalPool = Math.floor(cpuCount * 0.8)
        const perWorker = Math.floor(totalPool / workerCount)
        return Math.max(2, perWorker)
    }

    private async heartbeat(): Promise<void> {
        try {
            await this.redis.set(
                `${WORKER_KEY_PREFIX}${this.workerId}`,
                Date.now().toString(),
                'EX',
                HEARTBEAT_TTL,
            )
        } catch (error) {
            const errText = error instanceof Error
                ? (error.stack || error.message)
                : String(error)
            console.error(`[WorkerRegistry] 心跳写入失败 workerId=${this.workerId}: ${errText}`)
        }
    }
}
