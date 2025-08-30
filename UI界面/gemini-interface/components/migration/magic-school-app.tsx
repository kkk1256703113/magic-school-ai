"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  ChevronDown,
  User,
  LogOut,
  Crown,
  Sun,
  Moon,
  Monitor,
  Languages,
  Edit3
} from "lucide-react"

// 导入迁移的组件
import { AuthModal } from "./auth-modal"
import { UpgradeModal } from "./upgrade-modal"
import { EnhancedChatContainer } from "./enhanced-chat-container"

type Theme = "light" | "dark" | "system"
type Language = "zh" | "en"

interface User {
  id: string
  email: string
  plan: 'free' | 'monthly' | 'quarterly' | 'yearly'
  apiCallsToday: number
  apiCallsRemaining: number
}

interface AppState {
  isAuthenticated: boolean
  currentUser?: User
  theme: Theme
  language: Language
  showAuthModal: boolean
  showUpgradeModal: boolean
  showSettings: boolean
}

export function MagicSchoolApp() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    theme: "system",
    language: "zh",
    showAuthModal: false,
    showUpgradeModal: false,
    showSettings: false
  })

  // 主题切换逻辑
  useEffect(() => {
    const root = window.document.documentElement
    
    if (appState.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.toggle("dark", systemTheme === "dark")
    } else {
      root.classList.toggle("dark", appState.theme === "dark")
    }
  }, [appState.theme])

  // 认证处理
  const handleLogin = async (email: string, password: string) => {
    try {
      // 这里集成主项目的认证逻辑
      console.log('Login:', { email, password })
      
      // 模拟登录成功
      setAppState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: {
          id: "1",
          email,
          plan: "free",
          apiCallsToday: 2,
          apiCallsRemaining: 8
        },
        showAuthModal: false
      }))
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const handleRegister = async (email: string, password: string, username?: string) => {
    try {
      // 这里集成主项目的注册逻辑
      console.log('Register:', { email, password, username })
      
      // 模拟注册成功
      setAppState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: {
          id: "1",
          email,
          plan: "free",
          apiCallsToday: 0,
          apiCallsRemaining: 10
        },
        showAuthModal: false
      }))
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  const handleLogout = () => {
    setAppState(prev => ({
      ...prev,
      isAuthenticated: false,
      currentUser: undefined
    }))
  }

  // 主题切换
  const handleThemeChange = (newTheme: Theme) => {
    setAppState(prev => ({
      ...prev,
      theme: newTheme
    }))
  }

  // 套餐升级
  const handleSelectPlan = (planName: string) => {
    console.log('Selected plan:', planName)
    setAppState(prev => ({
      ...prev,
      showUpgradeModal: false
    }))
    // 这里可以集成支付逻辑
  }

  // 发送消息
  const handleSendMessage = async (content: string, files?: File[]) => {
    try {
      // 这里集成主项目的AI API调用逻辑
      console.log('Send message:', { content, files })
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return Promise.resolve()
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  // 获取用户计划显示文本
  const getPlanDisplayText = (plan: string) => {
    const planMap = {
      free: '免费版',
      monthly: '月费用户', 
      quarterly: '季费用户',
      yearly: '年费用户'
    }
    return planMap[plan as keyof typeof planMap] || plan
  }

  // 获取用户头像显示
  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">MS</span>
          </div>
          <h1 className="text-xl font-semibold">Magic School AI</h1>
          <Badge variant="secondary" className="text-xs">
            2.0
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* 新建对话按钮 */}
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-2" />
            新建对话
          </Button>

          {/* 设置菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-semibold">主题</div>
              <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                <Sun className="w-4 h-4 mr-2" />
                浅色模式
                {appState.theme === "light" && <div className="ml-auto w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                <Moon className="w-4 h-4 mr-2" />
                深色模式
                {appState.theme === "dark" && <div className="ml-auto w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                <Monitor className="w-4 h-4 mr-2" />
                跟随系统
                {appState.theme === "system" && <div className="ml-auto w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <div className="px-2 py-1.5 text-sm font-semibold">语言</div>
              <DropdownMenuItem>
                <Languages className="w-4 h-4 mr-2" />
                🇨🇳 简体中文
                <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Languages className="w-4 h-4 mr-2" />
                🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* 用户菜单 */}
          {appState.isAuthenticated && appState.currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(appState.currentUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <div className="text-sm font-medium truncate max-w-24">
                      {appState.currentUser.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getPlanDisplayText(appState.currentUser.plan)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2">
                  <div className="font-medium">{appState.currentUser.email}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getPlanDisplayText(appState.currentUser.plan)}
                    </Badge>
                    <span>今日剩余: {appState.currentUser.apiCallsRemaining}次</span>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  账户设置
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setAppState(prev => ({ ...prev, showUpgradeModal: true }))}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  升级套餐
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setAppState(prev => ({ ...prev, showAuthModal: true }))}
              size="sm"
            >
              登录 / 注册
            </Button>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        <EnhancedChatContainer
          isAuthenticated={appState.isAuthenticated}
          currentUser={appState.currentUser}
          onAuthRequired={() => setAppState(prev => ({ ...prev, showAuthModal: true }))}
          onSendMessage={handleSendMessage}
        />
      </main>

      {/* 模态框 */}
      <AuthModal
        isOpen={appState.showAuthModal}
        onClose={() => setAppState(prev => ({ ...prev, showAuthModal: false }))}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <UpgradeModal
        isOpen={appState.showUpgradeModal}
        onClose={() => setAppState(prev => ({ ...prev, showUpgradeModal: false }))}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  )
}