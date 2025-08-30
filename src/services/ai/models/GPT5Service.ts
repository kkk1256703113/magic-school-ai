import { logger } from '@/utils/logger'
import { AIServiceBase } from '../core/AIServiceBase'
import { getModelEndpoint } from '../config/apiConfig'
import { ContentInput } from '../types/ai.types'
import { HTMLPrompts } from '../prompts/htmlPrompt'
import { promptVersionManager } from '../core/PromptVersionManager'
import { 
  ContentAnalysisResponse, 
  HTMLVisualizationResponse,
  FormulaResponse,
  VisualizationResponse 
} from '@/types'
import { cleanHTMLContent, isValidHTMLDocument } from '@/utils/contentAnalysis'

/**
 * GPT-5模型服务
 */
export class GPT5Service extends AIServiceBase {
  constructor() {
    super('gpt5')
  }

  protected getModelEndpoint(): string {
    return getModelEndpoint('gpt5')
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
   * 分析内容
   */
  async analyzeContent(
    content: string,
    files?: File[],
    signal?: AbortSignal
  ): Promise<ContentAnalysisResponse> {
    logger.info('GPT-5开始分析内容', { contentLength: content.length })
    
    return this.executeWithAuth(async () => {
      const prompt = this.buildAnalysisPrompt(content, files)
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        prompt,
        signal
      )
      
      const result = await this.apiClient.pollPredictionResult(
        prediction.id,
        signal
      )
      
      return this.parseAnalysisResult(result)
    }, 'analyzeContent', 0.5)
  }

  /**
   * 生成HTML
   */
  async generateHTML(
    content: string,
    files?: File[],
    signal?: AbortSignal
  ): Promise<HTMLVisualizationResponse> {
    logger.info('GPT-5开始生成HTML', { contentLength: content.length })
    
    return this.executeWithAuth(async () => {
      const promptConfig = HTMLPrompts.getGenerationPrompt(content, files)
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        promptConfig,
        signal
      )
      
      const result = await this.apiClient.pollPredictionResult(
        prediction.id,
        signal
      )
      
      return this.processHTMLResult(result)
    }, 'generateHTML', 1)
  }

  /**
   * 解析公式
   */
  async parseFormulas(file: File): Promise<FormulaResponse> {
    logger.info('GPT-5开始解析公式', { fileName: file.name })
    
    return this.executeWithAuth(async () => {
      const prompt = this.buildFormulaPrompt(file)
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        prompt
      )
      
      const result = await this.apiClient.pollPredictionResult(prediction.id)
      
      try {
        return JSON.parse(result)
      } catch {
        // 降级方案
        return {
          formulas: [
            {
              latex: "y = x",
              category: "math",
              explanation: "基本线性函数",
              difficulty: "basic",
              confidence: 0.8
            }
          ]
        }
      }
    }, 'parseFormulas', 0.3)
  }

  /**
   * 生成可视化
   */
  async generateVisualization(
    data: any,
    style: string = 'modern',
    signal?: AbortSignal
  ): Promise<VisualizationResponse> {
    logger.info('GPT-5开始生成可视化', { style })
    
    return this.executeWithAuth(async () => {
      const prompt = this.buildVisualizationPrompt(data, style)
      
      const prediction = await this.apiClient.createPrediction(
        this.getModelEndpoint(),
        prompt,
        signal
      )
      
      const result = await this.apiClient.pollPredictionResult(
        prediction.id,
        signal
      )
      
      return this.parseVisualizationResult(result)
    }, 'generateVisualization', 0.5)
  }

  /**
   * 构建分析提示词（稳定版本）
   */
  private buildAnalysisPromptStable(content: string, files?: File[]) {
    let fileContext = ''
    if (files?.length) {
      fileContext = `检测到${files.length}个文件。`
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

## 输出要求
提供完整可运行的单一HTML文件，包含所有必要的css和Javascript
确保代码符合W3c标准，无错误警告
页面在不同浏览器中保持一致的外观和功能`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'medium'
    }
  }

  /**
   * 构建分析提示词（版本选择入口）
   */
  private buildAnalysisPrompt(content: string, files?: File[]) {
    const version = promptVersionManager.getCurrentVersion()
    
    switch (version) {
      case 'enhanced':
        return this.buildAnalysisPromptEnhanced(content, files)
      case 'stable':
      default:
        return this.buildAnalysisPromptStable(content, files)
    }
  }

  /**
   * 构建分析提示词（增强版本 - 内容完整性优化版本）
   */
  private buildAnalysisPromptEnhanced(content: string, files?: File[]) {
    let fileContext = ''
    if (files?.length) {
      fileContext = `检测到${files.length}个文件，需要综合分析所有内容。`
    }
    
    return {
      prompt: `我给你一个文件，一段内容，利用GPT-5的强大理解能力，将其转化为美观漂亮的中文可视化网页作品集，确保完整展示所有原文内容:

文本内容：${content}
${fileContext}

## GPT-5专属优势发挥
充分发挥GPT-5的深度理解和生成能力：
1. **精准结构分析**：准确识别文本的层次结构、逻辑关系和信息层级
2. **完整性保障**：确保所有内容要点都得到充分展现，不遗漏任何重要信息
3. **智能模块规划**：合理划分模块，确保逻辑清晰且符合用户认知习惯

## 内容完整性要求
1. **完整展示所有内容**：原文有多少个步骤、列表项、要点就展示多少个，不允许省略
2. **保持原文结构**：按照原文的层次结构和逻辑顺序组织内容
3. **精确对应原文模块**：只基于原文实际内容创建模块，不添加原文不存在的部分
4. **避免空模块**：每个模块都必须有具体内容，不创建占位模块

## 核心设计要求
保持原文件的核心信息，以更易读、可视化的方式呈现所有内容
在页面底部添加作者信息区域，包含:
*作者姓名:[Magic School AI]
*社交媒体链接:至少包含Twitter/x
*版权信息和年份

## 设计风格
整体风格参考Linear App的简约现代设计
使用清晰的视觉层次结构，突出重要内容
配色方案应专业、和谐，适合长时间阅读
为每个步骤/要点添加独特的视觉标识

## 主题切换功能（必须实现）
实现完整的深色/浅色模式切换功能：
1. 为所有颜色定义CSS变量，确保主题切换时所有元素都能正确变色
2. 添加JavaScript切换逻辑，支持localStorage状态持久化
3. 添加明显的主题切换按钮，点击时能够立即切换主题
4. 所有颜色变化都要有CSS transition过渡效果

## 技术规范
使用HTML5、Tailwind CSS 3.0+(通过CDN引入)和必要的JavaScript
代码结构清晰，包含适当注释，便于理解和维护
确保主题切换功能在所有浏览器中正常工作

## 响应式设计
页面必须在所有设备上(手机、平板、桌面)完美展示
针对不同屏幕尺寸优化布局和字体大小
确保移动端有良好的触控体验

## 图标与视觉元素
使用专业图标库如Font Awesome或Material Icons(通过CDN引入)
为每个步骤添加进度指示器或序号标识
根据内容主题选择合适的插图或图表展示数据
避免使用emoji作为主要图标

## 交互体验
添加适当的微交互效果提升用户体验
按钮悬停时有轻微放大和颜色变化
卡片元素悬停时有精致的阴影和边框效果
页面滚动时有平滑过渡效果
内容区块加载时有优雅的淡入动画

## 内容组织优化
步骤类内容使用数字标识、进度条、时间线等视觉元素
列表内容使用图标、颜色编码、分组展示
分类内容使用卡片布局、标签系统
重点内容使用高亮背景、边框、特殊字体强调

## 性能优化
确保页面加载速度快，避免不必要的大型资源
实现懒加载技术用于长页面内容

## 输出要求
提供完整可运行的单一HTML文件，包含所有必要的CSS和JavaScript
确保代码符合W3C标准，无错误警告
页面在不同浏览器中保持一致的外观和功能
请根据上传文件的内容类型(文档、数据、图片等)，创建最适合展示该内容的可视化网页。

重要提醒：请首先分析原文的完整结构，确保可视化网页包含原文的所有内容要素，不遗漏任何步骤或要点。`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'medium'
    }
  }

  /**
   * 构建公式提示词
   */
  private buildFormulaPrompt(file: File) {
    return {
      prompt: `分析文件"${file.name}"中的数学公式，生成LaTeX格式的公式列表。`,
      max_tokens: 8000,
      reasoning_effort: 'medium',
      verbosity: 'medium'
    }
  }

  /**
   * 构建可视化提示词
   */
  private buildVisualizationPrompt(data: any, style: string) {
    return {
      prompt: `根据数据生成${style}风格的可视化代码：${JSON.stringify(data)}`,
      max_tokens: 8000,
      reasoning_effort: 'medium',
      verbosity: 'high'
    }
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(result: any): ContentAnalysisResponse {
    try {
      if (typeof result === 'string' && result.trim()) {
        // 尝试提取JSON
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            logger.info('GPT-5 JSON解析成功')
            return parsed
          } catch (parseError) {
            // JSON解析失败，返回HTML内容
            logger.info('GPT-5 JSON解析失败，作为HTML处理')
          }
        }
        
        // 如果是HTML内容或其他文本，按照原文件格式返回
        logger.info('GPT-5返回HTML内容，保持原始格式')
        return result  // 直接返回原始HTML内容
      } else if (Array.isArray(result)) {
        // 如果是数组，合并为字符串
        const htmlContent = result.join('')
        logger.info('GPT-5返回数组格式，合并为HTML')
        return htmlContent
      } else if (result && typeof result === 'object') {
        // 如果已经是对象，直接返回
        logger.info('GPT-5返回对象格式')
        return result as ContentAnalysisResponse
      } else {
        // 空内容或异常格式
        throw new Error('GPT-5返回空内容或格式异常')
      }
    } catch (error) {
      logger.error('解析GPT-5分析结果失败', { error })
      throw new Error('无法解析分析结果')
    }
  }

  /**
   * 处理HTML结果
   */
  private processHTMLResult(result: any): HTMLVisualizationResponse {
    let htmlContent: string
    
    if (typeof result === 'string') {
      htmlContent = result
    } else if (Array.isArray(result)) {
      htmlContent = result.join('')
    } else {
      throw new Error('无法解析HTML内容')
    }
    
    // 清理HTML内容
    htmlContent = cleanHTMLContent(htmlContent)
    
    // 验证HTML
    if (!isValidHTMLDocument(htmlContent)) {
      logger.warn('生成的内容可能不是完整的HTML文档')
    }
    
    return {
      htmlContent,
      title: "GPT-5生成的可视化页面",
      description: "基于内容生成的HTML作品集",
      generatedAt: new Date(),
      fileSize: new Blob([htmlContent]).size,
      model: 'gpt5'
    }
  }

  /**
   * 解析可视化结果
   */
  private parseVisualizationResult(result: any): VisualizationResponse {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result
      
      return {
        generatedImage: parsed.generatedImage,
        codeOptions: parsed
      }
    } catch {
      // 降级方案
      return this.getFallbackVisualization()
    }
  }

  /**
   * 获取降级可视化方案
   */
  private getFallbackVisualization(): VisualizationResponse {
    const svgCode = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <line x1="50" y1="250" x2="350" y2="250" stroke="#666" stroke-width="1"/>
        <line x1="50" y1="250" x2="350" y2="50" stroke="#3b82f6" stroke-width="2"/>
      </svg>
    `
    
    return {
      generatedImage: "data:image/svg+xml;base64," + btoa(svgCode),
      codeOptions: {
        chartjs: {
          config: {
            type: 'line',
            data: {
              labels: [-5, 0, 5],
              datasets: [{
                label: 'y = x',
                data: [-5, 0, 5],
                borderColor: '#3b82f6'
              }]
            }
          },
          description: "降级方案：线性函数图表"
        },
        svg: {
          code: svgCode,
          description: "降级方案：SVG图像"
        }
      }
    }
  }
}