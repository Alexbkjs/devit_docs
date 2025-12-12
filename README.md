# DevIT.Software Multi-App Documentation System

> Production-ready documentation platform with AI-powered assistant for Selecty, ReSell, and other DevIT.Software applications.

## Overview

This monorepo contains a complete RAG (Retrieval-Augmented Generation) documentation system with:

- **Multi-App Documentation**: Organized docs for Selecty, ReSell, and company info
- **AI Assistant Widget**: Context-aware chat widget that detects which app docs the user is viewing
- **Vector Database**: Supabase with pgvector for semantic search
- **Serverless Backend**: Vercel-deployed API with streaming responses
- **Smart Sync System**: Automatic documentation embedding generation and storage

## Architecture

```
User visits /selecty/quickstart
        ↓
AI Widget detects "selecty" context
        ↓
User asks: "How do I create switchers?"
        ↓
Backend searches only Selecty docs in vector DB
        ↓
Returns AI response with relevant Selecty documentation
```

## Project Structure

```
devit-software-docs/
├── docs/                      # Mintlify documentation source
│   ├── selecty/              # Selecty app docs
│   ├── resell/               # ReSell app docs
│   ├── general/              # Company information
│   └── docs.json             # Mintlify navigation
│
├── widget/                    # AI Assistant Widget
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── config.js         # App context detection
│   │   └── main.jsx
│   └── dist/                 # Build output
│       └── assistant-widget.iife.js
│
├── backend/                   # Serverless API
│   ├── api/
│   │   └── chat.js           # Chat endpoint (Vercel function)
│   ├── server.js             # Local dev server
│   ├── sync-docs.js          # Doc sync script
│   └── .env                  # Environment config
│
├── database/                  # Database setup
│   └── supabase-complete-setup.sql
│
├── scripts/                   # Utility scripts
│   ├── sync-docs.js          # Alternative sync location
│   └── docs_index.txt        # List of doc files
│
└── guides/                    # Setup guides
    ├── SETUP_CHECKLIST.md
    ├── IMPLEMENTATION_GUIDE.md
    └── BACKEND_API_GUIDE.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Supabase](https://supabase.com) account
- [OpenAI API](https://platform.openai.com) key
- [Vercel](https://vercel.com) account
- GitHub repository (for docs hosting)

### Step 1: Clone and Install

```bash
# Clone your repository
git clone https://github.com/Alexbkjs/devit_docs.git
cd devit_docs

# Install all dependencies
npm run install:all
```

### Step 2: Set Up Supabase Database

1. **Create a Supabase project** at https://supabase.com

2. **Get your credentials**:
   - Go to Settings → API
   - Copy `URL` (looks like: https://xxx.supabase.co)
   - Copy `service_role` key (secret key)

3. **Run the SQL setup**:
   - Open Supabase dashboard → SQL Editor
   - Copy contents of `database/supabase-complete-setup.sql`
   - Paste and click **Run**

This creates:
- `documents` table with pgvector extension
- `app_name` column for multi-app filtering
- `match_documents()` function for semantic search
- Necessary indexes for performance

### Step 3: Configure Environment Variables

Create `.env` files in the root and backend directories:

**Root `.env`:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here

# Supabase Configuration
SUPABASE_URL=https://yxksdqisvufaubapvtup.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-key-here

# Documentation Source (GitHub)
REPO_RAW_BASE=https://raw.githubusercontent.com/Alexbkjs/devit_docs/main/
REPO_INDEX_URL=https://raw.githubusercontent.com/Alexbkjs/devit_docs/main/scripts/docs_index.txt

# Production Mintlify URL (stored in vector database)
MINTLIFY_BASE_URL=https://devit-c039f40a.mintlify.app

# Optional: Local development URL transformation
# Uncomment when running Mintlify locally to transform URLs in API responses
# LOCAL_DEV_URL=http://localhost:3000

# Server Configuration
PORT=9000
```

**Backend `.env`:** (copy the same values)
```bash
cd backend
cp ../.env .env
```

### Step 4: Sync Documentation to Vector Database

This step fetches all your documentation, generates embeddings, and stores them in Supabase:

```bash
# From root directory
npm run sync

# Or from backend directory
cd backend
npm run sync
```

**Expected Output:**
```
Found 24 files
Fetching https://raw.githubusercontent.com/Alexbkjs/devit_docs/main/docs/selecty/index.mdx
  → Split into 3 chunks (App: selecty, Mintlify URL: https://devit-c039f40a.mintlify.app/selecty/index)
  ✓ Upserted docs/selecty/index.mdx--chunk-0 [selecty]
  ✓ Upserted docs/selecty/index.mdx--chunk-1 [selecty]
  ...
✅ Done! Processed 24 files into 87 chunks (avg 3.6 chunks/file)
```

**Verify in Supabase:**
```sql
-- Run in Supabase SQL Editor
SELECT app_name, COUNT(*)
FROM documents
GROUP BY app_name;

-- Should show:
-- selecty  | ~54
-- resell   | ~12
-- general  | ~6
```

### Step 5: Test Backend Locally

```bash
# Start local dev server
cd backend
npm run dev
```

Server runs on `http://localhost:9000`

**Test the API:**
```bash
curl -X POST http://localhost:9000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How do I configure currencies?"}
    ],
    "app_name": "selecty"
  }'
```

**Expected Response:**
```
0:"To configure currencies..."
0:"you can use the currency selector..."
8:[{"type":"tool-invocation",...sources...}]
d:{"finishReason":"stop",...}
```

### Step 6: Deploy Backend to Vercel

```bash
cd backend

# Login to Vercel
vercel login

# Remove old project link (if exists)
rm -rf .vercel

# Deploy to production
vercel --prod
```

**Follow prompts:**
- Set up and deploy? → Yes
- Which scope? → Select your account
- Link to existing project? → No
- Project name? → `devit-docs-api`
- Directory? → `./` (current)

**Add Environment Variables in Vercel:**

Option A: Via Vercel Dashboard
1. Go to vercel.com/dashboard
2. Select your `devit-docs-api` project
3. Go to Settings → Environment Variables
4. Add each variable (select Production, Preview, Development for all):
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REPO_RAW_BASE`
   - `REPO_INDEX_URL`
   - `MINTLIFY_BASE_URL`

Option B: Via CLI
```bash
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add REPO_RAW_BASE
vercel env add REPO_INDEX_URL
vercel env add MINTLIFY_BASE_URL
```

**Redeploy** after adding variables:
```bash
vercel --prod
```

**Your API is now live at:**
```
https://devit-docs-api.vercel.app/api/chat
```

### Step 7: Build and Deploy Widget

```bash
# Build widget for production
cd widget
npm run build
```

Output: `widget/dist/assistant-widget.iife.js`

**Update widget configuration:**

Edit `widget/src/config.js` line 22:
```javascript
// Production default
return 'https://devit-docs-api.vercel.app';  // ← Your Vercel URL
```

Rebuild:
```bash
npm run build
```

**Copy to docs folder** (for Mintlify):
```bash
cp dist/assistant-widget.iife.js ../docs/assistant-widget.iife.js
```

### Step 8: Deploy Documentation to Mintlify

**Option A: GitHub Integration (Recommended)**

1. Push your code to GitHub:
```bash
git add .
git commit -m "Set up multi-app documentation with AI assistant"
git push origin main
```

2. Connect to Mintlify:
   - Go to https://mintlify.com/dashboard
   - Click "New Project"
   - Connect your GitHub repository
   - Select the `docs` folder as the documentation root
   - Mintlify auto-deploys on every push to main

**Option B: Mintlify CLI**
```bash
npm i -g mintlify
cd docs
mintlify deploy
```

**Your docs are now live at:**
```
https://devit-c039f40a.mintlify.app
```

### Step 9: Verify Everything Works

1. **Visit your Mintlify docs**: https://devit-c039f40a.mintlify.app

2. **Test Selecty context**:
   - Navigate to `/selecty/quickstart`
   - Open AI widget (bottom right)
   - Should show "Selecty" badge
   - Ask: "How do I create language switchers?"
   - Should get Selecty-specific answer with sources

3. **Test ReSell context**:
   - Navigate to `/resell/quickstart`
   - Widget should show "ReSell" badge
   - Ask: "How do I create an upsell funnel?"
   - Should get ReSell-specific answer

4. **Test General context**:
   - Navigate to `/general`
   - Widget should show "DevIT.Software" badge
   - Ask: "What apps does DevIT offer?"
   - Should get general company info

## Development Workflow

### Local Development

**Run Mintlify docs locally:**
```bash
npm i -g mintlify
cd docs
mintlify dev
```
Docs run on `http://localhost:3000`

**Run widget dev server:**
```bash
cd widget
npm run dev
```
Widget runs on `http://localhost:5173`

**Run backend dev server:**
```bash
cd backend
npm run dev
```
API runs on `http://localhost:9000`

**Enable local URL transformation:**

Uncomment in `backend/.env`:
```bash
LOCAL_DEV_URL=http://localhost:3000
```

This transforms production Mintlify URLs to localhost in API responses.

### Update Documentation

1. **Edit docs** in `docs/` folder
2. **Update index** if new files: `scripts/docs_index.txt`
3. **Sync to vector database**:
```bash
npm run sync
```
4. **Commit and push**:
```bash
git add .
git commit -m "Update documentation"
git push
```
Mintlify auto-deploys the changes.

### Update Widget

1. **Edit widget** in `widget/src/`
2. **Test locally**: `npm run dev`
3. **Build**: `npm run build`
4. **Copy to docs**: `cp dist/assistant-widget.iife.js ../docs/`
5. **Commit and push** to deploy

### Update Backend

1. **Edit** `backend/api/chat.js`
2. **Test locally**: `npm run dev`
3. **Deploy**: `vercel --prod`

## Adding New Apps

To add a new app (e.g., "Quicky"):

**1. Create docs folder:**
```bash
mkdir -p docs/quicky
```

**2. Add documentation files:**
- `docs/quicky/index.mdx` (landing page)
- `docs/quicky/quickstart.mdx`
- `docs/quicky/pricing.mdx`
- etc.

**3. Update Mintlify navigation** (`docs/docs.json`):
```json
{
  "tabs": [
    {"name": "Selecty", "url": "selecty"},
    {"name": "ReSell", "url": "resell"},
    {"name": "Quicky", "url": "quicky"}  // Add this
  ],
  "navigation": [
    {
      "group": "Quicky",
      "pages": [
        "quicky/index",
        "quicky/quickstart",
        "quicky/pricing"
      ]
    }
  ]
}
```

**4. Update docs index** (`scripts/docs_index.txt`):
```
docs/quicky/index.mdx
docs/quicky/quickstart.mdx
docs/quicky/pricing.mdx
```

**5. Update widget config** (`widget/src/config.js`):
```javascript
const configs = {
  selecty: { /*...*/ },
  resell: { /*...*/ },
  quicky: {  // Add this
    name: 'quicky',
    displayName: 'Quicky',
    description: 'Quick description of Quicky',
    docsPath: '/quicky',
    suggestions: [
      "How do I get started with Quicky?",
      "What are Quicky's features?",
      "How to configure Quicky?",
      "Where can I get support?"
    ]
  }
};
```

**6. Update database constraint** (optional):
```sql
-- Run in Supabase SQL Editor
ALTER TABLE documents DROP CONSTRAINT IF EXISTS valid_app_name;
ALTER TABLE documents ADD CONSTRAINT valid_app_name
  CHECK (app_name IN ('selecty', 'resell', 'general', 'quicky'));
```

**7. Sync documentation:**
```bash
npm run sync
```

**8. Rebuild widget:**
```bash
cd widget && npm run build
cp dist/assistant-widget.iife.js ../docs/
```

**9. Deploy:**
```bash
git add .
git commit -m "Add Quicky app documentation"
git push
```

## Environment Variables Reference

| Variable | Description | Required | Where Used |
|----------|-------------|----------|------------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings & chat | ✅ Yes | Backend, Sync |
| `SUPABASE_URL` | Supabase project URL | ✅ Yes | Backend, Sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes | Backend, Sync |
| `REPO_RAW_BASE` | GitHub raw content base URL | ✅ Yes | Sync script |
| `REPO_INDEX_URL` | URL to docs_index.txt | ✅ Yes | Sync script |
| `MINTLIFY_BASE_URL` | Production Mintlify URL | ✅ Yes | Sync script |
| `LOCAL_DEV_URL` | Local dev URL (e.g., http://localhost:3000) | ⚠️ Dev only | Backend |
| `PORT` | API server port | ❌ No (default: 9000) | Backend |

## Troubleshooting

### Widget Not Showing

**Check:**
1. Widget script loaded: Browser DevTools → Network → `assistant-widget.iife.js`
2. Backend URL correct in `widget/src/config.js`
3. CORS enabled in backend (already configured)
4. Console for JavaScript errors

### Wrong App Context Detected

**Debug:**
```javascript
// In browser console
console.log(window.location.pathname);
// Should be /selecty/*, /resell/*, or /general/*
```

**Fix**: Ensure URL structure matches pattern in `widget/src/config.js` line 38

### Empty Search Results

**Causes:**
1. Database not synced: Run `npm run sync`
2. Wrong app_name: Check database has correct app_name values
3. Environment variables missing in Vercel

**Verify database:**
```sql
SELECT app_name, COUNT(*) FROM documents GROUP BY app_name;
```

### Sync Script Fails

**Check:**
1. Environment variables set: `cat .env`
2. GitHub URLs accessible: `curl $REPO_RAW_BASE/docs/selecty/index.mdx`
3. Supabase credentials valid
4. OpenAI API key valid and has credits

### Vercel Function Timeout

**Solution:**
- Hobby plan: 10-second timeout
- Pro plan: 60-second timeout
- Consider upgrading if complex queries timeout

## Monitoring & Logs

**Vercel Logs:**
```bash
cd backend
vercel logs --follow
```

Or: Vercel Dashboard → Your Project → Logs

**Supabase Logs:**
Supabase Dashboard → Logs → Database

**Search Performance:**
```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM match_documents(
  (SELECT embedding FROM documents LIMIT 1),
  5,
  'selecty'
);
```

## Cost Estimates

**Vercel (Hobby Plan - Free):**
- 100GB bandwidth/month
- 100 hours serverless execution/month
- Sufficient for moderate usage

**OpenAI (for 100 requests/day):**
- Embeddings: ~$0.06/month
- Chat completions: ~$1.80/month
- **Total: ~$2/month**

**Supabase (Free Plan):**
- 500MB database
- 5GB bandwidth
- 2GB storage
- Sufficient for documentation use case

## Documentation

- **Quick Setup**: `guides/SETUP_CHECKLIST.md`
- **Technical Details**: `backend/PROJECT_OVERVIEW.md`
- **Deployment Guide**: `backend/DEPLOYMENT.md`
- **API Integration**: `guides/BACKEND_API_GUIDE.md`
- **URL Transformation**: `backend/URL-TRANSFORMATION.md`

## Links

- **Your Docs**: https://devit-c039f40a.mintlify.app
- **Backend API**: https://devit-docs-api.vercel.app/api/chat
- **GitHub Repo**: https://github.com/Alexbkjs/devit_docs
- **Supabase**: https://app.supabase.com
- **Vercel**: https://vercel.com/dashboard

**Mintlify**: https://mintlify.com/docs
**Supabase Docs**: https://supabase.com/docs
**Vercel Docs**: https://vercel.com/docs
**OpenAI API**: https://platform.openai.com/docs

## Support

- **Email**: support@devit.software
- **Issues**: https://github.com/Alexbkjs/devit_docs/issues

## License

MIT

---

**Built with ❤️ by DevIT.Software**
