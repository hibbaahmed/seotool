"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ArrowRight, ExternalLink, BookOpen, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  readTime: number;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  slug: string;
}

interface BlogSectionProps {
  posts?: BlogPost[];
  showAllPosts?: boolean;
  maxPosts?: number;
}

const BlogSection: React.FC<BlogSectionProps> = ({ 
  posts = [], 
  showAllPosts = false, 
  maxPosts = 3 
}) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(posts);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  // Sample blog posts data - in a real app, this would come from your WordPress API
  const samplePosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Complete Guide to AI-Powered SEO Content Creation in 2024',
      excerpt: 'Discover how artificial intelligence is revolutionizing SEO content creation, from keyword research to automated optimization strategies that deliver real results.',
      content: '',
      publishedAt: '2024-01-15',
      readTime: 8,
      author: 'SEOFlow Team',
      category: 'SEO',
      tags: ['AI', 'SEO', 'Content Creation', 'Automation'],
      slug: 'ai-powered-seo-content-creation-guide-2024'
    },
    {
      id: '2',
      title: 'WordPress Integration: How to Automate Your Blog Publishing Workflow',
      excerpt: 'Learn how to seamlessly integrate WordPress with AI content tools to create, optimize, and publish blog posts automatically while maintaining quality.',
      content: '',
      publishedAt: '2024-01-12',
      readTime: 6,
      author: 'SEOFlow Team',
      category: 'WordPress',
      tags: ['WordPress', 'Automation', 'Blog', 'Integration'],
      slug: 'wordpress-automation-blog-publishing-workflow'
    },
    {
      id: '3',
      title: 'Competitive Analysis: The Secret Weapon for SEO Success',
      excerpt: 'Uncover the strategies your competitors are using to rank higher and learn how to implement advanced competitive analysis techniques for better SEO results.',
      content: '',
      publishedAt: '2024-01-10',
      readTime: 7,
      author: 'SEOFlow Team',
      category: 'Strategy',
      tags: ['Competitive Analysis', 'SEO Strategy', 'Research'],
      slug: 'competitive-analysis-seo-success-secret'
    },
    {
      id: '4',
      title: 'From Zero to Hero: Building Authority Content That Ranks',
      excerpt: 'Master the art of creating authoritative content that not only ranks well but establishes your brand as a thought leader in your industry.',
      content: '',
      publishedAt: '2024-01-08',
      readTime: 9,
      author: 'SEOFlow Team',
      category: 'Content Strategy',
      tags: ['Authority', 'Content Strategy', 'Ranking'],
      slug: 'building-authority-content-that-ranks'
    },
    {
      id: '5',
      title: 'The Future of SEO: How AI is Changing the Game',
      excerpt: 'Explore the latest AI technologies reshaping SEO and learn how to stay ahead of the curve with cutting-edge optimization techniques.',
      content: '',
      publishedAt: '2024-01-05',
      readTime: 5,
      author: 'SEOFlow Team',
      category: 'AI & Technology',
      tags: ['AI', 'Future of SEO', 'Technology', 'Innovation'],
      slug: 'future-of-seo-ai-changing-game'
    },
    {
      id: '6',
      title: 'WordPress SEO: Complete Optimization Checklist for 2024',
      excerpt: 'A comprehensive guide to optimizing your WordPress site for search engines, covering everything from technical SEO to content optimization.',
      content: '',
      publishedAt: '2024-01-03',
      readTime: 10,
      author: 'SEOFlow Team',
      category: 'WordPress',
      tags: ['WordPress SEO', 'Optimization', 'Checklist', 'Technical SEO'],
      slug: 'wordpress-seo-optimization-checklist-2024'
    }
  ];

  useEffect(() => {
    if (posts.length > 0) {
      setBlogPosts(posts);
    } else if (!initialized.current) {
      setBlogPosts(samplePosts);
      initialized.current = true;
    }
  }, [posts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'SEO': 'bg-blue-100 text-blue-800',
      'WordPress': 'bg-green-100 text-green-800',
      'Strategy': 'bg-purple-100 text-purple-800',
      'Content Strategy': 'bg-orange-100 text-orange-800',
      'AI & Technology': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const displayedPosts = showAllPosts ? blogPosts : blogPosts.slice(0, maxPosts);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full px-4 py-2 mb-6">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 text-sm font-medium">Latest Insights</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            SEO & Content Marketing<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Insights & Strategies
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with expert insights on SEO automation, WordPress optimization, and AI-powered content creation.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayedPosts.map((post) => (
            <article 
              key={post.id} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              {/* Featured Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <span className="text-sm text-blue-600 font-medium">Featured Image</span>
                </div>
              </div>

              <div className="p-6">
                {/* Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>

                {/* Excerpt */}
                <p className="text-slate-600 mb-4 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Read More Link */}
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:gap-3 transition-all"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          {!showAllPosts && (
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              View All Blog Posts
              <ExternalLink className="w-5 h-5" />
            </Link>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Weekly insights</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Expert strategies</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Industry leaders</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
