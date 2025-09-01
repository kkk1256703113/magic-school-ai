import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isSimpleGreeting, generateGreetingResponse, sleep } from '@/utils/chatHelpers'
import { pdfService } from '@/services/pdfService'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

interface UseChatInputProps {
  addUserMessage: (content: string, files?: File[]) => string
  addAssistantMessage: (content: string, status?: any) => string
  updateMessage: (messageId: string, updates: any) => void
  processUserInput: (content: string, contentType: any, messageId: string, signal?: AbortSignal) => Promise<void>
  detectContentType: (content: string) => any
  hasApiToken: boolean
  selectedModel: 'gpt5' | 'claude4'
  isAuthenticated: boolean
  user: any
  language: 'zh' | 'en'
}

export const useChatInput = ({
  addUserMessage,
  addAssistantMessage,
  updateMessage,
  processUserInput,
  detectContentType,
  hasApiToken,
  selectedModel,
  isAuthenticated,
  user,
  language
}: UseChatInputProps) => {
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { t } = useTranslation()

  // 取消处理函数
  const cancelProcessing = () => {
    console.log('🛑 终止按钮被点击，准备取消处理')
    if (abortControllerRef.current) {
      console.log('🛑 AbortController存在，发送abort信号')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsProcessing(false)
    } else {
      console.log('⚠️ AbortController不存在')
    }
  }

  const handleSendMessage = async (message: string = inputText, files?: File[]) => {
    if ((!message.trim() && (!files || files.length === 0)) || isProcessing) return
    
    let userContent = message.trim()
    setInputText('')
    setIsProcessing(true)
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController()
    
    // 文件类型检测工具函数
    const isTextFile = (file: File): boolean => {
      const textTypes = [
        'text/plain',
        'text/markdown', 
        'application/json',
        'text/csv',
        'text/html'
      ]
      const textExtensions = ['.txt', '.md', '.json', '.csv', '.html']
      
      return textTypes.includes(file.type) || 
             textExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    }

    // Office文档类型检测
    const isOfficeFile = (file: File): boolean => {
      const officeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx']
      
      return officeTypes.includes(file.type) || 
             officeExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    }

    const getFileTypeLabel = (file: File): string => {
      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) return 'TXT文件'
      if (file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md')) return 'Markdown文件'
      if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) return 'JSON文件'
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) return 'CSV文件'
      if (file.type === 'text/html' || file.name.toLowerCase().endsWith('.html')) return 'HTML文件'
      return '文本文件'
    }

    const getOfficeFileTypeLabel = (file: File): string => {
      if (file.name.toLowerCase().endsWith('.doc') || file.type === 'application/msword') return 'Word文档(.doc)'
      if (file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml')) return 'Word文档(.docx)'
      if (file.name.toLowerCase().endsWith('.xls') || file.type === 'application/vnd.ms-excel') return 'Excel表格(.xls)'
      if (file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('spreadsheetml')) return 'Excel表格(.xlsx)'
      return 'Office文档'
    }

    // Word文档解析函数
    const parseWordDocument = async (file: File): Promise<string> => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        return result.value
      } catch (error: any) {
        throw new Error(`Word文档解析失败: ${error.message}`)
      }
    }

    // Excel表格解析函数  
    const parseExcelDocument = async (file: File): Promise<string> => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        let allContent = ''
        
        // 遍历所有工作表
        workbook.SheetNames.forEach((sheetName, index) => {
          const worksheet = workbook.Sheets[sheetName]
          const sheetData = XLSX.utils.sheet_to_txt(worksheet, { FS: '\t' })
          
          if (sheetData.trim()) {
            allContent += `\n--- 工作表 ${index + 1}: ${sheetName} ---\n`
            allContent += sheetData + '\n'
          }
        })
        
        return allContent || '表格内容为空'
      } catch (error: any) {
        throw new Error(`Excel表格解析失败: ${error.message}`)
      }
    }

    // 处理所有类型文件
    let fileContent = ''
    let processedFilesCount = 0
    let failedFilesCount = 0
    
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          if (file.type === 'application/pdf') {
            // 使用PDF服务处理文件
            const result = await pdfService.processPDF(file)
            fileContent += `\n\n--- PDF文件: ${file.name} ---\n`
            fileContent += `页数: ${result.pageCount}\n`
            if (result.metadata?.title) {
              fileContent += `标题: ${result.metadata.title}\n`
            }
            if (result.metadata?.author) {
              fileContent += `作者: ${result.metadata.author}\n`
            }
            fileContent += `处理方式: ${result.processedBy === 'api' ? 'iLovePDF API (高精度)' : 'PDF.js (快速处理)'}\n`
            fileContent += `\n内容:\n${result.text}\n`
            processedFilesCount++
          } else if (isTextFile(file)) {
            // 检查文件大小限制 (2MB)
            if (file.size > 2 * 1024 * 1024) {
              console.error('文件太大:', file.name, file.size)
              failedFilesCount++
              continue
            }
            
            // 读取文本文件内容
            const text = await file.text()
            const fileTypeLabel = getFileTypeLabel(file)
            const fileSizeKB = Math.round(file.size / 1024)
            
            fileContent += `\n\n--- ${fileTypeLabel}: ${file.name} ---\n`
            fileContent += `文件大小: ${fileSizeKB}KB\n`
            fileContent += `文件类型: ${file.type || '未知'}\n`
            fileContent += `\n内容:\n${text}\n`
            processedFilesCount++
            
            console.log(`✅ 成功读取${fileTypeLabel}: ${file.name} (${fileSizeKB}KB)`)
          } else if (isOfficeFile(file)) {
            // Office文档处理
            const fileTypeLabel = getOfficeFileTypeLabel(file)
            const fileSizeKB = Math.round(file.size / 1024)
            
            // 检查文件大小限制 (10MB for Office documents)
            if (file.size > 10 * 1024 * 1024) {
              console.error('Office文档文件太大:', file.name, file.size)
              fileContent += `\n\n--- ${fileTypeLabel}: ${file.name} ---\n`
              fileContent += `文件大小: ${fileSizeKB}KB\n`
              fileContent += `解析状态: 失败 - 文件超过10MB限制\n`
              fileContent += `\n请使用较小的文档文件，或手动描述文档内容。\n`
              failedFilesCount++
              continue
            }
            
            fileContent += `\n\n--- ${fileTypeLabel}: ${file.name} ---\n`
            fileContent += `文件大小: ${fileSizeKB}KB\n`
            
            try {
              let documentContent = ''
              
              if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
                console.log(`📄 开始解析Word文档: ${file.name}`)
                documentContent = await parseWordDocument(file)
              } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                console.log(`📊 开始解析Excel表格: ${file.name}`)
                documentContent = await parseExcelDocument(file)
              }
              
              fileContent += `解析状态: 成功\n`
              fileContent += `内容长度: ${documentContent.length}字符\n`
              fileContent += `\n文档内容:\n${documentContent}\n`
              
              processedFilesCount++
              console.log(`✅ 成功解析${fileTypeLabel}: ${file.name} (${documentContent.length}字符)`)
              
            } catch (error: any) {
              fileContent += `解析状态: 失败 - ${error.message}\n`
              fileContent += `\n请检查文档格式是否正确，或手动描述文档内容。\n`
              failedFilesCount++
              console.error(`❌ Office文档解析失败: ${file.name}`, error)
            }
          } else {
            console.warn('不支持的文件类型:', file.name, file.type)
            failedFilesCount++
          }
        } catch (error) {
          console.error(`文件处理失败: ${file.name}`, error)
          failedFilesCount++
        }
      }
      
      // 添加处理统计信息
      if (files.length > 1) {
        fileContent = `\n📁 文件处理统计: 成功${processedFilesCount}个，失败${failedFilesCount}个，总计${files.length}个文件\n` + fileContent
      }
    }
    
    // 如果有文件内容，添加到用户消息中
    if (fileContent) {
      userContent = userContent ? `${userContent}\n\n附件内容：${fileContent}` : `请分析以下文件内容：${fileContent}`
    }
    
    // 添加用户消息
    addUserMessage(userContent, files)
    
    // 检查是否是简单问候
    const isGreeting = isSimpleGreeting(userContent)
    
    // 添加助手思考消息
    const aiMessageId = addAssistantMessage('正在分析中...', 'thinking')
    
    try {
      if (isGreeting) {
        // 简单问候直接回复，不调用API
        await sleep(1000) // 模拟思考时间
        updateMessage(aiMessageId, {
          content: generateGreetingResponse(),
          status: 'complete'
        })
      } else {
        // 检测内容类型并处理
        const contentType = detectContentType(userContent)
        
        // 首先检查用户是否已登录
        if (!isAuthenticated || !user) {
          updateMessage(aiMessageId, {
            content: `🔐 **需要登录才能使用AI功能**

请先登录您的账号以使用AI分析功能：

✅ **已注册用户**: 点击右上角头像登录
🆕 **新用户**: 点击右上角头像快速注册

登录后即可享受：
- 🤖 GPT-5 和 Claude 4 智能分析
- 📊 数据可视化生成  
- 📄 PDF文档解析
- 🎨 HTML页面生成`,
            status: 'error'
          })
          return
        }
        
        if (!hasApiToken) {
          // 如果没有配置API Token，直接显示错误
          updateMessage(aiMessageId, {
            content: `❌ **API配置缺失**

需要配置Replicate API Token才能使用AI功能：

**步骤1**: 在项目根目录创建 \`.env.local\` 文件
**步骤2**: 添加以下内容：
\`\`\`
VITE_REPLICATE_API_TOKEN=你的API密钥
\`\`\`

**获取API密钥**: 访问 https://replicate.com/account

配置完成后刷新页面即可使用完整功能！`,
            status: 'error'
          })
        } else {
          // 如果配置了API Token，调用HTML生成API
          try {
            // 导入API服务
            const { aiService } = await import('@/services/ai')
            
            updateMessage(aiMessageId, { 
              content: t('chat.generatingHTML'), 
              status: 'thinking' 
            })
            
            // 调用HTML生成方法，传递选择的模型、取消信号和语言设置
            const htmlResult = await aiService.generateHTMLVisualization(userContent, undefined, selectedModel, abortControllerRef.current?.signal, language)
            
            // 更新消息显示HTML内容
            updateMessage(aiMessageId, {
              content: htmlResult.htmlContent,
              status: 'complete',
              data: {
                model: selectedModel,
                htmlGenerated: true,
                fileSize: htmlResult.fileSize,
                generatedAt: htmlResult.generatedAt
              }
            })
          } catch (htmlError) {
            // 检查多种AbortError情况
            if (htmlError instanceof Error && 
                (htmlError.name === 'AbortError' || 
                 htmlError.message.includes('abort') || 
                 htmlError.message.includes('Aborted') ||
                 htmlError.message.includes('signal is aborted'))) {
              console.log('🛑 用户取消了处理，不执行降级流程')
              throw htmlError
            }
            
            console.error('HTML生成失败，尝试降级到原有流程:', htmlError)
            
            // 检查signal是否已经被abort
            if (abortControllerRef.current?.signal.aborted) {
              console.log('🛑 Signal已被abort，不执行降级流程')
              throw new Error('处理已被用户取消')
            }
            
            // 如果HTML生成失败，回退到原有的内容分析流程，传递signal
            await processUserInput(userContent, contentType, aiMessageId, abortControllerRef.current?.signal)
          }
        }
      }
    } catch (error) {
      // 检查是否是用户主动取消
      if (error instanceof Error && error.name === 'AbortError') {
        updateMessage(aiMessageId, {
          content: '处理已被终止',
          status: 'complete'
        })
      } else {
        updateMessage(aiMessageId, {
          content: `抱歉，处理过程中出现错误：${error instanceof Error ? error.message : '未知错误'}`,
          status: 'error'
        })
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }


  return {
    inputText,
    setInputText,
    isProcessing,
    handleSendMessage,
    cancelProcessing
  }
}