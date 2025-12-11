# Multi-App Documentation Implementation Guide

This guide explains the multi-app documentation architecture implemented for DevIT.Software, covering Selecty, ReSell, and future applications.

## Overview

The documentation system now supports multiple apps with:
- ✅ Separate documentation sections per app (Selecty, ReSell, General)
- ✅ Multi-app navigation with tabs (like LangChain docs)
- ✅ Top-right links for Partner directory and Terms of Use
- ✅ Vector store separation using app metadata
- ✅ URL-based AI assistant context detection

## Architecture

### File Structure

```
docs/
├── selecty/              # Selecty app documentation
│   ├── index.mdx
│   ├── quickstart.mdx
│   ├── pricing.mdx
│   ├── features/
│   ├── configuration/
│   ├── advanced/
│   └── support/
├── resell/               # ReSell app documentation
│   ├── index.mdx
│   ├── quickstart.mdx
│   ├── pricing.mdx
│   └── support/
├── general/              # DevIT.Software company info
│   ├── index.mdx
│   └── custom-solutions.mdx
└── docs.json             # Multi-app navigation config
```

### URL Structure

- Selecty: `https://your-domain.com/selecty/*`
- ReSell: `https://your-domain.com/resell/*`
- General: `https://your-domain.com/general/*`

## Database Schema Update

### Step 1: Update Supabase Table

Add the `app_name` column to your `documents` table:

```sql
-- Add app_name column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS app_name TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_app_name
ON documents(app_name);

-- Optional: Add check constraint for valid app names
ALTER TABLE documents
ADD CONSTRAINT valid_app_name
CHECK (app_name IN ('selecty', 'resell', 'general'));
```

### Step 2: Verify Schema

Your `documents` table should now have:

| Column    | Type      | Description                    |
|-----------|-----------|--------------------------------|
| id        | text      | Primary key (file path + chunk) |
| title     | text      | Document title                  |
| url       | text      | Mintlify URL                    |
| content   | text      | Chunk content                   |
| embedding | vector    | OpenAI embedding                |
| app_name  | text      | App identifier (NEW)            |

## AI Assistant Widget Integration

### How Context Detection Works

The AI assistant widget identifies which app documentation to search based on the **URL path**:

**URL Path → App Name Mapping:**
- `/selecty/*` → app_name = "selecty"
- `/resell/*` → app_name = "resell"
- `/general/*` → app_name = "general"

### Example Implementation

Here's how to integrate context-aware queries in your AI widget:

```javascript
// ai-widget-integration.js

/**
 * Extract app name from current URL
 */
function getAppNameFromUrl() {
  const path = window.location.pathname;

  // Match URL pattern: /selecty/*, /resell/*, /general/*
  const match = path.match(/^\/(selecty|resell|general)/);

  if (match) {
    return match[1]; // Returns: 'selecty', 'resell', or 'general'
  }

  // Default to 'selecty' if on root or unknown path
  return 'selecty';
}

/**
 * Query vector store with app-specific filtering
 */
async function queryDocumentation(userQuestion) {
  const appName = getAppNameFromUrl();

  // Generate embedding for user's question
  const questionEmbedding = await generateEmbedding(userQuestion);

  // Query Supabase with app filter
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: questionEmbedding,
    match_threshold: 0.7,
    match_count: 5,
    filter_app: appName  // Filter by current app context
  });

  if (error) throw error;

  return data;
}

/**
 * Display context indicator in widget
 */
function updateContextIndicator() {
  const appName = getAppNameFromUrl();
  const indicator = document.getElementById('ai-context-indicator');

  const appLabels = {
    'selecty': 'Selecty Documentation',
    'resell': 'ReSell Documentation',
    'general': 'DevIT.Software Info'
  };

  indicator.textContent = `Searching: ${appLabels[appName]}`;
}
```

### Supabase Function for Filtered Search

Create a PostgreSQL function for app-filtered semantic search:

```sql
-- Create function for app-filtered similarity search
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_app text
)
RETURNS TABLE (
  id text,
  content text,
  url text,
  title text,
  app_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.url,
    documents.title,
    documents.app_name,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE
    documents.app_name = filter_app
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Widget UI Example

Add a visual indicator showing current search context:

```html
<!-- AI Widget Context Indicator -->
<div class="ai-widget">
  <div class="context-badge" id="ai-context-indicator">
    Searching: Selecty Documentation
  </div>

  <input
    type="text"
    placeholder="Ask a question about Selecty..."
    id="ai-question"
  />

  <div class="ai-responses" id="ai-responses"></div>
</div>

<style>
.context-badge {
  background: #16A34A;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 8px;
  display: inline-block;
}
</style>
```

## Running the Sync Script

### Environment Variables

Ensure your `.env` file contains:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub & Mintlify
REPO_RAW_BASE=https://raw.githubusercontent.com/your-org/your-repo/main/
REPO_INDEX_URL=https://raw.githubusercontent.com/your-org/your-repo/main/docs_index.txt
MINTLIFY_BASE_URL=https://your-docs-domain.com
```

### Run Sync

```bash
# Install dependencies (first time only)
npm install

# Run sync script
node sync-docs.js
```

### Expected Output

```
Found 24 files
Fetching https://raw.githubusercontent.com/.../docs/selecty/index.mdx
  → Split into 3 chunks (App: selecty, Mintlify URL: https://your-domain.com/selecty)
  ✓ Upserted docs/selecty/index.mdx--chunk-0 [selecty]
  ✓ Upserted docs/selecty/index.mdx--chunk-1 [selecty]
  ✓ Upserted docs/selecty/index.mdx--chunk-2 [selecty]
Fetching https://raw.githubusercontent.com/.../docs/resell/index.mdx
  → Split into 4 chunks (App: resell, Mintlify URL: https://your-domain.com/resell)
  ✓ Upserted docs/resell/index.mdx--chunk-0 [resell]
  ...
✅ Done! Processed 24 files into 87 chunks (avg 3.6 chunks/file)
```

## Adding New Apps

To add a new app (e.g., "Quicky", "Lably"):

### 1. Create Documentation Folder

```bash
mkdir -p docs/quicky
```

### 2. Add Content

Create at minimum:
- `docs/quicky/index.mdx` (overview)
- `docs/quicky/quickstart.mdx` (getting started)
- `docs/quicky/pricing.mdx` (pricing info)

### 3. Update docs.json

Add new tab to `docs/docs.json`:

```json
{
  "tab": "Quicky",
  "url": "quicky",
  "groups": [
    {
      "group": "Getting Started",
      "pages": [
        "quicky/index",
        "quicky/quickstart",
        "quicky/pricing"
      ]
    }
  ]
}
```

### 4. Update docs_index.txt

Add new files:

```
docs/quicky/index.mdx
docs/quicky/quickstart.mdx
docs/quicky/pricing.mdx
```

### 5. Update Database Constraint (Optional)

If you added the check constraint:

```sql
ALTER TABLE documents
DROP CONSTRAINT valid_app_name;

ALTER TABLE documents
ADD CONSTRAINT valid_app_name
CHECK (app_name IN ('selecty', 'resell', 'general', 'quicky'));
```

### 6. Run Sync

```bash
node sync-docs.js
```

The sync script will automatically:
- Extract `app_name = "quicky"` from file paths
- Store chunks with correct app metadata
- Generate proper Mintlify URLs

## Navigation Structure

### Top Navigation (Tabs)

Users see these tabs in the main navigation:

1. **Selecty** (default, preselected)
2. **ReSell**
3. **About DevIT.Software**

Future apps will be added as additional tabs.

### Top-Right Links

Two links appear in the navbar:
- **Terms of Use** → https://devit.software/terms-of-use/discord
- **Shopify Partner** → https://www.shopify.com/partners/directory/partner/devit-software

### Global Anchors

Additional links in sidebar:
- Shopify Partner (with handshake icon)
- Terms of Use (with contract icon)
- Support (with envelope icon)

## Testing

### 1. Verify File Structure

```bash
# Check that all files are in correct locations
ls -la docs/selecty/
ls -la docs/resell/
ls -la docs/general/
```

### 2. Validate docs.json

```bash
# Use JSON validator or:
cat docs/docs.json | python -m json.tool
```

### 3. Test Sync Script

```bash
# Dry run (test without upserting)
# Add console.log instead of actual upsert to test

node sync-docs.js
```

### 4. Query Database

```sql
-- Check app_name distribution
SELECT app_name, COUNT(*)
FROM documents
GROUP BY app_name;

-- Should return:
-- selecty  | ~54
-- resell   | ~12
-- general  | ~6
```

### 5. Test AI Widget

```javascript
// In browser console on /selecty/quickstart page:
getAppNameFromUrl() // Should return: "selecty"

// On /resell/pricing page:
getAppNameFromUrl() // Should return: "resell"
```

## Benefits of This Architecture

### Scalability
- ✅ Add new apps without changing vector store structure
- ✅ Each app's docs are isolated and independently queryable
- ✅ No risk of cross-app content contamination

### Performance
- ✅ Indexed `app_name` column for fast filtering
- ✅ Smaller result sets (only relevant app's docs)
- ✅ More accurate AI responses (no cross-app confusion)

### Maintainability
- ✅ Clear separation of concerns
- ✅ Easy to update individual app docs
- ✅ Simple to add/remove apps

### User Experience
- ✅ Context-aware AI assistant
- ✅ Faster, more relevant search results
- ✅ Clear visual indication of current context

## Troubleshooting

### Issue: AI Widget Returns Wrong App Content

**Solution**: Verify URL path parsing logic
```javascript
console.log(window.location.pathname); // Check actual path
console.log(getAppNameFromUrl());      // Verify extraction
```

### Issue: Sync Script Fails

**Possible causes**:
1. Missing `app_name` column in database
2. Invalid `REPO_INDEX_URL` in `.env`
3. GitHub raw URL not accessible

**Debug**:
```bash
# Check environment variables
echo $SUPABASE_URL
echo $REPO_INDEX_URL

# Test database connection
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### Issue: Empty App Name in Database

**Cause**: File path doesn't match pattern `docs/<app>/*`

**Fix**: Ensure all files follow structure:
```
docs/
  ├── selecty/
  ├── resell/
  └── general/
```

## Next Steps

1. **Deploy to GitHub**: Push changes to your repository
2. **Run Initial Sync**: Execute `node sync-docs.js` to populate vector store
3. **Implement AI Widget**: Integrate context-aware search in your docs site
4. **Add More ReSell Docs**: Expand ReSell documentation from old docs
5. **Create Additional Apps**: Add Quicky, Lably, etc. following the guide above

## Support

For questions or issues:
- Email: support@devit.software
- Review this guide
- Check sync script logs for errors

---

**Implementation Date**: December 10, 2025
**Architecture**: Multi-app documentation with vector store separation
**Status**: ✅ Complete and ready for deployment
