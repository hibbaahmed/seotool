# Calendar-Based Keyword Scheduling System

## Overview

This comprehensive calendar scheduling system allows you to schedule keywords for automatic content generation at 6 AM daily, generate content on-demand, and manage your content calendar efficiently.

## Features Implemented

### 1. **Keyword Scheduling to Calendar**
- Select keywords from your keyword dashboard
- Choose a date for content generation
- Keywords are automatically queued for generation at 6 AM on the selected date

### 2. **Automatic Daily Content Generation**
- Inngest cron job runs every day at 6:00 AM
- Automatically generates blog posts for all keywords scheduled for that day
- Uses Claude AI (Sonnet 3.5) for high-quality content generation
- Includes relevant images from Tavily search or Unsplash
- Saves generated content to the database

### 3. **Manual On-Demand Generation**
- Generate content immediately from the calendar view
- Click on any scheduled keyword and use "Generate Now" button
- Real-time status updates during generation

### 4. **Calendar Visualization**
- View all scheduled keywords and posts in a unified calendar interface
- Color-coded status indicators:
  - **Purple**: Pending keyword (not yet generated)
  - **Yellow**: Generating (content creation in progress)
  - **Green**: Generated/Published (content ready)
  - **Red**: Failed (generation error)
  - **Blue**: Scheduled posts

### 5. **Content Viewing & Management**
- Click on keywords to view details (search volume, difficulty, opportunity level)
- Direct links to view generated content
- Track generation status in real-time

## Architecture

### Database Schema

#### New Fields in `discovered_keywords` Table:
```sql
scheduled_date DATE                    -- Date when content should be generated
scheduled_for_generation BOOLEAN       -- Whether keyword is queued for generation
generation_status TEXT                 -- 'pending', 'generating', 'generated', 'failed'
generated_content_id UUID              -- Reference to generated content
generated_at TIMESTAMP                 -- When content was generated
```

### API Endpoints

#### 1. `/api/calendar/keywords` (GET, POST, PUT, DELETE)
- **GET**: Fetch scheduled keywords for a specific date or month
- **POST**: Schedule a keyword for generation
- **PUT**: Update scheduled keyword details
- **DELETE**: Remove keyword from schedule

#### 2. `/api/calendar/generate` (POST)
- Generate content for a keyword immediately (on-demand)
- Supports both keyword_id and direct keyword text
- Returns generated content with images

### Inngest Functions

#### 1. `dailyContentGeneration` (Cron Job)
- **Schedule**: `0 6 * * *` (Every day at 6 AM)
- **Purpose**: Automatically processes all keywords scheduled for today
- **Process**:
  1. Fetches all keywords scheduled for current date
  2. Triggers content generation for each keyword
  3. Updates keyword status as generation progresses

#### 2. `generateKeywordContent` (Event-Driven)
- **Event**: `calendar/keyword.generate`
- **Purpose**: Generate content for a single keyword
- **Process**:
  1. Updates keyword status to "generating"
  2. Searches for relevant images using Tavily API
  3. Uploads images to Supabase Storage
  4. Generates comprehensive blog post using Claude AI
  5. Saves content to `content_writer_outputs` table
  6. Links generated content to keyword
  7. Updates keyword status to "generated"

## User Workflow

### Scheduling Keywords for Generation

1. **Navigate to Keywords Dashboard** (`/dashboard/keywords`)
2. **Browse your discovered keywords** from the onboarding process
3. **Click "Add to Calendar"** button next to any keyword
4. **Select a date** in the date picker modal (must be today or future)
5. **Confirm scheduling** - keyword will be generated at 6 AM on that date

### Manual Generation from Calendar

1. **Navigate to Calendar** (`/calendar`)
2. **Click on any scheduled keyword** (shown with 🔑 icon and purple background)
3. **View keyword details** in the sidebar:
   - Keyword text
   - Generation status
   - Search metrics (volume, difficulty, opportunity)
   - Scheduled date
4. **Click "Generate Now"** to create content immediately
5. **Wait for generation** to complete (~30-60 seconds)
6. **View generated content** using the link provided

### Viewing Generated Content

1. **Click on a generated keyword** (green background) in the calendar
2. **Click "View Generated Article"** link in the sidebar
3. **Edit or publish** the content as needed

## Content Generation Process

### AI-Powered Content Creation
The system uses Claude AI (Sonnet 3.5) to generate:
- **SEO-optimized title** and meta description
- **Well-structured content** with H2 and H3 headings
- **1500-2500 words** of comprehensive, valuable content
- **Natural keyword integration** including related keywords
- **Actionable insights** and practical advice
- **Strong call-to-action** at the end

### Image Integration
- **Tavily API** searches for relevant images based on keyword
- **Fallback to Unsplash** if Tavily doesn't find images
- **Automatic upload** to Supabase Storage
- **3-5 images** per article
- **Suggested placement** throughout the content

## Configuration

### Environment Variables Required

```env
# Anthropic (Claude AI)
ANTHROPIC_API_KEY=your_claude_api_key

# Tavily (Image Search)
TAVILY_API_KEY=your_tavily_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Inngest (Scheduling)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Inngest Setup

1. **Create Inngest account** at https://www.inngest.com
2. **Connect your app** to Inngest
3. **Configure webhook endpoint**: `/api/inngest`
4. **Deploy functions** - they'll automatically register
5. **Monitor executions** in Inngest dashboard

## Database Migration

Run the migration SQL to add new fields to your database:

```bash
psql -h your-host -U your-user -d your-database -f calendar_keyword_scheduling_migration.sql
```

Or apply via Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `calendar_keyword_scheduling_migration.sql`
3. Run the query

## Components Modified/Created

### New Components
- `/app/api/calendar/keywords/route.ts` - API for keyword scheduling
- `/app/api/calendar/generate/route.ts` - API for on-demand generation

### Modified Components
- `/components/BlogCalendar.tsx` - Added keyword display and interactions
- `/app/calendar/page.tsx` - Added keyword details sidebar and generation
- `/app/dashboard/keywords/page.tsx` - Added date picker modal for scheduling
- `/lib/inngest-functions.ts` - Added daily generation and keyword generation functions
- `/lib/inngest.ts` - Added new event types
- `/onboarding_schema.sql` - Added new fields to discovered_keywords table

## Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Pending | Purple | Keyword scheduled, awaiting generation |
| Generating | Yellow | Content is being created right now |
| Generated | Green | Content successfully created and saved |
| Failed | Red | Generation encountered an error |

## Error Handling

The system includes comprehensive error handling:
- **Automatic retries** for failed API calls
- **Status updates** on failure
- **Error logging** for debugging
- **User notifications** for critical errors

## Performance Optimization

- **Indexed database queries** for fast lookups
- **Batch processing** of scheduled keywords
- **Async content generation** to avoid blocking
- **Efficient image uploading** with compression

## Future Enhancements

Potential improvements for this system:
1. **Bulk scheduling** - Schedule multiple keywords at once
2. **Recurring schedules** - Generate content weekly/monthly
3. **Custom generation time** - Choose time other than 6 AM
4. **Content templates** - Predefined structures for different content types
5. **Multi-language support** - Generate content in different languages
6. **WordPress auto-publish** - Automatically publish to WordPress after generation
7. **A/B testing** - Generate multiple versions and test performance

## Troubleshooting

### Keywords not generating at 6 AM
- Check Inngest function is deployed and active
- Verify cron schedule is correct: `0 6 * * *`
- Check Inngest logs for errors
- Ensure environment variables are set

### Manual generation fails
- Verify Claude API key is valid and has credits
- Check Supabase connection
- Review browser console for client-side errors
- Check `/api/calendar/generate` logs

### Generated content not appearing
- Verify content was saved to `content_writer_outputs` table
- Check `generated_content_id` is correctly linked
- Ensure user has permission to view saved content

## Support

For issues or questions:
1. Check Inngest dashboard for function execution logs
2. Review Supabase logs for database errors
3. Check browser console for client-side errors
4. Review Claude API usage and limits

## Summary

This calendar-based scheduling system provides a complete solution for automating your content creation workflow. Schedule keywords, let the system generate high-quality content automatically, or generate on-demand when needed. All with a beautiful, intuitive calendar interface.

