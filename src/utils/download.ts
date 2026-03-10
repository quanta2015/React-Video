import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

/**
 * 下载文件到指定路径
 */
export async function downloadFile(url: string, destPath: string): Promise<void> {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      reject(err);
    });
  });
}

/**
 * 从 URL 生成本地文件名
 */
export function getFileNameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const basename = path.basename(pathname);
  // 如果没有扩展名，默认 .mp4
  if (!path.extname(basename)) {
    return `${basename || 'video'}.mp4`;
  }
  return basename;
}
