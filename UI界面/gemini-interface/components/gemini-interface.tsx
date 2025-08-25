"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit3, Settings, ChevronDown, Paperclip, Send, Sun, Moon, User, LogOut } from "lucide-react"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

type Theme = "light" | "dark"

export function GeminiInterface() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [theme, setTheme] = useState<Theme>("light")
  const [showSettings, setShowSettings] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  const startNewConversation = () => {
    setMessages([])
    setInputValue("")
  }

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    setShowSettings(false)
  }

  const handleSend = () => {
    if (inputValue.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: inputValue.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue("")

      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content:
            "当然，以下是一些主流 VPS 提供商的官方网站，你可以直接点击链接访问。\n\n**国外主流 VPS 提供商**\n\n这些提供商在全球都有数据中心，性能稳定，服务可靠，文档和教程丰富，非常适合开发者。\n\n• **Vultr**\n  官网：https://www.vultr.com/\n\n• **Linode**\n  官网：https://www.linode.com/\n\n• **DigitalOcean**\n  官网：https://www.digitalocean.com/",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <div className="flex-1" />

        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={startNewConversation}
          >
            <Edit3 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>

          <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <div className="px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">主题设置</div>
              <DropdownMenuItem
                onClick={() => toggleTheme("light")}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Sun className="h-4 w-4" />
                浅色模式
                {theme === "light" && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleTheme("dark")}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Moon className="h-4 w-4" />
                深色模式
                {theme === "dark" && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">Gemini</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  2.5 Flash
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  2.5 Flash
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  2.0 Pro
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  1.5 Pro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                >
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-sm mr-2" />
                  升级
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="end"
                className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">选择订阅套餐</div>

                {/* Monthly Plan */}
                <div className="mb-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">月会员</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">按月订阅，灵活便捷</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">¥29</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">/月</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    • 无限制对话次数
                    <br />• 优先访问新功能
                    <br />• 24/7 客户支持
                  </div>
                </div>

                {/* Quarterly Plan */}
                <div className="mb-3 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer relative">
                  <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded">推荐</div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">季会员</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">3个月套餐，省20%</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">¥69</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">/3个月</div>
                      <div className="text-xs text-green-600 dark:text-green-400">节省¥18</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    • 月会员所有功能
                    <br />• 专属客服通道
                    <br />• 高级模型优先体验
                  </div>
                </div>

                {/* Yearly Plan */}
                <div className="mb-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">年会员</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">12个月套餐，省40%</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">¥199</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">/年</div>
                      <div className="text-xs text-green-600 dark:text-green-400">节省¥149</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    • 季会员所有功能
                    <br />• 专属定制服务
                    <br />• 年度功能路线图预览
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowUpgradeModal(false)}
                  >
                    立即订阅
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">支持支付宝、微信支付、银行卡</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu open={showAccountSettings} onOpenChange={setShowAccountSettings}>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 bg-purple-600 cursor-pointer hover:bg-purple-700 transition-colors">
                  <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">b</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="end"
                className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  账户设置
                </div>
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <Settings className="h-4 w-4" />
                  账户管理
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-sm" />
                  </div>
                  订阅管理
                </DropdownMenuItem>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col px-6 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-normal text-blue-500 mb-2">
                  你好！<span className="ml-2">blue</span>
                </h2>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    {message.type === "ai" && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
                          <div
                            className="w-3 h-3 bg-white transform rotate-45"
                            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                          />
                        </div>
                        <div className="max-w-3xl">
                          <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    )}
                    {message.type === "user" && (
                      <div className="max-w-2xl">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3 text-gray-800 dark:text-gray-200">
                          {message.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="问问 Gemini"
                  className="flex-1 border-0 bg-transparent text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="上传文件"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    title="发送消息"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
