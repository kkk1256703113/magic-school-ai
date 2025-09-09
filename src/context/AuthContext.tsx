import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { API_ROUTES } from '@/config/apiRoutes'
import { configureAxios } from '@/config/api'

interface User {
  id: number
  email: string
  username: string
  plan_type: string
  created_at?: string
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
  sendVerificationCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<boolean>
  googleLogin: () => Promise<void>
  isDevMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 配置axios默认设置
configureAxios(axios)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)
  const [verificationCodes] = useState<Map<string, string>>(new Map())
  
  // 检查是否为开发模式
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

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
          const response = await axios.get(API_ROUTES.AUTH.STATUS)
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
      const response = await axios.post(API_ROUTES.AUTH.LOGIN, { email, password })
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
      const response = await axios.post(API_ROUTES.AUTH.REGISTER, { email, password, username })
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
      const response = await axios.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email })
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
      const response = await axios.post(API_ROUTES.AUTH.RESET_PASSWORD, { token, password })
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
      const response = await axios.get(API_ROUTES.USAGE.CHECK)
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
      await axios.post(API_ROUTES.USAGE.RECORD, {
        endpoint,
        model,
        cost,
        success
      })
    } catch (error) {
      console.error('记录API使用失败:', error)
    }
  }

  // 发送验证码
  const sendVerificationCode = async (email: string) => {
    try {
      // 总是调用真实API发送验证码
      const response = await axios.post(API_ROUTES.AUTH.SEND_CODE, { email })
      
      if (response.data.success) {
        console.log(`[AUTH] Verification code sent to ${email}`);
        return response.data;
      } else {
        throw new Error(response.data.message || '发送验证码失败');
      }
    } catch (error: any) {
      console.error('[AUTH] Send verification code error:', error);
      if (error.response?.status === 429) {
        // 频率限制错误
        const waitTime = error.response.data.waitTime || 60;
        throw new Error(`请等待 ${waitTime} 秒后再试`);
      }
      throw new Error(error.response?.data?.message || error.message || '发送验证码失败');
    }
  }

  // 验证验证码
  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    try {
      // 总是调用真实API验证
      const response = await axios.post(API_ROUTES.AUTH.VERIFY_CODE, { email, code })
      
      if (response.data.success && response.data.token) {
        // 如果返回了token，自动登录
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        setAuthHeader(newToken);
        console.log(`[AUTH] User logged in via email verification: ${email}`);
      }
      
      return response.data.success
    } catch (error: any) {
      console.error('[AUTH] Verify code error:', error);
      return false
    }
  }

  // Google登录
  const googleLogin = async () => {
    try {
      if (isDevMode) {
        // 开发模式：模拟Google登录
        const mockEmail = import.meta.env.VITE_MOCK_GOOGLE_EMAIL || 'test@gmail.com'
        const mockUser = import.meta.env.VITE_MOCK_GOOGLE_USER || '测试用户'
        
        // 模拟后端响应
        const mockToken = 'mock_jwt_token_' + Date.now()
        const userData = {
          id: 999,
          email: mockEmail,
          username: mockUser,
          plan_type: 'free',
          api_calls_today: 0
        }
        
        setToken(mockToken)
        setUser(userData)
        localStorage.setItem('token', mockToken)
        setAuthHeader(mockToken)
        
        console.log(`[DEV MODE] Google登录成功: ${mockEmail}`)
        return
      }
      
      // 生产模式：真实Google OAuth流程
      const response = await axios.post(API_ROUTES.AUTH.GOOGLE)
      const { token: newToken, user: userData } = response.data
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      setAuthHeader(newToken)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Google登录失败')
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
    recordAPIUsage,
    sendVerificationCode,
    verifyCode,
    googleLogin,
    isDevMode
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