-- Migration: Add OAuth support to wordpress_sites table
-- Run this in your Supabase SQL editor

-- Add new columns for OAuth support
ALTER TABLE wordpress_sites 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'self_hosted' CHECK (provider IN ('self_hosted', 'wpcom')),
ADD COLUMN IF NOT EXISTS site_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Make username and password nullable (they're not needed for OAuth)
ALTER TABLE wordpress_sites 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_provider ON wordpress_sites(provider);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_user_provider ON wordpress_sites(user_id, provider);

-- Add comment for documentation
COMMENT ON COLUMN wordpress_sites.provider IS 'Type of WordPress: self_hosted (WordPress.org) or wpcom (WordPress.com)';
COMMENT ON COLUMN wordpress_sites.site_id IS 'WordPress.com site ID (only for wpcom provider)';
COMMENT ON COLUMN wordpress_sites.access_token IS 'OAuth access token (encrypted, only for wpcom provider)';
COMMENT ON COLUMN wordpress_sites.refresh_token IS 'OAuth refresh token (encrypted, only for wpcom provider)';
COMMENT ON COLUMN wordpress_sites.token_expires_at IS 'When the access token expires (only for wpcom provider)';




