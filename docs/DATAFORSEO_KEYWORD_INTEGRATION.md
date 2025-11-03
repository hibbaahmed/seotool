# DataForSEO Keyword Integration Guide

## Overview

This integration fetches **primary, secondary, and long-tail keywords** from DataForSEO and uses them strategically in content generation to match Outrank.so's SEO approach.

---

## What Was Implemented

### 1. DataForSEO Keyword Library (`lib/dataforseo-keywords.ts`)

**Main Functions:**

- **`fetchKeywordsFromDataForSEO(seedKeyword, locationCode, options)`**
  - Fetches comprehensive keyword data
  - Classifies keywords as primary, secondary, or long-tail
  - Returns structured keyword set

- **`getKeywordDifficulty(keywords, locationCode)`**
  - Gets difficulty scores for keyword list
  - Uses DataForSEO Labs API

- **`formatKeywordsForPrompt(keywordSet)`**
  - Formats keywords for AI content generation
  - Provides usage instructions for each type

- **`saveKeywordsToDatabase(keywordSet, projectId, userId)`**
  - Saves keywords to `discovered_keywords` table
  - Includes classification and metrics

### 2. Database Schema Updates (`migrations/add_keyword_type_and_dataforseo_fields.sql`)

**New Columns:**
```sql
keyword_type TEXT -- 'primary', 'secondary', 'long-tail'
monthly_trends JSONB -- Array of {month, volume} data
parent_keyword_id UUID -- Links to primary keyword
dataforseo_data JSONB -- Raw API response
keyword_data_updated_at TIMESTAMP -- Freshness tracking
```

**New View:**
```sql
keyword_groups -- Groups keywords by primary/secondary/long-tail
```

### 3. Calendar Generation Integration

**Updated:** `app/api/calendar/generate/route.ts`

- Automatically fetches DataForSEO keywords if not already present
- Falls back to existing `related_keywords` field
- Structures keywords for Outrank-style content

---

## Keyword Classification Logic

### Primary Keywords
- **Definition:** Main target keywords for the article
- **Characteristics:**
  - Exact match or very close to seed keyword
  - All seed words present in keyword
- **Usage:** Title, H1, first paragraph, conclusion
- **Example:** For seed "seo tools" → "seo tools", "best seo tools"

### Secondary Keywords
- **Definition:** Related high-volume keywords
- **Characteristics:**
  - 2-3 words
  - Search volume ≥ 500/month
  - Related to but not exact match of seed
- **Usage:** H2 headings, throughout body content
- **Example:** "keyword research tools", "seo analysis software"

### Long-Tail Keywords
- **Definition:** Specific, lower-volume queries
- **Characteristics:**
  - 4+ words OR
  - <500 searches/month with 3+ words
  - Specific intent
- **Usage:** H3 subsections, FAQ questions, specific examples
- **Example:** "how to use seo tools for beginners", "best free seo tools 2024"

---

## How It Works

### Step 1: Keyword Fetch

When content is generated:

```typescript
// 1. Check if keywords already classified in DB
const { data: relatedData } = await supabase
  .from('discovered_keywords')
  .select('keyword, keyword_type, search_volume')
  .or(`parent_keyword_id.eq.${keyword_id},id.eq.${keyword_id}`)
  .order('search_volume', { ascending: false });

// 2. If not found, fetch from DataForSEO
const keywordSet = await fetchKeywordsFromDataForSEO(keywordText, 2840, {
  includeQuestions: true,
  includeRelated: true,
  maxResults: 30
});
```

### Step 2: Classification

```typescript
function classifyKeyword(keyword, searchVolume, difficulty, seedKeyword) {
  const wordCount = keyword.split(' ').length;
  
  // Primary: exact or very close match
  if (keyword === seedKeyword || allSeedWordsPresent) {
    return 'primary';
  }
  
  // Long-tail: 4+ words OR low volume specific queries
  if (wordCount >= 4 || (searchVolume < 500 && wordCount >= 3)) {
    return 'long-tail';
  }
  
  // Secondary: high volume, related
  if (wordCount <= 3 && searchVolume >= 500) {
    return 'secondary';
  }
  
  return 'long-tail'; // Default
}
```

### Step 3: Content Generation

Keywords are passed to the AI prompt:

```
PRIMARY KEYWORDS (use in title, H1, first paragraph, conclusion):
- "seo tools"
- "best seo tools"

SECONDARY KEYWORDS (use in H2 headings, throughout body):
- "keyword research tools"
- "seo analysis software"
- "competitor analysis tools"

LONG-TAIL KEYWORDS (use in H3 subsections, FAQ questions):
- "how to use seo tools for beginners"
- "what are the best free seo tools"
- "seo tools for small business"
```

---

## DataForSEO API Endpoints Used

### 1. Search Volume
**Endpoint:** `/keywords_data/google_ads/search_volume/live`

**Purpose:** Get monthly search volume for seed keyword

**Payload:**
```json
[{
  "location_code": 2840,
  "keywords": ["seo tools"],
  "search_partners": true
}]
```

### 2. Keywords for Keywords
**Endpoint:** `/keywords_data/google_ads/keywords_for_keywords/live`

**Purpose:** Discover related keywords and suggestions

**Payload:**
```json
[{
  "location_code": 2840,
  "keywords": ["seo tools"],
  "search_partners": true,
  "include_serp_info": false
}]
```

### 3. Keyword Difficulty
**Endpoint:** `/dataforseo_labs/google/bulk_keyword_difficulty/live`

**Purpose:** Get SEO difficulty scores

**Payload:**
```json
[{
  "location_code": 2840,
  "keywords": ["seo tools", "keyword research"],
  "language_code": "en"
}]
```

---

## Database Schema

### discovered_keywords Table

```sql
CREATE TABLE discovered_keywords (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  difficulty_score INTEGER DEFAULT 0,
  keyword_type TEXT, -- NEW: 'primary', 'secondary', 'long-tail'
  monthly_trends JSONB, -- NEW: [{month: "2024-01", volume: 5000}]
  parent_keyword_id UUID, -- NEW: Links to primary keyword
  dataforseo_data JSONB, -- NEW: Raw API response
  keyword_data_updated_at TIMESTAMP, -- NEW: Last refresh
  cpc DECIMAL(10,2) DEFAULT 0.00,
  source TEXT NOT NULL,
  keyword_intent TEXT,
  related_keywords TEXT[],
  scheduled_date DATE,
  scheduled_for_generation BOOLEAN DEFAULT FALSE,
  generation_status TEXT DEFAULT 'pending',
  generated_content_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_keywords_type ON discovered_keywords(keyword_type);
CREATE INDEX idx_keywords_parent ON discovered_keywords(parent_keyword_id);
CREATE INDEX idx_keywords_data_updated ON discovered_keywords(keyword_data_updated_at);
```

---

## Usage Example

### Fetch Keywords for a Topic

```typescript
import { fetchKeywordsFromDataForSEO } from '@/lib/dataforseo-keywords';

const keywordSet = await fetchKeywordsFromDataForSEO(
  'seo tools',
  2840, // USA location code
  {
    includeQuestions: true, // Include question-based keywords
    includeRelated: true,   // Include related keywords
    maxResults: 50          // Max keywords to return
  }
);

console.log(`Found:
  Primary: ${keywordSet.primary.length}
  Secondary: ${keywordSet.secondary.length}
  Long-tail: ${keywordSet.longTail.length}
`);

// Output:
// Primary: ["seo tools", "best seo tools"]
// Secondary: ["keyword research tools", "seo analysis", ...]
// Long-tail: ["how to use seo tools", "best free seo tools 2024", ...]
```

### Format for Content Generation

```typescript
import { formatKeywordsForPrompt } from '@/lib/dataforseo-keywords';

const promptText = formatKeywordsForPrompt(keywordSet);

// Use in AI prompt:
const prompt = `
Write an article about: ${topic}

${promptText}

Follow these guidelines:
- Use PRIMARY keywords in title and first paragraph
- Use SECONDARY keywords in H2 headings
- Use LONG-TAIL keywords in H3 subsections and FAQ
`;
```

### Save to Database

```typescript
import { saveKeywordsToDatabase } from '@/lib/dataforseo-keywords';

await saveKeywordsToDatabase(
  keywordSet,
  projectId,
  userId
);

// Keywords are now stored with:
// - keyword_type classification
// - monthly_trends data
// - parent_keyword_id relationships
```

---

## Environment Variables

Required in `.env.local`:

```env
# DataForSEO Credentials
DATA_FOR_SEO_KEY=your_username:your_password
# OR base64 encoded:
DATA_FOR_SEO_KEY=base64_encoded_credentials

# Optional: Custom API base URL
DATAFORSEO_BASE_URL=https://api.dataforseo.com/v3
```

---

## Content Generation Flow

### Before (Old System):

```
Keyword: "seo tools"
Related: ["keyword research", "analytics"]

Generated Content:
- Generic title with keyword
- Limited keyword variations
- No structured approach
```

### After (DataForSEO Integration):

```
Keyword: "seo tools"

DataForSEO Fetch:
  Primary: ["seo tools", "best seo tools"]
  Secondary: ["keyword research tools", "seo software", ...]
  Long-tail: ["how to choose seo tools", "free vs paid seo tools", ...]

Generated Content:
  Title: "Best SEO Tools: A Complete Guide" (primary)
  
  H2: Keyword Research Tools (secondary)
    H3: How to Choose SEO Tools for Beginners (long-tail)
    H3: Free vs Paid SEO Tools Comparison (long-tail)
  
  H2: SEO Analysis Software (secondary)
    H3: What Makes a Good SEO Tool (long-tail)
    H3: Top SEO Tools for Small Business (long-tail)
  
  FAQ:
    Q: How to use SEO tools effectively? (long-tail)
    Q: What are the best free SEO tools? (long-tail)
```

---

## Benefits

### 1. Better SEO Performance
- Target multiple keyword variations
- Cover long-tail searches
- Higher ranking potential

### 2. Comprehensive Coverage
- 30-50 related keywords per topic
- Question-based keywords for FAQ
- Seasonal trends included

### 3. Data-Driven Content
- Real search volumes
- Accurate difficulty scores
- Monthly trend data

### 4. Database Efficiency
- Keywords cached in database
- Reusable across articles
- Parent-child relationships

### 5. Cost Optimization
- Fetch once, use many times
- Intelligent fallbacks
- No redundant API calls

---

## Troubleshooting

### Issue: No Keywords Returned

**Check:**
1. DataForSEO credentials in `.env.local`
2. API quota remaining
3. Keyword has search volume

**Solution:**
```typescript
// System falls back to related_keywords field if DataForSEO fails
secondaryKeywords = keywordData?.related_keywords || [];
```

### Issue: Wrong Keyword Classification

**Adjust Logic:**
```typescript
// In lib/dataforseo-keywords.ts
function classifyKeyword(keyword, searchVolume, difficulty, seedKeyword) {
  // Customize thresholds:
  const LONG_TAIL_THRESHOLD = 500; // Lower = more long-tail
  const MIN_WORD_COUNT_LONGTAIL = 4; // Higher = stricter
  
  // Your custom logic...
}
```

### Issue: API Rate Limit

**Solution:**
```typescript
// Check keyword_data_updated_at before fetching
const lastUpdated = keywordData.keyword_data_updated_at;
const hoursSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60);

if (hoursSinceUpdate < 24) {
  // Use cached data
} else {
  // Fetch fresh data
}
```

---

## Testing

### 1. Manual Test

```bash
# In your browser console or API client:
POST /api/calendar/generate
{
  "keyword_id": "your-keyword-id"
}

# Check console logs for:
# 📊 Found keyword group:
#   Primary: 2
#   Secondary: 8
#   Long-tail: 12
```

### 2. Database Verification

```sql
-- Check classified keywords
SELECT 
  keyword,
  keyword_type,
  search_volume,
  parent_keyword_id
FROM discovered_keywords
WHERE keyword_type IS NOT NULL
ORDER BY search_volume DESC;

-- Check keyword groups
SELECT * FROM keyword_groups LIMIT 10;
```

### 3. Content Quality Check

Generated content should have:
- [ ] Primary keyword in title
- [ ] Secondary keywords in H2 headings
- [ ] Long-tail keywords in H3 subsections
- [ ] Question keywords in FAQ section
- [ ] Natural keyword distribution

---

## Migration Instructions

### Step 1: Run Database Migration

```bash
# Connect to your Supabase database
# Run the migration file:
psql -h [host] -U [user] -d [database] -f migrations/add_keyword_type_and_dataforseo_fields.sql
```

### Step 2: Update Existing Keywords (Optional)

```typescript
// Script to classify existing keywords
import { fetchKeywordsFromDataForSEO, saveKeywordsToDatabase } from '@/lib/dataforseo-keywords';

async function classifyExistingKeywords() {
  const keywords = await fetchKeywordsFromDB();
  
  for (const keyword of keywords) {
    const keywordSet = await fetchKeywordsFromDataForSEO(keyword.keyword);
    await saveKeywordsToDatabase(keywordSet, keyword.project_id, keyword.user_id);
  }
}
```

### Step 3: Test Generation

```bash
# Generate content for a keyword that has no classification yet
# It should automatically fetch from DataForSEO and classify
```

---

## Future Enhancements

### Planned Features:

1. **Auto-Refresh Keywords**
   - Periodic updates of search volumes
   - Track trending keywords

2. **Keyword Clustering**
   - Group related keywords
   - Create content clusters

3. **SERP Analysis**
   - Analyze top-ranking pages
   - Extract keyword strategies

4. **Competition Tracking**
   - Monitor competitor keywords
   - Identify keyword gaps

5. **Content Optimization**
   - Suggest keywords for existing content
   - Update based on performance

---

## API Reference

### fetchKeywordsFromDataForSEO()

```typescript
async function fetchKeywordsFromDataForSEO(
  seedKeyword: string,
  locationCode?: number,
  options?: {
    includeQuestions?: boolean;
    includeRelated?: boolean;
    maxResults?: number;
  }
): Promise<KeywordSet>
```

**Returns:**
```typescript
{
  primary: EnrichedKeyword[],
  secondary: EnrichedKeyword[],
  longTail: EnrichedKeyword[],
  all: EnrichedKeyword[]
}
```

### EnrichedKeyword Interface

```typescript
interface EnrichedKeyword {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  type: 'primary' | 'secondary' | 'long-tail';
  monthlyTrends?: Array<{month: string; volume: number}>;
  relatedKeywords?: string[];
}
```

---

## Summary

✅ **Implemented:** DataForSEO keyword fetching and classification
✅ **Database:** Schema updated with keyword_type and related fields
✅ **Integration:** Automatic fetch during content generation
✅ **Fallback:** Uses existing related_keywords if API fails
✅ **Prompt:** Structured keyword strategy in AI prompt
✅ **Caching:** Keywords saved for reuse

Your content now automatically uses primary, secondary, and long-tail keywords from DataForSEO, matching Outrank.so's SEO approach! 🎯

