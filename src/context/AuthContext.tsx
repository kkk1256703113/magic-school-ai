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
  checkAPILimit: () => Promise<{ canUse: boolean; remaining: number }>
  recordAPIUsage: (endpoint: string, model: string, cost: number, success: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 配置axios默认设置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://45.77.86.20/api'
axios.defaults.baseURL = API_BASE_URL

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
          const response = await axios.get('/auth/verify')
          if (response.data.valid) {
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
      const response = await axios.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      setAuthHeader(newToken)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || '登录失败')
    }
  }

  // 注册
  const register = async (email: string, password: string, username?: string) => {
    try {
      const response = await axios.post('/auth/register', { email, password, username })
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

  // 检查API使用限制
  const checkAPILimit = async () => {
    if (!token) {
      throw new Error('未登录')
    }
    
    try {
      const response = await axios.post('/usage/check')
      return {
        canUse: response.data.canUse,
        remaining: response.data.remaining
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
      await axios.post('/usage/record', {
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