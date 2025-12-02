"use client"
import React, { useState, useEffect } from 'react';
import { Edit, Eye, Upload, Trash2, Calendar, User, FileText, Search, Filter, Plus, Link2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import ContentEditor from '@/components/ContentEditor';
import Link from 'next/link';

interface SavedContent {
  id: string;
  user_id: string;
  topic: string;
  content_type: string;
  target_audience: string;
  tone: string;
  length: string;
  additional_context: string;
  content_output: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export default function SavedContentPage() {
  const [content, setContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<SavedContent | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSavedContent();
  }, []);

  const loadSavedContent = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to view saved content');
        return;
      }

      const { data, error } = await supabase
        .from('content_writer_outputs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContent(data || []);
    } catch (error) {
      console.error('Error loading saved content:', error);
      setError('Failed to load saved content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('content_writer_outputs')
        .delete()
        .eq('id', contentId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setContent(prev => prev.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Error deleting content:', error);
      setError('Failed to delete content');
    }
  };

  const handleContentUpdate = (updatedContent: SavedContent) => {
    setContent(prev => prev.map(item => 
      item.id === updatedContent.id ? updatedContent : item
    ));
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content_output.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = contentTypeFilter === 'all' || item.content_type === contentTypeFilter;
    return matchesSearch && matchesType;
  });

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'blog-post': 'bg-blue-100 text-blue-800',
      'article': 'bg-green-100 text-green-800',
      'social-media': 'bg-purple-100 text-purple-800',
      'email': 'bg-orange-100 text-orange-800',
      'product-description': 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Saved Content</h1>
                <p className="text-xl text-slate-600">
                  Manage and edit your AI-generated content
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {filteredContent.length} of {content.length} items
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search content by topic or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="blog-post">Blog Posts</option>
                    <option value="article">Articles</option>
                    <option value="social-media">Social Media</option>
                    <option value="email">Emails</option>
                    <option value="product-description">Product Descriptions</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Content Grid */}
          {filteredContent.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              {searchTerm || contentTypeFilter !== 'all' ? (
                <>
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Content Found</h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your search or filter criteria.
                  </p>
                </>
              ) : (
                <>
                  <Calendar className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Saved Content Yet</h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    To start generating content, schedule keywords to your calendar. Once content is generated, it will appear here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <Link
                      href="/calendar"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Calendar className="h-5 w-5" />
                      Go to Calendar
                    </Link>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-slate-600 mb-4">
                      Make sure to connect your WordPress site to publish your content automatically.
                    </p>
                    <Link
                      href="/wordpress-sites"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Link2 className="h-4 w-4" />
                      Connect WordPress Site
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContentTypeColor(item.content_type)}`}>
                          {item.content_type.replace('-', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                        {item.topic}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {item.content_output.substring(0, 150)}...
                      </p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{item.tone}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedContent(item);
                        setIsViewing(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContent(item);
                        setIsViewing(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Editor Modal */}
          {selectedContent && (
            <ContentEditor
              content={selectedContent}
              onClose={() => {
                setSelectedContent(null);
                setIsViewing(false);
              }}
              onSave={(updatedContent) => {
                handleContentUpdate(updatedContent);
                setSelectedContent(null);
                setIsViewing(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
