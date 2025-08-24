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
    model?: 'gpt5' | 'claude37'
    generatedImage?: string
    codeOptions?: {
      chartjs?: {
        type: string
        config: any
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
  }
}

export type ContentType = 'text' | 'formula' | 'mixed'

export interface ChatState {
  messages: Message[]
  inputText: string
  isProcessing: boolean
  useMockAPI: boolean
  selectedModel: 'gpt5' | 'claude37'
}

export interface APIConfig {
  hasToken: boolean
  tokenValue?: string
  useMockAPI: boolean
}