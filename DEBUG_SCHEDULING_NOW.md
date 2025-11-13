# Debug Calendar Scheduling - Right Now (No Redeploy Needed)

## The console.error is being printed, but you might have missed it. Here's how to find it:

### Step 1: Check Network Tab (Most Important)

This will show you the EXACT error without needing to redeploy:

1. Open your site: `https://www.bridgely.io/calendar`
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Network** tab
4. Click a date and try to schedule a keyword
5. Look for the request to `calendar/keywords` with method POST
6. Click on it
7. Go to **Response** tab
8. You'll see the exact error JSON

**Common errors you might see:**

```json
// Error 1: RLS Policy
{
  "error": "Failed to schedule keyword",
  "details": "row-level security policy for table discovered_keywords"
}

// Error 2: Missing column
{
  "error": "Failed to schedule keyword",
  "details": "column 'scheduled_date' does not exist"
}

// Error 3: Auth issue
{
  "error": "Unauthorized"
}
```

### Step 2: Check Console BEFORE the React Error

The React hydration error (#418) is at the top, but your scheduling error is BEFORE it:

1. In Console tab, scroll UP (older logs are above)
2. Look for messages like:
   ```
   ❌ Failed to schedule 1 keywords: Array(1)
   ```
3. Click the arrow to expand the Array and see the error

### Step 3: Check Vercel Function Logs

See what the server-side error is:

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Deployments** → latest deployment
4. Click **View Function Logs**
5. Filter by "POST /api/calendar/keywords"
6. Look for error messages

---

## Quick SQL Fix (Run if RLS Error)

If Network tab shows RLS error, run this in Supabase → SQL Editor:

```sql
-- Fix RLS policies for discovered_keywords
DROP POLICY IF EXISTS "Users can update their own keywords" ON discovered_keywords;
CREATE POLICY "Users can update their own keywords" 
ON discovered_keywords
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own keywords" ON discovered_keywords;
CREATE POLICY "Users can view their own keywords" 
ON discovered_keywords
FOR SELECT 
USING (auth.uid() = user_id);

-- Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'discovered_keywords';
```

---

## Quick Test: Verify Columns Exist

Run this in Supabase → SQL Editor:

```sql
-- Check if scheduling columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'discovered_keywords'
AND column_name IN (
  'scheduled_date',
  'scheduled_time',
  'scheduled_for_generation',
  'generation_status',
  'generated_content_id'
)
ORDER BY column_name;
```

**Expected result:** Should return 5 rows. If it returns 0, the columns are missing.

**If missing, run:**

```sql
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '06:00:00',
ADD COLUMN IF NOT EXISTS scheduled_for_generation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generated_content_id UUID REFERENCES content_writer_outputs(id) ON DELETE SET NULL;
```

---

## Quick Test: Verify You Can Update Keywords

Run this in Supabase → SQL Editor:

```sql
-- Test update permission (replace with your user_id and a real keyword_id)
UPDATE discovered_keywords
SET scheduled_for_generation = false
WHERE user_id = '8ab72df0-82b6-4d1b-b44f-d190c48636b5'  -- Your user_id from console logs
AND id = (
  SELECT id FROM discovered_keywords 
  WHERE user_id = '8ab72df0-82b6-4d1b-b44f-d190c48636b5' 
  LIMIT 1
)
RETURNING id, keyword, scheduled_for_generation;
```

**If this fails with RLS error:** Run the RLS fix above.

---

## Most Likely Issues (Based on Symptoms)

### Issue 1: RLS Policy Blocking Updates
**Symptom:** Network tab shows `row-level security policy` error
**Fix:** Run the RLS SQL above
**Why:** discovered_keywords table doesn't allow users to update their own rows

### Issue 2: Missing Columns
**Symptom:** Network tab shows `column does not exist` error
**Fix:** Run the column check and ALTER TABLE above
**Why:** Migration wasn't run in production

### Issue 3: Session Issue
**Symptom:** Network tab shows `Unauthorized` (401)
**Fix:** 
1. Log out: `https://www.bridgely.io/auth/signout`
2. Log back in
3. Try again
**Why:** Session expired or cookie issue

---

## What to Report

After checking Network tab, report:

1. **The exact error from Network → Response:**
   ```
   [Paste the JSON response here]
   ```

2. **Your user_id:**
   ```
   From console: "User authenticated: 8ab72df0-82b6-4d1b-b44f-d190c48636b5"
   ```

3. **Column check results:**
   ```
   [How many rows returned from the column check query]
   ```

4. **RLS policy results:**
   ```
   [Results from the RLS policy query]
   ```

---

## After You Fix It

Once you identify and fix the issue (RLS or columns), you can:

1. Redeploy to get the improved error messages in the alert
2. Or continue using Network tab for debugging

The improved version will show errors directly in the alert instead of requiring you to check console.

