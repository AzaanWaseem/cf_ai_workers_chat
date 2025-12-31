"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat-message"
import type { Message } from "@/types/chat"
import { Loader2 } from "lucide-react"

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start a conversation by typing a message below</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
