import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { level: 0, text: '太短' }
    if (password.length < 8) return { level: 1, text: '弱' }
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) return { level: 3, text: '强' }
    if (password.match(/^(?=.*[a-zA-Z])(?=.*\d)/)) return { level: 2, text: '中等' }
    return { level: 1, text: '弱' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !code || !password || !confirmPassword) {
      setErrorMessage('请填写所有字段')
      return
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('请输入有效的邮箱地址')
      return
    }
    
    if (code.length !== 6) {
      setErrorMessage('验证码应为6位数字')
      return
    }
    
    if (password.length < 6) {
      setErrorMessage('密码至少需要6位')
      return
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    
    try {
      await resetPassword(email, code, password)
      setIsSuccess(true)
      toast.success('密码重置成功！')
    } catch (error: any) {
      setErrorMessage(error.message || '密码重置失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/')
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              密码重置成功！
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              您的密码已成功重置，现在可以使用新密码登录了。
            </p>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleBackToLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              返回登录页面
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <button
            onClick={handleBackToLogin}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回登录
          </button>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              重置密码
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              设置您的新密码
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="请输入邮箱地址"
              required
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              验证码
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              请输入邮箱中收到的6位验证码
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              新密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="请输入新密码"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">密码强度：</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.level === 0 ? 'text-red-500' :
                    passwordStrength.level === 1 ? 'text-orange-500' :
                    passwordStrength.level === 2 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordStrength.level === 0 ? 'bg-red-500 w-1/4' :
                      passwordStrength.level === 1 ? 'bg-orange-500 w-2/4' :
                      passwordStrength.level === 2 ? 'bg-yellow-500 w-3/4' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              确认新密码
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="请再次输入新密码"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {confirmPassword && password && (
              <div className="mt-1 text-xs">
                {confirmPassword === password ? (
                  <span className="text-green-600 dark:text-green-400">✓ 密码匹配</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗ 密码不一致</span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !code || !password || !confirmPassword || password !== confirmPassword}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? '重置中...' : '重置密码'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            验证码将在5分钟后过期，请及时使用
          </p>
        </div>
      </div>
    </div>
  )
}