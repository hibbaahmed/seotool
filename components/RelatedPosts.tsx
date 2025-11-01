"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  categories?: string[];
  tags?: string[];
  featured_media_url?: string;
}

interface RelatedPostsProps {
  currentSlug: string;
  limit?: number;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentSlug, limit = 6 }) => {
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        const response = await fetch(
          `/api/wordpress/related-posts?slug=${currentSlug}&limit=${limit}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setRelatedPosts(data.relatedPosts || []);
        }
      } catch (error) {
        console.error('Error fetching related posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedPosts();
  }, [currentSlug, limit]);

  if (loading) {
    return (
      <div className="mt-16 pt-12 border-t border-slate-200">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReadTime = (excerpt: string) => {
    const wordsPerMinute = 200;
    const wordCount = excerpt.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute) || 3;
  };

  return (
    <div className="mt-16 pt-12 border-t border-slate-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px bg-gradient-to-r from-blue-500 to-indigo-500 flex-1"></div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 px-4">
          Related Articles
        </h2>
        <div className="h-px bg-gradient-to-r from-indigo-500 to-blue-500 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <article
            key={post.id}
            className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300"
          >
            {/* Featured Image */}
            {post.featured_media_url ? (
              <Link href={`/blog/${post.slug}`}>
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                  <Image
                    src={post.featured_media_url}
                    alt={post.title}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </Link>
            ) : (
              <Link href={`/blog/${post.slug}`}>
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-blue-400" />
                </div>
              </Link>
            )}

            <div className="p-5">
              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {post.categories[0]}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h3>

              {/* Excerpt */}
              <p 
                className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: post.excerpt?.replace(/<[^>]*>/g, '').substring(0, 120) + '...' || ''
                }}
              />

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{getReadTime(post.excerpt)} min read</span>
                </div>
              </div>

              {/* Read More Link */}
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:gap-3 transition-all"
              >
                Read Article
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* View All Posts Link */}
      <div className="mt-10 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <BookOpen className="w-5 h-5" />
          View All Blog Posts
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default RelatedPosts;

