# Setup Guide - Cloudflare AI Workers Chat

Complete setup instructions for running the project end-to-end.

## 🎯 Overview

This project has two parts:
1. **Backend**: Cloudflare Worker with AI (in root directory)
2. **Frontend**: Next.js UI (in `frontend/` directory)

## 📦 Part 1: Backend Setup (Cloudflare Worker)

### Step 1: Install Dependencies

```bash
# From the root directory
npm install
```

### Step 2: Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens your browser to authorize Wrangler with your Cloudflare account.

### Step 3: Test Locally

```bash
npm run dev
```

The Worker will run at `http://localhost:8787`

**Test it:**
```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "userId": "test"}'
```

### Step 4: Deploy to Cloudflare

```bash
npm run deploy
```

You'll get a URL like: `https://cf-ai-workers-chat.<your-subdomain>.workers.dev`

**Save this URL!** You'll need it for the frontend.

## 🎨 Part 2: Frontend Setup (Next.js)

### Step 1: Navigate to Frontend

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Backend URL

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and update with your Worker URL:
```env
# For local development (if Worker is running locally)
NEXT_PUBLIC_WORKER_URL=http://localhost:8787

# For production (after deploying)
# NEXT_PUBLIC_WORKER_URL=https://cf-ai-workers-chat.your-subdomain.workers.dev
```

### Step 4: Run the Frontend

```bash
npm run dev
```

The frontend will run at `http://localhost:3000`

## ✅ Testing End-to-End

### Option A: Local Development

1. **Terminal 1** (Backend):
   ```bash
   # From root directory
   npm run dev
   ```

2. **Terminal 2** (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser
4. Start chatting!

### Option B: Production

1. Deploy the backend:
   ```bash
   # From root directory
   npm run deploy
   ```

2. Update `frontend/.env.local` with your Worker URL

3. Deploy frontend to Vercel (or run locally):
   ```bash
   cd frontend
   npm run build
   npm start
   ```

## 🔍 Troubleshooting

### Backend Issues

**"AI binding not found"**
- Check that `[ai]` is in `wrangler.toml`
- Redeploy: `npm run deploy`

**"Durable Object not found"**
- Ensure migrations are in `wrangler.toml`
- Delete and redeploy: `npx wrangler delete && npm run deploy`

### Frontend Issues

**"Failed to fetch"**
- Ensure backend is running
- Check `NEXT_PUBLIC_WORKER_URL` in `.env.local`
- Verify CORS is configured in backend

**Connection refused**
- Make sure both servers are running
- Backend: `http://localhost:8787`
- Frontend: `http://localhost:3000`

### CORS Issues

If you get CORS errors:
1. Check browser console for specific error
2. Ensure backend CORS headers are set correctly
3. Try testing with `curl` first to isolate the issue

## 📊 Verification Checklist

- [ ] Backend deployed successfully
- [ ] Backend health check works: `curl https://your-worker.workers.dev/`
- [ ] Backend chat endpoint works: `curl -X POST https://your-worker.workers.dev/api/chat -H "Content-Type: application/json" -d '{"message":"hi"}'`
- [ ] Frontend `.env.local` has correct Worker URL
- [ ] Frontend starts without errors
- [ ] Can send messages and receive AI responses
- [ ] Conversation history persists across messages

## 🚀 Deployment to Production

### Backend (Cloudflare)

Already done with `npm run deploy`! 🎉

### Frontend (Vercel - Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable:
   - Key: `NEXT_PUBLIC_WORKER_URL`
   - Value: `https://cf-ai-workers-chat.your-subdomain.workers.dev`
5. Deploy!

## 📝 Development Workflow

1. Make changes to backend (`src/index.ts` or `src/agent.ts`)
2. Test locally: `npm run dev`
3. Deploy: `npm run deploy`
4. Update frontend if needed
5. Test frontend: `cd frontend && npm run dev`

## 🎓 Learning Resources

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Next.js](https://nextjs.org/docs)

## 💬 Need Help?

Check the main `README.md` for more detailed information about:
- Architecture
- API endpoints
- Security considerations
- Extending the project

Happy coding! 🚀
