# Environment Variables Guide for SEO Tool

## Required Environment Variables

### 1. **Supabase Configuration** (Required)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2. **AI Provider Configuration** (Required)
```bash
# Choose one AI provider
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
# OR
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. **Next.js Configuration** (Required)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXT_PUBLIC_URL=http://localhost:3000
```

## Optional Environment Variables

### 4. **Image Search APIs** (Optional - for enhanced image search)
```bash
TAVILY_API_KEY=your-tavily-api-key-here
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
```

### 5. **Payment Processing** (Optional - for subscriptions)
```bash
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_ENDPOINT_SECRET=whsec_your-stripe-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

### 6. **Facebook Conversions API** (Optional - for tracking)
```bash
FACEBOOK_PIXEL_ID=your-facebook-pixel-id
FACEBOOK_ACCESS_TOKEN=your-facebook-access-token
```

### 7. **WordPress Integration** (Optional - for testing)
```bash
WORDPRESS_DEFAULT_SITE_URL=https://your-test-site.com
WORDPRESS_DEFAULT_USERNAME=your-test-username
WORDPRESS_DEFAULT_PASSWORD=your-test-app-password
```

### 8. **Analytics** (Optional)
```bash
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
GOOGLE_SEARCH_CONSOLE_API_KEY=your-gsc-api-key
```

## How to Get API Keys

### **Supabase Setup**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the Project URL and anon key
5. Copy the service role key (keep this secret!)

### **Anthropic API Key**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up/login
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### **Tavily API Key** (for image search)
1. Go to [tavily.com](https://tavily.com)
2. Sign up for an account
3. Get your API key from the dashboard

### **Unsplash API Key** (for image search fallback)
1. Go to [unsplash.com/developers](https://unsplash.com/developers)
2. Create a new application
3. Copy the Access Key

### **Stripe Keys** (for payments)
1. Go to [stripe.com](https://stripe.com)
2. Create an account
3. Go to Developers → API Keys
4. Copy the Secret Key and Publishable Key
5. Set up webhooks and copy the endpoint secret

### **Facebook Conversions API** (for tracking)
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a Facebook App
3. Add Facebook Pixel
4. Generate an access token
5. Get your Pixel ID

## WordPress Integration Setup

### **For Users (No Environment Variables Needed)**
Users will add their WordPress sites through the UI:
1. Go to `/wordpress-sites` in your app
2. Click "Add Site"
3. Enter their WordPress site details
4. Use WordPress Application Passwords (not regular passwords)

### **WordPress Application Passwords**
1. In WordPress admin, go to Users → Profile
2. Scroll to "Application Passwords"
3. Create a new application password
4. Use this password (not the regular WordPress password)

## Environment File Setup

1. Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

2. Fill in your actual values:
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string

# Optional but recommended
TAVILY_API_KEY=your-tavily-key
UNSPLASH_ACCESS_KEY=your-unsplash-key
```

## Security Notes

- **Never commit `.env.local` to version control**
- **Keep API keys secret** - especially service role keys
- **Use different keys for development and production**
- **Rotate keys regularly**
- **Use environment-specific configurations**

## Production Deployment

For production deployment (Vercel, Railway, etc.):
1. Add environment variables in your hosting platform's dashboard
2. Use production URLs and keys
3. Set `NEXTAUTH_URL` to your production domain
4. Use production Stripe keys
5. Update Supabase RLS policies for production

## Testing Without All Keys

You can run the app with just the required variables:
- Supabase configuration
- Anthropic API key
- NextAuth configuration

The app will work for:
- ✅ AI content generation
- ✅ Competitive analysis
- ✅ SEO research
- ✅ Content saving
- ❌ Image search (needs Tavily/Unsplash)
- ❌ Payments (needs Stripe)
- ❌ WordPress publishing (users add their own sites)
