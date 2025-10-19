'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Download, Trash2, Eye } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface CompetitiveAnalysisRecord {
  id: string;
  user_id: string;
  company_name: string;
  competitor_name: string;
  analysis_type: string;
  analysis_output: string;
  created_at: string;
  updated_at: string;
}

export default function SavedAnalysesPage() {
  const [analyses, setAnalyses] = useState<CompetitiveAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CompetitiveAnalysisRecord | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAnalyses([]);
        return;
      }

      const { data: analyses, error } = await supabase
        .from('competitive_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading analyses:', error);
        setAnalyses([]);
      } else {
        setAnalyses(analyses || []);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('competitive_analysis')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting analysis:', error);
      } else {
        setAnalyses(analyses.filter(a => a.id !== id));
        if (selectedAnalysis?.id === id) {
          setSelectedAnalysis(null);
        }
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const handleDownload = (analysis: CompetitiveAnalysisRecord) => {
    const blob = new Blob([analysis.analysis_output], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitive-analysis-${analysis.company_name}-${new Date(analysis.created_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="pt-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Saved Competitive Analyses
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              View and manage your previously saved competitive analysis reports
            </p>
          </div>

          {analyses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Saved Analyses</h3>
              <p className="text-slate-600 mb-6">
                You haven't saved any competitive analyses yet. Run an analysis and save it to see it here.
              </p>
              <a
                href="/competitive-analysis"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
              >
                Start New Analysis
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Analyses List */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Analyses</h2>
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className={`bg-white rounded-xl shadow-lg border border-slate-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                      selectedAnalysis?.id === analysis.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {analysis.company_name}
                        </h3>
                        <p className="text-slate-600 mb-3">
                          vs {analysis.competitor_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(analysis.created_at)}
                          </span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                            {analysis.analysis_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(analysis);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(analysis.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analysis Details */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Analysis Details</h2>
                {selectedAnalysis ? (
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {selectedAnalysis.company_name}
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Competitive analysis vs {selectedAnalysis.competitor_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(selectedAnalysis.created_at)}
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          {selectedAnalysis.analysis_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Analysis Output</h4>
                      <div className="prose prose-slate max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed max-h-96 overflow-y-auto">
                          {selectedAnalysis.analysis_output}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
                    <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Select an Analysis</h3>
                    <p className="text-slate-600">
                      Click on any analysis from the list to view its details here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
