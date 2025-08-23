import { logger } from './logger'
import { TemporaryFileStorage } from '../types'
import { generateFileHash } from './cacheManager'

/**
 * 临时文件存储管理器
 * 在用户配置R2存储之前，使用内存和浏览器存储作为临时解决方案
 */
export class TemporaryStorageManager {
  private memoryStorage = new Map<string, TemporaryFileStorage>()
  private readonly MAX_MEMORY_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly MAX_ITEMS = 50
  private currentMemorySize = 0

  constructor() {
    // 启动定期清理
    this.startCleanupTimer()
    
    // 页面卸载时清理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup()
      })
    }

    logger.info('临时存储管理器已初始化', {
      maxMemorySize: this.MAX_MEMORY_SIZE,
      maxItems: this.MAX_ITEMS
    }, 'TemporaryStorage')
  }

  /**
   * 存储文件到临时存储
   * @param file 文件对象
   * @param expirationHours 过期小时数，默认24小时
   */
  async storeFile(file: File, expirationHours: number = 24): Promise<TemporaryFileStorage> {
    try {
      // 检查文件大小限制
      if (file.size > this.MAX_MEMORY_SIZE / 2) {
        throw new Error(`文件过大：${file.size}字节，最大支持${this.MAX_MEMORY_SIZE / 2}字节`)
      }

      // 生成文件哈希作为唯一标识
      const fileHash = await generateFileHash(file)
      const id = `temp_${fileHash}_${Date.now()}`

      // 检查是否已经存储
      const existingStorage = this.getFileByHash(fileHash)
      if (existingStorage && !this.isExpired(existingStorage)) {
        logger.info('文件已存在于临时存储中', { 
          fileId: existingStorage.id,
          fileName: file.name 
        }, 'TemporaryStorage')
        return existingStorage
      }

      // 转换为DataURL
      const dataUrl = await this.fileToDataURL(file)

      // 创建存储对象
      const storage: TemporaryFileStorage = {
        id,
        originalFile: file,
        dataUrl,
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000)
      }

      // 检查内存空间
      await this.ensureSpace(file.size)

      // 存储到内存
      this.memoryStorage.set(id, storage)
      this.currentMemorySize += file.size

      // 同时尝试存储到浏览器缓存（用于持久化）
      try {
        await this.storeToBrowserCache(id, storage)
      } catch (error) {
        logger.warn('浏览器缓存存储失败', { error }, 'TemporaryStorage')
      }

      logger.success('文件已存储到临时存储', {
        fileId: id,
        fileName: file.name,
        fileSize: file.size,
        expiresAt: storage.expiresAt,
        totalStoredItems: this.memoryStorage.size,
        currentMemorySize: this.currentMemorySize
      }, 'TemporaryStorage')

      return storage
    } catch (error) {
      logger.error('文件存储失败', { 
        fileName: file.name,
        error 
      }, 'TemporaryStorage')
      throw error
    }
  }

  /**
   * 通过ID获取存储的文件
   * @param id 文件ID
   */
  getFile(id: string): TemporaryFileStorage | null {
    // 先从内存获取
    let storage = this.memoryStorage.get(id)
    
    // 如果内存中没有，尝试从浏览器缓存获取
    if (!storage) {
      storage = this.getFromBrowserCache(id) || undefined
      if (storage) {
        // 重新加载到内存
        this.memoryStorage.set(id, storage)
        this.currentMemorySize += storage.originalFile.size
      }
    }

    if (!storage) {
      return null
    }

    // 检查是否过期
    if (this.isExpired(storage)) {
      this.deleteFile(id)
      return null
    }

    return storage
  }

  /**
   * 通过文件哈希获取存储的文件
   * @param fileHash 文件哈希
   */
  getFileByHash(fileHash: string): TemporaryFileStorage | null {
    for (const storage of this.memoryStorage.values()) {
      if (storage.id.includes(fileHash) && !this.isExpired(storage)) {
        return storage
      }
    }
    return null
  }

  /**
   * 删除存储的文件
   * @param id 文件ID
   */
  deleteFile(id: string): boolean {
    const storage = this.memoryStorage.get(id)
    if (storage) {
      this.memoryStorage.delete(id)
      this.currentMemorySize -= storage.originalFile.size
      
      // 同时从浏览器缓存删除
      this.deleteFromBrowserCache(id)
      
      logger.info('文件已从临时存储删除', { 
        fileId: id,
        fileName: storage.originalFile.name 
      }, 'TemporaryStorage')
      
      return true
    }
    return false
  }

  /**
   * 获取存储统计信息
   */
  getStats() {
    const totalItems = this.memoryStorage.size
    const totalSize = this.currentMemorySize
    const oldestFile = this.getOldestFile()
    const newestFile = this.getNewestFile()

    return {
      totalItems,
      totalSize,
      maxSize: this.MAX_MEMORY_SIZE,
      maxItems: this.MAX_ITEMS,
      utilizationPercentage: Math.round((totalSize / this.MAX_MEMORY_SIZE) * 100),
      oldestFile: oldestFile?.uploadedAt,
      newestFile: newestFile?.uploadedAt,
      availableSpace: this.MAX_MEMORY_SIZE - totalSize
    }
  }

  /**
   * 获取所有存储的文件列表
   */
  getAllFiles(): TemporaryFileStorage[] {
    return Array.from(this.memoryStorage.values())
      .filter(storage => !this.isExpired(storage))
  }

  /**
   * 清理过期文件
   */
  cleanup(): void {
    const now = new Date()
    const expiredIds: string[] = []

    for (const [id, storage] of this.memoryStorage.entries()) {
      if (now > storage.expiresAt) {
        expiredIds.push(id)
      }
    }

    if (expiredIds.length > 0) {
      for (const id of expiredIds) {
        this.deleteFile(id)
      }
      
      logger.info('清理过期临时文件', {
        expiredCount: expiredIds.length,
        remainingCount: this.memoryStorage.size
      }, 'TemporaryStorage')
    }
  }

  /**
   * 清空所有临时存储
   */
  clear(): void {
    const itemCount = this.memoryStorage.size
    this.memoryStorage.clear()
    this.currentMemorySize = 0
    
    // 清理浏览器缓存
    this.clearBrowserCache()
    
    logger.info('临时存储已清空', { 
      clearedItems: itemCount 
    }, 'TemporaryStorage')
  }

  /**
   * 文件转DataURL
   * @param file 文件对象
   */
  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * 检查文件是否过期
   * @param storage 存储对象
   */
  private isExpired(storage: TemporaryFileStorage): boolean {
    return new Date() > storage.expiresAt
  }

  /**
   * 确保有足够的存储空间
   * @param neededSize 需要的空间大小
   */
  private async ensureSpace(neededSize: number): Promise<void> {
    // 检查内存限制
    while (
      this.currentMemorySize + neededSize > this.MAX_MEMORY_SIZE ||
      this.memoryStorage.size >= this.MAX_ITEMS
    ) {
      const oldestFile = this.getOldestFile()
      if (oldestFile) {
        this.deleteFile(oldestFile.id)
        logger.info('删除最旧文件以腾出空间', {
          deletedFile: oldestFile.originalFile.name,
          freedSpace: oldestFile.originalFile.size
        }, 'TemporaryStorage')
      } else {
        break
      }
    }
  }

  /**
   * 获取最旧的文件
   */
  private getOldestFile(): TemporaryFileStorage | null {
    let oldest: TemporaryFileStorage | null = null
    
    for (const storage of this.memoryStorage.values()) {
      if (!oldest || storage.uploadedAt < oldest.uploadedAt) {
        oldest = storage
      }
    }
    
    return oldest
  }

  /**
   * 获取最新的文件
   */
  private getNewestFile(): TemporaryFileStorage | null {
    let newest: TemporaryFileStorage | null = null
    
    for (const storage of this.memoryStorage.values()) {
      if (!newest || storage.uploadedAt > newest.uploadedAt) {
        newest = storage
      }
    }
    
    return newest
  }

  /**
   * 存储到浏览器缓存 (IndexedDB)
   * @param id 文件ID
   * @param storage 存储对象
   */
  private async storeToBrowserCache(_id: string, tempStorage: TemporaryFileStorage): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return
    }

    try {
      const request = indexedDB.open('EduVisualizerTempStorage', 1)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['files'], 'readwrite')
        const store = transaction.objectStore('files')
        
        // 简化存储对象（不存储原始File对象）
        const simplifiedStorage = {
          id: tempStorage.id,
          fileName: tempStorage.originalFile.name,
          fileSize: tempStorage.originalFile.size,
          fileType: tempStorage.originalFile.type,
          dataUrl: tempStorage.dataUrl,
          uploadedAt: tempStorage.uploadedAt.toISOString(),
          expiresAt: tempStorage.expiresAt.toISOString()
        }
        
        store.put(simplifiedStorage)
      }
    } catch (error) {
      logger.warn('IndexedDB存储失败', { error }, 'TemporaryStorage')
    }
  }

  /**
   * 从浏览器缓存获取
   * @param id 文件ID
   */
  private getFromBrowserCache(_id: string): TemporaryFileStorage | null {
    // 这里简化实现，实际应该是异步的IndexedDB操作
    // 由于需要保持同步API，这里返回null
    // 在实际应用中可以考虑使用同步的localStorage（容量有限）
    return null
  }

  /**
   * 从浏览器缓存删除
   * @param id 文件ID
   */
  private deleteFromBrowserCache(_id: string): void {
    // IndexedDB删除操作的简化实现
  }

  /**
   * 清理浏览器缓存
   */
  private clearBrowserCache(): void {
    // IndexedDB清理操作的简化实现
  }

  /**
   * 启动定时清理器
   */
  private startCleanupTimer(): void {
    // 每10分钟清理一次过期文件
    setInterval(() => {
      this.cleanup()
    }, 10 * 60 * 1000)
  }
}

// 创建全局实例
export const temporaryStorage = new TemporaryStorageManager()

/**
 * 临时存储配置信息组件
 * 显示当前存储状态和配置说明
 */
export const TemporaryStorageInfo = {
  getConfigInstructions(): string {
    return `
## 🔧 配置Cloudflare R2存储

当前使用临时内存存储，文件将在页面刷新后丢失。
要启用持久化存储，请配置以下环境变量：

\`\`\`env
VITE_CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
VITE_CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
VITE_CLOUDFLARE_R2_ENDPOINT=your_endpoint_url
\`\`\`

### 获取配置信息：
1. 登录 Cloudflare Dashboard
2. 进入 R2 Object Storage
3. 创建存储桶或使用现有存储桶
4. 在 API tokens 中创建新的 R2 token
5. 复制相关配置信息到环境变量文件

配置完成后重启应用即可启用持久化存储。
    `
  },

  isTemporaryMode(): boolean {
    return !import.meta.env.VITE_CLOUDFLARE_R2_ACCOUNT_ID || 
           !import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID
  },

  getWarningMessage(): string {
    return '⚠️ 当前使用临时存储，文件将在页面刷新后丢失。请配置R2存储以启用持久化功能。'
  }
}
