import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

/** 获取 MySQL 连接池 */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'liyangtom',
      database: process.env.MYSQL_DATABASE || 'video_generator',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

/** 初始化数据库连接（不执行建表，数据库由外部预先初始化） */
export async function initDatabase(): Promise<void> {
  const p = getPool();
  // 仅验证连接可用
  await p.query('SELECT 1');
}

/** 关闭数据库连接池 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
