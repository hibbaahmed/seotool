-- ============================================================================
-- Add onboarding_profile_id to scheduled_posts for website separation
-- ============================================================================

-- Add the onboarding_profile_id column to scheduled_posts
ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_onboarding_profile 
ON scheduled_posts(onboarding_profile_id);

-- Add comment for documentation
COMMENT ON COLUMN scheduled_posts.onboarding_profile_id IS 
'Links scheduled posts to the specific website/project they belong to. Posts inherit this from their content_writer_outputs.';

-- Backfill existing posts by linking them to their content's onboarding_profile_id
UPDATE scheduled_posts sp
SET onboarding_profile_id = cwo.onboarding_profile_id
FROM content_writer_outputs cwo
WHERE sp.content_id = cwo.id
  AND sp.onboarding_profile_id IS NULL
  AND cwo.onboarding_profile_id IS NOT NULL;

