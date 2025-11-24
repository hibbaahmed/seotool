'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Globe,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { checkCredits } from '@/app/utils/creditCheck';
import OutOfCreditsDialog from '@/components/OutOfCreditsDialog';

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
  keywordType?: 'primary' | 'secondary' | 'long-tail';
}

interface KeywordStats {
  totalKeywords: number;
  recommended: number;
  starred: number;
  queued: number;
  generated: number;
}

export default function KeywordsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboardingId = searchParams.get('onboarding');
  const REQUIRED_CREDITS_FOR_KEYWORD_GENERATION = 1;

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
  const [activeFilterCard, setActiveFilterCard] = useState<'all' | 'recommended' | 'starred' | 'queued' | 'generated'>('all');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  // Sleek segmented time picker: hour / minute / period
  const [timeHour, setTimeHour] = useState<string>('06');
  const [timeMinute, setTimeMinute] = useState<string>('00');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  // Add Keywords Modal State
  const [showAddKeywordsModal, setShowAddKeywordsModal] = useState(false);
  const [profiles, setProfiles] = useState<Array<{ id: string; business_name?: string; website_url: string; industry?: string }>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [seedKeywords, setSeedKeywords] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minSearchVolume, setMinSearchVolume] = useState(0);
  const [maxDifficulty, setMaxDifficulty] = useState(100);
  const [maxKeywordsPerSeed, setMaxKeywordsPerSeed] = useState(30);
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeRelated, setIncludeRelated] = useState(true);
  const [showOutOfCreditsDialog, setShowOutOfCreditsDialog] = useState(false);
  const [requiredCreditsForDialog, setRequiredCreditsForDialog] = useState(REQUIRED_CREDITS_FOR_KEYWORD_GENERATION);

  useEffect(() => {
    if (onboardingId) {
      loadKeywords(onboardingId);
      setSelectedProfileId(onboardingId);
    } else {
      loadAllOnboardingKeywords();
    }
  }, [onboardingId]);

  // Load profiles when modal opens
  useEffect(() => {
    if (showAddKeywordsModal) {
      loadProfiles();
    }
  }, [showAddKeywordsModal]);

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
            starred: !!kw.starred,
            queued: !!kw.scheduled_for_generation,
            generated: kw.generation_status === 'generated',
            keywordType: kw.keyword_type,
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
        starred: !!item.starred,
        queued: !!item.scheduled_for_generation,
        generated: item.generation_status === 'generated',
        keywordType: item.keyword_type
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
    const matchesLevel = filterLevel === 'all' || keyword.opportunityLevel === filterLevel;
    const matchesCard =
      activeFilterCard === 'all' ? true :
      activeFilterCard === 'recommended' ? keyword.opportunityLevel === 'high' :
      activeFilterCard === 'starred' ? keyword.starred :
      activeFilterCard === 'queued' ? keyword.queued :
      activeFilterCard === 'generated' ? keyword.generated : true;
    return matchesSearch && matchesLevel && matchesCard;
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

  const toggleStar = async (keywordId: string) => {
    // Optimistically update UI
    const keyword = keywords.find(k => k.id === keywordId);
    const newStarredValue = !keyword?.starred;
    
    setKeywords(prev => prev.map(k => 
      k.id === keywordId ? { ...k, starred: newStarredValue } : k
    ));
    
    // Persist to database
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Revert on error if not authenticated
        setKeywords(prev => prev.map(k => 
          k.id === keywordId ? { ...k, starred: !newStarredValue } : k
        ));
        return;
      }

      const { error } = await (supabase as any)
        .from('discovered_keywords')
        .update({ starred: newStarredValue })
        .eq('id', keywordId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating starred status:', error);
        // Revert on error
        setKeywords(prev => {
          const reverted = prev.map(k => 
            k.id === keywordId ? { ...k, starred: !newStarredValue } : k
          );
          calculateStats(reverted);
          return reverted;
        });
      } else {
        // Recalculate stats after successful update
        setKeywords(prev => {
          calculateStats(prev);
          return prev;
        });
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      // Revert on error
      setKeywords(prev => prev.map(k => 
        k.id === keywordId ? { ...k, starred: !newStarredValue } : k
      ));
    }
  };


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
      case 'high': return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200';
      case 'medium': return 'text-amber-700 bg-amber-50 ring-1 ring-amber-200';
      case 'low': return 'text-slate-700 bg-slate-50 ring-1 ring-slate-200';
      default: return 'text-slate-700 bg-slate-50 ring-1 ring-slate-200';
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

  // Load profiles for keyword generation
  const loadProfiles = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('user_onboarding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
      
      // If we have an onboardingId in URL, use it; otherwise use first profile
      if (onboardingId && data?.some(p => p.id === onboardingId)) {
        setSelectedProfileId(onboardingId);
      } else if (data && data.length > 0) {
        setSelectedProfileId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading profiles:', err);
      setGenerateError(err.message);
    }
  };

  // Add/remove seed keywords
  const addSeedKeyword = () => {
    setSeedKeywords([...seedKeywords, '']);
  };

  const removeSeedKeyword = (index: number) => {
    if (seedKeywords.length > 1) {
      setSeedKeywords(seedKeywords.filter((_, i) => i !== index));
    }
  };

  const updateSeedKeyword = (index: number, value: string) => {
    const updated = [...seedKeywords];
    updated[index] = value;
    setSeedKeywords(updated);
  };

  // Generate keywords
  const handleGenerateKeywords = async () => {
    if (!selectedProfileId) {
      setGenerateError('Please select a project');
      return;
    }

    const validSeeds = seedKeywords.filter(k => k.trim().length > 0);
    if (validSeeds.length === 0) {
      setGenerateError('Please enter at least one seed keyword');
      return;
    }

    setGenerateError(null);
    setGenerateSuccess(null);

    const creditResult = await checkCredits(REQUIRED_CREDITS_FOR_KEYWORD_GENERATION);
    if (!creditResult || creditResult.error || !creditResult.hasEnoughCredits) {
      setRequiredCreditsForDialog(REQUIRED_CREDITS_FOR_KEYWORD_GENERATION);
      setShowOutOfCreditsDialog(true);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/keywords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeywords: validSeeds,
          profileId: selectedProfileId,
          minSearchVolume,
          maxDifficulty,
          maxKeywordsPerSeed,
          includeQuestions,
          includeRelated
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate keywords');
      }

      setGenerateSuccess(data);
      // Reload keywords after successful generation
      if (onboardingId) {
        await loadKeywords(onboardingId);
      } else {
        await loadAllOnboardingKeywords();
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setSeedKeywords(['']);
        setGenerateSuccess(null);
      }, 2000);

    } catch (err: any) {
      console.error('Error generating keywords:', err);
      setGenerateError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Close modal and reset state
  const closeAddKeywordsModal = () => {
    setShowAddKeywordsModal(false);
    setSeedKeywords(['']);
    setGenerateError(null);
    setGenerateSuccess(null);
    setShowAdvanced(false);
    setIsGenerating(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pt-28 md:pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
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
            <button onClick={()=>{ setActiveFilterCard('all'); setFilterLevel('all'); setSearchTerm(''); }} className={`text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${activeFilterCard==='all' ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 ring-1 ring-inset ring-indigo-200">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                      <div className="text-2xl font-bold text-slate-900">{stats.totalKeywords}</div>
                  <div className="text-sm text-slate-600">All Keywords</div>
                </div>
              </div>
            </button>

            <button onClick={()=>{ setActiveFilterCard('recommended'); setFilterLevel('all'); }} className={`text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${activeFilterCard==='recommended' ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 ring-1 ring-inset ring-emerald-200">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.recommended}</div>
                  <div className="text-sm text-slate-600">Recommended</div>
                </div>
              </div>
            </button>

            <button onClick={()=>{ setActiveFilterCard('starred'); setFilterLevel('all'); }} className={`text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${activeFilterCard==='starred' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-inset ring-amber-200">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.starred}</div>
                  <div className="text-sm text-slate-600">Starred</div>
                </div>
              </div>
            </button>

            <button onClick={()=>{ setActiveFilterCard('queued'); setFilterLevel('all'); }} className={`text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${activeFilterCard==='queued' ? 'border-violet-300 ring-1 ring-violet-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 ring-1 ring-inset ring-violet-200">
                  <Clock className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.queued}</div>
                  <div className="text-sm text-slate-600">Queued</div>
                </div>
              </div>
            </button>

            <button onClick={()=>{ setActiveFilterCard('generated'); setFilterLevel('all'); }} className={`text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${activeFilterCard==='generated' ? 'border-sky-300 ring-1 ring-sky-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-inset ring-sky-200">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.generated}</div>
                  <div className="text-sm text-slate-600">Generated</div>
                </div>
              </div>
            </button>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <button 
                  onClick={() => setShowAddKeywordsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Keywords
                </button>
                
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Opportunities</option>
                  <option value="high">High Opportunity</option>
                  <option value="medium">Medium Opportunity</option>
                  <option value="low">Low Opportunity</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="volume">Sort by Volume</option>
                  <option value="difficulty">Sort by Difficulty</option>
                  <option value="opportunity">Sort by Opportunity</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Opportunity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      CPC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedKeywords.map((keyword) => (
                    <tr key={keyword.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStar(keyword.id)}
                            className={`p-1 rounded ${
                              keyword.starred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
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
                        {keyword.keywordType ? (
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                            keyword.keywordType === 'primary' ? 'bg-blue-100 text-blue-700' :
                            keyword.keywordType === 'secondary' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {keyword.keywordType === 'primary' ? 'Primary' :
                             keyword.keywordType === 'secondary' ? 'Secondary' :
                             'Long-tail'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getOpportunityColor(keyword.opportunityLevel)}`}>
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
                        <button
                          onClick={() => addToQueue(keyword.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm ${
                            keyword.queued
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                              : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100'
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
                <div className="p-3 bg-slate-100 rounded-full">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No keywords found</h3>
              <p className="text-slate-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Complete the onboarding process to discover keywords'}
              </p>
            </div>
          )}

          {/* Add Keywords Modal */}
          {showAddKeywordsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Add Keywords</h3>
                  <button
                    onClick={closeAddKeywordsModal}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Profile Selection */}
                {profiles.length > 0 ? (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Project
                    </label>
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>
                          {profile.business_name || profile.website_url} {profile.industry ? `(${profile.industry})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-900">No Projects Found</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          You need to complete onboarding first to generate keywords.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seed Keywords */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Seed Keywords
                    </label>
                    <button
                      onClick={addSeedKeyword}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
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
                          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Tip: Use specific topics related to your industry for best results
                  </p>
                </div>

                {/* Advanced Options */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-left mb-4"
                  >
                    <h4 className="text-lg font-semibold text-slate-900">Advanced Options</h4>
                    <span className="text-slate-400 text-xl">{showAdvanced ? '−' : '+'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Min Search Volume
                          </label>
                          <input
                            type="number"
                            value={minSearchVolume}
                            onChange={(e) => setMinSearchVolume(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeQuestions}
                            onChange={(e) => setIncludeQuestions(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                          />
                          <span className="text-sm text-slate-700">Include question-based keywords</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeRelated}
                            onChange={(e) => setIncludeRelated(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                          />
                          <span className="text-sm text-slate-700">Include related keywords</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {generateError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-900">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{generateError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {generateSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-green-900">Success!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          {generateSuccess.message || `Successfully generated ${generateSuccess.keywords?.total || 0} keywords`}
                        </p>
                        {generateSuccess.keywords && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-white rounded p-2 text-center">
                              <div className="text-lg font-bold text-indigo-600">{generateSuccess.keywords.saved || 0}</div>
                              <div className="text-xs text-slate-600">Saved</div>
                            </div>
                            <div className="bg-white rounded p-2 text-center">
                              <div className="text-lg font-bold text-purple-600">{generateSuccess.keywords.byType?.primary || 0}</div>
                              <div className="text-xs text-slate-600">Primary</div>
                            </div>
                            <div className="bg-white rounded p-2 text-center">
                              <div className="text-lg font-bold text-orange-600">{generateSuccess.keywords.byType?.longTail || 0}</div>
                              <div className="text-xs text-slate-600">Long-tail</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={closeAddKeywordsModal}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateKeywords}
                    disabled={isGenerating || seedKeywords.filter(k => k.trim()).length === 0 || !selectedProfileId}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        Generate Keywords
                      </>
                    )}
                  </button>
                </div>
              </div>
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

      <OutOfCreditsDialog
        open={showOutOfCreditsDialog}
        onOpenChange={setShowOutOfCreditsDialog}
        requiredCredits={requiredCreditsForDialog}
      />
  );
}
