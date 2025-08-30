import { logger } from '@/utils/logger'
import { GPT5Service } from '../models/GPT5Service'
import { ClaudeService } from '../models/ClaudeService'
import { ModelType } from '../types/ai.types'
import { HTMLVisualizationResponse } from '@/types'

/**
 * HTML生成器
 * 负责生成可视化HTML页面
 */
export class HTMLGenerator {
  private modelService: GPT5Service | ClaudeService

  constructor(model: ModelType = 'gpt5') {
    this.modelService = this.createModelService(model)
  }

  /**
   * 创建模型服务实例
   */
  private createModelService(model: ModelType) {
    switch (model) {
      case 'claude4':
        logger.info('使用Claude 4模型生成HTML')
        return new ClaudeService()
      case 'gpt5':
      default:
        logger.info('使用GPT-5模型生成HTML')
        return new GPT5Service()
    }
  }

  /**
   * 生成HTML页面
   */
  async generate(
    content: string,
    files?: File[],
    signal?: AbortSignal
  ): Promise<HTMLVisualizationResponse> {
    try {
      logger.info('开始生成HTML页面', {
        contentLength: content.length,
        filesCount: files?.length || 0
      })

      // 调用对应模型的HTML生成方法
      const result = await this.modelService.generateHTML(content, files, signal)
      
      logger.success('HTML页面生成成功', {
        htmlLength: result.htmlContent.length,
        fileSize: result.fileSize
      })

      return result
    } catch (error) {
      // 处理取消操作
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.info('HTML生成被用户取消')
        throw new Error('生成已取消')
      }

      logger.error('HTML生成失败', { error })
      throw error
    }
  }

  /**
   * 批量生成HTML（支持多个内容）
   */
  async generateBatch(
    contents: Array<{ content: string; files?: File[] }>,
    model: ModelType = 'gpt5'
  ): Promise<HTMLVisualizationResponse[]> {
    logger.info(`批量生成HTML，共${contents.length}个任务`)
    
    const results: HTMLVisualizationResponse[] = []
    
    for (let i = 0; i < contents.length; i++) {
      try {
        logger.info(`处理第${i + 1}/${contents.length}个任务`)
        const result = await this.generate(
          contents[i].content,
          contents[i].files
        )
        results.push(result)
      } catch (error) {
        logger.error(`第${i + 1}个任务失败`, { error })
        // 继续处理其他任务
        results.push({
          htmlContent: '<html><body>生成失败</body></html>',
          title: '生成失败',
          description: error instanceof Error ? error.message : '未知错误',
          generatedAt: new Date(),
          fileSize: 0,
          model
        })
      }
    }
    
    return results
  }

  /**
   * 预览HTML（生成简化版）
   */
  async generatePreview(
    content: string,
    _model: ModelType = 'gpt5'
  ): Promise<string> {
    logger.info('生成HTML预览')
    
    // 截取内容，生成预览版
    const previewContent = content.substring(0, 500) + '...'
    const result = await this.generate(previewContent)
    
    return result.htmlContent
  }

  /**
   * 切换模型
   */
  switchModel(model: ModelType) {
    logger.info(`切换到${model}模型`)
    this.modelService = this.createModelService(model)
  }

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): ModelType {
    if (this.modelService instanceof ClaudeService) {
      return 'claude4'
    }
    return 'gpt5'
  }
}