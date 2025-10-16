'use client';

import { useState } from 'react';
import { Search, TrendingUp, Target, BarChart3, ArrowRight } from 'lucide-react';

export default function CompetitiveAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    industry: '',
    targetAudience: '',
    analysisType: 'comprehensive',
    additionalContext: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setResults('');

    try {
              const response = await fetch('/api/competitive-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Perform a competitive analysis for the topic: "${formData.topic}"

Industry: ${formData.industry}
Target Audience: ${formData.targetAudience}
Analysis Type: ${formData.analysisType}

Additional Context: ${formData.additionalContext}

Please provide a comprehensive analysis including:
1. Top competitors and their content strategies
2. Content gaps and opportunities
3. Keyword opportunities
4. Recommended content angles
5. Actionable insights for content creation`
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'token' && parsed.value) {
                setResults(prev => prev + parsed.value);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setResults('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Competitive Analysis
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Uncover content gaps and opportunities by analyzing your competitors&apos; strategies
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                    Topic/Keyword *
                  </label>
                  <input
                    type="text"
                    id="topic"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-900"
                    placeholder="e.g., ai video generator"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
                    Industry *
                  </label>
                  <input
                    type="text"
                    id="industry"
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-900"
                    placeholder="e.g., SaaS, E-commerce"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700 mb-2">
                  Target Audience *
                </label>
                <input
                  type="text"
                  id="targetAudience"
                  required
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-900"
                  placeholder="e.g., marketers, developers, small business owners"
                />
              </div>

              <div>
                <label htmlFor="analysisType" className="block text-sm font-medium text-slate-700 mb-2">
                  Analysis Type
                </label>
                <select
                  id="analysisType"
                  value={formData.analysisType}
                  onChange={(e) => setFormData(prev => ({ ...prev, analysisType: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 bg-white"
                >
                  <option value="comprehensive">Comprehensive Analysis</option>
                  <option value="content-gaps">Content Gap Analysis</option>
                  <option value="keyword-opportunities">Keyword Opportunities</option>
                  <option value="competitor-comparison">Competitor Comparison</option>
                </select>
              </div>

              <div>
                <label htmlFor="additionalContext" className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Context
                </label>
                <textarea
                  id="additionalContext"
                  rows={4}
                  value={formData.additionalContext}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-900"
                  placeholder="Any specific competitors, goals, or context you'd like to include..."
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {results}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}