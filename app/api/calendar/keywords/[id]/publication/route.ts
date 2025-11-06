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

    // Get the keyword
    const { data: keyword, error: keywordError } = await supabase
      .from('discovered_keywords')
      .select('generated_content_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (keywordError || !keyword || !keyword.generated_content_id) {
      return NextResponse.json({ error: 'Keyword not found or no content generated' }, { status: 404 });
    }

    // Get publishing info from publishing_logs
    const { data: logs, error: logsError } = await supabase
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
      .eq('content_id', keyword.generated_content_id)
      .eq('user_id', user.id)
      .order('published_at', { ascending: false })
      .limit(1);

    if (logsError || !logs || logs.length === 0) {
      return NextResponse.json({ error: 'No publication info found' }, { status: 404 });
    }

    const log = logs[0] as any;
    const site = log.wordpress_sites;

    if (!site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }

    const siteUrl = site.url.replace(/\/$/, '');
    const postId = log.post_id;
    
    // Try to fetch the permalink from WordPress REST API
    let publishUrl = `${siteUrl}/?p=${postId}`; // Fallback to post ID URL
    
    try {
      // Check if this is a WordPress.com site or self-hosted
      const isWordPressCom = site.url.includes('wordpress.com');
      
      if (isWordPressCom) {
        // For WordPress.com, fetch using OAuth token
        const { data: siteData } = await supabase
          .from('wordpress_sites')
          .select('access_token')
          .eq('id', site.id)
          .single();
        
        if (siteData && siteData.access_token) {
          // Extract site ID from URL (e.g., "example.wordpress.com" or numeric ID)
          const hostname = new URL(site.url).hostname;
          const siteId = hostname.replace('.wordpress.com', '');
          
          const wpResponse = await fetch(
            `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/${postId}`,
            {
              headers: {
                'Authorization': `Bearer ${siteData.access_token}`,
              },
            }
          );
          
          if (wpResponse.ok) {
            const postData = await wpResponse.json();
            // WordPress.com API returns 'URL' field with the permalink
            if (postData.URL) {
              publishUrl = postData.URL;
            } else if (postData.link) {
              publishUrl = postData.link;
            }
          }
        }
      } else {
        // For self-hosted WordPress, fetch from REST API
        const { data: siteData } = await supabase
          .from('wordpress_sites')
          .select('username, password')
          .eq('id', site.id)
          .single();
        
        if (siteData && siteData.username && siteData.password) {
          const auth = btoa(`${siteData.username}:${siteData.password}`);
          const wpResponse = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}`, {
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
      console.error('Error fetching WordPress permalink:', error);
      // Use fallback URL
    }

    return NextResponse.json({
      publishUrl,
      platform: 'wordpress',
      siteUrl: site.url,
      siteName: site.name,
    });
  } catch (error) {
    console.error('Error fetching keyword publication info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

