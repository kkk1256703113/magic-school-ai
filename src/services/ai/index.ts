import { logger } from '@/utils/logger'
import { AuthManager } from './core/AuthManager'
import { HTMLGenerator } from './features/HTMLGenerator'
import { GPT5Service } from './models/GPT5Service'
import { ClaudeService } from './models/ClaudeService'
import { ModelType } from './types/ai.types'
import { temporaryStorage } from '@/utils/temporaryStorage'
import { 
  OCRResponse,
  FormulaResponse,
  VisualizationResponse,
  ContentAnalysisResponse,
  HTMLVisualizationResponse,
  TemporaryFileStorage
} from '@/types'

/**
 * Magic School AI 统一服务接口
 * 提供所有AI功能的统一访问点
 */
export class MagicSchoolAIService {
  private htmlGenerator: HTMLGenerator
  private gpt5Service: GPT5Service
  private claudeService: ClaudeService
  private currentModel: ModelType = 'gpt5'

  constructor() {
    this.htmlGenerator = new HTMLGenerator()
    this.gpt5Service = new GPT5Service()
    this.claudeService = new ClaudeService()
  }

  /**
   * 设置认证配置
   */
  setAuthConfig(
    token: string | null,
    checkLimit?: () => Promise<{ canUse: boolean; remaining: number }>,
    recordUsage?: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
  ) {
    AuthManager.getInstance().setConfig(token, checkLimit, recordUsage)
    logger.info('AI服务认证配置已更新')
  }

  /**
   * OCR文字识别（降级方案）
   */
  async extractText(file: File): Promise<OCRResponse> {
    logger.info('OCR文字识别（模拟）', { fileName: file.name })
    
    // 暂时返回模拟结果，实际应集成专门的OCR服务
    return {
      text: `从文件 "${file.name}" 中识别的文本内容（模拟）`,
      confidence: 0.85,
      blocks: [
        {
          text: "模拟识别的文本内容",
          position: { x: 0, y: 0, width: 300, height: 50 },
          confidence: 0.85
        }
      ]
    }
  }

  /**
   * 数学公式解析
   */
  async parseFormulas(file: File): Promise<FormulaResponse> {
    return this.gpt5Service.parseFormulas(file)
  }

  /**
   * 智能可视化生成
   */
  async generateVisualization(
    data: any,
    style: string = 'modern',
    selectedModel: ModelType = 'gpt5',
    signal?: AbortSignal
  ): Promise<VisualizationResponse> {
    if (selectedModel === 'gpt5') {
      return this.gpt5Service.generateVisualization(data, style, signal)
    }
    
    // Claude不支持可视化，使用GPT-5
    logger.info('Claude不支持可视化，切换到GPT-5')
    return this.gpt5Service.generateVisualization(data, style, signal)
  }

  /**
   * 内容分析
   */
  async analyzeContent(
    content: string,
    selectedModel: ModelType = 'gpt5',
    images?: File[],
    signal?: AbortSignal
  ): Promise<ContentAnalysisResponse> {
    logger.info(`使用${selectedModel}进行内容分析`)
    
    const service = selectedModel === 'claude4' ? this.claudeService : this.gpt5Service
    return service.analyzeContent(content, images, signal)
  }

  /**
   * Claude专属：深度内容分析
   */
  async analyzeContentWithClaude(
    content: string,
    images?: File[],
    signal?: AbortSignal
  ): Promise<ContentAnalysisResponse> {
    return this.claudeService.analyzeContent(content, images, signal)
  }

  /**
   * 生成HTML可视化页面
   */
  async generateHTMLVisualization(
    content: string,
    files?: File[],
    selectedModel: ModelType = 'gpt5',
    signal?: AbortSignal,
    language: 'zh' | 'en' = 'zh'
  ): Promise<HTMLVisualizationResponse> {
    this.htmlGenerator.switchModel(selectedModel)
    return this.htmlGenerator.generate(content, files, signal, language)
  }

  /**
   * 验证模型可用性
   */
  async validateModelAvailability(modelKey: ModelType): Promise<{
    available: boolean
    model: string
    error?: string
  }> {
    try {
      // const service = modelKey === 'claude4' ? this.claudeService : this.gpt5Service
      // 简单测试
      const available = true // 实际应该调用API验证
      return {
        available,
        model: modelKey
      }
    } catch (error) {
      return {
        available: false,
        model: modelKey,
        error: error instanceof Error ? error.message : '验证失败'
      }
    }
  }

  /**
   * 验证所有模型
   */
  async validateAllModels() {
    const results: Record<string, any> = {}
    
    for (const model of ['gpt5', 'claude4'] as ModelType[]) {
      results[model] = await this.validateModelAvailability(model)
    }
    
    return results
  }

  /**
   * 获取API状态
   */
  getAPIStatus() {
    return {
      isConfigured: true, // 由后端管理配置
      models: {
        gpt5: import.meta.env.VITE_GPT5_MODEL || 'openai/gpt-5',
        claude4: import.meta.env.VITE_CLAUDE4_MODEL || 'anthropic/claude-4-sonnet'
      },
      temporaryStorageCount: temporaryStorage.getAllFiles().length,
      currentModel: this.currentModel
    }
  }
}

// 导出服务实例
export const aiService = new MagicSchoolAIService()

// 导出setAuthConfig函数（保持兼容性）
export const setAuthConfig = (
  token: string | null,
  checkLimit?: () => Promise<{ canUse: boolean; remaining: number }>,
  recordUsage?: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
) => {
  aiService.setAuthConfig(token, checkLimit, recordUsage)
}

// 导出临时文件存储函数（保持兼容性）
export const storeTemporaryFile = async (file: File): Promise<TemporaryFileStorage> => {
  return temporaryStorage.storeFile(file)
}

export const getTemporaryFile = (id: string): TemporaryFileStorage | null => {
  return temporaryStorage.getFile(id)
}

// 导出类型
export * from './types/ai.types'