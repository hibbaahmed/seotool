# WordPress.com Production Setup Guide

## Step 1: Create WordPress.com Account

1. **Go to [wordpress.com](https://wordpress.com)**
2. **Click "Start your website"**
3. **Choose a plan:**
   - **Free:** `yourblog.wordpress.com` (limited plugins)
   - **Personal ($4/month):** Custom domain, plugins
   - **Premium ($8/month):** Advanced features

## Step 2: Set Up Your WordPress Site

1. **Choose your domain:**
   - Free: `bridgely.wordpress.com`
   - Custom: `your-domain.com` (with paid plan)

2. **Complete WordPress setup:**
   - Site title: "Bridgely Blog"
   - Tagline: "AI-Powered Content Creation"
   - Choose a theme

## Step 3: Install Required Plugins

1. **Go to WordPress Admin:**
   - URL: `https://yourblog.wordpress.com/wp-admin`
   - Login with your WordPress.com credentials

2. **Install WPGraphQL Plugin:**
   - Go to Plugins → Add New
   - Search "WPGraphQL"
   - Install and Activate

3. **Install Additional Plugins (Optional):**
   - WPGraphQL JWT Authentication
   - WPGraphQL SEO
   - Yoast SEO

## Step 4: Configure WordPress Settings

1. **Update Site URLs:**
   - Go to Settings → General
   - WordPress Address: `https://yourblog.wordpress.com`
   - Site Address: `https://yourblog.wordpress.com`

2. **Set Up Permalinks:**
   - Go to Settings → Permalinks
   - Choose "Post name" structure
   - Save changes

## Step 5: Create Application Password

1. **Go to Users → Profile**
2. **Scroll to "Application Passwords"**
3. **Create new password:**
   - Application name: "Bridgely SEO Tool"
   - Click "Add New Application Password"
   - **Copy the generated password** (you'll need this!)

## Step 6: Test WordPress API

Test that your WordPress site is accessible:

```bash
# Test REST API
curl -X GET "https://yourblog.wordpress.com/wp-json/wp/v2/posts"

# Test GraphQL (if WPGraphQL is installed)
curl -X POST https://yourblog.wordpress.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ posts { nodes { title } } }"}'
```

## Step 7: Create Some Test Content

1. **Go to Posts → Add New**
2. **Create a test blog post:**
   - Title: "Welcome to Bridgely Blog"
   - Content: "This is a test post for our WordPress integration"
   - Publish the post

## Step 8: Environment Variables for Production

Update your production environment variables:

```env
# Production Environment Variables
NEXT_PUBLIC_WORDPRESS_API_URL=https://yourblog.wordpress.com
NEXT_PUBLIC_WORDPRESS_API_HOSTNAME=yourblog.wordpress.com
NEXT_PUBLIC_BASE_URL=https://bridgely.io
WP_USER=your-wordpress-username
WP_APP_PASS=your-application-password-from-step-5
HEADLESS_SECRET=your-random-secret-key
```

## Troubleshooting

### Common Issues:

1. **Plugin Installation Issues:**
   - Free WordPress.com plans have limited plugin access
   - Upgrade to Personal plan for full plugin support

2. **API Access Issues:**
   - Check if REST API is enabled
   - Verify application password is correct

3. **SSL Certificate:**
   - WordPress.com includes free SSL
   - Ensure your domain uses HTTPS

## Next Steps

Once WordPress is set up:
1. Deploy your Next.js app to Vercel
2. Configure production environment variables
3. Test the integration
4. Set up custom domain (optional)
