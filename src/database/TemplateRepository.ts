import { RowDataPacket } from 'mysql2/promise';
import { getPool } from './index';
import { TemplateListItem } from '../types';

interface TemplateRow extends RowDataPacket {
  templateKey: string;
  templateName: string;
  templateVideoUrl: string | null;
  templateCoverUrl: string | null;
}

export class TemplateRepository {
  /** 获取模板列表 */
  async list(): Promise<TemplateListItem[]> {
    const pool = getPool();
    const [rows] = await pool.execute<TemplateRow[]>(
      `SELECT
         template_key AS templateKey,
         template_name AS templateName,
         template_video_url AS templateVideoUrl,
         template_cover_url AS templateCoverUrl
       FROM video_templates
       WHERE template_key REGEXP '^t[0-9]+$'
       ORDER BY
         CASE
           WHEN template_key REGEXP '^t[0-9]+$' THEN CAST(SUBSTRING(template_key, 2) AS UNSIGNED)
           ELSE 999999
         END,
         template_key`
    );

    return rows.map((row) => ({
      templateKey: row.templateKey,
      templateName: row.templateName,
      templateVideoUrl: row.templateVideoUrl || '',
      templateCoverUrl: row.templateCoverUrl || '',
    }));
  }
}
