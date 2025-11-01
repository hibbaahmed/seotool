'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Download, Trash2, Eye, Edit, Upload } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import ContentEditor from '@/components/ContentEditor';
import QuickWordPressPublishButton from '@/components/QuickWordPressPublishButton';

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
  const [selectedContent, setSelectedContent] = useState<ContentWriterRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Your Saved Content
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Manage and review your AI-generated content
            </p>
          </div>

          {content.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Saved Content Yet</h2>
              <p className="text-slate-600 mb-6">
                Generate some content using the AI Content Writer to see it saved here.
              </p>
              <a 
                href="/content-writer" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Start Writing Content
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map(contentItem => (
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
        </div>
      </div>

      {/* Content Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">
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
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 text-sm text-slate-600">
                <p><strong>Topic:</strong> {selectedContent.topic}</p>
                <p><strong>Type:</strong> {selectedContent.content_type}</p>
                <p><strong>Audience:</strong> {selectedContent.target_audience}</p>
                <p><strong>Tone:</strong> {selectedContent.tone}</p>
                <p><strong>Length:</strong> {selectedContent.length}</p>
                {selectedContent.additional_context && <p><strong>Context:</strong> {selectedContent.additional_context}</p>}
                <p><strong>Created:</strong> {new Date(selectedContent.created_at).toLocaleString()}</p>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {cleanContent(selectedContent.content_output, extractTitle(selectedContent.content_output, selectedContent.topic))}
                  </pre>
                </div>
              </div>

              {/* Display Images if Available */}
              {selectedContent.image_urls && selectedContent.image_urls.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-xl font-bold text-slate-900">Generated Images</h4>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                      {selectedContent.image_urls.length} images
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedContent.image_urls.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
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
            <div className="flex justify-between p-6 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <QuickWordPressPublishButton
                  contentId={selectedContent.id}
                  contentType="content"
                  contentTitle={extractTitle(selectedContent.content_output, selectedContent.topic)}
                  contentBody={selectedContent.content_output}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  onSuccess={(result) => {
                    // You could add a success message here
                  }}
                  onError={(error) => {
                    // You could add an error message here
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setSelectedContent(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDownload(selectedContent)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Editor Modal */}
      {isEditing && selectedContent && (
        <ContentEditor
          content={selectedContent}
          onClose={() => {
            setSelectedContent(null);
            setIsEditing(false);
          }}
          onSave={(updatedContent) => {
            handleContentUpdate(updatedContent);
            setSelectedContent(null);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}
