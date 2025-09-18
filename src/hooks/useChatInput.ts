import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isSimpleGreeting, generateGreetingResponse, sleep } from '@/utils/chatHelpers'
import { pdfService } from '@/services/pdfService'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

interface UseChatInputProps {
  addUserMessage: (content: string, files?: File[], parsedFiles?: Array<{content: string, metadata?: any}>) => string
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
  const [isCancelling, setIsCancelling] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentMessageIdRef = useRef<string | null>(null)
  const cancelledMessageIds = useRef(new Set<string>()).current  // 追踪已取消的消息
  const userCancelledRef = useRef(false)  // 追踪用户主动终止标志
  const { t } = useTranslation()

  // 取消处理函数 - 增强版本，提供即时反馈并彻底清理资源
  const cancelProcessing = () => {
    console.log('🛑 用户点击终止按钮，开始取消处理流程')
    
    // 🎯 立即设置用户主动终止标志，防止降级处理执行
    userCancelledRef.current = true
    
    // 🔧 取消前状态快照
    console.log('📸 取消前状态快照:', {
      isProcessing,
      isCancelling,
      hasAbortController: !!abortControllerRef.current,
      signalAborted: abortControllerRef.current?.signal.aborted,
      currentMessageId: currentMessageIdRef.current,
      timestamp: new Date().toISOString()
    })
    
    // 1. 立即设置取消状态
    setIsCancelling(true)
    
    // 2. 保存要更新的消息ID
    const messageIdToUpdate = currentMessageIdRef.current
    
    // 3. 立即更新或创建取消反馈消息
    if (messageIdToUpdate) {
      // 标记为已取消，防止catch块重复更新
      cancelledMessageIds.add(messageIdToUpdate)
      
      console.log('✅ 更新消息为取消状态，messageId:', messageIdToUpdate)
      updateMessage(messageIdToUpdate, {
        content: t('chat.processCancelled'),
        status: 'complete'  // 确保status为complete以显示内容
      })
      console.log('📝 取消反馈已更新')
    } else {
      // 备用反馈机制：直接添加系统消息
      console.warn('⚠️ 当前消息引用为空，创建新的取消反馈消息')
      const backupMessageId = addAssistantMessage(t('chat.processCancelledBackup'), 'complete')
      cancelledMessageIds.add(backupMessageId)
      console.log('🔄 备用反馈消息已创建，messageId:', backupMessageId)
    }
    
    // 4. 执行abort操作
    if (abortControllerRef.current) {
      console.log('🛑 发送AbortController信号')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    } else {
      console.log('⚠️ AbortController不存在，但仍然停止处理')
    }
    
    // 5. 立即重置处理状态
    setIsProcessing(false)
    
    // 6. 延迟重置取消状态和清理引用
    setTimeout(() => {
      setIsCancelling(false)
      currentMessageIdRef.current = null
      console.log('✅ 取消处理完成，所有状态已重置')
    }, 1500)
  }

  const handleSendMessage = async (message: string = inputText, files?: File[]) => {
    if ((!message.trim() && (!files || files.length === 0)) || isProcessing) return
    
    // 🔄 重置用户终止标志，开始新的处理流程
    userCancelledRef.current = false
    
    let userContent = message.trim()
    setInputText('')
    setIsProcessing(true)
    
    // 创建新的AbortController - 添加详细追踪
    const abortControllerId = `AC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    abortControllerRef.current = new AbortController()
    console.log('🔧 AbortController创建:', {
      id: abortControllerId,
      timestamp: new Date().toISOString(),
      isProcessing,
      messageContent: message.substring(0, 30) + '...'
    })
    
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
    let fileContent = ''  // 保留用于AI分析
    const parsedFiles: Array<{content: string, metadata?: any}> = []  // 存储解析结果供UI展示
    let processedFilesCount = 0
    let failedFilesCount = 0
    
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          if (file.type === 'application/pdf') {
            // 使用PDF服务处理文件
            const result = await pdfService.processPDF(file)
            
            // 添加到fileContent用于AI分析
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
            
            // PDF文件使用PDFViewer，不需要添加到parsedFiles
            // parsedFiles.push({ content: '', metadata: {} })  // 占位符保持索引对应
            parsedFiles.push({
              content: '',  // PDF由PDFViewer处理，这里为空
              metadata: { isPDF: true }
            })
            
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
            
            // 添加到fileContent用于AI分析
            fileContent += `\n\n--- ${fileTypeLabel}: ${file.name} ---\n`
            fileContent += `文件大小: ${fileSizeKB}KB\n`
            fileContent += `文件类型: ${file.type || '未知'}\n`
            fileContent += `\n内容:\n${text}\n`
            
            // 添加到parsedFiles用于DocumentViewer展示
            parsedFiles.push({
              content: text,
              metadata: {
                lines: text.split('\n').length,
                characters: text.length,
                encoding: 'UTF-8'
              }
            })
            
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
              
              // 添加到fileContent用于AI分析
              fileContent += `解析状态: 成功\n`
              fileContent += `内容长度: ${documentContent.length}字符\n`
              fileContent += `\n文档内容:\n${documentContent}\n`
              
              // 添加到parsedFiles用于DocumentViewer展示
              const metadata: any = {
                characters: documentContent.length,
                lines: documentContent.split('\n').length
              }
              
              // 为Excel文件添加工作表信息
              if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                const sheetMatches = documentContent.match(/--- 工作表 \d+: (.+?) ---/g)
                if (sheetMatches) {
                  metadata.sheets = sheetMatches.map(match => 
                    match.replace(/--- 工作表 \d+: (.+?) ---/, '$1')
                  )
                }
              }
              
              parsedFiles.push({
                content: documentContent,
                metadata
              })
              
              processedFilesCount++
              console.log(`✅ 成功解析${fileTypeLabel}: ${file.name} (${documentContent.length}字符)`)
              
            } catch (error: any) {
              fileContent += `解析状态: 失败 - ${error.message}\n`
              fileContent += `\n请检查文档格式是否正确，或手动描述文档内容。\n`
              
              // 添加失败占位符到parsedFiles
              parsedFiles.push({
                content: '',
                metadata: { failed: true, error: error.message }
              })
              
              failedFilesCount++
              console.error(`❌ Office文档解析失败: ${file.name}`, error)
            }
          } else {
            console.warn('不支持的文件类型:', file.name, file.type)
            
            // 添加不支持文件的占位符到parsedFiles
            parsedFiles.push({
              content: '',
              metadata: { unsupported: true }
            })
            
            failedFilesCount++
          }
        } catch (error) {
          console.error(`文件处理失败: ${file.name}`, error)
          
          // 添加处理失败占位符到parsedFiles
          parsedFiles.push({
            content: '',
            metadata: { failed: true, error: error instanceof Error ? error.message : '未知错误' }
          })
          
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
    
    // 添加用户消息，传递原文件和解析结果
    addUserMessage(userContent, files, parsedFiles.length > 0 ? parsedFiles : undefined)
    
    // 检查是否是简单问候
    const isGreeting = isSimpleGreeting(userContent)
    
    // 添加助手思考消息
    const aiMessageId = addAssistantMessage('正在分析中...', 'thinking')
    
    // 保存当前消息ID，以便取消时使用
    currentMessageIdRef.current = aiMessageId
    
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
          console.log('🔐 用户未登录，终止处理流程')
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
        
        // 🔧 状态追踪：记录进入可视化流程前的状态
        console.log('📊 流程状态检查:', {
          isProcessing,
          hasAbortController: !!abortControllerRef.current,
          signalAborted: abortControllerRef.current?.signal.aborted,
          messageId: aiMessageId,
          timestamp: new Date().toISOString()
        })
        
        // 🔍 关键调试：详细记录API Token检查状态
        console.log('🔍 API Token检查详情:', {
          hasApiToken,
          环境: import.meta.env.PROD ? '生产环境' : '开发环境',
          环境变量: import.meta.env.VITE_REPLICATE_API_TOKEN ? '存在' : '不存在',
          当前时间: new Date().toISOString(),
          用户内容: userContent.substring(0, 50) + '...'
        })

        // 生产环境备用检查：如果hasApiToken为false但在生产环境，仍然尝试API调用
        const isProduction = import.meta.env.PROD
        const shouldProceed = hasApiToken || isProduction
        
        console.log('🔧 可视化流程决策:', { 
          hasApiToken, 
          isProduction, 
          shouldProceed,
          决策依据: shouldProceed ? 'API已配置或生产环境' : 'API未配置且非生产环境'
        })

        if (!shouldProceed) {
          console.log('❌ 终止可视化流程：API Token未配置且非生产环境')
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
          console.log('✅ 进入可视化流程，原因:', shouldProceed && hasApiToken ? 'hasApiToken=true' : '生产环境备用通道')
          
          // 🔧 关键状态追踪：可视化开始前的完整状态快照
          console.log('🎯 可视化开始前状态快照:', {
            isProcessing,
            hasAbortController: !!abortControllerRef.current,
            signalAborted: abortControllerRef.current?.signal.aborted,
            currentMessageId: currentMessageIdRef.current,
            targetMessageId: aiMessageId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 50),
            堆栈跟踪: new Error().stack?.split('\n').slice(0, 3)
          })
          
          // 如果配置了API Token，调用HTML生成API
          try {
            // 导入API服务
            const { aiService } = await import('@/services/ai')
            
            updateMessage(aiMessageId, { 
              content: t('chat.generatingHTML'), 
              status: 'thinking' 
            })
            
            // 添加可视化处理状态日志
            console.log('🎨 可视化开始时间:', new Date().toISOString())
            console.log('⏰ 预计耗时: 1-3分钟，请耐心等待')
            console.log('🔧 超时设置: 120秒请求 + 300秒轮询 (60次×5秒)')
            console.log('📋 任务参数:', { selectedModel, contentLength: userContent.length, language })
            
            // 调用HTML生成方法，传递选择的模型、取消信号和语言设置
            const htmlResult = await aiService.generateHTMLVisualization(userContent, undefined, selectedModel, abortControllerRef.current?.signal, language)
            
            // 记录成功完成日志
            console.log('✅ 可视化完成时间:', new Date().toISOString())
            console.log('📊 生成结果:', { 
              htmlLength: htmlResult.htmlContent.length, 
              fileSize: htmlResult.fileSize,
              title: htmlResult.title 
            })
            
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
            
            // 🔧 关键检查点：修复后的状态检查逻辑
            const signalAborted = abortControllerRef.current?.signal.aborted
            const hasValidController = !!abortControllerRef.current
            
            console.log('🔍 降级前状态检查(修复版):', {
              isProcessing,
              signalAborted,
              hasValidController,
              currentMessageId: currentMessageIdRef.current,
              aiMessageId,
              timestamp: new Date().toISOString(),
              检查结果: signalAborted ? '终止(由于Signal)' : '继续处理',
              修复说明: '不再检查isProcessing防止React重渲染导致误判'
            })
            
            // 🚪 修复：只检查AbortSignal状态，不检查isProcessing
            // 原因：React组件重渲染会导致isProcessing被重置，引起误判
            if (signalAborted) {
              console.log('🛑 检测到AbortSignal，终止降级流程', {
                signalAborted,
                原因: 'AbortController.signal已被用户或系统取消',
                修复注释: '不再依赖isProcessing状态，避免组件重渲染干扰'
              })
              throw new Error('处理已被用户取消')
            }
            
            // 🚫 优先检查用户是否主动终止，如果是则不执行任何降级处理
            if (userCancelledRef.current) {
              console.log('🛑 用户主动终止处理，不执行降级流程，直接退出', {
                userCancelled: userCancelledRef.current,
                timestamp: new Date().toISOString(),
                htmlError: htmlError instanceof Error ? htmlError.message : String(htmlError)
              })
              return  // 直接退出，不执行降级处理
            }
            
            console.error('HTML生成失败，尝试降级到原有流程:', htmlError)
            
            // 🔧 降级前二次确认：修复后的检查逻辑
            const finalSignalCheck = abortControllerRef.current?.signal.aborted
            const finalControllerExists = !!abortControllerRef.current
            
            console.log('🔍 降级前二次确认(修复版):', {
              isProcessing,
              signalAborted: finalSignalCheck,
              hasAbortController: finalControllerExists,
              timestamp: new Date().toISOString(),
              最终决定: finalSignalCheck ? '终止处理' : '继续降级',
              修复说明: '只检查Signal状态，不检查isProcessing'
            })
            
            // 🚪 修复：检查AbortSignal和用户主动终止标志
            if (finalSignalCheck || userCancelledRef.current) {
              console.log('🛑 降级前最终检测：用户已取消，终止所有处理', {
                signalAborted: finalSignalCheck,
                userCancelled: userCancelledRef.current,
                原因: finalSignalCheck ? 'AbortSignal被激活' : '用户主动终止',
                修复效果: '双重检查确保用户终止时不执行降级处理'
              })
              throw new Error('处理已被用户取消')
            }
            
            console.log('✅ 降级前检查通过，继续降级流程')
            
            // 如果HTML生成失败，回退到原有的内容分析流程，传递signal
            await processUserInput(userContent, contentType, aiMessageId, abortControllerRef.current?.signal)
          }
        }
      }
    } catch (error) {
      // 检查是否是用户主动取消
      if (error instanceof Error && 
          (error.name === 'AbortError' || 
           error.message.includes('处理已被用户取消') ||
           error.message.includes('用户取消'))) {
        
        // 检查是否已经在cancelProcessing中处理过
        if (!cancelledMessageIds.has(aiMessageId)) {
          // 只有当cancelProcessing没有处理时才更新
          if (currentMessageIdRef.current === aiMessageId) {
            updateMessage(aiMessageId, {
              content: t('chat.processCancelled'),
              status: 'complete'
            })
            console.log('🔄 catch块更新了取消消息')
          }
        } else {
          console.log('✅ 消息已在cancelProcessing中处理，跳过catch块更新')
        }
      } else {
        // 错误消息正常显示
        updateMessage(aiMessageId, {
          content: `😔 处理过程中遇到问题：${error instanceof Error ? error.message : '未知错误'}\n\n您可以重新尝试或联系支持。`,
          status: 'error'
        })
      }
    } finally {
      // 🔧 Finally块状态追踪
      console.log('🧹 Finally块清理开始:', {
        isProcessing,
        hasAbortController: !!abortControllerRef.current,
        signalAborted: abortControllerRef.current?.signal.aborted,
        messageId: aiMessageId,
        timestamp: new Date().toISOString(),
        修复注释: '修复后的清理逻辑，保持稳定性'
      })
      
      // 🚪 修复：先清理AbortController，再重置isProcessing
      // 防止编程时序问题
      if (abortControllerRef.current) {
        abortControllerRef.current = null
        console.log('🗑️ AbortController已清理')
      }
      
      setIsProcessing(false)
      console.log('✅ Finally块清理完成: isProcessing=false')
      
      // 延迟清理messageId引用和取消记录
      setTimeout(() => {
        currentMessageIdRef.current = null
        // 清理已处理的取消记录，防止内存泄漏
        if (aiMessageId) {
          cancelledMessageIds.delete(aiMessageId)
        }
        console.log('🗑️ 延迟清理完成: messageId和cancelledIds已清理')
      }, 2000)  // 延长到2秒，确保所有处理完成
    }
  }


  return {
    inputText,
    setInputText,
    isProcessing,
    isCancelling,
    handleSendMessage,
    cancelProcessing
  }
}