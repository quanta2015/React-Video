import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import axios from 'axios'

export interface OssUploadConfig {
  endpoint: string
  bucket: string
  accessKeyId: string
  accessKeySecret: string
  securityToken?: string
  prefix?: string
  publicBaseUrl?: string
  timeoutMs?: number
}

export interface OssUploadResult {
  objectKey: string
  url: string
  etag?: string
}

const CONTENT_TYPE_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.m4v': 'video/mp4',
}

export class OssUploadService {
  private protocol: 'http' | 'https'
  private endpointHost: string

  constructor(private readonly ossConfig: OssUploadConfig) {
    const { protocol, host } = this.normalizeEndpoint(ossConfig.endpoint)
    this.protocol = protocol
    this.endpointHost = host
  }

  async uploadTaskVideo(taskId: string, localFilePath: string): Promise<OssUploadResult> {
    const objectKey = this.buildObjectKey(taskId, localFilePath)
    return this.uploadFile(localFilePath, objectKey)
  }

  async uploadFile(localFilePath: string, objectKey: string): Promise<OssUploadResult> {
    this.validateConfig()

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`OSS 上传失败：文件不存在 ${localFilePath}`)
    }

    const stat = fs.statSync(localFilePath)
    const contentType = this.getContentType(localFilePath)
    const normalizedObjectKey = this.normalizeObjectKey(objectKey)
    const encodedObjectKey = this.encodeObjectKey(normalizedObjectKey)
    const date = new Date().toUTCString()

    const ossHeaders: Record<string, string> = {}
    if (this.ossConfig.securityToken) {
      ossHeaders['x-oss-security-token'] = this.ossConfig.securityToken
    }

    const canonicalizedHeaders = this.buildCanonicalizedHeaders(ossHeaders)
    const canonicalizedResource = `/${this.ossConfig.bucket}/${normalizedObjectKey}`
    const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalizedHeaders}${canonicalizedResource}`
    const signature = crypto
      .createHmac('sha1', this.ossConfig.accessKeySecret)
      .update(stringToSign)
      .digest('base64')

    const authorization = `OSS ${this.ossConfig.accessKeyId}:${signature}`
    const uploadUrl = `${this.protocol}://${this.getBucketHost()}/${encodedObjectKey}`

    const response = await axios.put(uploadUrl, fs.createReadStream(localFilePath), {
      timeout: this.ossConfig.timeoutMs || 120000,
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        Date: date,
        Authorization: authorization,
        ...ossHeaders,
      },
    })

    const etagHeader = response.headers?.etag

    return {
      objectKey: normalizedObjectKey,
      url: this.buildPublicUrl(normalizedObjectKey),
      etag: typeof etagHeader === 'string' ? etagHeader.replace(/"/g, '') : undefined,
    }
  }

  private validateConfig(): void {
    const missing: string[] = []
    if (!this.ossConfig.endpoint) missing.push('ALIYUN_OSS_ENDPOINT')
    if (!this.ossConfig.bucket) missing.push('ALIYUN_OSS_BUCKET')
    if (!this.ossConfig.accessKeyId) missing.push('ALIYUN_OSS_ACCESS_KEY_ID')
    if (!this.ossConfig.accessKeySecret) missing.push('ALIYUN_OSS_ACCESS_KEY_SECRET')

    if (missing.length > 0) {
      throw new Error(`OSS 配置缺失：${missing.join(', ')}`)
    }
  }

  private buildObjectKey(taskId: string, localFilePath: string): string {
    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
    const ext = (path.extname(localFilePath) || '.mp4').toLowerCase()
    const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, '_')
    const fileName = `${safeTaskId}${ext}`
    const prefix = this.trimSlashes(this.ossConfig.prefix || 'video-results')

    if (!prefix) {
      return `${datePath}/${fileName}`
    }
    return `${prefix}/${datePath}/${fileName}`
  }

  private getContentType(localFilePath: string): string {
    const ext = path.extname(localFilePath).toLowerCase()
    return CONTENT_TYPE_MAP[ext] || 'application/octet-stream'
  }

  private normalizeObjectKey(objectKey: string): string {
    return objectKey
      .split('/')
      .filter(Boolean)
      .join('/')
  }

  private encodeObjectKey(objectKey: string): string {
    return objectKey
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
  }

  private buildCanonicalizedHeaders(headers: Record<string, string>): string {
    const entries = Object.entries(headers)
      .map(([key, value]) => [key.toLowerCase(), value.trim()] as const)
      .sort(([a], [b]) => a.localeCompare(b))

    if (entries.length === 0) {
      return ''
    }

    return entries.map(([key, value]) => `${key}:${value}\n`).join('')
  }

  private buildPublicUrl(objectKey: string): string {
    const encodedObjectKey = this.encodeObjectKey(objectKey)
    const base = this.trimRightSlash(this.ossConfig.publicBaseUrl || '')
    if (base) {
      return `${base}/${encodedObjectKey}`
    }
    return `${this.protocol}://${this.getBucketHost()}/${encodedObjectKey}`
  }

  private getBucketHost(): string {
    const bucketPrefix = `${this.ossConfig.bucket}.`
    if (this.endpointHost.startsWith(bucketPrefix)) {
      return this.endpointHost
    }
    return `${this.ossConfig.bucket}.${this.endpointHost}`
  }

  private normalizeEndpoint(endpoint: string): { protocol: 'http' | 'https'; host: string } {
    if (!endpoint) {
      return { protocol: 'https', host: '' }
    }

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint)
      const protocol = url.protocol === 'http:' ? 'http' : 'https'
      return { protocol, host: this.trimRightSlash(url.host) }
    }

    return { protocol: 'https', host: this.trimRightSlash(endpoint) }
  }

  private trimSlashes(input: string): string {
    return input.replace(/^\/+|\/+$/g, '')
  }

  private trimRightSlash(input: string): string {
    return input.replace(/\/+$/g, '')
  }
}
