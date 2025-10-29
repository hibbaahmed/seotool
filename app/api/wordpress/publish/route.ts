import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WordPressAPI } from '@/lib/wordpress/api';

// Helper function to extract clean content from AI output
function extractContentFromAIOutput(fullOutput: string): string {
  // Split by sections
  const sections = fullOutput.split(/^(##? |\d+\. \*\*)/m);
  
  // Find the "Content" section
  let contentStartIndex = -1;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    // Check if this section is the Content section
    if (section.includes('**Content**') || section.includes('# Content') || section.match(/^3\.?\s*\*\*Content/)) {
      contentStartIndex = i + 1;
      break;
    }
  }
  
  // If we found the Content section, extract everything after it
  if (contentStartIndex !== -1 && contentStartIndex < sections.length) {
    const contentParts = sections.slice(contentStartIndex);
    let extractedContent = contentParts.join('');
    
    // Remove any trailing sections like "Image Suggestions", "SEO Suggestions", "Call-to-Action"
    const stopKeywords = [
      '\n## Image Suggestions',
      '\n## SEO Suggestions',
      '\n## Call-to-Action',
      '\n**Image Suggestions**',
      '\n**SEO Suggestions**',
      '\n**Call-to-Action**',
      '\n4. **Image',
      '\n5. **SEO',
      '\n6. **Call'
    ];
    
    for (const keyword of stopKeywords) {
      const index = extractedContent.indexOf(keyword);
      if (index !== -1) {
        extractedContent = extractedContent.substring(0, index);
        break;
      }
    }
    
    return extractedContent.trim();
  }
  
  // If no Content section found, return the full output
  return fullOutput;
}

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

    // Check if this is a WordPress.com site (OAuth)
    const isWPCom = (site as any).provider === 'wpcom';
    let publishedPost;

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

    // Initialize WordPress API (only for self-hosted)
    let wpAPI: WordPressAPI | null = null;
    let tagIds: number[] = [];
    
    if (!isWPCom) {
      wpAPI = new WordPressAPI({
        id: (site as any).id,
        name: (site as any).name,
        url: (site as any).url,
        username: (site as any).username,
        password: (site as any).password,
        isActive: (site as any).is_active,
        createdAt: (site as any).created_at,
        updatedAt: (site as any).updated_at,
      });

      // Convert tag names to tag IDs if tags are provided as strings
      if (publishOptions.tags && publishOptions.tags.length > 0) {
        // Check if tags are strings (names) or numbers (IDs)
        if (typeof publishOptions.tags[0] === 'string') {
          // Tags are names, need to convert to IDs
          tagIds = await wpAPI.getOrCreateTagIds(publishOptions.tags);
        } else {
          // Tags are already IDs
          tagIds = publishOptions.tags;
        }
      }
    }

    // Prepare WordPress post data
    let postData: {
      title: string;
      content: string;
      excerpt: string;
      status: string;
      categories: any[];
      tags: any[];
      meta: any;
    } | null = null;
    
    switch (contentType) {
      case 'content':
        // Extract clean content from AI output (removes title, meta description, etc.)
        const extractedContent = extractContentFromAIOutput((content as any).content_output);
        postData = {
          title: (content as any).topic,
          content: extractedContent,
          excerpt: extractedContent.substring(0, 160).replace(/[#*]/g, '') + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: tagIds,
          meta: {
            content_type: (content as any).content_type,
            target_audience: (content as any).target_audience,
            tone: (content as any).tone,
            length: (content as any).length,
          },
        };
        break;
      case 'analysis':
        // Get or create tag IDs for default tags (only for self-hosted)
        let analysisTagIds = tagIds;
        if (!isWPCom && wpAPI) {
          analysisTagIds = await wpAPI.getOrCreateTagIds([
            'competitive-analysis', 
            'business-analysis',
            ...publishOptions.tags || []
          ]);
        }
        
        postData = {
          title: `Competitive Analysis: ${(content as any).company_name} vs ${(content as any).competitor_name}`,
          content: (content as any).analysis_output,
          excerpt: (content as any).analysis_output.substring(0, 160) + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: analysisTagIds,
          meta: {
            analysis_type: (content as any).analysis_type,
            company_name: (content as any).company_name,
            competitor_name: (content as any).competitor_name,
          },
        };
        break;
      case 'seo_research':
        // Get or create tag IDs for default tags (only for self-hosted)
        let seoTagIds = tagIds;
        if (!isWPCom && wpAPI) {
          seoTagIds = await wpAPI.getOrCreateTagIds([
            'seo', 
            'research', 
            'keywords',
            ...publishOptions.tags || []
          ]);
        }
        
        postData = {
          title: `SEO Research: ${(content as any).query}`,
          content: (content as any).research_output,
          excerpt: (content as any).research_output.substring(0, 160) + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: seoTagIds,
          meta: {
            research_type: (content as any).research_type,
            target_audience: (content as any).target_audience,
            industry: (content as any).industry,
          },
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Ensure postData is defined
    if (!postData) {
      return NextResponse.json({ error: 'Failed to prepare post data' }, { status: 500 });
    }

    // Publish to WordPress
    if (isWPCom) {
      // Use WordPress.com REST API
      const accessToken = (site as any).access_token;
      const siteIdNum = (site as any).site_id;

      if (!accessToken || !siteIdNum) {
        return NextResponse.json({ 
          error: 'WordPress.com site missing credentials' 
        }, { status: 400 });
      }

      // WordPress.com API endpoint
      const endpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${siteIdNum}/posts/new`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          excerpt: publishOptions.excerpt || postData.excerpt,
          status: publishOptions.status || 'publish',
          tags: publishOptions.tags || [],
          categories: publishOptions.categories || [],
          date: publishOptions.publishDate || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('WordPress.com publishing error:', error);
        return NextResponse.json({ 
          error: 'Failed to publish to WordPress.com',
          details: error
        }, { status: response.status });
      }

      publishedPost = await response.json();
    } else {
      // Use self-hosted WordPress REST API
      if (!wpAPI) {
        return NextResponse.json({ error: 'WordPress API not initialized' }, { status: 500 });
      }
      
      if (publishOptions.publishDate) {
        publishedPost = await wpAPI.schedulePost(postData as any, publishOptions.publishDate);
      } else {
        publishedPost = await wpAPI.createPost(postData as any);
      }
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
      error: 'Failed to publish content to WordPress',
      details: error instanceof Error ? error.message : 'Unknown error'
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