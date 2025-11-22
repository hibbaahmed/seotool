-- Migration: Remove trial_ends_at column from credits table
-- This column has been moved to the subscription table where it belongs architecturally

-- Remove trial_ends_at column from credits table (if it exists)
ALTER TABLE credits 
DROP COLUMN IF EXISTS trial_ends_at;

-- Drop the index on credits table if it exists
DROP INDEX IF EXISTS idx_credits_trial_ends_at;

