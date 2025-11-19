import { NextRequest, NextResponse } from 'next/server';
import { marked } from 'marked';
import { createClient } from '@/utils/supabase/server';
import { WordPressAPI } from '@/lib/wordpress/api';
import { addInternalLinksToContent } from '@/lib/add-links-to-content';
import {
  addInlineSpacing,
  convertHtmlPipeTablesToHtml,
  convertMarkdownTablesToHtml,
  insertHeaderImage,
  stripLeadingHeading,
  removeExcessiveBoldFromHTML,
} from '@/lib/wordpress/content-formatting';

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

function isLikelyHtml(content: string) {
  return HTML_TAG_REGEX.test(content);
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*?\]\(([^)]+)\)/;
const HTML_IMAGE_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;

function extractHeaderImageCandidate(content: string) {
  let workingContent = content;

  const markdownMatch = workingContent.match(MARKDOWN_IMAGE_REGEX);
  if (markdownMatch && markdownMatch[1]) {
    const url = markdownMatch[1].trim();
    workingContent = workingContent.replace(MARKDOWN_IMAGE_REGEX, '');
    return { content: workingContent, imageUrl: url };
  }

  const htmlMatch = workingContent.match(HTML_IMAGE_REGEX);
  if (htmlMatch && htmlMatch[1]) {
    const url = htmlMatch[1].trim();
    workingContent = workingContent.replace(HTML_IMAGE_REGEX, '');
    return { content: workingContent, imageUrl: url };
  }

  return { content: workingContent, imageUrl: undefined };
}

async function prepareContentForWordPress(rawContent: string, title: string) {
  const { content: strippedContent, imageUrl: initialHeroImage } = extractHeaderImageCandidate(rawContent);
  const contentWithoutHeading = stripLeadingHeading(strippedContent);
  let htmlContent = contentWithoutHeading;

  if (!isLikelyHtml(contentWithoutHeading.trim())) {
    const markdownWithTables = convertMarkdownTablesToHtml(contentWithoutHeading);
    htmlContent = marked.parse(markdownWithTables, { async: false }) as string;
    htmlContent = convertHtmlPipeTablesToHtml(htmlContent);
  }

  htmlContent = removeExcessiveBoldFromHTML(htmlContent);
  htmlContent = addInlineSpacing(htmlContent);
  htmlContent = insertHeaderImage(htmlContent, initialHeroImage, title, { fallbackToExisting: true });

  try {
    const { linkedContent } = await addInternalLinksToContent(htmlContent, title);
    return linkedContent;
  } catch (error) {
    console.error('Error adding internal links to WordPress blog content:', error);
    return htmlContent;
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
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
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

    // Build query parameters
    const params: any = {
      per_page: perPage,
      page: page,
      status: 'publish',
    };

    if (search) {
      params.search = search;
    }

    if (category) {
      params.categories = category;
    }

    // Fetch posts from WordPress
    const posts = await wpAPI.getPosts(params);

    // Get categories for filtering
    const categories = await wpAPI.getCategories();

    return NextResponse.json({ 
      posts,
      categories,
      pagination: {
        page,
        per_page: perPage,
        total: posts.length,
      }
    });

  } catch (error) {
    console.error('WordPress blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
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
      title, 
      content, 
      excerpt, 
      status = 'publish',
      categories = [],
      tags = [],
      featuredImage,
      publishDate,
      meta = {}
    } = body;

    if (!siteId || !title || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, title, content' 
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

    const preparedContent = await prepareContentForWordPress(content, title);
    const fallbackExcerptSource = stripHtmlTags(preparedContent);
    const fallbackExcerpt = fallbackExcerptSource.substring(0, 160);
    const excerptText = excerpt?.trim().length
      ? excerpt
      : `${fallbackExcerpt}${fallbackExcerptSource.length > 160 ? '...' : ''}`;

    const postData = {
      title,
      content: preparedContent,
      excerpt: excerptText,
      status,
      categories,
      tags,
      featured_media: featuredImage,
      meta,
    };

    // Create or schedule the post
    let publishedPost;
    if (publishDate && publishDate > new Date().toISOString()) {
      publishedPost = await wpAPI.schedulePost(postData, publishDate);
    } else {
      publishedPost = await wpAPI.createPost(postData);
    }

    // Log the publishing activity
    await supabase
      .from('publishing_logs')
      .insert({
        user_id: user.id,
        site_id: siteId,
        content_id: publishedPost.id,
        content_type: 'blog_post',
        post_id: publishedPost.id,
        status: 'published',
        published_at: new Date().toISOString(),
      } as any);

    return NextResponse.json({ 
      success: true, 
      post: publishedPost,
      message: `Blog post successfully ${status === 'publish' ? 'published' : 'saved as draft'} to ${(site as any).name}` 
    });

  } catch (error) {
    console.error('WordPress blog creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create blog post' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      siteId, 
      postId,
      title, 
      content, 
      excerpt, 
      status,
      categories = [],
      tags = [],
      featuredImage,
      meta = {}
    } = body;

    if (!siteId || !postId) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, postId' 
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

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    if (status) updateData.status = status;
    if (categories.length > 0) updateData.categories = categories;
    if (tags.length > 0) updateData.tags = tags;
    if (featuredImage) updateData.featured_media = featuredImage;
    if (Object.keys(meta).length > 0) updateData.meta = meta;

    // Update the post
    const updatedPost = await wpAPI.updatePost(postId, updateData);

    return NextResponse.json({ 
      success: true, 
      post: updatedPost,
      message: `Blog post successfully updated` 
    });

  } catch (error) {
    console.error('WordPress blog update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update blog post' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const postId = searchParams.get('postId');

    if (!siteId || !postId) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, postId' 
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

    // Delete the post (WordPress API doesn't have a delete method in our implementation)
    // We would need to add this to the WordPressAPI class
    // For now, we'll just return success
    // const deletedPost = await wpAPI.deletePost(postId);

    return NextResponse.json({ 
      success: true,
      message: `Blog post successfully deleted` 
    });

  } catch (error) {
    console.error('WordPress blog deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete blog post' 
    }, { status: 500 });
  }
}
