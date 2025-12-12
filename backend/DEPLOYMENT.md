# Deploying to Vercel

This guide walks you through deploying your RAG-powered documentation assistant API to Vercel, making it publicly accessible for your Mintlify AI assistant.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Deployment Steps](#deployment-steps)
- [Environment Variables Setup](#environment-variables-setup)
- [Testing the Deployment](#testing-the-deployment)
- [Connecting to Mintlify](#connecting-to-mintlify)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```
3. **Environment Variables Ready**:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 📁 Project Structure

Your project now has the following structure for Vercel deployment:

```
backend/
├── api/
│   └── chat.js           # Serverless function for /api/chat endpoint
├── server.js             # Local development server (not deployed)
├── sync-docs.js          # Documentation sync script (not deployed)
├── vercel.json           # Vercel configuration
├── .vercelignore         # Files to ignore during deployment
├── package.json          # Dependencies and scripts
└── .env                  # Local environment variables (not deployed)
```

**Key Points**:
- ✅ `api/chat.js` - Deployed as serverless function
- ❌ `server.js` - Used only for local development
- ❌ `sync-docs.js` - Run locally to sync documentation

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy to Vercel**:
   ```bash
   cd backend
   vercel
   ```

3. **Follow the prompts**:
   ```
   ? Set up and deploy "~/backend"? [Y/n] y
   ? Which scope do you want to deploy to? Your Name
   ? Link to existing project? [y/N] n
   ? What's your project's name? devit-docs-api
   ? In which directory is your code located? ./
   ```

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

5. **Copy the production URL** (e.g., `https://devit-docs-api.vercel.app`)

### Option 2: Deploy via Vercel Dashboard

1. **Go to** [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository**:
   - Connect your GitHub account
   - Select your repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

4. **Click "Deploy"**

5. **Wait for deployment** to complete (usually 30-60 seconds)

---

## 🔐 Environment Variables Setup

After deployment, you need to add environment variables in the Vercel dashboard:

### Via Vercel Dashboard

1. **Go to your project** in Vercel dashboard
2. **Click "Settings"** tab
3. **Click "Environment Variables"** in sidebar
4. **Add the following variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...` | Production, Preview, Development |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production, Preview, Development |

5. **Click "Save"** for each variable

6. **Redeploy** to apply changes:
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Via Vercel CLI

```bash
# Add environment variables
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Select "Production" when prompted
# Paste the value when prompted

# Redeploy
vercel --prod
```

---

## 🧪 Testing the Deployment

### 1. Test with cURL

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How do I configure currencies?"}
    ]
  }'
```

**Expected Response** (streaming format):
```
0:"To configure currencies, you can "
0:"use the currency selector..."
8:[{"type":"tool-invocation",...}]
d:{"finishReason":"stop",...}
```

### 2. Test with JavaScript

```javascript
const response = await fetch('https://YOUR-PROJECT.vercel.app/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'How do I configure currencies?' }
    ]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  console.log('Received chunk:', chunk);
}
```

### 3. Check Logs

View real-time logs in Vercel dashboard:
1. Go to your project
2. Click "Deployments" tab
3. Click on latest deployment
4. Click "Functions" tab
5. Click on `api/chat.js`
6. View logs

---

## 🔗 Connecting to Mintlify

### Step 1: Get Your Vercel URL

After deployment, your API will be available at:
```
https://YOUR-PROJECT-NAME.vercel.app/api/chat
```

Example:
```
https://devit-docs-api.vercel.app/api/chat
```

### Step 2: Update Mintlify Configuration

In your Mintlify documentation repository, update the AI assistant configuration:

**File**: `mint.json`

```json
{
  "ai": {
    "enabled": true,
    "backend": {
      "url": "https://YOUR-PROJECT-NAME.vercel.app/api/chat"
    }
  }
}
```

**Before** (localhost - doesn't work in production):
```json
{
  "ai": {
    "enabled": true,
    "backend": {
      "url": "http://localhost:9000/api/chat"
    }
  }
}
```

**After** (Vercel - works publicly):
```json
{
  "ai": {
    "enabled": true,
    "backend": {
      "url": "https://devit-docs-api.vercel.app/api/chat"
    }
  }
}
```

### Step 3: Commit and Push

```bash
cd /path/to/mintlify-docs
git add mint.json
git commit -m "Update AI backend to Vercel URL"
git push
```

### Step 4: Verify Mintlify Deployment

1. Wait for Mintlify to rebuild (usually automatic)
2. Visit your Mintlify docs: `https://devit-c039f40a.mintlify.app`
3. Open the AI assistant chat widget
4. Ask a question (e.g., "How do I configure currencies?")
5. Verify you get responses with source links

---

## 🔄 Development Workflow

### Local Development (using server.js)

```bash
# Run local server for testing
npm run dev

# Server runs on http://localhost:9000
# Use this for local frontend development
```

### Sync Documentation

```bash
# Run sync script locally to update vector database
npm run sync

# This updates the Supabase database
# Both local and production use the same database
```

### Deploy Updates

```bash
# After making changes to api/chat.js
vercel --prod

# Or just push to GitHub (if using Git integration)
git push origin main
```

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Symptom**: Browser console shows CORS errors when Mintlify tries to connect

**Solution**: The `api/chat.js` already includes CORS headers. If still having issues:
1. Check Vercel function logs
2. Verify the request is reaching your API
3. Check browser network tab for exact error

### Issue: Environment Variables Not Working

**Symptom**: 500 errors or "API key not found" errors

**Solution**:
1. Verify environment variables are set in Vercel dashboard
2. Check all three environments (Production, Preview, Development)
3. Redeploy after adding variables
4. Check function logs for specific error messages

### Issue: Streaming Not Working

**Symptom**: Response hangs or doesn't stream

**Solution**:
1. Vercel supports streaming by default
2. Check that client is reading the stream properly
3. Verify Content-Type headers are correct
4. Check function timeout (default is 10s for Hobby plan, 60s for Pro)

### Issue: Function Timeout

**Symptom**: Error: "Function execution timed out"

**Solution**:
1. **Hobby plan**: 10-second timeout (may be too short for complex queries)
2. **Pro plan**: 60-second timeout
3. Consider upgrading to Pro plan if needed
4. Optimize queries to return faster (reduce TOP_K or chunk size)

### Issue: Cold Starts

**Symptom**: First request after inactivity is slow

**Solution**:
1. This is normal for serverless functions
2. Subsequent requests will be faster (warm)
3. Pro plan has faster cold starts
4. Consider using Vercel Edge Functions for even faster cold starts

### Issue: Database Connection Errors

**Symptom**: "Failed to connect to Supabase"

**Solution**:
1. Verify `SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check Supabase project is active
4. Verify `match_documents` function exists in Supabase

---

## 📊 Monitoring

### Vercel Analytics

1. Go to your project in Vercel
2. Click "Analytics" tab
3. View:
   - Request count
   - Response times
   - Error rates
   - Geographic distribution

### Function Logs

1. Go to "Deployments" tab
2. Click latest deployment
3. Click "Functions" tab
4. Click `api/chat.js`
5. View real-time logs with emojis:
   - 📨 REQUEST
   - 🔄 EMBEDDING
   - 🔍 SEARCH
   - 🤖 OPENAI
   - ✅ COMPLETE
   - ❌ ERROR

### Supabase Logs

1. Go to Supabase dashboard
2. Click "Logs" in sidebar
3. Filter by "Database" or "API"
4. View query logs and errors

---

## 💰 Pricing Considerations

### Vercel

- **Hobby Plan** (Free):
  - 100GB bandwidth/month
  - 100 hours serverless function execution/month
  - 10-second function timeout
  - Should be sufficient for moderate usage

- **Pro Plan** ($20/month):
  - 1TB bandwidth/month
  - 1000 hours serverless function execution/month
  - 60-second function timeout
  - Better for production apps

### OpenAI

- **text-embedding-3-small**: ~$0.02 / 1M tokens
- **gpt-4o-mini**: ~$0.15 / 1M input tokens, ~$0.60 / 1M output tokens

**Estimated costs** (100 requests/day):
- Embeddings: ~$0.06/month
- Chat completions: ~$1.80/month
- **Total**: ~$2/month for OpenAI

### Supabase

- **Free Plan**:
  - 500MB database
  - 5GB bandwidth
  - 2GB storage
  - Should be sufficient for documentation use case

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Mintlify AI Configuration](https://mintlify.com/docs/settings/ai)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📝 Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Your API Endpoint | `https://YOUR-PROJECT.vercel.app/api/chat` |
| Mintlify Docs | https://devit-c039f40a.mintlify.app |
| Supabase Dashboard | https://app.supabase.com |

### Common Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Run local development
npm run dev

# Sync documentation
npm run sync
```

---

## ✅ Deployment Checklist

- [ ] Create Vercel account
- [ ] Install Vercel CLI (optional)
- [ ] Deploy project to Vercel
- [ ] Add environment variables (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Redeploy after adding environment variables
- [ ] Test API endpoint with cURL
- [ ] Update Mintlify `mint.json` with Vercel URL
- [ ] Commit and push Mintlify changes
- [ ] Test AI assistant on Mintlify docs
- [ ] Verify source links point to correct documentation
- [ ] Monitor function logs for any errors

---

**Congratulations!** 🎉 Your RAG documentation assistant is now publicly accessible and connected to your Mintlify documentation!
