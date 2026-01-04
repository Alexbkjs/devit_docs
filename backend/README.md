# Backend Service

This is a standalone RAG-powered documentation assistant backend service for the Devit documentation project.

## Purpose

This backend provides:
- AI-powered documentation search and chat using RAG (Retrieval-Augmented Generation)
- Vector database integration with Supabase
- OpenAI embeddings and chat completions
- Vercel-ready serverless deployment

## Structure

- **`api/chat.js`** - Vercel serverless function (production)
- **`server.js`** - Express server for local development
- **`sync-docs.js`** - Documentation sync script (syncs all docs to vector database)
- **`add-page.js`** - Add/update specific pages without removing existing data
- **`package.json`** - Backend-specific dependencies
- **`.env`** - Environment variables (not committed)

## Relationship to /scripts Folder

The `/scripts` folder at the root contains development and build scripts for the main documentation project.

The `/backend` folder is a self-contained service with its own dependencies and deployment target (Vercel).

## Quick Start

### Local Development

```bash
cd backend
npm install
npm run dev  # Starts server on localhost:9000
```

### Sync Documentation

#### Full Sync (All Documents)
```bash
cd backend
npm run sync  # Syncs all docs to Supabase vector database
```

#### Add/Update Specific Pages
Add or update specific pages without removing existing data:

```bash
cd backend
# Single file
npm run add docs/selecty/features/selectors.mdx

# Multiple files
npm run add docs/selecty/features/selectors.mdx docs/resell/index.mdx

# Using FILES environment variable
FILES="docs/selecty/features/selectors.mdx,docs/resell/index.mdx" npm run add
```

**Benefits of `add-page.js`:**
- No need to clear vector store
- Faster - only processes specified files
- Preserves all existing vectors
- Automatically removes old chunks for the updated file before adding new ones
- **Reads from local filesystem first** - great for adding new pages before pushing to GitHub
- Falls back to GitHub if file not found locally

### Deploy to Vercel

```bash
cd backend
vercel --prod
```

## Documentation

- **PROJECT_OVERVIEW.md** - Technical architecture and system design
- **DEPLOYMENT.md** - Vercel deployment guide

## Environment Variables

Required in `.env`:
```
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REPO_RAW_BASE=...
REPO_INDEX_URL=...
MINTLIFY_BASE_URL=...
```

Optional debugging variables:
```
DEBUG_CHUNKS=true  # Enable chunk-level debugging (disabled by default)
LOCAL_DEV_URL=...  # Transform production URLs to local dev URLs in responses
```

See `.env.example` for template.

## Debugging

### Chunk Debugging

To debug the streaming response chunks from OpenAI, enable chunk logging by setting the `DEBUG_CHUNKS` environment variable:

```bash
# In your .env file
DEBUG_CHUNKS=true
```

When enabled, the chat endpoint will write detailed chunk information to `debug-logs/chunks-{messageId}.log` for each request:

- **Request start**: Initial request details (question, app context)
- **Stream chunks**: Each chunk received from OpenAI with chunk number and content
- **Stream complete**: Final summary with total chunks and full response

**Important**: This feature is **disabled by default** to avoid unnecessary file I/O in production. The `debug-logs/` directory is automatically ignored by git.

**Example debug log entry**:
```json
[2026-01-04T10:30:45.123Z] {"chunkNumber":1,"delta":"To configure","streamData":"0:\"To configure\""}
[2026-01-04T10:30:45.145Z] {"chunkNumber":2,"delta":" a selector","streamData":"0:\" a selector\""}
```
