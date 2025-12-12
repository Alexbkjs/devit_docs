# URL Transformation for Local Development

## Problem

The vector database stores documentation URLs that point to the production Mintlify site (e.g., `https://devit-c039f40a.mintlify.app/selecty/quickstart`). When developing locally, you want these URLs to point to your local Mintlify dev server (e.g., `http://localhost:3000/selecty/quickstart`).

## Solution

The backend dynamically transforms URLs based on the environment:

- **Vector Database**: Always stores production URLs
- **Sync Script**: Always uses production URL when syncing
- **API Responses**: Transforms URLs to localhost when `LOCAL_DEV_URL` is set

## Configuration

### Production Setup (Vercel)

```bash
# backend/.env on Vercel
MINTLIFY_BASE_URL=https://devit-c039f40a.mintlify.app
# LOCAL_DEV_URL not set - URLs returned as-is
```

### Local Development Setup

```bash
# backend/.env for local development
MINTLIFY_BASE_URL=https://devit-c039f40a.mintlify.app
LOCAL_DEV_URL=http://localhost:3000  # Uncomment this line!
```

## How It Works

### 1. Syncing Documentation

```bash
cd backend
npm run sync
```

This always stores URLs with the production domain in the vector database:
- Input: `docs/selecty/quickstart.mdx`
- Stored URL: `https://devit-c039f40a.mintlify.app/selecty/quickstart`

### 2. API Responses

When `LOCAL_DEV_URL` is set:
- Database URL: `https://devit-c039f40a.mintlify.app/selecty/quickstart`
- Response URL: `http://localhost:3000/selecty/quickstart` ✅

When `LOCAL_DEV_URL` is NOT set (production):
- Database URL: `https://devit-c039f40a.mintlify.app/selecty/quickstart`
- Response URL: `https://devit-c039f40a.mintlify.app/selecty/quickstart` ✅

## Implementation Details

Both `server.js` and `api/chat.js` include the transformation logic:

```javascript
const MINTLIFY_BASE_URL = process.env.MINTLIFY_BASE_URL || 'https://devit-c039f40a.mintlify.app';
const LOCAL_DEV_URL = process.env.LOCAL_DEV_URL;

function transformUrl(url) {
  if (!LOCAL_DEV_URL) return url; // Production: return as-is
  return url.replace(MINTLIFY_BASE_URL, LOCAL_DEV_URL);
}

// Usage in sources
const sources = docs.map(d => ({
  url: transformUrl(d.url),
  path: transformUrl(d.url),
  metadata: { ... }
}));
```

## Benefits

✅ **Single source of truth**: Vector database always has production URLs
✅ **No re-syncing needed**: Same database for dev and prod
✅ **Environment-aware**: Automatically adapts based on configuration
✅ **Zero frontend changes**: Transformation happens server-side
✅ **Easy to toggle**: Just comment/uncomment one line in .env

## Usage Examples

### Example 1: Local Development

```bash
# 1. Set up .env
cd backend
nano .env
# Uncomment: LOCAL_DEV_URL=http://localhost:3000

# 2. Start backend
npm run dev

# 3. Start frontend (in another terminal)
cd ..
npm run dev

# 4. Test - URLs will point to localhost:3000
```

### Example 2: Production (Vercel)

```bash
# 1. Ensure LOCAL_DEV_URL is NOT set in Vercel environment variables
# 2. Deploy
vercel --prod

# 3. URLs will point to production Mintlify site
```

### Example 3: Re-sync After Docs Update

```bash
# Always use the same command regardless of environment
cd backend
npm run sync

# This stores production URLs in the database
# Your local dev will still work if LOCAL_DEV_URL is set
```

## Troubleshooting

### URLs still show production domain in local dev

**Problem**: URLs in chat sources point to `https://devit-c039f40a.mintlify.app`

**Solution**:
1. Check `backend/.env` has `LOCAL_DEV_URL=http://localhost:3000` uncommented
2. Restart the backend server: `npm run dev`
3. Check server logs - should show: `📎 [SOURCES] Sent X sources (transformed to http://localhost:3000)`

### URLs show localhost in production

**Problem**: Production URLs point to `http://localhost:3000`

**Solution**:
1. Check Vercel environment variables
2. Ensure `LOCAL_DEV_URL` is NOT set
3. Redeploy: `vercel --prod`

### Need to change localhost port

**Problem**: Running frontend on different port (e.g., 3001)

**Solution**:
```bash
# backend/.env
LOCAL_DEV_URL=http://localhost:3001
```

## Migration from Old Setup

If you previously had URLs with `https://your-docs-domain.mintlify.app`:

```bash
# 1. Update .env
MINTLIFY_BASE_URL=https://devit-c039f40a.mintlify.app
# LOCAL_DEV_URL=http://localhost:3000

# 2. Re-sync to update URLs in database
cd backend
npm run sync

# 3. Restart server
npm run dev

# 4. Verify URLs are correct
# Check server logs when making a query
```

## Summary

| Environment | MINTLIFY_BASE_URL | LOCAL_DEV_URL | Result URLs |
|-------------|-------------------|---------------|-------------|
| **Production (Vercel)** | `https://devit-c039f40a.mintlify.app` | Not set | Production URLs |
| **Local Dev** | `https://devit-c039f40a.mintlify.app` | `http://localhost:3000` | Localhost URLs |
| **Sync Script** | `https://devit-c039f40a.mintlify.app` | Ignored | Always production |
