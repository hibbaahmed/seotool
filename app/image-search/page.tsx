'use client';

import { useState } from 'react';
import { Search, Image as ImageIcon, Download, Eye, ArrowRight } from 'lucide-react';

export default function ImageSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    query: '',
    style: 'photographic',
    count: '5',
    size: '1024x1024',
    additionalContext: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults('');
    setImages([]);

    try {
      const response = await fetch('/api/agents/image-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Search for images with the following specifications:
Query: "${formData.query}"
Style: ${formData.style}
Number of images: ${formData.count}
Image size: ${formData.size}
Additional context: ${formData.additionalContext}

Please provide detailed image search results with descriptions, sources, and recommendations.`
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Image search failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullResult = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'token') {
                fullResult += data.value;
                setResults(fullResult);
              } else if (data.type === 'images') {
                console.log('🖼️ Received images update:', data.urls?.length || 0, 'images');
                setImages(data.urls || []);
              } else if (data.type === 'done') {
                setIsSearching(false);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Image search error:', error);
      setResults(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <ImageIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Image Search
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find and analyze images using AI-powered search capabilities. Get detailed descriptions, 
              sources, and recommendations for your visual content needs.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Query Input */}
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  What images are you looking for?
                </label>
                <input
                  type="text"
                  id="query"
                  name="query"
                  value={formData.query}
                  onChange={handleInputChange}
                  placeholder="e.g., modern office spaces, nature landscapes, product photography..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              {/* Style and Count Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                    Image Style
                  </label>
                  <select
                    id="style"
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="photographic">Photographic</option>
                    <option value="illustration">Illustration</option>
                    <option value="artistic">Artistic</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="vintage">Vintage</option>
                    <option value="modern">Modern</option>
                    <option value="abstract">Abstract</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Images
                  </label>
                  <select
                    id="count"
                    name="count"
                    value={formData.count}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                            <option value="3">3 images</option>
                            <option value="5">5 images</option>
                            <option value="10">10 images</option>
                            <option value="15">15 images</option>
                            <option value="20">20 images (maximum)</option>
                  </select>
                </div>
              </div>

              {/* Size and Context Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                    Image Size Preference
                  </label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="1024x1024">Square (1024x1024)</option>
                    <option value="1024x1792">Portrait (1024x1792)</option>
                    <option value="1792x1024">Landscape (1792x1024)</option>
                    <option value="any">Any size</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Context (Optional)
                  </label>
                  <input
                    type="text"
                    id="additionalContext"
                    name="additionalContext"
                    value={formData.additionalContext}
                    onChange={handleInputChange}
                    placeholder="e.g., for website header, social media post..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Searching for images...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Search Images
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {(results || images.length > 0) && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">Search Results</h3>
              </div>
              
              {/* Images Display */}
              {images.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Found Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(url)}`}
                          alt={`Search result ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/400x300?text=Image+Not+Available`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Download className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        <div className="mt-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline truncate block"
                          >
                            View Original
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Description */}
              {results && (
                <div className="prose prose-lg max-w-none">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h4>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono leading-relaxed">
                      {results}
                    </pre>
                  </div>
                </div>
              )}

              {!isSearching && (results || images.length > 0) && !results.includes('Error:') && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Tips:</span>
                  </div>
                          <ul className="mt-2 text-sm text-blue-700 space-y-1">
                            <li>• AI searches multiple variations to find up to 20 unique images</li>
                            <li>• Click "View Original" to access full-size images</li>
                            <li>• Use specific keywords for better search results</li>
                            <li>• Check image licensing before commercial use</li>
                            <li>• Hover over images to see download option</li>
                            <li>• Try different styles for varied content types</li>
                          </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
