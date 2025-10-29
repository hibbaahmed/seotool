# WordPress.com OAuth Production Setup

This guide ensures your WordPress.com OAuth integration works correctly in production.

## Changes Made

I've updated the OAuth implementation to automatically handle different environments:

### Before
- `WPCOM_REDIRECT_URI` was a hardcoded environment variable
- Needed different values for localhost and production
- Created confusion with multiple redirect URIs

### After
- Redirect URI is now **dynamically determined** based on request origin
- Works automatically for both localhost and production
- No need for `WPCOM_REDIRECT_URI` environment variable

## Required Setup for Production

### 1. Register Your App with WordPress.com

Go to: https://developer.wordpress.com/apps/

Click "Create New Application":
- **Name**: Your App Name (e.g., "Bridgely SEO Tool")
- **Description**: Description of your app
- **Website URL**: Your production URL (e.g., `https://bridgely.io`)
- **Redirect URLs**: Add BOTH:
  ```
  http://localhost:3000/api/wordpress/wpcom/callback
  https://your-production-domain.com/api/wordpress/wpcom/callback
  ```
- **Type**: Web

**Save your credentials:**
- Client ID
- Client Secret (you'll only see this once!)

### 2. Environment Variables

#### For Local Development (.env.local)

```env
WPCOM_CLIENT_ID="your-client-id"
WPCOM_CLIENT_SECRET="your-client-secret"
```

#### For Production (Vercel/Your Host)

In your hosting platform's environment variables settings:
```env
WPCOM_CLIENT_ID="your-client-id"
WPCOM_CLIENT_SECRET="your-client-secret"
```

**Important:** You no longer need `WPCOM_REDIRECT_URI` - it's now automatic!

### 3. Verify Database Migration

Run this in your Supabase SQL Editor (if not already done):

```sql
ALTER TABLE wordpress_sites 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'self_hosted' CHECK (provider IN ('self_hosted', 'wpcom')),
ADD COLUMN IF NOT EXISTS site_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

ALTER TABLE wordpress_sites 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;
```

### 4. How It Works

#### Login Flow (Dynamic Redirect)
```
User clicks "Connect with WordPress.com"
    ↓
Server detects origin (localhost or production URL)
    ↓
Redirects to WordPress.com with appropriate callback URL
    ↓
WordPress.com redirects back to origin-specific callback
    ↓
User's sites are fetched and stored
```

#### Code Changes
- **`app/api/wordpress/wpcom/login/route.ts`**: Dynamically constructs redirect URI
- **`app/api/wordpress/wpcom/callback/route.ts`**: Uses dynamic redirect URI for token exchange
- **`env.example`**: Removed `WPCOM_REDIRECT_URI` requirement

## Testing in Production

### 1. Local Testing
```bash
npm run dev
```
Visit: http://localhost:3000/wordpress-sites
- Click "Connect with WordPress.com"
- Should redirect to WordPress.com
- After authorization, redirects back to localhost

### 2. Production Testing
Deploy your app, then:
1. Visit: https://your-production-domain.com/wordpress-sites
2. Click "Connect with WordPress.com"
3. Should redirect to WordPress.com
4. After authorization, redirects back to your production domain

## Troubleshooting

### "OAuth not configured" Error
**Cause:** Missing `WPCOM_CLIENT_ID` or `WPCOM_CLIENT_SECRET`
**Solution:**
1. Check environment variables in Vercel
2. Ensure variables are set for production environment
3. Redeploy after adding variables

### "Invalid redirect URI" Error
**Cause:** Redirect URI in WordPress.com app settings doesn't match
**Solution:**
1. Go to https://developer.wordpress.com/apps/
2. Edit your application
3. Add **both** redirect URIs:
   - `http://localhost:3000/api/wordpress/wpcom/callback` (for dev)
   - `https://your-domain.com/api/wordpress/wpcom/callback` (for production)
4. Make sure URLs match **exactly** (no trailing slashes)

### "State parameter" Error
**Cause:** Cross-domain cookie issues or timing out
**Solution:**
- Complete OAuth flow within 10 minutes
- Ensure cookies are enabled
- Check browser console for cookie errors

### Sites Not Appearing
**Cause:** User has no WordPress.com sites or sites are private
**Solution:**
- User needs at least one public WordPress.com site
- Private sites won't appear in the OAuth scope

## Security Features

Your OAuth implementation includes:
- ✅ **State parameter**: CSRF protection via random state token
- ✅ **HTTP-only cookies**: Prevents XSS attacks on state token
- ✅ **Secure cookies in production**: Only sent over HTTPS
- ✅ **User validation**: All requests validate user authentication
- ✅ **Short-lived state**: 10-minute expiration on OAuth state
- ✅ **Encrypted tokens**: Stored securely in Supabase database

## Environment-Specific Behavior

The redirect URI is now determined automatically:

| Environment | Origin Detection | Redirect URI |
|-------------|-----------------|--------------|
| Local Dev   | `http://localhost:3000` | `http://localhost:3000/api/wordpress/wpcom/callback` |
| Production  | `https://your-domain.com` | `https://your-domain.com/api/wordpress/wpcom/callback` |
| Preview     | `https://preview.vercel.app` | `https://preview.vercel.app/api/wordpress/wpcom/callback` |

This means your app will work correctly in:
- Local development
- Production
- Vercel preview deployments
- Any other domain

## Next Steps

1. ✅ Add environment variables to your production host
2. ✅ Add both redirect URIs to WordPress.com app
3. ✅ Deploy your application
4. ✅ Test OAuth flow in production
5. ✅ Monitor for any errors in production logs

## References

- [WordPress.com OAuth Documentation](https://developer.wordpress.com/docs/oauth2/)
- [WordPress.com REST API](https://developer.wordpress.com/docs/api/)
- [Your OAuth App Dashboard](https://developer.wordpress.com/apps/)


