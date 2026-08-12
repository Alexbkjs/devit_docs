# Running the project locally

This project has three independently runnable parts:

| Part | Folder | Port | Status |
|---|---|---|---|
| Mintlify docs site | `docs/` | 3000 | ✅ Works |
| AI widget (dev mode) | `widget/` | 5173 | ✅ Works |
| RAG backend API | `backend/` | 9000 | ⚠️ Starts, but vector search fails — see [Fixing the backend](#fixing-the-backend) |

Verified on Node v24.11.1 / npm 11.6.2, 2026-08-13.

## Prerequisites

- **Node.js 18+** (v24.11.1 verified)
- **Mintlify CLI** — `npm i -g mint`
- **Vercel CLI** (only for `npm run backend:dev`) — `npm i -g vercel`
- A `backend/.env` file with `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (see `backend/.env.example`)

Install all workspace dependencies once from the repo root:

```bash
npm run install:all
```

## 1. Docs site

```bash
cd docs
mint dev
```

Serves on http://localhost:3000. Navigation comes from `docs/docs.json`; edits to `.mdx` files hot-reload.

If the CLI is out of date, `mint update`.

## 2. AI widget

For iterating on the widget UI with hot reload:

```bash
cd widget
npm run dev
```

Serves on http://localhost:5173.

To ship changes to the docs site, build and copy the bundle — the docs site loads the pre-built IIFE, not the dev server:

```bash
cd widget
npm run build
cp dist/assistant-widget.iife.js ../docs/assistant-widget.iife.js
```

## 3. RAG backend

```bash
cd backend
node server.js        # or: npm run dev
```

Serves `POST /api/chat` on http://localhost:9000.

Smoke test:

```bash
curl -X POST http://localhost:9000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How do I create a language switcher?"}],"app_name":"selecty"}'
```

There is also `npm run backend:dev` from the repo root, which runs `vercel dev` against `backend/api/chat.js` — the serverless variant of the same handler. `node server.js` is simpler for local work and needs no Vercel login.

To make the widget point at your local backend instead of production, set the docs site to serve from localhost and check `getApiUrl()` in `widget/src/config.js`. To have citation links point at your local docs site, uncomment `LOCAL_DEV_URL=http://localhost:3000` in `backend/.env`.

## Fixing the backend

The backend starts, loads its env, condenses the question and creates the OpenAI embedding successfully. It then fails at the vector-search step:

```
❌ [SEARCH ERROR] TypeError: fetch failed
Caused by: Error: getaddrinfo ENOTFOUND yxksdqisvufaubapvtup.supabase.co (ENOTFOUND)
```

`ENOTFOUND` means the hostname has **no DNS record** — this is not a network or firewall problem (OpenAI calls from the same process succeed, and `api.supabase.com` resolves fine). The Supabase project referenced by `SUPABASE_URL` in `backend/.env` no longer exists: it was deleted, or the free-tier project was removed after a long pause.

Everything else in the stack is fine. To get the backend fully working:

1. **Check the project in the Supabase dashboard** at https://supabase.com/dashboard. If it is merely paused, restore it and skip to step 5. If it is gone, continue.

2. **Create a new Supabase project.** Note its project URL and service-role key (Project Settings → API).

3. **Update `backend/.env`** (and the root `.env`, which the `scripts/` sync uses):

   ```bash
   SUPABASE_URL=https://<new-project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
   ```

4. **Create the schema.** In the Supabase SQL Editor, run `database/supabase-complete-setup.sql`. It enables `pgvector`, creates the `documents` table with a 1536-dim embedding column, the HNSW index, the `app_name` constraint, and the `match_documents` RPC the backend calls.

   > ⚠️ That script begins with `DROP TABLE IF EXISTS documents CASCADE` — it wipes all existing chunks. Safe on a brand-new project; on a **restored** project run only `database/remove-discord-apps.sql` instead, which cleans up the removed apps without destroying the rest.

5. **Push your docs to GitHub first.** The sync script does *not* read local files — it fetches the file list from `REPO_INDEX_URL` and each page's content from `REPO_RAW_BASE`, both `raw.githubusercontent.com` URLs set in `.env`. Unpushed local edits will not be indexed. Confirm those two variables point at your repo and branch.

6. **Populate the vector store** from the repo root:

   ```bash
   npm run backend:sync
   ```

   This embeds every page listed in `scripts/docs_index.txt` (fetched via `REPO_INDEX_URL`) with `text-embedding-3-small` and upserts the chunks. Costs a small amount of OpenAI credit.

7. **Re-run the smoke test** above. You should get a streamed answer with citation links instead of an error.

## Running everything at once

From three terminals:

```bash
cd docs    && mint dev          # http://localhost:3000
cd widget  && npm run dev       # http://localhost:5173
cd backend && node server.js    # http://localhost:9000
```

The docs site and widget are fully usable without the backend — only the AI assistant's answers depend on it.
