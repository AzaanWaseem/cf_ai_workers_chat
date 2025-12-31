"use client"

import { useState } from "react"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { Card } from "@/components/ui/card"
import type { Message, ChatResponse } from "@/types/chat"

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // BACKEND CONNECTION POINT: Replace this with your actual API endpoint
      // For Cloudflare Workers, this will be your worker URL
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          // Include conversation history if needed
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data: ChatResponse = await response.json()

      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)

      // Error handling - show error message to user
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[oklch(0.16_0.015_250)] to-[oklch(0.14_0.01_250)]">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl border-border/50 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <h1 className="text-xl font-semibold">AI Assistant</h1>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>

        <ChatMessages messages={messages} isLoading={isLoading} />

        <div className="flex-shrink-0">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </Card>
    </div>
  )
}
