# WordPress.com OAuth Production Deployment Checklist

## ✅ Completed
- [x] OAuth credentials created on WordPress.com
- [x] Code updated for dynamic redirect URIs
- [x] Credentials added to `.env.local`
- [x] Environment files configured

## ❌ Still Needed for Production

### 1. Run Database Migration (REQUIRED)

**Go to your Supabase Dashboard:**
1. Log into https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Migration: Add OAuth support to wordpress_sites table
-- Run this in your Supabase SQL editor

-- Add new columns for OAuth support
ALTER TABLE wordpress_sites 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'self_hosted' CHECK (provider IN ('self_hosted', 'wpcom')),
ADD COLUMN IF NOT EXISTS site_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Make username and password nullable (they're not needed for OAuth)
ALTER TABLE wordpress_sites 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_provider ON wordpress_sites(provider);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_user_provider ON wordpress_sites(user_id, provider);
```

6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success" message

### 2. Add Redirect URIs to WordPress.com App (REQUIRED)

**Go to:** https://developer.wordpress.com/apps/

1. Click on your "Bridgely" app
2. Find **Redirect URLs** section
3. Add these two URLs (one per line):

```
http://localhost:3000/api/wordpress/wpcom/callback
https://bridgely.io/api/wordpress/wpcom/callback
```

4. Click **Update Application**

### 3. Add Credentials to Vercel Production (REQUIRED)

**Go to:** https://vercel.com/dashboard

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add these two variables:

| Name | Value | Environment |
|------|-------|-------------|
| `WPCOM_CLIENT_ID` | `127234` | Production (and Preview if you use preview envs) |
| `WPCOM_CLIENT_SECRET` | `g1YFO8CK45Hcli4sraNgHYCzK7zXcLFETCc3fulAlITRNOvDGTPoAs6EFszLaXRc` | Production (and Preview) |

5. Click **Save**
6. **Redeploy** your application (or wait for next git push)

### 4. Test Locally First

```bash
npm run dev
```

Then visit: http://localhost:3000/wordpress-sites

Click **"Connect with WordPress.com"** to test the OAuth flow.

## 🚀 After Completing All Steps

Your WordPress publishing will work in production when:
1. ✅ Database migration is run
2. ✅ Redirect URIs are added to WordPress.com app  
3. ✅ Environment variables are added to Vercel
4. ✅ Application is deployed

## Verification

Once everything is set up, you can post to WordPress.com in production by:
1. User logs in
2. User goes to WordPress Sites page
3. User clicks "Connect with WordPress.com"
4. User authorizes your app
5. User's sites appear in dashboard
6. User can publish content to any connected site

## Need Help?

- Check `PRODUCTION_WORDPRESS_OAUTH.md` for detailed guide
- Check `QUICK_START_OAUTH.md` for quick reference
- Monitor Vercel logs for any errors
- Test locally first before deploying to production

