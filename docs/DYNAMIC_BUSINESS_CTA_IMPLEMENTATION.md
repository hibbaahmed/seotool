# Dynamic Business CTA Implementation

## Overview

This document describes the implementation of dynamic, article-specific call-to-action (CTA) sections that are automatically added to the conclusion of every generated blog post. The CTA promotes the user's business in a contextual, natural way that ties directly to the specific challenges and strategies discussed in each article.

## Key Features

### 1. **Dynamic Business Information**
- Automatically pulls `business_name` and `website_url` from `user_onboarding_profiles` table
- No hardcoded company names (e.g., "Case Quota")
- Works for any business generating content through the platform

### 2. **Article-Specific Content**
The CTA section is NOT generic. Instead, it:
- **References specific topics** from the article (e.g., "the keyword research strategies," "technical SEO challenges")
- **Explains concrete solutions** to challenges mentioned in the article (not vague "success" or "results")
- **Uses article terminology** (if article mentions "local SEO" and "page speed," the CTA references those)
- **Provides specific outcomes** relevant to the article (e.g., "rank higher for competitive keywords" vs generic "grow your business")

### 3. **Natural Integration**
- Positioned in the Conclusion section after FAQ
- Feels like a natural extension of the article's content
- Avoids salesy or forced language
- Connects logically: Article teaches X → Business helps implement X → Call to action

## Implementation Details

### Database Schema
```sql
-- user_onboarding_profiles table contains:
business_name VARCHAR(255)  -- The company name to use in CTAs
website_url TEXT           -- The company website URL for CTAs
```

### Code Flow

1. **Content Generation Initiation** (`/app/api/calendar/generate/route.ts`)
   ```typescript
   // Fetch user's business info from onboarding profile
   const { data: profile } = await supabase
     .from('user_onboarding_profiles')
     .select('business_name, website_url')
     .eq('user_id', user.id)
     .single();
   
   const businessName = profile?.business_name || 'us';
   const websiteUrl = profile?.website_url || '';
   
   // Pass to content generation
   const generatedContent = await generateKeywordContentPrompt({
     businessName,
     websiteUrl,
     // ... other params
   });
   ```

2. **Prompt Generation** (`/lib/content-generation-prompts.ts`)
   ```typescript
   export interface ContentPromptOptions {
     businessName?: string;
     websiteUrl?: string;
     // ... other fields
   }
   
   // System prompt includes:
   ### Partner with ${businessName} for Success
   
   [Instructions for AI to create article-specific CTA that:]
   - References 2-3 SPECIFIC challenges from THIS article
   - Explains how ${businessName} provides SPECIFIC solutions
   - Uses concrete language about services
   - Includes article-relevant call-to-action
   ```

3. **Multi-Phase Generation** (`/lib/multi-phase-generation.ts`)
   ```typescript
   export interface MultiPhaseGenerationOptions {
     businessName?: string;
     websiteUrl?: string;
     // ... other fields
   }
   
   // Outline prompt includes CTA section in conclusion
   // Final sections prompt provides detailed instructions
   ```

4. **Content Writer API** (`/app/api/ai/content-writer/route.ts`)
   ```typescript
   // Accepts businessName and websiteUrl in POST body
   // Passes them through to handleMultiPhaseGeneration
   ```

## Prompt Instructions

### Key Requirements for AI
The prompts instruct the AI to:

1. **Be Specific, Not Generic**
   - ❌ "Partner with us for success"
   - ✅ "Implementing the keyword research strategies, technical SEO optimizations, and link building tactics we covered requires dedicated time and expertise. That's where [Business Name] comes in."

2. **Reference Article Content**
   - ❌ "We help businesses grow"
   - ✅ "Our team specializes in handling everything from keyword research and on-page optimization to technical audits and local SEO implementation"

3. **Provide Concrete Solutions**
   - ❌ "We provide expertise and support"
   - ✅ "We handle the keyword research, content optimization, and technical SEO audits so you can focus on running your business"

4. **Use Specific Outcomes**
   - ❌ "Achieve better results"
   - ✅ "Rank higher for competitive keywords, reduce page load times, and build authority backlinks"

5. **Create Contextual CTAs**
   - ❌ "Contact us to get started"
   - ✅ "Visit [Website] to get expert guidance on implementing these SEO strategies for your law firm"

## Example Output

### For an SEO Article:
```markdown
## Conclusion

[Key takeaways and final advice...]

### Partner with Legal SEO Pros for Success

Implementing the comprehensive keyword research strategies, technical optimizations, and content marketing approaches we covered in this guide requires significant time, expertise, and ongoing effort. That's where Legal SEO Pros comes in. Our team specializes in helping law firms navigate every aspect of SEO—from in-depth keyword analysis and on-page optimization to local search domination and authoritative link building. We handle the technical complexities and strategic execution so you can focus on serving your clients while we drive qualified traffic to your practice. Visit legalseopros.com to schedule a free SEO audit and discover how we can help your firm rank at the top of search results.
```

### For an Email Marketing Article:
```markdown
## Conclusion

[Key takeaways and final advice...]

### Partner with Email Growth Agency for Success

Building the automated workflows, segmentation strategies, and personalization systems discussed in this article can be overwhelming for busy entrepreneurs. Email Growth Agency takes the complexity out of email marketing. We design and implement conversion-focused campaigns, set up advanced automation sequences, and continuously optimize your strategy based on data—everything from list growth tactics to A/B testing and deliverability optimization. Our clients typically see 3-5x increases in email revenue within 90 days. Visit emailgrowthagency.com to book a strategy call and learn how we can transform your email marketing into a reliable revenue engine.
```

## Files Modified

1. **`/lib/content-generation-prompts.ts`**
   - Added `businessName` and `websiteUrl` to `ContentPromptOptions` interface
   - Updated system prompt with detailed instructions for article-specific CTAs
   - Emphasized concrete, contextual language over generic terms

2. **`/lib/multi-phase-generation.ts`**
   - Added `businessName` and `websiteUrl` to `MultiPhaseGenerationOptions` interface
   - Updated outline prompt to include CTA section in conclusion
   - Updated final sections prompt with specific instructions for creating contextual CTAs
   - Passed parameters through to prompt generation functions

3. **`/app/api/calendar/generate/route.ts`**
   - Fetches `business_name` and `website_url` from `user_onboarding_profiles` table
   - Passes these values to `generateKeywordContentPrompt`
   - Passes them to the content-writer API for multi-phase generation

4. **`/app/api/ai/content-writer/route.ts`**
   - Accepts `businessName` and `websiteUrl` in POST request body
   - Passes them to `handleMultiPhaseGeneration`
   - Updates local prompt functions to include CTA instructions

## Benefits

1. **Personalized**: Each CTA is unique to the user's business
2. **Contextual**: CTAs reference specific article content, not generic platitudes
3. **Natural**: Feels like a helpful conclusion, not a forced sales pitch
4. **Scalable**: Works automatically for any business and any article topic
5. **Conversion-Focused**: Provides clear, article-relevant calls-to-action
6. **Authentic**: Uses concrete language about specific services/solutions

## Testing

To test the implementation:

1. Ensure your `user_onboarding_profiles` table has `business_name` and `website_url` populated
2. Generate a new blog post through the calendar
3. Check the Conclusion section for the "Partner with [Your Business] for Success" subsection
4. Verify it:
   - Uses your business name
   - References specific topics from the article
   - Provides concrete solutions (not generic "success" language)
   - Includes a relevant call-to-action with your website URL

## Future Enhancements

Potential improvements:
- Allow users to customize CTA style/tone in settings
- A/B test different CTA formats
- Add optional custom CTA templates per business
- Track CTA click-through rates
- Support multiple CTA variations for different article types

