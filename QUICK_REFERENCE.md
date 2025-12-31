# 🚀 Quick Reference Guide

## One-Command Setup

```bash
# Make the script executable (if not already)
chmod +x quick-start.sh

# Run the setup
./quick-start.sh
```

## Development Workflow

### Terminal 1: Backend (Cloudflare Worker)
```bash
# From project root
npm run dev
```
Backend runs at: `http://localhost:8787`

### Terminal 2: Frontend (Next.js)
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:3000`

## Testing the Backend

### Health Check
```bash
curl http://localhost:8787/
```

### Chat Endpoint
```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, world!", "userId": "test-user"}'
```

### Test Conversation Persistence
```bash
# Message 1
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My name is Alice", "userId": "alice"}'

# Message 2 (should remember name)
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my name?", "userId": "alice"}'
```

## Deployment Commands

### Deploy Backend to Cloudflare
```bash
# Login first (one-time)
npx wrangler login

# Deploy
npm run deploy
```

### Deploy Frontend to Vercel
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Common Commands

### Backend
```bash
npm run dev       # Start local development server
npm run deploy    # Deploy to Cloudflare
npm run tail      # View live logs
npm run types     # Generate TypeScript types
```

### Frontend
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run linter
```

## Environment Variables

### Backend
No environment variables needed! Everything is configured in `wrangler.toml`.

### Frontend
Edit `frontend/.env.local`:
```env
# Local development
NEXT_PUBLIC_WORKER_URL=http://localhost:8787

# Production (after deploying backend)
NEXT_PUBLIC_WORKER_URL=https://cf-ai-workers-chat.your-subdomain.workers.dev
```

## Project URLs

**Local:**
- Backend: `http://localhost:8787`
- Frontend: `http://localhost:3000`

**Production (after deployment):**
- Backend: `https://cf-ai-workers-chat.<your-subdomain>.workers.dev`
- Frontend: (Your Vercel URL or custom domain)

## Key Files to Customize

1. **Worker Name** - `wrangler.toml` line 5:
   ```toml
   name = "cf-ai-workers-chat"
   ```

2. **AI Model** - `src/agent.ts` line 178:
   ```typescript
   const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
   ```

3. **System Prompt** - `src/agent.ts` line 78:
   ```typescript
   content: 'You are a helpful AI assistant...',
   ```

4. **CORS Origins** - `src/index.ts` line 91:
   ```typescript
   const origin = request.headers.get('Origin') || '*';
   ```

## Troubleshooting Quick Fixes

### Backend won't start
```bash
npm install
npx wrangler types
npm run dev
```

### Frontend can't connect
1. Check backend is running: `curl http://localhost:8787/`
2. Check `.env.local` has correct URL
3. Restart frontend: `cd frontend && npm run dev`

### TypeScript errors
```bash
npm run types
```

### Deployment fails
```bash
npx wrangler login
npm run deploy
```

### Clear Durable Object state
```bash
# Delete worker (removes all DOs)
npx wrangler delete

# Redeploy
npm run deploy
```

## Monitoring & Debugging

### View Logs (Live)
```bash
npm run tail
```

### View Logs (Cloudflare Dashboard)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your worker
4. Click "Logs" tab

### Check Durable Objects
1. Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Click "Durable Objects" tab
4. See active instances and metrics

## API Contract

### Request Format
```json
{
  "message": "string (required)",
  "userId": "string (optional, defaults to 'default-user')"
}
```

### Response Format
```json
{
  "message": "string (AI response)",
  "messageCount": "number (total messages in conversation)"
}
```

### Error Format
```json
{
  "error": "string",
  "details": "string (optional)"
}
```

## Performance Tips

1. **Conversation Length**: Long conversations may slow down. Consider:
   - Limiting history to last N messages
   - Implementing conversation summarization
   - Adding pagination

2. **Model Selection**: Adjust based on needs:
   - Faster: `@cf/meta/llama-3.1-8b-instruct-fast`
   - Better: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

3. **Caching**: Add caching for common queries

## Security Checklist for Production

- [ ] Replace `*` in CORS with specific domains
- [ ] Add authentication (JWT/OAuth)
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up monitoring and alerting
- [ ] Configure secrets properly
- [ ] Add content filtering
- [ ] Set up custom domain with SSL

## Useful Resources

- 📚 [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- 🔐 [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- 🤖 [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- ⚡ [Next.js Docs](https://nextjs.org/docs)
- 🎨 [shadcn/ui](https://ui.shadcn.com/)

## Getting Help

1. Check `SETUP.md` for detailed setup instructions
2. Check `README.md` for architecture details
3. Check `PROJECT_STRUCTURE.md` for code organization
4. Check error logs: `npm run tail`
5. Check Cloudflare dashboard for worker status

---

**Happy coding! 🎉**
