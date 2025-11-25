-- Migration: Support Multiple Websites Per User & Link Blogs to Websites
-- This allows users to add multiple websites and post blogs to specific sites

-- ============================================================================
-- STEP 1: Remove UNIQUE constraint on user_onboarding_profiles to allow multiple websites
-- ============================================================================

-- Drop the unique constraint that prevents multiple websites per user
ALTER TABLE user_onboarding_profiles 
DROP CONSTRAINT IF EXISTS user_onboarding_profiles_user_id_key;

-- Add a unique constraint on (user_id, website_url) instead to prevent duplicates
-- but allow multiple different websites per user
ALTER TABLE user_onboarding_profiles
ADD CONSTRAINT user_onboarding_profiles_user_website_unique 
UNIQUE (user_id, website_url);

-- ============================================================================
-- STEP 2: Link WordPress sites to onboarding profiles (websites)
-- ============================================================================

-- Add onboarding_profile_id to wordpress_sites to link WordPress sites to specific websites/projects
ALTER TABLE wordpress_sites
ADD COLUMN IF NOT EXISTS onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_onboarding_profile 
ON wordpress_sites(onboarding_profile_id);

-- Add comment for documentation
COMMENT ON COLUMN wordpress_sites.onboarding_profile_id IS 
'Links WordPress site to a specific website/project from user_onboarding_profiles. NULL means site is not linked to a specific project.';

-- ============================================================================
-- STEP 3: Update publishing_logs to track which website/project content was posted to
-- ============================================================================

-- Add onboarding_profile_id to publishing_logs to track which website the content belongs to
ALTER TABLE publishing_logs
ADD COLUMN IF NOT EXISTS onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_publishing_logs_onboarding_profile 
ON publishing_logs(onboarding_profile_id);

-- Add comment for documentation
COMMENT ON COLUMN publishing_logs.onboarding_profile_id IS 
'Links published content to the specific website/project it was posted for.';

-- ============================================================================
-- STEP 4: Update content_writer_outputs to link content to specific websites
-- ============================================================================

-- Check if content_writer_outputs table exists, if not create it
CREATE TABLE IF NOT EXISTS content_writer_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  content_type TEXT,
  target_audience TEXT,
  tone TEXT,
  length TEXT,
  additional_context TEXT,
  content_output TEXT NOT NULL,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add onboarding_profile_id if it doesn't exist
ALTER TABLE content_writer_outputs
ADD COLUMN IF NOT EXISTS onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_writer_outputs_onboarding_profile 
ON content_writer_outputs(onboarding_profile_id);

CREATE INDEX IF NOT EXISTS idx_content_writer_outputs_user_id 
ON content_writer_outputs(user_id);

-- Add comment for documentation
COMMENT ON COLUMN content_writer_outputs.onboarding_profile_id IS 
'Links generated content to the specific website/project it was created for.';

-- ============================================================================
-- STEP 5: Update discovered_keywords to better support multiple websites
-- ============================================================================

-- Ensure the foreign key relationship exists (should already be there)
-- Add index if not exists for better performance when querying by profile
CREATE INDEX IF NOT EXISTS idx_discovered_keywords_onboarding_profile 
ON discovered_keywords(onboarding_profile_id);

-- ============================================================================
-- STEP 6: Add helper view for website management
-- ============================================================================

-- Create a view that shows all websites with their associated WordPress sites and keyword counts
CREATE OR REPLACE VIEW user_websites_summary AS
SELECT 
  p.id as profile_id,
  p.user_id,
  p.website_url,
  p.business_name,
  p.industry,
  p.onboarding_status,
  p.created_at as profile_created_at,
  COUNT(DISTINCT k.id) as total_keywords,
  COUNT(DISTINCT CASE WHEN k.opportunity_level = 'high' THEN k.id END) as high_opportunity_keywords,
  COUNT(DISTINCT CASE WHEN k.generation_status = 'generated' THEN k.id END) as generated_content_count,
  COUNT(DISTINCT ws.id) as wordpress_sites_count,
  COUNT(DISTINCT pl.id) as published_posts_count,
  MAX(pl.published_at) as last_published_at
FROM user_onboarding_profiles p
LEFT JOIN discovered_keywords k ON k.onboarding_profile_id = p.id
LEFT JOIN wordpress_sites ws ON ws.onboarding_profile_id = p.id AND ws.is_active = true
LEFT JOIN publishing_logs pl ON pl.onboarding_profile_id = p.id AND pl.status = 'published'
GROUP BY p.id, p.user_id, p.website_url, p.business_name, p.industry, p.onboarding_status, p.created_at;

-- Grant access to authenticated users
GRANT SELECT ON user_websites_summary TO authenticated;

-- ============================================================================
-- STEP 7: Update RLS policies to ensure proper access control
-- ============================================================================

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE user_onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_writer_outputs ENABLE ROW LEVEL SECURITY;

-- Update wordpress_sites policies to include onboarding_profile_id checks
-- (Policies should already exist, but ensure they're correct)

-- Update publishing_logs policies
-- (Policies should already exist, but ensure they're correct)

-- ============================================================================
-- STEP 8: Add function to get website stats
-- ============================================================================

-- Function to get comprehensive stats for a website/project
CREATE OR REPLACE FUNCTION get_website_stats(profile_uuid UUID)
RETURNS TABLE (
  total_keywords BIGINT,
  high_opportunity_keywords BIGINT,
  queued_keywords BIGINT,
  generated_content_count BIGINT,
  wordpress_sites_count BIGINT,
  published_posts_count BIGINT,
  last_published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT k.id)::BIGINT as total_keywords,
    COUNT(DISTINCT CASE WHEN k.opportunity_level = 'high' THEN k.id END)::BIGINT as high_opportunity_keywords,
    COUNT(DISTINCT CASE WHEN k.scheduled_for_generation = true THEN k.id END)::BIGINT as queued_keywords,
    COUNT(DISTINCT CASE WHEN k.generation_status = 'generated' THEN k.id END)::BIGINT as generated_content_count,
    COUNT(DISTINCT ws.id)::BIGINT as wordpress_sites_count,
    COUNT(DISTINCT pl.id)::BIGINT as published_posts_count,
    MAX(pl.published_at) as last_published_at
  FROM user_onboarding_profiles p
  LEFT JOIN discovered_keywords k ON k.onboarding_profile_id = p.id
  LEFT JOIN wordpress_sites ws ON ws.onboarding_profile_id = p.id AND ws.is_active = true
  LEFT JOIN publishing_logs pl ON pl.onboarding_profile_id = p.id AND pl.status = 'published'
  WHERE p.id = profile_uuid
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_website_stats(UUID) TO authenticated;

-- ============================================================================
-- STEP 9: Add trigger to update updated_at for wordpress_sites
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_wordpress_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trg_wordpress_sites_updated_at ON wordpress_sites;
CREATE TRIGGER trg_wordpress_sites_updated_at
BEFORE UPDATE ON wordpress_sites
FOR EACH ROW
EXECUTE FUNCTION update_wordpress_sites_updated_at();

-- ============================================================================
-- STEP 10: Add trigger to update updated_at for content_writer_outputs
-- ============================================================================

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trg_content_writer_outputs_updated_at ON content_writer_outputs;
CREATE TRIGGER trg_content_writer_outputs_updated_at
BEFORE UPDATE ON content_writer_outputs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- This migration enables:
-- 1. ✅ Multiple websites per user (removed UNIQUE constraint)
-- 2. ✅ Link WordPress sites to specific websites/projects
-- 3. ✅ Track which website content was posted to
-- 4. ✅ Link generated content to specific websites
-- 5. ✅ Helper views and functions for website management
-- 6. ✅ Proper indexing for performance

-- After running this migration:
-- - Users can add multiple websites using "Quick Add Website"
-- - Each website gets its own onboarding_profile_id
-- - WordPress sites can be linked to specific websites
-- - Content generation and publishing is tracked per website
-- - Use the user_websites_summary view to see all websites with stats

