'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Download, Trash2, Eye } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

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
  created_at: string;
  updated_at: string;
}

export default function SavedContentPage() {
  const [content, setContent] = useState<ContentWriterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentWriterRecord | null>(null);

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
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setSelectedContent(contentItem)}
                      className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors"
                      title="View Content"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(contentItem)}
                      className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
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
                {selectedContent.topic}
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
                    {selectedContent.content_output}
                  </pre>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-slate-200">
              <button
                onClick={() => handleDownload(selectedContent)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
