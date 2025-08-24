"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message.trim(), files)
      setMessage("")
      setFiles([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="border-t bg-background p-4">
      {/* File previews */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-sm">
              <Paperclip className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-lg border bg-input p-2 transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="输入消息..."
          className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-2 focus-visible:ring-0"
          disabled={disabled}
        />

        {/* Buttons on the right */}
        <div className="flex items-center gap-1 shrink-0">
          <Button onClick={handleSend} disabled={disabled || (!message.trim() && files.length === 0)} size="sm">
            <Send className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg">
          <p className="text-primary font-medium">拖拽文件到这里上传</p>
        </div>
      )}
    </div>
  )
}
