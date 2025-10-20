'use client';

import { useState, useEffect } from 'react';
import { Eye, Download, Trash2, Calendar, Target, BarChart3, ArrowLeft } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import Link from 'next/link';

interface SEOResearchRecord {
  id: string;
  query: string;
  research_type: string;
  target_audience: string | null;
  industry: string | null;
  additional_context: string | null;
  research_output: string;
  created_at: string;
  updated_at: string;
}

export default function SavedSEOResearchPage() {
  const [researchResults, setResearchResults] = useState<SEOResearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResearch, setSelectedResearch] = useState<SEOResearchRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadResearchResults();
  }, []);

  const loadResearchResults = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('seo_research_outputs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading SEO research results:', error);
      } else {
        setResearchResults(data || []);
      }
    } catch (error) {
      console.error('Error loading SEO research results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SEO research result?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('seo_research_outputs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting SEO research result:', error);
        alert('Failed to delete research result');
      } else {
        setResearchResults(prev => prev.filter(result => result.id !== id));
        if (selectedResearch?.id === id) {
          setIsModalOpen(false);
          setSelectedResearch(null);
        }
      }
    } catch (error) {
      console.error('Error deleting SEO research result:', error);
      alert('Failed to delete research result');
    }
  };

  const handleDownload = (research: SEOResearchRecord) => {
    const content = `SEO Research Results for: ${research.query}

Research Parameters:
- Target Audience: ${research.target_audience || 'Not specified'}
- Industry/Location: ${research.industry || 'Not specified'}
- Research Type: ${research.research_type}
- Additional Context: ${research.additional_context || 'None'}

Research Output:
${research.research_output}

Generated on: ${new Date(research.created_at).toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-research-${research.query}-${new Date(research.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const openModal = (research: SEOResearchRecord) => {
    setSelectedResearch(research);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResearch(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Saved SEO Research</h1>
                <p className="text-xl text-slate-600 mt-2">
                  View and manage your saved SEO research results
                </p>
              </div>
            </div>
          </div>

          {/* Research Results List */}
          {researchResults.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No SEO Research Results Yet</h3>
              <p className="text-slate-600 mb-6">
                Start by running some SEO research to see your results here.
              </p>
              <Link
                href="/seo-research"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Target className="h-5 w-5" />
                Start SEO Research
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {researchResults.map((research) => (
                <div key={research.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{research.query}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{research.research_type}</span>
                        </div>
                        {research.target_audience && (
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            <span>{research.target_audience}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(research.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm line-clamp-3">
                        {research.research_output.substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => openModal(research)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownload(research)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(research.id)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedResearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-slate-900">{selectedResearch.query}</h2>
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
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Research Parameters:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Research Type:</span>
                    <span className="ml-2 text-slate-600">{selectedResearch.research_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Target Audience:</span>
                    <span className="ml-2 text-slate-600">{selectedResearch.target_audience || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Industry/Location:</span>
                    <span className="ml-2 text-slate-600">{selectedResearch.industry || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Created:</span>
                    <span className="ml-2 text-slate-600">{new Date(selectedResearch.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {selectedResearch.additional_context && (
                  <div className="mt-4">
                    <span className="font-medium text-slate-700">Additional Context:</span>
                    <p className="mt-1 text-slate-600">{selectedResearch.additional_context}</p>
                  </div>
                )}
              </div>
              
              <div className="prose prose-lg max-w-none">
                <h3 className="font-semibold text-slate-900 mb-4">Research Output:</h3>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-slate-900 font-mono leading-relaxed">
                    {selectedResearch.research_output}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => handleDownload(selectedResearch)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => handleDelete(selectedResearch.id)}
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
