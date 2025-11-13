-- Fix calendar scheduling issues

-- 1. Ensure the discovered_keywords table has all required columns
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '06:00:00',
ADD COLUMN IF NOT EXISTS scheduled_for_generation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generated_content_id UUID REFERENCES content_writer_outputs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE;

-- 2. Ensure RLS policies allow updates
-- Drop and recreate update policy for discovered_keywords
DROP POLICY IF EXISTS "Users can update their own keywords" ON discovered_keywords;
CREATE POLICY "Users can update their own keywords" 
ON discovered_keywords
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Ensure select policy exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discovered_keywords' 
    AND policyname = 'Users can view their own keywords'
  ) THEN
    CREATE POLICY "Users can view their own keywords" 
    ON discovered_keywords
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_keywords_scheduled_date ON discovered_keywords(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_keywords_generation_status ON discovered_keywords(generation_status);
CREATE INDEX IF NOT EXISTS idx_keywords_scheduled_for_gen ON discovered_keywords(scheduled_for_generation) WHERE scheduled_for_generation = TRUE;

-- 4. Add constraint for generation_status
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

-- 5. Test query to check what's currently scheduled
SELECT 
  id,
  keyword,
  scheduled_date,
  scheduled_for_generation,
  generation_status,
  created_at
FROM discovered_keywords
WHERE scheduled_for_generation = true
ORDER BY scheduled_date;
