import { MessageBubble } from './MessageBubble'
import type { Message } from '../../types/chat'

interface MessageListProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export const MessageList = ({ messages, messagesEndRef }: MessageListProps) => {
  return (
    <main className="flex-1 overflow-y-auto py-6">
      <div className="max-w-4xl mx-auto px-6">
        {/* 当没有消息时显示欢迎界面 */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-4xl font-normal text-blue-500 mb-4">
              Hello! Welcome to Magic School AI
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Turn Complex Into Clear - Professional document and formula visualization
            </p>
          </div>
        )}
        
        {/* 消息列表 */}
        <div className="space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </main>
  )
}