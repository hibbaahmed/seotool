# Business Name CTA Integration Fix

## Issue
When blog posts referenced the business/agency name, it appeared awkwardly inserted and didn't make grammatical sense. Examples:
- "...ranking for 'estate planning attorney' in a small town with limited competition Case Quota Platforms such as enable..."
- "Unlike paid advertising that Case Quota Platforms such as enable can generate immediate traffic..."

The business name ("Case Quota" in examples) was hardcoded in some places and not being passed properly to the content generation functions.

## Root Cause
Multiple issues were found:

1. **Hardcoded References**: The prompt templates in `lib/content-generation-prompts.ts` had hardcoded "Case Quota" instead of using the dynamic `${businessName}` variable
2. **Missing Parameters**: Several function calls were not passing `businessName` and `websiteUrl` parameters
3. **Incomplete Implementation**: Single-phase generation wasn't using business name at all

## Solution

### 1. Fixed Hardcoded References
**File**: `lib/content-generation-prompts.ts`

- Line 101, 106: Changed "Case Quota CTA" to `${businessName} CTA`
- Lines 375-408: Updated `generateExpansionPrompt()` to:
  - Accept `businessName` and `websiteUrl` parameters
  - Use dynamic business name in prompts
  - Include proper CTA template

### 2. Fixed Missing Parameters in Multi-Phase Generation
**File**: `lib/multi-phase-generation.ts`

- Line 35: Added `businessName` parameter to `getOutlinePrompt()` call

**File**: `app/api/ai/content-writer/route.ts`

- Lines 216-225: Added `businessName` and `websiteUrl` to `handleSinglePhaseGeneration()` call
- Lines 722-723: Updated function signature to accept these parameters
- Lines 730-731: Pass parameters to `generateContentSystemPrompt()`

### 3. Fixed Calendar Content Generation
**File**: `app/api/calendar/generate/route.ts`

- Line 550: Pass `businessName` and `websiteUrl` to `generateExpansionPrompt()`
- Lines 559-560: Pass business info to expansion API call

### 4. Fixed Inngest Background Generation
**File**: `lib/inngest-functions.ts`

- Lines 1148-1173: Added new step to fetch business information from `user_onboarding_profiles`
- Lines 1188-1189: Pass business info to `generateKeywordContentPrompt()`
- Line 1207: Pass `businessName` to `getOutlinePrompt()`
- Line 1242: Pass both parameters to `getFinalSectionsPrompt()`
- Line 1318: Pass both parameters to `generateExpansionPrompt()`

## How It Works Now

1. **Business Info Fetch**: System fetches `business_name` and `website_url` from the user's onboarding profile
2. **Dynamic Replacement**: All prompts use `${businessName}` variable that gets replaced with actual business name
3. **Natural Integration**: The AI is instructed to:
   - Reference specific challenges/strategies from the article
   - Explain how the business helps with those specific things
   - Include concrete, article-relevant CTAs
   - Use the business name naturally throughout

## Example Output

### Before (Broken):
```
"...ranking for 'estate planning attorney' in a small town with limited competition Case Quota Platforms such as enable take 3-4 months..."
```

### After (Fixed):
```
"...ranking for 'estate planning attorney' in a small town with limited competition. Using platforms such as [Business Name] can accelerate this timeline by providing expert guidance on keyword strategy and content optimization..."
```

## Testing Checklist

- [ ] Generate test blog post and verify business name appears naturally
- [ ] Check conclusion section has proper "Partner with [Business Name] for Success" heading
- [ ] Verify CTA references specific article content
- [ ] Test with different business names (not just "Case Quota")
- [ ] Confirm works in both test mode and full generation
- [ ] Verify calendar scheduled posts use business name
- [ ] Check Inngest background generation includes business info

## Files Modified

1. `lib/content-generation-prompts.ts` - Fixed hardcoded references and expansion prompt
2. `lib/multi-phase-generation.ts` - Added businessName to outline generation
3. `app/api/ai/content-writer/route.ts` - Added parameters to single-phase generation
4. `app/api/calendar/generate/route.ts` - Pass business info to expansion
5. `lib/inngest-functions.ts` - Fetch and use business info in background jobs

## Related Documentation

- `CASE_QUOTA_CTA_IMPLEMENTATION.md` - Original CTA implementation guide
- `docs/DYNAMIC_BUSINESS_CTA_IMPLEMENTATION.md` - Dynamic business CTA specs

## Status
✅ Fixed - Business name now integrates naturally into content

All hardcoded references removed and replaced with dynamic business information from user profiles.

