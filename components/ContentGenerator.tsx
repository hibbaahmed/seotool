"use client"
import React, { useState } from 'react';
import { Send, Bot, Loader2, FileText, Search, Target, Users, Globe } from 'lucide-react';

interface ContentGeneratorProps {
  className?: string;
}

interface GenerationResult {
  content: string;
  type: 'content' | 'research' | 'analysis';
  timestamp: Date;
}

export default function ContentGenerator({ className = "" }: ContentGeneratorProps) {
  const [selectedAgent, setSelectedAgent] = useState<'content' | 'research' | 'analysis'>('content');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');

  const agents = [
    {
      id: 'content' as const,
      name: 'Content Writer',
      description: 'Generate blog posts, articles, and marketing copy',
      icon: FileText,
      color: 'blue',
      placeholder: 'Write a blog post about sustainable energy solutions...'
    },
    {
      id: 'research' as const,
      name: 'SEO Research',
      description: 'Find keywords, analyze competitors, and research topics',
      icon: Search,
      color: 'green',
      placeholder: 'Research keywords for "digital marketing agency"...'
    },
    {
      id: 'analysis' as const,
      name: 'Competitive Analysis',
      description: 'Analyze competitors and market trends',
      icon: Target,
      color: 'purple',
      placeholder: 'Analyze competitors in the project management software space...'
    }
  ];

  const generateContent = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const endpoint = selectedAgent === 'content' 
        ? '/api/agents/generate-content'
        : selectedAgent === 'research'
        ? '/api/agents/generate-research'
        : '/api/agents/generate-analysis';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          agent: selectedAgent
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let generatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split('\n\n').filter(Boolean);

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          
          try {
            const payload = JSON.parse(event.slice(6));
            
            if (payload.type === 'token') {
              generatedContent += payload.value;
              setResult({
                content: generatedContent,
                type: selectedAgent,
                timestamp: new Date()
              });
            } else if (payload.type === 'error') {
              throw new Error(payload.message);
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      generateContent();
    }
  };

  const copyToClipboard = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
    }
  };

  const selectedAgentConfig = agents.find(a => a.id === selectedAgent);

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">AI Content Generator</h2>
        </div>
        
        {/* Agent Selection */}
        <div className="grid grid-cols-3 gap-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? `border-${agent.color}-500 bg-${agent.color}-50`
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? `text-${agent.color}-600` : 'text-slate-500'}`} />
                  <span className={`text-sm font-medium ${isSelected ? `text-${agent.color}-900` : 'text-slate-700'}`}>
                    {agent.name}
                  </span>
                </div>
                <p className={`text-xs ${isSelected ? `text-${agent.color}-700` : 'text-slate-500'}`}>
                  {agent.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Section */}
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What would you like to generate?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={selectedAgentConfig?.placeholder}
            disabled={isGenerating}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder:text-slate-400 disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Press Cmd/Ctrl + Enter to generate
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={generateContent}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Generate Content
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="border-t border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {selectedAgentConfig && (
                <>
                  <selectedAgentConfig.icon className={`w-5 h-5 text-${selectedAgentConfig.color}-600`} />
                  <h3 className="text-lg font-medium text-slate-900">
                    Generated {selectedAgentConfig.name}
                  </h3>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {result.timestamp.toLocaleTimeString()}
              </span>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-slate-900 font-sans">
              {result.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

