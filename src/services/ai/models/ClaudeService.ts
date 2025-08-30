import { logger } from '@/utils/logger'
import { AIServiceBase } from '../core/AIServiceBase'
import { getModelEndpoint } from '../config/apiConfig'
import { ContentInput } from '../types/ai.types'
import { HTMLPrompts } from '../prompts/htmlPrompt'
import { 
  ContentAnalysisResponse, 
  HTMLVisualizationResponse 
} from '@/types'
import { cleanHTMLContent, isValidHTMLDocument } from '@/utils/contentAnalysis'

/**
 * Claude 4 Sonnet模型服务
 */
export class ClaudeService extends AIServiceBase {
  constructor() {
    super('claude4')
  }

  protected getModelEndpoint(): string {
    return getModelEndpoint('claude4')
  }

  /**
   * 生成内容
   */
  async generateContent(input: ContentInput): Promise<any> {
    return this.executeWithAuth(async () => {
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        input,
        input.signal
      )
      
      return this.apiClient.pollPredictionResult(
        prediction.id,
        input.signal
      )
    }, 'generateContent')
  }

  /**
   * 分析内容（Claude特色：深度理解）
   */
  async analyzeContent(
    content: string,
    files?: File[],
    signal?: AbortSignal
  ): Promise<ContentAnalysisResponse> {
    logger.info('Claude 4开始深度分析内容', { 
      contentLength: content.length,
      model: 'claude-4-sonnet'
    })
    
    return this.executeWithAuth(async () => {
      const prompt = this.buildClaudeAnalysisPrompt(content, files)
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        prompt,
        signal
      )
      
      const result = await this.apiClient.pollPredictionResult(
        prediction.id,
        signal
      )
      
      return this.parseClaudeAnalysisResult(result)
    }, 'analyzeContent', 0.5)
  }

  /**
   * 生成HTML（Claude特色：更注重语义和结构）
   */
  async generateHTML(
    content: string,
    files?: File[],
    signal?: AbortSignal
  ): Promise<HTMLVisualizationResponse> {
    logger.info('Claude 4开始生成语义化HTML', { contentLength: content.length })
    
    return this.executeWithAuth(async () => {
      const promptConfig = HTMLPrompts.getGenerationPrompt(content, files)
      
      // Claude特定参数调整
      const claudeInput = {
        ...promptConfig,
        max_tokens: 8000,  // Claude支持更长的输出
        temperature: 0.3   // 更稳定的输出
      }
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        claudeInput,
        signal
      )
      
      const result = await this.apiClient.pollPredictionResult(
        prediction.id,
        signal
      )
      
      return this.processClaudeHTMLResult(result)
    }, 'generateHTML', 1)
  }

  /**
   * 构建Claude分析提示词（更详细的分析要求）
   */
  private buildClaudeAnalysisPrompt(content: string, files?: File[]) {
    let fileContext = ''
    if (files?.length) {
      fileContext = `包含${files.length}个附加文件，需要综合分析。`
    }
    
    return {
      prompt: `我给你一个文件，一段内容，分析内容，并将其转化为美观漂亮的中文可视化网页作品集:

文本内容：${content}
${fileContext}

## 内容要求
保持原文件的核心信息，但以更易读、可视化的方式呈现
在页面底部添加作者信息区域，包含:
*作者姓名:[Magic School AI]
*社交媒体链接:至少包含Twitter/x:
版权信息和年份

## 设计风格
整体风格参考Linear App的简约现代设计
使用清晰的视觉层次结构，突出重要内容
配色方案应专业、和谐，适合长时间阅读

##技术规范
使用HTML5、Tailwindcss 3.0+(通过CDN引入)和必要的Javascript
实现完整的深色/浅色模式切换功能，默认跟随系统设置
代码结构清晰，包含适当注释，便于理解和维护

## 响应式设计
页面必须在所有设备上(手机、平板、桌面)完美展示
针对不同屏幕尺寸优化布局和字体大小
确保移动端有良好的触控体验

## 媒体资源
使用文档中的Markdown图片链接(如果有的话)
使用文档中的视频嵌入代码(如果有的话)

## 图标与视觉元素
使用专业图标库如Font Awesome或Material Icons(通过CDN引入)
根据内容主题选择合适的插图或图表展示数据
避免使用emoji作为主要图标

## 交互体验
添加适当的微交互效果提升用户体验
按钮悬停时有轻微放大和颜色变化
卡片元素悬停时有精致的阴影和边框效果
页面滚动时有平滑过渡效果
内容区块加载时有优雅的淡入动画

##性能优化
确保页面加载速度快，避免不必要的大型资源
实现懒加载技术用于长页面内容

## 输出要求
提供完整可运行的单一HTML文件，包含所有必要的css和Javascript
确保代码符合W3c标准，无错误警告
页面在不同浏览器中保持一致的外观和功能
请根据上传文件的内容类型(文档、数据、图片等)，创建最适合展示该内容的可视化网页。`,
      max_tokens: 8000,
      temperature: 0.3
    }
  }

  /**
   * 解析Claude分析结果（处理Claude特有的响应格式）
   */
  private parseClaudeAnalysisResult(result: any): ContentAnalysisResponse {
    try {
      // Claude返回HTML内容，按照原文件格式返回
      if (typeof result === 'string' && result.trim()) {
        logger.info('Claude返回HTML内容，保持原始格式')
        
        // 返回与原文件相同的格式
        return {
          claudeAnalysis: result  // 保持原始HTML内容
        } as any
      } else if (Array.isArray(result)) {
        // 如果是数组，合并为字符串
        const htmlContent = result.join('')
        logger.info('Claude返回数组格式，合并为HTML')
        return {
          claudeAnalysis: htmlContent
        } as any
      } else if (result && typeof result === 'object') {
        // 如果已经是对象，直接返回
        logger.info('Claude返回对象格式')
        return result as ContentAnalysisResponse
      } else {
        // 空内容或异常格式
        throw new Error('Claude返回空内容或格式异常')
      }
    } catch (error) {
      logger.error('解析Claude分析结果失败', { error })
      throw new Error('无法解析Claude分析结果')
    }
  }

  /**
   * 处理Claude HTML结果（更严格的验证）
   */
  private processClaudeHTMLResult(result: any): HTMLVisualizationResponse {
    let htmlContent: string
    
    if (typeof result === 'string') {
      htmlContent = result
    } else if (Array.isArray(result)) {
      htmlContent = result.join('')
    } else {
      throw new Error('无法解析Claude HTML输出')
    }
    
    // 清理HTML内容
    htmlContent = cleanHTMLContent(htmlContent)
    
    // Claude生成的HTML通常更规范，进行严格验证
    if (!isValidHTMLDocument(htmlContent)) {
      logger.warn('Claude生成的HTML未通过验证，可能需要修复')
      
      // 尝试修复
      if (!htmlContent.includes('<!DOCTYPE')) {
        htmlContent = '<!DOCTYPE html>\n' + htmlContent
      }
    }
    
    return {
      htmlContent,
      title: "Claude 4生成的语义化页面",
      description: "基于深度理解生成的HTML作品集",
      generatedAt: new Date(),
      fileSize: new Blob([htmlContent]).size,
      model: 'claude4'
    }
  }

  /**
   * Claude特色功能：生成教学内容
   */
  async generateEducationalContent(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<any> {
    return this.executeWithAuth(async () => {
      const prompt = {
        prompt: `为"${topic}"主题生成${level}级别的教学内容，包含：
        1. 概念解释
        2. 示例说明
        3. 练习题目
        4. 深入阅读建议`,
        max_tokens: 8000,
        temperature: 0.5
      }
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        { input: prompt }
      )
      
      return this.apiClient.pollPredictionResult(prediction.id)
    }, 'generateEducationalContent', 0.8)
  }

  /**
   * Claude特色功能：批判性思维分析
   */
  async criticalAnalysis(content: string): Promise<any> {
    return this.executeWithAuth(async () => {
      const prompt = {
        prompt: `对以下内容进行批判性分析：
        ${content}
        
        请从以下角度分析：
        1. 逻辑合理性
        2. 证据充分性
        3. 潜在偏见
        4. 改进建议`,
        max_tokens: 8000,
        temperature: 0.4
      }
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        { input: prompt }
      )
      
      return this.apiClient.pollPredictionResult(prediction.id)
    }, 'criticalAnalysis', 0.6)
  }
}