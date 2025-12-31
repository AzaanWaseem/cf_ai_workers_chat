import type { Message } from "@/types/chat"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}
