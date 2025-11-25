# Website Separation Implementation Guide

## Overview

After running the `multiple_websites_migration.sql` migration, your application now supports multiple websites per user with complete separation in the calendar and keywords pages.

## How It Works

### 1. Database Structure

Each website is stored as a `user_onboarding_profiles` record with a unique `id` (onboarding_profile_id). All related data is linked to this ID:

- **Keywords**: `discovered_keywords.onboarding_profile_id`
- **WordPress Sites**: `wordpress_sites.onboarding_profile_id`
- **Generated Content**: `content_writer_outputs.onboarding_profile_id`
- **Publishing Logs**: `publishing_logs.onboarding_profile_id`

### 2. Calendar Page (`/calendar`)

**Website Filter:**
- Dropdown selector at the top of the page
- Options:
  - "All Websites" - Shows all scheduled items across all websites
  - Individual websites - Shows only items for that specific website

**What Gets Filtered:**
- Scheduled keywords (filtered by `onboarding_profile_id`)
- Keyword stats (total, recommended, starred, queued, generated)
- When adding new keywords to schedule, only shows keywords from selected website

**Visual Indicators:**
- Website name badge shown when a specific website is selected
- Stats cards update to reflect the selected website's data

### 3. Keywords Page (`/dashboard/keywords`)

**URL-based Filtering:**
- `/dashboard/keywords?onboarding=<profile-id>` - Shows keywords for specific website
- `/dashboard/keywords` - Shows all keywords from all websites

**UI Features:**
- Website selector in "Generate Keywords" modal
- Website selector in "Manual Entry" modal
- All keywords are automatically linked to their website via `onboarding_profile_id`

### 4. When Scheduling Keywords

**Process:**
1. User selects a website (or "All Websites")
2. Calendar shows only keywords from that website
3. When scheduling, keywords are already linked to their website
4. Generated content inherits the keyword's `onboarding_profile_id`

### 5. When Publishing

**Process:**
1. System finds WordPress sites linked to the content's website (`onboarding_profile_id`)
2. Publishes to those WordPress sites
3. Logs publication with the website ID in `publishing_logs.onboarding_profile_id`

## API Endpoints Updated

### `/api/calendar/keywords`
- **New Query Parameter**: `onboarding_profile_id`
- Filters scheduled keywords by website
- Example: `/api/calendar/keywords?month=2024-01&onboarding_profile_id=abc-123`

### `/api/keywords/generate`
- Already links keywords to the selected `profileId`
- Keywords are automatically associated with the correct website

### `/api/keywords/quick-add-website`
- Creates a new website profile
- Generates keywords linked to that website
- Returns the new `profileId`

### `/api/keywords/manual-add`
- Adds keywords to the specified `profileId`
- Links keywords to the correct website

## SQL Queries for Separation

### Get All Websites for a User
```sql
SELECT * FROM user_onboarding_profiles
WHERE user_id = 'user-id'
ORDER BY created_at DESC;
```

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
```

### Get WordPress Sites for a Website
```sql
SELECT * FROM wordpress_sites
WHERE user_id = 'user-id'
  AND onboarding_profile_id = 'website-profile-id'
  AND is_active = true;
```

### Get Content Generated for a Website
```sql
SELECT * FROM content_writer_outputs
WHERE user_id = 'user-id'
  AND onboarding_profile_id = 'website-profile-id'
ORDER BY created_at DESC;
```

### Get Publishing History for a Website
```sql
SELECT pl.*, ws.name as site_name, ws.url as site_url
FROM publishing_logs pl
JOIN wordpress_sites ws ON pl.site_id = ws.id
WHERE pl.user_id = 'user-id'
  AND pl.onboarding_profile_id = 'website-profile-id'
ORDER BY pl.published_at DESC;
```

## UI Components

### Calendar Page
- **Website Selector**: Dropdown at top of page
- **Website Badge**: Shows selected website name
- **Filtered Stats**: All stats reflect selected website
- **Filtered Calendar**: Only shows items for selected website

### Keywords Page
- **URL Parameter**: `?onboarding=<profile-id>` filters keywords
- **Modal Selectors**: Website selection in all modals
- **Project Dropdown**: Shows all available websites

## Best Practices

1. **Always Link Keywords**: When generating keywords, ensure `onboarding_profile_id` is set
2. **Link WordPress Sites**: When adding WordPress sites, link them to the correct website
3. **Filter Before Scheduling**: Select the website before scheduling keywords
4. **Use Website Selector**: Always use the website selector when working with multiple websites
5. **Check Website Context**: Before publishing, verify the content is linked to the correct website

## Migration Checklist

- [x] Run `multiple_websites_migration.sql`
- [x] Update calendar page with website selector
- [x] Update BlogCalendar component to accept website filter
- [x] Update `/api/calendar/keywords` to filter by website
- [x] Update keywords page to support website filtering
- [x] Test adding multiple websites
- [x] Test scheduling keywords for different websites
- [x] Test publishing to different websites
- [x] Verify separation in calendar view

## Example Workflow

1. **Add First Website:**
   - Click "Quick Add Website"
   - Enter `lawfirm1.com`
   - System creates profile with ID `profile-1`
   - Keywords generated and linked to `profile-1`

2. **Add Second Website:**
   - Click "Quick Add Website"
   - Enter `lawfirm2.com`
   - System creates profile with ID `profile-2`
   - Keywords generated and linked to `profile-2`

3. **Schedule Keywords:**
   - Go to Calendar
   - Select "Law Firm 1" from dropdown
   - Calendar shows only keywords for Law Firm 1
   - Schedule keywords - they're already linked to `profile-1`

4. **Publish Content:**
   - Generate content from scheduled keyword
   - Content inherits `onboarding_profile_id = profile-1`
   - System finds WordPress sites linked to `profile-1`
   - Publishes to those sites
   - Logs publication with `onboarding_profile_id = profile-1`

## Troubleshooting

**Issue**: Calendar shows all keywords regardless of website selection
- **Solution**: Check that `selectedWebsiteId` is being passed to `BlogCalendar` component

**Issue**: Keywords not filtering by website
- **Solution**: Verify `onboarding_profile_id` is set on keywords and API is filtering correctly

**Issue**: Content publishing to wrong website
- **Solution**: Check that `content_writer_outputs.onboarding_profile_id` matches the keyword's `onboarding_profile_id`

**Issue**: WordPress sites not linked to websites
- **Solution**: Update `wordpress_sites.onboarding_profile_id` to link sites to websites

