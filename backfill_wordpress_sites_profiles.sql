-- Link existing WordPress sites to websites (onboarding profiles) by matching domains
-- Run this AFTER multiple_websites_migration.sql

-- 1) Preview matches: see which wordpress_sites will be linked to which onboarding profile
SELECT 
  ws.id AS wordpress_site_id,
  ws.name AS wordpress_site_name,
  ws.url AS wordpress_url,
  p.id AS profile_id,
  p.business_name AS website_name,
  p.website_url AS website_url
FROM wordpress_sites ws
LEFT JOIN user_onboarding_profiles p
  ON LOWER(REGEXP_REPLACE(split_part(ws.url, '://', 2), '^www\\.', '')) =
     LOWER(REGEXP_REPLACE(split_part(p.website_url, '://', 2), '^www\\.', ''))
WHERE ws.onboarding_profile_id IS NULL;

-- 2) Backfill onboarding_profile_id on wordpress_sites where there is a clear domain match
UPDATE wordpress_sites ws
SET onboarding_profile_id = p.id
FROM user_onboarding_profiles p
WHERE ws.onboarding_profile_id IS NULL
  AND LOWER(REGEXP_REPLACE(split_part(ws.url, '://', 2), '^www\\.', '')) =
      LOWER(REGEXP_REPLACE(split_part(p.website_url, '://', 2), '^www\\.', ''));


