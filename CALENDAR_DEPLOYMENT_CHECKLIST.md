# Calendar Keyword Scheduling - Deployment Checklist

## Prerequisites

✅ All features implemented and tested locally
✅ No linting errors
✅ All TODOs completed

## Deployment Steps

### 1. Database Migration

Run the migration to add new fields to `discovered_keywords` table:

```bash
# Option A: Using psql
psql -h your-host -U your-user -d your-database -f calendar_keyword_scheduling_migration.sql

# Option B: Via Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Open calendar_keyword_scheduling_migration.sql
# 3. Copy and paste the SQL
# 4. Run the query
```

**Verify migration:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'discovered_keywords'
AND column_name IN ('scheduled_date', 'scheduled_for_generation', 'generation_status', 'generated_content_id', 'generated_at');
```

### 2. Environment Variables

Ensure these environment variables are set in your production environment:

```env
# Required for content generation
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for Inngest scheduling
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-...
```

### 3. Inngest Setup

**Option A: Cloud Deployment (Recommended)**

1. **Sign up for Inngest** at https://www.inngest.com
2. **Create a new app** in Inngest dashboard
3. **Get your keys** from Settings:
   - Event Key
   - Signing Key
4. **Add to environment variables**
5. **Deploy your app** to production
6. **Register your app** with Inngest:
   ```bash
   # Inngest will auto-discover functions at:
   # https://your-domain.com/api/inngest
   ```
7. **Verify functions are registered** in Inngest dashboard:
   - `daily-content-generation` (Cron)
   - `generate-keyword-content` (Event)

**Option B: Self-Hosted Inngest Dev Server**

```bash
# For development/testing only
npx inngest-cli@latest dev
```

### 4. Test the Integration

#### Test Scheduling
1. Go to `/dashboard/keywords`
2. Click "Add to Calendar" on any keyword
3. Select tomorrow's date
4. Verify keyword appears in calendar

#### Test Manual Generation
1. Go to `/calendar`
2. Click on a scheduled keyword
3. Click "Generate Now"
4. Wait for generation to complete
5. Verify content is created and linked

#### Test Automatic Generation
1. Schedule a keyword for tomorrow at 6 AM
2. Wait for cron job to run (or trigger manually in Inngest dashboard)
3. Verify content is generated automatically
4. Check keyword status updates to "generated"

### 5. Monitoring

Set up monitoring for:

**Inngest Dashboard:**
- Monitor daily cron job executions
- Check for failed function runs
- Review execution logs

**Supabase Logs:**
- Database query performance
- API errors
- Storage upload issues

**Application Logs:**
- Content generation success/failure rates
- API response times
- User interactions with calendar

### 6. Optimization (Optional)

**For high-volume usage:**

1. **Add database indexes** (already included in migration)
2. **Set up caching** for calendar views
3. **Implement rate limiting** for manual generation
4. **Add queue system** for batch generation
5. **Set up CDN** for generated images

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] All environment variables set
- [ ] Inngest functions registered and active
- [ ] Cron job scheduled (shows in Inngest dashboard)
- [ ] Test keyword scheduled via UI
- [ ] Test manual generation works
- [ ] Test automatic generation at 6 AM
- [ ] Generated content saved to database
- [ ] Generated content visible in calendar
- [ ] Generated content accessible via link
- [ ] Error handling works (test with invalid API keys)
- [ ] Images upload successfully to Supabase Storage

## Rollback Plan

If issues occur:

1. **Disable Inngest functions** in dashboard
2. **Revert database migration:**
   ```sql
   ALTER TABLE discovered_keywords
   DROP COLUMN scheduled_date,
   DROP COLUMN scheduled_for_generation,
   DROP COLUMN generation_status,
   DROP COLUMN generated_content_id,
   DROP COLUMN generated_at;
   ```
3. **Restore previous code version** via Git
4. **Investigate issues** in logs
5. **Fix and redeploy**

## Support & Troubleshooting

### Common Issues

**Issue: Cron job not running**
- Verify Inngest app is properly connected
- Check cron expression: `0 6 * * *`
- Test manually trigger function in Inngest dashboard

**Issue: Content not generating**
- Check Claude API key and credits
- Verify Tavily API key (optional, has fallback)
- Check Supabase storage permissions
- Review function logs in Inngest

**Issue: Keywords not appearing in calendar**
- Verify API endpoint `/api/calendar/keywords` works
- Check date format in requests (YYYY-MM-DD)
- Ensure user authentication is working

## Post-Deployment

1. **Monitor for 24 hours** to ensure cron jobs run successfully
2. **Check first auto-generation** happens at 6 AM
3. **Review user feedback** on the feature
4. **Optimize based on usage patterns**
5. **Document any issues** for future reference

## Success Metrics

Track these metrics to measure success:

- **Keywords scheduled per day**
- **Successful generation rate** (%)
- **Average generation time** (seconds)
- **User engagement** with calendar feature
- **Content quality feedback**
- **Time saved** vs manual content creation

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Production URL:** _________________
**Inngest App ID:** _________________
**Status:** ⬜ Pending ⬜ In Progress ⬜ Completed ⬜ Issues

## Notes

_Add any deployment notes, issues encountered, or important observations here_

