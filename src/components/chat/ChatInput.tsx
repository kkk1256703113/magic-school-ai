interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  isProcessing: boolean
  inputRef: React.RefObject<HTMLInputElement>
  onSendMessage: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
}

export const ChatInput = ({
  inputText,
  setInputText,
  isProcessing,
  inputRef,
  onSendMessage,
  onKeyPress
}: ChatInputProps) => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="输入你的问题..."
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <button
            onClick={onSendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          输入后按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </footer>
  )
}