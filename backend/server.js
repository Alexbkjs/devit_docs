// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EMB_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini"; // or "gpt-4o" / "gpt-4o-mini" / change as you like
const TOP_K = 5;
const MINTLIFY_BASE_URL = process.env.MINTLIFY_BASE_URL || 'https://devit-c039f40a.mintlify.app';
const LOCAL_DEV_URL = process.env.LOCAL_DEV_URL; // Optional: Transform URLs for local dev
const DEBUG_CHUNKS = process.env.DEBUG_CHUNKS === 'true'; // Debug flag: set to 'true' to enable chunk logging

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

app.post("/api/chat", async (req, res) => {
  console.log('\n📨 [REQUEST] New chat request received');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { messages, app_name } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ [ERROR] No messages array provided');
      return res.status(400).json({ error: "No messages array provided" });
    }

    // Validate and default app_name
    const validApps = ['selecty', 'resell', 'general'];
    const appName = validApps.includes(app_name) ? app_name : null;

    console.log(`💬 [MESSAGES] Received ${messages.length} messages`);
    if (appName) {
      console.log(`📱 [APP] Context: ${appName}`);
    } else {
      console.log(`📱 [APP] Context: all apps (no filter)`);
    }

    // Get the latest user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      console.error('❌ [ERROR] No user message found');
      return res.status(400).json({ error: "No user message found" });
    }

    const question = lastUserMessage.content;
    console.log(`❓ [QUESTION] "${question}"`);

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
        question: question,
        app_name: appName,
        timestamp: new Date().toISOString()
      });
    }

    // 1) Create embedding for the question
    console.log('🔄 [EMBEDDING] Creating embedding...');
    const embResp = await openai.embeddings.create({
      model: EMB_MODEL,
      input: question,
    });
    const qEmbedding = embResp.data[0].embedding;
    console.log(`✅ [EMBEDDING] Created (dimension: ${qEmbedding.length})`);

    // 2) Fetch top-K docs from Supabase via RPC with optional app filter
    const searchContext = appName ? `in ${appName}` : 'across all apps';
    console.log(`🔍 [SEARCH] Searching for top ${TOP_K} documents ${searchContext}...`);
    const { data: docs, error } = await supabase
      .rpc("match_documents", {
        query_embedding: qEmbedding,
        match_count: TOP_K,
        filter_app: appName  // NULL if no app specified
      });
    if (error) {
      console.error('❌ [SEARCH ERROR]', error);
      throw error;
    }
    console.log(`✅ [SEARCH] Found ${docs?.length || 0} documents`);

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

    // 3) Build the context
    const contextText = docs.map((d) =>
      `---\nTitle: ${d.title}\nURL: ${d.url}\n\n${d.content}\n`
    ).join("\n");
    console.log(`📄 [CONTEXT] Built context from ${docs.length} documents`);

    // 4) Build conversation history for OpenAI with app context
    const appDisplayName = appName ? {
      selecty: 'Selecty',
      resell: 'ReSell',
      general: 'DevIT.Software'
    }[appName] : 'DevIT.Software';

    const conversationMessages = [
      {
        role: "system",
        content: `You are a helpful assistant for ${appDisplayName} documentation.

Use only the provided documentation context to answer questions. If the answer is not in the docs, say "I couldn't find that in the ${appDisplayName} documentation" and offer next steps. Keep answers concise and include URLs when applicable.

Documentation Context:
${contextText}`
      },
      // Include previous conversation history (last 5 messages for context)
      ...messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];
    console.log(`💭 [CONVERSATION] Built ${conversationMessages.length} messages for OpenAI`);

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
    if (docs.length > 0) {
      const sources = docs.map(d => {
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
      console.log(`📎 [SOURCES] Sent ${docs.length} sources ${envInfo}`);
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
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.log("RAG server listening on", port));
