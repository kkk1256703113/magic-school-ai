/**
 * 项目日志记录工具
 * 用于跟踪项目构建、运行和错误状态
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  details?: any
  context?: string
}

class Logger {
  private logs: LogEntry[] = []
  private isDevelopment = import.meta.env.DEV

  /**
   * 记录信息日志
   */
  info(message: string, details?: any, context?: string) {
    this.log(LogLevel.INFO, message, details, context)
  }

  /**
   * 记录警告日志
   */
  warn(message: string, details?: any, context?: string) {
    this.log(LogLevel.WARN, message, details, context)
  }

  /**
   * 记录错误日志
   */
  error(message: string, details?: any, context?: string) {
    this.log(LogLevel.ERROR, message, details, context)
  }

  /**
   * 记录成功日志
   */
  success(message: string, details?: any, context?: string) {
    this.log(LogLevel.SUCCESS, message, details, context)
  }

  /**
   * 记录项目初始化状态
   */
  logProjectInit() {
    this.success('项目初始化开始', {
      timestamp: new Date().toISOString(),
      environment: this.isDevelopment ? 'development' : 'production'
    }, 'ProjectInit')
  }

  /**
   * 记录环境检查状态
   */
  logEnvironmentCheck(nodeVersion?: string, npmVersion?: string, pythonVersion?: string, javaVersion?: string) {
    this.info('环境检查完成', {
      nodeVersion,
      npmVersion,
      pythonVersion,
      javaVersion,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }, 'EnvironmentCheck')
  }

  /**
   * 记录依赖安装状态
   */
  logDependencyInstall(success: boolean, error?: string) {
    if (success) {
      this.success('依赖安装成功')
    } else {
      this.error('依赖安装失败', { error }, 'DependencyInstall')
    }
  }

  /**
   * 记录构建状态
   */
  logBuildStatus(success: boolean, errors?: string[], warnings?: string[]) {
    if (success) {
      this.success('项目构建成功', { warnings })
    } else {
      this.error('项目构建失败', { errors, warnings }, 'Build')
    }
  }

  /**
   * 记录开发服务器状态
   */
  logDevServerStatus(running: boolean, port?: number, error?: string) {
    if (running) {
      this.success(`开发服务器启动成功 - 端口: ${port}`)
    } else {
      this.error('开发服务器启动失败', { error }, 'DevServer')
    }
  }

  /**
   * 记录API配置状态
   */
  logAPIConfig(config: Record<string, any>) {
    this.info('API配置加载', {
      hasGoogleVision: !!config.googleVision?.apiKey,
      hasMathPix: !!config.mathpix?.appId,
      hasOpenAI: !!config.openai?.apiKey,
      hasCloudflareR2: !!config.cloudflareR2?.accountId,
      hasCloudinary: !!config.cloudinary?.cloudName
    }, 'APIConfig')
  }

  /**
   * 记录文件上传状态
   */
  logFileUpload(fileName: string, fileSize: number, success: boolean, error?: string) {
    if (success) {
      this.success(`文件上传成功: ${fileName} (${this.formatFileSize(fileSize)})`)
    } else {
      this.error(`文件上传失败: ${fileName}`, { error }, 'FileUpload')
    }
  }

  /**
   * 记录内容处理状态
   */
  logContentProcessing(contentType: string, success: boolean, processingTime?: number, error?: string) {
    if (success) {
      this.success(`内容处理成功: ${contentType}`, { processingTime })
    } else {
      this.error(`内容处理失败: ${contentType}`, { error, processingTime }, 'ContentProcessing')
    }
  }

  /**
   * 记录组件集成状态
   */
  logComponentIntegration(componentName: string, status: 'success' | 'error', details?: any) {
    if (status === 'success') {
      this.success(`组件集成成功: ${componentName}`, details, 'ComponentIntegration')
    } else {
      this.error(`组件集成失败: ${componentName}`, details, 'ComponentIntegration')
    }
  }

  /**
   * 记录第二阶段完成状态
   */
  logPhaseTwoCompletion() {
    this.success('第二阶段：核心组件开发完成', {
      timestamp: new Date().toISOString(),
      components: ['HomePage', 'FileUpload', 'ResultsDisplay'],
      features: ['响应式布局', '文件上传', '结果展示', '主题切换', '动画效果']
    }, 'PhaseTwo')
  }

  /**
   * 记录文件上传功能
   */
  logFileUploadFeature() {
    this.success('文件上传功能已实现', {
      features: ['拖拽上传', '点击选择', '文件预览', '文件移除', '多文件支持'],
      supportedFormats: ['PDF', 'PNG', 'JPG', 'JPEG'],
      maxSize: '10MB'
    }, 'FileUpload')
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 获取错误日志
   */
  getErrors(): LogEntry[] {
    return this.logs.filter(log => log.level === LogLevel.ERROR)
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 内部日志记录方法
   */
  private log(level: LogLevel, message: string, details?: any, context?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      context
    }

    this.logs.push(entry)

    // 在开发环境下输出到控制台
    if (this.isDevelopment) {
      const prefix = `[${entry.timestamp}] [${level}]`
      const contextStr = context ? ` [${context}]` : ''
      
      switch (level) {
        case LogLevel.INFO:
          console.log(`${prefix}${contextStr} ${message}`, details || '')
          break
        case LogLevel.WARN:
          console.warn(`${prefix}${contextStr} ${message}`, details || '')
          break
        case LogLevel.ERROR:
          console.error(`${prefix}${contextStr} ${message}`, details || '')
          break
        case LogLevel.SUCCESS:
          console.log(`%c${prefix}${contextStr} ${message}`, 'color: green; font-weight: bold', details || '')
          break
      }
    }
  }
}

// 创建全局日志实例
export const logger = new Logger()

// 在全局对象上暴露日志器（用于调试）
if (typeof window !== 'undefined') {
  (window as any).__EDU_LOGGER__ = logger
}
