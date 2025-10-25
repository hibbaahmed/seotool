import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    
    if (!wordpressUrl) {
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
        return NextResponse.json({ post: (data as any).post });
      }
    } catch (graphqlError) {
      console.log('GraphQL not available, falling back to REST API');
    }

    // Fallback to WordPress REST API
    const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts?slug=${slug}&status=publish&_embed`, {
      next: { tags: ['wordpress'] }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const posts = await response.json();
    
    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // Transform REST API response to match GraphQL format
    const transformedPost = {
      id: post.id,
      title: post.title.rendered,
      content: post.content.rendered,
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
