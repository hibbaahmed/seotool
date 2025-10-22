import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest';

// GET /api/calendar/posts/[id] - Get a specific scheduled post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching scheduled post:', error);
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Calendar GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/calendar/posts/[id] - Update a specific scheduled post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      scheduled_date,
      scheduled_time,
      platform,
      notes,
      image_urls,
      status,
      publish_url
    } = body;

    // Validate date is not in the past (only if date is being changed)
    if (scheduled_date) {
      const scheduledDate = new Date(scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduledDate < today) {
        return NextResponse.json(
          { error: 'Cannot schedule posts in the past' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
    if (platform !== undefined) updateData.platform = platform;
    if (notes !== undefined) updateData.notes = notes;
    if (image_urls !== undefined) updateData.image_urls = image_urls;
    if (status !== undefined) updateData.status = status;
    if (publish_url !== undefined) updateData.publish_url = publish_url;

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scheduled post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Calendar PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/calendar/posts/[id] - Delete a specific scheduled post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get the post to check its status
    const { data: post, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching post for deletion:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // If post is scheduled (not yet published), cancel it in Inngest
    if (post.status === 'scheduled') {
      try {
        await inngest.send({
          name: 'blog/post.cancel',
          data: {
            postId: params.id,
            userId: user.id,
          },
        });
        console.log('✅ Inngest cancellation event sent for post:', params.id);
      } catch (inngestError) {
        console.error('❌ Error sending Inngest cancellation event:', inngestError);
        // Continue with deletion even if Inngest fails
      }
    }

    // Delete the post from database
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting scheduled post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
