import { NextRequest, NextResponse } from 'next/server';
import { decodeHtmlEntitiesServer } from '@/lib/decode-html-entities';

// Helper function to clean HTML content from numbered sections (1. **Title**, 2. **Meta Description**, etc.)
function cleanBlogContent(html: string): string {
  if (!html) return html;
  
  let cleaned = html;
  
  // Remove plain text "Title:" and "Meta Description:" patterns (most common issue)
  // Handle: "Title: Unlock the Power..." and "Meta Description: Discover..."
  // Also handle when they appear together on the same line: "Title: ... Meta Description: ..."
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p>\s*Meta Description:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Title:\s*[^\n<]+/gim, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Meta Description:\s*[^\n<]+/gim, '');
  
  // Handle when Title and Meta Description appear together on same line (common pattern)
  // Pattern: "Title: ... Meta Description: ..." (can span across text without HTML)
  cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n<]+/gi, '');
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^M]+Meta Description:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p[^>]*>\s*Title:\s*[^M]+Meta Description:\s*[^<]+<\/p>/gi, '');
  
  // Remove any remaining "Title:" or "Meta Description:" at the very start of content
  // Handle both HTML and plain text formats
  cleaned = cleaned.replace(/^(<p[^>]*>)?\s*Title:\s*[^\n<]+/im, '');
  cleaned = cleaned.replace(/^(<p[^>]*>)?\s*Meta Description:\s*[^\n<]+/im, '');
  
  // Also handle cases where they might be in the first paragraph tag
  cleaned = cleaned.replace(/^<p[^>]*>\s*Title:\s*[^<]+<\/p>/im, '');
  cleaned = cleaned.replace(/^<p[^>]*>\s*Meta Description:\s*[^<]+<\/p>/im, '');
  
  // Handle when they appear consecutively but in separate elements
  cleaned = cleaned.replace(/(<p[^>]*>\s*Title:\s*[^<]+<\/p>\s*)+<p[^>]*>\s*Meta Description:\s*[^<]+<\/p>/gi, '');
  
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
  
  // Remove any remaining "Title:" or "Meta Description:" with or without HTML tags - ANYWHERE
  cleaned = cleaned.replace(/(?:<p[^>]*>)?\s*Title:\s*[^<\n]+(?:<\/p>)?/gi, '');
  cleaned = cleaned.replace(/(?:<p[^>]*>)?\s*Meta Description:\s*[^<\n]+(?:<\/p>)?/gi, '');
  cleaned = cleaned.replace(/Title:\s*[^\n<]+/gi, '');
  cleaned = cleaned.replace(/Meta Description:\s*[^\n<]+/gi, '');
  
  // Remove H1 tags containing "Meta Description"
  cleaned = cleaned.replace(/<h1[^>]*>[^<]*Meta Description[^<]*<\/h1>/gi, '');
  
  // Remove broken/incomplete image tags (only those with # in URL - truly broken)
  cleaned = cleaned.replace(/<img\s+src="[^"]*#[^"]*"[^>]*>/gi, '');
  // DON'T remove valid images with multiple attributes - the negative lookahead was too aggressive
  
  // Remove "Post-Processing and Enhancement" and similar markers
  cleaned = cleaned.replace(/<p>\s*(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<h[2-6][^>]*>\s*(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)\s*<\/h[2-6]>/gi, '');
  cleaned = cleaned.replace(/(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)/gi, '');
  
  // Remove instruction markers that shouldn't be in content
  cleaned = cleaned.replace(/<h1[^>]*>\s*Remaining H2 Sections?\s*<\/h1>/gi, '');
  cleaned = cleaned.replace(/<h[1-6][^>]*>\s*(?:Write|Add|Include)\s+[^<]+<\/h[1-6]>/gi, '');
  cleaned = cleaned.replace(/<p>\s*\[(?:Write|Add|Include|Insert|Place)[^\]]*\]\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/\[(?:Write|Add|Include|Insert|Place)[^\]]*\]/gi, '');
  
  // Remove orphaned table elements (tables with only headers, no data)
  cleaned = cleaned.replace(/<table[^>]*>\s*<thead[^>]*>[\s\S]*?<\/thead>\s*<tbody[^>]*>\s*<\/tbody>\s*<\/table>/gi, '');
  cleaned = cleaned.replace(/<table[^>]*>\s*<thead[^>]*>[\s\S]*?<\/thead>\s*<\/table>/gi, '');
  
  // Fix tables with paragraph text in table rows - extract and place after table
  // Look for table rows with cells containing long paragraph text
  cleaned = cleaned.replace(/(<table[^>]*>[\s\S]*?)(<tr[^>]*>\s*<td[^>]*>([^<]{50,}(?:[.!]\s+[A-Z][^<]+[.!])+[^<]*)<\/td>\s*<\/tr>)([\s\S]*?<\/table>)/gi,
    (match, tableStart, rowWithText, textContent, tableEnd) => {
      const cleanText = textContent.trim().replace(/<[^>]+>/g, '');
      return `${tableStart}${tableEnd}<p>${cleanText}</p>`;
    }
  );
  
  // Remove instruction placeholders
  cleaned = cleaned.replace(/\[(?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\((?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\)]*\)/gi, '');
  
  // Clean up extra empty paragraphs or whitespace
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, ''); // Multiple passes
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
  cleaned = cleaned.replace(/^\s+|\s+$/gm, ''); // Trim each line
  cleaned = cleaned.replace(/^(\s*<p>\s*<\/p>\s*)+/gi, ''); // Remove leading empty paragraphs
  cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>'); // Clean up multiple line breaks
  
  // Remove standalone > characters (leftover from blockquotes or markdown)
  cleaned = cleaned.replace(/<p>\s*>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/^\s*>\s*$/gm, '');
  cleaned = cleaned.replace(/(<p>)?\s*>\s*(<\/p>)?/gi, '');
  
  return cleaned.trim();
}

function cleanBlogExcerpt(excerpt: string | null | undefined, title?: string): string {
  if (!excerpt) return '';

  let cleaned = cleanBlogContent(excerpt);
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (title) {
    const normalizedTitle = title.replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalizedTitle && cleaned.toLowerCase().startsWith(normalizedTitle)) {
      cleaned = cleaned.slice(normalizedTitle.length).trim();
    }
  }

  // Remove lingering punctuation or separators left behind
  cleaned = cleaned.replace(/^[:\-–—,\s]+/, '').trim();

  return cleaned;
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
      if (post.excerpt) {
        post.excerpt = cleanBlogExcerpt(post.excerpt, post.title);
      } else if (post.content) {
        post.excerpt = cleanBlogExcerpt(post.content, post.title).substring(0, 220);
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
        excerpt: cleanBlogExcerpt(post.excerpt, post.title || ''),
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
      excerpt: cleanBlogExcerpt(post.excerpt.rendered, post.title?.rendered),
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
