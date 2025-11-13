# How to View Vercel Logs for Calendar Scheduling Debug

## ✅ What I Added

Comprehensive logging to the backend API that will show in Vercel logs:

### You'll see these logs:

**When request starts:**
```
🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵
Request URL: https://www.bridgely.io/api/calendar/keywords
Request method: POST
Auth check: {hasUser: true, userId: "8ab72df0-...", authError: undefined}
📦 Request body parsed: {
  "keyword_id": "12345...",
  "scheduled_date": "2025-11-13",
  "scheduled_time": "09:00:00"
}
📥 Extracted fields: {keyword_id: "12345...", scheduled_date: "2025-11-13", ...}
```

**If validation fails:**
```
❌ Missing required fields: {keyword_id: undefined, scheduled_date: "2025-11-13"}
🔴🔴🔴 RETURNING 400: Missing required fields 🔴🔴🔴
```

or

```
📅 Date validation: {scheduledDate: "2025-11-13T09:00:00Z", today: "2025-11-14T00:00:00Z", isPast: true}
❌ Scheduled date is in the past
🔴🔴🔴 RETURNING 400: Cannot schedule for past dates 🔴🔴🔴
```

**If database fails:**
```
❌ Database error scheduling keyword: {code: "42501", message: "..."}
Error code: 42501
Error message: new row violates row-level security policy
Error details: ...
Error hint: ...
🔴🔴🔴 RETURNING 500: Database update failed 🔴🔴🔴
```

**If successful:**
```
🔄 Updating keyword 12345... for user 8ab72df0...
✅ Successfully scheduled keyword: seo tips
📤 Sending Inngest event...
✅ Inngest event sent successfully
🟢🟢🟢 POST /api/calendar/keywords - SUCCESS - RETURNING 200 🟢🟢🟢
```

---

## 📋 How to View Vercel Logs

### Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Open: https://vercel.com/dashboard
   - Click on your project

2. **Find latest deployment:**
   - Click on **"Deployments"** tab
   - Click on the most recent deployment (top of the list)

3. **Open Function Logs:**
   - Click **"View Function Logs"** button
   - Or scroll down to "Functions" section

4. **Filter for your API:**
   - In the search/filter box, type: `POST /api/calendar/keywords`
   - Or look for logs with emoji markers: 🔵🔵🔵, 🔴🔴🔴, 🟢🟢🟢

5. **Try scheduling a keyword:**
   - Go to your site and try to schedule
   - Refresh the Vercel logs page
   - You'll see all the console.log and console.error output

### Method 2: Vercel CLI (Real-time)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# View logs in real-time
vercel logs --follow

# Or for production only
vercel logs --follow --prod
```

Then try scheduling a keyword, and you'll see logs appear in real-time!

### Method 3: Vercel Logs Tab

1. In Vercel Dashboard → Your Project
2. Click **"Logs"** tab (in top menu)
3. Select **"Runtime Logs"**
4. You'll see all function executions
5. Look for `/api/calendar/keywords` POST requests

---

## 🔍 What to Look For

### Success Case (200):
```
🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵
... [various logs] ...
🟢🟢🟢 POST /api/calendar/keywords - SUCCESS - RETURNING 200 🟢🟢🟢
```

### 400 Error (Bad Request):
```
🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵
... [various logs] ...
🔴🔴🔴 RETURNING 400: [reason] 🔴🔴🔴
```

**Look at the line RIGHT BEFORE the 🔴🔴🔴** - that will tell you exactly what's wrong:
- `❌ Missing required fields` - keyword_id or scheduled_date is missing
- `❌ Scheduled date is in the past` - timezone issue or trying to schedule for yesterday
- `❌ Database error` - RLS policy or column issue

### 500 Error (Server Error):
```
🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵
... [various logs] ...
❌❌❌ CALENDAR KEYWORDS POST API ERROR ❌❌❌
Error type: [error type]
Error message: [error message]
Full error: [full error object]
```

---

## 🚀 Testing Steps

1. **Deploy your changes:**
   ```bash
   git add .
   git commit -m "Add comprehensive Vercel logging for calendar scheduling"
   git push
   ```

2. **Wait for deployment** (check Vercel dashboard)

3. **Open Vercel logs** (using one of the methods above)

4. **Try scheduling a keyword** on your site

5. **Check Vercel logs** - you'll see the full request/response flow

6. **Copy the error logs** and send them to me, or:
   - If you see 🔴🔴🔴 RETURNING 400, look at what's right before it
   - If you see 🔴🔴🔴 RETURNING 500, copy the database error details

---

## 📊 Example Full Log Flow

### Successful Scheduling:
```
[2025-11-13 02:58:37] 🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵
[2025-11-13 02:58:37] Request URL: https://www.bridgely.io/api/calendar/keywords
[2025-11-13 02:58:37] Request method: POST
[2025-11-13 02:58:37] Auth check: {hasUser: true, userId: "8ab72df0-82b6-4d1b-b44f-d190c48636b5"}
[2025-11-13 02:58:37] 📦 Request body parsed: {"keyword_id":"fa1a2027-...","scheduled_date":"2025-11-14","scheduled_time":"09:00:00"}
[2025-11-13 02:58:37] 📥 Extracted fields: {keyword_id: "fa1a2027-...", scheduled_date: "2025-11-14", scheduled_time: "09:00:00"}
[2025-11-13 02:58:37] 📅 Date validation: {scheduledDate: "2025-11-14T09:00:00.000Z", today: "2025-11-13T00:00:00.000Z", isPast: false}
[2025-11-13 02:58:37] 🔄 Updating keyword fa1a2027-... for user 8ab72df0-...
[2025-11-13 02:58:38] ✅ Successfully scheduled keyword: youtube what is seo
[2025-11-13 02:58:38] 📤 Sending Inngest event...
[2025-11-13 02:58:38] ✅ Inngest event sent successfully
[2025-11-13 02:58:38] 🟢🟢🟢 POST /api/calendar/keywords - SUCCESS - RETURNING 200 🟢🟢🟢
```

### Failed - Past Date (400):
```
[2025-11-13 02:58:37] 🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵
[2025-11-13 02:58:37] Request URL: https://www.bridgely.io/api/calendar/keywords
[2025-11-13 02:58:37] Request method: POST
[2025-11-13 02:58:37] Auth check: {hasUser: true, userId: "8ab72df0-..."}
[2025-11-13 02:58:37] 📦 Request body parsed: {"keyword_id":"fa1a2027-...","scheduled_date":"2025-11-12","scheduled_time":"09:00:00"}
[2025-11-13 02:58:37] 📥 Extracted fields: {keyword_id: "fa1a2027-...", scheduled_date: "2025-11-12", scheduled_time: "09:00:00"}
[2025-11-13 02:58:37] 📅 Date validation: {scheduledDate: "2025-11-12T09:00:00.000Z", today: "2025-11-13T00:00:00.000Z", isPast: true}
[2025-11-13 02:58:37] ❌ Scheduled date is in the past
[2025-11-13 02:58:37] 🔴🔴🔴 RETURNING 400: Cannot schedule for past dates 🔴🔴🔴
```

---

## 💡 Quick Fixes Based on Logs

### If you see: "Missing required fields"
**Fix:** Make sure you actually selected a keyword (check the checkbox)

### If you see: "Cannot schedule for past dates"
**Fix:** Schedule for tomorrow instead of today (timezone issue)

### If you see: "row-level security policy"
**Fix:** Run the RLS SQL fix in Supabase (see fix_calendar_scheduling.sql)

### If you see: "column does not exist"
**Fix:** Run the column migration in Supabase (see fix_calendar_scheduling.sql)

---

## 📤 What to Send Me

After checking Vercel logs, send me:

1. **The full log output** (from 🔵🔵🔵 START to 🔴🔴🔴/🟢🟢🟢 END)
2. Or just tell me which emoji marker you saw:
   - 🔴🔴🔴 RETURNING 400: [what reason?]
   - 🔴🔴🔴 RETURNING 500: [what error?]
   - 🟢🟢🟢 SUCCESS (if it worked!)

Then I can tell you exactly how to fix it!

