import React, { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, Download, Copy, Code, Eye, ExternalLink } from 'lucide-react'

interface HTMLPreviewProps {
  htmlContent: string
  title?: string
  description?: string
  className?: string
}

export const HTMLPreview: React.FC<HTMLPreviewProps> = ({ 
  htmlContent, 
  title = "HTML预览", 
  description,
  className = "" 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState('400px')

  // 创建blob URL用于iframe显示
  const createBlobUrl = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }

  // 计算iframe高度
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      try {
        const iframeDocument = iframe.contentDocument
        if (iframeDocument) {
          const body = iframeDocument.body
          const html = iframeDocument.documentElement
          const height = Math.max(
            body?.scrollHeight || 0,
            body?.offsetHeight || 0,
            html?.clientHeight || 0,
            html?.scrollHeight || 0,
            html?.offsetHeight || 0
          )
          
          // 设置最小高度300px，最大高度800px
          const calculatedHeight = Math.max(300, Math.min(800, height + 20))
          setIframeHeight(`${calculatedHeight}px`)
        }
      } catch (error) {
        console.warn('无法访问iframe内容，使用默认高度:', error)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [htmlContent])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=800,height=600')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const blobUrl = createBlobUrl(htmlContent)

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </span>
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {description}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={showCode ? "显示预览" : "显示代码"}
          >
            {showCode ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="复制HTML代码"
          >
            <Copy className={`w-4 h-4 ${copySuccess ? 'text-green-600' : ''}`} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="下载HTML文件"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleOpenInNewWindow}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="在新窗口打开"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isFullscreen ? "退出全屏" : "全屏显示"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-800' : ''}`}>
        {isFullscreen && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</h3>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className={`${isFullscreen ? 'h-[calc(100vh-60px)] overflow-auto' : ''}`}>
          {showCode ? (
            /* 代码视图 */
            <div className="p-4">
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto max-h-[600px] text-gray-800 dark:text-gray-200">
                <code>{htmlContent}</code>
              </pre>
            </div>
          ) : (
            /* 预览视图 */
            <div className={`${isFullscreen ? 'p-4 h-full' : ''}`}>
              <iframe
                ref={iframeRef}
                src={blobUrl}
                className={`w-full border-0 ${isFullscreen ? 'h-full' : ''}`}
                style={!isFullscreen ? { height: iframeHeight } : {}}
                title={title}
                sandbox="allow-scripts allow-same-origin allow-forms"
                onError={(e) => {
                  console.error('iframe加载错误:', e)
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 复制成功提示 */}
      {copySuccess && (
        <div className="absolute top-2 right-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded text-sm">
          已复制！
        </div>
      )}
    </div>
  )
}