"use client"

import { useState } from "react"
import { ChatMessage } from "@/components/chat-message"
import { MessageInput } from "@/components/message-input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  files?: File[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "你好！我是AI助手，有什么可以帮助你的吗？",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string, files?: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
      files,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // 模拟AI响应
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          files && files.length > 0
            ? `我收到了你的消息和 ${files.length} 个文件。${content ? `你说：${content}` : ""}`
            : `收到你的消息：${content}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Area */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 py-8">
            <h1 className="text-2xl font-bold font-montserrat text-foreground mb-2">AI 聊天助手</h1>
            <p className="text-muted-foreground">智能对话，支持文件上传</p>
          </div>

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-card text-card-foreground rounded-lg px-4 py-3 shadow-sm mr-12">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="max-w-3xl mx-auto w-full px-4">
        <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}
