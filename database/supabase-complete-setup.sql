-- Complete Supabase Setup for Multi-App Documentation RAG
-- This script will drop existing objects and recreate them with the correct schema

-- Step 1: Drop existing function (if exists)
DROP FUNCTION IF EXISTS match_documents(vector, float, int, text);
DROP FUNCTION IF EXISTS match_documents(vector, int, text);
DROP FUNCTION IF EXISTS match_documents_legacy(vector, int);

-- Step 2: Drop existing table (WARNING: This will delete all data!)
DROP TABLE IF EXISTS documents CASCADE;

-- Step 3: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 4: Create documents table with multi-app support
CREATE TABLE documents (
  id text PRIMARY KEY,
  title text,
  url text,
  content text,
  app_name text NOT NULL, -- App identifier (selecty, resell, general, lably, reactflow, discord-bots)
  created_at timestamptz DEFAULT now(),
  embedding vector(1536) -- dimension for text-embedding-3-small
);

-- Step 5: Create indexes for fast similarity search
CREATE INDEX documents_embedding_idx
  ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 6: Create index for app_name filtering (faster queries)
CREATE INDEX documents_app_name_idx
  ON documents(app_name);

-- Step 7: Add constraint to ensure valid app names
ALTER TABLE documents
  ADD CONSTRAINT valid_app_name
  CHECK (app_name IN ('selecty', 'resell', 'general', 'lably', 'reactflow', 'discord-bots'));

-- Step 8: Create match_documents function with optional app filtering
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_app text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  title text,
  url text,
  content text,
  app_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.url,
    documents.content,
    documents.app_name,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE
    -- Optional app_name filter
    (filter_app IS NULL OR documents.app_name = filter_app)
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 9: Grant execute permissions
GRANT EXECUTE ON FUNCTION match_documents TO authenticated, anon;

-- Step 10: Grant table permissions (adjust as needed for your RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated, anon;

-- Verification queries (uncomment to test after running):
-- SELECT COUNT(*) FROM documents;
-- SELECT DISTINCT app_name FROM documents;

-- Example function usage:
-- SELECT * FROM match_documents('[0.1, 0.2, ...]'::vector(1536), 5, 'resell');  -- Search only resell docs
-- SELECT * FROM match_documents('[0.1, 0.2, ...]'::vector(1536), 5, NULL);     -- Search all docs
-- SELECT * FROM match_documents('[0.1, 0.2, ...]'::vector(1536), 10);           -- Search all docs, return 10 results
