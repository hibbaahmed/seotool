# WordPress Publishing Fix - Website Separation

## Problem
When scheduling a keyword for one website (e.g., Bridgely), the generated content was being published to a different website's WordPress blog (e.g., Quiknote). This happened because the WordPress site selection logic was not filtering by `onboarding_profile_id`.

## Root Cause
The auto-publish logic in both the calendar generation API and Inngest functions was selecting WordPress sites using:

```sql
SELECT * FROM wordpress_sites
WHERE user_id = 'user-id'
  AND is_active = true
ORDER BY created_at DESC
LIMIT 1;
```

This query **did not filter by `onboarding_profile_id`**, so it would always publish to the most recently created active WordPress site, regardless of which website the keyword belonged to.

## Solution

### 1. Fixed Calendar Generation API (`app/api/calendar/generate/route.ts`)

**Before:**
```typescript
const { data: site } = await serviceSupabase
  .from('wordpress_sites')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**After:**
```typescript
// Get the keyword's onboarding_profile_id to find the correct WordPress site
const keywordProfileId = keywordData ? (keywordData as any).onboarding_profile_id : null;

let siteQuery = serviceSupabase
  .from('wordpress_sites')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true);

// Filter by onboarding_profile_id if available to publish to the correct website
if (keywordProfileId) {
  siteQuery = siteQuery.eq('onboarding_profile_id', keywordProfileId);
}

const { data: site } = await siteQuery
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### 2. Fixed Inngest Function (`lib/inngest-functions.ts`)

Applied the same fix to the `generateKeywordContent` function's auto-publish step (around line 1594-1604).

### 3. Database Schema Update

Added `onboarding_profile_id` to `scheduled_posts` table:

```sql
-- Add the onboarding_profile_id column to scheduled_posts
ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS onboarding_profile_id UUID REFERENCES user_onboarding_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_onboarding_profile 
ON scheduled_posts(onboarding_profile_id);

-- Backfill existing posts
UPDATE scheduled_posts sp
SET onboarding_profile_id = cwo.onboarding_profile_id
FROM content_writer_outputs cwo
WHERE sp.content_id = cwo.id
  AND sp.onboarding_profile_id IS NULL
  AND cwo.onboarding_profile_id IS NOT NULL;
```

### 4. Updated Scheduled Posts API

Modified `/api/calendar/posts` to:
- Accept `onboarding_profile_id` query parameter for filtering
- Store `onboarding_profile_id` when creating new scheduled posts

## How It Works Now

1. **Keyword is Scheduled:**
   - Keyword already has `onboarding_profile_id` linking it to its website (e.g., Bridgely)

2. **Content is Generated:**
   - Generated content inherits `onboarding_profile_id` from the keyword
   - Content is saved to `content_writer_outputs` with correct `onboarding_profile_id`

3. **WordPress Site Selection:**
   - System queries: `SELECT * FROM wordpress_sites WHERE onboarding_profile_id = 'bridgely-id' AND is_active = true`
   - Only WordPress sites linked to Bridgely are considered
   - Content is published to Bridgely's WordPress site, not Quiknote's

4. **Publishing Log:**
   - Publishing log is created with the correct `onboarding_profile_id`
   - Future publishing history correctly shows which website the content belongs to

## Testing Steps

1. **Verify Multiple Websites:**
   ```sql
   SELECT id, business_name, website_url FROM user_onboarding_profiles WHERE user_id = 'your-user-id';
   ```

2. **Verify WordPress Sites Are Linked:**
   ```sql
   SELECT ws.id, ws.name, ws.url, ws.onboarding_profile_id, p.business_name
   FROM wordpress_sites ws
   JOIN user_onboarding_profiles p ON ws.onboarding_profile_id = p.id
   WHERE ws.user_id = 'your-user-id';
   ```

3. **Schedule Keyword for Website A:**
   - Go to Calendar
   - Select Website A from dropdown
   - Schedule a keyword from Website A

4. **Generate Content:**
   - Click "Generate" on the scheduled keyword
   - Wait for content generation to complete

5. **Verify Publication:**
   - Check that content was published to Website A's WordPress site
   - Check publishing logs:
   ```sql
   SELECT pl.*, ws.name, ws.url, p.business_name
   FROM publishing_logs pl
   JOIN wordpress_sites ws ON pl.site_id = ws.id
   JOIN user_onboarding_profiles p ON pl.onboarding_profile_id = p.id
   WHERE pl.content_id = 'generated-content-id';
   ```

## Migration Required

**Run this SQL migration:**
```bash
psql your_database < scheduled_posts_website_fix.sql
```

This will:
- Add `onboarding_profile_id` column to `scheduled_posts`
- Create indexes for performance
- Backfill existing scheduled posts with their website associations

## Files Modified

1. ✅ `app/api/calendar/generate/route.ts` - Fixed WordPress site selection AND content inheritance
   - Added `onboarding_profile_id` filtering when selecting WordPress site
   - Added `onboarding_profile_id` to `content_writer_outputs` insert
2. ✅ `lib/inngest-functions.ts` - Fixed WordPress site selection AND content inheritance
   - Added `onboarding_profile_id` filtering when selecting WordPress site
   - Added `onboarding_profile_id` to `content_writer_outputs` insert
3. ✅ `app/api/calendar/posts/route.ts` - Added website filtering and storage
   - GET endpoint accepts `onboarding_profile_id` query parameter
   - POST endpoint accepts and stores `onboarding_profile_id`
4. ✅ `components/BlogCalendar.tsx` - Already fixed in previous update
   - Passes `onboarding_profile_id` to API calls
   - Client-side filtering as fallback
5. ✅ `scheduled_posts_website_fix.sql` - Database migration script

## Expected Behavior

- **Bridgely keyword → Bridgely WordPress site**
- **Quiknote keyword → Quiknote WordPress site**
- Each website's content is published to its own WordPress site(s)
- Calendar view correctly shows each website's scheduled posts
- No cross-contamination between websites

