'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Star, 
  Calendar, 
  Plus, 
  Filter,
  Download,
  Eye,
  TrendingUp,
  Target,
  BarChart3,
  Clock,
  DollarSign,
  Users,
  Globe
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunityLevel: 'low' | 'medium' | 'high';
  cpc: number;
  source: string;
  keywordIntent: string;
  relatedKeywords: string[];
  starred: boolean;
  queued: boolean;
  generated: boolean;
}

interface KeywordStats {
  totalKeywords: number;
  recommended: number;
  starred: number;
  queued: number;
  generated: number;
}

export default function KeywordsDashboard() {
  const searchParams = useSearchParams();
  const onboardingId = searchParams.get('onboarding');
  
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stats, setStats] = useState<KeywordStats>({
    totalKeywords: 0,
    recommended: 0,
    starred: 0,
    queued: 0,
    generated: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'volume' | 'difficulty' | 'opportunity'>('relevance');

  useEffect(() => {
    if (onboardingId) {
      loadKeywords(onboardingId);
    }
  }, [onboardingId]);

  const loadKeywords = async (profileId: string) => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Load keywords from the onboarding profile
      const { data: keywordData, error } = await supabase
        .from('discovered_keywords')
        .select(`
          *,
          keyword_opportunities (
            opportunity_score,
            ranking_potential,
            content_opportunity,
            competition_level,
            priority_level,
            recommended_action,
            estimated_traffic_potential,
            estimated_conversion_potential
          )
        `)
        .eq('onboarding_profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading keywords:', error);
        return;
      }

      // Transform data to match our interface
      const transformedKeywords: Keyword[] = keywordData.map((item: any) => ({
        id: item.id,
        keyword: item.keyword,
        searchVolume: item.search_volume,
        difficulty: item.difficulty_score,
        opportunityLevel: item.opportunity_level,
        cpc: item.cpc,
        source: item.source,
        keywordIntent: item.keyword_intent,
        relatedKeywords: item.related_keywords || [],
        starred: false, // You can add this field to the database
        queued: false, // You can add this field to the database
        generated: false // You can add this field to the database
      }));

      setKeywords(transformedKeywords);
      calculateStats(transformedKeywords);
    } catch (error) {
      console.error('Error loading keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (keywordList: Keyword[]) => {
    const newStats: KeywordStats = {
      totalKeywords: keywordList.length,
      recommended: keywordList.filter(k => k.opportunityLevel === 'high').length,
      starred: keywordList.filter(k => k.starred).length,
      queued: keywordList.filter(k => k.queued).length,
      generated: keywordList.filter(k => k.generated).length
    };
    setStats(newStats);
  };

  const filteredKeywords = keywords.filter(keyword => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'all' || keyword.opportunityLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const sortedKeywords = [...filteredKeywords].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.searchVolume - a.searchVolume;
      case 'difficulty':
        return a.difficulty - b.difficulty;
      case 'opportunity':
        const opportunityOrder = { high: 3, medium: 2, low: 1 };
        return opportunityOrder[b.opportunityLevel] - opportunityOrder[a.opportunityLevel];
      default:
        return 0; // Keep original order for relevance
    }
  });

  const toggleStar = (keywordId: string) => {
    setKeywords(prev => prev.map(k => 
      k.id === keywordId ? { ...k, starred: !k.starred } : k
    ));
  };

  const addToQueue = (keywordId: string) => {
    setKeywords(prev => prev.map(k => 
      k.id === keywordId ? { ...k, queued: !k.queued } : k
    ));
  };

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'competitor': return <Users className="h-4 w-4" />;
      case 'site_analysis': return <Globe className="h-4 w-4" />;
      case 'google_trends': return <TrendingUp className="h-4 w-4" />;
      case 'serp_analysis': return <Search className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your keyword list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Keywords</h1>
            <p className="text-slate-600">
              This is your entire keyword list, created through in-depth research of your competitors, 
              industry trends, and business niche. Each keyword has been carefully selected based on 
              relevance to your business, search demand, and ranking potential.
            </p>
          </div>

          {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                      <div className="text-2xl font-bold text-slate-900">{stats.totalKeywords}</div>
                  <div className="text-sm text-slate-600">All Keywords</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.recommended}</div>
                  <div className="text-sm text-slate-600">Recommended</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.starred}</div>
                  <div className="text-sm text-slate-600">Starred</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.queued}</div>
                  <div className="text-sm text-slate-600">Queued</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.generated}</div>
                  <div className="text-sm text-slate-600">Generated</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Keywords
                </button>
                
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Opportunities</option>
                  <option value="high">High Opportunity</option>
                  <option value="medium">Medium Opportunity</option>
                  <option value="low">Low Opportunity</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="volume">Sort by Volume</option>
                  <option value="difficulty">Sort by Difficulty</option>
                  <option value="opportunity">Sort by Opportunity</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              {stats.totalKeywords} keywords in total
            </div>
          </div>

          {/* Keywords Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opportunity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedKeywords.map((keyword) => (
                    <tr key={keyword.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStar(keyword.id)}
                            className={`p-1 rounded ${
                              keyword.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          >
                            <Star className={`h-4 w-4 ${keyword.starred ? 'fill-current' : ''}`} />
                          </button>
                          <span className="text-sm font-medium text-slate-900">
                            {keyword.keyword}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOpportunityColor(keyword.opportunityLevel)}`}>
                          {keyword.opportunityLevel.charAt(0).toUpperCase() + keyword.opportunityLevel.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {keyword.difficulty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {keyword.searchVolume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        ${keyword.cpc.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(keyword.source)}
                          <span className="text-sm text-slate-600 capitalize">
                            {keyword.source.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => addToQueue(keyword.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            keyword.queued
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {keyword.queued ? 'In Queue' : 'Add to Calendar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sortedKeywords.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No keywords found</h3>
              <p className="text-slate-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Complete the onboarding process to discover keywords'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
