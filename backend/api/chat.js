// api/chat.js - Vercel Serverless Function
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const EMB_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";
const TOP_K = 10;
const SIMILARITY_THRESHOLD = 0.35;
const MINTLIFY_BASE_URL = process.env.MINTLIFY_BASE_URL || 'https://devit-c039f40a.mintlify.app';
const LOCAL_DEV_URL = process.env.LOCAL_DEV_URL; // Optional: Transform URLs for local dev
const DEBUG_CHUNKS = process.env.DEBUG_CHUNKS === 'true'; // Debug flag: set to 'true' to enable chunk logging

// Question condensing settings
const CONDENSER_MODEL = "gpt-4o-mini";
const HISTORY_TURNS = 5; // 5 turns = 10 messages (user + assistant pairs)

// Helper function to transform URLs for local development
function transformUrl(url) {
  if (!LOCAL_DEV_URL) return url; // Production: return as-is

  // Replace production Mintlify URL with local dev URL
  return url.replace(MINTLIFY_BASE_URL, LOCAL_DEV_URL);
}

// Helper function to write debug chunks to file (disabled by default)
function writeDebugChunk(messageId, data) {
  if (!DEBUG_CHUNKS) return; // Skip if debug mode is disabled

  try {
    const debugDir = path.join(process.cwd(), 'debug-logs');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const logFile = path.join(debugDir, `chunks-${messageId}.log`);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(data)}\n`;

    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Failed to write debug chunk:', error);
  }
}

// App display names mapping
const APP_DISPLAY_NAMES = {
  selecty: 'Selecty',
  resell: 'ReSell',
  general: 'DevIT.Software',
  lably: 'Lably',
  reactflow: 'React Flow',
  'discord-bots': 'Discord Bots'
};

/**
 * Condenses a user message into a standalone search query.
 * Extracts the core question from verbose messages and resolves pronouns using history.
 */
async function condenseQuestion(question, conversationHistory, appDisplayName) {
  // Format history as concise text blocks (if any)
  const historyText = conversationHistory.length > 0
    ? conversationHistory
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')
    : 'No previous conversation.';

  const condenserPrompt = `Extract the core question from the user's message for searching ${appDisplayName} documentation.

If there is conversation history, incorporate relevant context into a standalone question.

Rules:
- Extract the main question/intent, removing background information and pleasantries
- If the message references previous context (pronouns like "it", "that"), resolve them using the history
- Keep the output concise (under 50 words) and focused on searchable terms
- Do not answer the question, only extract/rewrite it
- Output ONLY the extracted question, nothing else

Conversation History:
${historyText}

User Message: ${question}

Extracted Question:`;

  try {
    const response = await openai.chat.completions.create({
      model: CONDENSER_MODEL,
      messages: [{ role: "user", content: condenserPrompt }],
      max_tokens: 100,
      temperature: 0,
    });

    const condensed = response.choices[0]?.message?.content?.trim();
    return condensed || question;
  } catch (error) {
    console.error('⚠️ [CONDENSER] Failed, using original question:', error.message);
    return question; // Fallback to original on error
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('\n📨 [REQUEST] New chat request received');

  try {
    const { messages, app_name } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ [ERROR] No messages array provided');
      return res.status(400).json({ error: "No messages array provided" });
    }

    // Validate and default app_name
    const validApps = ['selecty', 'resell', 'general', 'lably', 'reactflow', 'discord-bots', 'email', 'telegram'];
    const appName = validApps.includes(app_name) ? app_name : 'selecty';
    const appDisplayName = APP_DISPLAY_NAMES[appName] || 'Selecty';

    console.log(`💬 [MESSAGES] Received ${messages.length} messages`);
    console.log(`📱 [APP] Context: ${appName} (${appDisplayName})`);

    // Get the latest user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      console.error('❌ [ERROR] No user message found');
      return res.status(400).json({ error: "No user message found" });
    }

    const originalQuestion = lastUserMessage.content;
    console.log(`❓ [ORIGINAL] "${originalQuestion}"`);

    // Extract conversation history (last N turns, excluding current message)
    const historyMessages = messages.slice(-(HISTORY_TURNS * 2 + 1), -1);
    console.log(`📜 [HISTORY] ${historyMessages.length} messages for context`);

    // Condense question for optimal vector search
    console.log('🔄 [CONDENSER] Extracting core question...');
    const condensedQuestion = await condenseQuestion(originalQuestion, historyMessages, appDisplayName);
    console.log(`🔍 [CONDENSED] "${condensedQuestion}"`);

    // Set headers for streaming response (Vercel AI SDK format)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    console.log('✅ [HEADERS] Streaming headers set');

    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    console.log(`🆔 [MESSAGE_ID] ${messageId}`);

    if (DEBUG_CHUNKS) {
      console.log('🐛 [DEBUG] Chunk debugging enabled - writing to debug-logs/');
      writeDebugChunk(messageId, {
        type: 'request_start',
        originalQuestion: originalQuestion,
        condensedQuestion: condensedQuestion,
        historyLength: historyMessages.length,
        app_name: appName,
        timestamp: new Date().toISOString()
      });
    }

    // 1) Create embedding for the CONDENSED question (optimized for search)
    console.log('🔄 [EMBEDDING] Creating embedding for condensed question...');
    const embResp = await openai.embeddings.create({
      model: EMB_MODEL,
      input: condensedQuestion,
    });
    const qEmbedding = embResp.data[0].embedding;
    console.log(`✅ [EMBEDDING] Created (dimension: ${qEmbedding.length})`);

    // 2) Fetch top-K docs from Supabase via RPC with app filter
    console.log(`🔍 [SEARCH] Searching for top ${TOP_K} documents in ${appName}...`);
    const { data: docs, error } = await supabase
      .rpc("match_documents", {
        query_embedding: qEmbedding,
        match_count: TOP_K,
        filter_app: appName  // IMPORTANT: Filter by app context
      });
    if (error) {
      console.error('❌ [SEARCH ERROR]', error);
      throw error;
    }
    console.log(`✅ [SEARCH] Found ${docs?.length || 0} documents from ${appName}`);

    // Debug: Log vector search results if DEBUG_CHUNKS is enabled
    if (DEBUG_CHUNKS && docs && docs.length > 0) {
      const searchLogFile = path.join(process.cwd(), 'debug-logs', `search-${messageId}.log`);
      const timestamp = new Date().toISOString();

      docs.forEach((doc, index) => {
        const logEntry = `[${timestamp}] Document ${index + 1}/${docs.length}:\n` +
          `  Title: ${doc.title}\n` +
          `  URL: ${doc.url}\n` +
          `  App: ${doc.app_name}\n` +
          `  Similarity: ${doc.similarity}\n` +
          `  Content Preview: ${doc.content.substring(0, 200)}...\n` +
          `  Full Content Length: ${doc.content.length} chars\n\n`;

        fs.appendFileSync(searchLogFile, logEntry);
      });

      console.log(`🔍 [DEBUG] Vector search results logged to debug-logs/search-${messageId}.log`);
    }

    // Filter by similarity threshold
    const relevantDocs = docs.filter(d => d.similarity >= SIMILARITY_THRESHOLD);
    console.log(`🎯 [FILTER] ${relevantDocs.length}/${docs.length} chunks above similarity threshold (${SIMILARITY_THRESHOLD})`);

    // 3) Build the context
    const contextText = relevantDocs.map((d) =>
      `---\nTitle: ${d.title}\nURL: ${d.url}\n\n${d.content}\n`
    ).join("\n");
    console.log(`📄 [CONTEXT] Built context from ${relevantDocs.length} relevant documents`);

    // 4) Build conversation history for OpenAI with app context
    const conversationMessages = [
      {
        role: "system",
        content: `You are a helpful assistant for ${appDisplayName} documentation.

Use only the provided documentation context to answer questions. If the answer is not in the docs, say "I couldn't find that in the ${appDisplayName} documentation" and offer next steps. Keep answers concise and include URLs when applicable.

Documentation Context:
${contextText}`
      },
      // Include conversation history (last N turns for context and tone continuity)
      ...messages.slice(-(HISTORY_TURNS * 2)).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];
    console.log(`💭 [CONVERSATION] Built ${conversationMessages.length} messages for OpenAI (${HISTORY_TURNS} turns + system)`);

    // 5) Call OpenAI with streaming
    console.log(`🤖 [OPENAI] Calling ${CHAT_MODEL} with streaming...`);
    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: conversationMessages,
      max_tokens: 500,
      temperature: 0.1,
      stream: true,
    });
    console.log('✅ [OPENAI] Stream started');

    // 6) Stream the response in Vercel AI SDK data stream format
    let fullContent = '';
    let chunkCount = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        chunkCount++;

        // Send text delta in data stream format: "0:"text"\n"
        const chunkData = `0:${JSON.stringify(delta)}\n`;
        res.write(chunkData);

        // Debug: Write chunk to file if DEBUG_CHUNKS is enabled
        writeDebugChunk(messageId, {
          chunkNumber: chunkCount,
          delta: delta,
          streamData: chunkData.trim()
        });
      }
    }

    console.log(`📨 [STREAM] Streamed ${chunkCount} chunks, total ${fullContent.length} characters`);

    // Debug: Log completion summary
    if (DEBUG_CHUNKS) {
      writeDebugChunk(messageId, {
        type: 'stream_complete',
        totalChunks: chunkCount,
        totalCharacters: fullContent.length,
        fullContent: fullContent,
        timestamp: new Date().toISOString()
      });
    }

    // 7) Send sources as data annotation with URL transformation
    if (relevantDocs.length > 0) {
      const sources = relevantDocs.map(d => {
        const transformedUrl = transformUrl(d.url);
        return {
          url: transformedUrl,
          path: transformedUrl,
          metadata: {
            title: d.title,
            id: d.id,
            app_name: d.app_name
          }
        };
      });

      // Send sources as message annotation (type 8 is for message annotations)
      res.write(`8:${JSON.stringify([{
        type: 'tool-invocation',
        toolInvocation: {
          toolName: 'search',
          result: sources
        }
      }])}\n`);

      const envInfo = LOCAL_DEV_URL ? `(transformed to ${LOCAL_DEV_URL})` : '(production URLs)';
      console.log(`📎 [SOURCES] Sent ${relevantDocs.length} sources ${envInfo}`);
    }

    // 8) Send finish event
    res.write(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`);
    res.end();
    console.log('✅ [COMPLETE] Response sent successfully\n');

  } catch (err) {
    console.error('\n❌❌❌ [FATAL ERROR] ❌❌❌');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Stack trace:', err.stack);

    // Try to send error if headers not sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
    }

    // Send error in Vercel AI SDK format
    const errorPayload = {
      error: err.message || 'Unknown error occurred'
    };
    res.write(`3:${JSON.stringify(errorPayload)}\n`);
    res.end();
    console.error('❌ [ERROR SENT] Error response sent to client\n');
  }
}
