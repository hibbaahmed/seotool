# WordPress CMS Integration Setup Guide

This guide will help you set up WordPress as a headless CMS for your bridgely.io website using the Vercel WordPress integration pattern.

## WordPress Setup

### 1. WordPress Configuration

1. **Set Site Address (URL)** to your frontend URL in Settings → General
   - For development: `http://localhost:3000`
   - For production: `https://bridgely.io`

2. **Set Permalinks** to "Post name" in Settings → Permalinks

3. **Set Sample page as Static page** in Settings → Reading

4. **Create a 404 page** called "404 not found" with slug "404-not-found"

### 2. Required WordPress Plugins

Install and activate these plugins:

- **WPGraphQL** - GraphQL API for WordPress
- **WPGraphQL JWT Authentication** - Authentication for GraphQL
- **WPGraphQL SEO** - SEO data for GraphQL
- **Yoast SEO** - SEO optimization
- **Classic Editor** - Better editing experience
- **Redirection** - URL redirections

### 3. WordPress Configuration

Add these constants to your `wp-config.php`:

```php
define('HEADLESS_SECRET', 'INSERT_RANDOM_SECRET_KEY');
define('HEADLESS_URL', 'INSERT_LOCAL_DEVELOPMENT_URL'); // http://localhost:3000 for local development
define('GRAPHQL_JWT_AUTH_SECRET_KEY', 'INSERT_RANDOM_SECRET_KEY');
define('GRAPHQL_JWT_AUTH_CORS_ENABLE', true);
```

### 4. Yoast SEO Configuration

1. Disable XML Sitemaps under Yoast SEO → Settings
2. Generate a robots.txt file under Yoast SEO → Tools → File Editor
3. Modify robots.txt sitemap reference from `wp-sitemap.xml` to `sitemap.xml`
4. Enable Public Introspection under GraphQL → Settings

### 5. WordPress Theme

Create a minimal WordPress theme with these files:

**style.css:**
```css
/*
Theme Name: Bridgely Headless
Description: Minimal theme for headless WordPress
Version: 1.0
*/
```

**functions.php:**
```php
<?php
// Add the functions.php content from the Vercel example
// This includes menu registration, REST API customization, 
// preview link customization, and cache revalidation
?>
```

## Next.js Setup

### 1. Environment Variables

Create a `.env.local` file with these variables:

```env
# WordPress Integration
NEXT_PUBLIC_WORDPRESS_API_URL=http://your-wordpress-site.com
NEXT_PUBLIC_WORDPRESS_API_HOSTNAME=your-wordpress-site.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# WordPress Authentication (for GraphQL)
WP_USER=your-wordpress-username
WP_APP_PASS=your-application-password

# Headless Secret (must match WordPress wp-config.php)
HEADLESS_SECRET=your-random-secret-key
```

### 2. WordPress User Setup

1. Create a WordPress user specifically for the headless integration
2. Generate an application password for this user:
   - Go to Users → Profile → Application Passwords
   - Create a new application password
   - Use this password in your `WP_APP_PASS` environment variable

### 3. Features Included

✅ **GraphQL Integration** - Modern data fetching with Apollo Client
✅ **Dynamic Routing** - Automatic blog post pages at `/blog/[slug]`
✅ **SEO Optimization** - Dynamic meta tags and Open Graph data
✅ **Sitemap Generation** - Automatic XML sitemap at `/sitemap.xml`
✅ **Robots.txt** - SEO-friendly robots.txt at `/robots.txt`
✅ **Cache Revalidation** - Automatic cache updates when WordPress content changes
✅ **Draft Preview** - Preview unpublished content
✅ **Image Optimization** - Next.js Image component integration

### 4. Testing the Integration

1. Start your Next.js development server: `npm run dev`
2. Visit `http://localhost:3000/blog` to see your WordPress posts
3. Click on any post to view the dynamic post page
4. Check `http://localhost:3000/sitemap.xml` for your sitemap
5. Check `http://localhost:3000/robots.txt` for your robots file

### 5. Production Deployment

1. Update environment variables for production
2. Ensure WordPress site URL points to your production domain
3. Deploy to Vercel or your preferred platform
4. Test all functionality in production

## Benefits of This Integration

- **Better Performance** - GraphQL reduces over-fetching
- **SEO Optimized** - Dynamic meta tags and structured data
- **Developer Experience** - Type-safe GraphQL queries
- **Content Management** - Full WordPress admin for content creators
- **Automatic Updates** - Cache revalidation keeps content fresh
- **Scalable** - Handles high traffic with Next.js optimization

## Troubleshooting

### Common Issues

1. **GraphQL Connection Failed**
   - Check WordPress URL and authentication credentials
   - Ensure WPGraphQL plugin is active
   - Verify CORS settings

2. **Posts Not Loading**
   - Check WordPress site URL configuration
   - Verify user permissions
   - Check application password

3. **SEO Not Working**
   - Ensure Yoast SEO is configured
   - Check meta tag generation
   - Verify Open Graph settings

### Support

For issues specific to this integration, check:
- [Vercel WordPress Example](https://github.com/vercel/next.js/tree/canary/examples/cms-wordpress)
- [WPGraphQL Documentation](https://www.wpgraphql.com/)
- [Next.js Documentation](https://nextjs.org/docs)
