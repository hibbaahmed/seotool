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
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = `${year}-${monthNum}-31`;
      query = query.gte('scheduled_date', startDate).lte('scheduled_date', endDate);
    }

    const { data: keywords, error } = await query;

    if (error) {
      console.error('Error fetching scheduled keywords:', error);
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }

    return NextResponse.json(keywords || []);
  } catch (error) {
    console.error('Calendar keywords API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/calendar/keywords - Schedule a keyword for generation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword_id, scheduled_date, scheduled_time = '06:00:00' } = body;

    if (!keyword_id || !scheduled_date) {
      return NextResponse.json(
        { error: 'Keyword ID and scheduled date are required' },
        { status: 400 }
      );
    }

    // Validate date/time is not in the past
    const scheduledDate = new Date(`${scheduled_date}T${scheduled_time}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduledDate < today) {
      return NextResponse.json(
        { error: 'Cannot schedule keywords for past dates' },
        { status: 400 }
      );
    }

    // Update the keyword to schedule it
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
      console.error('Error scheduling keyword:', error);
      return NextResponse.json({ error: 'Failed to schedule keyword' }, { status: 500 });
    }

    // Also send an Inngest schedule event for precise timing
    try {
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
    } catch (e) {
      console.error('Failed to send schedule event to Inngest:', e);
    }

    return NextResponse.json(keyword, { status: 200 });
  } catch (error) {
    console.error('Calendar keywords POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { keyword_id, scheduled_date, scheduled_for_generation } = body;

    if (!keyword_id) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (scheduled_date !== undefined) {
      updateData.scheduled_date = scheduled_date;
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

