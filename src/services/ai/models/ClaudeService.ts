import { logger } from '@/utils/logger'
import { AIServiceBase } from '../core/AIServiceBase'
import { getModelEndpoint } from '../config/apiConfig'
import { ContentInput } from '../types/ai.types'
import { HTMLPrompts } from '../prompts/htmlPrompt'
import { promptVersionManager } from '../core/PromptVersionManager'
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
   * 构建Claude分析提示词（稳定版本）
   */
  private buildClaudeAnalysisPromptStable(content: string, files?: File[]) {
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
   * 构建Claude分析提示词（版本选择入口）
   */
  private buildClaudeAnalysisPrompt(content: string, files?: File[]) {
    const version = promptVersionManager.getCurrentVersion()
    
    switch (version) {
      case 'enhanced':
        return this.buildClaudeAnalysisPromptEnhanced(content, files)
      case 'stable':
      default:
        return this.buildClaudeAnalysisPromptStable(content, files)
    }
  }

  /**
   * 构建Claude分析提示词（增强版本 - 内容完整性优化版本）
   */
  private buildClaudeAnalysisPromptEnhanced(content: string, files?: File[]) {
    let fileContext = ''
    if (files?.length) {
      fileContext = `包含${files.length}个附加文件，需要进行综合语义分析和深度理解。`
    }
    
    return {
      prompt: `我给你一个文件，一段内容，发挥Claude的深度理解和语义分析能力，将其转化为美观漂亮的中文可视化网页作品集，确保完整展示所有原文内容:

文本内容：${content}
${fileContext}

## Claude 4 Sonnet专属优势发挥
充分运用Claude 4 Sonnet的语义理解和内容分析能力：
1. **深度语义分析**：理解文本的深层含义和隐含逻辑，准确把握核心观点
2. **结构化思维**：精确提取信息层次和逻辑关系，构建清晰的信息架构
3. **批判性分析**：评估信息重要性，识别关键要点，确保准确性和完整性

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

## ⚠️ 主题切换技术实现（完整方案）
Claude的技术理解能力确保生成完美的主题切换功能：

1. **完整CSS变量系统**：
   
   :root {
     /* 浅色主题 */
     --primary-bg: #ffffff;
     --secondary-bg: #f8fafc;
     --tertiary-bg: #f1f5f9;
     --primary-text: #0f172a;
     --secondary-text: #475569;
     --accent-primary: #3b82f6;
     --accent-secondary: #06b6d4;
     --border-light: #e2e8f0;
     --shadow-light: rgba(0, 0, 0, 0.1);
   }
   
   body.dark-theme {
     /* 深色主题 */
     --primary-bg: #0f172a;
     --secondary-bg: #1e293b;
     --tertiary-bg: #334155;
     --primary-text: #f8fafc;
     --secondary-text: #cbd5e1;
     --accent-primary: #60a5fa;
     --accent-secondary: #22d3ee;
     --border-light: #475569;
     --shadow-light: rgba(0, 0, 0, 0.3);
   }
   
   * {
     transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
   }

2. **健壮JavaScript逻辑**（必须完整实现）：
   
   class ThemeManager {
     constructor() {
       this.init();
     }
     
     init() {
       // 检测系统主题偏好
       const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
       const savedTheme = localStorage.getItem('theme');
       const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
       
       this.setTheme(initialTheme);
       this.bindEvents();
     }
     
     setTheme(theme) {
       const body = document.body;
       const themeToggle = document.getElementById('theme-toggle');
       
       if (theme === 'dark') {
         body.classList.add('dark-theme');
         if (themeToggle) themeToggle.innerHTML = '☀️ 浅色模式';
       } else {
         body.classList.remove('dark-theme');
         if (themeToggle) themeToggle.innerHTML = '🌙 深色模式';
       }
       
       localStorage.setItem('theme', theme);
     }
     
     toggle() {
       const isDark = document.body.classList.contains('dark-theme');
       this.setTheme(isDark ? 'light' : 'dark');
     }
     
     bindEvents() {
       document.addEventListener('click', (e) => {
         if (e.target.id === 'theme-toggle' || e.target.closest('#theme-toggle')) {
           this.toggle();
         }
       });
       
       // 监听系统主题变化
       window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
         if (!localStorage.getItem('theme')) {
           this.setTheme(e.matches ? 'dark' : 'light');
         }
       });
     }
   }
   
   // 页面加载时初始化
   document.addEventListener('DOMContentLoaded', () => {
     new ThemeManager();
   });

## Claude特色：语义化设计增强
基于深度语义理解，优化视觉呈现：

1. **语义化布局**：
   - 根据内容性质选择最佳布局方式
   - 重要信息使用突出的视觉层次
   - 次要信息用较轻的视觉权重

2. **情感化设计**：
   - 根据内容情感色彩选择合适的颜色方案
   - 严肃内容使用稳重色调，活泼内容使用明快色调
   - 通过视觉元素传达内容的情感倾向

3. **逻辑化组织**：
   - 因果关系用箭头和流程图表示
   - 对比关系用并列和对照布局
   - 递进关系用阶梯式或渐进式设计

## 视觉体验专业化
1. **步骤流程类**：
   - 时间线设计：清晰的步骤标识和进度指示
   - 流程箭头：引导用户视线流动
   - 完成状态：已完成/进行中/未开始的视觉区分

2. **分类对比类**：
   - 卡片布局：每个类别独立成卡片
   - 颜色编码：不同类别使用不同的主题色
   - 图标系统：为每个类别设计专属图标

3. **重点解释类**：
   - 高亮标注：重要概念用特殊背景色
   - 侧边说明：复杂概念添加详细解释框
   - 交互提示：鼠标悬停显示更多信息

## 交互体验优化
1. **智能导航**：
   - 自动生成目录结构
   - 锚点链接快速跳转
   - 进度指示显示阅读位置

2. **内容探索**：
   - 可展开/收起的详细说明
   - 相关内容的交叉引用
   - 搜索和筛选功能

## 技术实现要求
- **语义化HTML**：使用最恰当的HTML5标签
- **现代CSS**：充分利用CSS Grid和Flexbox
- **渐进增强**：确保在各种环境下都能正常显示
- **性能优化**：代码简洁高效，加载速度快

## 输出标准
生成完整的HTML文件，包含：
1. 语义化的HTML结构
2. 完整的CSS样式系统（包含主题变量）
3. 功能完整的JavaScript代码
4. 详细的代码注释和文档
5. 完美的跨浏览器兼容性

## 🔍 Claude执行验证清单
基于深度分析，请确认：
□ 是否深入理解了文本的语义和结构？
□ 所有信息要点是否都有对应的视觉呈现？
□ 模块划分是否与原文结构完全一致？
□ 主题切换功能是否技术实现完整？
□ 视觉设计是否符合内容的语义特征？
□ 用户体验是否考虑了认知习惯和使用场景？`,
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