'use client';

import { useState } from 'react';
import { PenTool, FileText, ArrowRight, Eye, Download } from 'lucide-react';

export default function ContentWriterPage() {
  const [isWriting, setIsWriting] = useState(false);
  const [results, setResults] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    contentType: 'blog-post',
    targetAudience: '',
    tone: 'professional',
    length: 'medium',
    additionalContext: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWriting(true);
    setResults('');

    try {
      const response = await fetch('/api/agents/content-writer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Create ${formData.contentType} content with the following specifications:
Topic: "${formData.topic}"
Content Type: ${formData.contentType}
Target Audience: "${formData.targetAudience}"
Tone: ${formData.tone}
Length: ${formData.length}
Additional Context: "${formData.additionalContext}"

Please provide high-quality, engaging content that meets these requirements.`
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Content generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResult = '';

      while (true) {
        const { value, done } = await reader!.read();
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
                setIsWriting(false);
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
      console.error('Content generation error:', error);
      setResults(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setIsWriting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <PenTool className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              AI Content Writer
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Generate high-quality, engaging content tailored to your specific needs. Create blog posts, articles, marketing copy, and more with AI assistance.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Input */}
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                  What topic do you want to write about? *
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., 'The Future of AI in Healthcare', '10 Tips for Remote Work Success', 'Sustainable Fashion Trends'"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-900"
                  required
                />
              </div>

              {/* Content Type and Audience Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contentType" className="block text-sm font-medium text-slate-700 mb-2">
                    Content Type
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="blog-post">Blog Post</option>
                    <option value="article">Article</option>
                    <option value="social-media">Social Media Post</option>
                    <option value="email">Email Newsletter</option>
                    <option value="product-description">Product Description</option>
                    <option value="landing-page">Landing Page Copy</option>
                    <option value="press-release">Press Release</option>
                    <option value="case-study">Case Study</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700 mb-2">
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., 'tech professionals', 'small business owners', 'healthcare workers'"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Tone and Length Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-2">
                    Writing Tone
                  </label>
                  <select
                    id="tone"
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="conversational">Conversational</option>
                    <option value="technical">Technical</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="informative">Informative</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-slate-700 mb-2">
                    Content Length
                  </label>
                  <select
                    id="length"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="short">Short (300-500 words)</option>
                    <option value="medium">Medium (800-1200 words)</option>
                    <option value="long">Long (1500-2500 words)</option>
                    <option value="comprehensive">Comprehensive (2500+ words)</option>
                  </select>
                </div>
              </div>

              {/* Additional Context */}
              <div>
                <label htmlFor="additionalContext" className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  id="additionalContext"
                  name="additionalContext"
                  rows={4}
                  value={formData.additionalContext}
                  onChange={handleInputChange}
                  placeholder="Include any specific requirements, key points to cover, SEO keywords, or other details that will help create better content..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-900"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                disabled={isWriting}
              >
                {isWriting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Writing Content...
                  </>
                ) : (
                  <>
                    <PenTool className="h-5 w-5" />
                    Generate Content
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-green-600" />
                <h3 className="text-2xl font-bold text-slate-900">Generated Content</h3>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <pre className="whitespace-pre-wrap text-sm text-slate-900 font-mono leading-relaxed">
                    {results}
                  </pre>
                </div>
              </div>

              {!isWriting && !results.includes('Error:') && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Tips:</span>
                  </div>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Copy the content to use in your projects</li>
                    <li>• Review and edit as needed for your specific use case</li>
                    <li>• Consider adding images, links, or additional sections</li>
                    <li>• Use different tones and lengths for varied content types</li>
                    <li>• Save successful prompts for future content generation</li>
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
