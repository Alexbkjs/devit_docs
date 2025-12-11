# Multi-App Documentation Setup Checklist

Complete setup guide for DevIT.Software multi-app documentation with AI assistant widget.

## ✅ Completed Tasks

### 1. Documentation Structure ✓
- [x] Restructured docs into app-specific folders (selecty, resell, general)
- [x] Updated `docs.json` with multi-app navigation tabs
- [x] Added top-right links (Partner directory, Terms of Use)
- [x] Created comprehensive ReSell documentation
- [x] Created DevIT.Software general information pages
- [x] Updated `docs_index.txt` with all file paths

### 2. Sync Script ✓
- [x] Updated `sync-docs.js` to extract app_name from file paths
- [x] Added app_name to document metadata
- [x] Enhanced logging to show app context during sync

### 3. Database Schema ✓
- [x] Updated `slq_query.sql` with app_name column
- [x] Created app_name index for performance
- [x] Added app-filtered search function `match_documents()`
- [x] Added validation constraint for valid app names

### 4. AI Widget ✓
- [x] Updated `widget_builder/src/config.js` with URL parsing
- [x] Added `getAppNameFromUrl()` function
- [x] Added `getAppConfig()` for app-specific settings
- [x] Modified `AssistantWidget.jsx` to send app context
- [x] Added visual context indicator in widget header
- [x] Implemented app-specific suggestions

### 5. Documentation ✓
- [x] Created `IMPLEMENTATION_GUIDE.md` - comprehensive technical guide
- [x] Created `BACKEND_API_GUIDE.md` - backend integration guide
- [x] This checklist for setup tracking

## 📋 Next Steps (Your Action Items)

### Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for project to finish provisioning (~2 minutes)
3. Get your project credentials:
   - Project URL: `https://[project-id].supabase.co`
   - Service role key: Settings → API → service_role (secret)

### Step 2: Run SQL Setup

1. In Supabase, go to **SQL Editor**
2. Open `slq_query.sql` file from this project
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** to execute

**What this does**:
- Enables pgvector extension
- Creates `documents` table with `app_name` column
- Creates indexes for performance
- Creates `match_documents()` function for app-filtered search

### Step 3: Configure Environment Variables

Create `.env` file in project root:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# GitHub & Docs
REPO_RAW_BASE=https://raw.githubusercontent.com/your-org/your-repo/main/
REPO_INDEX_URL=https://raw.githubusercontent.com/your-org/your-repo/main/docs_index.txt
MINTLIFY_BASE_URL=https://your-docs-domain.com
```

### Step 4: Sync Documentation to Vector Store

```bash
# Install dependencies (if not already done)
npm install

# Run sync script
node sync-docs.js
```

**Expected output**:
```
Found 24 files
Fetching https://raw.githubusercontent.com/.../docs/selecty/index.mdx
  → Split into 3 chunks (App: selecty, Mintlify URL: ...)
  ✓ Upserted docs/selecty/index.mdx--chunk-0 [selecty]
  ✓ Upserted docs/selecty/index.mdx--chunk-1 [selecty]
...
✅ Done! Processed 24 files into 87 chunks
```

**Verify in Supabase**:
Go to Table Editor → documents → check that rows have `app_name` values

### Step 5: Update Backend API

Follow `widget_builder/BACKEND_API_GUIDE.md` to update your backend:

**Key changes needed**:
1. Extract `app_name` from request body
2. Pass `app_name` to Supabase `match_documents()` function
3. Filter documentation by app context

**Quick test**:
```bash
curl -X POST http://localhost:9000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How do I get started?"}],
    "app_name": "selecty"
  }'
```

### Step 6: Build & Deploy Widget

```bash
cd widget_builder

# Install dependencies
npm install

# Build widget
npm run build

# Output: dist/assistant-widget.iife.js
```

**Deploy widget** to your docs site:

```html
<!-- In your Mintlify docs -->
<script src="/path/to/assistant-widget.iife.js"></script>
<script>
  // Widget will auto-detect app context from URL
  window.MINTLIFY_ASSISTANT_CONFIG = {
    backendURL: 'https://your-backend.vercel.app'
  };
</script>
```

### Step 7: Test Multi-App Context

Visit each documentation section and test the widget:

**Selecty docs** (`/selecty/quickstart`):
- Open widget
- Should show "Selecty" badge
- Should have Selecty-specific suggestions
- Ask: "How do I create language switchers?"
- Should return Selecty docs only

**ReSell docs** (`/resell/quickstart`):
- Open widget
- Should show "ReSell" badge
- Should have ReSell-specific suggestions
- Ask: "How do I create an upsell funnel?"
- Should return ReSell docs only

**General docs** (`/general/custom-solutions`):
- Open widget
- Should show "DevIT.Software" badge
- Should have general suggestions
- Ask: "What apps does DevIT offer?"
- Should return general docs only

### Step 8: Deploy Documentation

**Push to GitHub**:
```bash
git add .
git commit -m "Multi-app documentation structure with AI widget

- Restructured docs for selecty, resell, and general
- Added app-filtered vector store search
- Updated AI widget with context detection
- Added comprehensive documentation guides"
git push origin main
```

**Deploy to Mintlify**:
- Mintlify will auto-deploy when you push to GitHub
- Verify navigation tabs appear correctly
- Test widget on production URLs

## 🧪 Verification Checklist

After completing all steps, verify:

- [ ] **Database**: Documents table has `app_name` column populated
- [ ] **Database**: Query `SELECT app_name, COUNT(*) FROM documents GROUP BY app_name;` shows counts for each app
- [ ] **Widget**: Opens on all doc pages
- [ ] **Widget**: Shows correct app badge (Selecty/ReSell/DevIT.Software)
- [ ] **Widget**: Displays app-specific suggestions
- [ ] **Widget**: Returns relevant docs for each app context
- [ ] **Navigation**: Tabs switch between Selecty/ReSell/General
- [ ] **Links**: Partner directory and Terms of Use links work
- [ ] **Sync**: `node sync-docs.js` completes without errors

## 📊 Database Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check app distribution
SELECT app_name, COUNT(*) as doc_count
FROM documents
GROUP BY app_name
ORDER BY doc_count DESC;

-- Should show:
-- selecty  | ~54
-- resell   | ~12
-- general  | ~6

-- Test search function for Selecty
SELECT id, title, url, app_name
FROM match_documents(
  (SELECT embedding FROM documents LIMIT 1), -- dummy embedding
  0.5,
  5,
  'selecty'
)
LIMIT 5;

-- Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'documents';
```

## 🔧 Troubleshooting

### Issue: Sync script fails

**Check**:
```bash
# Verify environment variables
echo $SUPABASE_URL
echo $OPENAI_API_KEY

# Test Supabase connection
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### Issue: Widget shows wrong app context

**Debug**:
```javascript
// In browser console on /selecty/quickstart
console.log(window.location.pathname);
// Should log: /selecty/quickstart

// Check extracted app name
import { getAppNameFromUrl } from './config.js';
console.log(getAppNameFromUrl());
// Should log: selecty
```

### Issue: All apps return same results

**Fix**: Ensure backend passes `filter_app` to `match_documents()`:

```javascript
const { data } = await supabase.rpc('match_documents', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 5,
  filter_app: appName,  // ← Must be included
});
```

## 📁 File Structure Reference

```
selecty_resell_docs/
├── docs/
│   ├── selecty/           # Selecty app docs
│   ├── resell/            # ReSell app docs
│   ├── general/           # DevIT.Software info
│   └── docs.json          # Navigation config
├── widget_builder/
│   ├── src/
│   │   ├── config.js                  # ✅ Updated with app detection
│   │   └── components/
│   │       └── AssistantWidget.jsx    # ✅ Updated with context
│   ├── BACKEND_API_GUIDE.md           # ✅ New
│   └── dist/                          # Build output
├── sync-docs.js                       # ✅ Updated with app_name
├── slq_query.sql                      # ✅ Updated schema
├── docs_index.txt                     # ✅ Updated paths
├── IMPLEMENTATION_GUIDE.md            # ✅ New
└── SETUP_CHECKLIST.md                 # ✅ This file
```

## 🎯 Adding Future Apps

To add new apps (e.g., Quicky, Lably):

1. **Create docs folder**: `mkdir -p docs/quicky`
2. **Add content**: Create `index.mdx`, `quickstart.mdx`, etc.
3. **Update docs.json**: Add new tab for Quicky
4. **Update docs_index.txt**: List all new files
5. **Update config.js**: Add Quicky to app configs
6. **Update SQL constraint** (optional): Add 'quicky' to valid apps
7. **Run sync**: `node sync-docs.js`

See `IMPLEMENTATION_GUIDE.md` lines 312-360 for detailed instructions.

## 📞 Support

- **General Documentation**: See `IMPLEMENTATION_GUIDE.md`
- **Backend API**: See `widget_builder/BACKEND_API_GUIDE.md`
- **Questions**: support@devit.software

---

**Setup Date**: December 10, 2025
**Architecture**: Multi-app RAG with context-aware AI widget
**Status**: ✅ Ready for deployment
