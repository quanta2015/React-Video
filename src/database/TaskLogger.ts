import { getPool } from './index';
import { TaskLog } from '../types';
import { RowDataPacket } from 'mysql2/promise';

export class TaskLogger {
  private taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }

  /** 记录信息日志 */
  async info(step: string, message: string, data?: any): Promise<void> {
    await this.log('info', step, message, data);
  }

  /** 记录警告日志 */
  async warn(step: string, message: string, data?: any): Promise<void> {
    await this.log('warn', step, message, data);
  }

  /** 记录错误日志 */
  async error(step: string, message: string, data?: any): Promise<void> {
    await this.log('error', step, message, data);
  }

  /** 写入日志 */
  private async log(level: 'info' | 'warn' | 'error', step: string, message: string, data?: any): Promise<void> {
    const pool = getPool();
    const now = new Date().toISOString();

    await pool.execute(
      `INSERT INTO task_logs (task_id, level, step, message, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        this.taskId,
        level,
        step,
        message,
        data ? JSON.stringify(data) : null,
        now,
      ]
    );
  }

  /** 获取任务的所有日志 */
  static async getLogs(taskId: string): Promise<TaskLog[]> {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at ASC`,
      [taskId]
    );

    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      level: row.level,
      step: row.step,
      message: row.message,
      data: row.data,
      createdAt: row.created_at,
    }));
  }
}
