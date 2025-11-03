import { NextRequest, NextResponse } from 'next/server';
import { decodeHtmlEntitiesServer } from '@/lib/decode-html-entities';

// Helper function to clean HTML content from numbered sections (1. **Title**, 2. **Meta Description**, etc.)
function cleanBlogContent(html: string): string {
  if (!html) return html;
  
  let cleaned = html;
  
  // Remove plain text "Title:" and "Meta Description:" patterns (most common issue)
  // Handle: "Title: Unlock the Power..." and "Meta Description: Discover..."
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p>\s*Meta Description:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Title:\s*[^\n<]+/gim, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Meta Description:\s*[^\n<]+/gim, '');
  
  // Remove numbered sections at the start of content (most common case)
  // Handle: "1. **Title** [title text] 2. **Meta Description** [description text]"
  // This pattern handles both sections appearing together at the start
  
  // First, remove the entire opening section that contains both Title and Meta Description
  // Match from start: "1. **Title** ... 2. **Meta Description** ..." until we hit actual content
  cleaned = cleaned.replace(/^(<p>)?\s*\d+\.?\s*\*\*Title\*\*\s+[^\n<]+(<\/p>)?\s*(<p>)?\s*\d+\.?\s*\*\*Meta\s+Description\*\*\s+[^\n<]+(<\/p>)?/gi, '');
  cleaned = cleaned.replace(/^(<p>)?\s*1\.\s*\*\*Title\*\*\s+[^\n<]+(<\/p>)?\s*(<p>)?\s*2\.\s*\*\*Meta\s+Description\*\*\s+[^\n<]+(<\/p>)?/gi, '');
  
  // Remove individual numbered Title sections (with text after)
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*\*\*Title\*\*\s+[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*<strong>Title<\/strong>\s+[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/^\s*\d+\.?\s*\*\*Title\*\*\s+[^\n<]+/gim, ''); // Start of string
  cleaned = cleaned.replace(/(<p>)?\s*\d+\.?\s*\*\*Title\*\*\s+[^\n<]{0,300}/gi, '');
  
  // Remove individual numbered Meta Description sections (with text after)
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*\*\*Meta\s+Description\*\*\s+[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*<strong>Meta\s+Description<\/strong>\s+[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/^\s*\d+\.?\s*\*\*Meta\s+Description\*\*\s+[^\n<]+/gim, ''); // Start of string
  cleaned = cleaned.replace(/(<p>)?\s*\d+\.?\s*\*\*Meta\s+Description\*\*\s+[^\n<]{0,300}/gi, '');
  
  // Remove paragraphs that are ONLY the numbered section header (without text)
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*\*\*Title\*\*\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*\*\*Meta\s+Description\*\*\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*<strong>Title<\/strong>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*\d+\.?\s*<strong>Meta\s+Description<\/strong>\s*<\/p>/gi, '');
  
  // Handle standalone section markers (without numbers)
  cleaned = cleaned.replace(/<p>\s*\*\*Title\*\*[:\s]*[^<]*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*\*\*Meta\s+Description\*\*[:\s]*[^<]*<\/p>/gi, '');
  cleaned = cleaned.replace(/^\s*\*\*Title\*\*[:\s]*[^\n<]+/gim, '');
  cleaned = cleaned.replace(/^\s*\*\*Meta\s+Description\*\*[:\s]*[^\n<]+/gim, '');
  
  // Handle patterns that might span multiple lines or be in plain text
  cleaned = cleaned.replace(/\d+\.\s*\*\*Title\*\*\s+[^\n<]{0,500}/gi, '');
  cleaned = cleaned.replace(/\d+\.\s*\*\*Meta\s+Description\*\*\s+[^\n<]{0,500}/gi, '');
  
  // Remove any remaining "Title:" or "Meta Description:" with or without HTML tags
  cleaned = cleaned.replace(/(?:<p[^>]*>)?\s*Title:\s*[^<\n]+(?:<\/p>)?/gi, '');
  cleaned = cleaned.replace(/(?:<p[^>]*>)?\s*Meta Description:\s*[^<\n]+(?:<\/p>)?/gi, '');
  
  // Clean up extra empty paragraphs or whitespace
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, ''); // Multiple passes
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
  cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Trim each line
  cleaned = cleaned.replace(/^(\s*<p>\s*<\/p>\s*)+/gi, ''); // Remove leading empty paragraphs
  
  return cleaned.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const wordpressBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    
    if (!wordpressBase) {
      return NextResponse.json({ error: 'WordPress URL not configured' }, { status: 500 });
    }

    // Try GraphQL first, fallback to REST API
    try {
      const { createServerClient } = await import('@/lib/graphql/client');
      const { GET_POST_BY_SLUG } = await import('@/lib/graphql/queries');
      
      const client = createServerClient();
      const { data } = await client.query({
        query: GET_POST_BY_SLUG,
        variables: { slug },
      });

      if (data && (data as any).post) {
        const post = (data as any).post;
        // Clean the content if it exists
        if (post.content) {
          post.content = cleanBlogContent(post.content);
        }
        // Decode HTML entities in title
        if (post.title) {
          post.title = decodeHtmlEntitiesServer(post.title);
        }
        return NextResponse.json({ post });
      }
    } catch (graphqlError) {
      console.log('GraphQL not available, falling back to REST API');
    }

    // Fallback to REST API
    const hostname = new URL(wordpressBase).hostname;
    let response: Response;
    if (hostname.endsWith('wordpress.com')) {
      const endpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${hostname}/posts/slug:${slug}`;
      response = await fetch(endpoint, { next: { tags: ['wordpress'] } });
      if (!response.ok) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      const post = await response.json();
      if (!post || !post.ID) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      const transformedPost = {
        id: post.ID,
        title: decodeHtmlEntitiesServer(post.title || 'Untitled'),
        content: cleanBlogContent(post.content),
        excerpt: (post.excerpt || '').replace(/<[^>]*>/g, ''),
        slug: post.slug,
        date: post.date,
        modified: post.modified,
        author: { node: { name: post.author?.name || 'Bridgely Team' } },
        categories: { nodes: Object.keys(post.categories || {}).map((name) => ({ name })) },
        tags: { nodes: Object.keys(post.tags || {}).map((name) => ({ name })) },
        featuredImage: post.featured_image ? { node: { sourceUrl: post.featured_image } } : null,
        seo: null
      };
      return NextResponse.json({ post: transformedPost });
    }

    // Self-hosted WordPress
    const responseSelf = await fetch(`${wordpressBase.replace(/\/$/, '')}/wp-json/wp/v2/posts?slug=${slug}&status=publish&_embed`, { next: { tags: ['wordpress'] } });
    if (!responseSelf.ok) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const postsArr = await responseSelf.json();
    if (!Array.isArray(postsArr) || postsArr.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    const post = postsArr[0];

    // Transform REST API response to match GraphQL format
    const transformedPost = {
      id: post.id,
      title: decodeHtmlEntitiesServer(post.title?.rendered || 'Untitled'),
      content: cleanBlogContent(post.content.rendered),
      excerpt: post.excerpt.rendered?.replace(/<[^>]*>/g, '') || '',
      slug: post.slug,
      date: post.date,
      modified: post.modified,
      author: {
        node: {
          name: post._embedded?.author?.[0]?.name || 'Bridgely Team'
        }
      },
      categories: {
        nodes: post._embedded?.['wp:term']?.[0]?.map((cat: any) => ({ name: cat.name })) || []
      },
      tags: {
        nodes: post._embedded?.['wp:term']?.[1]?.map((tag: any) => ({ name: tag.name })) || []
      },
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0] ? {
        node: {
          sourceUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url
        }
      } : null,
      seo: null // REST API doesn't include SEO data by default
    };

    return NextResponse.json({ post: transformedPost });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
