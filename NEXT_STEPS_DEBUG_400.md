# How to Debug the 400 Error - Next Steps

## What I Fixed

### 1. ✅ Page Won't Reload on Error
- **Before:** Page reloaded immediately, couldn't see error
- **After:** Page stays open when error occurs, alert says "DO NOT CLOSE THIS - Check Network tab now!"

### 2. ✅ Detailed Console Logging
- **Frontend:** Shows what data is being sent
- **Backend:** Shows what's received and why it failed

### 3. ✅ Better Error Messages
- Error response now includes `details` field showing exactly what went wrong

---

## Steps to Find the Error

### Deploy and Test

1. **Deploy your changes:**
   ```bash
   git add .
   git commit -m "Add detailed error logging for calendar scheduling"
   git push
   ```
   
2. **Wait for deployment** (check Vercel dashboard)

3. **Open your site:**
   - Go to: `https://www.bridgely.io/calendar`
   - Open DevTools (F12)
   - Go to **Console** tab AND **Network** tab (keep both visible)

4. **Try scheduling a keyword:**
   - Click a date
   - Select 1 keyword
   - Click "Schedule"
   
5. **When the alert appears, DO NOT CLOSE IT**
   - Look at Console tab → you'll see:
     ```
     📤 Scheduling keyword 1/1: {keyword_id: "xxx", scheduled_date: "2025-11-13", scheduled_time: "09:00:00"}
     ❌ Keyword 1 failed (400): {error: "...", details: {...}}
     ```
   
   - Look at Network tab → click the POST `keywords` request → Response tab:
     ```json
     {
       "error": "Cannot schedule keywords for past dates",
       "details": {
         "scheduled": "2025-11-13T09:00:00.000Z",
         "today": "2025-11-14T00:00:00.000Z"
       }
     }
     ```

6. **Check Vercel Function Logs:**
   - Vercel Dashboard → Deployments → Latest → View Function Logs
   - Look for:
     ```
     📥 POST /api/calendar/keywords received: {keyword_id: "xxx", scheduled_date: "2025-11-13", ...}
     📅 Date validation: {scheduledDate: "...", today: "...", isPast: true}
     ❌ Scheduled date is in the past
     ```

---

## Common 400 Errors & Solutions

### Error 1: "Keyword ID and scheduled date are required"

**Console shows:**
```javascript
📤 Scheduling keyword 1/1: {keyword_id: undefined, scheduled_date: "2025-11-13", ...}
```

**Cause:** No keyword selected or selection lost

**Fix:** Make sure you actually selected a keyword before clicking Schedule

---

### Error 2: "Cannot schedule keywords for past dates"

**Console shows:**
```javascript
📅 Date validation: {scheduledDate: "2025-11-13T09:00:00Z", today: "2025-11-14T00:00:00Z", isPast: true}
```

**Cause:** Timezone mismatch - server thinks the date is in the past

**Fix Option A** - Schedule for tomorrow instead of today

**Fix Option B** - Fix the date comparison logic:

```typescript
// In /app/api/calendar/keywords/route.ts
// Change line 214-215:
const scheduledDate = new Date(`${scheduled_date}T${scheduled_time}`);
const today = new Date();
today.setHours(0, 0, 0, 0);

// To this (compare dates only, ignore time):
const scheduledDateOnly = scheduled_date; // YYYY-MM-DD
const todayOnly = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

if (scheduledDateOnly < todayOnly) {
  // Error...
}
```

---

### Error 3: "Failed to schedule keyword" (500 error, not 400)

**Console shows:**
```javascript
❌ Error scheduling keyword: {code: "42501", message: "row-level security policy..."}
```

**Cause:** RLS policy blocks updates

**Fix:** Run this in Supabase SQL Editor:

```sql
DROP POLICY IF EXISTS "Users can update their own keywords" ON discovered_keywords;
CREATE POLICY "Users can update their own keywords" 
ON discovered_keywords
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
```

---

## What to Report

After deploying and testing, report:

1. **What you see in Console:**
   ```
   [Paste the 📤 and ❌ lines here]
   ```

2. **What you see in Network → Response:**
   ```json
   [Paste the JSON error here]
   ```

3. **What you see in Vercel logs:**
   ```
   [Paste the 📥 and 📅 lines here]
   ```

Then I can tell you exactly how to fix it!

---

## Most Likely Issue: Timezone/Date

Based on the 400 error, it's most likely one of these:

1. **You're trying to schedule for "today" but the server is in a different timezone** → Schedule for tomorrow instead
2. **The date format is wrong** → Check console logs to see what format is being sent
3. **The keyword_id is undefined** → Check you actually selected a keyword

The detailed logging will tell us exactly which one it is!

