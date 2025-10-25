"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, Search, Filter, BookOpen, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import BlogSection from '@/components/BlogSection';

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

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  // Fetch WordPress posts
  const fetchWordPressPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/wordpress/posts?limit=50');
      const data = await response.json();
      
      if (response.ok && data.posts) {
        // Transform WordPress posts to our BlogPost format
        const transformedPosts: BlogPost[] = data.posts.map((post: any) => ({
          id: post.id.toString(),
          title: post.title || 'Untitled',
          excerpt: post.excerpt || post.content?.substring(0, 150) + '...' || '',
          content: post.content || '',
          publishedAt: post.date || new Date().toISOString(),
          readTime: Math.ceil((post.content?.length || 0) / 500), // Rough estimate
          author: post.author_name || 'Bridgely Team',
          category: post.category_name || 'General',
          tags: post.tags || [],
          featuredImage: post.featured_media_url,
          slug: post.slug || post.id.toString()
        }));
        
        setPosts(transformedPosts);
        setFilteredPosts(transformedPosts);
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching WordPress posts:', err);
      setError('Failed to load blog posts');
      // Fall back to sample posts if WordPress fetch fails
      setPosts(samplePosts);
      setFilteredPosts(samplePosts);
    } finally {
      setLoading(false);
    }
  };

  // Sample data - in production, this would come from WordPress API
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
    },
    {
      id: '7',
      title: 'Content Marketing Automation: Scale Your Strategy with AI',
      excerpt: 'Learn how to automate your content marketing workflow while maintaining quality and personalization for better engagement and results.',
      content: '',
      publishedAt: '2024-01-01',
      readTime: 7,
      author: 'SEOFlow Team',
      category: 'Content Strategy',
      tags: ['Content Marketing', 'Automation', 'AI', 'Strategy'],
      slug: 'content-marketing-automation-ai-strategy'
    },
    {
      id: '8',
      title: 'Technical SEO: The Foundation of Digital Success',
      excerpt: 'Master the technical aspects of SEO that form the foundation for all your digital marketing efforts and long-term ranking success.',
      content: '',
      publishedAt: '2023-12-28',
      readTime: 8,
      author: 'SEOFlow Team',
      category: 'SEO',
      tags: ['Technical SEO', 'Foundation', 'Digital Marketing'],
      slug: 'technical-seo-foundation-digital-success'
    }
  ];

  useEffect(() => {
    fetchWordPressPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== 'All') {
      filtered = filtered.filter(post => post.tags.includes(selectedTag));
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, selectedCategory, selectedTag]);

  const categories = ['All', ...Array.from(new Set(posts.map(post => post.category)))];
  const tags = ['All', ...Array.from(new Set(posts.flatMap(post => post.tags)))];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full px-4 py-2 mb-6">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 text-sm font-medium">SEOFlow Blog</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            SEO & Content Marketing<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Insights & Strategies
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Expert insights on SEO automation, WordPress optimization, AI-powered content creation, and digital marketing strategies that deliver real results.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filter by:</span>
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tags.slice(0, 10).map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchTerm || selectedCategory !== 'All' || selectedTag !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedTag('All');
                }}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No posts found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
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
          )}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Stay Updated with Latest SEO Insights
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Get weekly updates on SEO automation, WordPress optimization, and AI-powered content strategies.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
