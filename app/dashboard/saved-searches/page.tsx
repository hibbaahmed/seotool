'use client';

import { useState, useEffect } from 'react';
import { Image, Download, Trash2, Eye, History, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface ImageSearchRecord {
  id: string;
  user_id: string;
  query: string;
  style: string;
  count: number;
  size: string;
  additional_context: string;
  search_results: string;
  image_urls: string[]; // Supabase Storage URLs
  original_image_urls: string[]; // Original external URLs
  created_at: string;
  updated_at: string;
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<ImageSearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<ImageSearchRecord | null>(null);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSearches([]);
        return;
      }

      const { data: searches, error } = await supabase
        .from('image_search_outputs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading searches:', error);
        setSearches([]);
      } else {
        setSearches(searches || []);
      }
    } catch (error) {
      console.error('Error loading searches:', error);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image search?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('image_search_outputs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting search:', error);
      } else {
        setSearches(searches.filter(s => s.id !== id));
        if (selectedSearch?.id === id) {
          setSelectedSearch(null);
        }
      }
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const handleDownload = (search: ImageSearchRecord) => {
    const content = `Image Search Results for: ${search.query}

Search Parameters:
- Style: ${search.style}
- Count: ${search.count}
- Size: ${search.size}
- Additional Context: ${search.additional_context || 'None'}

${search.image_urls.length > 0 ? `Found ${search.image_urls.length} images (stored in Supabase Storage):
${search.image_urls.map((url, index) => `${index + 1}. ${url}`).join('\n')}

Original URLs for reference:
${search.original_image_urls.map((url, index) => `${index + 1}. ${url}`).join('\n')}

` : ''}${search.search_results ? `AI Analysis:
${search.search_results}` : ''}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-search-${search.query}-${new Date(search.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg">Loading saved searches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Your Saved Image Searches
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Manage and review your past AI image search results
            </p>
          </div>

          {searches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
              <Image className="w-16 h-16 text-slate-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Saved Searches Yet</h2>
              <p className="text-slate-600 mb-6">
                Perform an image search to automatically save it here.
              </p>
              <a 
                href="/image-search" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Start New Search
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searches.map(search => (
                <div 
                  key={search.id} 
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 truncate pr-2">
                      {search.query}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {new Date(search.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {search.style} • {search.count} images • {search.size}
                  </p>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setSelectedSearch(search)}
                      className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(search)}
                      className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Detail Modal */}
      {selectedSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">
                {selectedSearch.query} Search Results
              </h3>
              <button
                onClick={() => setSelectedSearch(null)}
                className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 text-sm text-slate-600">
                <p><strong>Query:</strong> {selectedSearch.query}</p>
                <p><strong>Style:</strong> {selectedSearch.style}</p>
                <p><strong>Count:</strong> {selectedSearch.count}</p>
                <p><strong>Size:</strong> {selectedSearch.size}</p>
                {selectedSearch.additional_context && <p><strong>Context:</strong> {selectedSearch.additional_context}</p>}
                <p><strong>Date:</strong> {new Date(selectedSearch.created_at).toLocaleString()}</p>
              </div>
              
              {/* Images */}
              {selectedSearch.image_urls.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">Found Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedSearch.image_urls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Search result ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/200x150?text=Image+Not+Available`;
                          }}
                        />
                        <div className="mt-2 space-y-1">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline truncate block"
                          >
                            View Stored Image
                          </a>
                          {selectedSearch.original_image_urls[index] && (
                            <a
                              href={selectedSearch.original_image_urls[index]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-gray-700 underline truncate block"
                            >
                              Original Source
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Analysis */}
              {selectedSearch.search_results && (
                <div className="prose prose-slate max-w-none">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">AI Analysis</h4>
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-200">
                    {selectedSearch.search_results}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-slate-200">
              <button
                onClick={() => handleDownload(selectedSearch)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
