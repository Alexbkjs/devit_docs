// add-folder.js
// Usage: node add-folder.js <folder-path>
// Example: node add-folder.js docs/resell
// Or set FOLDER env var: FOLDER="docs/resell" node add-folder.js

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
const REPO_RAW_BASE = process.env.REPO_RAW_BASE;
const MINTLIFY_BASE_URL = process.env.MINTLIFY_BASE_URL;

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !REPO_RAW_BASE || !MINTLIFY_BASE_URL) {
  console.error("Missing required environment variables:");
  console.error("   Set OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REPO_RAW_BASE, MINTLIFY_BASE_URL in .env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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
  if (urlPath === 'lably/index') {
    return `${mintlifyBase}/lably`;
  }
  if (urlPath === 'reactflow/index') {
    return `${mintlifyBase}/reactflow`;
  }
  if (urlPath === 'discord-bots/index') {
    return `${mintlifyBase}/discord-bots`;
  }
  if (urlPath === 'email/index') {
    return `${mintlifyBase}/email`;
  }
  if (urlPath === 'telegram/index') {
    return `${mintlifyBase}/telegram`;
  }

  // Construct Mintlify URL
  return `${mintlifyBase}/${urlPath}`;
}

function extractAppName(relPath) {
  // Extract app name from path: docs/selecty/... -> "selecty"
  const match = relPath.match(/^docs\/([^/]+)\//);
  if (match) {
    const appName = match[1];

    // Map email and telegram to discord-bots
    if (appName === 'email' || appName === 'telegram') {
      return 'discord-bots';
    }

    return appName; // selecty, resell, general, lably, reactflow, discord-bots
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

async function deleteExistingChunks(relPath) {
  // Delete all existing chunks for this file
  const pattern = `${relPath}--chunk-%`;
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .like('id', pattern);

  if (error) {
    console.warn(`   Warning: Could not delete existing chunks for ${relPath}:`, error.message);
  } else {
    console.log(`   Deleted existing chunks for ${relPath}`);
  }
}

async function readLocalFile(relPath) {
  // Try to read from local filesystem
  // Assume we're running from /backend, so go up one level to find docs
  const localPath = path.join(process.cwd(), '..', relPath);
  try {
    const content = await fs.readFile(localPath, 'utf8');
    return { content, source: 'local' };
  } catch (err) {
    return null;
  }
}

async function readRemoteFile(relPath) {
  // Fetch from GitHub
  const rawUrl = REPO_RAW_BASE + relPath;
  const r = await fetch(rawUrl);
  if (!r.ok) {
    throw new Error(`Failed to fetch ${rawUrl} (status: ${r.status})`);
  }
  const content = await r.text();
  return { content, source: 'remote' };
}

async function processFile(relPath) {
  console.log(`\n Processing: ${relPath}`);

  // Try local first, then remote
  let mdContent;

  const localResult = await readLocalFile(relPath);
  if (localResult) {
    mdContent = localResult.content;
    console.log(`   Reading from: local filesystem`);
  } else {
    console.log(`   File not found locally, fetching from GitHub...`);
    const remoteResult = await readRemoteFile(relPath);
    mdContent = remoteResult.content;
    console.log(`   Fetched from: ${REPO_RAW_BASE + relPath}`);
  }
  const title = path.basename(relPath, '.mdx');
  const mintlifyUrl = transformToMintlifyUrl(relPath, MINTLIFY_BASE_URL);
  const appName = extractAppName(relPath);

  // Delete existing chunks for this file first
  await deleteExistingChunks(relPath);

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
  const splitter = createMarkdownSplitter();
  const chunks = await splitter.splitDocuments([doc]);
  console.log(`   Split into ${chunks.length} chunks`);
  console.log(`   App: ${appName}`);
  console.log(`   Mintlify URL: ${mintlifyUrl}`);

  // Extract text content and create embeddings
  const chunkTexts = chunks.map(chunk => chunk.pageContent);
  console.log(`   Creating embeddings...`);
  const embeddings = await embedTexts(chunkTexts);

  // Upsert each chunk with metadata
  for (let i = 0; i < chunks.length; i++) {
    const id = `${relPath}--chunk-${i}`;
    await upsertChunk(id, title, mintlifyUrl, chunks[i].pageContent, embeddings[i], appName);
    console.log(`   Upserted chunk ${i + 1}/${chunks.length}: ${id}`);
  }

  return chunks.length;
}

async function findMdxFiles(folderPath) {
  const results = [];

  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        // Convert absolute path to relative path starting with 'docs/'
        const relativePath = fullPath.replace(/\\/g, '/');
        results.push(relativePath);
      }
    }
  }

  await scanDir(folderPath);
  return results.sort();
}

async function main() {
  console.log("Add Folder to Vector Store\n");

  // Get folder path from command line args or FOLDER env var
  let folderPath = process.argv[2];

  if (!folderPath) {
    // Try to get from FOLDER env var
    folderPath = process.env.FOLDER;
  }

  if (!folderPath) {
    console.error("No folder specified!");
    console.error("\nUsage:");
    console.error("  node add-folder.js <folder-path>");
    console.error("\nExample:");
    console.error("  node add-folder.js docs/resell");
    console.error("  node add-folder.js docs/selecty/features");
    console.error("\nOr use FOLDER env var:");
    console.error('  FOLDER="docs/resell" node add-folder.js');
    process.exit(1);
  }

  // Normalize folder path (remove trailing slashes)
  folderPath = folderPath.replace(/\/+$/, '');

  // Resolve to absolute path relative to parent directory (project root)
  const absoluteFolderPath = path.resolve(process.cwd(), '..', folderPath);

  console.log(`Scanning folder: ${folderPath}`);
  console.log(`Absolute path: ${absoluteFolderPath}\n`);

  // Check if folder exists
  try {
    const stat = await fs.stat(absoluteFolderPath);
    if (!stat.isDirectory()) {
      console.error(`Error: ${folderPath} is not a directory`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: Folder not found: ${absoluteFolderPath}`);
    process.exit(1);
  }

  // Find all MDX files in the folder
  const mdxFiles = await findMdxFiles(absoluteFolderPath);

  if (mdxFiles.length === 0) {
    console.error(`No .mdx files found in ${folderPath}`);
    process.exit(1);
  }

  // Convert absolute paths back to relative paths starting with 'docs/'
  const relativeFiles = mdxFiles.map(file => {
    const projectRoot = path.resolve(process.cwd(), '..');
    return path.relative(projectRoot, file).replace(/\\/g, '/');
  });

  console.log(`Found ${relativeFiles.length} MDX files:\n`);
  relativeFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  console.log("\n" + "=".repeat(60));
  console.log("Starting processing...");
  console.log("=".repeat(60));

  let totalChunks = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const filePath of relativeFiles) {
    try {
      const chunks = await processFile(filePath);
      totalChunks += chunks;
      successCount++;
    } catch (err) {
      console.error(`\nError processing ${filePath}:`, err.message);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Done!\n");
  console.log(`Summary:`);
  console.log(`   Folder: ${folderPath}`);
  console.log(`   Files processed: ${successCount}/${relativeFiles.length}`);
  console.log(`   Total chunks added/updated: ${totalChunks}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  console.log("=".repeat(60));
}

main().catch(err => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
