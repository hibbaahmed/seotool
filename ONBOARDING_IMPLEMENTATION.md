# Onboarding & Keyword Discovery Implementation Guide

## Overview

This implementation provides a comprehensive onboarding process that scans competitors, your site, Google trends, and SERP data to generate a complete keyword list with opportunity ratings (low/medium/high), similar to RankPill's functionality.

## 🏗️ Architecture

### Database Schema
- **`user_onboarding_profiles`**: Stores user onboarding information and progress
- **`discovered_keywords`**: Stores all discovered keywords with metrics
- **`competitor_analysis`**: Stores competitor analysis results
- **`site_analysis`**: Stores site analysis data
- **`trends_analysis`**: Stores Google trends and SERP analysis
- **`keyword_opportunities`**: Stores detailed opportunity scoring

### API Endpoints
- **`/api/onboarding`**: Main onboarding analysis endpoint
- **`/api/ai/seo-research`**: Existing SEO research endpoint (enhanced)
- **`/api/competitive-analysis`**: Existing competitive analysis endpoint

### UI Components
- **`/onboarding`**: Multi-step onboarding flow
- **`/dashboard/keywords`**: Keyword dashboard (RankPill-style interface)

## 🚀 Implementation Steps

### 1. Database Setup

Run the onboarding schema:
```sql
-- Execute the onboarding_schema.sql file
psql -d your_database -f onboarding_schema.sql
```

### 2. Environment Variables

Add to your `.env.local`:
```env
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key  # Optional for image search
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Authentication Flow Integration

The system automatically:
- Redirects new users to `/onboarding` after signup
- Checks onboarding completion status
- Redirects completed users to `/dashboard`

### 4. Onboarding Process

#### Step 1: Website Input
- User enters website URL
- Validates URL format
- Shows analysis preview

#### Step 2: Business Information
- Business name (required)
- Industry selection (required)
- Business description (optional)

#### Step 3: Target Audience
- Detailed audience description (required)
- Shows keyword discovery process explanation

#### Step 4: Analysis
- Real-time progress tracking
- Competitor analysis
- Site analysis
- Google trends analysis
- SERP analysis
- Keyword scoring

#### Step 5: Results
- Summary statistics
- Redirect to keyword dashboard

## 🔍 Analysis Components

### Competitor Analysis
- Identifies top 5-10 competitors
- Extracts their ranking keywords
- Analyzes domain authority and traffic
- Finds content gaps

### Site Analysis
- Analyzes current keyword rankings
- Identifies technical SEO issues
- Finds content gaps
- Discovers missing opportunities

### Google Trends Analysis
- Identifies trending keywords
- Finds seasonal patterns
- Discovers emerging opportunities
- Analyzes search volume trends

### SERP Analysis
- Analyzes search result pages
- Identifies content gaps
- Finds featured snippet opportunities
- Analyzes search intent

### Keyword Scoring System
Keywords are scored based on:
- **Search Volume** (0-30 points)
- **Difficulty** (0-30 points)
- **Source** (0-20 points)
- **Keyword Intent** (0-20 points)

**Opportunity Levels:**
- **High**: 70+ points
- **Medium**: 40-69 points
- **Low**: <40 points

## 📊 Keyword Dashboard Features

### Statistics Cards
- Total Keywords
- Recommended (High opportunity)
- Starred keywords
- Queued for generation
- Generated content

### Filtering & Sorting
- Search by keyword
- Filter by opportunity level
- Sort by volume, difficulty, opportunity
- Export functionality

### Keyword Table
- Keyword with star/unstar
- Opportunity level badge
- Difficulty score
- Search volume
- CPC (Cost Per Click)
- Source with icon
- Add to calendar action

## 🔧 Customization Options

### Adding New Analysis Sources
1. Extend the `performComprehensiveAnalysis` function
2. Add new analysis type to database schema
3. Update the progress tracking UI

### Custom Scoring Algorithms
Modify the `scoreKeywords` function to implement:
- Industry-specific scoring
- Custom difficulty calculations
- Advanced opportunity metrics

### Integration with External APIs
The system is designed to integrate with:
- **SEMrush API**: For real keyword data
- **Ahrefs API**: For competitor analysis
- **Google Search Console**: For site performance
- **Google Trends API**: For trending data

## 🎯 Usage Flow

1. **User signs up** → Redirected to onboarding
2. **Enters website** → System validates URL
3. **Provides business info** → Industry and audience data
4. **Starts analysis** → Real-time progress tracking
5. **Views results** → Complete keyword list with opportunities
6. **Uses dashboard** → Manages keywords, creates content

## 🔒 Security & Privacy

- Row Level Security (RLS) enabled on all tables
- User data isolation
- Secure API key handling
- Input validation and sanitization

## 📈 Performance Optimizations

- Parallel analysis execution
- Database indexing on key fields
- Caching for repeated analyses
- Streaming responses for real-time updates

## 🚨 Error Handling

- Graceful API failures
- User-friendly error messages
- Retry mechanisms
- Fallback data sources

## 🔄 Future Enhancements

### Phase 2 Features
- **Real-time monitoring**: Track keyword rankings
- **Content suggestions**: AI-powered content ideas
- **Competitor alerts**: Monitor competitor changes
- **ROI tracking**: Measure keyword performance

### Phase 3 Features
- **Team collaboration**: Multi-user keyword management
- **White-label solution**: Rebrand for agencies
- **API access**: Third-party integrations
- **Advanced analytics**: Detailed performance metrics

## 📝 API Documentation

### POST /api/onboarding
```json
{
  "websiteUrl": "https://example.com",
  "businessName": "Example Corp",
  "industry": "technology",
  "targetAudience": "small business owners",
  "businessDescription": "We help businesses grow"
}
```

### Response
```json
{
  "success": true,
  "onboardingProfileId": "uuid",
  "analysisResults": {
    "totalKeywords": 162,
    "highOpportunityKeywords": 45,
    "mediumOpportunityKeywords": 78,
    "lowOpportunityKeywords": 39,
    "competitorsAnalyzed": 8,
    "siteIssuesFound": 12,
    "contentGapsIdentified": 25
  }
}
```

## 🎨 UI/UX Features

### Onboarding Flow
- **Progress indicators**: Visual step tracking
- **Real-time updates**: Live progress during analysis
- **Error handling**: Clear error messages
- **Mobile responsive**: Works on all devices

### Keyword Dashboard
- **RankPill-style interface**: Familiar design patterns
- **Interactive elements**: Star, queue, filter actions
- **Data visualization**: Charts and statistics
- **Export options**: Download keyword lists

## 🔧 Maintenance

### Regular Tasks
- Monitor API rate limits
- Update competitor databases
- Refresh keyword data
- Optimize database queries

### Monitoring
- Track analysis success rates
- Monitor API performance
- User engagement metrics
- Error rate tracking

This implementation provides a complete, production-ready onboarding and keyword discovery system that rivals commercial solutions like RankPill while being fully customizable for your specific needs.
