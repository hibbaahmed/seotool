# 🚀 Inngest Blog Scheduling Setup Guide

This guide will help you set up automated blog post publishing using Inngest.

## 📋 Prerequisites

1. **Inngest Account**: Sign up at [inngest.com](https://inngest.com)
2. **Database**: Your Supabase database with the calendar schema
3. **Platform APIs**: Tokens for platforms you want to publish to

## 🔧 Setup Steps

### 1. Create Inngest App

1. Go to [Inngest Dashboard](https://app.inngest.com)
2. Create a new app called "Blog Scheduler"
3. Note down your **Event Key** and **Signing Key**

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Platform Publishing Tokens (optional)
WORDPRESS_TOKEN=your-wordpress-api-token
MEDIUM_TOKEN=your-medium-api-token
LINKEDIN_TOKEN=your-linkedin-api-token
TWITTER_TOKEN=your-twitter-api-token
LINKEDIN_PERSON_ID=your-linkedin-person-id
```

### 3. Database Setup

Run the calendar schema in your Supabase database:

```sql
-- Execute calendar_schema.sql
```

### 4. Deploy Your Functions

Your Inngest functions are automatically served at:
- **Development**: `http://localhost:3000/api/inngest`
- **Production**: `https://your-domain.com/api/inngest`

### 5. Configure Inngest

1. In your Inngest dashboard, go to **Apps** → **Your App**
2. Add your webhook URL: `https://your-domain.com/api/inngest`
3. Test the connection

## 🎯 How It Works

### Scheduling Flow

1. **User schedules a post** via the calendar interface
2. **Calendar API** saves the post to database
3. **Inngest event** is triggered with post details
4. **Inngest function** calculates publish time
5. **Post is published** automatically at scheduled time

### Event Types

- `blog/post.schedule` - When a post is scheduled
- `blog/post.publish` - When a post should be published
- `blog/post.cancel` - When a post is cancelled

### Platform Support

Currently supports publishing to:
- **WordPress** (via REST API)
- **Medium** (via Medium API)
- **LinkedIn** (via LinkedIn API)
- **Twitter/X** (via Twitter API v2)
- **Custom Blog** (your own platform)

## 🔍 Monitoring

### Inngest Dashboard

- View function executions
- Monitor success/failure rates
- Debug failed executions
- View execution logs

### Database Status

Check post status in your `scheduled_posts` table:
- `scheduled` - Waiting to be published
- `published` - Successfully published
- `cancelled` - Cancelled by user

## 🛠️ Customization

### Adding New Platforms

1. Add platform logic in `lib/inngest-functions.ts`
2. Update the `publishBlogPost` function
3. Add environment variables for API tokens

### Custom Publishing Logic

Modify the platform-specific functions:
- `publishToWordPress()`
- `publishToMedium()`
- `publishToLinkedIn()`
- `publishToTwitter()`
- `publishToBlog()`

### Error Handling

The system includes comprehensive error handling:
- Failed API calls are logged
- Posts remain in database even if publishing fails
- Retry logic can be added to Inngest functions

## 🚨 Troubleshooting

### Common Issues

1. **Functions not triggering**
   - Check Inngest webhook URL
   - Verify environment variables
   - Check function logs in Inngest dashboard

2. **Publishing fails**
   - Verify platform API tokens
   - Check API rate limits
   - Review error logs

3. **Posts not appearing**
   - Check database status
   - Verify platform-specific requirements
   - Test API connections manually

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 📊 Analytics

Track your scheduled posts:
- Total scheduled posts
- Success/failure rates
- Platform distribution
- Publishing trends

## 🔐 Security

- All API calls are authenticated
- User data is isolated via RLS
- Platform tokens are stored securely
- Inngest events are signed and verified

## 🎉 You're Ready!

Your blog scheduling system is now fully automated. Users can:
1. Create content with AI
2. Schedule posts for any future date/time
3. Choose publishing platform
4. Monitor post status
5. Cancel posts if needed

Posts will be published automatically at the scheduled time!



