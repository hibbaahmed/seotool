import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import RelatedPosts from '@/components/RelatedPosts';
import LinkedContent from '@/components/LinkedContent';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  modified: string;
  author: {
    node: {
      name: string;
      slug: string;
    };
  };
  categories: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
  tags: {
    nodes: Array<{
      name: string;
      slug: string;
    }>;
  };
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  seo?: {
    title: string;
    metaDesc: string;
    canonical: string;
    opengraphTitle: string;
    opengraphDescription: string;
    opengraphImage?: {
      sourceUrl: string;
    };
  };
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/wordpress/post/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: 'Post Not Found',
        description: 'The requested blog post could not be found.',
      };
    }
    
    const { post }: { post: Post } = await response.json();
    
    return {
      title: post.seo?.title || post.title,
      description: post.seo?.metaDesc || post.excerpt.replace(/<[^>]*>/g, ''),
      openGraph: {
        title: post.seo?.opengraphTitle || post.title,
        description: post.seo?.opengraphDescription || post.excerpt.replace(/<[^>]*>/g, ''),
        images: post.seo?.opengraphImage?.sourceUrl || post.featuredImage?.node.sourceUrl ? [
          {
            url: post.seo?.opengraphImage?.sourceUrl || post.featuredImage?.node.sourceUrl || '',
            alt: post.featuredImage?.node.altText || post.title,
          }
        ] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog Post',
      description: 'Read our latest blog post',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/wordpress/post/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      notFound();
    }
    
    const { post }: { post: Post } = await response.json();
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };
    
    const getReadTime = (content: string) => {
      const wordsPerMinute = 200;
      const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      return Math.ceil(wordCount / wordsPerMinute);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Article Header */}
            <article id="blog-article" className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={post.featuredImage.node.sourceUrl}
                    alt={post.featuredImage.node.altText || post.title}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              )}

              <div className="p-8">
                {/* Categories */}
                {post.categories.nodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.categories.nodes.map((category, index) => (
                      <span
                        key={`${category.slug}-${index}`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                  {post.title}
                </h1>

                {/* Excerpt */}
                <div 
                  className="text-xl text-slate-600 mb-8 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-slate-500 mb-8 pb-8 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{post.author.node.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{getReadTime(post.content)} min read</span>
                  </div>
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Content with Automatic Internal Linking */}
                <LinkedContent
                  content={post.content}
                  slug={slug}
                  className="prose prose-lg prose-slate max-w-none 
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-h1:text-4xl prose-h1:mb-4 prose-h1:mt-8
                    prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10 prose-h2:font-bold prose-h2:text-slate-900
                    prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8 prose-h3:font-bold prose-h3:text-slate-900
                    prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6 prose-h4:font-semibold
                    prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                    prose-strong:text-slate-900 prose-strong:font-bold
                    prose-ul:my-6 prose-ul:space-y-2
                    prose-ol:my-6 prose-ol:space-y-2
                    prose-li:text-slate-700 prose-li:leading-relaxed
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-6
                    prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                    prose-table:my-6 prose-table:w-full
                    prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
                    prose-hr:my-8 prose-hr:border-slate-200
                    [&:not(.internal-link)]:prose-a:text-blue-600 [&:not(.internal-link)]:prose-a:no-underline [&:not(.internal-link)]:hover:prose-a:underline [&:not(.internal-link)]:prose-a:font-medium [&:not(.internal-link)]:prose-a:transition-colors"
                />

                {/* Tags */}
                {post.tags.nodes.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.nodes.map((tag, index) => (
                        <Link
                          key={`${tag.slug}-${index}`}
                          href={`/blog/tag/${tag.slug}`}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Related Posts Section */}
            <RelatedPosts currentSlug={slug} limit={6} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching post:', error);
    notFound();
  }
}
