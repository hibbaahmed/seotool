# WordPress.com Multi-Account Connection Fix

## Problem
Users were unable to connect WordPress.com sites that are under a different email account than the one they used to sign into Bridgely. For example:
- User signs into Bridgely with Google using `me@sashin.com`
- Their WordPress.com sites are under `sash@casequota.com`
- The OAuth flow only connected sites from the WordPress.com account that was currently logged in

## Solution
Added support for connecting WordPress.com sites from different accounts by:
1. Adding a `wpcom_account_email` field to track which WordPress.com account was used
2. Adding a UI field where users can specify which WordPress.com email they want to connect
3. Displaying which WordPress.com account email is connected for each site
4. Showing clear instructions about logging in with the correct account

## Changes Made

### 1. Database Migration
**File:** `migrations/add_wpcom_account_email.sql`
- Added `wpcom_account_email` column to `wordpress_sites` table
- Added index for faster lookups

**Action Required:** Run this migration in your Supabase SQL editor:
```sql
-- See migrations/add_wpcom_account_email.sql
```

### 2. OAuth Callback Update
**File:** `app/api/wordpress/wpcom/callback/route.ts`
- Fetches the WordPress.com account email from the API after OAuth
- Stores the email in the database when saving sites

### 3. UI Updates
**File:** `app/dashboard/wordpress-sites/page.tsx`
- Added email input field in the "Add Site" form
- Shows warning message when email is specified, reminding users to log in with that email
- Displays the connected WordPress.com account email for each site
- Updated instructions to explain the multi-account scenario

### 4. TypeScript Types
**File:** `types/supabase.ts`
- Added `wpcom_account_email: string | null` to the `wordpress_sites` Row, Insert, and Update types

## How It Works

1. **User specifies email (optional):** When adding a WordPress.com site, users can optionally enter the WordPress.com email account they want to connect
2. **Clear instructions:** If an email is specified, a warning appears reminding them to log in with that email on WordPress.com
3. **OAuth flow:** User clicks "Connect with WordPress.com" and is redirected to WordPress.com OAuth
4. **Account detection:** After OAuth, the system automatically fetches and stores the WordPress.com account email that was used
5. **Display:** Each connected site shows which WordPress.com account email it's connected with

## User Instructions

When connecting WordPress.com sites from a different account:

1. Click "Add Site" on the WordPress Sites page
2. If your WordPress.com sites are under a different email than your Bridgely account, enter that email in the "WordPress.com Account Email" field
3. **Important:** When you click "Connect with WordPress.com", make sure you log in with the email you specified (or the email where your sites are located)
4. If you're already logged into WordPress.com with a different account, either:
   - Log out of WordPress.com first, OR
   - Use an incognito/private browser window
5. After authorization, all sites from that WordPress.com account will be connected

## Testing

To test this feature:
1. Run the database migration
2. Go to the WordPress Sites page
3. Click "Add Site"
4. Enter a WordPress.com email (if different from your Bridgely account)
5. Click "Connect with WordPress.com"
6. Make sure to log in with the specified email on WordPress.com
7. Verify that sites are connected and the account email is displayed

## Notes

- The email field is optional - if left blank, the system will use whatever account is logged into WordPress.com
- The account email is automatically detected and stored after OAuth - users don't need to manually verify it
- Multiple WordPress.com accounts can be connected by repeating the process with different emails

