import { VideoTemplate } from '../../types'
import { T1Template } from './T1'
import { T2Template } from './T2'
import { T3Template } from './T3'
import { T4Template } from './T4'
import { T5Template } from './T5'
import { T6Template } from './T6'
import { T7Template } from './T7'
import { T8Template } from './T8'
import { T9Template } from './T9'
import { T10Template } from './T10'
import { T11Template } from './T11'
import { T12Template } from './T12'
import { T13Template } from './T13'
import { T14Template } from './T14'
import { T15Template } from './T15'
import { T16Template } from './T16'
import { T17Template } from './T17'
import { T18Template } from './T18'
import { T19Template } from './T19'
import { T20Template } from './T20'
import { T21Template } from './T21'
import { T22Template } from './T22'
import { T23Template } from './T23'
import { T24Template } from './T24'
import { T25Template } from './T25'
import { T26Template } from './T26'
import { T27Template } from './T27'
import { Tx1Template } from './Tx1'
import { Tx2Template } from './Tx2'
import { SimpleTemplate } from './SimpleTemplate'

/** 模板注册表 */
const templates: Map<string, VideoTemplate> = new Map()

// 注册内置模板
templates.set('t1', T1Template)
templates.set('t2', T2Template)
templates.set('t3', T3Template)
templates.set('t4', T4Template)
templates.set('t5', T5Template)
templates.set('t6', T6Template)
templates.set('t7', T7Template)
templates.set('t8', T8Template)
templates.set('t9', T9Template)
templates.set('t10', T10Template)
templates.set('t11', T11Template)
templates.set('t12', T12Template)
templates.set('t13', T13Template)
templates.set('t14', T14Template)
templates.set('t15', T15Template)
templates.set('t16', T16Template)
templates.set('t17', T17Template)
templates.set('t18', T18Template)
templates.set('t19', T19Template)
templates.set('t20', T20Template)
templates.set('t21', T21Template)
templates.set('t22', T22Template)
templates.set('t23', T23Template)
templates.set('t24', T24Template)
templates.set('t25', T25Template)
templates.set('t26', T26Template)
templates.set('t27', T27Template)
templates.set('tx1', Tx1Template)
templates.set('tx2', Tx2Template)
templates.set('simple', SimpleTemplate)

/** 模板管理器 */
export const TemplateRegistry = {
  /** 获取模板 */
  get(name: string): VideoTemplate {
    const template = templates.get(name)
    if (!template) {
      throw new Error(`Template "${name}" not found`)
    }
    return template
  },

  /** 注册新模板 */
  register(template: VideoTemplate): void {
    templates.set(template.name, template)
  },

  /** 列出所有模板 */
  list(): VideoTemplate[] {
    return Array.from(templates.values())
  },

  /** 检查模板是否存在 */
  has(name: string): boolean {
    return templates.has(name)
  },
}

export * from './T1'
export * from './T2'
export * from './T3'
export * from './T4'
export * from './T5'
export * from './T6'
export * from './T7'
export * from './T8'
export * from './T9'
export * from './T10'
export * from './T11'
export * from './T12'
export * from './T13'
export * from './T14'
export * from './T15'
export * from './T16'
export * from './T17'
export * from './T18'
export * from './T19'
export * from './T20'
export * from './T21'
export * from './T22'
export * from './T23'
export * from './T24'
export * from './T25'
export * from './T26'
export * from './T27'
export * from './Tx1'
export * from './Tx2'
export * from './SimpleTemplate'
