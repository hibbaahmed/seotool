-- Migration to add starred column to discovered_keywords table
-- This allows users to mark keywords as favorites/starred

ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;

-- Create index for better query performance when filtering starred keywords
CREATE INDEX IF NOT EXISTS idx_discovered_keywords_starred ON discovered_keywords(starred) WHERE starred = TRUE;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'discovered_keywords'
AND column_name = 'starred';

