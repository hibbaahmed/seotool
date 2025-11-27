# Duplicate Publishing Fix

## Problem
The same blog post was being published multiple times to WordPress sites, even to the wrong websites (e.g., Bridgely content publishing to Quiknote).

## Root Causes

### 1. Missing Website Association (FIXED)
The WordPress site selection wasn't filtering by `onboarding_profile_id`, so it would grab any active site instead of the correct one for that website.

**Solution:** Added `onboarding_profile_id` filtering when selecting WordPress sites.

### 2. No Duplicate Detection (FIXED)
The system had no check to prevent re-publishing content that was already published. Every time you regenerated content or triggered the publish flow, it would publish again, creating duplicates.

**Solution:** Added duplicate detection by checking `publishing_logs` before publishing.

## Implementation

### Calendar Generation API (`app/api/calendar/generate/route.ts`)

**Before:**
```typescript
// Auto-publish to user's connected WordPress site if available
try {
  const { data: site } = await serviceSupabase
    .from('wordpress_sites')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (site) {
    // Publish content...
  }
}
```

**After:**
```typescript
// Auto-publish to user's connected WordPress site if available
try {
  // CRITICAL: Check if content has already been published to prevent duplicates
  const { data: existingPublish } = await serviceSupabase
    .from('publishing_logs')
    .select('id, post_id, site_id')
    .eq('content_id', savedContent.id)
    .eq('user_id', user.id)
    .eq('status', 'published')
    .maybeSingle();

  if (existingPublish) {
    console.log(`⏭️ Content already published (post_id: ${existingPublish.post_id}), skipping auto-publish`);
    publishingSucceeded = true; // Mark as succeeded since it was already published
  } else {
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

    if (site) {
      // Publish content...
    }
  }
}
```

### Inngest Function (`lib/inngest-functions.ts`)

Applied the same duplicate detection logic to the `generateKeywordContent` function's auto-publish step.

## How It Works Now

1. **Content Generation:**
   - User generates content from a scheduled keyword
   - Content is saved with `onboarding_profile_id` linking it to the correct website

2. **Pre-Publish Check:**
   - System queries `publishing_logs` for existing publications of this content
   - If found, skips publishing and returns success (content already exists)

3. **WordPress Site Selection:**
   - If not already published, system selects WordPress site
   - **Filters by `onboarding_profile_id`** to ensure correct website
   - Only sites linked to the keyword's website are considered

4. **Publish Once:**
   - Content publishes to the correct WordPress site
   - Publishing log created with `content_id`, `site_id`, and `onboarding_profile_id`

5. **Future Regenerations:**
   - If user regenerates the same keyword, duplicate check catches it
   - No duplicate posts created

## Expected Behavior

✅ **First Generation:** Content publishes to correct WordPress site  
✅ **Regeneration:** Skips publishing (already exists)  
✅ **Bridgely keyword → Bridgely WordPress only**  
✅ **Quiknote keyword → Quiknote WordPress only**  
✅ **No duplicate posts**  
✅ **No cross-website contamination**

## Files Modified

1. ✅ `app/api/calendar/generate/route.ts`
   - Added duplicate detection check
   - Added `onboarding_profile_id` filtering for WordPress site selection
   - Added `onboarding_profile_id` to content insert

2. ✅ `lib/inngest-functions.ts`
   - Added duplicate detection check
   - Added `onboarding_profile_id` filtering for WordPress site selection
   - Added `onboarding_profile_id` to content insert

3. ✅ `app/api/calendar/posts/route.ts`
   - Added `onboarding_profile_id` filtering and storage

4. ✅ `components/BlogCalendar.tsx`
   - Added website filtering for calendar display

5. ✅ `scheduled_posts_website_fix.sql`
   - Database schema update for scheduled_posts

## Testing

1. **Generate content for Website A:**
   - Should publish to Website A's WordPress site
   - Check `publishing_logs` for entry

2. **Regenerate the same keyword:**
   - Should skip publishing (log shows "already published")
   - No duplicate post created

3. **Generate content for Website B:**
   - Should publish to Website B's WordPress site only
   - No cross-contamination with Website A

4. **Check publishing logs:**
   ```sql
   SELECT 
     pl.content_id,
     pl.post_id,
     ws.name as site_name,
     ws.url as site_url,
     p.business_name as website_name,
     pl.status,
     pl.published_at
   FROM publishing_logs pl
   JOIN wordpress_sites ws ON pl.site_id = ws.id
   JOIN user_onboarding_profiles p ON ws.onboarding_profile_id = p.id
   WHERE pl.user_id = 'your-user-id'
   ORDER BY pl.published_at DESC;
   ```

## Summary

Both issues are now fixed:
1. ✅ Content publishes to the **correct website's WordPress site**
2. ✅ Content is **never published twice** (duplicate detection)
3. ✅ **No cross-website contamination**

