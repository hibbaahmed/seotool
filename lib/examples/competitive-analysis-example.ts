/**
 * Competitive Analysis Agent - Example Usage
 * 
 * This file demonstrates how to use the competitive analysis agent
 * for identifying content gaps and opportunities.
 */

import React, { useState } from 'react';

// Example 1: Basic competitive analysis
export async function basicCompetitiveAnalysis() {
  const response = await fetch('/api/agents/competitive-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: 'AI-powered content marketing',
      keywords: ['content marketing', 'AI tools', 'automation'],
      targetAudience: 'marketing professionals',
      analysisType: 'content-gaps'
    })
  });

  const result = await response.json();
  return result;
}

// Example 2: Competitor-focused analysis
export async function competitorAnalysis() {
  const response = await fetch('/api/agents/competitive-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: 'SEO tools comparison',
      competitors: [
        'https://ahrefs.com',
        'https://semrush.com',
        'https://moz.com'
      ],
      keywords: ['SEO tools', 'keyword research', 'rank tracking'],
      analysisType: 'ranking-factors'
    })
  });

  const result = await response.json();
  return result;
}

// Example 3: Opportunity identification
export async function opportunityAnalysis() {
  const response = await fetch('/api/agents/competitive-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: 'sustainable e-commerce practices',
      keywords: ['green business', 'sustainability', 'eco-friendly'],
      targetAudience: 'e-commerce business owners',
      analysisType: 'opportunities'
    })
  });

  const result = await response.json();
  return result;
}

// Example usage in a React component

export const CompetitiveAnalysisExample = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await basicCompetitiveAnalysis();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Competitive Analysis</h2>
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>
      
      {analysis && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Analysis Results:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
