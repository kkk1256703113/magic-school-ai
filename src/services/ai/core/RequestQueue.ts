import { logger } from '@/utils/logger'

/**
 * 请求队列管理器
 * 控制并发请求数量，避免API限流
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent: number

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * 添加请求到队列
   */
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.running++
          logger.info(`请求开始执行，当前并发数: ${this.running}/${this.maxConcurrent}`)
          
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.running--
          logger.info(`请求完成，当前并发数: ${this.running}/${this.maxConcurrent}`)
          this.processQueue()
        }
      }

      if (this.running < this.maxConcurrent) {
        task()
      } else {
        this.queue.push(task)
        logger.info(`请求加入队列，队列长度: ${this.queue.length}`)
      }
    })
  }

  /**
   * 处理队列中的下一个请求
   */
  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const nextTask = this.queue.shift()
      if (nextTask) {
        nextTask()
      }
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent
    }
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = []
    logger.warn('请求队列已清空')
  }

  /**
   * 更新最大并发数
   */
  setMaxConcurrent(max: number) {
    this.maxConcurrent = max
    logger.info(`最大并发数更新为: ${max}`)
    this.processQueue()
  }
}