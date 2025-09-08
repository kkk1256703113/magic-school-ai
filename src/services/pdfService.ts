import * as pdfjsLib from 'pdfjs-dist'
import axios from 'axios'
import { logger } from '@/utils/logger'

// 配置PDF.js worker - 使用Vite兼容的本地版本
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// PDF处理结果类型
export interface PDFProcessResult {
  text: string
  pageCount: number
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
  }
  processedBy: 'local' | 'api'
  confidence: number
}

// iLovePDF API配置
const ILOVEPDF_API_CONFIG = {
  baseUrl: 'https://api.ilovepdf.com/v1',
  publicKey: import.meta.env.VITE_ILOVEPDF_PUBLIC_KEY || '',
  secretKey: import.meta.env.VITE_ILOVEPDF_SECRET_KEY || ''
}

/**
 * PDF处理服务类
 * 提供本地PDF.js处理和iLovePDF API处理两种方式
 */
export class PDFService {
  
  /**
   * 智能处理PDF文件
   * 根据文件大小和复杂度自动选择处理方式
   */
  async processPDF(file: File): Promise<PDFProcessResult> {
    logger.info('开始处理PDF文件', { 
      fileName: file.name, 
      fileSize: file.size 
    }, 'PDFService')
    
    // 小于2MB的文件使用本地处理
    if (file.size < 2 * 1024 * 1024) {
      logger.info('使用本地PDF.js处理', {}, 'PDFService')
      return await this.processWithPDFJS(file)
    }
    
    // 大文件或需要高精度处理时使用API
    if (this.isAPIConfigured()) {
      logger.info('使用iLovePDF API处理', {}, 'PDFService')
      return await this.processWithILovePDF(file)
    }
    
    // 如果API未配置，仍然使用本地处理
    logger.warn('iLovePDF API未配置，使用本地处理大文件', {}, 'PDFService')
    return await this.processWithPDFJS(file)
  }
  
  /**
   * 使用PDF.js本地处理PDF
   * 适合简单文本提取
   */
  private async processWithPDFJS(file: File): Promise<PDFProcessResult> {
    try {
      // 将文件转换为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // 加载PDF文档
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      logger.info(`PDF加载成功，共${pdf.numPages}页`, {}, 'PDFService')
      
      // 提取所有页面的文本
      let fullText = ''
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // 将文本项组合成完整文本
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += `\n--- 第 ${pageNum} 页 ---\n${pageText}\n`
      }
      
      // 获取PDF元数据
      const metadata = await pdf.getMetadata()
      
      return {
        text: fullText.trim(),
        pageCount: pdf.numPages,
        metadata: metadata.info ? {
          title: (metadata.info as any).Title,
          author: (metadata.info as any).Author,
          subject: (metadata.info as any).Subject,
          keywords: (metadata.info as any).Keywords
        } : undefined,
        processedBy: 'local',
        confidence: 0.85
      }
      
    } catch (error) {
      logger.error('PDF.js处理失败', { error }, 'PDFService')
      throw new Error(`PDF处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  /**
   * 使用iLovePDF API处理PDF
   * 适合复杂PDF、扫描件、需要OCR的文档
   */
  private async processWithILovePDF(file: File): Promise<PDFProcessResult> {
    try {
      // Step 1: 获取认证token
      const authResponse = await axios.post(
        `${ILOVEPDF_API_CONFIG.baseUrl}/auth`,
        {
          public_key: ILOVEPDF_API_CONFIG.publicKey
        }
      )
      
      const token = authResponse.data.token
      
      // Step 2: 开始任务
      const startResponse = await axios.post(
        `${ILOVEPDF_API_CONFIG.baseUrl}/start/extract`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      const taskId = startResponse.data.task
      const serverUrl = startResponse.data.server
      
      // Step 3: 上传文件
      const formData = new FormData()
      formData.append('task', taskId)
      formData.append('file', file)
      
      await axios.post(
        `${serverUrl}/v1/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      // Step 4: 处理文件
      const processResponse = await axios.post(
        `${serverUrl}/v1/process`,
        {
          task: taskId,
          tool: 'extract',
          extraction_method: 'advanced'  // 使用高级提取方法
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      // Step 5: 下载结果
      const downloadUrl = processResponse.data.download_link
      const resultResponse = await axios.get(downloadUrl)
      
      // 解析提取的文本
      const extractedText = resultResponse.data.text || ''
      
      return {
        text: extractedText,
        pageCount: resultResponse.data.pages || 0,
        metadata: {
          title: resultResponse.data.title,
          author: resultResponse.data.author
        },
        processedBy: 'api',
        confidence: 0.95
      }
      
    } catch (error) {
      logger.error('iLovePDF API处理失败，回退到本地处理', { error }, 'PDFService')
      // 如果API失败，回退到本地处理
      return await this.processWithPDFJS(file)
    }
  }
  
  /**
   * 检查API是否已配置
   */
  private isAPIConfigured(): boolean {
    return !!(ILOVEPDF_API_CONFIG.publicKey && ILOVEPDF_API_CONFIG.secretKey)
  }
  
  /**
   * 预览PDF第一页（用于缩略图）
   */
  async generatePreview(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      // 获取第一页
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 0.5 })
      
      // 创建canvas元素
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('无法创建canvas context')
      }
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      // 渲染页面
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise
      
      // 转换为base64图片
      return canvas.toDataURL('image/png')
      
    } catch (error) {
      logger.error('生成PDF预览失败', { error }, 'PDFService')
      return ''  // 返回空字符串表示无预览
    }
  }
  
  /**
   * 检测PDF复杂度
   * 用于决定使用哪种处理方式
   */
  async detectComplexity(file: File): Promise<'simple' | 'complex'> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      // 检查第一页的文本内容
      const page = await pdf.getPage(1)
      const textContent = await page.getTextContent()
      
      // 如果文本项很少，可能是扫描件
      if (textContent.items.length < 10) {
        return 'complex'
      }
      
      // 检查是否有表格或复杂布局
      // 这里可以添加更多检测逻辑
      
      return 'simple'
      
    } catch (error) {
      // 如果检测失败，默认当作复杂文档
      return 'complex'
    }
  }
}

// 导出单例实例
export const pdfService = new PDFService()