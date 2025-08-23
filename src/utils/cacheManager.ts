import { logger } from './logger'

// 缓存项接口
interface CacheItem<T> {
  key: string
  data: T
  timestamp: number
  expiresAt: number
  hits: number
  size: number
}

// 缓存配置
interface CacheConfig {
  maxSize: number // 最大缓存大小 (字节)
  defaultTTL: number // 默认生存时间 (毫秒)
  maxItems: number // 最大缓存项数量
  cleanupInterval: number // 清理间隔 (毫秒)
}

// 缓存统计
interface CacheStats {
  totalItems: number
  totalSize: number
  hitRate: number
  totalHits: number
  totalRequests: number
  oldestItem: number
  newestItem: number
}

// 缓存策略枚举
enum EvictionPolicy {
  LRU = 'lru', // 最近最少使用
  LFU = 'lfu', // 最不经常使用
  FIFO = 'fifo' // 先进先出
}

/**
 * 智能缓存管理器
 * 支持多种缓存策略，自动清理，内存管理
 */
export class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private accessOrder: string[] = [] // LRU 访问顺序
  private config: CacheConfig
  private stats = {
    totalHits: 0,
    totalRequests: 0
  }
  private cleanupTimer?: ReturnType<typeof setTimeout>

  constructor(
    private name: string,
    config: Partial<CacheConfig> = {},
    private evictionPolicy: EvictionPolicy = EvictionPolicy.LRU
  ) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 60 * 60 * 1000, // 1小时
      maxItems: 1000,
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...config
    }

    this.startCleanupTimer()
    logger.info(`缓存管理器已初始化: ${name}`, {
      config: this.config,
      policy: evictionPolicy
    }, 'CacheManager')
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 生存时间 (毫秒)
   */
  set(key: string, data: T, ttl: number = this.config.defaultTTL): boolean {
    try {
      const now = Date.now()
      const dataSize = this.calculateSize(data)
      
      // 检查单个项目是否超过最大缓存大小
      if (dataSize > this.config.maxSize) {
        logger.warn('缓存项过大，跳过缓存', {
          key,
          size: dataSize,
          maxSize: this.config.maxSize
        }, 'CacheManager')
        return false
      }

      // 检查是否需要腾出空间
      this.evictIfNeeded(dataSize)

      const cacheItem: CacheItem<T> = {
        key,
        data,
        timestamp: now,
        expiresAt: now + ttl,
        hits: 0,
        size: dataSize
      }

      // 如果键已存在，先删除旧的
      if (this.cache.has(key)) {
        this.delete(key)
      }

      this.cache.set(key, cacheItem)
      this.updateAccessOrder(key)

      logger.info('缓存项已设置', {
        cache: this.name,
        key,
        size: dataSize,
        ttl,
        totalItems: this.cache.size
      }, 'CacheManager')

      return true
    } catch (error) {
      logger.error('设置缓存项失败', { key, error }, 'CacheManager')
      return false
    }
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存的数据或null
   */
  get(key: string): T | null {
    this.stats.totalRequests++

    const item = this.cache.get(key)
    
    if (!item) {
      logger.info('缓存未命中', { cache: this.name, key }, 'CacheManager')
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.delete(key)
      logger.info('缓存已过期', { cache: this.name, key }, 'CacheManager')
      return null
    }

    // 更新统计
    item.hits++
    this.stats.totalHits++
    this.updateAccessOrder(key)

    logger.info('缓存命中', {
      cache: this.name,
      key,
      hits: item.hits,
      age: Date.now() - item.timestamp
    }, 'CacheManager')

    return item.data
  }

  /**
   * 检查缓存键是否存在且未过期
   * @param key 缓存键
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expiresAt) {
      this.delete(key)
      return false
    }
    
    return true
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.removeFromAccessOrder(key)
      logger.info('缓存项已删除', { cache: this.name, key }, 'CacheManager')
    }
    return deleted
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const itemCount = this.cache.size
    this.cache.clear()
    this.accessOrder = []
    this.stats = { totalHits: 0, totalRequests: 0 }
    
    logger.info('缓存已清空', {
      cache: this.name,
      clearedItems: itemCount
    }, 'CacheManager')
  }

  /**
   * 获取或设置缓存（缓存穿透保护）
   * @param key 缓存键
   * @param factory 数据工厂函数
   * @param ttl 生存时间
   */
  async getOrSet<R = T>(
    key: string,
    factory: () => Promise<R>,
    ttl: number = this.config.defaultTTL
  ): Promise<R> {
    // 检查缓存
    const cached = this.get(key) as R
    if (cached !== null) {
      return cached
    }

    // 缓存未命中，调用工厂函数
    logger.info('缓存未命中，调用工厂函数', { cache: this.name, key }, 'CacheManager')
    
    try {
      const data = await factory()
      this.set(key, data as any, ttl)
      return data
    } catch (error) {
      logger.error('工厂函数执行失败', { cache: this.name, key, error }, 'CacheManager')
      throw error
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const items = Array.from(this.cache.values())
    const totalSize = items.reduce((sum, item) => sum + item.size, 0)
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0

    const timestamps = items.map(item => item.timestamp)
    const oldestItem = timestamps.length > 0 ? Math.min(...timestamps) : 0
    const newestItem = timestamps.length > 0 ? Math.max(...timestamps) : 0

    return {
      totalItems: this.cache.size,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.stats.totalHits,
      totalRequests: this.stats.totalRequests,
      oldestItem,
      newestItem
    }
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存大小（字节）
   */
  getSize(): number {
    return Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0)
  }

  /**
   * 计算数据大小
   * @param data 数据对象
   */
  private calculateSize(data: T): number {
    try {
      // 简单的JSON字符串长度估算
      const jsonString = JSON.stringify(data)
      return new Blob([jsonString]).size
    } catch (error) {
      // 如果无法序列化，返回估算大小
      return 1024 // 1KB 默认大小
    }
  }

  /**
   * 需要时执行缓存驱逐
   * @param newItemSize 新项目大小
   */
  private evictIfNeeded(newItemSize: number): void {
    const currentSize = this.getSize()
    const totalSizeAfterAdd = currentSize + newItemSize

    // 检查大小限制
    if (totalSizeAfterAdd > this.config.maxSize || this.cache.size >= this.config.maxItems) {
      const itemsToEvict = this.selectItemsForEviction(newItemSize)
      
      for (const key of itemsToEvict) {
        this.delete(key)
        logger.info('驱逐缓存项', {
          cache: this.name,
          key,
          reason: 'space_needed'
        }, 'CacheManager')
      }
    }
  }

  /**
   * 选择要驱逐的缓存项
   * @param spaceNeeded 需要的空间
   */
  private selectItemsForEviction(spaceNeeded: number): string[] {
    const items = Array.from(this.cache.entries())
    const itemsToEvict: string[] = []
    let freedSpace = 0

    // 根据策略排序
    switch (this.evictionPolicy) {
      case EvictionPolicy.LRU:
        // 按访问顺序排序，最少使用的在前
        items.sort((a, b) => {
          const aIndex = this.accessOrder.indexOf(a[0])
          const bIndex = this.accessOrder.indexOf(b[0])
          return aIndex - bIndex
        })
        break

      case EvictionPolicy.LFU:
        // 按访问次数排序
        items.sort((a, b) => a[1].hits - b[1].hits)
        break

      case EvictionPolicy.FIFO:
        // 按时间戳排序
        items.sort((a, b) => a[1].timestamp - b[1].timestamp)
        break
    }

    // 选择要驱逐的项目
    for (const [key, item] of items) {
      itemsToEvict.push(key)
      freedSpace += item.size
      
      if (freedSpace >= spaceNeeded) {
        break
      }
    }

    return itemsToEvict
  }

  /**
   * 更新访问顺序（LRU）
   * @param key 缓存键
   */
  private updateAccessOrder(key: string): void {
    // 移除旧位置
    this.removeFromAccessOrder(key)
    // 添加到末尾
    this.accessOrder.push(key)
  }

  /**
   * 从访问顺序中移除键
   * @param key 缓存键
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * 清理过期项目
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key)
      }
    }

    if (expiredKeys.length > 0) {
      for (const key of expiredKeys) {
        this.delete(key)
      }
      
      logger.info('清理过期缓存项', {
        cache: this.name,
        cleanedItems: expiredKeys.length,
        remainingItems: this.cache.size
      }, 'CacheManager')
    }
  }

  /**
   * 启动定时清理
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止定时清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanup()
    this.clear()
    logger.info(`缓存管理器已销毁: ${this.name}`, {}, 'CacheManager')
  }
}

// 创建专门的缓存实例
export const apiResultCache = new CacheManager('APIResults', {
  maxSize: 20 * 1024 * 1024, // 20MB
  defaultTTL: 2 * 60 * 60 * 1000, // 2小时
  maxItems: 500,
  cleanupInterval: 10 * 60 * 1000 // 10分钟
})

export const fileContentCache = new CacheManager('FileContent', {
  maxSize: 30 * 1024 * 1024, // 30MB
  defaultTTL: 4 * 60 * 60 * 1000, // 4小时
  maxItems: 200,
  cleanupInterval: 15 * 60 * 1000 // 15分钟
})

export const sessionCache = new CacheManager('ProcessingSessions', {
  maxSize: 10 * 1024 * 1024, // 10MB
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
  maxItems: 100,
  cleanupInterval: 30 * 60 * 1000 // 30分钟
})

// 缓存键生成工具
export const CacheKeys = {
  ocrResult: (fileHash: string) => `ocr:${fileHash}`,
  formulaResult: (fileHash: string) => `formula:${fileHash}`,
  analysisResult: (contentHash: string) => `analysis:${contentHash}`,
  visualizationResult: (dataHash: string, style: string) => `viz:${dataHash}:${style}`,
  fileHash: (file: File) => `file:${file.name}:${file.size}:${file.lastModified}`,
  session: (sessionId: string) => `session:${sessionId}`
}

// 文件哈希生成
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 内容哈希生成
export const generateContentHash = (content: string): string => {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash).toString(36)
}
