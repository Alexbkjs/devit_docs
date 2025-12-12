# Scripts

Utility scripts for DevIT.Software documentation project.

## Purpose

This folder contains development and tooling scripts that are separate from the backend service.

## Contents

- **`sync-docs.js`** - Documentation synchronization script (with app_name support)
- **`docs_index.txt`** - List of documentation files to sync
- **`package.json`** - Script-specific dependencies

## Usage

### Sync Documentation to Vector Database

```bash
cd scripts
npm install
npm run sync
```

This script:
1. Fetches MDX files from GitHub
2. Splits them using markdown-aware chunking
3. Generates embeddings using OpenAI
4. Stores chunks in Supabase vector database
5. Includes app_name metadata for filtering (selecty, resell, general)

## Relationship to /backend Folder

The `/backend` folder is a standalone backend service with its own:
- Express server for local development
- Vercel serverless function for production
- Separate package.json and dependencies

The `/scripts` folder contains utility scripts for development tasks.

## Environment Variables

Scripts use environment variables from the root `.env` file or backend `.env`:

```
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REPO_RAW_BASE=...
REPO_INDEX_URL=...
MINTLIFY_BASE_URL=...
```

## Note

The backend folder also has a `sync-docs.js` - both versions are now synchronized and include app_name support.
