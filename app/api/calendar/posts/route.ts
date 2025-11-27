import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest';

// GET /api/calendar/posts - Fetch all scheduled posts for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const onboardingProfileId = searchParams.get('onboarding_profile_id'); // Filter by website

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id);

    // Filter by website if specified
    if (onboardingProfileId) {
      query = query.eq('onboarding_profile_id', onboardingProfileId);
    }

    const { data: posts, error } = await query.order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/calendar/posts - Create a new scheduled post
export async function POST(request: NextRequest) {
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
      scheduled_time = '09:00:00',
      platform = 'blog',
      notes,
      image_urls = [],
      content_id,
      onboarding_profile_id
    } = body;

    // Validate required fields
    if (!title || !content || !scheduled_date) {
      return NextResponse.json(
        { error: 'Title, content, and scheduled date are required' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const scheduledDate = new Date(scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduledDate < today) {
      return NextResponse.json(
        { error: 'Cannot schedule posts in the past' },
        { status: 400 }
      );
    }

      const { data: post, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          title,
          content,
          scheduled_date,
          scheduled_time,
          platform,
          notes,
          image_urls,
          content_id,
          onboarding_profile_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating scheduled post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
      }

      // Trigger Inngest scheduling event
      try {
        await inngest.send({
          name: 'blog/post.schedule',
          data: {
            postId: post.id,
            scheduledDate,
            scheduledTime: scheduled_time,
            platform,
            title,
            content,
            userId: user.id,
            imageUrls: image_urls,
            notes
          },
        });
        console.log('✅ Inngest scheduling event sent for post:', post.id);
      } catch (inngestError) {
        console.error('❌ Error sending Inngest event:', inngestError);
        // Don't fail the request if Inngest fails - the post is still saved
      }

      return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Calendar POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/calendar/posts/[id] - Update a scheduled post
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const postId = url.pathname.split('/').pop();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
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
      .eq('id', postId)
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

// DELETE /api/calendar/posts/[id] - Delete a scheduled post
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const postId = url.pathname.split('/').pop();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId)
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
