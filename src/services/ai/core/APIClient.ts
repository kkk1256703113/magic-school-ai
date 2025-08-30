import { logger } from '@/utils/logger'
import { RequestQueue } from './RequestQueue'
import { APIError, PredictionResponse } from '../types/ai.types'

/**
 * 统一的API客户端
 * 处理所有Replicate API调用
 */
export class APIClient {
  private queue: RequestQueue
  private baseURL = '/api/replicate/v1'

  constructor(maxConcurrent = 3) {
    this.queue = new RequestQueue(maxConcurrent)
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    const token = import.meta.env.VITE_REPLICATE_API_TOKEN
    if (!token) {
      throw new APIError(401, 'Unauthorized', 'Replicate API token未配置')
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * 创建预测任务
   */
  async createPrediction(
    model: string,
    input: any,
    signal?: AbortSignal
  ): Promise<PredictionResponse> {
    // 检查signal是否已经被abort
    if (signal?.aborted) {
      logger.warn('createPrediction: Signal已经被abort，不执行API调用')
      throw new DOMException('Aborted', 'AbortError')
    }

    return this.queue.add(async () => {
      const url = `${this.baseURL}/models/${model}/predictions`
      logger.info(`创建预测任务: ${url}`)

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ input }),
          signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          logger.error(`API调用失败: ${response.status}`, { errorText })
          throw new APIError(response.status, response.statusText, errorText)
        }

        const result = await response.json()
        logger.info('预测任务创建成功', { id: result.id })
        return result
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.info('API调用被用户取消')
          throw error
        }
        logger.error('创建预测任务失败', { error })
        throw error
      }
    })
  }

  /**
   * 轮询获取预测结果
   */
  async pollPredictionResult(
    predictionId: string,
    signal?: AbortSignal,
    maxAttempts = 50,
    intervalMs = 3000
  ): Promise<any> {
    logger.info(`开始轮询预测结果: ${predictionId}`)
    logger.info(`最大尝试次数: ${maxAttempts}, 间隔: ${intervalMs}ms`)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // 检查是否被取消
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      try {
        const response = await fetch(
          `${this.baseURL}/predictions/${predictionId}`,
          {
            method: 'GET',
            headers: this.getHeaders(),
            signal
          }
        )

        if (!response.ok) {
          throw new APIError(
            response.status,
            response.statusText,
            `获取预测状态失败: ${response.status}`
          )
        }

        const result: PredictionResponse = await response.json()
        logger.info(`轮询尝试 ${attempt}/${maxAttempts}, 状态: ${result.status}`)

        switch (result.status) {
          case 'succeeded':
            logger.success('预测完成')
            const output = Array.isArray(result.output) 
              ? result.output.join('') 
              : result.output
            return output
            
          case 'failed':
            logger.error('预测失败', { error: result.error })
            throw new Error(`预测失败: ${result.error}`)
            
          case 'canceled':
            throw new Error('预测被取消')
            
          default:
            // starting, processing - 继续等待
            if (attempt < maxAttempts) {
              await this.wait(intervalMs, signal)
            }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }

        logger.error(`轮询失败 (尝试 ${attempt}/${maxAttempts}):`, { error })
        
        if (attempt === maxAttempts) {
          throw error
        }
        
        await this.wait(intervalMs, signal)
      }
    }

    throw new Error('预测超时，请稍后重试')
  }

  /**
   * 支持中断的等待
   */
  private wait(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      signal?.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })
  }

  /**
   * 验证模型可用性
   */
  async validateModel(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models/${model}`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      
      return response.ok
    } catch (error) {
      logger.error(`模型验证失败: ${model}`, { error })
      return false
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus() {
    return this.queue.getStatus()
  }
}