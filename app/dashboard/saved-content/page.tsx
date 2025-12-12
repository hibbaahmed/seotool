'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Download, Trash2, Eye, Edit, Upload, Link2, Info, Filter } from 'lucide-react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';
import ContentEditor from '@/components/ContentEditor';
import QuickWordPressPublishButton from '@/components/QuickWordPressPublishButton';
import { marked } from 'marked';

interface ContentWriterRecord {
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

// Helper function to extract title from content_output
const extractTitle = (contentOutput: string, fallbackTopic: string): string => {
  if (!contentOutput) return fallbackTopic;
  
  // Try to extract title from the content_output
  // Format variations: **Title**\n[title text], Title:\n[title text], 1. **Title**\n[title text], or Title: "title text"
  const titlePatterns = [
    /(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n([^\n]+)/i,
    /(?:^|\n)Title:\s*"?([^"\n]+)"?/i,
    /(?:^|\n)\*\*Title\*\*[:\s]*\n([^\n]+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = contentOutput.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  
  return fallbackTopic;
};

// Helper function to clean content by removing Title, Meta Description, and Content section headers
const cleanContent = (contentOutput: string, extractedTitle?: string): string => {
  if (!contentOutput) return '';
  
  let cleaned = contentOutput;
  
  // Remove Title section (with various formats)
  cleaned = cleaned.replace(/(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n[^\n]+\n?/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)Title:\s*"?[^"\n]+"?\n?/gi, '');
  
  // Remove Meta Description section (with various formats)
  cleaned = cleaned.replace(/(?:^|\n)(?:\d+\.\s*)?\*\*Meta Description\*\*[:\s]*\n[^\n]+\n?/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)Meta Description:\s*"?[^"\n]+"?\n?/gi, '');
  
  // If there's a "Content" section header, remove it too (keep only the content itself)
  cleaned = cleaned.replace(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/gi, '\n');
  cleaned = cleaned.replace(/(?:^|\n)(?:\d+\.\s*)?#\s*Content[:\s]*\n/gi, '\n');
  
  // Remove the duplicate H1 title (which appears as "# [Title]" after the Content section marker)
  if (extractedTitle) {
    const lines = cleaned.split('\n');
    let startIndex = 0;
    
    // Skip duplicate H1 at the start (which matches the extracted title)
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      // Check if this is an H1 that matches the extracted title
      if (line.match(/^#\s+.+$/)) {
        const h1Title = line.replace(/^#\s+/, '').trim();
        // If the H1 matches the extracted title (allowing for small variations), skip it
        if (h1Title.toLowerCase() === extractedTitle.toLowerCase() || 
            h1Title.toLowerCase().includes(extractedTitle.toLowerCase()) ||
            extractedTitle.toLowerCase().includes(h1Title.toLowerCase())) {
          startIndex = i + 1;
          // Skip any blank lines after the H1
          while (startIndex < lines.length && lines[startIndex].trim() === '') {
            startIndex++;
          }
          break;
        } else if (line && !line.match(/^\d+\./)) {
          // Found actual content (not a heading or numbered item)
          startIndex = i;
          break;
        }
      } else if (line && !line.startsWith('#') && !line.match(/^\d+\./)) {
        // Found actual content (not a heading or numbered item)
        startIndex = i;
        break;
      }
    }
    
    cleaned = lines.slice(startIndex).join('\n');
  }
  
  // Trim any leading/trailing whitespace
  return cleaned.trim();
};

export default function SavedContentPage() {
  const [content, setContent] = useState<ContentWriterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<ContentWriterRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  // Check for id query parameter and auto-open content
  useEffect(() => {
    if (content.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const contentId = params.get('id');
    
    if (contentId) {
      const contentItem = content.find(c => c.id === contentId);
      if (contentItem) {
        setSelectedContent(contentItem);
        setIsEditing(false);
      }
    }
  }, [content]);

  const loadContent = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setContent([]);
        return;
      }

      const { data: contentOutputs, error } = await supabase
        .from('content_writer_outputs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading content:', error);
        setContent([]);
      } else {
        setContent(contentOutputs || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('content_writer_outputs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting content:', error);
      } else {
        setContent(content.filter(c => c.id !== id));
        if (selectedContent?.id === id) {
          setSelectedContent(null);
        }
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleDownload = (contentItem: ContentWriterRecord) => {
    const blob = new Blob([contentItem.content_output], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${contentItem.topic}-${new Date(contentItem.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleContentUpdate = (updatedContent: ContentWriterRecord) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg">Loading saved content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Your Saved Content
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Manage and review your AI-generated content
            </p>
            <div className="mt-4 text-sm text-slate-500">
              {filteredContent.length} of {content.length} items
            </div>
          </div>

          {/* Search and Filters */}
          {content.length > 0 && (
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
                      <option value="landing-page">Landing Page</option>
                      <option value="press-release">Press Release</option>
                      <option value="case-study">Case Study</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {content.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <Calendar className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Saved Content Yet</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                To start generating content, schedule keywords to your calendar. Once content is generated, it will appear here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link
                  href="/calendar"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
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
                  href="/dashboard/wordpress-sites"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Link2 className="h-4 w-4" />
                  Connect WordPress Site
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Help Section - Show when user has content and no active filters */}
              {!searchTerm && contentTypeFilter === 'all' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Info className="h-6 w-6 text-blue-600 mt-0.5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Want more content?</h3>
                      <p className="text-slate-700 mb-4">
                        Schedule keywords to your calendar to automatically generate more content. Make sure your WordPress site is connected to publish content automatically.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/calendar"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                          Schedule Keywords
                        </Link>
                        <Link
                          href="/dashboard/wordpress-sites"
                          className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-300 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                        >
                          <Link2 className="h-4 w-4" />
                          Connect WordPress
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show message when filters return no results */}
              {filteredContent.length === 0 && content.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                  <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Content Found</h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent.map(contentItem => (
                <div 
                  key={contentItem.id} 
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 truncate pr-2">
                      {contentItem.topic}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {new Date(contentItem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {contentItem.content_type === 'blog-post' ? 'Blog Post' :
                     contentItem.content_type === 'article' ? 'Article' :
                     contentItem.content_type === 'social-media' ? 'Social Media Post' :
                     contentItem.content_type === 'email' ? 'Email Newsletter' :
                     contentItem.content_type === 'product-description' ? 'Product Description' :
                     contentItem.content_type === 'landing-page' ? 'Landing Page Copy' :
                     contentItem.content_type === 'press-release' ? 'Press Release' :
                     contentItem.content_type === 'case-study' ? 'Case Study' :
                     contentItem.content_type}
                    • {contentItem.tone} tone • {contentItem.length}
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedContent(contentItem);
                        setIsEditing(false);
                      }}
                      className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors"
                      title="View Content"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContent(contentItem);
                        setIsEditing(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="Edit Content"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(contentItem)}
                      className="text-purple-600 hover:text-purple-700 p-2 rounded-full hover:bg-purple-50 transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contentItem.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content Detail Modal - Full Screen */}
      {selectedContent && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
            <h3 className="text-3xl font-bold text-slate-900">
              {extractTitle(selectedContent.content_output, selectedContent.topic)}
            </h3>
            <button
              onClick={() => setSelectedContent(null)}
              className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-8 overflow-y-auto flex-1 max-w-5xl mx-auto w-full">
              <div className="mb-4 text-sm text-slate-600">
                <p><strong>Topic:</strong> {selectedContent.topic}</p>
                <p><strong>Type:</strong> {selectedContent.content_type}</p>
                <p><strong>Audience:</strong> {selectedContent.target_audience}</p>
                <p><strong>Tone:</strong> {selectedContent.tone}</p>
                <p><strong>Length:</strong> {selectedContent.length}</p>
                {selectedContent.additional_context && <p><strong>Context:</strong> {selectedContent.additional_context}</p>}
                <p><strong>Created:</strong> {new Date(selectedContent.created_at).toLocaleString()}</p>
              </div>
              <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div
                    className="prose max-w-none content-writer-prose"
                    dangerouslySetInnerHTML={{ 
                      __html: marked.parse(cleanContent(selectedContent.content_output, extractTitle(selectedContent.content_output, selectedContent.topic))) as string 
                    }}
                  />
                </div>
              </div>
          </div>
          <div className="flex justify-between items-center px-6 py-3 border-t border-slate-200 bg-white max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <QuickWordPressPublishButton
                contentId={selectedContent.id}
                contentType="content"
                contentTitle={extractTitle(selectedContent.content_output, selectedContent.topic)}
                contentBody={selectedContent.content_output}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200"
                onSuccess={(result) => {
                  // You could add a success message here
                }}
                onError={(error) => {
                  // You could add an error message here
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDownload(selectedContent)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Editor Modal */}
      {isEditing && selectedContent && (
        <div className="fixed inset-0 bg-white z-[60]">
          <ContentEditor
            content={selectedContent}
            onClose={() => {
              setIsEditing(false);
            }}
            onSave={(updatedContent) => {
              handleContentUpdate(updatedContent);
              setIsEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
