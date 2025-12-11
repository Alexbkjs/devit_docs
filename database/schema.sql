-- Enable pgvector extension
create extension if not exists vector;

-- Documents table with multi-app support
create table if not exists documents (
  id text primary key,
  title text,
  url text,
  content text,
  app_name text not null, -- NEW: App identifier (selecty, resell, general, etc.)
  created_at timestamptz default now(),
  embedding vector(1536) -- dimension for text-embedding-3-small
);

-- Index for fast similarity search
create index if not exists documents_embedding_idx
  on documents
  using ivfflat (embedding vector_l2_ops)
  with (lists = 100);

-- NEW: Index for app_name filtering (faster queries)
create index if not exists documents_app_name_idx
  on documents(app_name);

-- Optional: Add constraint to ensure valid app names
alter table documents
  add constraint valid_app_name
  check (app_name in ('selecty', 'resell', 'general')); -- MAKE SURE to update this list as needed

-- Updated: App-filtered similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_app text
)
returns table (
  id text,
  content text,
  url text,
  title text,
  app_name text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.url,
    documents.title,
    documents.app_name,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where
    documents.app_name = filter_app
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Legacy function for backward compatibility (searches all apps)
create or replace function match_documents_legacy(
  query_embedding vector(1536),
  k int
)
returns setof documents as $$
  select * from documents
  order by embedding <-> query_embedding
  limit k;
$$ language sql stable;
