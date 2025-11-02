import { NextRequest, NextResponse } from 'next/server';
import { calculateContentSimilarity, type PostMetadata } from '@/lib/blog-interlinking';
import { decodeHtmlEntitiesServer } from '@/lib/decode-html-entities';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  categories: string[];
  tags: string[];
  date: string;
  featured_media_url?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentSlug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!currentSlug) {
      return NextResponse.json({ error: 'slug parameter is required' }, { status: 400 });
    }

    // Get the current post
    const currentPostResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wordpress/post/${currentSlug}`,
      { cache: 'no-store' }
    );

    if (!currentPostResponse.ok) {
      return NextResponse.json({ error: 'Current post not found' }, { status: 404 });
    }

    const { post: currentPost } = await currentPostResponse.json();

    // Get all posts
    const allPostsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wordpress/posts?limit=50`,
      { cache: 'no-store' }
    );

    if (!allPostsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    const { posts } = await allPostsResponse.json();

    // Transform current post to match our Post interface
    const currentPostData: Post = {
      id: currentPost.id.toString(),
      title: decodeHtmlEntitiesServer(currentPost.title || 'Untitled'),
      slug: currentPost.slug,
      excerpt: currentPost.excerpt || '',
      categories: currentPost.categories?.nodes?.map((c: any) => c.name) || [],
      tags: currentPost.tags?.nodes?.map((t: any) => t.name) || [],
      date: currentPost.date,
    };

    // Transform all posts and filter out the current one
    const allPostsData: Post[] = posts
      .filter((p: any) => p.slug !== currentSlug)
      .map((p: any) => ({
        id: p.id.toString(),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || '',
        categories: Array.isArray(p.category_name) 
          ? p.category_name 
          : p.category_name 
            ? [p.category_name] 
            : [],
        tags: Array.isArray(p.tags) ? p.tags : [],
        date: p.date,
        featured_media_url: p.featured_media_url,
      }));

    // Transform to PostMetadata format for similarity calculation
    const currentPostMetadata: PostMetadata = {
      id: currentPostData.id,
      title: currentPostData.title,
      slug: currentPostData.slug,
      excerpt: currentPostData.excerpt,
      content: currentPost.content || currentPostData.excerpt,
      categories: currentPostData.categories,
      tags: currentPostData.tags,
    };

    // Calculate similarity scores using the advanced similarity algorithm
    const postsWithScores = allPostsData.map(post => {
      const postMetadata: PostMetadata = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.excerpt, // Use excerpt as content fallback
        categories: post.categories,
        tags: post.tags,
      };
      
      return {
        ...post,
        similarity: calculateContentSimilarity(currentPostMetadata, postMetadata),
      };
    });

    // Sort by similarity score (highest first) and take top N
    const relatedPosts = postsWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(p => p.similarity > 0) // Only include posts with some similarity
      .map(({ similarity, ...post }) => post); // Remove similarity score from response

    // Fallback: If we don't have enough similar posts, add recent posts from same category
    if (relatedPosts.length < limit) {
      const sameCategoryPosts = allPostsData
        .filter(p => {
          const postCategories = p.categories.map(c => c.toLowerCase());
          const currentCategories = currentPostData.categories.map(c => c.toLowerCase());
          return postCategories.some(cat => currentCategories.includes(cat));
        })
        .filter(p => !relatedPosts.some(rp => rp.id === p.id))
        .slice(0, limit - relatedPosts.length);

      relatedPosts.push(...sameCategoryPosts);
    }

    // Final fallback: If still not enough, add recent posts
    if (relatedPosts.length < limit) {
      const recentPosts = allPostsData
        .filter(p => !relatedPosts.some(rp => rp.id === p.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit - relatedPosts.length);

      relatedPosts.push(...recentPosts);
    }

    return NextResponse.json({ 
      relatedPosts: relatedPosts.slice(0, limit),
      currentPost: {
        categories: currentPostData.categories,
        tags: currentPostData.tags,
      }
    });

  } catch (error) {
    console.error('Error fetching related posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

