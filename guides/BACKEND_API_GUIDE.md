# Backend API Guide for Multi-App Support

This guide explains how to update your backend API to support multi-app context filtering.

## Overview

The updated widget now sends an `app_name` parameter with every chat request. Your backend API must:
1. Extract the `app_name` from the request
2. Use it to filter Supabase queries
3. Return only relevant documentation for that app

## Request Format

### POST /api/chat

The widget sends requests with this structure:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "How do I get started?"
    }
  ],
  "app_name": "selecty"  // NEW: App context
}
```

**app_name values**:
- `"selecty"` - Selecty documentation
- `"resell"` - ReSell documentation
- `"general"` - DevIT.Software general info

## Backend Implementation

### Example: Node.js/Express + Supabase

```javascript
// api/chat.js
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, app_name } = req.body;

    // Validate app_name
    const validApps = ['selecty', 'resell', 'general'];
    const appName = validApps.includes(app_name) ? app_name : 'selecty';

    // Get the last user message
    const userMessage = messages[messages.length - 1].content;

    // Generate embedding for user question
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: userMessage,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Query Supabase with app filter
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      filter_app: appName,  // IMPORTANT: Filter by app
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Build context from retrieved documents
    const context = documents
      .map(doc => `[${doc.title}](${doc.url}):\n${doc.content}`)
      .join('\n\n---\n\n');

    // Create system prompt with context
    const systemPrompt = `You are a helpful AI assistant for ${getAppDisplayName(appName)} documentation.

Use the following documentation to answer the user's question. Always cite sources by including the URLs.

# Documentation Context

${context}

# Instructions

- Answer based ONLY on the provided documentation
- Include relevant URLs as citations
- If the documentation doesn't contain the answer, say so
- Be concise and helpful
- Format responses in Markdown`;

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
    });

    // Stream response to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getAppDisplayName(appName) {
  const names = {
    selecty: 'Selecty',
    resell: 'ReSell',
    general: 'DevIT.Software',
  };
  return names[appName] || 'Selecty';
}
```

### Alternative: Using Vercel AI SDK

If you're using Vercel AI SDK:

```javascript
// api/chat.js
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'edge';

export async function POST(req) {
  const { messages, app_name } = await req.json();

  // Validate app_name
  const validApps = ['selecty', 'resell', 'general'];
  const appName = validApps.includes(app_name) ? app_name : 'selecty';

  // Get last user message
  const userMessage = messages[messages.length - 1].content;

  // Generate embedding
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: userMessage,
    }),
  });

  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.data[0].embedding;

  // Query Supabase with app filter
  const { data: documents } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 5,
    filter_app: appName,
  });

  // Build context
  const context = documents
    .map(doc => `[${doc.title}](${doc.url}):\n${doc.content}`)
    .join('\n\n---\n\n');

  // Generate streaming response
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant for ${getAppDisplayName(appName)} documentation.\n\n${context}`,
      },
      ...messages,
    ],
  });

  return result.toDataStreamResponse();
}

function getAppDisplayName(appName) {
  const names = {
    selecty: 'Selecty',
    resell: 'ReSell',
    general: 'DevIT.Software',
  };
  return names[appName] || 'Selecty';
}
```

## Testing the API

### Test Request

```bash
curl -X POST http://localhost:9000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How do I get started?"
      }
    ],
    "app_name": "selecty"
  }'
```

### Expected Behavior

1. **Request with `app_name: "selecty"`**
   - Should search only Selecty documentation
   - Returns Selecty-specific answers

2. **Request with `app_name: "resell"`**
   - Should search only ReSell documentation
   - Returns ReSell-specific answers

3. **Request with invalid or missing `app_name`**
   - Should default to `"selecty"`
   - Still functions normally

## Environment Variables

Ensure your backend has these environment variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...
```

## Error Handling

### Invalid app_name

```javascript
const validApps = ['selecty', 'resell', 'general'];
const appName = validApps.includes(app_name) ? app_name : 'selecty';
```

### No documents found

```javascript
if (!documents || documents.length === 0) {
  const context = `No specific documentation found for this query in ${appName}.`;
  // Proceed with AI response indicating limited information
}
```

### Database errors

```javascript
if (error) {
  console.error(`Supabase error for app ${appName}:`, error);
  return res.status(500).json({
    error: 'Failed to retrieve documentation',
    app: appName,
  });
}
```

## Logging & Debugging

Add logging to track app context usage:

```javascript
console.log(`[${new Date().toISOString()}] Chat request for app: ${appName}`);
console.log(`Query: "${userMessage}"`);
console.log(`Retrieved ${documents?.length || 0} documents from ${appName}`);
```

## Performance Considerations

### Caching by app

Consider caching embeddings per app:

```javascript
const cacheKey = `${appName}:${userMessage}`;
let cachedEmbedding = cache.get(cacheKey);

if (!cachedEmbedding) {
  cachedEmbedding = await generateEmbedding(userMessage);
  cache.set(cacheKey, cachedEmbedding, 3600); // 1 hour
}
```

### Connection pooling

Reuse Supabase client across requests:

```javascript
// At module level, not inside handler
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
);
```

## Troubleshooting

### Issue: All apps return same results

**Cause**: Not passing `filter_app` to Supabase RPC

**Fix**: Ensure you're calling the updated `match_documents` function:

```javascript
const { data } = await supabase.rpc('match_documents', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 5,
  filter_app: appName,  // ← Make sure this is included
});
```

### Issue: Empty results for specific app

**Cause**: No documents in database for that app

**Fix**: Run sync script to populate:

```bash
node sync-docs.js
```

Then verify in Supabase:

```sql
SELECT app_name, COUNT(*) FROM documents GROUP BY app_name;
```

### Issue: Widget not sending app_name

**Cause**: Old widget version or config issue

**Fix**: Check browser console:

```javascript
// In widget_builder/src/config.js
console.log('Current app:', getAppNameFromUrl());
```

## Next Steps

1. **Update your backend** using code examples above
2. **Deploy updated backend** to production
3. **Test each app context** (selecty, resell, general)
4. **Monitor logs** to ensure app filtering works correctly

## Support

For questions about backend implementation:
- Review `IMPLEMENTATION_GUIDE.md` in project root
- Check Supabase RPC function in `slq_query.sql`
- Test with curl commands above
- Verify database has `app_name` column and index

---

**Last Updated**: December 10, 2025
**Status**: ✅ Ready for implementation
