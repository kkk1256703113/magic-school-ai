import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp?: string
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
          isUser ? "bg-green-100 text-green-900 ml-12" : "bg-card text-card-foreground mr-12",
        )}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
