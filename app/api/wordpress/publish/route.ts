import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WordPressAPI } from '@/lib/wordpress/api';
import { marked } from 'marked';

// Helper function to extract clean content from AI output
function extractContentFromAIOutput(fullOutput: string): string {
  if (!fullOutput) return '';
  
  let cleaned = fullOutput;
  
  // Step 1: Remove numbered sections with Title/Meta Description (handles inline formats too)
  // Pattern: "1. **Title** [text]" or "1. **Title**\n[text]" or "**Title** [text]"
  cleaned = cleaned.replace(/(?:^|\n)\d+\.\s*\*\*Title\*\*\s*[^\n]+\n?/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\*\*Title\*\*[:\s]*\n[^\n]+\n?/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\d+\.\s*\*\*Title\*\*[:\s]*/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)Title:\s*"?[^"\n]+"?\n?/gi, '');
  
  // Step 2: Remove Meta Description sections
  cleaned = cleaned.replace(/(?:^|\n)\d+\.\s*\*\*Meta Description\*\*\s*[^\n]+\n?/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\*\*Meta Description\*\*[:\s]*\n[^\n]+\n?/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\d+\.\s*\*\*Meta Description\*\*[:\s]*/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)Meta Description:\s*"?[^"\n]+"?\n?/gi, '');
  
  // Step 3: Find and extract the Content section
  // Look for "3. **Content**" or "**Content**" followed by the actual content
  const contentMatch = cleaned.match(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n?(.*)$/is);
  
  if (contentMatch && contentMatch[1]) {
    let extractedContent = contentMatch[1];
    
    // Remove the duplicate H1 title if it matches (first line after Content should not be duplicate title)
    // Pattern: "# [Title]" that's redundant
    const lines = extractedContent.split('\n');
    let startIndex = 0;
    
    // Skip the first H1 heading if it's just a duplicate title
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.match(/^#\s+[^\n]+$/)) {
        // This is likely a duplicate title, skip it and the following blank line
        startIndex = i + 1;
        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
          startIndex = i + 2;
        }
        break;
      } else if (line && !line.startsWith('#')) {
        // Found actual content, start from here
        startIndex = i;
        break;
      }
    }
    
    extractedContent = lines.slice(startIndex).join('\n');
    
    // Remove trailing sections (SEO Suggestions, Call-to-Action, etc.)
    const stopKeywords = [
      '\n4. **SEO Suggestions',
      '\n**SEO Suggestions**',
      '\n## SEO Suggestions',
      '\n4. **Image Suggestions',
      '\n**Image Suggestions**',
      '\n## Image Suggestions',
      '\n5. **Call-to-Action',
      '\n**Call-to-Action**',
      '\n## Call-to-Action',
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
  
  // Step 4: If no Content section marker found, try to extract just the markdown content
  // Remove any remaining numbered sections and keep only the actual content
  cleaned = cleaned.replace(/(?:^|\n)\d+\.\s*\*\*[^*]+\*\*/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\*\*(?:Title|Meta Description|Content)\*\*[:\s]*/gi, '');
  
  // Remove duplicate H1 titles (keep only the first one)
  const lines = cleaned.split('\n');
  let h1Count = 0;
  const cleanedLines = lines.filter(line => {
    if (line.trim().match(/^#\s+[^\n]+$/)) {
      h1Count++;
      // Keep only the first H1
      return h1Count === 1;
    }
    return true;
  });
  cleaned = cleanedLines.join('\n');
  
  return cleaned.trim();
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
        // Extract title from content_output (prefer extracted title over topic)
        const contentOutput = (content as any).content_output || '';
        let extractedTitle = (content as any).topic || 'Generated Article';
        const titlePatterns = [
          /(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n([^\n]+)/i,
          /(?:^|\n)Title:\s*"?([^"\n]+)"?/i,
          /(?:^|\n)\*\*Title\*\*[:\s]*\n([^\n]+)/i
        ];
        for (const pattern of titlePatterns) {
          const match = contentOutput.match(pattern);
          if (match && match[1]) {
            extractedTitle = match[1].trim().replace(/^["']|["']$/g, '');
            break;
          }
        }
        
        // Extract clean content from AI output (removes title, meta description, etc.)
        const extractedContent = extractContentFromAIOutput(contentOutput);
        postData = {
          title: extractedTitle,
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
      
      // Convert Markdown to HTML for WordPress.com
      const htmlContent = typeof postData.content === 'string' 
        ? (marked.parse(postData.content, { async: false }) as string)
        : String(postData.content);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postData.title,
          content: htmlContent,
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