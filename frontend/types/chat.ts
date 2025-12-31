export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatResponse {
  message: string
  // Add other fields as needed when backend is implemented
}
