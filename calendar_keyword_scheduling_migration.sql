-- Migration for Calendar-Based Keyword Scheduling Feature
-- This adds the ability to schedule keywords for automatic content generation

-- Add new columns to discovered_keywords table
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '06:00:00',
ADD COLUMN IF NOT EXISTS scheduled_for_generation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generated_content_id UUID REFERENCES content_writer_outputs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for generation_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'discovered_keywords_generation_status_check'
  ) THEN
    ALTER TABLE discovered_keywords
    ADD CONSTRAINT discovered_keywords_generation_status_check
    CHECK (generation_status IN ('pending', 'generating', 'generated', 'failed'));
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_keywords_scheduled_date ON discovered_keywords(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_keywords_generation_status ON discovered_keywords(generation_status);
CREATE INDEX IF NOT EXISTS idx_keywords_scheduled_for_gen ON discovered_keywords(scheduled_for_generation) WHERE scheduled_for_generation = TRUE;

-- Update the updated_at trigger to handle these new columns (if not already done)
CREATE OR REPLACE FUNCTION update_discovered_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_discovered_keywords_updated_at ON discovered_keywords;
CREATE TRIGGER update_discovered_keywords_updated_at
BEFORE UPDATE ON discovered_keywords
FOR EACH ROW
EXECUTE FUNCTION update_discovered_keywords_updated_at();

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'discovered_keywords'
AND column_name IN ('scheduled_date', 'scheduled_for_generation', 'generation_status', 'generated_content_id', 'generated_at')
ORDER BY ordinal_position;

