# WordPress.com OAuth Setup Guide

This guide walks you through setting up WordPress.com OAuth authentication for your SEO tool, allowing users to publish content to their WordPress.com sites.

## Overview

The OAuth flow allows users to:
- Connect their WordPress.com account
- Access all their WordPress.com sites automatically
- Publish content directly to any connected site
- No need for application passwords or manual credential entry

## Step-by-Step Setup

### 1. Register Your Application with WordPress.com

1. Go to https://developer.wordpress.com/apps/
2. Click "Create New Application"
3. Fill in the form:
   - **Name**: Bridgely SEO Tool
   - **Description**: AI-powered SEO content publishing tool
   - **Website URL**: Your production URL (e.g., `https://bridgely.io`)
   - **Redirect URLs**: Add both:
     - `https://bridgely.io/api/wordpress/wpcom/callback` (production)
     - `http://localhost:3000/api/wordpress/wpcom/callback` (local dev)
   - **Type**: Web
4. Click "Create"
5. **Save your credentials**:
   - Client ID
   - Client Secret (you'll only see this once!)

### 2. Update Environment Variables

#### Local Development (.env.local)

Create or update `.env.local`:

```env
# WordPress.com OAuth
WPCOM_CLIENT_ID="your-client-id-here"
WPCOM_CLIENT_SECRET="your-client-secret-here"
```

**Note:** The redirect URI is now automatically determined based on your request origin - no need to set it!

#### Production (Vercel)

Add these environment variables in Vercel:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - `WPCOM_CLIENT_ID` = your client ID
   - `WPCOM_CLIENT_SECRET` = your client secret

**Note:** The redirect URI is automatically determined - no need to set `WPCOM_REDIRECT_URI`!

### 3. Update Database Schema

Run the migration in Supabase SQL Editor:

```sql
-- File: wordpress_oauth_migration.sql

ALTER TABLE wordpress_sites 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'self_hosted' CHECK (provider IN ('self_hosted', 'wpcom')),
ADD COLUMN IF NOT EXISTS site_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

ALTER TABLE wordpress_sites 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wordpress_sites_provider ON wordpress_sites(provider);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_user_provider ON wordpress_sites(user_id, provider);
```

### 4. Test the OAuth Flow

#### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/wordpress-sites`

3. Click "Add Site"

4. Select "WordPress.com" tab

5. Click "Connect with WordPress.com"

6. You'll be redirected to WordPress.com to authorize

7. After authorization, you'll be redirected back and all your WordPress.com sites will be added

#### Production Testing

1. Deploy to Vercel:
   ```bash
   git push origin main
   ```

2. Navigate to `https://bridgely.io/wordpress-sites`

3. Follow the same OAuth flow

### 5. Verify the Integration

After connecting, check:

1. **Sites appear in the list** with "WordPress.com" badge
2. **No username shown** (OAuth sites don't need usernames)
3. **Can publish content**:
   - Go to Content Writer or SEO Research
   - Generate content
   - Click "Publish to WordPress"
   - Select your WordPress.com site
   - Publish successfully

## How It Works

### OAuth Flow

```
User clicks "Connect with WordPress.com"
    ↓
Redirected to /api/wordpress/wpcom/login
    ↓
Redirected to WordPress.com OAuth authorization
    ↓
User authorizes the app
    ↓
WordPress.com redirects to /api/wordpress/wpcom/callback
    ↓
Exchange auth code for access token
    ↓
Fetch user's WordPress.com sites
    ↓
Store sites and access token in database
    ↓
Redirect back to /wordpress-sites with success message
```

### Publishing Flow

```
User selects WordPress.com site to publish
    ↓
Check if site provider === 'wpcom'
    ↓
Use WordPress.com REST API with Bearer token
    ↓
POST https://public-api.wordpress.com/rest/v1.1/sites/{site_id}/posts/new
    ↓
Content published to WordPress.com
```

## API Routes Created

- `GET /api/wordpress/wpcom/login` - Initiates OAuth flow
- `GET /api/wordpress/wpcom/callback` - Handles OAuth callback
- `POST /api/wordpress/publish` - Publishes content (supports both self-hosted and WordPress.com)

## Security Features

- **State parameter**: CSRF protection
- **HTTP-only cookies**: Prevent XSS attacks
- **Secure tokens**: Encrypted in database
- **User validation**: All requests validate user authentication
- **Short-lived state**: 10-minute expiration on OAuth state

## Differences: Self-Hosted vs WordPress.com

| Feature | Self-Hosted | WordPress.com |
|---------|------------|---------------|
| Authentication | Application Password | OAuth 2.0 |
| API Endpoint | `{site_url}/wp-json/wp/v2/` | `public-api.wordpress.com/rest/v1.1/` |
| Authorization | Basic Auth | Bearer Token |
| Tag/Category IDs | Required | Names work directly |
| Media Upload | Supported | Supported |
| Scheduling | Supported | Supported |

## Troubleshooting

### "OAuth not configured" error
- Verify environment variables are set
- Check spelling of env var names
- Restart server after adding env vars

### "Invalid redirect URI" error
- Verify redirect URI in WordPress.com app settings
- Must match exactly (including protocol and path)
- Add both localhost and production URLs

### "No sites found" error
- User needs at least one WordPress.com site
- Check site visibility (must not be private)
- Try creating a test site on WordPress.com

### "Failed to publish" error
- Check access token is valid
- Verify site_id is correct
- Check WordPress.com API status

## WordPress.com API Documentation

- OAuth: https://developer.wordpress.com/docs/oauth2/
- REST API: https://developer.wordpress.com/docs/api/
- Posts: https://developer.wordpress.com/docs/api/1.1/post/sites/%24site/posts/new/

## Next Steps

- [ ] Test OAuth flow locally
- [ ] Deploy to production
- [ ] Test OAuth flow in production
- [ ] Publish test content to WordPress.com
- [ ] Monitor for any errors in logs



