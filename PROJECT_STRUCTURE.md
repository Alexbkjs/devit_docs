# Project Structure

Complete folder organization for the DevIT.Software multi-app documentation system with AI assistant.

---

## Root Directory

```
devit_docs/
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── .gitignore                 # Git ignore patterns
├── package.json               # Root package.json (monorepo scripts)
├── package-lock.json          # Dependency lock file
├── README.md                  # ⭐ MAIN ENTRY POINT - Start here!
├── CLAUDE.md                  # AI assistant instructions
├── PROJECT_STRUCTURE.md       # This file
└── TODO                       # Development notes
```

**Key Files:**
- **README.md** - Complete setup guide with step-by-step instructions
- **.env** - Local environment configuration (not in Git)
- **package.json** - Monorepo scripts (`sync`, `widget:build`, `backend:deploy`, etc.)

---

## Documentation (`/docs`)

Mintlify documentation source files organized by app.

```
docs/
├── docs.json                  # ⭐ Mintlify navigation (multi-tab config)
├── LICENSE                    # Documentation license
├── favicon.svg                # Site favicon
├── assistant-widget.iife.js   # ⭐ Built AI widget (deployed here)
│
├── logo/                      # Brand assets
│   ├── light.svg
│   └── dark.svg
│
├── images/                    # Documentation images
│   ├── hero-dark.png
│   ├── hero-light.png
│   └── checks-passed.png
│
├── selecty/                   # ⭐ Selecty app documentation
│   ├── index.mdx              # Landing page
│   ├── quickstart.mdx         # Getting started
│   ├── pricing.mdx
│   ├── features/
│   │   ├── selectors.mdx
│   │   ├── markets-recommendation.mdx
│   │   ├── markets-recommendation-display.mdx
│   │   ├── markets-redirect.mdx
│   │   └── multiple-stores.mdx
│   ├── configuration/
│   │   ├── languages.mdx
│   │   ├── currencies.mdx
│   │   └── resources.mdx
│   ├── advanced/
│   │   ├── seo.mdx
│   │   ├── testing-geolocation.mdx
│   │   └── pagefly.mdx
│   └── support/
│       ├── faq.mdx
│       ├── help.mdx
│       ├── accessibility.mdx
│       └── privacy.mdx
│
├── resell/                    # ⭐ ReSell app documentation
│   ├── index.mdx
│   ├── quickstart.mdx
│   ├── pricing.mdx
│   └── support/
│       └── faq.mdx
│
└── general/                   # ⭐ DevIT.Software general info
    ├── index.mdx
    └── custom-solutions.mdx
```

**Key Files:**
- **docs.json** - Multi-tab navigation configuration
- **assistant-widget.iife.js** - Built widget file (copy here from `widget/dist/`)
- ***/index.mdx** - Landing page for each app section
- ***/quickstart.mdx** - Getting started guide for each app

---

## AI Widget (`/widget`)

React-based AI assistant with automatic app context detection.

```
widget/
├── package.json               # Widget dependencies
├── package-lock.json
├── vite.config.js             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS
├── postcss.config.js          # PostCSS
├── index.html                 # Development HTML
│
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # App component
│   ├── widget.jsx             # Widget initialization
│   ├── config.js              # ⭐ App detection & configuration
│   ├── utils.js               # Utility functions
│   ├── App.css                # Styles
│   └── components/
│       ├── AssistantWidget.jsx   # ⭐ Main widget component
│       ├── Message.jsx
│       └── Icons.jsx
│
└── dist/                      # ⭐ Build output
    └── assistant-widget.iife.js   # Compiled widget (deploy this)
```

**Key Files:**
- **src/config.js** - URL parsing logic for app context detection (`getAppNameFromUrl()`, `getAppConfig()`)
- **src/components/AssistantWidget.jsx** - Widget UI with app-specific features
- **dist/assistant-widget.iife.js** - Final built file to deploy

**Development:**
```bash
cd widget
npm run dev        # Start dev server (localhost:5173)
npm run build      # Build for production
```

---

## Backend API (`/backend`)

Vercel serverless functions for RAG-powered documentation chat.

```
backend/
├── package.json               # Backend dependencies
├── package-lock.json
├── vercel.json                # ⭐ Vercel deployment config
├── .vercelignore              # Files to ignore in deployment
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
│
├── api/
│   └── chat.js                # ⭐ Main chat endpoint (Vercel function)
│
├── server.js                  # ⭐ Local development server
├── sync-docs.js               # ⭐ Documentation sync script
│
├── README.md                  # Backend overview
├── PROJECT_OVERVIEW.md        # Technical architecture details
├── DEPLOYMENT.md              # Vercel deployment guide
└── URL-TRANSFORMATION.md      # Local dev URL transformation guide
```

**Key Files:**
- **api/chat.js** - Chat endpoint deployed as Vercel serverless function
- **server.js** - Local Express server for development
- **sync-docs.js** - Fetches docs, generates embeddings, stores in Supabase
- **vercel.json** - Deployment configuration

**Development:**
```bash
cd backend
npm run dev        # Start local server (localhost:9000)
npm run sync       # Sync docs to Supabase
vercel --prod      # Deploy to production
```

---

## Database (`/database`)

Supabase database schema and setup scripts.

```
database/
└── supabase-complete-setup.sql   # ⭐ Complete database setup
```

**Contents:**
- pgvector extension enablement
- `documents` table with multi-app support:
  - `id` (text) - Document chunk ID
  - `title` (text) - Document title
  - `url` (text) - Mintlify URL
  - `content` (text) - Chunk content
  - `app_name` (text) - App identifier (selecty/resell/general)
  - `embedding` (vector(1536)) - OpenAI embedding
- Indexes for fast similarity search
- `match_documents()` function with optional app filtering
- Validation constraints

**Setup:**
Run the SQL file in Supabase SQL Editor to create all necessary database objects.

---

## Scripts (`/scripts`)

Utility scripts for documentation management.

```
scripts/
├── package.json               # Script dependencies
├── sync-docs.js               # Documentation sync script
├── docs_index.txt             # ⭐ List of documentation files
└── README.md                  # Scripts documentation
```

**Key Files:**
- **sync-docs.js** - Alternative location for sync script (also in `/backend`)
- **docs_index.txt** - Index of all documentation files to process

**Note:** The sync script can be run from either `/scripts` or `/backend` directory.

---

## Guides (`/guides`)

Implementation and setup documentation.

```
guides/
├── IMPLEMENTATION_GUIDE.md    # Complete technical architecture
├── SETUP_CHECKLIST.md         # Step-by-step setup instructions
└── BACKEND_API_GUIDE.md       # Backend integration guide
```

**Purpose:**
- **IMPLEMENTATION_GUIDE.md** - Deep technical details about the system
- **SETUP_CHECKLIST.md** - Checklist-style setup walkthrough
- **BACKEND_API_GUIDE.md** - API integration and usage guide

---

## File Relationships

### Development Flow

```
1. Edit docs in /docs/selecty/* or /docs/resell/*
   ↓
2. Update /scripts/docs_index.txt if new files added
   ↓
3. Run `npm run sync` to update vector database
   ↓
4. Changes reflected in AI widget responses
```

### Build & Deploy Flow

```
Widget:
  /widget/src/* → npm run build → /widget/dist/assistant-widget.iife.js
                                 ↓
                         Copy to /docs/assistant-widget.iife.js
                                 ↓
                         Git push → Mintlify deploys

Backend:
  /backend/api/chat.js → vercel --prod → Vercel Serverless
                                        ↓
                         Live at https://devit-docs-api.vercel.app

Docs:
  /docs/* → Git push → Mintlify Auto-Deploy
                     ↓
           Live at https://devit-c039f40a.mintlify.app
```

---

## NPM Scripts Reference

### Root Level (`package.json`)

```json
{
  "sync": "node scripts/sync-docs.js",
  "widget:dev": "cd widget && npm run dev",
  "widget:build": "cd widget && npm run build",
  "backend:sync": "cd backend && node sync-docs.js",
  "backend:dev": "cd backend && vercel dev",
  "backend:deploy": "cd backend && vercel --prod",
  "install:all": "npm install && cd widget && npm install && cd ../backend && npm install && cd ../scripts && npm install"
}
```

### Widget (`/widget/package.json`)

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

### Backend (`/backend/package.json`)

```json
{
  "dev": "node server.js",
  "sync": "node sync-docs.js"
}
```

---

## Environment Variables

Required in `.env` files (root and `/backend`):

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://yxksdqisvufaubapvtup.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# GitHub (for sync)
REPO_RAW_BASE=https://raw.githubusercontent.com/Alexbkjs/devit_docs/main/
REPO_INDEX_URL=https://raw.githubusercontent.com/Alexbkjs/devit_docs/main/scripts/docs_index.txt

# Mintlify
MINTLIFY_BASE_URL=https://devit-c039f40a.mintlify.app

# Optional: Local development (transforms URLs to localhost)
LOCAL_DEV_URL=http://localhost:3000
```

---

## Critical Paths

### For Adding New Documentation

1. Create: `/docs/app-name/file.mdx`
2. Update: `/docs/docs.json` (add to navigation)
3. Update: `/scripts/docs_index.txt` (add file path)
4. Run: `npm run sync`
5. Commit and push

### For Modifying AI Widget

1. Edit: `/widget/src/components/AssistantWidget.jsx`
2. Build: `npm run widget:build`
3. Copy: `cp widget/dist/assistant-widget.iife.js docs/`
4. Commit and push

### For Updating Backend

1. Edit: `/backend/api/chat.js`
2. Test locally: `npm run backend:dev`
3. Deploy: `vercel --prod`

### For Adding New App

1. Create: `/docs/app-name/` folder structure
2. Update: `/docs/docs.json` (add tab)
3. Update: `/widget/src/config.js` (add app config)
4. Update: `/database/supabase-complete-setup.sql` (add to constraint)
5. Update: `/scripts/docs_index.txt` (add file paths)
6. Run: `npm run sync`
7. Rebuild widget: `npm run widget:build`
8. Copy widget: `cp widget/dist/assistant-widget.iife.js docs/`
9. Commit and push

---

## Production URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Mintlify Docs** | https://devit-c039f40a.mintlify.app | Published documentation |
| **Backend API** | https://devit-docs-api.vercel.app/api/chat | Chat endpoint |
| **GitHub Repo** | https://github.com/Alexbkjs/devit_docs | Source code |
| **Supabase** | https://app.supabase.com | Database dashboard |
| **Vercel** | https://vercel.com/dashboard | API deployment |

---

## Common Commands

```bash
# Setup
npm run install:all              # Install all dependencies

# Development
npm run widget:dev               # Start widget dev server
npm run backend:dev              # Start backend dev server
cd docs && mintlify dev          # Start Mintlify dev server

# Build & Deploy
npm run widget:build             # Build widget
npm run backend:deploy           # Deploy backend to Vercel
git push                         # Deploy docs via Mintlify

# Maintenance
npm run sync                     # Sync docs to vector database
vercel logs --follow             # View backend logs
```

---

## Next Steps

1. **New to this project?** Read `README.md` for complete setup
2. **Need step-by-step setup?** Follow `guides/SETUP_CHECKLIST.md`
3. **Want technical details?** Read `backend/PROJECT_OVERVIEW.md`
4. **Deploying to Vercel?** Follow `backend/DEPLOYMENT.md`

---

**Last Updated:** December 12, 2025
**Current State:** Production-ready with deployed backend and widget
**Maintainer:** DevIT.Software
