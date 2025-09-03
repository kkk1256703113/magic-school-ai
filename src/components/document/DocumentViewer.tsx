import React, { useState } from 'react'
import { 
  FileText, 
  Download, 
  Eye, 
  FileCode, 
  Table,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react'


interface DocumentViewerProps {
  file: File
  parsedContent?: string
  metadata?: any
  onContentExtracted?: (content: string) => void
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  file, 
  parsedContent, 
  metadata
}) => {
  const [showFullContent, setShowFullContent] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // 确定文件类型和图标
  const getFileTypeInfo = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (file.type === 'text/plain' || ext === 'txt') {
      return { type: 'TXT文件', icon: FileText, color: 'text-blue-600' }
    }
    if (file.type === 'text/markdown' || ext === 'md') {
      return { type: 'Markdown文件', icon: FileCode, color: 'text-purple-600' }
    }
    if (file.type === 'application/json' || ext === 'json') {
      return { type: 'JSON文件', icon: FileCode, color: 'text-green-600' }
    }
    if (file.type === 'text/csv' || ext === 'csv') {
      return { type: 'CSV文件', icon: Table, color: 'text-orange-600' }
    }
    if (file.type === 'text/html' || ext === 'html') {
      return { type: 'HTML文件', icon: FileCode, color: 'text-red-600' }
    }
    if (ext === 'doc' || ext === 'docx' || file.type.includes('wordprocessingml')) {
      return { type: 'Word文档', icon: FileText, color: 'text-blue-700' }
    }
    if (ext === 'xls' || ext === 'xlsx' || file.type.includes('spreadsheetml')) {
      return { type: 'Excel表格', icon: FileSpreadsheet, color: 'text-green-700' }
    }
    
    return { type: '文档', icon: FileText, color: 'text-gray-600' }
  }

  const fileInfo = getFileTypeInfo(file)
  const IconComponent = fileInfo.icon
  const fileSizeKB = Math.round(file.size / 1024)

  // 格式化显示内容
  const formatContent = (content: string, fileType: string) => {
    if (!content) return ''
    
    // JSON格式化
    if (fileType === 'JSON文件') {
      try {
        const parsed = JSON.parse(content)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return content
      }
    }
    
    // CSV表格化显示（简单处理）
    if (fileType === 'CSV文件') {
      const lines = content.split('\n').slice(0, 10) // 只显示前10行
      if (lines.length > 1) {
        const headers = lines[0].split(',')
        const rows = lines.slice(1).map(line => line.split(','))
        
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="px-2 py-1 text-left border">{header.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-1 border">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">... 还有 {rows.length - 5} 行数据</p>
            )}
          </div>
        )
      }
    }
    
    // Excel工作表显示
    if (fileType === 'Excel表格' && metadata?.sheets) {
      const lines = content.split('\n')
      const sections = []
      let currentSection: string[] = []
      
      for (const line of lines) {
        if (line.startsWith('--- 工作表')) {
          if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'))
          }
          currentSection = [line]
        } else {
          currentSection.push(line)
        }
      }
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'))
      }
      
      return (
        <div className="space-y-4">
          {sections.map((section, index) => {
            const lines = section.split('\n')
            const sheetTitle = lines[0]
            const sheetContent = lines.slice(1).join('\n')
            
            return (
              <details key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <summary className="px-3 py-2 bg-gray-50 dark:bg-gray-700 cursor-pointer font-medium">
                  {sheetTitle.replace('--- ', '').replace(' ---', '')}
                </summary>
                <div className="p-3 max-h-40 overflow-y-auto text-sm whitespace-pre-wrap">
                  {sheetContent}
                </div>
              </details>
            )
          })}
        </div>
      )
    }
    
    // 默认文本显示
    return content
  }

  const displayContent = parsedContent || ''
  const formattedContent = formatContent(displayContent, fileInfo.type)

  // 复制内容
  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(displayContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }


  // 下载提取的文本
  const downloadText = () => {
    if (!displayContent) return
    
    const blob = new Blob([displayContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.name.split('.')[0]}_extracted.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* 头部信息 */}
      <div className="flex items-center gap-2 mb-4">
        <IconComponent className={`h-5 w-5 ${fileInfo.color}`} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {file.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fileInfo.type} • {fileSizeKB}KB
          </p>
        </div>
      </div>

      {/* 元数据信息 */}
      {metadata && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 space-y-1">
          {metadata.sheets && (
            <p className="text-sm">
              <strong>工作表数量:</strong> {metadata.sheets.length}
            </p>
          )}
          {metadata.lines && (
            <p className="text-sm">
              <strong>行数:</strong> {metadata.lines}
            </p>
          )}
          {metadata.characters && (
            <p className="text-sm">
              <strong>字符数:</strong> {metadata.characters}
            </p>
          )}
        </div>
      )}

      {/* 内容预览 */}
      {displayContent && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              {fileInfo.type === 'Excel表格' ? '工作表内容' : '文档内容'}
            </h4>
            <div className="flex gap-2">
              {/* 展开/收起按钮 */}
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Eye className="h-3 w-3" />
                {showFullContent ? '收起' : '展开'}
              </button>
              
              {/* 复制按钮 */}
              <button
                onClick={copyContent}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? '已复制' : '复制'}
              </button>
              
              {/* 下载文本按钮 */}
              <button
                onClick={downloadText}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <Download className="h-3 w-3" />
                下载文本
              </button>
            </div>
          </div>
          
          {/* 内容显示区域 */}
          <div className={`text-sm text-gray-600 dark:text-gray-400 ${!showFullContent ? 'max-h-32 overflow-hidden' : ''}`}>
            {typeof formattedContent === 'string' ? (
              <pre className="whitespace-pre-wrap font-mono">{formattedContent}</pre>
            ) : (
              formattedContent
            )}
          </div>
          
          {/* 显示更多按钮 */}
          {!showFullContent && displayContent.length > 500 && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowFullContent(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                显示更多...
              </button>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮区域 */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {displayContent && `内容长度: ${displayContent.length} 字符`}
        </div>
      </div>
    </div>
  )
}