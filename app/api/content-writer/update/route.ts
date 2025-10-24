import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, topic, content_type, target_audience, tone, length, additional_context, content_output, image_urls } = body;

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    const updateData = {
      topic,
      content_type,
      target_audience,
      tone,
      length,
      additional_context,
      content_output,
      image_urls,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('content_writer_outputs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating content:', error);
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }

    return NextResponse.json({ content: data });
  } catch (error) {
    console.error('Content update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
