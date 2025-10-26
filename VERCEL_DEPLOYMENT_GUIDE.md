# Vercel Deployment Guide for WordPress Integration

## Prerequisites
- WordPress site hosted and accessible
- Required WordPress plugins installed
- Environment variables ready

## Step 1: Deploy to Vercel

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add the following variables:

```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-domain.com
NEXT_PUBLIC_WORDPRESS_API_HOSTNAME=your-wordpress-domain.com
NEXT_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
WP_USER=your-wordpress-username
WP_APP_PASS=your-application-password
HEADLESS_SECRET=your-random-secret-key
```

## Step 2: WordPress Configuration

1. **Update WordPress URLs:**
   - WordPress Address (URL): `https://your-wordpress-domain.com`
   - Site Address (URL): `https://your-wordpress-domain.com`

2. **Install Required Plugins:**
   - WPGraphQL
   - WPGraphQL JWT Authentication
   - WPGraphQL SEO (optional)

3. **Create Application Password:**
   - Go to Users → Profile → Application Passwords
   - Create new password for your Next.js app

## Step 3: Test Production Integration

1. **Test WordPress API:**
   ```bash
   curl -X GET "https://your-wordpress-domain.com/wp-json/wp/v2/posts"
   ```

2. **Test GraphQL (if using):**
   ```bash
   curl -X POST https://your-wordpress-domain.com/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ posts { nodes { title } } }"}'
   ```

3. **Test Next.js App:**
   - Visit your Vercel deployment URL
   - Check `/blog` page for WordPress posts
   - Test individual blog post pages

## Step 4: Domain Configuration (Optional)

1. **Custom Domain Setup:**
   - Add your custom domain in Vercel
   - Update `NEXT_PUBLIC_BASE_URL` to your custom domain
   - Configure DNS records

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_BASE_URL=https://bridgely.io
   ```

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Add your Vercel domain to WordPress CORS settings
   - Or use a WordPress CORS plugin

2. **SSL Certificate Issues:**
   - Ensure WordPress site has valid SSL
   - Check certificate chain

3. **API Authentication:**
   - Verify application password is correct
   - Check WordPress user permissions

4. **GraphQL Not Working:**
   - Ensure WPGraphQL plugin is installed and activated
   - Check GraphQL endpoint accessibility

## Production Checklist

- [ ] WordPress site is live and accessible
- [ ] Required plugins are installed and activated
- [ ] SSL certificate is valid
- [ ] Application password is created
- [ ] Environment variables are set in Vercel
- [ ] Next.js app is deployed to Vercel
- [ ] Blog posts are displaying correctly
- [ ] Individual blog post pages work
- [ ] Sitemap is accessible at `/sitemap.xml`
- [ ] Robots.txt is accessible at `/robots.txt`
