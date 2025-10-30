'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Eye, Download, Trash2, Calendar, Search, Filter, Grid, List, ArrowLeft, TrendingUp, PenTool, Camera, BarChart3, FileText, Clock, Globe, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import Link from 'next/link';

interface SavedItem {
  id: string;
  type: 'analysis' | 'content' | 'image_search' | 'seo_research';
  title: string;
  description: string;
  created_at: string;
  data: any;
}

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  is_active: boolean;
}

export default function SavedPage() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'analysis' | 'content' | 'image_search' | 'seo_research'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [wordpressSites, setWordpressSites] = useState<WordPressSite[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');

  const processContent = (text: string, urls: string[] = []): string => {
    if (!text) return '';
    let idx = 0;
    let replaced = text.replace(/\[IMAGE_PLACEMENT:\s*"([^"]+)"\]/g, (_m, alt: string) => {
      const url = urls[idx++] || urls[urls.length - 1] || '';
      if (!url) return '';
      return `\n\n![${alt}](${url})\n\n`;
    });
    replaced = replaced
      .replace(/([^\n])\n(#{2,3}\s)/g, '$1\n\n$2')
      .replace(/^(#{2,3}[^\n]*)(?!\n\n)/gm, '$1\n')
      .replace(/([^\n])\n(!\[[^\]]*\]\([^\)]+\))/g, '$1\n\n$2')
      .replace(/(!\[[^\]]*\]\([^\)]+\))(?!\n\n)/g, '$1\n\n');
    return replaced;
  };

  useEffect(() => {
    loadAllSavedItems();
    loadWordPressSites();
  }, []);

  const loadWordPressSites = async () => {
    try {
      const response = await fetch('/api/wordpress/sites');
      const data = await response.json();
      
      if (response.ok) {
        setWordpressSites(data.sites || []);
      }
    } catch (error) {
      console.error('Error loading WordPress sites:', error);
    }
  };

  const loadAllSavedItems = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }

      // Load all types of saved items
      const [analyses, content, imageSearches, seoResearch] = await Promise.all([
        supabase.from('competitive_analysis').select('*').eq('user_id', user.id),
        supabase.from('content_writer_outputs').select('*').eq('user_id', user.id),
        supabase.from('image_search_outputs').select('*').eq('user_id', user.id),
        supabase.from('seo_research_outputs').select('*').eq('user_id', user.id)
      ]);

      const allItems: SavedItem[] = [
        ...(analyses.data || []).map((item: any) => ({
          id: item.id,
          type: 'analysis' as const,
          title: `${item.company_name} vs ${item.competitor_name}`,
          description: `${item.analysis_type} competitive analysis`,
          created_at: item.created_at,
          data: item
        })),
        ...(content.data || []).map((item: any) => ({
          id: item.id,
          type: 'content' as const,
          title: item.topic,
          description: `${item.content_type} content about ${item.topic}`,
          created_at: item.created_at,
          data: item
        })),
        ...(imageSearches.data || []).map((item: any) => ({
          id: item.id,
          type: 'image_search' as const,
          title: item.query,
          description: `${item.count} images found for "${item.query}"`,
          created_at: item.created_at,
          data: item
        })),
        ...(seoResearch.data || []).map((item: any) => ({
          id: item.id,
          type: 'seo_research' as const,
          title: item.query,
          description: `${item.research_type} research for ${item.query}`,
          created_at: item.created_at,
          data: item
        }))
      ];

      // Sort by creation date (newest first)
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setSavedItems(allItems);
    } catch (error) {
      console.error('Error loading saved items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: SavedItem) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      let tableName = '';
      
      switch (item.type) {
        case 'analysis':
          tableName = 'competitive_analysis';
          break;
        case 'content':
          tableName = 'content_writer_outputs';
          break;
        case 'image_search':
          tableName = 'image_search_outputs';
          break;
        case 'seo_research':
          tableName = 'seo_research_outputs';
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      } else {
        setSavedItems(prev => prev.filter(savedItem => savedItem.id !== item.id));
        if (selectedItem?.id === item.id) {
          setIsModalOpen(false);
          setSelectedItem(null);
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleDownload = (item: SavedItem) => {
    let content = '';
    let filename = '';

    switch (item.type) {
      case 'analysis':
        content = `Competitive Analysis: ${item.data.company_name} vs ${item.data.competitor_name}

Analysis Parameters:
- Company: ${item.data.company_name}
- Competitor: ${item.data.competitor_name}
- Analysis Type: ${item.data.analysis_type}

Analysis Results:
${item.data.analysis_output}

Generated on: ${new Date(item.created_at).toLocaleString()}`;
        filename = `competitive-analysis-${item.data.company_name}-vs-${item.data.competitor_name}-${new Date(item.created_at).toISOString().split('T')[0]}.txt`;
        break;

      case 'content':
        content = `AI Content for: ${item.data.topic}

Content Parameters:
- Content Type: ${item.data.content_type}
- Target Audience: ${item.data.target_audience || 'Not specified'}
- Tone: ${item.data.tone || 'Not specified'}
- Length: ${item.data.length || 'Not specified'}
- Additional Context: ${item.data.additional_context || 'None'}

Generated Content:
${item.data.content_output}

Generated on: ${new Date(item.created_at).toLocaleString()}`;
        filename = `content-${item.data.topic}-${new Date(item.created_at).toISOString().split('T')[0]}.txt`;
        break;

      case 'image_search':
        content = `Image Search Results for: ${item.data.query}

Search Parameters:
- Style: ${item.data.style}
- Count: ${item.data.count}
- Size: ${item.data.size}
- Additional Context: ${item.data.additional_context || 'None'}

Found Images:
${item.data.image_urls?.map((url: string, index: number) => `${index + 1}. ${url}`).join('\n') || 'No images found'}

Original URLs:
${item.data.original_image_urls?.map((url: string, index: number) => `${index + 1}. ${url}`).join('\n') || 'No original URLs'}

AI Analysis:
${item.data.search_results}

Generated on: ${new Date(item.created_at).toLocaleString()}`;
        filename = `image-search-${item.data.query}-${new Date(item.created_at).toISOString().split('T')[0]}.txt`;
        break;

      case 'seo_research':
        content = `SEO Research Results for: ${item.data.query}

Research Parameters:
- Research Type: ${item.data.research_type}
- Target Audience: ${item.data.target_audience || 'Not specified'}
- Industry/Location: ${item.data.industry || 'Not specified'}
- Additional Context: ${item.data.additional_context || 'None'}

Research Output:
${item.data.research_output}

Generated on: ${new Date(item.created_at).toLocaleString()}`;
        filename = `seo-research-${item.data.query}-${new Date(item.created_at).toISOString().split('T')[0]}.txt`;
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const openModal = (item: SavedItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handlePublishToWordPress = async (item: SavedItem, siteId: string) => {
    setIsPublishing(true);
    setPublishMessage('');

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          contentId: item.id,
          contentType: item.type,
          publishOptions: {
            status: 'publish', // Publish immediately
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishMessage(`Successfully published to WordPress! Post ID: ${data.post.id}`);
      } else {
        setPublishMessage(`Failed to publish: ${data.error}`);
      }
    } catch (error) {
      console.error('Error publishing to WordPress:', error);
      setPublishMessage('Failed to publish to WordPress');
    } finally {
      setIsPublishing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return <TrendingUp className="h-5 w-5" />;
      case 'content':
        return <PenTool className="h-5 w-5" />;
      case 'image_search':
        return <Camera className="h-5 w-5" />;
      case 'seo_research':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'from-purple-500 to-blue-500';
      case 'content':
        return 'from-green-500 to-emerald-500';
      case 'image_search':
        return 'from-pink-500 to-rose-500';
      case 'seo_research':
        return 'from-orange-500 to-yellow-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'Competitive Analysis';
      case 'content':
        return 'AI Content';
      case 'image_search':
        return 'Image Search';
      case 'seo_research':
        return 'SEO Research';
      default:
        return 'Unknown';
    }
  };

  const filteredItems = savedItems.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">All Saved Content</h1>
                <p className="text-xl text-slate-600">
                  Manage all your AI-generated content and research results
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{savedItems.length}</div>
                <div className="text-sm text-slate-600">Total Items</div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search saved items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('analysis')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'analysis' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  Analyses
                </button>
                <button
                  onClick={() => setFilterType('content')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'content' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setFilterType('image_search')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'image_search' 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  Images
                </button>
                <button
                  onClick={() => setFilterType('seo_research')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'seo_research' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  SEO Research
                </button>
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Publish Message */}
          {publishMessage && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              publishMessage.includes('Successfully') 
                ? 'bg-green-100 border border-green-200 text-green-700' 
                : 'bg-red-100 border border-red-200 text-red-700'
            }`}>
              {publishMessage.includes('Successfully') ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{publishMessage}</span>
            </div>
          )}

          {/* Results */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchQuery || filterType !== 'all' ? 'No items found' : 'No saved content yet'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start creating content to see your saved items here'
                }
              </p>
              {!searchQuery && filterType === 'all' && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <TrendingUp className="h-5 w-5" />
                  Start Creating Content
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 ${
                    viewMode === 'list' ? 'p-6 flex items-center justify-between' : 'p-6'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getTypeColor(item.type)} rounded-xl flex items-center justify-center text-white`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {getTypeLabel(item.type)}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                        {item.description}
                      </p>
                      
                      {/* Show image previews for content items */}
                      {item.type === 'content' && item.data.image_urls && item.data.image_urls.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">
                              {item.data.image_urls.length} images
                            </span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto">
                            {item.data.image_urls.slice(0, 3).map((imageUrl: string, index: number) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/64x64?text=IMG';
                                }}
                                loading="lazy"
                              />
                            ))}
                            {item.data.image_urls.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                                +{item.data.image_urls.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {wordpressSites.length > 0 && (
                          <div className="relative group">
                            <button
                              disabled={isPublishing}
                              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-48">
                                <div className="text-xs font-medium text-gray-700 mb-2">Publish to WordPress:</div>
                                {wordpressSites.map(site => (
                                  <button
                                    key={site.id}
                                    onClick={() => handlePublishToWordPress(item, site.id)}
                                    disabled={isPublishing}
                                    className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                  >
                                    {site.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 bg-gradient-to-r ${getTypeColor(item.type)} rounded-lg flex items-center justify-center text-white`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {getTypeLabel(item.type)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${getTypeColor(selectedItem.type)} rounded-lg flex items-center justify-center text-white`}>
                  {getTypeIcon(selectedItem.type)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedItem.title}</h2>
                  <p className="text-sm text-slate-500">{getTypeLabel(selectedItem.type)} • {new Date(selectedItem.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Content based on type */}
              {selectedItem.type === 'analysis' && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Analysis Parameters:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Company:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.company_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Competitor:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.competitor_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Analysis Type:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.analysis_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Created:</span>
                        <span className="ml-2 text-slate-600">{new Date(selectedItem.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-lg max-w-none">
                    <h3 className="font-semibold text-slate-900 mb-4">Analysis Results:</h3>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-slate-900 font-mono leading-relaxed">
                        {selectedItem.data.analysis_output}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === 'content' && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Content Parameters:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Topic:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.topic}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Content Type:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.content_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Target Audience:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.target_audience || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Tone:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.tone || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700">
                    <h3 className="font-semibold text-slate-900 mb-4">Generated Content:</h3>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedItem.data?.content_output ? (marked.parse(processContent(selectedItem.data.content_output, selectedItem.data.image_urls || [])) as string) : '' }}
                      />
                    </div>
                  </div>

                  {/* Display Images if Available */}
                  {selectedItem.data.image_urls && selectedItem.data.image_urls.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        Generated Images ({selectedItem.data.image_urls.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedItem.data.image_urls.map((imageUrl: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Generated image ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                              }}
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <button
                                onClick={() => window.open(imageUrl, '_blank')}
                                className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-slate-100"
                              >
                                <Eye className="w-4 h-4 inline mr-2" />
                                View Full Size
                              </button>
                            </div>
                            <div className="mt-2 text-center">
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = imageUrl;
                                  link.download = `content-image-${index + 1}.jpg`;
                                  link.click();
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                <Download className="w-4 h-4 inline mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.type === 'image_search' && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Search Parameters:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Query:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.query}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Style:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.style}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Count:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.count}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Size:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedItem.data.image_urls && selectedItem.data.image_urls.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-4">Found Images:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedItem.data.image_urls.map((url: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Search result ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/300x200?text=Image+Not+Available`;
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="prose prose-lg max-w-none">
                    <h3 className="font-semibold text-slate-900 mb-4">AI Analysis:</h3>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-slate-900 font-mono leading-relaxed">
                        {selectedItem.data.search_results}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === 'seo_research' && (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Research Parameters:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Query:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.query}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Research Type:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.research_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Target Audience:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.target_audience || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Industry:</span>
                        <span className="ml-2 text-slate-600">{selectedItem.data.industry || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-lg max-w-none">
                    <h3 className="font-semibold text-slate-900 mb-4">Research Results:</h3>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-slate-900 font-mono leading-relaxed">
                        {selectedItem.data.research_output}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => handleDownload(selectedItem)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => handleDelete(selectedItem)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
