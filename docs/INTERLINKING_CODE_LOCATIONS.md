# Interlinking Code Locations & Analysis Guide

## File Structure

### Core Interlinking Functions

1. **`lib/add-links-to-content.ts`** ⭐ MAIN FUNCTION
   - Server-side function: `addInternalLinksToContent(content, title, baseUrl)`
   - Used when publishing content to WordPress
   - Finds related posts by fetching all WordPress posts
   - Extracts phrases from related post titles
   - Matches and inserts links into content
   - Returns: `{ linkedContent: string, linksAdded: number }`

2. **`app/api/wordpress/link-content/route.ts`**
   - API endpoint: `POST /api/wordpress/link-content`
   - Used by client-side `LinkedContent` component
   - Takes: `{ content, slug }`
   - Fetches related posts via `/api/wordpress/related-posts`
   - Inserts links into HTML content

3. **`app/api/wordpress/related-posts/route.ts`**
   - API endpoint: `GET /api/wordpress/related-posts?slug={slug}&limit={n}`
   - Uses similarity algorithm to find related posts
   - Returns related posts based on categories, tags, keywords, and title overlap

4. **`components/LinkedContent.tsx`**
   - Client component that processes content on page load
   - Calls `/api/wordpress/link-content` to add links
   - Used in blog post pages for on-the-fly linking

5. **`lib/blog-interlinking.ts`**
   - Utility functions for content analysis
   - `extractKeywords()` - keyword extraction
   - `calculateContentSimilarity()` - similarity scoring
   - `findLinkOpportunities()` - find link insertion points

## Where Interlinking is Called

### Publishing Flow (Server-Side)

1. **`app/api/wordpress/blog/route.ts`** (Line 141)
   - Direct WordPress blog post creation
   - Calls `addInternalLinksToContent()` before publishing

2. **`app/api/wordpress/publish/route.ts`** (Lines 475, 484, 526)
   - General publish endpoint (content writer, SEO research, etc.)
   - Calls `addInternalLinksToContent()` for both WordPress.com and self-hosted
   - Called AFTER markdown-to-HTML conversion

3. **`app/api/calendar/generate/route.ts`** (Line 626)
   - Calendar keyword generation
   - Auto-publishes to WordPress
   - Calls `addInternalLinksToContent()` before publishing

### Viewing Flow (Client-Side)

4. **`app/blog/[slug]/page.tsx`** (Line 201)
   - Blog post page
   - Uses `LinkedContent` component for on-the-fly linking
   - Links appear when viewing, not saved to WordPress

## How It Works

### Step-by-Step Process

1. **Finding Related Posts:**
   ```
   Fetch all WordPress posts (limit 50)
   ↓
   Extract keywords from current article title
   ↓
   Calculate similarity with each post
   ↓
   Filter posts with similarity > 0.1
   ↓
   Sort by similarity (highest first)
   ↓
   Take top 3 posts
   ```

2. **Extracting Linkable Phrases:**
   ```
   From each related post title:
   - Extract capitalized words (brand names like "Synthesia")
   - Extract important words (>4 chars)
   - Create 2-word phrases
   - Prioritize capitalized words (brand names)
   ```

3. **Matching & Linking:**
   ```
   For each phrase:
   - Search content for phrase (case-insensitive)
   - Check if not inside existing link/tag/iframe
   - Insert link at first match
   - Max 3 links per article
   ```

## Debugging: Why Links Might Not Appear

### Check These Points:

1. **Are posts being fetched?**
   - Check console logs: `🔗 Found X posts to check for linking opportunities`
   - Verify `/api/wordpress/posts` returns your articles

2. **Are similar posts found?**
   - Check console logs: `✅ Found X similar posts to link to`
   - Verify similarity threshold (currently 0.1)

3. **Are phrases matching?**
   - Check console logs: `✅ Linked "phrase" to post: Title`
   - Verify the phrase exists in your content

4. **Content format:**
   - Is content HTML or Markdown?
   - Linking works on HTML, so markdown must be converted first

5. **Timing issue:**
   - If publishing new article, older articles should exist first
   - Related posts are fetched from WordPress, so they must be published

### Common Issues:

- **Issue:** Links not appearing in published WordPress content
  - **Check:** Is `addInternalLinksToContent()` being called during publish?
  - **Location:** `app/api/wordpress/publish/route.ts` line 475/484/526

- **Issue:** Links not appearing when viewing on website
  - **Check:** Is `LinkedContent` component used?
  - **Location:** `app/blog/[slug]/page.tsx` line 201

- **Issue:** Brand names like "Synthesia" not linking
  - **Check:** Are capitalized words being extracted?
  - **Location:** `lib/add-links-to-content.ts` lines 85-135

## Testing the Interlinking

### Manual Test:

1. Check if posts are fetched:
   ```bash
   curl http://localhost:3000/api/wordpress/posts?limit=10
   ```

2. Check related posts for a slug:
   ```bash
   curl "http://localhost:3000/api/wordpress/related-posts?slug=your-article-slug&limit=3"
   ```

3. Test linking API:
   ```bash
   curl -X POST http://localhost:3000/api/wordpress/link-content \
     -H "Content-Type: application/json" \
     -d '{"content": "Your HTML content with Synthesia mentioned", "slug": "your-slug"}'
   ```

## Key Configuration

- **Max links per article:** 3
- **Similarity threshold:** 0.1 (10%)
- **Posts fetched:** 50
- **Brand name detection:** Capitalized words ≥5 chars
- **Phrase matching:** 2-word phrases + single brand names

