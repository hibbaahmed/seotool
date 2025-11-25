# Multiple Websites Separation Guide

## Overview

This guide explains how websites are separated in the calendar and keywords pages after running the `multiple_websites_migration.sql` migration.

## Database Structure

After migration, the relationships are:

```
user_onboarding_profiles (websites/projects)
  ├── discovered_keywords (keywords for this website)
  ├── wordpress_sites (WordPress sites linked to this website)
  ├── content_writer_outputs (content generated for this website)
  └── publishing_logs (posts published for this website)
```

## How Separation Works

### 1. Keywords Page (`/dashboard/keywords`)

**URL-based filtering:**
- `/dashboard/keywords?onboarding=<profile-id>` - Shows keywords for specific website
- `/dashboard/keywords` - Shows all keywords from all websites

**UI Features:**
- Website selector dropdown in the header
- Filter by website when generating/scheduling keywords
- Each keyword is linked to its website via `onboarding_profile_id`

### 2. Calendar Page (`/calendar`)

**Website Filter:**
- Dropdown selector at top of calendar
- "All Websites" option to see everything
- Individual website selection to filter calendar items

**What Gets Filtered:**
- Scheduled keywords (filtered by `onboarding_profile_id`)
- Scheduled posts (filtered by linked website)
- Only shows items for the selected website

**Visual Indicators:**
- Each calendar item shows which website it belongs to
- Color coding by website (optional)
- Website name/badge on each scheduled item

### 3. When Scheduling

**Keywords:**
- When you schedule a keyword, it's automatically linked to the website it belongs to
- The `onboarding_profile_id` is already set on the keyword

**Content Generation:**
- Generated content is linked to the keyword's website
- `content_writer_outputs.onboarding_profile_id` = keyword's `onboarding_profile_id`

**Publishing:**
- When publishing, the system:
  1. Finds WordPress sites linked to the content's website (`onboarding_profile_id`)
  2. Publishes to those sites
  3. Logs the publication with the website ID

## SQL Queries for Separation

### Get Keywords for a Specific Website
```sql
SELECT * FROM discovered_keywords
WHERE user_id = 'user-id'
  AND onboarding_profile_id = 'website-profile-id'
ORDER BY created_at DESC;
```

### Get Scheduled Items for a Website
```sql
-- Scheduled keywords
SELECT * FROM discovered_keywords
WHERE user_id = 'user-id'
  AND onboarding_profile_id = 'website-profile-id'
  AND scheduled_for_generation = true
ORDER BY scheduled_date, scheduled_time;

-- Scheduled posts
SELECT sp.* FROM scheduled_posts sp
JOIN content_writer_outputs cwo ON sp.content_id = cwo.id
WHERE cwo.user_id = 'user-id'
  AND cwo.onboarding_profile_id = 'website-profile-id'
ORDER BY sp.scheduled_date, sp.scheduled_time;
```

### Get WordPress Sites for a Website
```sql
SELECT * FROM wordpress_sites
WHERE user_id = 'user-id'
  AND onboarding_profile_id = 'website-profile-id'
  AND is_active = true;
```

### Get All Websites with Stats
```sql
SELECT * FROM user_websites_summary
WHERE user_id = 'user-id'
ORDER BY profile_created_at DESC;
```

## UI Implementation

### Keywords Page
1. **Website Selector** - Dropdown in header to switch between websites
2. **Filter Badge** - Shows current website filter
3. **"All Websites" Option** - View all keywords across all websites

### Calendar Page
1. **Website Filter** - Dropdown at top to filter calendar
2. **Website Badge** - Each item shows which website it belongs to
3. **Color Coding** - Different colors for different websites (optional)

## Best Practices

1. **Always link keywords to websites** - When generating keywords, ensure `onboarding_profile_id` is set
2. **Link WordPress sites** - When adding WordPress sites, link them to the correct website
3. **Filter before scheduling** - Select the website before scheduling keywords
4. **Use website selector** - Always use the website selector when working with multiple websites

