-- Remove the bottom 3 RLS policies from the subscription table
-- This will keep only: "Enable read for users based on email"

-- Remove: "Service role can insert and update subscriptions"
DROP POLICY IF EXISTS "Service role can insert and update subscriptions" ON public.subscription;

-- Remove: "Service role can view all subscriptions"
DROP POLICY IF EXISTS "Service role can view all subscriptions" ON public.subscription;

-- Remove: "Users can view own subscription"
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscription;

