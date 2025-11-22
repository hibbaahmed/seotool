-- Migration: Add trial_ends_at column to credits table
-- This column tracks when a user's trial period ends, allowing unlimited usage during trial

-- Add trial_ends_at column (nullable timestamp)
ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN credits.trial_ends_at IS 'Timestamp when the trial period ends. Users have unlimited usage (credits not deducted) while current time is before this date.';

-- Create index for efficient queries (checking if user is in trial)
CREATE INDEX IF NOT EXISTS idx_credits_trial_ends_at ON credits(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

