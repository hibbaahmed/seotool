import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest';

// GET /api/calendar/keywords - Fetch keywords scheduled for specific dates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // YYYY-MM format

    let query = supabase
      .from('discovered_keywords')
      .select(`
        *,
        content_writer_outputs (
          id,
          topic,
          content_output,
          image_urls,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('scheduled_for_generation', true)
      .order('scheduled_date', { ascending: true });

    if (date) {
      query = query.eq('scheduled_date', date);
    } else if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1; // 0-based
      // First day of month (UTC) and last day of month (UTC)
      const start = new Date(Date.UTC(year, monthIndex, 1));
      const end = new Date(Date.UTC(year, monthIndex + 1, 0)); // day 0 of next month = last day of this month
      const toYMD = (d: Date) => d.toISOString().slice(0, 10);
      const startDate = toYMD(start);
      const endDate = toYMD(end);
      query = query.gte('scheduled_date', startDate).lte('scheduled_date', endDate);
    }

    const { data: keywords, error } = await query;
    
    if (error) {
      console.error('Error fetching scheduled keywords:', error);
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }

    // For generated keywords, fetch publishing info
    if (keywords && keywords.length > 0) {
      const generatedKeywords = keywords.filter((k: any) => k.generation_status === 'generated' && k.generated_content_id);
      
      if (generatedKeywords.length > 0) {
        const contentIds = generatedKeywords.map((k: any) => k.generated_content_id);
        
        const { data: publishingLogs } = await supabase
          .from('publishing_logs')
          .select(`
            content_id,
            post_id,
            wordpress_sites (
              id,
              name,
              url
            )
          `)
          .in('content_id', contentIds)
          .eq('user_id', user.id)
          .order('published_at', { ascending: false });

        // Map publishing info to keywords
        if (publishingLogs) {
          const publishingMap = new Map();
          
          // Fetch permalinks for all posts (batch if possible)
          const permalinkPromises = publishingLogs.map(async (log: any) => {
            if (log.content_id && log.wordpress_sites) {
              const site = log.wordpress_sites;
              const siteUrl = site.url.replace(/\/$/, '');
              let publishUrl = `${siteUrl}/?p=${log.post_id}`; // Fallback
              
              // Try to fetch permalink from WordPress
              try {
                const isWordPressCom = site.url.includes('wordpress.com');
                
                if (isWordPressCom) {
                  // For WordPress.com, fetch using OAuth token
                  const { data: siteData } = await supabase
                    .from('wordpress_sites')
                    .select('access_token')
                    .eq('id', site.id)
                    .single();
                  
                  if (siteData && siteData.access_token) {
                    const hostname = new URL(site.url).hostname;
                    const siteId = hostname.replace('.wordpress.com', '');
                    
                    const wpResponse = await fetch(
                      `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/${log.post_id}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${siteData.access_token}`,
                        },
                      }
                    );
                    
                    if (wpResponse.ok) {
                      const postData = await wpResponse.json();
                      if (postData.URL) {
                        publishUrl = postData.URL;
                      } else if (postData.link) {
                        publishUrl = postData.link;
                      }
                    }
                  }
                } else {
                  // For self-hosted, try to get credentials and fetch permalink
                  const { data: siteData } = await supabase
                    .from('wordpress_sites')
                    .select('username, password')
                    .eq('id', site.id)
                    .single();
                  
                  if (siteData && siteData.username && siteData.password) {
                    const auth = btoa(`${siteData.username}:${siteData.password}`);
                    const wpResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${log.post_id}`, {
                      headers: {
                        'Authorization': `Basic ${auth}`,
                      },
                    });
                    
                    if (wpResponse.ok) {
                      const postData = await wpResponse.json();
                      if (postData.link) {
                        publishUrl = postData.link;
                      }
                    }
                  }
                }
              } catch (error) {
                // Silently fail and use fallback
                console.error('Error fetching permalink for post:', log.post_id, error);
              }
              
              return {
                contentId: log.content_id,
                info: {
                  siteName: site.name,
                  siteUrl: site.url,
                  publishUrl,
                }
              };
            }
            return null;
          });
          
          const permalinkResults = await Promise.all(permalinkPromises);
          permalinkResults.forEach((result) => {
            if (result) {
              publishingMap.set(result.contentId, result.info);
            }
          });

          // Attach publishing info to keywords
          keywords.forEach((keyword: any) => {
            if (keyword.generated_content_id && publishingMap.has(keyword.generated_content_id)) {
              keyword.publishing_info = publishingMap.get(keyword.generated_content_id);
            }
          });
        }
      }
    }

    return NextResponse.json(keywords || []);
  } catch (error) {
    console.error('Calendar keywords API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/calendar/keywords - Schedule a keyword for generation
export async function POST(request: NextRequest) {
  console.log('🔵🔵🔵 POST /api/calendar/keywords - REQUEST START 🔵🔵🔵');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Auth check:', { hasUser: !!user, userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.error('❌ Unauthorized: No user or auth error');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check credits before allowing scheduling
    const requiredCredits = 1;
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      console.error('❌ Error fetching credits:', creditsError);
      return NextResponse.json(
        { error: 'Could not fetch user credits' },
        { status: 500 }
      );
    }

    const currentCredits = creditsData.credits || 0;

    if (currentCredits < requiredCredits) {
      console.warn(`❌ BLOCKED: User has ${currentCredits} credits, needs ${requiredCredits} to schedule generation`);
      return NextResponse.json(
        { error: `Insufficient credits. You need ${requiredCredits} credit(s) to schedule content generation. You currently have ${currentCredits} credit(s).` },
        { status: 402 } // 402 Payment Required
      );
    }

    console.log(`✅ Credits OK: ${currentCredits} >= ${requiredCredits}, allowing scheduling`);

    const body = await request.json();
    console.log('📦 Request body parsed:', JSON.stringify(body, null, 2));
    
    const { keyword_id, scheduled_date, scheduled_time = '06:00:00' } = body;

    console.log('📥 Extracted fields:', { keyword_id, scheduled_date, scheduled_time });

    if (!keyword_id || !scheduled_date) {
      console.error('❌ Missing required fields:', { keyword_id, scheduled_date });
      console.error('🔴🔴🔴 RETURNING 400: Missing required fields 🔴🔴🔴');
      return NextResponse.json(
        { error: 'Keyword ID and scheduled date are required', details: { keyword_id: !!keyword_id, scheduled_date: !!scheduled_date } },
        { status: 400 }
      );
    }

    // Validate date/time is not in the past
    // Parse the scheduled date in local timezone to avoid UTC conversion issues
    const [year, month, day] = scheduled_date.split('-').map(Number);
    const scheduledDate = new Date(year, month - 1, day);
    
    // Get today's date (local timezone, midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's date for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log('📅 Date validation:', { 
      scheduledDateString: scheduled_date,
      scheduledDate: scheduledDate.toDateString(),
      today: today.toDateString(),
      yesterday: yesterday.toDateString(),
      isPast: scheduledDate < yesterday
    });
    
    // Only reject if scheduling for yesterday or earlier
    // Allow scheduling for today (even if time has passed - Inngest will handle it)
    if (scheduledDate < yesterday) {
      console.error('❌ Scheduled date is in the past (before yesterday)');
      console.error('🔴🔴🔴 RETURNING 400: Cannot schedule for past dates 🔴🔴🔴');
      return NextResponse.json(
        { 
          error: 'Cannot schedule keywords for past dates', 
          details: { 
            scheduled: scheduled_date,
            today: today.toISOString().split('T')[0],
            message: 'You can only schedule for today or future dates'
          } 
        },
        { status: 400 }
      );
    }

    // Update the keyword to schedule it
    console.log(`🔄 Updating keyword ${keyword_id} for user ${user.id}...`);
    const { data: keyword, error } = await supabase
      .from('discovered_keywords')
      .update({
        scheduled_date,
        scheduled_time,
        scheduled_for_generation: true,
        generation_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', keyword_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error scheduling keyword:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('🔴🔴🔴 RETURNING 500: Database update failed 🔴🔴🔴');
      return NextResponse.json({ error: 'Failed to schedule keyword', details: error.message }, { status: 500 });
    }

    console.log(`✅ Successfully scheduled keyword: ${keyword.keyword}`);

    // Also send an Inngest schedule event for precise timing
    try {
      console.log('📤 Sending Inngest event...');
      await inngest.send({
        name: 'calendar/keyword.schedule',
        data: {
          keywordId: keyword.id,
          userId: user.id,
          keyword: keyword.keyword,
          runAtISO: new Date(`${scheduled_date}T${scheduled_time}`).toISOString(),
          relatedKeywords: keyword.related_keywords || [],
        }
      });
      console.log('✅ Inngest event sent successfully');
    } catch (e) {
      console.error('⚠️ Failed to send schedule event to Inngest:', e);
    }

    console.log('🟢🟢🟢 POST /api/calendar/keywords - SUCCESS - RETURNING 200 🟢🟢🟢');
    return NextResponse.json(keyword, { status: 200 });
  } catch (error) {
    console.error('❌❌❌ CALENDAR KEYWORDS POST API ERROR ❌❌❌');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PUT /api/calendar/keywords - Update scheduled keyword
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword_id, scheduled_date, scheduled_time, scheduled_for_generation } = body;

    if (!keyword_id) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (scheduled_date !== undefined) {
      updateData.scheduled_date = scheduled_date;
    }
    
    if (scheduled_time !== undefined) {
      updateData.scheduled_time = scheduled_time;
    }
    
    if (scheduled_for_generation !== undefined) {
      updateData.scheduled_for_generation = scheduled_for_generation;
      if (!scheduled_for_generation) {
        updateData.scheduled_date = null;
        updateData.generation_status = 'pending';
      }
    }

    const { data: keyword, error } = await supabase
      .from('discovered_keywords')
      .update(updateData)
      .eq('id', keyword_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scheduled keyword:', error);
      return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 });
    }

    return NextResponse.json(keyword);
  } catch (error) {
    console.error('Calendar keywords PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/calendar/keywords - Remove keyword from schedule
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword_id = searchParams.get('keyword_id');

    if (!keyword_id) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('discovered_keywords')
      .update({
        scheduled_date: null,
        scheduled_for_generation: false,
        generation_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', keyword_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing keyword from schedule:', error);
      return NextResponse.json({ error: 'Failed to remove keyword' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar keywords DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

