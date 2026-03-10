import axios from 'axios';
import { RawSubtitle, ASRResult } from '../types';

export interface ASRConfig {
  appId: string;
  accessToken: string;
  resourceId: string;
  submitUrl: string;
  queryUrl: string;
}

export class VolcengineASR {
  constructor(private config: ASRConfig) { }

  /** 主入口：识别视频中的语音 */
  async recognize(audioUrl: string): Promise<ASRResult> {
    const taskId = await this.submitTask(audioUrl);
    const result = await this.waitForResult(taskId);
    return this.parseResult(result);
  }

  /** 提交识别任务 */
  private async submitTask(audioUrl: string): Promise<string> {
    const requestId = crypto.randomUUID();

    const headers = {
      'X-Api-App-Key': this.config.appId,
      'X-Api-Access-Key': this.config.accessToken,
      'X-Api-Resource-Id': this.config.resourceId,
      'X-Api-Request-Id': requestId,
    };

    // 从 URL 中提取文件扩展名
    const urlPath = new URL(audioUrl).pathname;
    const ext = urlPath.split('.').pop()?.toLowerCase() || 'mp4';

    const payload = {
      user: {
        uid: 'user_001',
      },
      audio: {
        url: audioUrl,
        format: ext,
      },
      request: {
        model_name: 'bigmodel',
        enable_itn: true,
        enable_punc: true,
        show_utterances: true,
      },
    };

    try {
      const response = await axios.post(
        'https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit',
        payload,
        { headers }
      );

      // v3 接口根据 Header 中的 X-Api-Status-Code 判断成功
      // 成功时 code 为 20000000
      const code = response.headers['x-api-status-code'];
      if (code !== '20000000') {
        const msg = response.headers['x-api-message'];
        throw new Error(`ASR submit failed: code=${code}, message=${msg}`);
      }

      return requestId;
    } catch (error: any) {
      // Axios 错误处理，尝试获取响应头中的错误信息
      if (error.response) {
        const code = error.response.headers['x-api-status-code'];
        const msg = error.response.headers['x-api-message'];
        throw new Error(`ASR submit request failed: code=${code}, message=${msg}, status=${error.response.status}`);
      }
      throw error;
    }
  }

  /** 轮询等待结果 */
  private async waitForResult(
    requestId: string,
    maxWaitSeconds = 600
  ): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 3000;

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      const headers = {
        'X-Api-App-Key': this.config.appId,
        'X-Api-Access-Key': this.config.accessToken,
        'X-Api-Resource-Id': this.config.resourceId,
        'X-Api-Request-Id': requestId, // 查询时也需要带上原来的 Request ID
      };

      try {
        const response = await axios.post(
          'https://openspeech.bytedance.com/api/v3/auc/bigmodel/query',
          {}, // Body 为空
          { headers }
        );

        const code = response.headers['x-api-status-code'];
        console.log(`ASR query: code=${code}, hasResult=${!!response.data?.result?.text}`);

        if (code === '20000000' && response.data?.result?.text) {
          // 任务完成且有识别结果
          console.log('ASR response:', JSON.stringify(response.data, null, 2));
          return response.data;
        } else if (code === '20000000') {
          // 查询成功但任务还在处理中，继续轮询
          console.log('ASR task still processing...');
        } else {
          // 其他状态码，打印日志继续轮询
          console.log(`ASR query returned code: ${code}`);
        }

        // 简单的退避策略
        await this.sleep(pollInterval);

      } catch (error: any) {
        // 查询出错，可能是网络问题或者 4xx/5xx
        // 暂时继续重试，或者抛出
        console.warn('ASR query pending or error:', error.message);
        await this.sleep(pollInterval);
      }
    }

    throw new Error('ASR timeout');
  }

  /** 解析 API 响应 */
  private parseResult(response: any): ASRResult {
    // v3 结构: response.result.utterances
    const utterances = response.result?.utterances || [];

    const subtitles: RawSubtitle[] = utterances.map((u: any) => ({
      start: u.start_time,
      end: u.end_time,
      text: u.text,
      words: (u.words || []).map((w: any) => ({
        text: w.text,
        start: w.start_time,
        end: w.end_time,
      })),
    }));

    return {
      subtitles,
      text: response.result?.text || '',
      duration: response.audio_info?.duration || 0, // v3 耗时/时长信息可能不同，这里取 audio_info
    };
  }

  /** 延迟函数 */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
