import { MessageBubble } from './MessageBubble'
import type { Message } from '../../types/chat'

interface MessageListProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export const MessageList = ({ messages, messagesEndRef }: MessageListProps) => {
  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </main>
  )
}