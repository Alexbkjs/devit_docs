# DevIT.Software Multi-App Documentation

> Complete documentation system with AI-powered assistant for Selecty, ReSell, and other DevIT.Software applications.

## 🏗️ Architecture Overview

This monorepo contains everything needed for a production-ready, multi-app documentation system with context-aware AI assistance:

- **📚 Documentation**: Mintlify-based docs for multiple apps (Selecty, ReSell, general)
- **🤖 AI Widget**: React-based assistant with app context detection
- **🔌 Backend API**: Vercel serverless functions for RAG (Retrieval-Augmented Generation)
- **🗄️ Database**: Supabase with pgvector for semantic search
- **⚙️ Scripts**: Documentation sync and embedding generation

## 📁 Project Structure

```
devit-software-docs/
├── docs/                      # 📚 Documentation source files
│   ├── selecty/              # Selecty app documentation
│   ├── resell/               # ReSell app documentation
│   ├── general/              # DevIT.Software company info
│   └── docs.json             # Mintlify navigation config
│
├── widget/                    # 🤖 AI Assistant Widget
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── config.js         # App detection & configuration
│   │   └── main.jsx          # Entry point
│   ├── dist/                 # Build output
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # 🔌 Backend API
│   ├── api/
│   │   └── chat.js           # Chat endpoint with RAG
│   ├── package.json
│   ├── vercel.json           # Vercel deployment config
│   └── README.md             # Backend-specific docs
│
├── database/                  # 🗄️ Database Setup
│   └── schema.sql            # Supabase schema with pgvector
│
├── scripts/                   # ⚙️ Utility Scripts
│   ├── sync-docs.js          # Sync docs to vector store
│   ├── docs_index.txt        # List of doc files to sync
│   └── package.json
│
├── guides/                    # 📖 Implementation Guides
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── SETUP_CHECKLIST.md
│   └── BACKEND_API_GUIDE.md
│
├── .env.example              # Environment variables template
├── .gitignore
├── package.json              # Root package.json (monorepo)
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account and project
- **OpenAI** API key
- **Vercel** account (for deployment)
- **Git** and **GitHub** repository

### 1. Clone & Install

```bash
git clone https://github.com/your-org/devit-docs.git
cd devit-docs

# Install all dependencies
npm run install:all

# Or install individually
npm install              # Root dependencies
cd widget && npm install # Widget dependencies
cd ../backend && npm install # Backend dependencies
cd ../scripts && npm install # Scripts dependencies
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required variables:
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REPO_RAW_BASE=https://raw.githubusercontent.com/your-org/your-repo/main/
REPO_INDEX_URL=https://raw.githubusercontent.com/your-org/your-repo/main/scripts/docs_index.txt
MINTLIFY_BASE_URL=https://your-docs.mintlify.app
```

### 3. Database Setup

1. Create Supabase project at https://supabase.com
2. Go to **SQL Editor** in Supabase dashboard
3. Copy contents of `database/schema.sql`
4. Paste and **Run** to create tables, indexes, and functions

### 4. Sync Documentation

```bash
# Sync docs to vector database
npm run sync
```

This will:
- Fetch all documentation files from GitHub
- Generate embeddings using OpenAI
- Store chunks in Supabase with app_name metadata

Expected output:
```
Found 24 files
Fetching https://raw.githubusercontent.com/.../docs/selecty/index.mdx
  → Split into 3 chunks (App: selecty, Mintlify URL: ...)
  ✓ Upserted docs/selecty/index.mdx--chunk-0 [selecty]
✅ Done! Processed 24 files into 87 chunks
```

## 🛠️ Development

### Widget Development

```bash
# Start widget dev server
npm run widget:dev

# Or:
cd widget
npm run dev
```

- Opens at `http://localhost:5173`
- Hot reload enabled
- Test widget on example page

### Backend Development

```bash
# Start backend dev server
npm run backend:dev

# Or:
cd backend
vercel dev
```

- API available at `http://localhost:3000`
- Test endpoint: `http://localhost:3000/api/chat`

### Test the API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How do I get started with Selecty?"}
    ],
    "app_name": "selecty"
  }'
```

### Viewing Docs Locally

If using Mintlify:

```bash
# Install Mintlify CLI
npm i -g mintlify

# Run docs locally
cd docs
mintlify dev
```

Opens at `http://localhost:3000`

## 📦 Production Deployment

### 1. Deploy Documentation (Mintlify)

**Option A: GitHub Integration (Recommended)**

1. Push to GitHub repository
2. Connect repo to Mintlify at https://mintlify.com
3. Auto-deploys on push to main branch

**Option B: Mintlify CLI**

```bash
cd docs
mintlify deploy
```

### 2. Deploy Backend (Vercel)

```bash
# Deploy to production
npm run backend:deploy

# Or:
cd backend
vercel --prod
```

**Environment Variables** (Vercel):

Add in Vercel dashboard or CLI:

```bash
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Custom Domain** (Optional):

```bash
vercel domains add api.your-domain.com
```

### 3. Build & Deploy Widget

```bash
# Build widget for production
npm run widget:build

# Output: widget/dist/assistant-widget.iife.js
```

**Deploy options**:

1. **Mintlify Custom Script**:
   - Upload `assistant-widget.iife.js` to your server/CDN
   - Add in Mintlify settings → Custom Scripts

2. **CDN** (e.g., Vercel, Netlify):
   ```bash
   cd widget/dist
   vercel --prod
   # Or use any static file hosting
   ```

3. **Add to Mintlify**:

   In Mintlify dashboard, add custom script:
   ```html
   <script src="https://your-cdn.com/assistant-widget.iife.js"></script>
   <script>
     window.MINTLIFY_ASSISTANT_CONFIG = {
       backendURL: 'https://your-backend.vercel.app'
     };
   </script>
   ```

## 🔧 Configuration

### Adding New Apps

To add a new app (e.g., "Quicky"):

1. **Create docs folder**:
   ```bash
   mkdir -p docs/quicky
   ```

2. **Add content**:
   - `docs/quicky/index.mdx`
   - `docs/quicky/quickstart.mdx`
   - `docs/quicky/pricing.mdx`

3. **Update `docs/docs.json`**:
   ```json
   {
     "tab": "Quicky",
     "url": "quicky",
     "groups": [...]
   }
   ```

4. **Update `scripts/docs_index.txt`**:
   ```
   docs/quicky/index.mdx
   docs/quicky/quickstart.mdx
   ...
   ```

5. **Update `widget/src/config.js`**:
   Add Quicky config to `getAppConfig()`

6. **Update `database/schema.sql`** (optional):
   ```sql
   ALTER TABLE documents
   DROP CONSTRAINT valid_app_name;

   ALTER TABLE documents
   ADD CONSTRAINT valid_app_name
   CHECK (app_name IN ('selecty', 'resell', 'general', 'quicky'));
   ```

7. **Sync**:
   ```bash
   npm run sync
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings & chat | ✅ Yes |
| `SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes |
| `REPO_RAW_BASE` | GitHub raw content base URL | ✅ Yes (for sync) |
| `REPO_INDEX_URL` | URL to docs_index.txt file | ✅ Yes (for sync) |
| `MINTLIFY_BASE_URL` | Your Mintlify docs URL | ✅ Yes (for sync) |

## 🧪 Testing

### Test Widget Context Detection

1. Navigate to `/selecty/quickstart`
2. Open widget
3. Verify shows "Selecty" badge
4. Verify Selecty-specific suggestions

Repeat for `/resell/*` and `/general/*`

### Test Backend

```bash
# Test Selecty context
curl -X POST https://your-backend.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How do I create switchers?"}],
    "app_name": "selecty"
  }'

# Test ReSell context
curl -X POST https://your-backend.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How do I create funnels?"}],
    "app_name": "resell"
  }'
```

### Verify Database

In Supabase SQL Editor:

```sql
-- Check app distribution
SELECT app_name, COUNT(*) FROM documents GROUP BY app_name;

-- Should show:
-- selecty  | ~54
-- resell   | ~12
-- general  | ~6
```

## 📊 Monitoring

### Backend Logs (Vercel)

```bash
cd backend
vercel logs --follow
```

Or view in Vercel dashboard: https://vercel.com/your-team/your-project

### Database Metrics (Supabase)

Dashboard → Database → Metrics

- Check query performance
- Monitor storage usage
- View active connections

## 🐛 Troubleshooting

### Issue: Widget not showing

**Check**:
1. Widget script loaded in browser DevTools → Network
2. Backend URL correct in config
3. CORS headers enabled in backend

### Issue: Wrong app context

**Debug**:
```javascript
// In browser console
console.log(window.location.pathname);
// Should match: /selecty/*, /resell/*, or /general/*
```

### Issue: Empty search results

**Causes**:
1. Database not synced: Run `npm run sync`
2. App name mismatch: Check `app_name` in database
3. Threshold too high: Lower `match_threshold` in backend

### Issue: Sync script fails

**Check**:
1. Environment variables set: `echo $SUPABASE_URL`
2. GitHub URLs accessible: `curl $REPO_RAW_BASE/docs/selecty/index.mdx`
3. Supabase credentials valid

## 📚 Documentation

- **Setup Guide**: `guides/SETUP_CHECKLIST.md`
- **Implementation**: `guides/IMPLEMENTATION_GUIDE.md`
- **Backend API**: `guides/BACKEND_API_GUIDE.md`
- **Widget README**: `widget/README.md` (if exists)
- **Backend README**: `backend/README.md`

## 🔗 Links

- **Mintlify Docs**: https://mintlify.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **OpenAI API**: https://platform.openai.com/docs

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes
3. Test locally
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

## 📝 License

MIT

## 👥 Support

- **Email**: support@devit.software
- **Issues**: https://github.com/your-org/devit-docs/issues
- **Documentation**: See `guides/` folder

---

**Built with ❤️ by DevIT.Software**
