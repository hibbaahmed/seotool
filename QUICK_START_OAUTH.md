# Quick Start: WordPress.com OAuth

Get WordPress.com OAuth working in 5 minutes!

## 1. Register Your App (2 minutes)

Go to: https://developer.wordpress.com/apps/

Click "Create New Application":
- **Name**: Bridgely SEO Tool
- **Website URL**: `https://bridgely.io`
- **Redirect URLs**:
  ```
  http://localhost:3000/api/wordpress/wpcom/callback
  https://bridgely.io/api/wordpress/wpcom/callback
  ```
- **Type**: Web

**Save your Client ID and Client Secret!**

## 2. Add Environment Variables (1 minute)

Create `.env.local`:

```env
WPCOM_CLIENT_ID="paste-your-client-id-here"
WPCOM_CLIENT_SECRET="paste-your-client-secret-here"
```

**Note:** Redirect URI is now automatically determined - no need to set `WPCOM_REDIRECT_URI`!

## 3. Run Database Migration (1 minute)

In Supabase SQL Editor, paste and run:

```sql
-- From wordpress_oauth_migration.sql
ALTER TABLE wordpress_sites 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'self_hosted',
ADD COLUMN IF NOT EXISTS site_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

ALTER TABLE wordpress_sites 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;
```

## 4. Test Locally (1 minute)

```bash
npm run dev
```

Go to: http://localhost:3000/wordpress-sites

1. Click "Add Site"
2. Select "WordPress.com" tab
3. Click "Connect with WordPress.com"
4. Authorize on WordPress.com
5. ✅ Your sites appear!

## 5. Deploy to Production (Optional)

Add to Vercel environment variables:
- `WPCOM_CLIENT_ID`
- `WPCOM_CLIENT_SECRET`

**Note:** Redirect URI is automatic - no need to set it!

Deploy:
```bash
git add .
git commit -m "Add WordPress.com OAuth"
git push origin main
```

## ✅ Done!

Users can now connect their WordPress.com sites with one click!

---

## Troubleshooting

**"OAuth not configured" error**
→ Restart server after adding env vars

**"Invalid redirect URI" error**
→ Make sure redirect URIs in WordPress.com app settings include both localhost and production URLs

**"No sites found" error**
→ Create a test site on WordPress.com first

---

For more details, see `WORDPRESS_OAUTH_SETUP.md`



