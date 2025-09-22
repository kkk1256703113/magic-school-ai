import React, { useEffect, useState } from 'react'
import { FileText, Download, Eye, Loader2 } from 'lucide-react'
import { pdfService } from '@/services/pdfService'

interface PDFViewerProps {
  file: File
  onTextExtracted?: (text: string) => void
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, onTextExtracted }) => {
  const [preview, setPreview] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [processResult, setProcessResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [showFullText, setShowFullText] = useState(false)

  useEffect(() => {
    processPDF()
  }, [file])

  const processPDF = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // 生成预览图
      const previewImage = await pdfService.generatePreview(file)
      setPreview(previewImage)
      
      // 处理PDF提取文本
      const result = await pdfService.processPDF(file)
      setProcessResult(result)
      
      // 回调提取的文本
      if (onTextExtracted) {
        onTextExtracted(result.text)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理PDF时出错')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadText = () => {
    if (!processResult) return
    
    const blob = new Blob([processResult.text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.name.replace('.pdf', '')}_extracted.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* 头部信息 */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          {file.name}
        </h3>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            正在处理PDF文件...
          </p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 预览和结果 */}
      {!isLoading && !error && processResult && (
        <div className="space-y-4">
          {/* 预览图 */}
          {preview && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <img 
                src={preview} 
                alt="PDF document first page preview - Magic School AI visualization" 
                className="w-full max-h-64 object-contain bg-gray-50 dark:bg-gray-700"
              />
            </div>
          )}

          {/* 元数据 */}
          {processResult.metadata && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1">
              {processResult.metadata.title && (
                <p className="text-sm"><strong>标题:</strong> {processResult.metadata.title}</p>
              )}
              {processResult.metadata.author && (
                <p className="text-sm"><strong>作者:</strong> {processResult.metadata.author}</p>
              )}
              {processResult.metadata.subject && (
                <p className="text-sm"><strong>主题:</strong> {processResult.metadata.subject}</p>
              )}
            </div>
          )}

          {/* 文本预览 */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">提取的文本</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  {showFullText ? '收起' : '展开'}
                </button>
                <button
                  onClick={downloadText}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  下载
                </button>
              </div>
            </div>
            
            <div className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap ${!showFullText ? 'max-h-32 overflow-hidden' : ''}`}>
              {processResult.text}
            </div>
            
            {!showFullText && processResult.text.length > 500 && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => setShowFullText(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  显示更多...
                </button>
              </div>
            )}
          </div>

          {/* 处理统计 */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            字符数: {processResult.text.length}
          </div>
        </div>
      )}
    </div>
  )
}