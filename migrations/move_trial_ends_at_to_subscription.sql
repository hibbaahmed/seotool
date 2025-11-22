-- Migration: Move trial_ends_at from credits table to subscription table
-- This makes more architectural sense as trial status is a subscription property

-- Step 1: Add trial_ends_at column to subscription table
ALTER TABLE subscription 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN subscription.trial_ends_at IS 'Timestamp when the trial period ends. Users have unlimited usage (credits not deducted) while current time is before this date.';

-- Create index for efficient queries (checking if subscription is in trial)
CREATE INDEX IF NOT EXISTS idx_subscription_trial_ends_at ON subscription(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- Step 2: Remove trial_ends_at column from credits table (if it exists)
ALTER TABLE credits 
DROP COLUMN IF EXISTS trial_ends_at;

-- Step 3: Drop the index on credits table if it exists
DROP INDEX IF EXISTS idx_credits_trial_ends_at;

