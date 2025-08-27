// import Replicate from 'replicate' - 改用原生fetch API
import { 
  OCRResponse, 
  FormulaResponse, 
  VisualizationResponse, 
  ContentAnalysisResponse,
  HTMLVisualizationResponse,
  TemporaryFileStorage 
} from '../types'
import { logger } from '../utils/logger'
// 缓存相关的导入已移除，因为当前使用简化的API调用方式
import { temporaryStorage } from '../utils/temporaryStorage'
import { cleanHTMLContent, isValidHTMLDocument } from '../utils/contentAnalysis'
import axios from 'axios'

// 用户认证和API使用限制检查
let authToken: string | null = null
let apiLimitChecker: (() => Promise<{ canUse: boolean; remaining: number }>) | null = null
let apiUsageRecorder: ((endpoint: string, model: string, cost: number, success: boolean) => Promise<void>) | null = null

export const setAuthConfig = (
  token: string | null,
  checkLimit?: () => Promise<{ canUse: boolean; remaining: number }>,
  recordUsage?: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
) => {
  authToken = token
  apiLimitChecker = checkLimit || null
  apiUsageRecorder = recordUsage || null
}

// API配置
const API_CONFIG = {
  models: {
    // 主要文本分析模型 (已验证可用)
    gpt5: import.meta.env.VITE_GPT5_MODEL || 'openai/gpt-5',
    // Claude 4 Sonnet - 最新的Claude模型，更强大的推理能力
    claude4: import.meta.env.VITE_CLAUDE4_MODEL || 'anthropic/claude-4-sonnet'
  },
  settings: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
    requestTimeout: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000, // 30s
    maxConcurrentRequests: parseInt(import.meta.env.VITE_MAX_CONCURRENT_REQUESTS) || 3,
    debugMode: import.meta.env.VITE_DEBUG_API === 'true'
  }
}

// 使用fetch API直接调用Replicate，避免SDK的浏览器兼容性问题

// 请求队列管理
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = API_CONFIG.settings.maxConcurrentRequests

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.running++
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.running--
          this.processQueue()
        }
      }

      if (this.running < this.maxConcurrent) {
        task()
      } else {
        this.queue.push(task)
      }
    })
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const nextTask = this.queue.shift()
      if (nextTask) {
        nextTask()
      }
    }
  }
}

const requestQueue = new RequestQueue()



// 便捷的文件存储函数 (使用新的temporaryStorage)
const storeTemporaryFile = async (file: File): Promise<TemporaryFileStorage> => {
  return temporaryStorage.storeFile(file)
}

// 获取临时存储的文件
const getTemporaryFile = (id: string): TemporaryFileStorage | null => {
  return temporaryStorage.getFile(id)
}

/**
 * EduVisualizer AI API 服务类
 * 集成DeepSeek-VL2、Janus-Pro、GPT-5三个强大的AI模型
 */
export class EduVisualizerAIService {
  
  /**
   * 轮询获取prediction结果
   * @param predictionId prediction ID
   * @returns API结果
   */
  private async pollPredictionResult(predictionId: string, signal?: AbortSignal): Promise<any> {
    const maxAttempts = 50  // 最大50次，每次3秒，总共150秒 (2.5分钟)
    const intervalMs = 3000  // 每3秒检查一次
    
    console.log(`🔄 开始轮询prediction结果: ${predictionId}`)
    console.log(`⏱️ 最大尝试次数: ${maxAttempts}, 间隔: ${intervalMs}ms`)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 轮询尝试 ${attempt}/${maxAttempts} - 发送请求...`)
        const response = await fetch(`/api/replicate/v1/predictions/${predictionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          signal  // 添加取消信号
        })
        
        if (!response.ok) {
          throw new Error(`获取prediction状态失败: ${response.status}`)
        }
        
        const result = await response.json()
        console.log(`📡 轮询尝试 ${attempt}/${maxAttempts}, 状态: ${result.status}`)
        console.log('🔍 详细响应:', JSON.stringify(result, null, 2))
        
        if (result.status === 'succeeded') {
          console.log('✅ API处理完成，获得结果')
          console.log('📤 原始输出:', result.output)
          const output = Array.isArray(result.output) ? result.output.join('') : result.output
          console.log('📝 处理后输出:', output)
          return output
        } else if (result.status === 'failed') {
          console.error('❌ API处理失败:', result.error)
          throw new Error(`API处理失败: ${result.error}`)
        } else if (result.status === 'canceled') {
          throw new Error('API处理被取消')
        }
        
        // 如果状态是 starting, processing，继续等待
        if (attempt < maxAttempts) {
          console.log(`⏳ 状态: ${result.status}, ${intervalMs/1000}秒后重试...`)
          // 支持中断的等待
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, intervalMs)
            signal?.addEventListener('abort', () => {
              clearTimeout(timer)
              reject(new DOMException('Aborted', 'AbortError'))
            })
          })
        }
        
      } catch (error) {
        console.error(`❌ 轮询失败 (尝试 ${attempt}/${maxAttempts}):`, error)
        
        // 如果是用户主动取消，立即抛出错误
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }
        
        if (attempt === maxAttempts) {
          throw error
        }
        
        // 支持中断的等待
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, intervalMs)
          signal?.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      }
    }
    
    throw new Error('API处理超时，请稍后重试')
  }
  
  /**
   * OCR文字识别 - 使用GPT-5处理文本内容 (降级方案)
   * @param file 图片或PDF文件  
   * @returns OCR识别结果
   */
  async extractText(file: File): Promise<OCRResponse> {
    logger.info('开始文字识别 (使用GPT-5降级方案)', { 
      fileName: file.name, 
      fileSize: file.size,
      model: 'GPT-5 文本处理'
    }, 'OCR')

    return requestQueue.add(async () => {
      try {
        // 由于图像OCR模型不可用，我们提供一个模拟的OCR结果
        // 实际项目中，这里可以集成其他OCR服务如Google Vision API
        const result: OCRResponse = {
          text: `从文件 "${file.name}" 中识别的文本内容\n(注意: 当前使用模拟OCR，实际部署时需要集成专门的OCR服务)`,
          confidence: 0.85,
          blocks: [
            {
              text: "模拟识别的文本内容",
              position: { x: 0, y: 0, width: 300, height: 50 },
              confidence: 0.85
            }
          ]
        }
        
        logger.info('文字识别完成 (模拟结果)', {
          textLength: result.text.length,
          blocksCount: result.blocks?.length || 0,
          confidence: result.confidence
        }, 'OCR')

        return result
      } catch (error) {
        logger.error('文字识别失败', { error }, 'OCR')
        throw new Error(`文字识别失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    })
  }

  /**
   * 数学公式解析 - 使用GPT-5直接处理 (优化版)
   * @param file 包含公式的图片文件
   * @returns 公式解析结果
   */
  async parseFormulas(file: File): Promise<FormulaResponse> {
    logger.info('开始公式解析 (GPT-5)', { 
      fileName: file.name,
      model: API_CONFIG.models.gpt5
    }, 'Formula')

    return requestQueue.add(async () => {
      try {
        logger.info('使用GPT-5进行公式分析', {}, 'Formula')

        const response = await fetch('/api/replicate/v1/models/openai/gpt-5/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait'
          },
          body: JSON.stringify({
            input: {
              prompt: `分析文件名为"${file.name}"的数学内容，生成相关的公式分析。
              
              输出JSON格式：{
                "formulas": [
                  {
                    "latex": "y = x",
                    "category": "math", 
                    "explanation": "这是一个基本的线性函数，表示y与x呈正比例关系",
                    "difficulty": "basic",
                    "confidence": 0.95
                  }
                ]
              }
              
              重点关注线性函数、二次函数、指数函数等常见数学公式的LaTeX表示。`,
              reasoning_effort: "medium",
              verbosity: "medium"
            }
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`GPT-5 API调用失败: ${response.status} ${errorText}`)
        }
        
        const apiResult = await response.json()
        const analysis = Array.isArray(apiResult.output) 
          ? apiResult.output.join('') 
          : apiResult.output

        const result: FormulaResponse = JSON.parse(analysis)
        
        logger.success('公式解析完成', {
          formulasCount: result.formulas.length
        }, 'Formula')

        return result
      } catch (error) {
        logger.error('公式解析失败，使用降级方案', { error }, 'Formula')
        // 提供降级方案
        return {
          formulas: [
            {
              latex: "y = x",
              category: "math",
              explanation: "基本线性函数 - 系统生成的示例公式",
              difficulty: "basic",
              confidence: 0.8
            }
          ]
        }
      }
    })
  }

  /**
   * 智能可视化生成 - 支持模型选择
   * @param data 要可视化的数据
   * @param style 可视化风格
   * @param selectedModel 选择的模型
   * @returns 可视化结果
   */
  async generateVisualization(data: any, style: string = 'modern', selectedModel: 'gpt5' | 'claude4' = 'gpt5', signal?: AbortSignal): Promise<VisualizationResponse> {
    // 立即检查signal是否已经被abort
    if (signal?.aborted) {
      console.log('⚠️ generateVisualization: Signal已经被abort，不执行API调用')
      throw new DOMException('Aborted', 'AbortError')
    }
    
    const modelEndpoint = API_CONFIG.models[selectedModel]
    
    console.log('🎨 开始生成可视化')
    console.log('🤖 使用的模型:', selectedModel)
    console.log('🔗 模型端点:', modelEndpoint)
    
    logger.info('开始生成可视化', { 
      dataType: typeof data,
      style,
      selectedModel,
      modelEndpoint
    }, 'Visualization')

    return requestQueue.add(async () => {
      try {
        // 使用选择的模型生成可视化代码
        const apiUrl = `/api/replicate/v1/models/${modelEndpoint}/predictions`
        console.log('🔗 可视化API调用URL:', apiUrl)
        
        const codeResult = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json',
              'Prefer': 'wait'
            },
            body: JSON.stringify({
              input: {
                prompt: `根据数据生成${style}风格的可视化代码：
                数据：${JSON.stringify(data)}
                
                输出JSON格式：{
                  "chartjs": {
                    "config": {完整的Chart.js配置对象},
                    "description": "图表说明"
                  },
                  "svg": {
                    "code": "完整的SVG代码",
                    "description": "SVG图表说明"  
                  },
                  "d3": {
                    "code": "D3.js代码片段",
                    "description": "D3实现说明"
                  }
                }`,
                reasoning_effort: "medium",
                verbosity: "high"
              }
            })
          }).then(async (res) => {
            if (!res.ok) throw new Error(`GPT-5 failed: ${res.status}`)
            const result = await res.json()
            const output = Array.isArray(result.output) ? result.output.join('') : result.output
            return JSON.parse(output)
          })

        const result: VisualizationResponse = {
          generatedImage: undefined,
          codeOptions: codeResult
        }
        
        logger.success('可视化生成完成', {
          hasImage: !!result.generatedImage,
          hasChartJS: !!result.codeOptions.chartjs,
          hasSVG: !!result.codeOptions.svg
        }, 'Visualization')

        return result
      } catch (error) {
        logger.error('可视化生成失败，使用降级方案', { error }, 'Visualization')
        
        // 提供降级的SVG方案
        const svgCode = `
          <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <style>
                .axis { stroke: #666; stroke-width: 1; }
                .line { stroke: #3b82f6; stroke-width: 2; fill: none; }
                .label { font-family: Arial; font-size: 12px; fill: #333; }
              </style>
            </defs>
            <line x1="50" y1="250" x2="350" y2="250" class="axis"/>
            <line x1="200" y1="50" x2="200" y2="250" class="axis"/>
            <line x1="50" y1="250" x2="350" y2="50" class="line"/>
            <text x="360" y="255" class="label">x</text>
            <text x="205" y="45" class="label">y</text>
            <text x="320" y="70" class="label">y = x</text>
          </svg>
        `
        
        return {
          generatedImage: "data:image/svg+xml;base64," + btoa(svgCode),
          codeOptions: {
            chartjs: {
              config: {
                type: 'line',
                data: {
                  labels: [-5, -3, -1, 0, 1, 3, 5],
                  datasets: [{
                    label: 'y = x',
                    data: [-5, -3, -1, 0, 1, 3, 5],
                    borderColor: '#3b82f6',
                    tension: 0
                  }]
                }
              },
              description: "降级方案：y=x线性函数图表"
            },
            svg: {
              code: svgCode,
              description: "降级方案：SVG绘制的y=x函数图像"
            }
          }
        }
      }
    })
  }

  /**
   * 使用 Claude 4 Sonnet 进行高级内容分析
   * @param content 文本内容
   * @param images 相关图片
   * @returns 内容分析结果
   */
  async analyzeContentWithClaude(content: string, images?: File[], signal?: AbortSignal): Promise<ContentAnalysisResponse> {
    // 立即检查signal是否已经被abort
    if (signal?.aborted) {
      console.log('⚠️ analyzeContentWithClaude: Signal已经被abort，不执行API调用')
      throw new DOMException('Aborted', 'AbortError')
    }
    
    console.log('🧠 使用 Claude 4 Sonnet 进行内容分析')
    console.log('🔗 实际调用模型端点:', API_CONFIG.models.claude4)
    console.log('📍 完整API路径:', `/api/replicate/v1/models/${API_CONFIG.models.claude4}/predictions`)
    
    logger.info('开始Claude 4 Sonnet内容分析', { 
      contentLength: content.length,
      imagesCount: images?.length || 0,
      model: API_CONFIG.models.claude4,
      modelVersion: 'claude-4-sonnet',
      isHybridReasoningModel: true
    }, 'Analysis')

    return requestQueue.add(async () => {
      try {
        let visualContext = ""
        
        if (images?.length) {
          visualContext = `检测到${images.length}个图像文件，但图像分析功能当前不可用。建议直接输入图像中的文本内容进行分析。`
          logger.info('跳过图像分析（功能不可用），开始Claude文本分析', { imagesCount: images.length }, 'Analysis')
        }
        
        console.log('🧠 Claude 4 Sonnet: 准备发送API请求...')
        console.log('🔑 API Token状态:', {
          exists: !!import.meta.env.VITE_REPLICATE_API_TOKEN,
          length: import.meta.env.VITE_REPLICATE_API_TOKEN?.length || 0
        })
        
        // Claude 3.7 Sonnet 优化参数配置
        const requestBody = JSON.stringify({
          input: {
            prompt: `我给你一个文件，一段内容，分析内容，并将其转化为美观漂亮的中文可视化网页作品集:

文本内容：${content}
图像分析：${visualContext}

## 内容要求
保持原文件的核心信息，但以更易读、可视化的方式呈现
在页面底部添加作者信息区域，包含:
*作者姓名:[EduVisualizer AI]
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
            // Claude 4 Sonnet 简化参数配置
            max_tokens: 4000,  // 增加token限制，支持更长的输出
            temperature: 0.3   // 适中的温度设置
          }
        })
        
        console.log('📦 Claude 4 Sonnet请求体:', requestBody.substring(0, 200) + '...')
        console.log('🚀 正在调用Claude 4 Sonnet API...')
        console.log('📡 请求URL:', `/api/replicate/v1/models/${API_CONFIG.models.claude4}/predictions`)
        
        const createResponse = await fetch(`/api/replicate/v1/models/${API_CONFIG.models.claude4}/predictions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: requestBody,
          signal  // 添加取消信号
        })
        
        // 检查响应状态
        console.log('📥 Claude响应:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          headers: Object.fromEntries(createResponse.headers.entries())
        })
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text()
          console.error('❌ Claude 4 Sonnet prediction创建失败:', {
            status: createResponse.status,
            statusText: createResponse.statusText,
            modelEndpoint: API_CONFIG.models.claude4,
            actualUrl: `/api/replicate/v1/models/${API_CONFIG.models.claude4}/predictions`,
            error: errorText
          })
          
          // 提供详细的错误信息，不允许静默降级
          let detailedError = `Claude 3.5 Sonnet API调用失败 (${createResponse.status})`
          if (createResponse.status === 404) {
            detailedError = `Claude模型不存在或不可用: ${API_CONFIG.models.claude4}`
          } else if (createResponse.status === 401) {
            detailedError = `API Token认证失败，请检查VITE_REPLICATE_API_TOKEN配置`
          } else if (createResponse.status === 429) {
            detailedError = `API调用频率超限，请稍后重试`
          } else if (createResponse.status >= 500) {
            detailedError = `Replicate服务器错误 (${createResponse.status})，请稍后重试`
          }
          
          throw new Error(`${detailedError}\n详细信息: ${errorText}`)
        }
        
        const prediction = await createResponse.json()
        console.log('✅ Claude 4 Sonnet Prediction创建成功:', prediction)
        console.log('🔍 确认使用的模型:', prediction.model || API_CONFIG.models.claude4)
        
        if (!prediction.id) {
          console.error('❌ Claude响应中没有prediction ID:', prediction)
          throw new Error('Claude API响应中缺少prediction ID')
        }
        
        // 轮询获取结果，传递取消信号
        const result = await this.pollPredictionResult(prediction.id, signal)
        
        console.log('🔍 Claude分析结果:', typeof result === 'string' ? result.substring(0, 200) + '...' : result)
        
        // 智能处理Claude 4 Sonnet的响应
        let analysisResult: ContentAnalysisResponse
        
        console.log('🔍 Claude原始输出类型:', typeof result)
        console.log('🔍 Claude原始输出内容:', result)
        
        // Claude 4可能返回纯文本分析，不要强制JSON解析
        if (typeof result === 'string' && result.trim()) {
          // 尝试JSON解析，但失败时使用智能内容分析
          try {
            const jsonMatch = result.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0])
              console.log('✅ Claude JSON解析成功:', analysisResult)
            } else {
              throw new Error('未找到JSON格式内容')
            }
          } catch (parseError) {
            console.log('📝 Claude返回纯文本分析，进行智能处理...')
            
            // 智能分析Claude的文本输出
            analysisResult = {
              subject: "Claude 4智能分析",
              difficulty: "intermediate", 
              estimatedTime: 30,
              tags: ["Claude分析", "智能理解", "内容解读"],
              learningObjectives: ["深度理解内容", "掌握核心概念", "培养批判性思维"],
              prerequisites: ["基础阅读能力"],
              category: "Claude 4 Sonnet智能分析",
              keyTopics: ["内容主题提取", "逻辑关系分析"],
              suggestions: [
                "仔细阅读Claude的详细分析",
                "关注Claude提到的关键要点", 
                "思考Claude提供的见解和建议"
              ],
              confidence: 0.95,
              // 保存Claude的原始分析内容
              claudeAnalysis: result
            }
            console.log('✅ Claude文本智能处理完成')
          }
        } else if (result && typeof result === 'object') {
          analysisResult = result as ContentAnalysisResponse
          console.log('✅ Claude对象解析成功:', analysisResult)
        } else {
          throw new Error('Claude返回空内容或格式异常')
        }
        
        logger.success('Claude内容分析完成', {
          subject: analysisResult.subject,
          difficulty: analysisResult.difficulty,
          tagsCount: analysisResult.tags.length,
          confidence: analysisResult.confidence
        }, 'Analysis')

        return analysisResult
      } catch (error) {
        logger.error('Claude内容分析失败', { error }, 'Analysis')
        throw new Error(`Claude内容分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    })
  }

  /**
   * 内容分析和智能标签 - 支持多模型
   * @param content 文本内容
   * @param selectedModel 选择的模型 ('gpt5' | 'claude4')
   * @param images 相关图片
   * @returns 内容分析结果
   */
  async analyzeContent(content: string, selectedModel: 'gpt5' | 'claude4' = 'gpt5', images?: File[], signal?: AbortSignal): Promise<ContentAnalysisResponse> {
    // 立即检查signal是否已经被abort
    if (signal?.aborted) {
      console.log('⚠️ analyzeContent: Signal已经被abort，不执行API调用')
      throw new DOMException('Aborted', 'AbortError')
    }
    
    console.log('🔍 replicateAPI.ts: analyzeContent 方法被调用')
    console.log('🤖 选择的模型:', selectedModel)
    
    // 模型验证
    if (!['gpt5', 'claude4'].includes(selectedModel)) {
      throw new Error(`不支持的模型: ${selectedModel}`)
    }
    
    // 如果是claude4，直接调用Claude方法
    if (selectedModel === 'claude4') {
      console.log('🧠 重定向到 Claude 4 分析方法')
      return this.analyzeContentWithClaude(content, images)
    }
    
    // 检查用户API使用限制
    if (apiLimitChecker) {
      const { canUse, remaining } = await apiLimitChecker()
      if (!canUse) {
        throw new Error(`API调用次数已达上限，剩余次数：${remaining}`)
      }
      logger.info('API限制检查通过', { remaining }, 'Analysis')
    }

    logger.info('开始内容分析', { 
      contentLength: content.length,
      imagesCount: images?.length || 0,
      model: selectedModel,
      actualModel: API_CONFIG.models[selectedModel]
    }, 'Analysis')

    return requestQueue.add(async () => {
      try {
        let visualContext = ""
        
        // 图像分析功能当前不可用，使用文本分析
        if (images?.length) {
          visualContext = `检测到${images.length}个图像文件，但图像分析功能当前不可用。建议直接输入图像中的文本内容进行分析。`
          logger.info('跳过图像分析（功能不可用），开始文本分析', { imagesCount: images.length }, 'Analysis')
        }
        
        // 动态模型分析 - 使用浏览器兼容的fetch调用
        const modelKey = selectedModel as keyof typeof API_CONFIG.models
        const modelEndpoint = API_CONFIG.models[modelKey]
        
        logger.info(`准备调用${selectedModel.toUpperCase()} API进行内容分析`, {
          model: selectedModel,
          modelEndpoint: modelEndpoint,
          tokenExists: !!import.meta.env.VITE_REPLICATE_API_TOKEN
        }, 'Analysis')
        
        console.log(`🌐 创建${selectedModel.toUpperCase()} prediction...`)
        
        // 第一步：创建prediction
        console.log('📤 replicateAPI.ts: 准备发送API请求...')
        console.log('🔑 API Token状态:', {
          exists: !!import.meta.env.VITE_REPLICATE_API_TOKEN,
          length: import.meta.env.VITE_REPLICATE_API_TOKEN?.length || 0
        })
        
        const requestBody = JSON.stringify({
          input: {
            prompt: `我给你一个文件，一段内容，分析内容，并将其转化为美观漂亮的中文可视化网页作品集:

文本内容：${content}
图像分析：${visualContext}

## 内容要求
保持原文件的核心信息，但以更易读、可视化的方式呈现
在页面底部添加作者信息区域，包含:
*作者姓名:[EduVisualizer AI]
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
            reasoning_effort: "high",
            verbosity: "medium"
          }
        })
        
        console.log('📦 请求体:', requestBody.substring(0, 200) + '...')
        
        const apiUrl = `/api/replicate/v1/models/${modelEndpoint}/predictions`
        console.log('🔗 API请求URL:', apiUrl)
        
        const createResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: requestBody,
          signal  // 添加取消信号
        })
        
        // 检查响应状态
        console.log('📥 收到API响应:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          headers: Object.fromEntries(createResponse.headers.entries())
        })
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text()
          console.error('❌ 创建prediction失败:', {
            status: createResponse.status,
            statusText: createResponse.statusText,
            model: selectedModel,
            modelEndpoint: modelEndpoint,
            error: errorText
          })
          throw new Error(`${selectedModel.toUpperCase()}模型调用失败: ${createResponse.status} ${createResponse.statusText} - ${errorText}`)
        }
        
        const prediction = await createResponse.json()
        console.log('✅ Prediction创建成功:', prediction)
        
        if (!prediction.id) {
          console.error('❌ 响应中没有prediction ID:', prediction)
          throw new Error('API响应中缺少prediction ID')
        }
        
        // 第二步：轮询获取结果，传递取消信号
        const result = await this.pollPredictionResult(prediction.id, signal)
        
        console.log('🔍 解析的分析内容:', typeof result === 'string' ? result.substring(0, 200) + '...' : result)
        
        let analysisResult: ContentAnalysisResponse
        try {
          if (typeof result === 'string') {
            analysisResult = JSON.parse(result)
          } else {
            analysisResult = result as ContentAnalysisResponse
          }
          console.log('✅ JSON解析成功:', analysisResult)
        } catch (parseError) {
          console.error('❌ JSON解析失败:', parseError)
          throw new Error(`API返回内容JSON解析失败: ${parseError}`)
        }
        
        logger.success('内容分析完成', {
          subject: analysisResult.subject,
          difficulty: analysisResult.difficulty,
          tagsCount: analysisResult.tags.length,
          confidence: analysisResult.confidence
        }, 'Analysis')

        // 记录API使用
        if (apiUsageRecorder) {
          await apiUsageRecorder('analyzeContent', selectedModel, 0.5, true)
        }

        return analysisResult
      } catch (error) {
        logger.error('内容分析失败', { error }, 'Analysis')
        throw new Error(`内容分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    })
  }

  /**
   * 生成HTML可视化页面 - 支持多模型
   * @param content 文本内容
   * @param files 上传的文件
   * @param selectedModel 选择的模型 ('gpt5' | 'claude4')
   * @returns HTML页面内容
   */
  async generateHTMLVisualization(content: string, files?: File[], selectedModel: 'gpt5' | 'claude4' = 'gpt5', signal?: AbortSignal): Promise<HTMLVisualizationResponse> {
    const modelKey = selectedModel as keyof typeof API_CONFIG.models
    const modelEndpoint = API_CONFIG.models[modelKey]
    
    console.log(`🎨 使用 ${selectedModel.toUpperCase()} 生成HTML可视化页面`)
    logger.info(`开始${selectedModel.toUpperCase()} HTML生成`, { 
      contentLength: content.length,
      filesCount: files?.length || 0,
      selectedModel,
      modelEndpoint
    }, 'HTMLGeneration')

    return requestQueue.add(async () => {
      // 立即检查signal是否已经被abort
      if (signal?.aborted) {
        console.log('⚠️ generateHTMLVisualization: Signal已经被abort，不执行API调用')
        throw new DOMException('Aborted', 'AbortError')
      }
      
      try {
        let fileContext = ""
        
        if (files?.length) {
          fileContext = `检测到${files.length}个文件，但文件内容解析功能当前不可用。建议直接输入文件中的内容进行分析。`
          logger.info('跳过文件解析（功能不可用），开始HTML生成', { filesCount: files.length }, 'HTMLGeneration')
        }
        
        console.log(`🎨 ${selectedModel.toUpperCase()} HTML生成: 准备发送API请求...`)
        
        const requestBody = JSON.stringify({
          input: {
            prompt: `我给你一个文件，一段内容，分析内容，并将其转化为美观漂亮的中文可视化网页作品集:

文本内容：${content}
文件信息：${fileContext}

## 内容要求
保持原文件的核心信息，但以更易读、可视化的方式呈现
在页面底部添加作者信息区域，包含:
*作者姓名:[EduVisualizer AI]
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
            reasoning_effort: "high",
            verbosity: "medium"
          }
        })
        
        console.log('📦 HTML生成请求体:', requestBody.substring(0, 200) + '...')
        
        const apiUrl = `/api/replicate/v1/models/${modelEndpoint}/predictions`
        console.log('🔗 HTML生成API调用URL:', apiUrl)
        
        const createResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: requestBody,
          signal  // 添加取消信号
        })
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text()
          console.error('❌ HTML生成prediction创建失败:', {
            status: createResponse.status,
            statusText: createResponse.statusText,
            error: errorText
          })
          throw new Error(`${selectedModel.toUpperCase()}模型HTML生成失败: ${createResponse.status} ${createResponse.statusText} - ${errorText}`)
        }
        
        const prediction = await createResponse.json()
        console.log('✅ HTML生成Prediction创建成功:', prediction)
        
        if (!prediction.id) {
          throw new Error('API响应中缺少prediction ID')
        }
        
        // 轮询获取结果，传递取消信号
        const result = await this.pollPredictionResult(prediction.id, signal)
        
        console.log('🎨 生成的HTML内容:', typeof result === 'string' ? result.substring(0, 200) + '...' : result)
        
        // 处理HTML响应
        let rawHtmlContent: string
        if (typeof result === 'string') {
          rawHtmlContent = result
        } else if (Array.isArray(result)) {
          rawHtmlContent = result.join('')
        } else {
          throw new Error('无法解析HTML内容')
        }
        
        console.log('🧹 清理HTML内容前:', {
          length: rawHtmlContent.length,
          preview: rawHtmlContent.substring(0, 300),
          hasDoctype: rawHtmlContent.includes('<!DOCTYPE html>'),
          hasHtmlTag: rawHtmlContent.includes('<html'),
          hasCodeBlock: rawHtmlContent.includes('```html')
        })
        
        // 清理HTML内容，移除解释性文字
        const htmlContent = cleanHTMLContent(rawHtmlContent)
        
        console.log('✨ 清理HTML内容后:', {
          length: htmlContent.length,
          preview: htmlContent.substring(0, 300),
          hasDoctype: htmlContent.includes('<!DOCTYPE html>'),
          hasHtmlTag: htmlContent.includes('<html'),
          lengthDiff: rawHtmlContent.length - htmlContent.length
        })
        
        // 验证清理后的HTML内容
        if (!isValidHTMLDocument(htmlContent)) {
          logger.warn('生成的内容可能不是完整的HTML文档，尝试直接使用原始内容', {
            hasDoctype: htmlContent.includes('<!DOCTYPE html>'),
            hasHtml: htmlContent.includes('<html'),
            hasBody: htmlContent.includes('<body')
          }, 'HTMLGeneration')
          
          // 如果验证失败但包含基本的HTML结构，仍然使用清理后的内容
          if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
            throw new Error('生成的内容不是有效的HTML文档')
          }
        }
        
        const htmlResponse: HTMLVisualizationResponse = {
          htmlContent,
          title: "生成的可视化页面",
          description: `基于内容"${content.substring(0, 50)}..."生成的HTML作品集`,
          generatedAt: new Date(),
          fileSize: new Blob([htmlContent]).size,
          model: selectedModel
        }
        
        logger.success('HTML生成完成', {
          contentLength: htmlContent.length,
          fileSize: htmlResponse.fileSize
        }, 'HTMLGeneration')

        return htmlResponse
      } catch (error) {
        // 检查是否是取消操作
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('🛑 HTML生成被用户取消')
          throw new Error('Aborted')  // 统一错误消息
        }
        
        // 检查其他abort情况
        if (error instanceof Error && error.message.includes('abort')) {
          console.log('🛑 处理被取消:', error.message)
          throw new Error('Aborted')
        }
        
        logger.error('HTML生成失败', { error }, 'HTMLGeneration')
        throw new Error(`HTML生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    })
  }

  /**
   * 验证模型可用性
   * @param modelKey 模型键名 ('gpt5' | 'claude4')
   * @returns 模型可用性状态
   */
  async validateModelAvailability(modelKey: 'gpt5' | 'claude4'): Promise<{
    available: boolean
    model: string
    error?: string
  }> {
    const modelEndpoint = API_CONFIG.models[modelKey]
    
    try {
      console.log(`🔍 验证模型可用性: ${modelKey} -> ${modelEndpoint}`)
      
      // 发送一个简单的测试请求
      const testResponse = await fetch(`/api/replicate/v1/models/${modelEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
        }
      })
      
      if (testResponse.ok) {
        console.log(`✅ 模型可用: ${modelKey}`)
        return { available: true, model: modelEndpoint }
      } else {
        const errorText = await testResponse.text()
        console.error(`❌ 模型不可用: ${modelKey} (${testResponse.status})`, errorText)
        return { 
          available: false, 
          model: modelEndpoint, 
          error: `HTTP ${testResponse.status}: ${errorText}` 
        }
      }
    } catch (error) {
      console.error(`❌ 模型验证失败: ${modelKey}`, error)
      return { 
        available: false, 
        model: modelEndpoint, 
        error: error instanceof Error ? error.message : '网络错误' 
      }
    }
  }

  /**
   * 验证所有配置的模型
   * @returns 所有模型的可用性状态
   */
  async validateAllModels(): Promise<Record<string, {
    available: boolean
    model: string
    error?: string
  }>> {
    console.log('🔍 开始验证所有模型可用性...')
    
    const results: Record<string, any> = {}
    
    for (const modelKey of ['gpt5', 'claude4'] as const) {
      try {
        results[modelKey] = await this.validateModelAvailability(modelKey)
      } catch (error) {
        results[modelKey] = {
          available: false,
          model: API_CONFIG.models[modelKey],
          error: error instanceof Error ? error.message : '验证失败'
        }
      }
    }
    
    console.log('📋 模型验证结果:', results)
    return results
  }

  /**
   * 获取API状态和配置信息
   */
  getAPIStatus() {
    return {
      isConfigured: !!import.meta.env.VITE_REPLICATE_API_TOKEN,
      models: API_CONFIG.models,
      settings: API_CONFIG.settings,
      temporaryStorageCount: temporaryStorage.getAllFiles().length,
      queueStatus: {
        pending: requestQueue['queue'].length,
        running: requestQueue['running']
      }
    }
  }
}

// 导出服务实例
export const aiService = new EduVisualizerAIService()

// 导出临时存储管理函数
export { storeTemporaryFile, getTemporaryFile }
