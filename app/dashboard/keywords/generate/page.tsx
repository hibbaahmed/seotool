'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Plus, Search, TrendingUp, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Profile {
  id: string;
  website_url: string;
  business_name: string;
  industry: string;
  created_at: string;
}

interface Stats {
  total: number;
  byType: {
    primary: number;
    secondary: number;
    longTail: number;
    unclassified: number;
  };
  byOpportunity: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function GenerateKeywordsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [seedKeywords, setSeedKeywords] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Advanced options
  const [minSearchVolume, setMinSearchVolume] = useState(0);
  const [maxDifficulty, setMaxDifficulty] = useState(100);
  const [maxKeywordsPerSeed, setMaxKeywordsPerSeed] = useState(30);
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeRelated, setIncludeRelated] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadProfileStats(selectedProfile.id);
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_onboarding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
      if (data && data.length > 0) {
        setSelectedProfile(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileStats = async (profileId: string) => {
    try {
      const response = await fetch(`/api/keywords/generate?profile_id=${profileId}`);
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  const addSeedKeyword = () => {
    setSeedKeywords([...seedKeywords, '']);
  };

  const removeSeedKeyword = (index: number) => {
    setSeedKeywords(seedKeywords.filter((_, i) => i !== index));
  };

  const updateSeedKeyword = (index: number, value: string) => {
    const updated = [...seedKeywords];
    updated[index] = value;
    setSeedKeywords(updated);
  };

  const handleGenerate = async () => {
    if (!selectedProfile) {
      setError('Please select a profile');
      return;
    }

    const validSeeds = seedKeywords.filter(k => k.trim().length > 0);
    if (validSeeds.length === 0) {
      setError('Please enter at least one seed keyword');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/keywords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeywords: validSeeds,
          profileId: selectedProfile.id,
          minSearchVolume,
          maxDifficulty,
          maxKeywordsPerSeed,
          includeQuestions,
          includeRelated
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate keywords');
      }

      setResult(data);
      
      // Reload stats
      await loadProfileStats(selectedProfile.id);
      
      // Show success message for 3 seconds then redirect
      setTimeout(() => {
        router.push('/dashboard/keywords');
      }, 3000);

    } catch (err: any) {
      console.error('Error generating keywords:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Projects Found</h2>
            <p className="text-slate-600 mb-6">
              You need to complete onboarding first to generate keywords.
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Generate More Keywords</h1>
          <p className="text-slate-600">
            Expand your keyword research with DataForSEO integration
          </p>
        </div>

        {/* Profile Selection */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Project
          </label>
          <select
            value={selectedProfile?.id || ''}
            onChange={(e) => {
              const profile = profiles.find(p => p.id === e.target.value);
              setSelectedProfile(profile || null);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.business_name || profile.website_url} ({profile.industry})
              </option>
            ))}
          </select>

          {/* Current Stats */}
          {stats && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-slate-600">Total Keywords</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{stats.byOpportunity.high}</div>
                <div className="text-sm text-slate-600">High Opportunity</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">{stats.byType.primary}</div>
                <div className="text-sm text-slate-600">Primary</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">{stats.byType.longTail}</div>
                <div className="text-sm text-slate-600">Long-tail</div>
              </div>
            </div>
          )}
        </div>

        {/* Seed Keywords */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Seed Keywords</h2>
            <button
              onClick={addSeedKeyword}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Keyword
            </button>
          </div>

          <div className="space-y-3">
            {seedKeywords.map((keyword, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => updateSeedKeyword(index, e.target.value)}
                  placeholder={`e.g., ${index === 0 ? 'seo tools' : index === 1 ? 'keyword research' : 'content marketing'}`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {seedKeywords.length > 1 && (
                  <button
                    onClick={() => removeSeedKeyword(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-500 mt-3">
            💡 Tip: Use specific topics related to your industry for best results
          </p>
        </div>

        {/* Advanced Options */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-xl font-bold text-slate-900">Advanced Options</h2>
            <span className="text-slate-400">{showAdvanced ? '−' : '+'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Min Search Volume
                  </label>
                  <input
                    type="number"
                    value={minSearchVolume}
                    onChange={(e) => setMinSearchVolume(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Difficulty (0-100)
                  </label>
                  <input
                    type="number"
                    value={maxDifficulty}
                    onChange={(e) => setMaxDifficulty(Math.min(100, parseInt(e.target.value) || 100))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Keywords per Seed
                </label>
                <input
                  type="number"
                  value={maxKeywordsPerSeed}
                  onChange={(e) => setMaxKeywordsPerSeed(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeQuestions}
                    onChange={(e) => setIncludeQuestions(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-slate-700">Include question-based keywords</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeRelated}
                    onChange={(e) => setIncludeRelated(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-slate-700">Include related keywords</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-900 text-lg">Success!</h3>
                <p className="text-sm text-green-700 mt-1">{result.message}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{result.keywords.saved}</div>
                <div className="text-sm text-slate-600">Keywords Saved</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">{result.keywords.byType.primary}</div>
                <div className="text-sm text-slate-600">Primary</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-600">{result.keywords.byType.longTail}</div>
                <div className="text-sm text-slate-600">Long-tail</div>
              </div>
            </div>

            <p className="text-sm text-green-700 mt-4">
              Redirecting to keywords dashboard...
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || seedKeywords.filter(k => k.trim()).length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Keywords from DataForSEO...
            </>
          ) : (
            <>
              <TrendingUp className="h-5 w-5" />
              Generate Keywords
            </>
          )}
        </button>

        <p className="text-sm text-slate-500 text-center mt-4">
          Keywords will be classified as primary, secondary, and long-tail automatically
        </p>
      </div>
    </div>
  );
}

