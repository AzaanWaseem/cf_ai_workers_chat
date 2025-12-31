# Project Structure

```
cf_ai_workers_chat/
│
├── src/                          # Cloudflare Worker Backend
│   ├── index.ts                  # Main Worker entry point
│   │                             # - Handles HTTP routing
│   │                             # - Manages CORS
│   │                             # - Creates/retrieves Agents
│   │
│   └── agent.ts                  # ChatAgent Durable Object
│                                 # - Manages conversation state
│                                 # - Calls Workers AI (Llama 3.3)
│                                 # - Persists chat history
│
├── frontend/                     # Next.js Frontend
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts      # API route (proxies to Worker)
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Main chat page
│   │   └── globals.css           # Global styles
│   │
│   ├── components/
│   │   ├── chat-input.tsx        # Message input component
│   │   ├── chat-message.tsx      # Single message display
│   │   ├── chat-messages.tsx     # Messages list
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── types/
│   │   └── chat.ts               # TypeScript interfaces
│   │
│   ├── .env.local                # Environment variables
│   └── package.json              # Frontend dependencies
│
├── wrangler.toml                 # Cloudflare Workers config
│                                 # - Durable Objects setup
│                                 # - Workers AI binding
│                                 # - Deployment settings
│
├── package.json                  # Backend dependencies
├── tsconfig.json                 # TypeScript config
├── README.md                     # Main documentation
├── SETUP.md                      # Setup instructions
└── quick-start.sh                # Quick setup script

```

## 🗂️ Key Files Explained

### Backend (Cloudflare Worker)

**`src/index.ts`** - Entry Point
- Receives HTTP requests from frontend
- Handles CORS for cross-origin requests
- Routes `/api/chat` to appropriate Agent
- Creates unique Agent per userId
- Health check endpoint at `/`

**`src/agent.ts`** - ChatAgent Durable Object
- Extends Cloudflare's DurableObject class
- Manages per-user conversation state
- Stores messages in Durable Object storage
- Calls Workers AI (Llama 3.3) for responses
- Persists state across requests

**`wrangler.toml`** - Configuration
- Defines Durable Object bindings
- Configures Workers AI access
- Sets up migrations
- Deployment settings

### Frontend (Next.js)

**`app/page.tsx`** - Main Chat UI
- Chat interface with messages
- Input form for user messages
- Calls `/api/chat` endpoint

**`app/api/chat/route.ts`** - API Proxy
- Receives messages from frontend
- Forwards to Cloudflare Worker
- Returns AI responses

**`components/`** - UI Components
- Modular, reusable components
- Built with shadcn/ui and Tailwind

**`.env.local`** - Environment Config
- `NEXT_PUBLIC_WORKER_URL`: Backend URL
- Supports local and production URLs

## 🔄 Request Flow

```
1. User types message in Frontend UI
        ↓
2. Frontend sends POST to /api/chat
        ↓
3. Next.js API route forwards to Worker
        ↓
4. Worker creates/retrieves Agent Durable Object
        ↓
5. Agent loads conversation history from storage
        ↓
6. Agent adds user message to history
        ↓
7. Agent calls Workers AI (Llama 3.3)
        ↓
8. Workers AI returns response
        ↓
9. Agent adds AI response to history
        ↓
10. Agent saves updated history to storage
        ↓
11. Response flows back through Worker → Next.js → Frontend
        ↓
12. Frontend displays AI message
```

## 🔑 Key Concepts

### Durable Objects (Agent State)
- Each user gets unique Agent instance
- State persists in Cloudflare's edge network
- Survives deployments and restarts
- Strong consistency guarantee

### Workers AI
- Runs Llama 3.3 70B model
- No GPU/infrastructure management needed
- Pay-per-request pricing
- Global edge network

### Conversation Memory
- Stored in `this.ctx.storage`
- Array of ChatMessage objects
- Includes system prompt + history
- Persists across sessions

## 📊 Data Flow

**Message Storage:**
```typescript
AgentState {
  messages: ChatMessage[]        // Full conversation
  userId: string                 // User identifier
  createdAt: string             // Timestamp
}
```

**ChatMessage:**
```typescript
{
  role: 'user' | 'assistant' | 'system'
  content: string
}
```

## 🎯 Technology Stack

**Backend:**
- Cloudflare Workers (Serverless)
- Durable Objects (State)
- Workers AI (LLM)
- TypeScript

**Frontend:**
- Next.js 14+ (React Framework)
- Tailwind CSS (Styling)
- shadcn/ui (Components)
- TypeScript

## 📦 Dependencies

**Backend:**
- `@cloudflare/workers-types` - Type definitions
- `wrangler` - CLI for deployment
- `typescript` - TypeScript compiler

**Frontend:**
- `next` - React framework
- `react` & `react-dom` - UI library
- `tailwindcss` - Utility-first CSS
- Various shadcn/ui packages

## 🚀 Deployment Targets

**Backend:** Cloudflare Workers
- Automatic edge deployment
- Global CDN distribution
- `*.workers.dev` subdomain

**Frontend:** Vercel (Recommended)
- Automatic Next.js optimization
- Edge functions support
- Custom domain support

Alternative: Cloudflare Pages, Netlify, or self-host

---

For setup instructions, see **SETUP.md**
For detailed documentation, see **README.md**
