import axios from 'axios';
import { CallbackPayload } from '../types';
import { TaskLogger } from '../database/TaskLogger';

export class CallbackService {
  private maxRetries = 3;
  private retryDelay = 5000;

  /** 发送回调通知 */
  async notify(callbackUrl: string, payload: CallbackPayload, taskId: string): Promise<boolean> {
    const logger = new TaskLogger(taskId);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await logger.info('callback', `发送回调通知 (尝试 ${attempt}/${this.maxRetries})`, {
          url: callbackUrl,
          payload,
        });

        const response = await axios.post(callbackUrl, payload, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });

        await logger.info('callback', '回调通知成功', { status: response.status });
        return true;
      } catch (error: any) {
        const errMsg = error.message || '未知错误';
        await logger.warn('callback', `回调通知失败: ${errMsg}`, { attempt });

        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay);
        }
      }
    }

    await logger.error('callback', '回调通知最终失败');
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
