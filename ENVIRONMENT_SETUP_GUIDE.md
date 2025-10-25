# Environment Variables Configuration Guide

## Local Development Setup

Create a `.env.local` file in your project root with these values:

```env
# WordPress Integration - Local Development
NEXT_PUBLIC_WORDPRESS_API_URL=http://bridgely.local
NEXT_PUBLIC_WORDPRESS_API_HOSTNAME=bridgely.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# WordPress Authentication (for GraphQL)
WP_USER=admin
WP_APP_PASS=your-application-password-here

# Headless Secret (must match WordPress wp-config.php)
HEADLESS_SECRET=your-random-secret-key-here
```

## Production Setup

For production deployment (Vercel, Netlify, etc.), set these environment variables:

```env
# WordPress Integration - Production
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-domain.com
NEXT_PUBLIC_WORDPRESS_API_HOSTNAME=your-wordpress-domain.com
NEXT_PUBLIC_BASE_URL=https://bridgely.io

# WordPress Authentication (for GraphQL)
WP_USER=your-production-username
WP_APP_PASS=your-production-application-password

# Headless Secret (must match WordPress wp-config.php)
HEADLESS_SECRET=your-production-secret-key
```

## Step-by-Step Configuration

### 1. WordPress Application Password

1. **Go to WordPress Admin** → Users → Profile
2. **Scroll down to "Application Passwords"**
3. **Enter a name** (e.g., "Bridgely SEO Tool")
4. **Click "Add New Application Password"**
5. **Copy the generated password** (format: `xxxx xxxx xxxx xxxx`)
6. **Use this password** in your `WP_APP_PASS` variable

### 2. WordPress Username

- Use the **username** you created for WordPress admin
- This should match the user who has the application password

### 3. Headless Secret Key

Generate a random secret key:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

### 4. WordPress wp-config.php

Add these lines to your WordPress `wp-config.php` file:

```php
// Headless CMS Configuration
define('HEADLESS_SECRET', 'your-random-secret-key-here');
define('HEADLESS_URL', 'http://localhost:3000'); // For local development
// define('HEADLESS_URL', 'https://bridgely.io'); // For production

// GraphQL JWT Authentication
define('GRAPHQL_JWT_AUTH_SECRET_KEY', 'your-random-secret-key-here');
define('GRAPHQL_JWT_AUTH_CORS_ENABLE', true);
```

### 5. WordPress Site URLs

**For Local Development:**
- WordPress Address (URL): `http://bridgely.local`
- Site Address (URL): `http://bridgely.local`

**For Production:**
- WordPress Address (URL): `https://your-wordpress-domain.com`
- Site Address (URL): `https://your-wordpress-domain.com`

## Deployment Platforms

### Vercel Deployment

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add each variable** with the production values
3. **Redeploy** your application

### Netlify Deployment

1. **Go to Netlify Dashboard** → Your Site → Site Settings → Environment Variables
2. **Add each variable** with the production values
3. **Redeploy** your application

### Other Platforms

Set the environment variables in your hosting platform's dashboard or configuration file.

## Testing Your Configuration

### 1. Test WordPress Connection

```bash
# Test GraphQL endpoint
curl -X POST http://bridgely.local/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ posts { nodes { title } } }"}'
```

### 2. Test Next.js Application

```bash
# Start development server
npm run dev

# Visit these URLs:
# http://localhost:3000/blog
# http://localhost:3000/sitemap.xml
# http://localhost:3000/robots.txt
```

### 3. Check Environment Variables

Create a test API route to verify your environment variables:

```typescript
// app/api/test-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    wordpressUrl: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    hasWpUser: !!process.env.WP_USER,
    hasWpPass: !!process.env.WP_APP_PASS,
    hasSecret: !!process.env.HEADLESS_SECRET,
  });
}
```

Visit `http://localhost:3000/api/test-env` to verify your configuration.

## Common Issues & Solutions

### Issue 1: "GraphQL Connection Failed"
- **Solution**: Check WordPress URL and ensure WPGraphQL plugin is active
- **Verify**: Visit `http://bridgely.local/graphql` in browser

### Issue 2: "Authentication Failed"
- **Solution**: Verify WP_USER and WP_APP_PASS are correct
- **Check**: Application password is properly generated

### Issue 3: "CORS Error"
- **Solution**: Ensure `GRAPHQL_JWT_AUTH_CORS_ENABLE` is set to `true`
- **Check**: WordPress CORS settings

### Issue 4: "Posts Not Loading"
- **Solution**: Check WordPress site URL configuration
- **Verify**: Posts are published and not in draft status

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use different secrets** for development and production
3. **Rotate application passwords** regularly
4. **Limit WordPress user permissions** to minimum required
5. **Use HTTPS** in production for all URLs

## Next Steps

1. **Set up local environment** with the values above
2. **Test the integration** locally
3. **Deploy to production** with production values
4. **Monitor** for any issues
5. **Set up monitoring** for WordPress and Next.js applications
