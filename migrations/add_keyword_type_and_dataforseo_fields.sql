-- Migration to add keyword type classification and DataForSEO enrichment fields
-- This enables primary, secondary, and long-tail keyword classification

-- Add keyword_type column
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS keyword_type TEXT CHECK (keyword_type IN ('primary', 'secondary', 'long-tail'));

-- Add monthly trends data
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS monthly_trends JSONB DEFAULT '[]';

-- Add parent_keyword_id for tracking keyword relationships
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS parent_keyword_id UUID REFERENCES discovered_keywords(id) ON DELETE SET NULL;

-- Add dataforseo_data for storing raw API response
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS dataforseo_data JSONB;

-- Add last_updated timestamp for keyword data freshness
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS keyword_data_updated_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_keywords_type ON discovered_keywords(keyword_type);
CREATE INDEX IF NOT EXISTS idx_keywords_parent ON discovered_keywords(parent_keyword_id);
CREATE INDEX IF NOT EXISTS idx_keywords_data_updated ON discovered_keywords(keyword_data_updated_at);

-- Create a view for keyword groups (primary with their secondary/long-tail variants)
CREATE OR REPLACE VIEW keyword_groups AS
SELECT 
  parent.id as primary_keyword_id,
  parent.keyword as primary_keyword,
  parent.search_volume as primary_search_volume,
  parent.difficulty_score as primary_difficulty,
  COUNT(CASE WHEN child.keyword_type = 'secondary' THEN 1 END) as secondary_count,
  COUNT(CASE WHEN child.keyword_type = 'long-tail' THEN 1 END) as longtail_count,
  ARRAY_AGG(DISTINCT child.keyword) FILTER (WHERE child.keyword_type = 'secondary') as secondary_keywords,
  ARRAY_AGG(DISTINCT child.keyword) FILTER (WHERE child.keyword_type = 'long-tail') as longtail_keywords
FROM discovered_keywords parent
LEFT JOIN discovered_keywords child ON child.parent_keyword_id = parent.id
WHERE parent.keyword_type = 'primary' OR parent.keyword_type IS NULL
GROUP BY parent.id, parent.keyword, parent.search_volume, parent.difficulty_score;

-- Add comment explaining the schema
COMMENT ON COLUMN discovered_keywords.keyword_type IS 'Classification: primary (main target), secondary (related high-volume), long-tail (specific queries)';
COMMENT ON COLUMN discovered_keywords.monthly_trends IS 'Array of {month: string, volume: number} objects from DataForSEO';
COMMENT ON COLUMN discovered_keywords.parent_keyword_id IS 'Links secondary/long-tail keywords to their primary keyword';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'discovered_keywords'
AND column_name IN ('keyword_type', 'monthly_trends', 'parent_keyword_id', 'dataforseo_data', 'keyword_data_updated_at')
ORDER BY ordinal_position;

