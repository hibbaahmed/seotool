-- Migration: Add wpcom_account_email column to wordpress_sites table
-- This allows tracking which WordPress.com account email was used for each connection
-- Run this in your Supabase SQL editor

ALTER TABLE wordpress_sites 
ADD COLUMN IF NOT EXISTS wpcom_account_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN wordpress_sites.wpcom_account_email IS 'WordPress.com account email used for OAuth connection (only for wpcom provider)';

-- Add index for faster lookups by account email
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_wpcom_account_email ON wordpress_sites(wpcom_account_email) WHERE wpcom_account_email IS NOT NULL;

