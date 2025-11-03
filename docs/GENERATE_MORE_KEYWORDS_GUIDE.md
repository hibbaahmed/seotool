# Generate More Keywords After Onboarding

## Overview

You can now generate additional keywords **after onboarding** using the new keyword generation feature! This allows you to continuously expand your keyword research without re-running the onboarding process.

---

## Features

### ✅ What You Can Do:

1. **Generate keywords for multiple seed terms** at once
2. **Filter by search volume** and difficulty
3. **Auto-classify** as primary, secondary, and long-tail
4. **Include question-based keywords** for FAQ content
5. **Save directly to your database** for immediate use
6. **View updated stats** in real-time

---

## How to Access

### Option 1: Keywords Dashboard

1. Go to **Dashboard → Keywords**
2. Click the **"Generate More Keywords"** button in the top right
3. You'll be taken to the keyword generation page

### Option 2: Direct URL

Navigate to: `/dashboard/keywords/generate`

---

## How to Use

### Step 1: Select Project

Choose which onboarding profile/project you want to generate keywords for.

The page will show your current keyword stats:
- Total keywords
- High opportunity count
- Primary/secondary/long-tail breakdown

### Step 2: Enter Seed Keywords

Add one or more seed keywords (topics you want to research):

**Examples:**
```
- seo tools
- keyword research
- content marketing strategy
- link building techniques
```

**Tips:**
- Use specific topics related to your industry
- Add 2-5 seed keywords for best results
- Can add more seeds by clicking "Add Keyword"

### Step 3: Configure Options (Optional)

Click **"Advanced Options"** to customize:

**Min Search Volume** (default: 0)
- Only get keywords with at least X monthly searches
- Example: Set to 500 for higher-volume keywords only

**Max Difficulty** (default: 100)
- Only get keywords with difficulty ≤ X
- Example: Set to 50 for easier-to-rank keywords

**Max Keywords per Seed** (default: 30)
- How many keywords to fetch per seed term
- Example: Set to 50 for more comprehensive research

**Include Questions** (default: on)
- Includes "how", "what", "why" variations
- Great for FAQ sections

**Include Related** (default: on)
- Includes related keyword variations
- Expands your research scope

### Step 4: Generate

Click **"Generate Keywords"** button.

The system will:
1. Fetch keywords from DataForSEO for each seed
2. Classify them as primary/secondary/long-tail
3. Filter by your criteria (volume, difficulty)
4. Save to your database
5. Show you the results

**Processing time:** 5-30 seconds depending on seed count

---

## What Gets Generated

### Keyword Classification:

**Primary Keywords** (1-3 per seed)
- Exact or very close match to your seed
- Highest search volume
- Target for title, H1, intro

**Secondary Keywords** (5-10 per seed)
- Related, 2-3 words, high volume
- Target for H2 headings, body

**Long-tail Keywords** (10-20 per seed)
- 4+ words, specific queries
- Target for H3, FAQ, specific sections

### Example Output:

```
Seed: "seo tools"

Generated:
✓ Primary: "seo tools", "best seo tools" (2)
✓ Secondary: "keyword research tools", "seo analysis" (8)
✓ Long-tail: "how to use seo tools", "free seo tools for beginners" (15)

Total: 25 keywords saved
```

---

## After Generation

### Automatic Redirect

After successful generation:
1. You'll see a success message
2. Stats update in real-time
3. Auto-redirect to keywords dashboard (3 seconds)

### View Your New Keywords

In the keywords dashboard, you'll see:
- All newly generated keywords
- Classified by type (primary/secondary/long-tail)
- Opportunity levels (high/medium/low)
- Search volume and difficulty

### Use in Content Generation

When you generate content, the system will:
1. **Check for classified keywords** in your database
2. **Use them automatically** in the AI prompt
3. **Structure content** around primary/secondary/long-tail keywords

---

## API Endpoints Created

### 1. Generate Keywords
**Endpoint:** `POST /api/keywords/generate`

**Request:**
```json
{
  "seedKeywords": ["seo tools", "keyword research"],
  "profileId": "your-profile-id",
  "minSearchVolume": 500,
  "maxDifficulty": 60,
  "maxKeywordsPerSeed": 30,
  "includeQuestions": true,
  "includeRelated": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully generated 45 keywords",
  "keywords": {
    "total": 45,
    "saved": 45,
    "byType": {
      "primary": 4,
      "secondary": 16,
      "longTail": 25
    },
    "byOpportunity": {
      "high": 12,
      "medium": 20,
      "low": 13
    }
  },
  "samples": {
    "primary": [...],
    "secondary": [...],
    "longTail": [...]
  }
}
```

### 2. Get Profile Stats
**Endpoint:** `GET /api/keywords/generate?profile_id=xxx`

**Response:**
```json
{
  "profile": {...},
  "stats": {
    "total": 150,
    "byType": {
      "primary": 12,
      "secondary": 45,
      "longTail": 78,
      "unclassified": 15
    },
    "byOpportunity": {
      "high": 35,
      "medium": 80,
      "low": 35
    }
  },
  "canGenerate": true
}
```

---

## Use Cases

### 1. Expand Content Calendar

**Scenario:** Need more topic ideas

**Steps:**
1. Generate keywords for broad topics
2. Review long-tail keywords
3. Schedule them in content calendar

### 2. Target New Topics

**Scenario:** Entering new market/niche

**Steps:**
1. Add seed keywords for new niche
2. Set min volume: 1000+
3. Generate and review opportunities

### 3. Find FAQ Questions

**Scenario:** Building FAQ section

**Steps:**
1. Enable "Include Questions"
2. Generate with your main topics
3. Use long-tail question keywords

### 4. Competitive Research

**Scenario:** Competitor targeting new keywords

**Steps:**
1. Add competitor's target keywords as seeds
2. Generate variations
3. Find gaps you can target

---

## Tips for Best Results

### ✅ Do's:

1. **Use specific seed keywords**
   - Good: "email marketing automation"
   - Not: "marketing"

2. **Start with 2-5 seeds**
   - More focused = better results
   - Can always generate more later

3. **Adjust filters based on your authority**
   - New site: maxDifficulty = 40
   - Established: maxDifficulty = 70

4. **Enable question keywords**
   - Great for FAQ and informational content

5. **Review samples before using**
   - Check that keywords align with your niche

### ❌ Don'ts:

1. **Don't use too broad seeds**
   - "business", "health", "technology"
   - Results will be too generic

2. **Don't set unrealistic filters**
   - Min volume: 100,000 = very few results
   - Max difficulty: 10 = almost nothing

3. **Don't generate too frequently**
   - DataForSEO has API limits
   - Generate once per topic is enough

---

## Troubleshooting

### Issue: No Keywords Generated

**Possible Causes:**
1. Filters too restrictive
2. Seed keyword has no volume
3. DataForSEO API error

**Solutions:**
- Lower min search volume
- Increase max difficulty
- Try different seed keywords
- Check DataForSEO API quota

### Issue: Too Many Low-Quality Keywords

**Possible Causes:**
1. Seed keyword too broad
2. No filters applied

**Solutions:**
- Use more specific seeds
- Set minSearchVolume: 500+
- Review and delete unwanted keywords

### Issue: Can't Find Project

**Possible Causes:**
1. Haven't completed onboarding
2. Profile deleted

**Solutions:**
- Complete onboarding first
- Check user_onboarding_profiles table

---

## Database Storage

Keywords are saved to `discovered_keywords` table with:

```sql
{
  keyword: "how to use seo tools",
  keyword_type: "long-tail",
  search_volume: 800,
  difficulty_score: 35,
  opportunity_level: "medium",
  source: "dataforseo",
  keyword_intent: "informational",
  monthly_trends: [{month: "2024-01", volume: 850}, ...],
  dataforseo_data: {...},
  keyword_data_updated_at: "2024-01-15T10:00:00Z"
}
```

---

## Integration with Content Generation

### Automatic Keyword Usage

When you generate content for a keyword:

1. **System checks database** for classified keywords
2. **Finds related keywords** (same parent_keyword_id)
3. **Structures AI prompt** with primary/secondary/long-tail
4. **Generates SEO-optimized content** with strategic keyword placement

### Example Content Prompt:

```
PRIMARY KEYWORDS (use in title, H1):
- "seo tools"
- "best seo tools"

SECONDARY KEYWORDS (use in H2 headings):
- "keyword research tools"
- "seo analysis software"

LONG-TAIL KEYWORDS (use in H3, FAQ):
- "how to use seo tools for beginners"
- "what are the best free seo tools"
```

---

## Comparison: Onboarding vs Manual Generation

### Onboarding Keywords:
- **Automatic** based on your website/industry
- **Comprehensive** competitor and SERP analysis
- **One-time** during setup
- **Broad coverage** of your niche

### Manual Generation:
- **On-demand** anytime you need more
- **Focused** on specific topics
- **Unlimited** generate as often as needed
- **Targeted expansion** into new areas

**Best Practice:** Use onboarding for foundation, manual generation for expansion

---

## API Cost Optimization

### DataForSEO API Calls:

Each generation makes:
- 1 search_volume call per batch
- 1 keywords_for_keywords call per batch
- Optional: 1 difficulty call

**Cost per seed:** ~2-3 API credits

**Tips to minimize costs:**
1. Generate multiple seeds in one batch
2. Use cached keywords when available
3. Set maxKeywordsPerSeed wisely (don't go too high)

---

## Summary

🎉 **You can now generate keywords anytime!**

**Quick Steps:**
1. Go to Keywords Dashboard
2. Click "Generate More Keywords"
3. Enter seed keywords
4. Customize options (optional)
5. Click Generate
6. Keywords saved and ready to use

**Result:** Continuous keyword expansion without re-onboarding! 🚀

---

## Files Created

📁 **API Endpoint:**
- `app/api/keywords/generate/route.ts`

📁 **UI Page:**
- `app/dashboard/keywords/generate/page.tsx`

📁 **Modified:**
- `app/dashboard/keywords/page.tsx` (added button)

📁 **Documentation:**
- `docs/GENERATE_MORE_KEYWORDS_GUIDE.md` (this file)

