"use client"
import React, { useState, useEffect } from 'react';
import { Upload, Globe, Calendar, Tag, FolderOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  is_active: boolean;
}

interface PublishButtonProps {
  contentId: string;
  contentType: 'content' | 'analysis' | 'seo_research';
  contentTitle: string;
  contentBody: string;
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

const WordPressPublishButton: React.FC<PublishButtonProps> = ({
  contentId,
  contentType,
  contentTitle,
  contentBody,
  className = '',
  onSuccess,
  onError
}) => {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [publishOptions, setPublishOptions] = useState({
    status: 'draft' as 'draft' | 'publish',
    categories: [] as number[],
    tags: [] as string[],
    publishDate: '',
    excerpt: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadWordPressSites();
  }, []);

  const loadWordPressSites = async () => {
    try {
      const response = await fetch('/api/wordpress/sites');
      const data = await response.json();
      
      if (response.ok) {
        setSites(data.sites || []);
        if (data.sites?.length > 0) {
          setSelectedSite(data.sites[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading WordPress sites:', error);
    }
  };

  const handlePublish = async () => {
    if (!selectedSite) {
      setError('Please select a WordPress site');
      return;
    }

    setIsPublishing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSite,
          contentId: contentId,
          contentType: contentType,
          publishOptions: {
            ...publishOptions,
            excerpt: publishOptions.excerpt || contentBody.substring(0, 160) + '...'
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Content successfully published to WordPress!`);
        setIsOpen(false);
        onSuccess?.(data);
      } else {
        setError(data.error || 'Failed to publish content');
        onError?.(data.error || 'Failed to publish content');
      }
    } catch (error) {
      const errorMessage = 'Failed to publish content to WordPress';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDirectPublish = async () => {
    if (!selectedSite) {
      setError('Please select a WordPress site');
      return;
    }

    setIsPublishing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/wordpress/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSite,
          title: contentTitle,
          content: contentBody,
          excerpt: publishOptions.excerpt || contentBody.substring(0, 160) + '...',
          status: publishOptions.status,
          categories: publishOptions.categories,
          tags: publishOptions.tags,
          publishDate: publishOptions.publishDate || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Blog post successfully ${publishOptions.status === 'publish' ? 'published' : 'saved as draft'}!`);
        setIsOpen(false);
        onSuccess?.(data);
      } else {
        setError(data.error || 'Failed to publish content');
        onError?.(data.error || 'Failed to publish content');
      }
    } catch (error) {
      const errorMessage = 'Failed to publish content to WordPress';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  if (sites.length === 0) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed ${className}`}
      >
        <Upload className="w-4 h-4" />
        No WordPress Sites Connected
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${className}`}
      >
        <Upload className="w-4 h-4" />
        Publish to WordPress
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Publish to WordPress</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 text-sm">{success}</span>
                </div>
              )}

              {/* WordPress Site Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WordPress Site
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.url})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publish Options */}
              <div className="space-y-4 mb-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Publish Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="draft"
                        checked={publishOptions.status === 'draft'}
                        onChange={(e) => setPublishOptions(prev => ({ ...prev, status: e.target.value as 'draft' | 'publish' }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Save as Draft</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="publish"
                        checked={publishOptions.status === 'publish'}
                        onChange={(e) => setPublishOptions(prev => ({ ...prev, status: e.target.value as 'draft' | 'publish' }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Publish Immediately</span>
                    </label>
                  </div>
                </div>

                {/* Schedule */}
                {publishOptions.status === 'publish' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Schedule (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="datetime-local"
                        value={publishOptions.publishDate}
                        onChange={(e) => setPublishOptions(prev => ({ ...prev, publishDate: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Leave empty to publish immediately
                    </p>
                  </div>
                )}

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categories (Optional)
                  </label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Enter category IDs separated by commas (e.g., 1, 2, 3)"
                      value={publishOptions.categories.join(', ')}
                      onChange={(e) => {
                        const categories = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                        setPublishOptions(prev => ({ ...prev, categories }));
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Enter tags separated by commas (e.g., seo, content-marketing, ai-generated)"
                      value={publishOptions.tags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                        setPublishOptions(prev => ({ ...prev, tags }));
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Excerpt (Optional)
                  </label>
                  <textarea
                    placeholder="Enter a custom excerpt or leave empty for auto-generated"
                    value={publishOptions.excerpt}
                    onChange={(e) => setPublishOptions(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDirectPublish}
                  disabled={isPublishing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Publish Blog Post
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordPressPublishButton;
