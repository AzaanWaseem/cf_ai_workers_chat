# Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:3000                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Request
                             │ POST /api/chat
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      NEXT.JS FRONTEND                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  app/page.tsx (Chat UI)                                   │  │
│  │  - User types message                                     │  │
│  │  - Displays chat history                                  │  │
│  │  - Shows AI responses                                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  app/api/chat/route.ts (API Route)                        │  │
│  │  - Receives message from UI                               │  │
│  │  - Forwards to Cloudflare Worker                          │  │
│  │  - Returns AI response                                    │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ HTTP Request
                              │ POST /api/chat
                              │ { message, userId }
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│            CLOUDFLARE WORKER (Edge Network)                       │
│                 *.workers.dev                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  src/index.ts (Main Worker)                                │  │
│  │  - Handles CORS                                            │  │
│  │  - Routes requests                                         │  │
│  │  - Creates/retrieves Agent DO                             │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                            │                                      │
│                            │ env.CHAT_AGENT.idFromName(userId)   │
│                            │ stub.fetch(request)                 │
│                            │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │  DURABLE OBJECT NAMESPACE                                  │  │
│  │  - Manages Agent instances                                 │  │
│  │  - One Agent per userId                                    │  │
│  │  - Ensures strong consistency                              │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ Forward request to
                              │ specific Agent instance
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│              CHAT AGENT (Durable Object)                          │
│                    src/agent.ts                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Agent State (Persistent Storage)                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ messages: [                                          │  │  │
│  │  │   { role: "system", content: "You are..." }          │  │  │
│  │  │   { role: "user", content: "Hello" }                 │  │  │
│  │  │   { role: "assistant", content: "Hi there!" }        │  │  │
│  │  │   ...                                                 │  │  │
│  │  │ ]                                                     │  │  │
│  │  │ userId: "alice"                                       │  │  │
│  │  │ createdAt: "2025-12-31T..."                          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │  Processing Logic                                          │  │
│  │  1. Load conversation history from storage                │  │
│  │  2. Append user message to history                        │  │
│  │  3. Send full context to Workers AI                       │  │
│  │  4. Receive AI response                                   │  │
│  │  5. Append AI message to history                          │  │
│  │  6. Save updated history to storage                       │  │
│  │  7. Return response                                       │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ env.AI.run()
                              │ Model: @cf/meta/llama-3.3-70b...
                              │ Messages: [...conversation]
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                   WORKERS AI (Edge Inference)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Llama 3.3 70B Model                                       │  │
│  │  - Processes conversation context                          │  │
│  │  - Generates intelligent response                          │  │
│  │  - Returns result to Agent                                 │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ Response
                              │ { response: "..." }
                              │
                              ▲
                              │
                    Response flows back up
                         the stack to
                          the user
```

## Data Flow - Request Lifecycle

```
1. USER TYPES MESSAGE
   └─> "What is a Durable Object?"

2. FRONTEND (page.tsx)
   └─> Calls /api/chat endpoint
       Body: { message: "What is a Durable Object?", userId: "alice" }

3. NEXT.JS API ROUTE (route.ts)
   └─> Forwards to Worker
       POST https://worker.workers.dev/api/chat

4. WORKER (index.ts)
   └─> Extracts userId: "alice"
   └─> Creates Agent ID: idFromName("alice")
   └─> Gets Agent stub
   └─> Forwards request to Agent

5. AGENT DURABLE OBJECT (agent.ts)
   ├─> Loads state from storage
   │   └─> Retrieves previous messages for "alice"
   │
   ├─> Appends new user message
   │   └─> messages.push({ role: "user", content: "..." })
   │
   ├─> Calls Workers AI
   │   └─> Sends full conversation history
   │   └─> Model processes context
   │   └─> Returns AI response
   │
   ├─> Appends AI response
   │   └─> messages.push({ role: "assistant", content: "..." })
   │
   ├─> Saves updated state
   │   └─> ctx.storage.put('agentState', { messages, userId, ... })
   │
   └─> Returns response
       └─> { message: "A Durable Object is...", messageCount: 5 }

6. WORKER (index.ts)
   └─> Adds CORS headers
   └─> Returns response to frontend

7. NEXT.JS API ROUTE (route.ts)
   └─> Returns response to client

8. FRONTEND (page.tsx)
   └─> Displays AI message in chat UI
   └─> Updates message history
```

## State Persistence Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DURABLE OBJECT LIFECYCLE                  │
└─────────────────────────────────────────────────────────────┘

   TIME: Request 1                 Request 2                Request 3
   ═══════════════════════════════════════════════════════════════

   ┌──────────────────┐         ┌──────────────────┐      ┌──────────────────┐
   │ Agent Created    │         │ Agent Retrieved  │      │ Agent Retrieved  │
   │ for userId:      │         │ (from storage)   │      │ (from storage)   │
   │ "alice"          │         │                  │      │                  │
   └────────┬─────────┘         └────────┬─────────┘      └────────┬─────────┘
            │                            │                          │
            │ New state                  │ Load existing state      │ Load existing state
            │                            │                          │
   ┌────────▼─────────┐         ┌────────▼─────────┐      ┌────────▼─────────┐
   │ Storage: Empty   │         │ Storage:          │      │ Storage:          │
   │                  │         │ - System prompt   │      │ - System prompt   │
   │ Initialize:      │         │ - Message 1       │      │ - Messages 1-2    │
   │ - System prompt  │         │                   │      │                   │
   └────────┬─────────┘         └────────┬─────────┘      └────────┬─────────┘
            │                            │                          │
            │ User: "Hello"              │ User: "My name is Alice" │ User: "What's my name?"
            │                            │                          │
   ┌────────▼─────────┐         ┌────────▼─────────┐      ┌────────▼─────────┐
   │ Call Workers AI  │         │ Call Workers AI  │      │ Call Workers AI  │
   │ Context: [       │         │ Context: [       │      │ Context: [       │
   │   system,        │         │   system,        │      │   system,        │
   │   "Hello"        │         │   "Hello",       │      │   "Hello",       │
   │ ]                │         │   "Hi...",       │      │   "Hi...",       │
   └────────┬─────────┘         │   "My name..."   │      │   "My name...",  │
            │                   │ ]                │      │   "Nice...",     │
            │                   └────────┬─────────┘      │   "What's..."    │
            │                            │                │ ]                │
            │ AI: "Hi there!"            │ AI: "Nice..."  └────────┬─────────┘
            │                            │                          │
   ┌────────▼─────────┐         ┌────────▼─────────┐      ┌────────▼─────────┐
   │ Save to Storage: │         │ Save to Storage: │      │ Save to Storage: │
   │ messages: [      │         │ messages: [      │      │ messages: [      │
   │   system,        │         │   system,        │      │   system,        │
   │   "Hello",       │         │   "Hello",       │      │   "Hello",       │
   │   "Hi there!"    │         │   "Hi there!",   │      │   "Hi there!",   │
   │ ]                │         │   "My name...",  │      │   "My name...",  │
   └──────────────────┘         │   "Nice to..."   │      │   "Nice to...",  │
                                │ ]                │      │   "What's...",   │
                                └──────────────────┘      │   "Your name..." │
                                                          │ ]                │
                                                          └──────────────────┘

   PERSISTS ACROSS REQUESTS AND DEPLOYMENTS
```

## User Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│              DURABLE OBJECT NAMESPACE: CHAT_AGENT                │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Agent Instance      │  │ Agent Instance      │              │
│  │ ID: hash("alice")   │  │ ID: hash("bob")     │              │
│  │                     │  │                     │              │
│  │ State:              │  │ State:              │              │
│  │ messages: [...]     │  │ messages: [...]     │              │
│  │ userId: "alice"     │  │ userId: "bob"       │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Agent Instance      │  │ Agent Instance      │              │
│  │ ID: hash("carol")   │  │ ID: hash("dave")    │              │
│  │                     │  │                     │              │
│  │ State:              │  │ State:              │              │
│  │ messages: [...]     │  │ messages: [...]     │              │
│  │ userId: "carol"     │  │ userId: "dave"      │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│  Each user gets their own isolated Agent instance                │
│  State is completely separate and never shared                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

```
┌──────────────────────────────────────────────────────────────┐
│ Component           │ Responsibility                          │
├──────────────────────────────────────────────────────────────┤
│ Frontend (page.tsx) │ - User interface                        │
│                     │ - Message input                         │
│                     │ - Display chat history                  │
├──────────────────────────────────────────────────────────────┤
│ API Route          │ - Request forwarding                     │
│ (route.ts)         │ - Can add auth/validation                │
│                    │ - Error handling                         │
├──────────────────────────────────────────────────────────────┤
│ Worker             │ - Request routing                        │
│ (index.ts)         │ - CORS handling                          │
│                    │ - Agent instantiation                    │
│                    │ - Health checks                          │
├──────────────────────────────────────────────────────────────┤
│ Agent              │ - Conversation state                     │
│ (agent.ts)         │ - Message history management             │
│                    │ - Workers AI integration                 │
│                    │ - State persistence                      │
├──────────────────────────────────────────────────────────────┤
│ Durable Objects    │ - State storage                          │
│ Storage            │ - Strong consistency                     │
│                    │ - Durability guarantees                  │
├──────────────────────────────────────────────────────────────┤
│ Workers AI         │ - LLM inference                          │
│                    │ - Response generation                    │
│                    │ - Model management                       │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  Next.js 14 + React 19 + Tailwind CSS + shadcn/ui      │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    APPLICATION LAYER                     │
│        Next.js API Routes + TypeScript                  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                     EDGE COMPUTE LAYER                   │
│          Cloudflare Workers (Serverless)                │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                     STATE LAYER                          │
│    Durable Objects (Distributed, Consistent State)     │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                     AI/ML LAYER                          │
│     Workers AI (Llama 3.3 70B Edge Inference)          │
└─────────────────────────────────────────────────────────┘
```

This architecture provides:
✅ Low latency (edge computing)
✅ High availability (global distribution)
✅ Strong consistency (Durable Objects)
✅ Scalability (serverless auto-scaling)
✅ Cost efficiency (pay-per-request)
