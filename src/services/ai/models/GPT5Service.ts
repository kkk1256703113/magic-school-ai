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
   * 构建分析提示词（增强版本 - 超详细版本）
   */
  private buildAnalysisPromptEnhanced(content: string, files?: File[]) {
    let fileContext = ''
    if (files?.length) {
      fileContext = `检测到${files.length}个文件，需要综合分析所有内容。`
    }
    
    return {
      prompt: `我给你一个文件，一段内容，请进行深度分析并将其转化为美观漂亮的中文可视化网页作品集。

文本内容：${content}
${fileContext}

## ⚠️ GPT-5专属：深度内容分析要求
作为GPT-5，你具有强大的内容理解和生成能力，请充分发挥以下优势：
1. **深度结构分析**：准确识别文本的层次结构、逻辑关系和信息层级
2. **完整性保证**：确保所有内容要点都得到充分展现，不遗漏任何重要信息
3. **智能组织**：合理规划模块划分，确保逻辑清晰且符合用户认知习惯

## ⚠️ 内容完整性要求（绝对严格）
1. **逐一展示原则**：
   - 如果原文有步骤1、2、3、4，必须全部显示，一个都不能少
   - 如果原文有分类A、B、C，必须全部创建对应模块
   - 如果原文有要点①②③④⑤，必须每个要点都有视觉呈现
   
2. **结构完整性**：
   - 严格按照原文的层次结构组织内容
   - 保持原文的逻辑顺序和重要性层级
   - 主要章节、次要章节、要点细节都要正确体现

3. **信息保真度**：
   - 所有数据、事实、观点都必须准确呈现
   - 不得简化或省略重要的细节信息
   - 保持原文的专业术语和准确表述

## ⚠️ 模块创建严格规范
1. **精确匹配原则**：
   - 原文有几个主要部分，就创建几个模块，数量必须精确
   - 不得添加原文不存在的虚构模块或占位模块
   - 每个模块的标题和内容都必须与原文对应

2. **内容验证流程**：
   - 生成前先分析：原文共有几个主要部分？
   - 逐一对应：每个部分的核心内容是什么？
   - 验证完整：是否有遗漏的重要信息？

## ⚠️ 主题切换功能实现（技术重点）
你必须生成包含完整主题切换功能的HTML页面：

1. **CSS变量系统**：
   
   :root {
     --bg-primary: #ffffff;
     --bg-secondary: #f8f9fa;
     --text-primary: #1a1a1a;
     --text-secondary: #6b7280;
     --accent-color: #3b82f6;
     --border-color: #e5e7eb;
   }
   
   .dark-theme {
     --bg-primary: #1a1a1a;
     --bg-secondary: #2d2d2d;
     --text-primary: #ffffff;
     --text-secondary: #a1a1aa;
     --accent-color: #60a5fa;
     --border-color: #404040;
   }

2. **JavaScript核心逻辑**（必须包含完整代码）：
   
   function toggleTheme() {
     const body = document.body;
     const themeIcon = document.querySelector('#theme-icon');
     const isDark = body.classList.contains('dark-theme');
     
     if (isDark) {
       body.classList.remove('dark-theme');
       localStorage.setItem('theme', 'light');
       if(themeIcon) themeIcon.textContent = '🌙';
     } else {
       body.classList.add('dark-theme');
       localStorage.setItem('theme', 'dark');
       if(themeIcon) themeIcon.textContent = '☀️';
     }
   }
   
   // 页面加载时初始化主题
   document.addEventListener('DOMContentLoaded', function() {
     const savedTheme = localStorage.getItem('theme') || 
       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
     
     if (savedTheme === 'dark') {
       document.body.classList.add('dark-theme');
       const themeIcon = document.querySelector('#theme-icon');
       if(themeIcon) themeIcon.textContent = '☀️';
     }
   });

## 设计风格升级
参考Linear App的简约现代设计，并增加以下特性：
- **层次感**：使用阴影、边框、间距营造视觉层次
- **呼吸感**：合理的留白和间距，避免内容拥挤
- **专业感**：统一的字体、颜色、图标系统
- **动态感**：适当的动画和过渡效果

## 视觉组织强化
1. **步骤类内容**：
   - 使用进度条、时间线、数字标识
   - 每个步骤都有独特的视觉标识
   - 添加完成状态的视觉反馈

2. **列表类内容**：
   - 使用图标、颜色编码区分不同类型
   - 重要程度用视觉权重体现
   - 可折叠/展开的交互设计

3. **分类类内容**：
   - 卡片式布局，每个分类独立模块
   - 标签系统标识类别属性
   - 支持筛选和搜索功能

## 交互体验专业化
1. **微交互设计**：
   - 按钮悬停：轻微放大+颜色变化+阴影
   - 卡片悬停：提升阴影+边框高亮
   - 链接悬停：下划线动画+颜色过渡

2. **加载和过渡**：
   - 页面加载：优雅的淡入动画
   - 内容切换：平滑的滑动过渡
   - 主题切换：颜色渐变过渡

3. **响应式交互**：
   - 移动端：触摸友好的按钮尺寸
   - 平板端：优化的手势操作
   - 桌面端：鼠标悬停效果

## 技术实现标准
- **HTML5语义化**：正确使用header、main、section、article等标签
- **CSS现代化**：使用Grid、Flexbox、CSS变量、自定义属性
- **JavaScript ES6+**：使用现代JavaScript语法和API
- **性能优化**：懒加载、防抖节流、资源压缩

## 输出质量保证
提供完整可运行的单一HTML文件，包含：
1. 完整的HTML结构（语义化标签）
2. 完整的CSS样式（包含主题变量和响应式）
3. 完整的JavaScript功能（包含主题切换和交互）
4. 详细的代码注释（便于理解和修改）
5. 跨浏览器兼容性（现代浏览器完全支持）

## 🔍 GPT-5执行检查清单
在生成前，请逐项确认：
□ 是否深度分析了原文的完整结构和层次？
□ 所有步骤、列表、分类是否都将完整呈现？
□ 模块数量是否与原文部分精确匹配？
□ CSS变量系统是否覆盖所有界面元素？
□ JavaScript主题切换逻辑是否完整实现？
□ localStorage持久化功能是否正确添加？
□ 响应式设计是否适配所有设备？
□ 交互动画是否平滑自然？`,
      max_tokens: 8000,
      reasoning_effort: 'high',
      verbosity: 'high'
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