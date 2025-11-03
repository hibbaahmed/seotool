import { NextRequest, NextResponse } from 'next/server';
import { decodeHtmlEntitiesServer } from '@/lib/decode-html-entities';

/**
 * Extract the first image URL from HTML content
 * Handles both HTML and markdown formats, and WordPress-specific structures
 */
function extractFirstImageFromContent(content: string): string | null {
  if (!content) return null;
  
  console.log('🔍 Extracting image from content (length:', content.length, ')');
  
  // Decode HTML entities first (WordPress often encodes URLs)
  const decodedContent = content
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, '...')
    .replace(/&quot;/g, '"');
  
  // Try to find HTML img tags first (most common in WordPress): <img src="url" ...>
  // Handle both single and double quotes, and HTML-encoded URLs
  const htmlImagePatterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,  // Standard format
    /<img[^>]+src=([^\s>]+)/i,                // Without quotes
  ];
  
  for (const pattern of htmlImagePatterns) {
    const match = decodedContent.match(pattern);
    if (match && match[1]) {
      let imageUrl = match[1].trim();
      // Clean up the URL (remove trailing quotes, etc.)
      imageUrl = imageUrl.replace(/["']/g, '').replace(/&amp;/g, '&');
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log('✅ Found HTML img tag:', imageUrl);
        return imageUrl;
      }
    }
  }
  
  // Try to find markdown images: ![alt](url)
  const markdownImageMatch = decodedContent.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (markdownImageMatch && markdownImageMatch[1]) {
    let imageUrl = markdownImageMatch[1].trim();
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('✅ Found markdown image:', imageUrl);
      return imageUrl;
    }
  }
  
  // Try to find Supabase storage URLs or other image URLs in content
  // Match URLs that contain common image file extensions
  const urlPatterns = [
    /(https?:\/\/[^\s<>"'&]+\.(?:jpg|jpeg|png|gif|webp|svg))(?:\?[^\s<>"']*)?/gi,
    /(https:\/\/[^\.]+\.supabase\.co\/storage\/v1\/object\/public\/photos\/[^\s<>"'&]+)/gi,
  ];
  
  for (const pattern of urlPatterns) {
    const matches = decodedContent.match(pattern);
    if (matches && matches.length > 0) {
      // Clean up the URL
      let imageUrl = matches[0].replace(/&amp;/g, '&').trim();
      console.log('✅ Found image URL in content:', imageUrl);
      return imageUrl;
    }
  }
  
  console.log('⚠️ No image found in content');
  return null;
}

export async function GET(request: NextRequest) {
  console.log('WordPress posts API called:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Resolve WordPress base URL from env and derive hostname
    const wordpressBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    if (!wordpressBase) {
      return NextResponse.json({ error: 'WordPress URL not configured' }, { status: 500 });
    }

    const wordpressHostname = new URL(wordpressBase).hostname;

    // Try GraphQL first, fallback to REST API
    try {
      const { createServerClient } = await import('@/lib/graphql/client');
      const { GET_POSTS } = await import('@/lib/graphql/queries');
      
      const client = createServerClient();
      const { data } = await client.query({
        query: GET_POSTS,
        variables: { 
          first: limit,
          after: null
        },
        context: {
          fetchOptions: {
            next: { tags: ['wordpress'] }
          }
        }
      });

      if (data && (data as any).posts) {
        // Transform GraphQL response to match our existing format
        const transformedPosts = (data as any).posts.nodes.map((post: any) => {
          // Extract first image from content if no featured image is set
          let contentImage: string | null = null;
          if (!post.featuredImage?.node?.sourceUrl) {
            // GraphQL returns HTML content, extract from that
            contentImage = extractFirstImageFromContent(post.content || '');
            console.log('📸 Extracted image for post:', post.slug, 'Image:', contentImage);
          }
          
          const featuredImage = post.featuredImage?.node?.sourceUrl || contentImage;
          console.log('🖼️ Final featured image for post:', post.slug, ':', featuredImage);
          
          return {
            id: post.id,
            title: decodeHtmlEntitiesServer(post.title || 'Untitled'),
            excerpt: post.excerpt?.replace(/<[^>]*>/g, '') || '',
            content: post.content,
            slug: post.slug,
            date: post.date,
            modified: post.modified,
            author_name: post.author?.node?.name || 'Bridgely Team',
            category_name: post.categories?.nodes?.[0]?.name || 'General',
            tags: post.tags?.nodes?.map((tag: any) => tag.name) || [],
            featured_media_url: featuredImage,
            seo: post.seo
          };
        });

        return NextResponse.json({ 
          posts: transformedPosts,
          pageInfo: (data as any).posts.pageInfo
        });
      }
    } catch (graphqlError) {
      console.log('GraphQL not available, falling back to REST API');
    }

    // Fallback to REST API
    // If this is a WordPress.com hosted site, use the WordPress.com REST API
    let response: Response;
    if (wordpressHostname.endsWith('wordpress.com')) {
      const wpcomEndpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${wordpressHostname}/posts/?number=${limit}&page=${page}&status=publish`;
      response = await fetch(wpcomEndpoint, { next: { tags: ['wordpress'] } });
    } else {
      // Self-hosted WordPress
      const wpjsonEndpoint = `${wordpressBase.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=${limit}&page=${page}&status=publish&_embed`;
      response = await fetch(wpjsonEndpoint, { next: { tags: ['wordpress'] } });
    }

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const raw = await response.json();
    const posts = Array.isArray(raw) ? raw : (raw.posts || []);

    // Transform REST API response to match our existing format
    const transformedPosts = posts.map((post: any) => {
      // Normalize both WP.com and self-hosted responses
      const isWPCom = !!post.ID; // WP.com uses ID (caps)
      const rawTitle = isWPCom ? post.title : post.title?.rendered;
      const content = isWPCom ? post.content : post.content?.rendered;
      const featuredMedia = isWPCom ? post.featured_image : post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      
      // Extract first image from content if no featured image is set
      let contentImage: string | null = null;
      if (!featuredMedia) {
        contentImage = extractFirstImageFromContent(content || '');
        console.log('📸 Extracted image for post:', post.slug, 'Image:', contentImage);
      }
      
      const finalFeaturedImage = featuredMedia || contentImage;
      console.log('🖼️ Final featured image for post:', post.slug, ':', finalFeaturedImage);
      
      return {
        id: isWPCom ? post.ID : post.id,
        title: decodeHtmlEntitiesServer(rawTitle || 'Untitled'),
        excerpt: (isWPCom ? post.excerpt : post.excerpt?.rendered)?.replace(/<[^>]*>/g, '') || '',
        content: content,
        slug: post.slug,
        date: post.date,
        modified: post.modified,
        author_name: isWPCom ? post.author?.name : post._embedded?.author?.[0]?.name || 'Bridgely Team',
        category_name: isWPCom ? Object.keys(post.categories || {})[0] || 'General' : post._embedded?.['wp:term']?.[0]?.[0]?.name || 'General',
        tags: isWPCom ? Object.keys(post.tags || {}) : (post._embedded?.['wp:term']?.[1]?.map((t: any) => t.name) || []),
        featured_media_url: finalFeaturedImage,
        seo: null
      };
    });

    return NextResponse.json({ 
      posts: transformedPosts,
      pageInfo: {
        hasNextPage: posts.length === limit,
        hasPreviousPage: page > 1,
        endCursor: posts.length > 0 ? posts[posts.length - 1].id : null
      }
    });

  } catch (error) {
    console.error('WordPress posts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
