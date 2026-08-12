-- ============================================================
-- Remove Discord Bots / Email Bot / Telegram Bot from the vector store
-- ============================================================
-- Run this in the Supabase SQL Editor after the docs/discord-bots,
-- docs/email and docs/telegram folders have been deleted from the repo.
--
-- Order matters: delete the rows first, then tighten the constraint.
-- Tightening first would fail because existing rows still violate it.
-- ============================================================

-- Step 1: See what will be deleted (run this first, review the counts)
SELECT app_name, count(*) AS chunks
FROM documents
WHERE app_name IN ('discord-bots', 'email', 'telegram')
GROUP BY app_name;

-- Step 2: Delete the chunks for the removed apps
DELETE FROM documents
WHERE app_name IN ('discord-bots', 'email', 'telegram');

-- Step 3: Delete any stragglers by id / url.
-- Chunk ids look like 'docs/email/index.mdx--chunk-0', so a path prefix match
-- catches rows written by older script versions that used a different app_name.
DELETE FROM documents
WHERE id LIKE 'docs/discord-bots/%'
   OR id LIKE 'docs/email/%'
   OR id LIKE 'docs/telegram/%'
   OR url LIKE '%/discord-bots%'
   OR url LIKE '%/email%'
   OR url LIKE '%/telegram%';

-- Step 4: Tighten the valid app name constraint
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS valid_app_name;

ALTER TABLE documents
  ADD CONSTRAINT valid_app_name
  CHECK (app_name IN ('selecty', 'resell', 'general', 'lably', 'reactflow'));

-- Step 5: Verify — this should list only the five remaining apps
SELECT app_name, count(*) AS chunks
FROM documents
GROUP BY app_name
ORDER BY app_name;
