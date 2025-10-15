'use client';

import { useState } from 'react';
import { Search, TrendingUp, Target, BarChart3, ArrowRight, Eye, Download } from 'lucide-react';

export default function SEOResearchPage() {
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    targetAudience: '',
    location: 'global',
    researchType: 'comprehensive',
    keywordFocus: 'primary',
    additionalContext: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResearching(true);
    setResults('');

    try {
      const response = await fetch('/api/agents/seo-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Perform SEO research with the following specifications:
Topic: "${formData.topic}"
Target Audience: ${formData.targetAudience}
Location: ${formData.location}
Research Type: ${formData.researchType}
Keyword Focus: ${formData.keywordFocus}
Additional Context: ${formData.additionalContext}

Please provide comprehensive SEO research including keyword analysis, competitor insights, content opportunities, and actionable recommendations.`
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('SEO research failed');
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
              } else if (data.type === 'done') {
                setIsResearching(false);
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
      console.error('SEO research error:', error);
      setResults(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setIsResearching(false);
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
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              SEO Research
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get comprehensive SEO insights including keyword analysis, competitor research, 
              and content opportunities to boost your search rankings.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Input */}
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  What topic or business do you want to research?
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., digital marketing agency, sustainable fashion, SaaS tools..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              {/* Target Audience and Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., small business owners, marketing professionals..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Location
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="global">Global</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="custom">Custom Location</option>
                  </select>
                </div>
              </div>

              {/* Research Type and Keyword Focus Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="researchType" className="block text-sm font-medium text-gray-700 mb-2">
                    Research Type
                  </label>
                  <select
                    id="researchType"
                    name="researchType"
                    value={formData.researchType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="comprehensive">Comprehensive Analysis</option>
                    <option value="keyword-focused">Keyword Research</option>
                    <option value="competitor">Competitor Analysis</option>
                    <option value="content">Content Opportunities</option>
                    <option value="technical">Technical SEO</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="keywordFocus" className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword Focus
                  </label>
                  <select
                    id="keywordFocus"
                    name="keywordFocus"
                    value={formData.keywordFocus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="primary">Primary Keywords</option>
                    <option value="long-tail">Long-tail Keywords</option>
                    <option value="LSI">LSI Keywords</option>
                    <option value="local">Local Keywords</option>
                    <option value="commercial">Commercial Keywords</option>
                  </select>
                </div>
              </div>

              {/* Additional Context */}
              <div>
                <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  id="additionalContext"
                  name="additionalContext"
                  value={formData.additionalContext}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="e.g., specific competitors to analyze, current rankings, target keywords, business goals..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isResearching}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isResearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Researching SEO opportunities...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Start SEO Research
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">SEO Research Results</h3>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono leading-relaxed">
                    {results}
                  </pre>
                </div>
              </div>

              {!isResearching && results && !results.includes('Error:') && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium">Next Steps:</span>
                  </div>
                  <ul className="mt-2 text-sm text-green-700 space-y-1">
                    <li>• Implement the recommended keywords in your content</li>
                    <li>• Analyze competitor strategies and adapt best practices</li>
                    <li>• Create content around identified opportunities</li>
                    <li>• Monitor your rankings and track progress</li>
                    <li>• Consider technical SEO improvements</li>
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
