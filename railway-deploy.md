# 🚂 Deploy to Railway (No Size Limits!)

Railway is perfect for your SEO tool because it has no strict bundle size limits and handles heavy dependencies well.

## 🚀 **Quick Setup**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
```

### **Step 3: Initialize Project**
```bash
railway init
```

### **Step 4: Set Environment Variables**
```bash
# Set all your API keys
railway variables set OPENROUTER_API_KEY=your_key_here
railway variables set TAVILY_API_KEY=your_key_here
railway variables set DATA_FOR_SEO_KEY=your_key_here
railway variables set SMITHERY_API_KEY=your_key_here
railway variables set FIRECRAWL_API_KEY=your_key_here
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url_here
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### **Step 5: Deploy**
```bash
railway up
```

## 📝 **Railway Configuration**

Create a `railway.toml` file in your project root:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[env]
NODE_ENV = "production"
```

## 🎯 **Benefits of Railway**

✅ **No bundle size limits** - Deploy your full Mastra setup
✅ **Git-based deployments** - Automatic deploys on push
✅ **Environment variables** - Easy secret management
✅ **Custom domains** - Free subdomain + custom domain support
✅ **Logs & monitoring** - Built-in logging and metrics
✅ **Database support** - Built-in PostgreSQL, Redis, etc.
✅ **Docker support** - Can use Docker if needed

## 💰 **Pricing**

- **Hobby Plan**: $5/month (perfect for your app)
- **Pro Plan**: $20/month (for production scaling)
- **Free trial**: $5 credit to start

## 🔄 **Migration from Vercel**

1. Keep your current codebase (no changes needed!)
2. Add Railway configuration
3. Set environment variables
4. Deploy with `railway up`
5. Update your domain DNS

Your app will work exactly the same, but without size restrictions!
