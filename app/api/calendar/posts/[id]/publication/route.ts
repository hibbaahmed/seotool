import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // First, get the post
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // If post has publish_url, construct info from it
    if (post.publish_url) {
      try {
        const url = new URL(post.publish_url);
        return NextResponse.json({
          publishUrl: post.publish_url,
          platform: post.platform || 'wordpress',
          siteUrl: `${url.protocol}//${url.host}`,
          siteName: url.host.replace(/^www\./, ''),
        });
      } catch {
        return NextResponse.json({
          publishUrl: post.publish_url,
          platform: post.platform || 'wordpress',
        });
      }
    }

    // Try to get from publishing_logs if content_id matches
    if (post.content_id) {
      const { data: logs, error: logsError } = await supabase
        .from('publishing_logs')
        .select(`
          *,
          wordpress_sites (
            id,
            name,
            url
          )
        `)
        .eq('content_id', post.content_id)
        .eq('user_id', user.id)
        .order('published_at', { ascending: false })
        .limit(1);

      if (!logsError && logs && logs.length > 0) {
        const log = logs[0] as any;
        const site = log.wordpress_sites;
        
        if (site) {
          // Construct WordPress post URL
          const siteUrl = site.url.replace(/\/$/, '');
          const postId = log.post_id;
          const publishUrl = `${siteUrl}/?p=${postId}`;

          return NextResponse.json({
            publishUrl,
            platform: 'wordpress',
            siteUrl: site.url,
            siteName: site.name,
          });
        }
      }
    }

    return NextResponse.json({
      platform: post.platform || 'wordpress',
    });
  } catch (error) {
    console.error('Error fetching publication info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



