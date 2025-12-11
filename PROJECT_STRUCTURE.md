# Project Structure

Complete folder organization for DevIT.Software multi-app documentation system.

## Root Directory

```
devit-software-docs/
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore patterns
├── package.json               # Root package.json (monorepo)
├── README.md                  # Main documentation (THIS IS THE ENTRY POINT)
├── CLAUDE.md                  # AI assistant project instructions
└── PROJECT_STRUCTURE.md       # This file
```

## Documentation (`/docs`)

All Mintlify documentation source files organized by app.

```
docs/
├── docs.json                  # Mintlify navigation configuration
├── LICENSE                    # Documentation license
├── favicon.svg                # Site favicon
├── logo/                      # Logo files
│   ├── light.svg
│   └── dark.svg
├── images/                    # Documentation images
│   ├── hero-dark.png
│   ├── hero-light.png
│   └── checks-passed.png
├── assistant-widget.iife.js   # AI widget (deployed build)
│
├── selecty/                   # Selecty app documentation
│   ├── index.mdx
│   ├── quickstart.mdx
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
├── resell/                    # ReSell app documentation
│   ├── index.mdx
│   ├── quickstart.mdx
│   ├── pricing.mdx
│   ├── features/              # (empty - to be added)
│   ├── advanced/              # (empty - to be added)
│   └── support/
│       └── faq.mdx
│
└── general/                   # DevIT.Software general info
    ├── index.mdx
    └── custom-solutions.mdx
```

**Key Files**:
- `docs.json`: Multi-tab navigation configuration
- `*/index.mdx`: Landing page for each app section
- `*/quickstart.mdx`: Getting started guide for each app

## AI Widget (`/widget`)

React-based AI assistant with context detection.

```
widget/
├── package.json               # Widget dependencies
├── vite.config.js             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
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
└── dist/                      # Build output
    └── assistant-widget.iife.js   # Compiled widget
```

**Key Files**:
- `src/config.js`: URL parsing and app context detection
- `src/components/AssistantWidget.jsx`: Widget UI with app-specific features

## Backend API (`/backend`)

Vercel serverless functions for RAG (Retrieval-Augmented Generation).

```
backend/
├── package.json               # Backend dependencies
├── vercel.json                # Vercel deployment configuration
├── README.md                  # Backend-specific documentation
│
└── api/
    └── chat.js                # ⭐ Main chat endpoint with multi-app support
```

**Key Files**:
- `api/chat.js`: Handles chat requests with app context filtering
- `vercel.json`: Deployment configuration for Vercel

## Database (`/database`)

Supabase database schema and setup scripts.

```
database/
└── schema.sql                 # ⭐ Complete Supabase setup
```

**Contents**:
- pgvector extension enablement
- `documents` table with `app_name` column
- Indexes for performance
- `match_documents()` RPC function for filtered search
- Validation constraints

## Scripts (`/scripts`)

Utility scripts for documentation management.

```
scripts/
├── package.json               # Script dependencies
├── sync-docs.js               # ⭐ Documentation sync script
└── docs_index.txt             # List of documentation files
```

**Key Files**:
- `sync-docs.js`: Fetches docs, generates embeddings, stores in Supabase
- `docs_index.txt`: Index of all documentation files to process

## Guides (`/guides`)

Implementation and setup documentation.

```
guides/
├── IMPLEMENTATION_GUIDE.md    # Complete technical architecture
├── SETUP_CHECKLIST.md         # Step-by-step setup instructions
└── BACKEND_API_GUIDE.md       # Backend integration guide
```

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
  /widget/src/* → Build → /widget/dist/assistant-widget.iife.js
                        ↓
                 Deploy to CDN/Mintlify

Backend:
  /backend/api/* → Deploy → Vercel Serverless Functions
                          ↓
                   API at https://your-backend.vercel.app

Docs:
  /docs/* → Push to GitHub → Mintlify Auto-Deploy
                            ↓
                     Live at https://your-docs.mintlify.app
```

## NPM Scripts Reference

### Root Level

```json
{
  "sync": "node scripts/sync-docs.js",
  "widget:dev": "cd widget && npm run dev",
  "widget:build": "cd widget && npm run build",
  "backend:dev": "cd backend && vercel dev",
  "backend:deploy": "cd backend && vercel --prod",
  "install:all": "npm install && cd widget && npm install && cd ../backend && npm install && cd ../scripts && npm install"
}
```

### Widget (`/widget`)

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

### Backend (`/backend`)

```json
{
  "dev": "vercel dev",
  "deploy": "vercel --prod"
}
```

### Scripts (`/scripts`)

```json
{
  "sync": "node sync-docs.js"
}
```

## Environment Variables

Required in `.env` file at root:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# GitHub (for sync)
REPO_RAW_BASE=https://raw.githubusercontent.com/your-org/your-repo/main/
REPO_INDEX_URL=https://raw.githubusercontent.com/your-org/your-repo/main/scripts/docs_index.txt

# Mintlify
MINTLIFY_BASE_URL=https://your-docs.mintlify.app
```

## Critical Paths

### For Adding New Documentation

1. Create: `/docs/app-name/file.mdx`
2. Update: `/docs/docs.json` (add to navigation)
3. Update: `/scripts/docs_index.txt` (add file path)
4. Run: `npm run sync`

### For Modifying AI Widget

1. Edit: `/widget/src/components/AssistantWidget.jsx`
2. Build: `npm run widget:build`
3. Deploy: Upload `/widget/dist/assistant-widget.iife.js` to CDN

### For Updating Backend

1. Edit: `/backend/api/chat.js`
2. Test locally: `npm run backend:dev`
3. Deploy: `npm run backend:deploy`

### For Adding New App

1. Create: `/docs/app-name/` folder structure
2. Update: `/docs/docs.json` (add tab)
3. Update: `/widget/src/config.js` (add app config)
4. Update: `/database/schema.sql` (add to constraint, if using)
5. Update: `/scripts/docs_index.txt` (add file paths)
6. Run: `npm run sync`

## Next Steps

1. Read `README.md` for complete setup instructions
2. Follow `guides/SETUP_CHECKLIST.md` for step-by-step setup
3. Review `guides/IMPLEMENTATION_GUIDE.md` for technical details

---

**Last Updated**: December 11, 2025
**Maintainer**: DevIT.Software
