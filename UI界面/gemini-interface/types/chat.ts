export interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'thinking' | 'complete' | 'error'
  data?: {
    formulas?: any
    analysis?: any
    visualization?: any
    files?: File[]
    contentType?: 'text' | 'formula' | 'mixed'
    isLocalAnalysis?: boolean
    hasApiToken?: boolean
    hasErrors?: boolean
    errorDetails?: string[]
    model?: 'gpt5' | 'claude4'
    generatedImage?: string
    codeOptions?: {
      chartjs?: {
        type: string
        config: any
        description?: string
      }
      svg?: {
        code: string
        description: string
      }
      d3?: {
        code: string
        description: string
      }
    }
    // Gemini扩展：HTML作品集生成
    htmlContent?: string
    // 支持更多文件类型
    supportedFileTypes?: string[]
  }
}

export type ContentType = 'text' | 'formula' | 'mixed' | 'html' | 'visualization'

export interface ChatState {
  messages: Message[]
  inputText: string
  isProcessing: boolean
  selectedModel: 'gpt5' | 'claude4'
  isAuthenticated: boolean
  currentUser?: {
    id: string
    email: string
    plan: 'free' | 'monthly' | 'quarterly' | 'yearly'
  }
}

export interface APIConfig {
  hasToken: boolean
  tokenValue?: string
}

export interface FileUploadState {
  files: File[]
  isUploading: boolean
  uploadProgress: number
  supportedTypes: string[]
}

// UI相关类型
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  fontScale: number
}

export interface ChatSettings {
  theme: ThemeConfig
  language: 'zh' | 'en'
  autoSave: boolean
  notifications: boolean
}