# Calendar Website Scheduling Debug Guide

## Issue
Content scheduled from the calendar is not being published to the correct website's WordPress site.

## Debug Enhancements Added

### 1. Calendar Modal - Website Display
**Location:** `app/calendar/page.tsx` line ~1157

**What it does:** Shows which website each keyword belongs to in the scheduling modal.

**Expected Output:**
```
Keyword: "best seo tips"
Volume: 1000 · Difficulty: 45 • Bridgely (technology)
```

If you see keywords showing different website names, they should each publish to their respective WordPress sites.

### 2. Calendar Modal - Scheduling Logs
**Location:** `app/calendar/page.tsx` line ~1338

**What it does:** Logs which website each keyword belongs to when scheduling.

**Expected Console Output:**
```
📤 Scheduling keyword 1/3: { keyword_id: "abc-123", scheduled_date: "2025-11-28", scheduled_time: "09:00:00" }
   Keyword: "best seo tips", Website: Bridgely (technology)
📤 Scheduling keyword 2/3: { keyword_id: "def-456", scheduled_date: "2025-11-28", scheduled_time: "09:00:00" }
   Keyword: "quiknote features", Website: Quiknote (technology)
```

### 3. Generation API - Keyword Website Tracking
**Location:** `app/api/calendar/generate/route.ts` line ~169

**What it does:** Logs the keyword's website association when loaded.

**Expected Console Output:**
```
📌 Keyword loaded: "best seo tips"
📌 Keyword onboarding_profile_id: abc-123-def-456-ghi
```

⚠️ **Problem Indicator:** If you see `NONE - THIS IS THE PROBLEM!`, the keyword doesn't have a website association.

### 4. Generation API - Content Saving
**Location:** `app/api/calendar/generate/route.ts` line ~750

**What it does:** Logs which website the generated content is being linked to.

**Expected Console Output:**
```
💾 Saving content with onboarding_profile_id: abc-123-def-456-ghi
```

⚠️ **Problem Indicator:** If you see `NONE - THIS IS THE PROBLEM!`, the content won't be linked to any website.

### 5. Generation API - WordPress Site Selection
**Location:** `app/api/calendar/generate/route.ts` line ~835

**What it does:** Logs which WordPress site is being selected for publishing.

**Expected Console Output:**
```
🔍 Looking for WordPress site with onboarding_profile_id: abc-123-def-456-ghi
✅ Found WordPress site: Bridgely Blog (https://bridgely.com)
   Site's onboarding_profile_id: abc-123-def-456-ghi
```

⚠️ **Problem Indicators:**
- `NONE - WILL SELECT ANY SITE!` - Keyword has no website association
- `❌ No WordPress site found` - WordPress site not linked to this website

## Diagnostic Steps

### Step 1: Check Keywords Have Website Associations

```sql
SELECT 
  id,
  keyword,
  onboarding_profile_id,
  scheduled_for_generation,
  generation_status
FROM discovered_keywords
WHERE user_id = 'your-user-id'
  AND scheduled_for_generation = true
ORDER BY scheduled_date DESC;
```

**What to look for:**
- ✅ Each keyword should have an `onboarding_profile_id`
- ❌ If `onboarding_profile_id` is NULL, that's the problem

### Step 2: Check WordPress Sites Are Linked to Websites

```sql
SELECT 
  ws.id,
  ws.name,
  ws.url,
  ws.onboarding_profile_id,
  p.business_name,
  p.website_url,
  ws.is_active
FROM wordpress_sites ws
LEFT JOIN user_onboarding_profiles p ON ws.onboarding_profile_id = p.id
WHERE ws.user_id = 'your-user-id'
ORDER BY ws.created_at DESC;
```

**What to look for:**
- ✅ Each WordPress site should have an `onboarding_profile_id`
- ✅ The `business_name` should match the website it belongs to
- ❌ If `onboarding_profile_id` is NULL, WordPress site isn't linked to a website

### Step 3: Check Generated Content Is Linked

```sql
SELECT 
  cwo.id,
  cwo.topic,
  cwo.onboarding_profile_id,
  p.business_name,
  cwo.created_at
FROM content_writer_outputs cwo
LEFT JOIN user_onboarding_profiles p ON cwo.onboarding_profile_id = p.id
WHERE cwo.user_id = 'your-user-id'
ORDER BY cwo.created_at DESC
LIMIT 10;
```

**What to look for:**
- ✅ Each content piece should have an `onboarding_profile_id`
- ✅ The `business_name` should match the website it was generated for
- ❌ If `onboarding_profile_id` is NULL, content isn't linked to a website

### Step 4: Check Publishing Logs

```sql
SELECT 
  pl.content_id,
  pl.post_id,
  ws.name as wordpress_site,
  ws.onboarding_profile_id as site_profile_id,
  p.business_name as website_name,
  cwo.onboarding_profile_id as content_profile_id,
  pl.status,
  pl.published_at
FROM publishing_logs pl
JOIN wordpress_sites ws ON pl.site_id = ws.id
JOIN content_writer_outputs cwo ON pl.content_id = cwo.id
LEFT JOIN user_onboarding_profiles p ON ws.onboarding_profile_id = p.id
WHERE pl.user_id = 'your-user-id'
ORDER BY pl.published_at DESC
LIMIT 10;
```

**What to look for:**
- ✅ `site_profile_id` should match `content_profile_id`
- ✅ `website_name` should be correct for the content
- ❌ If they don't match, content is publishing to wrong site

## Common Problems & Solutions

### Problem 1: Keywords Missing Website Association

**Symptom:** Console shows `onboarding_profile_id: NONE`

**Cause:** Keywords were created before the multi-website migration or weren't properly linked.

**Solution:** Update keywords with correct website:
```sql
-- Find keywords that need fixing (no website)
SELECT id, keyword, user_id FROM discovered_keywords 
WHERE onboarding_profile_id IS NULL;

-- If user has only one website, link all keywords to it:
UPDATE discovered_keywords
SET onboarding_profile_id = (
  SELECT id FROM user_onboarding_profiles 
  WHERE user_id = discovered_keywords.user_id 
  LIMIT 1
)
WHERE onboarding_profile_id IS NULL;

-- If user has multiple websites, you'll need to manually assign each keyword
-- or delete and regenerate them through the proper UI flow
```

### Problem 2: WordPress Sites Not Linked to Websites

**Symptom:** Console shows `❌ No WordPress site found`

**Cause:** WordPress sites were added before multi-website migration.

**Solution:** Link WordPress sites to websites:
```sql
-- Check which sites need linking
SELECT id, name, url, onboarding_profile_id 
FROM wordpress_sites 
WHERE onboarding_profile_id IS NULL;

-- Link WordPress site to a specific website
UPDATE wordpress_sites
SET onboarding_profile_id = 'your-website-profile-id'
WHERE id = 'wordpress-site-id';
```

### Problem 3: Old Content Not Linked

**Symptom:** Old generated content has no website association.

**Solution:** Either regenerate the content OR manually link it:
```sql
-- Check content that needs linking
SELECT id, topic, user_id, onboarding_profile_id 
FROM content_writer_outputs 
WHERE onboarding_profile_id IS NULL;

-- Link to appropriate website (requires manual review)
UPDATE content_writer_outputs
SET onboarding_profile_id = 'appropriate-website-profile-id'
WHERE id = 'content-id';
```

## Expected Workflow After Fixes

1. **User selects Website A in calendar**
   - Only shows keywords for Website A
   - Console: `Keyword: "keyword", Website: Website A`

2. **User schedules keyword**
   - Keyword already has `onboarding_profile_id` for Website A
   - Console: `📌 Keyword onboarding_profile_id: [Website A ID]`

3. **Content is generated**
   - Console: `💾 Saving content with onboarding_profile_id: [Website A ID]`
   - Content is linked to Website A

4. **WordPress site is selected**
   - Console: `🔍 Looking for WordPress site with onboarding_profile_id: [Website A ID]`
   - Console: `✅ Found WordPress site: Website A Blog`
   - Only Website A's WordPress sites are considered

5. **Content is published**
   - Publishes to Website A's WordPress site
   - Publishing log records correct associations

## Testing Checklist

- [ ] Run database queries to verify keywords have `onboarding_profile_id`
- [ ] Run database queries to verify WordPress sites have `onboarding_profile_id`
- [ ] Open calendar and select a specific website
- [ ] Schedule a keyword and check browser console logs
- [ ] Generate content and check server logs (or browser console)
- [ ] Verify content publishes to correct WordPress site
- [ ] Check publishing_logs table for correct associations
- [ ] Test with second website to ensure no cross-contamination

