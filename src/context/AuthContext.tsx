import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: number
  email: string
  username: string
  plan_type: string
  api_calls_today?: number
  api_calls_total?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username?: string) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  checkAPILimit: () => Promise<{ canUse: boolean; remaining: number }>
  recordAPIUsage: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 配置axios默认设置
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
// 注意：不设置baseURL，让每个请求使用完整路径
// axios.defaults.baseURL = API_BASE_URL

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // 设置axios认证头
  const setAuthHeader = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // 验证token并获取用户信息
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        setAuthHeader(token)
        try {
          const response = await axios.get('/api/auth/status')
          if (response.data.authenticated) {
            setUser(response.data.user)
          } else {
            logout()
          }
        } catch (error) {
          console.error('Token验证失败:', error)
          logout()
        }
      }
      setIsLoading(false)
    }

    verifyToken()
  }, [])

  // 登录
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      setAuthHeader(newToken)
    } catch (error: any) {
      // 处理不同类型的错误
      if (error.response) {
        // 服务器返回了错误响应
        const errorMessage = error.response.data?.error || error.response.data?.message
        if (errorMessage) {
          throw new Error(errorMessage)
        } else {
          // 根据状态码提供更友好的错误信息
          switch (error.response.status) {
            case 401:
              throw new Error('邮箱或密码错误')
            case 404:
              throw new Error('用户不存在')
            case 500:
              throw new Error('服务器错误，请稍后重试')
            default:
              throw new Error('登录失败，请检查网络连接')
          }
        }
      } else if (error.request) {
        // 网络错误
        throw new Error('网络连接失败，请检查网络后重试')
      } else {
        // 其他错误
        throw new Error('登录失败，请重试')
      }
    }
  }

  // 注册
  const register = async (email: string, password: string, username?: string) => {
    try {
      const response = await axios.post('/api/auth/register', { email, password, username })
      const { token: newToken, user: userData } = response.data
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      setAuthHeader(newToken)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '注册失败')
    }
  }

  // 登出
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    setAuthHeader(null)
  }

  // 忘记密码
  const forgotPassword = async (email: string) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email })
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || error.response.data?.error || '发送重置邮件失败')
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络后重试')
      } else {
        throw new Error('发送重置邮件失败，请重试')
      }
    }
  }

  // 重置密码
  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/reset-password', { token, password })
      return response.data
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error
        if (errorMessage) {
          throw new Error(errorMessage)
        } else {
          switch (error.response.status) {
            case 400:
              throw new Error('重置链接无效或已过期')
            case 500:
              throw new Error('服务器错误，请稍后重试')
            default:
              throw new Error('密码重置失败')
          }
        }
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络后重试')
      } else {
        throw new Error('密码重置失败，请重试')
      }
    }
  }

  // 检查API使用限制
  const checkAPILimit = async () => {
    if (!token) {
      throw new Error('未登录')
    }
    
    try {
      const response = await axios.get('/api/usage/check')
      return {
        canUse: response.data.apiCallsRemaining > 0,  // 根据剩余次数判断是否可用
        remaining: response.data.apiCallsRemaining     // 使用正确的字段名
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        return { canUse: false, remaining: 0 }
      }
      throw error
    }
  }

  // 记录API使用
  const recordAPIUsage = async (endpoint: string, model: string, cost: number, success: boolean) => {
    if (!token) return
    
    try {
      await axios.post('/api/usage/record', {
        endpoint,
        model,
        cost,
        success
      })
    } catch (error) {
      console.error('记录API使用失败:', error)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    checkAPILimit,
    recordAPIUsage
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内使用')
  }
  return context
}