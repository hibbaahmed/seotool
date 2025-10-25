import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('WordPress posts API called:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    
    if (!wordpressUrl) {
      return NextResponse.json({ error: 'WordPress URL not configured' }, { status: 500 });
    }

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
        const transformedPosts = (data as any).posts.nodes.map((post: any) => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt?.replace(/<[^>]*>/g, '') || '',
          content: post.content,
          slug: post.slug,
          date: post.date,
          modified: post.modified,
          author_name: post.author?.node?.name || 'Bridgely Team',
          category_name: post.categories?.nodes?.[0]?.name || 'General',
          tags: post.tags?.nodes?.map((tag: any) => tag.name) || [],
          featured_media_url: post.featuredImage?.node?.sourceUrl,
          seo: post.seo
        }));

        return NextResponse.json({ 
          posts: transformedPosts,
          pageInfo: (data as any).posts.pageInfo
        });
      }
    } catch (graphqlError) {
      console.log('GraphQL not available, falling back to REST API');
    }

    // Fallback to WordPress REST API
    const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts?per_page=${limit}&page=${page}&status=publish&_embed`, {
      next: { tags: ['wordpress'] }
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const posts = await response.json();

    // Transform REST API response to match our existing format
    const transformedPosts = posts.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered?.replace(/<[^>]*>/g, '') || '',
      content: post.content.rendered,
      slug: post.slug,
      date: post.date,
      modified: post.modified,
      author_name: post._embedded?.author?.[0]?.name || 'Bridgely Team',
      category_name: post._embedded?.['wp:term']?.[0]?.[0]?.name || 'General',
      tags: post._embedded?.['wp:term']?.[1]?.map((tag: any) => tag.name) || [],
      featured_media_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      seo: null // REST API doesn't include SEO data by default
    }));

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
