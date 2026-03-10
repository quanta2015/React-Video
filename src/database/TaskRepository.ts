import { getPool } from './index';
import { VideoTask, TaskStatus, TaskOptions, TaskResult, TaskLog } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class TaskRepository {
  /** 创建新任务 */
  async create(data: {
    videoUrl: string;
    callbackUrl?: string;
    options?: TaskOptions;
    priority?: number;
  }): Promise<VideoTask> {
    const pool = getPool();
    const id = uuidv4();
    const now = new Date().toISOString();

    await pool.execute(
      `INSERT INTO video_tasks (id, video_url, callback_url, options, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.videoUrl,
        data.callbackUrl || null,
        JSON.stringify(data.options || {}),
        data.priority || 0,
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  /** 根据ID查找任务 */
  async findById(id: string): Promise<VideoTask | null> {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM video_tasks WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  /** 获取并锁定下一个待处理任务 */
  async claimNextTask(): Promise<VideoTask | null> {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute<RowDataPacket[]>(
        `SELECT id FROM video_tasks
         WHERE status = 'pending'
         ORDER BY priority DESC, created_at ASC
         LIMIT 1
         FOR UPDATE`
      );

      if (rows.length === 0) {
        await conn.commit();
        return null;
      }

      const taskId = rows[0].id;
      const now = new Date().toISOString();

      await conn.execute(
        `UPDATE video_tasks SET status = 'processing', started_at = ? WHERE id = ?`,
        [now, taskId]
      );

      await conn.commit();
      return await this.findById(taskId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /** 更新任务状态 */
  async updateStatus(id: string, status: TaskStatus, data?: Partial<VideoTask>): Promise<void> {
    const pool = getPool();
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status === 'processing') {
      updates.push('started_at = ?');
      values.push(new Date().toISOString());
    }

    if (status === 'completed' || status === 'failed') {
      updates.push('completed_at = ?');
      values.push(new Date().toISOString());
    }

    if (data?.result) {
      updates.push('result = ?');
      values.push(JSON.stringify(data.result));
    }

    if (data?.errorMessage) {
      updates.push('error_message = ?');
      values.push(data.errorMessage);
    }

    values.push(id);
    await pool.execute(
      `UPDATE video_tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  /** 更新任务进度 */
  async updateProgress(id: string, progress: number, currentStep?: string): Promise<void> {
    const pool = getPool();
    await pool.execute(
      `UPDATE video_tasks SET progress = ?, current_step = ? WHERE id = ?`,
      [progress, currentStep || null, id]
    );
  }

  /** 增加重试次数 */
  async incrementRetry(id: string): Promise<number> {
    const pool = getPool();
    await pool.execute(
      `UPDATE video_tasks SET retry_count = retry_count + 1, status = 'pending' WHERE id = ?`,
      [id]
    );
    const task = await this.findById(id);
    return task?.retryCount || 0;
  }

  /** 获取任务列表 */
  async list(options?: { status?: TaskStatus; limit?: number; offset?: number }): Promise<VideoTask[]> {
    const pool = getPool();
    let sql = 'SELECT * FROM video_tasks';
    const params: any[] = [];

    if (options?.status) {
      sql += ' WHERE status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows.map(row => this.mapRow(row));
  }

  /** 映射数据库行到对象 */
  private mapRow(row: any): VideoTask {
    return {
      id: row.id,
      status: row.status as TaskStatus,
      priority: row.priority,
      videoUrl: row.video_url,
      callbackUrl: row.callback_url,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : (row.options || {}),
      result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result || undefined,
      progress: row.progress,
      currentStep: row.current_step,
      retryCount: row.retry_count,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }
}
