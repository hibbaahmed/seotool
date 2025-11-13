# Fix Production Issues - Calendar Scheduling & Blog Generation

## Issue 1: ❌ Calendar Scheduling Fails in Production

### Error Message
```
Scheduled 0 keywords successfully, but 1 failed. Check console for details.
```

### Root Causes & Fixes

#### A. Invalid `.env` Format (CRITICAL)

**Your current .env has a syntax error:**
```env
NEXT_PUBLIC_URL=
https://www.bridgely.io 
```

**Problem:** The newline after `=` makes the variable empty/invalid.

**Fix:** Remove the newline - put the URL on the same line:
```env
NEXT_PUBLIC_URL=https://www.bridgely.io
```

Also remove any trailing spaces.

#### B. Check Browser Console for Specific Error

The error "Scheduled 0 keywords successfully, but 1 failed" is coming from the frontend. **You need to check your browser's DevTools console** to see the actual error.

**How to debug:**
1. Open your production site: `https://www.bridgely.io/calendar`
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Try scheduling a keyword
5. Look for error messages like:
   ```
   ❌ Failed to schedule 1 keywords:
   Keyword xxx-xxx-xxx: Unauthorized
   ```
   or
   ```
   Keyword xxx-xxx-xxx: Failed to schedule keyword
   ```

#### C. Most Common Production Issues

**1. RLS Policy Blocking Updates**

If you see `"row-level security policy"` error in console:

**Solution:** Run this SQL in Supabase:
```sql
-- Allow users to update their own keywords
DROP POLICY IF EXISTS "Users can update their own keywords" ON discovered_keywords;
CREATE POLICY "Users can update their own keywords" 
ON discovered_keywords
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own keywords
DROP POLICY IF EXISTS "Users can view their own keywords" ON discovered_keywords;
CREATE POLICY "Users can view their own keywords" 
ON discovered_keywords
FOR SELECT 
USING (auth.uid() = user_id);
```

**2. Missing Calendar Columns**

If you see `"column does not exist"` error:

**Solution:** Run this SQL in Supabase:
```sql
-- Add scheduling columns
ALTER TABLE discovered_keywords
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '06:00:00',
ADD COLUMN IF NOT EXISTS scheduled_for_generation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generated_content_id UUID REFERENCES content_writer_outputs(id) ON DELETE SET NULL;

-- Add constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'discovered_keywords_generation_status_check'
  ) THEN
    ALTER TABLE discovered_keywords
    ADD CONSTRAINT discovered_keywords_generation_status_check
    CHECK (generation_status IN ('pending', 'generating', 'generated', 'failed'));
  END IF;
END $$;
```

**3. Session/Auth Issue**

If you're not logged in properly or session expired:
- Log out and log back in
- Check that cookies are allowed for your domain
- Check Supabase auth settings (enable email auth, etc.)

---

## Issue 2: ❌ Blog Generation Works Localhost, Not Production

### Common Causes

#### A. Missing Environment Variables

**Check these are set in Vercel:**
```bash
# Required for generation
ANTHROPIC_API_KEY=sk-ant-...  # Must have credits!
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role, NOT anon key
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Optional but recommended
TAVILY_API_KEY=tvly-...  # For image search
YOUTUBE_API_KEY=...  # For video embeds
DATA_FOR_SEO_KEY=...  # For keyword research
```

**How to verify in Vercel:**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Check each variable is present and non-empty
3. Redeploy if you add/change any

#### B. Inngest Not Reachable (Vercel Protection)

If Inngest can't reach your `/api/inngest` endpoint:

**Solution:**
1. Get your Vercel Protection Bypass token:
   - Vercel → Project → Settings → Protection
   - Copy the bypass secret (or generate if not present)

2. Update Inngest SDK URL:
   - Inngest Dashboard → Apps → blog-scheduler
   - Set URL to: `https://bridgely.io/api/inngest?x-vercel-protection-bypass=YOUR_TOKEN`
   - Click "Resync app"

#### C. Anthropic API Credits

If you see "credit balance too low" in Inngest logs:
- Add credits at [Anthropic Console](https://console.anthropic.com/)
- $20 = ~70-130 blog posts
- Credits are available immediately

#### D. Wrong Base URL

If internal API calls fail:

**Solution:** In your `.env` or Vercel Environment Variables:
```env
NEXT_PUBLIC_URL=https://www.bridgely.io
# or
NEXT_PUBLIC_BASE_URL=https://www.bridgely.io
```

**DO NOT** use:
```env
# ❌ BAD - has newline
NEXT_PUBLIC_URL=
https://www.bridgely.io

# ❌ BAD - trailing spaces
NEXT_PUBLIC_URL=https://www.bridgely.io 

# ❌ BAD - missing https://
NEXT_PUBLIC_URL=www.bridgely.io
```

---

## Quick Diagnostic Checklist

### Step 1: Fix `.env` Format
- [ ] Remove newlines from environment variables
- [ ] Remove trailing spaces
- [ ] Ensure URLs start with `https://` or `http://`

### Step 2: Check Browser Console
- [ ] Open DevTools → Console
- [ ] Try scheduling a keyword
- [ ] Copy the exact error message

### Step 3: Verify Database Schema
- [ ] Run SQL migrations in Supabase (see above)
- [ ] Check RLS policies allow user updates

### Step 4: Check Inngest
- [ ] Verify SDK URL in Inngest dashboard
- [ ] Add Vercel bypass token if using Protection
- [ ] Check Inngest runs for detailed errors

### Step 5: Verify Environment Variables
- [ ] All required vars set in Vercel
- [ ] Anthropic API has credits
- [ ] SUPABASE_SERVICE_ROLE_KEY is service role (not anon)

### Step 6: Test End-to-End
- [ ] Schedule a keyword from calendar
- [ ] Check browser console for errors
- [ ] Check Inngest dashboard for run status
- [ ] Verify keyword appears on calendar with "pending" status

---

## How to Get Help

When reporting the issue, provide:
1. **Browser console output** when scheduling fails
2. **Inngest run logs** (if generation fails)
3. **Vercel function logs** (if API fails)

**Example good bug report:**
```
Issue: Scheduling fails in production

Browser console error:
"❌ Failed to schedule 1 keywords:
 Keyword abc123: 401 Unauthorized"

Environment:
- Logged in as: user@example.com
- Production URL: https://bridgely.io
- Inngest app: blog-scheduler (synced)
```

---

## Testing After Fixes

1. **Fix .env format** in Vercel → redeploy
2. **Run SQL migrations** in Supabase
3. **Verify Inngest SDK URL** with bypass token
4. **Test scheduling:**
   ```
   1. Go to /calendar
   2. Click a date
   3. Select 1 keyword
   4. Click "Schedule"
   5. Check console for "✅ Scheduled 1 keywords successfully"
   6. Page should reload and show keyword on calendar
   ```
5. **Test generation:**
   ```
   1. Click scheduled keyword
   2. Click "Generate Now"
   3. Check Inngest dashboard for active run
   4. Wait for completion (3-5 minutes)
   5. Verify content appears in saved-content
   ```

---

## Quick Fix Commands

### Fix .env in Vercel (via CLI)
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Set variables (replace values)
vercel env add NEXT_PUBLIC_URL production
# Enter: https://www.bridgely.io

# Redeploy
vercel --prod
```

### Fix Database in Supabase
```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and run: /Users/hibbaahmed/seotool/fix_calendar_scheduling.sql
```

### Check Logs
```bash
# Vercel logs
vercel logs --follow

# Or in dashboard: Vercel → Project → Deployments → Latest → View Function Logs
```

