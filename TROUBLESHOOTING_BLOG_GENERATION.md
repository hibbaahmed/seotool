# Troubleshooting Blog Generation Issues

## Error 1: Missing `opportunity_level` Field ✅ FIXED

### Error Message
```
Error saving keywords: {
  code: '23502',
  message: 'null value in column "opportunity_level" of relation "discovered_keywords" violates not-null constraint'
}
```

### Root Cause
The `discovered_keywords` table has a NOT NULL constraint on the `opportunity_level` column, but DataForSEO keyword saving wasn't providing this field.

### Solution Applied
Updated `lib/dataforseo-keywords.ts` to automatically calculate `opportunity_level` based on search volume and difficulty:

```typescript
const calculateOpportunityLevel = (searchVolume: number, difficulty: number): 'low' | 'medium' | 'high' => {
  // High opportunity: good search volume (>1000) with low-medium difficulty (<40)
  if (searchVolume >= 1000 && difficulty < 40) {
    return 'high';
  }
  // Medium opportunity: decent search volume (>500) with medium difficulty (40-70)
  if (searchVolume >= 500 && difficulty < 70) {
    return 'medium';
  }
  // Low opportunity: low volume or high difficulty
  return 'low';
};
```

**Status:** ✅ Fixed - Redeploy to apply.

---

## Error 2: Anthropic API Credits Exhausted ⚠️ ACTION REQUIRED

### Error Message
```
❌ Model claude-sonnet-4-5-20250929 failed: HTTP 400: Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.
```

### Root Cause
Your Anthropic API account has run out of credits. All Claude models require credits to generate content.

### Solution Steps

#### Option 1: Add Credits to Your Anthropic Account (Recommended)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **Settings** → **Plans & Billing**
3. Click **Purchase Credits** or **Upgrade Plan**
4. Add credits (minimum $5, recommended $20-50 for production use)
5. Credits are available immediately after purchase

#### Option 2: Use a Different Anthropic API Key
If you have another Anthropic account with credits:
1. Get the API key from [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Update your Vercel environment variable:
   - Go to Vercel → Project → Settings → Environment Variables
   - Update `ANTHROPIC_API_KEY` with the new key
   - Redeploy

#### Pricing Reference (as of Nov 2024)
- **Claude Sonnet 3.5**: ~$3 per million input tokens, ~$15 per million output tokens
- **Estimated cost per blog**: ~$0.15-0.30 for a 6000-8500 word article
- **$20 credit**: Can generate approximately 70-130 blog posts

### Monitor Usage
Check your Anthropic dashboard regularly to monitor:
- Current credit balance
- Daily/monthly usage
- Estimated remaining capacity

**Status:** ⚠️ Requires manual action - Add credits to continue.

---

## Summary of All Fixes

| Issue | Status | Action Required |
|-------|--------|----------------|
| RLS policy error (discovered_keywords) | ✅ Fixed | Redeploy |
| Missing `opportunity_level` field | ✅ Fixed | Redeploy |
| Detailed Claude error logging | ✅ Fixed | Redeploy |
| Anthropic API credits exhausted | ⚠️ Pending | Add credits to Anthropic account |
| Calendar scheduling frontend errors | ✅ Fixed | Run SQL migration + redeploy |
| Inngest maxDuration limit | ✅ Fixed | Redeploy |

---

## Quick Test After Deploying

1. **Add credits to Anthropic** (if not done already)
2. **Redeploy** your application
3. **Test blog generation**:
   - Go to Calendar
   - Schedule a keyword
   - Click "Generate Now"
4. **Check logs** for:
   - `✅ Success with model: claude-sonnet-4-5-20250929`
   - `💾 Saved X keywords to database` (no errors)
   - Final content saved to database

---

## Environment Variables Checklist

Ensure these are set in production (Vercel):

```bash
# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-...  # ⚠️ Must have credits!

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role, not anon key

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# DataForSEO (for keyword research)
DATA_FOR_SEO_KEY=login:password  # Or base64 encoded

# Tavily (for image search)
TAVILY_API_KEY=tvly-...

# YouTube (for video embeds)
YOUTUBE_API_KEY=...

# Vercel Protection Bypass (if using deployment protection)
VERCEL_AUTOMATION_BYPASS_SECRET=...  # 32-char secret
```

---

## Support Links

- [Anthropic Console](https://console.anthropic.com/)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Inngest Dashboard](https://app.inngest.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)

