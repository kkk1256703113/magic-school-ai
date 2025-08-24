// File upload types
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

// Processing status types
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

export interface ProcessingState {
  status: ProcessingStatus
  progress: number
  message: string
  error?: string
}

// Content types
export interface TextContent {
  id: string
  type: 'text'
  content: string
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface FormulaContent {
  id: string
  type: 'formula'
  latex: string
  confidence: number
  category: 'math' | 'physics' | 'chemistry' | 'biology'
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export type ContentItem = TextContent | FormulaContent

// API response types (moved to AI API Response Types section below)

export interface ProcessingResult {
  id: string
  originalFile: UploadedFile
  textContent: TextContent[]
  formulaContent: FormulaContent[]
  processedAt: Date
  processingTime: number
}

// Theme types
export type Theme = 'light' | 'dark'

// Component props types (removed unused ButtonProps and CardProps)

// Replicate API configuration types
export interface ReplicateAPIConfig {
  auth: string
  userAgent?: string
  fetch?: typeof fetch
}

// Model endpoints configuration
export interface ModelEndpoints {
  deepSeekVL2: string
  janusPro: string
  gpt5: string
}

// API configuration types
export interface APIConfig {
  replicate: ReplicateAPIConfig
  models: ModelEndpoints
  cloudflareR2: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    endpoint: string
  }
  settings: {
    maxFileSize: number
    requestTimeout: number
    maxConcurrentRequests: number
    debugMode: boolean
  }
}

// Legacy API configs removed - no longer needed

// User types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// AI API Response Types
export interface OCRResponse {
  text: string
  confidence: number
  blocks: Array<{
    text: string
    position: {
      x: number
      y: number
      width: number
      height: number
    }
    confidence: number
  }>
}

export interface FormulaResponse {
  formulas: Array<{
    latex: string
    category: 'math' | 'physics' | 'chemistry' | 'biology'
    explanation: string
    difficulty: 'basic' | 'intermediate' | 'advanced'
    confidence: number
  }>
}

export interface VisualizationResponse {
  generatedImage?: string
  codeOptions: {
    chartjs: {
      config: object
      description: string
    }
    svg: {
      code: string
      description: string
    }
    d3?: {
      code: string
      description: string
    }
  }
}

export interface ContentAnalysisResponse {
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  tags: string[]
  learningObjectives: string[]
  prerequisites: string[]
  category: string
  keyTopics: string[]
  suggestions: string[]
  confidence: number
}

// 新增HTML生成响应类型
export interface HTMLVisualizationResponse {
  htmlContent: string
  title?: string
  description?: string
  generatedAt: Date
  fileSize: number
  model?: 'gpt5' | 'claude4'
}

// Processing status types
export interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  startTime?: number
  endTime?: number
  error?: string
  result?: any
}

export interface ProcessingSession {
  id: string
  file: File
  steps: ProcessingStep[]
  totalProgress: number
  status: ProcessingStatus
  results: {
    ocr?: OCRResponse
    formulas?: FormulaResponse
    analysis?: ContentAnalysisResponse
    visualization?: VisualizationResponse
  }
  createdAt: Date
  completedAt?: Date
}

// Temporary storage (until R2 is configured)
export interface TemporaryFileStorage {
  id: string
  originalFile: File
  dataUrl: string
  uploadedAt: Date
  expiresAt: Date
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
