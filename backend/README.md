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
- **`sync-docs.js`** - Documentation sync script (syncs docs to vector database)
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

```bash
cd backend
npm run sync  # Syncs docs to Supabase vector database
```

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

See `.env.example` for template.
