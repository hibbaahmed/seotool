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
    } else {
      loadAllOnboardingKeywords();
    }
  }, [onboardingId]);

  const loadAllOnboardingKeywords = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/keywords/onboarding');
      if (!response.ok) {
        throw new Error('Failed to load keywords');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Flatten all keywords from all onboarding profiles
        const allKeywords = Object.values(result.data).flatMap((profile: any) => 
          profile.keywords.map((kw: any) => ({
            id: kw.id,
            keyword: kw.keyword,
            searchVolume: kw.search_volume || 0,
            difficulty: kw.difficulty_score || 0,
            opportunityLevel: kw.opportunity_level || 'low',
            cpc: kw.cpc || 0,
            source: kw.source || 'unknown',
            keywordIntent: kw.keyword_intent || 'informational',
            relatedKeywords: kw.related_keywords || [],
            starred: false,
            queued: !!kw.scheduled_for_generation,
            generated: kw.generation_status === 'generated',
            onboardingProfile: profile.profile
          }))
        );
        
        setKeywords(allKeywords);
        calculateStats(allKeywords);
      }
    } catch (error) {
      console.error('Error loading all onboarding keywords:', error);
    } finally {
      setLoading(false);
    }
  };

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
        starred: false,
        queued: !!item.scheduled_for_generation,
        generated: item.generation_status === 'generated'
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  // Sleek segmented time picker: hour / minute / period
  const [timeHour, setTimeHour] = useState<string>('06');
  const [timeMinute, setTimeMinute] = useState<string>('00');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  const to24Hour = (hour12: string, period: 'AM' | 'PM') => {
    let h = parseInt(hour12, 10) % 12;
    if (period === 'PM') h += 12;
    return String(h).padStart(2, '0');
  };

  const from24HourTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { hour: String(h).padStart(2, '0'), minute: minutes, period };
  };

  const addToQueue = async (keywordId: string) => {
    const keyword = keywords.find(k => k.id === keywordId);
    
    setSelectedKeywordId(keywordId);
    
    if (keyword?.queued) {
      // Editing existing schedule - fetch current schedule data BEFORE opening modal
      setIsEditingSchedule(true);
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('discovered_keywords')
          .select('scheduled_date, scheduled_time')
          .eq('id', keywordId)
          .single();
        
        if (data && !error) {
          setSelectedScheduleDate((data as any).scheduled_date || '');
          if ((data as any).scheduled_time) {
            const { hour, minute, period } = from24HourTo12Hour((data as any).scheduled_time);
            setTimeHour(hour);
            setTimeMinute(minute);
            setTimePeriod(period as 'AM' | 'PM');
          } else {
            // Fallback if no time stored
            setTimeHour('06');
            setTimeMinute('00');
            setTimePeriod('AM');
          }
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        // Set defaults on error
        setTimeHour('06');
        setTimeMinute('00');
        setTimePeriod('AM');
      }
      // Open modal AFTER data is loaded
      setShowDatePicker(true);
    } else {
      // New schedule - reset to defaults
      setIsEditingSchedule(false);
      setSelectedScheduleDate('');
      setTimeHour('06');
      setTimeMinute('00');
      setTimePeriod('AM');
      // Open modal immediately for new schedules
      setShowDatePicker(true);
    }
  };

  const scheduleKeyword = async () => {
    if (!selectedKeywordId || !selectedScheduleDate) return;

    try {
      const scheduledTime24 = `${to24Hour(timeHour, timePeriod)}:${timeMinute}:00`;

      const response = await fetch('/api/calendar/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_id: selectedKeywordId,
          scheduled_date: selectedScheduleDate,
          scheduled_time: scheduledTime24,
        }),
      });

      if (response.ok) {
        // Update local state
        setKeywords(prev => prev.map(k => 
          k.id === selectedKeywordId ? { ...k, queued: true } : k
        ));
        
        const scheduledAt = new Date(`${selectedScheduleDate}T${scheduledTime24}`);
        
        // Close modal and reset
        setShowDatePicker(false);
        setSelectedKeywordId(null);
        setSelectedScheduleDate('');
        setIsEditingSchedule(false);
        setTimeHour('06');
        setTimeMinute('00');
        setTimePeriod('AM');
        
        alert(`Keyword ${isEditingSchedule ? 'rescheduled' : 'scheduled'} successfully! It will be generated on ${scheduledAt.toLocaleString()}.`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to schedule keyword');
      }
    } catch (error) {
      console.error('Error scheduling keyword:', error);
      alert('Failed to schedule keyword');
    }
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
      case 'dataforseo': return <BarChart3 className="h-4 w-4" />;
      case 'dataforseo_discovery': return <BarChart3 className="h-4 w-4" />;
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
      <div className="pt-28 md:pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {onboardingId ? 'Keywords' : 'All Keywords'}
            </h1>
            <p className="text-slate-600">
              {onboardingId 
                ? 'Keywords discovered during your onboarding analysis with real metrics from DataForSEO.'
                : 'All keywords discovered across your onboarding analyses. Each keyword includes real search volume, CPC, and competition data from DataForSEO.'
              }
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
                            {keyword.source === 'dataforseo' ? 'DataForSEO' : 
                             keyword.source === 'dataforseo_discovery' ? 'DataForSEO Discovery' :
                             keyword.source.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => addToQueue(keyword.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                            keyword.queued
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {keyword.queued ? (
                            <>
                              <Clock className="h-3 w-3" />
                              Edit Schedule
                            </>
                          ) : (
                            <>
                              <Calendar className="h-3 w-3" />
                              Add to Calendar
                            </>
                          )}
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

          {/* Date Picker Modal */}
          {showDatePicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    {isEditingSchedule ? 'Edit Schedule' : 'Schedule for Calendar'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDatePicker(false);
                      setSelectedKeywordId(null);
                      setSelectedScheduleDate('');
                      setIsEditingSchedule(false);
                      setTimeHour('06');
                      setTimeMinute('00');
                      setTimePeriod('AM');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Generation Date & Time
                  </label>
                  <input
                    type="date"
                    value={selectedScheduleDate}
                    onChange={(e) => setSelectedScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <div className="mt-3">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <select
                          aria-label="Hour"
                          value={timeHour}
                          onChange={(e) => setTimeHour(e.target.value)}
                          className="px-3 py-3 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Minute"
                          value={timeMinute}
                          onChange={(e) => setTimeMinute(e.target.value)}
                          className="px-3 py-3 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          aria-label="AM/PM"
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value as 'AM' | 'PM')}
                          className="px-3 py-3 text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Times are scheduled in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDatePicker(false);
                      setSelectedKeywordId(null);
                      setSelectedScheduleDate('');
                      setIsEditingSchedule(false);
                      setTimeHour('06');
                      setTimeMinute('00');
                      setTimePeriod('AM');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={scheduleKeyword}
                    disabled={!selectedScheduleDate}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditingSchedule ? 'Update Schedule' : 'Schedule'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
