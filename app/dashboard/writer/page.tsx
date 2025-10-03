"use client"
import React, { useState } from 'react';
import { Sparkles, FileText, Globe, Image, Video, Link, Check, Clock, TrendingUp, Edit, Save, Share2, Calendar } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'creative', label: 'Creative' }
];

const lengths = [
  { value: 'short', label: 'Short (500-800 words)' },
  { value: 'medium', label: 'Medium (800-1500 words)' },
  { value: 'long', label: 'Long (1500+ words)' }
];

export default function AIArticleGenerator() {
  const [formData, setFormData] = useState({
    topic: '',
    keywords: [] as string[],
    language: 'en',
    tone: 'professional',
    length: 'medium',
    includeImages: true,
    includeVideo: false,
    includeTableOfContents: true,
    targetAudience: ''
  });
  
  const [keywordInput, setKeywordInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState('');

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const generateContent = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Simulate AI content generation with realistic delays
      await new Promise(resolve => setTimeout(resolve, 2000));

      const wordCountMap: { [key: string]: number } = { short: 600, medium: 1200, long: 1800 };
      const targetWords = wordCountMap[formData.length];

      // Generate structured content
      const content = generateMockContent(formData, targetWords);
      const parsed = parseGeneratedContent(content, formData);
      
      setGeneratedContent(parsed);
      setEditedContent(parsed.content);
      setError('');
    } catch (err) {
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockContent = (config: any, targetWords: number) => {
    const { topic, keywords, tone, includeImages, includeVideo, includeTableOfContents } = config;
    
    let content = `# ${topic}\n\n`;
    
    if (includeTableOfContents) {
      content += `## Table of Contents\n`;
      content += `- Introduction\n`;
      content += `- Key Concepts\n`;
      content += `- Best Practices\n`;
      content += `- Implementation Guide\n`;
      content += `- Conclusion\n\n`;
    }
    
    content += `## Introduction\n\n`;
    content += `In today's digital landscape, ${topic.toLowerCase()} has become increasingly important. `;
    content += `This comprehensive guide explores the essential aspects of ${topic.toLowerCase()} `;
    content += `and provides actionable insights for ${config.targetAudience || 'professionals'}.\n\n`;
    
    if (includeImages) {
      content += `[IMAGE: Overview diagram of ${topic}]\n\n`;
    }
    
    content += `## Key Concepts\n\n`;
    content += `Understanding ${topic.toLowerCase()} requires familiarity with several core concepts. `;
    
    if (keywords.length > 0) {
      content += `Key areas include ${keywords.slice(0, 3).join(', ')}, `;
      content += `each playing a crucial role in the overall strategy.\n\n`;
    } else {
      content += `These fundamentals form the foundation for successful implementation.\n\n`;
    }
    
    content += `### Essential Elements\n\n`;
    content += `The ${tone} approach to ${topic.toLowerCase()} emphasizes practical application `;
    content += `and measurable results. By focusing on data-driven strategies, organizations can `;
    content += `achieve significant improvements in performance and efficiency.\n\n`;
    
    if (includeVideo) {
      content += `[VIDEO: Step-by-step tutorial on ${topic}]\n\n`;
    }
    
    content += `## Best Practices\n\n`;
    content += `Implementing ${topic.toLowerCase()} effectively requires adherence to industry best practices. `;
    content += `Here are the key recommendations:\n\n`;
    content += `1. **Strategic Planning**: Develop a clear roadmap aligned with business objectives\n`;
    content += `2. **Resource Allocation**: Ensure adequate resources for implementation\n`;
    content += `3. **Continuous Monitoring**: Track metrics and adjust strategies accordingly\n`;
    content += `4. **Team Training**: Invest in skill development for optimal results\n\n`;
    
    if (includeImages) {
      content += `[IMAGE: Best practices infographic for ${topic}]\n\n`;
    }
    
    content += `## Implementation Guide\n\n`;
    content += `Successfully implementing ${topic.toLowerCase()} involves several critical steps. `;
    content += `Start by assessing your current capabilities and identifying areas for improvement. `;
    content += `Then, develop a phased approach that allows for iterative refinement.\n\n`;
    
    content += `### Getting Started\n\n`;
    content += `Begin with a thorough analysis of your objectives and constraints. `;
    content += `This foundation will guide your decision-making throughout the process. `;
    content += `Consider engaging stakeholders early to ensure buy-in and alignment.\n\n`;
    
    content += `### Execution Phase\n\n`;
    content += `During execution, maintain focus on deliverables while remaining flexible `;
    content += `to adapt to changing circumstances. Regular communication and progress `;
    content += `tracking are essential for keeping the project on track.\n\n`;
    
    content += `## Conclusion\n\n`;
    content += `${topic} represents a significant opportunity for organizations seeking `;
    content += `to enhance their capabilities and achieve competitive advantage. `;
    content += `By following the principles outlined in this guide, you can develop `;
    content += `a robust strategy that delivers measurable results.\n\n`;
    
    if (keywords.length > 0) {
      content += `Remember to focus on ${keywords[0]} and related concepts `;
      content += `as you implement your strategy. Success requires commitment, `;
      content += `continuous learning, and adaptation to evolving best practices.\n`;
    }
    
    return content;
  };

  const parseGeneratedContent = (content: string, config: any) => {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : config.topic;

    const tocMatch = content.match(/## Table of Contents\n([\s\S]*?)(?=\n##|\n#|$)/);
    const toc = tocMatch ? 
      tocMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line) : [];

    const imageMatches = [...content.matchAll(/\[IMAGE:\s*([^\]]+)\]/g)];
    const images = imageMatches.map((match) => ({
      placeholder: match[0],
      description: match[1],
      position: content.indexOf(match[0])
    }));

    const videoMatches = [...content.matchAll(/\[VIDEO:\s*([^\]]+)\]/g)];
    const videos = videoMatches.map((match) => ({
      placeholder: match[0],
      description: match[1],
      position: content.indexOf(match[0])
    }));

    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const seoScore = calculateSEOScore(content, config.keywords);

    return {
      title,
      content,
      tableOfContents: toc,
      images,
      videos,
      wordCount,
      readingTime,
      seoScore
    };
  };

  const calculateSEOScore = (content: string, keywords: string[]) => {
    let score = 100;
    const contentLower = content.toLowerCase();
    
    keywords.forEach(keyword => {
      const keywordCount = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      const density = (keywordCount / content.split(/\s+/).length) * 100;
      if (density < 0.5) score -= 10;
      if (density > 3) score -= 5;
    });

    const h1Count = (content.match(/^#\s/gm) || []).length;
    if (h1Count === 0) score -= 20;
    if (h1Count > 1) score -= 10;

    const wordCount = content.split(/\s+/).length;
    if (wordCount < 300) score -= 15;

    return Math.max(0, Math.min(100, score));
  };

  const saveEdits = () => {
    if (generatedContent) {
      setGeneratedContent((prev: any) => ({ ...prev, content: editedContent }));
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">AI SEO Article Generator</h1>
          </div>
          <p className="text-slate-600">Generate optimized content in 150+ languages with AI-powered writing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Content Brief</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic/Title</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Enter your content topic"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Keywords</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Add keyword"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addKeyword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Describe your target audience"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {tones.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Length</label>
                <select
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {lengths.map((length) => (
                    <option key={length.value} value={length.value}>
                      {length.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Content Features</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeImages}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeImages: e.target.checked }))}
                    className="rounded"
                  />
                  <Image className="w-4 h-4" />
                  <span className="text-sm">Include images</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeVideo}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeVideo: e.target.checked }))}
                    className="rounded"
                  />
                  <Video className="w-4 h-4" />
                  <span className="text-sm">Include video</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeTableOfContents}
                    onChange={(e) => setFormData(prev => ({ ...prev, includeTableOfContents: e.target.checked }))}
                    className="rounded"
                  />
                  <Link className="w-4 h-4" />
                  <span className="text-sm">Table of contents</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Content
                </>
              )}
            </button>
          </div>

          {/* Content Display Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Generated Content</h2>
                </div>
                {generatedContent && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditing ? 'Preview' : 'Edit'}
                    </button>
                    {isEditing && (
                      <button
                        onClick={saveEdits}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    )}
                  </div>
                )}
              </div>

              {generatedContent ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {isEditing ? (
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-80 bg-transparent border-none resize-none focus:outline-none text-sm"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm font-mono">{editedContent}</pre>
                    )}
                  </div>

                  {generatedContent.tableOfContents.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Table of Contents</h3>
                      <ul className="space-y-1">
                        {generatedContent.tableOfContents.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-blue-800">
                            {index + 1}. {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(generatedContent.images.length > 0 || generatedContent.videos.length > 0) && (
                    <div className="space-y-2">
                      {generatedContent.images.map((img: any, idx: number) => (
                        <div key={idx} className="bg-slate-100 rounded-lg p-3 flex items-center gap-2">
                          <Image className="w-5 h-5 text-slate-500" />
                          <span className="text-sm text-slate-700">{img.description}</span>
                        </div>
                      ))}
                      {generatedContent.videos.map((vid: any, idx: number) => (
                        <div key={idx} className="bg-slate-100 rounded-lg p-3 flex items-center gap-2">
                          <Video className="w-5 h-5 text-slate-500" />
                          <span className="text-sm text-slate-700">{vid.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Publish to CMS
                    </button>
                    <button className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share to Social
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Generated content will appear here</p>
                </div>
              )}
            </div>

            {generatedContent && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Content Stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{generatedContent.wordCount}</div>
                    <div className="text-sm text-slate-600 mt-1">Words</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{generatedContent.readingTime}</div>
                    <div className="text-sm text-slate-600 mt-1">Min Read</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{formData.keywords.length}</div>
                    <div className="text-sm text-slate-600 mt-1">Keywords</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{generatedContent.seoScore}</div>
                    <div className="text-sm text-slate-600 mt-1">SEO Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}