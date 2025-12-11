// sync-docs.js
// usage: node sync-docs.js
import fs from "fs/promises";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REPO_RAW_BASE = process.env.REPO_RAW_BASE; // e.g., https://raw.githubusercontent.com/<org>/<repo>/main/docs/
const MINTLIFY_BASE_URL = process.env.MINTLIFY_BASE_URL; // e.g., https://acme-80ce2022.mintlify.app

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !REPO_RAW_BASE || !MINTLIFY_BASE_URL) {
  console.error("Set OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REPO_RAW_BASE, MINTLIFY_BASE_URL in .env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function listMarkdownFiles() {
  // Option A: If you know your docs list (common for Mintlify), list them here.
  // Option B: Use GitHub API to list tree -> for brevity we'll read a local file "files.txt" or env list.
  // We'll try REPO_INDEX_URL env (a plain list), else errors. You can also manually supply file paths.
  const indexUrl = process.env.REPO_INDEX_URL;
  if (!indexUrl) {
    throw new Error("Set REPO_INDEX_URL to a URL that lists relative doc paths (one per line) OR edit this script.");
  }
  const res = await fetch(indexUrl);
  const txt = await res.text();
  return txt.split("\n").map(s => s.trim()).filter(Boolean);
}

function transformToMintlifyUrl(relPath, mintlifyBase) {
  // Remove 'docs/' prefix and '.mdx' extension
  let urlPath = relPath.replace(/^docs\//, '').replace(/\.mdx$/, '');

  // Handle index pages for each app
  if (urlPath === 'selecty/index') {
    return `${mintlifyBase}/selecty`;
  }
  if (urlPath === 'resell/index') {
    return `${mintlifyBase}/resell`;
  }
  if (urlPath === 'general/index') {
    return `${mintlifyBase}/general`;
  }

  // Construct Mintlify URL
  return `${mintlifyBase}/${urlPath}`;
}

function extractAppName(relPath) {
  // Extract app name from path: docs/selecty/... -> "selecty"
  const match = relPath.match(/^docs\/([^/]+)\//);
  if (match) {
    return match[1]; // Returns: selecty, resell, or general
  }
  return 'unknown';
}

function createMarkdownSplitter() {
  return RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: 1200,
    chunkOverlap: 200,
  });
}

async function embedTexts(texts) {
  // Batch embedding via OpenAI
  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  // resp.data is array of embeddings
  return resp.data.map(d => d.embedding);
}

async function upsertChunk(id, title, url, content, embedding, appName) {
  const { data, error } = await supabase
    .from("documents")
    .upsert(
      { id, title, url, content, embedding, app_name: appName },
      { onConflict: "id" }
    );
  if (error) throw error;
  return data;
}

async function main() {
  const files = await listMarkdownFiles();
  console.log(`Found ${files.length} files`);

  const splitter = createMarkdownSplitter();
  let totalChunks = 0;

  for (const relPath of files) {
    const rawUrl = REPO_RAW_BASE + relPath;
    console.log("Fetching", rawUrl);
    const r = await fetch(rawUrl);
    if (!r.ok) {
      console.warn("Failed to fetch", rawUrl, r.status);
      continue;
    }
    const mdContent = await r.text();
    const title = path.basename(relPath, '.mdx');
    const mintlifyUrl = transformToMintlifyUrl(relPath, MINTLIFY_BASE_URL);
    const appName = extractAppName(relPath); // Extract app name from path

    // Create LangChain Document with metadata
    const doc = new Document({
      pageContent: mdContent,
      metadata: {
        source: mintlifyUrl,
        title: title,
        filePath: relPath,
        appName: appName
      }
    });

    // Split document using markdown-aware splitter
    const chunks = await splitter.splitDocuments([doc]);
    console.log(`  → Split into ${chunks.length} chunks (App: ${appName}, Mintlify URL: ${mintlifyUrl})`);

    // Extract text content and create embeddings
    const chunkTexts = chunks.map(chunk => chunk.pageContent);
    const embeddings = await embedTexts(chunkTexts);

    // Upsert each chunk with metadata including app name
    for (let i = 0; i < chunks.length; i++) {
      const id = `${relPath}--chunk-${i}`;
      await upsertChunk(id, title, mintlifyUrl, chunks[i].pageContent, embeddings[i], appName);
      console.log(`  ✓ Upserted ${id} [${appName}]`);
    }

    totalChunks += chunks.length;
  }

  console.log(`\n✅ Done! Processed ${files.length} files into ${totalChunks} chunks (avg ${(totalChunks / files.length).toFixed(1)} chunks/file)`);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
