# Cloudflare AI Workers Chat Backend

A production-ready Cloudflare Workers backend implementing an AI chat system using:
- **Cloudflare Workers** - Serverless edge computing
- **Durable Objects** - Stateful conversation management
- **Workers AI** - Llama 3.3 70B model for intelligent responses
- **Agents SDK** - Built-in state management and persistence

## 🏗️ Architecture

```
Frontend (Next.js)
       ↓
Cloudflare Worker (index.ts)
       ↓
ChatAgent (Durable Object)
       ↓
Workers AI (Llama 3.3)
```

### Key Concepts

**What is an Agent?**
An Agent is a stateful, intelligent entity that maintains conversation history and context. It processes messages and generates responses using AI while persisting state across multiple requests.

**Why Durable Objects?**
- **Strong consistency**: Each user's conversation is handled by a single instance
- **State persistence**: Conversation history survives across requests and deployments
- **Isolation**: Each user gets their own Agent instance with separate state
- **Global uniqueness**: Each Durable Object has a unique ID based on userId

**How State/Memory Works:**
- Agent state provides built-in persistent storage
- `this.ctx.storage` saves conversation messages to durable storage
- Messages persist even if the Worker is redeployed or restarted
- Each Agent instance maintains its own isolated conversation history

## 📋 Prerequisites

- Node.js 18+ installed
- A Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
- Wrangler CLI installed globally (optional, but recommended):
  ```bash
  npm install -g wrangler
  ```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser window to authorize Wrangler with your Cloudflare account.

### 3. Run Locally

```bash
npm run dev
```

The Worker will be available at `http://localhost:8787`

Test it:
```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "userId": "test-user"}'
```

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

After deployment, you'll get a URL like: `https://cf-ai-workers-chat.<your-subdomain>.workers.dev`

## 📁 Project Structure

```
src/
├── index.ts          # Main Worker entry point (routing, CORS)
└── agent.ts          # ChatAgent Durable Object (AI logic, state management)

wrangler.toml         # Cloudflare Workers configuration
package.json          # Dependencies and scripts
tsconfig.json         # TypeScript configuration
README.md            # This file
```

## 🔧 Configuration

### Durable Objects Setup

The `wrangler.toml` configures:
- Durable Object binding: `CHAT_AGENT`
- Workers AI binding: `AI`
- Migration for the `ChatAgent` class

### Environment Variables (Optional)

Add to `wrangler.toml` if needed:
```toml
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
```

## 🌐 API Endpoints

### POST `/api/chat`

Send a chat message and get an AI response.

**Request:**
```json
{
  "message": "What is Cloudflare?",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "message": "Cloudflare is a global network...",
  "messageCount": 5
}
```

**Parameters:**
- `message` (string, required): The user's message
- `userId` (string, optional): Unique user identifier (defaults to "default-user")
- `history` (array, optional): Not used currently (state managed by Durable Object)

### GET `/`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "Cloudflare AI Chat Worker",
  "timestamp": "2025-12-31T10:30:00.000Z"
}
```

## 🔗 Connecting the Frontend

### Option 1: Update Frontend API Route

Replace the mock implementation in `frontend/app/api/chat/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Forward to Cloudflare Worker
    const response = await fetch('https://cf-ai-workers-chat.<your-subdomain>.workers.dev/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId: 'default-user' }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

### Option 2: Direct Frontend Call

Or call the Worker directly from your frontend (e.g., in `page.tsx`), bypassing the Next.js API route.

## 🧪 Testing

### Test Health Check
```bash
curl https://cf-ai-workers-chat.<your-subdomain>.workers.dev/
```

### Test Chat
```bash
curl -X POST https://cf-ai-workers-chat.<your-subdomain>.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain what Durable Objects are",
    "userId": "test-user-1"
  }'
```

### Test Conversation Persistence
Send multiple messages with the same `userId` to see how conversation history is maintained.

## 📊 Monitoring

### View Logs
```bash
npm run tail
```

Or in the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Logs" tab

### View Analytics
Check the Cloudflare dashboard for:
- Request count
- Error rate
- CPU time
- Durable Object metrics

## 🔐 Security Considerations

For production use, consider:
1. **Authentication**: Add proper user authentication (JWT, OAuth, etc.)
2. **Rate Limiting**: Implement rate limits to prevent abuse
3. **CORS**: Update CORS origins to specific domains (not `*`)
4. **Input Validation**: Add robust validation for incoming messages
5. **Content Filtering**: Add profanity/safety filters if needed

Example CORS update in `src/index.ts`:
```typescript
const allowedOrigins = ['https://yourdomain.com', 'https://www.yourdomain.com'];
const origin = request.headers.get('Origin');
if (origin && allowedOrigins.includes(origin)) {
  // Allow request
}
```

## 🐛 Troubleshooting

### "AI binding not found"
- Ensure `[ai]` binding is in `wrangler.toml`
- Redeploy: `npm run deploy`

### "Durable Object not found"
- Check that migrations are in `wrangler.toml`
- Ensure `ChatAgent` is exported in `src/index.ts`
- Try: `npx wrangler delete` then `npm run deploy`

### TypeScript Errors
- Run: `npm run types` to generate type definitions
- Ensure `@cloudflare/workers-types` is installed

### CORS Issues
- Check browser console for specific errors
- Verify CORS headers in `src/index.ts`
- Test with `curl` first to isolate frontend issues

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

## 💡 Extending the Project

Ideas for enhancement:
1. **Streaming Responses**: Implement SSE or WebSocket streaming
2. **Clear Chat**: Add endpoint to reset conversation history
3. **Export Chat**: Allow users to download conversation
4. **Multi-Model**: Support switching between different AI models
5. **Tool Use**: Add function calling capabilities to the Agent
6. **Analytics**: Track conversation metrics and user engagement

## 📝 License

MIT

---

**Built for Cloudflare Internship Project Submission**

This project demonstrates:
- ✅ Cloudflare Workers implementation
- ✅ Durable Objects for state management
- ✅ Workers AI integration (Llama 3.3)
- ✅ Clean, well-documented code
- ✅ Production-ready architecture
- ✅ End-to-end functionality
