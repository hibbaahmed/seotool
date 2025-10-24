import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WordPressAPI } from '@/lib/wordpress/api';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      siteId, 
      contentId, 
      contentType, 
      publishOptions = {} 
    } = body;

    if (!siteId || !contentId || !contentType) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, contentId, contentType' 
      }, { status: 400 });
    }

    // Get the WordPress site
    const { data: site, error: siteError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }

    // Get the content based on type
    let contentData;
    let tableName;

    switch (contentType) {
      case 'content':
        tableName = 'content_writer_outputs';
        break;
      case 'analysis':
        tableName = 'competitive_analysis';
        break;
      case 'seo_research':
        tableName = 'seo_research_outputs';
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Initialize WordPress API
    const wpAPI = new WordPressAPI({
      id: (site as any).id,
      name: (site as any).name,
      url: (site as any).url,
      username: (site as any).username,
      password: (site as any).password,
      isActive: (site as any).is_active,
      createdAt: (site as any).created_at,
      updatedAt: (site as any).updated_at,
    });

    // Prepare WordPress post data
    let postData;

    switch (contentType) {
      case 'content':
        postData = {
          title: (content as any).topic,
          content: (content as any).content_output,
          excerpt: (content as any).content_output.substring(0, 160) + '...',
          status: publishOptions.status || 'draft',
          categories: publishOptions.categories || [],
          tags: publishOptions.tags || [],
          meta: {
            content_type: (content as any).content_type,
            target_audience: (content as any).target_audience,
            tone: (content as any).tone,
            length: (content as any).length,
          },
        };
        break;

      case 'analysis':
        postData = {
          title: `Competitive Analysis: ${(content as any).company_name} vs ${(content as any).competitor_name}`,
          content: (content as any).analysis_output,
          excerpt: (content as any).analysis_output.substring(0, 160) + '...',
          status: publishOptions.status || 'draft',
          categories: publishOptions.categories || [],
          tags: publishOptions.tags || ['competitive-analysis', 'business-analysis'],
          meta: {
            analysis_type: (content as any).analysis_type,
            company_name: (content as any).company_name,
            competitor_name: (content as any).competitor_name,
          },
        };
        break;

      case 'seo_research':
        postData = {
          title: `SEO Research: ${(content as any).query}`,
          content: (content as any).research_output,
          excerpt: (content as any).research_output.substring(0, 160) + '...',
          status: publishOptions.status || 'draft',
          categories: publishOptions.categories || [],
          tags: publishOptions.tags || ['seo', 'research', 'keywords'],
          meta: {
            research_type: (content as any).research_type,
            target_audience: (content as any).target_audience,
            industry: (content as any).industry,
          },
        };
        break;
    }

    // Schedule post if publish date is provided
    let publishedPost;
    if (publishOptions.publishDate) {
      publishedPost = await wpAPI.schedulePost(postData as any, publishOptions.publishDate);
    } else {
      publishedPost = await wpAPI.createPost(postData as any);
    }

    // Log the publishing activity
    await supabase
      .from('publishing_logs')
      .insert({
        user_id: user.id,
        site_id: siteId,
        content_id: contentId,
        content_type: contentType,
        post_id: publishedPost.id,
        status: 'published',
        published_at: new Date().toISOString(),
      } as any);

    return NextResponse.json({ 
      success: true, 
      post: publishedPost,
      message: `Content successfully published to ${(site as any).name}` 
    });

  } catch (error) {
    console.error('WordPress publishing error:', error);
    return NextResponse.json({ 
      error: 'Failed to publish content to WordPress' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Get publishing logs for the site
    const { data: logs, error } = await supabase
      .from('publishing_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching publishing logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('WordPress logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
