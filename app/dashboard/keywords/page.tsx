'use client';

import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
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
  const [autoSchedulingKeywordId, setAutoSchedulingKeywordId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 4500);
  };

  const dismissNotification = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(null);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Add Keywords Modal State
  const [showAddKeywordsModal, setShowAddKeywordsModal] = useState(false);
  const [showQuickAddWebsiteModal, setShowQuickAddWebsiteModal] = useState(false);
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [profiles, setProfiles] = useState<Array<{ id: string; business_name?: string; website_url: string; industry?: string }>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [filterProfileId, setFilterProfileId] = useState<string | null>(null); // For filtering displayed keywords
  const [loadingProfiles, setLoadingProfiles] = useState(true);
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

  // Quick Add Website Modal State
  const [quickAddStep, setQuickAddStep] = useState(0); // 0: Website, 1: Business Info, 2: Target Audience, 3: Analysis
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [quickAddAnalysisProgress, setQuickAddAnalysisProgress] = useState({
    competitor_analysis: false,
    site_analysis: false,
    google_trends: false,
    serp_analysis: false,
    keyword_scoring: false
  });
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);

  // Manual Add Modal State
  const [manualKeywords, setManualKeywords] = useState('');
  const [selectedProfileForManual, setSelectedProfileForManual] = useState<string>('');
  const [enrichWithDataForSEO, setEnrichWithDataForSEO] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [showOutOfCreditsDialog, setShowOutOfCreditsDialog] = useState(false);
  const [requiredCreditsForDialog, setRequiredCreditsForDialog] = useState(REQUIRED_CREDITS_FOR_KEYWORD_GENERATION);

  // Load profiles on page load
  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (onboardingId) {
      loadKeywords(onboardingId);
      setSelectedProfileId(onboardingId);
      setFilterProfileId(onboardingId);
    } else {
      loadAllOnboardingKeywords();
      setFilterProfileId(null); // Show all keywords
    }
  }, [onboardingId]);

  // Reload keywords when filter changes
  useEffect(() => {
    if (filterProfileId) {
      loadKeywords(filterProfileId);
    } else {
      loadAllOnboardingKeywords();
    }
  }, [filterProfileId]);

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

  const formatScheduledDateTime = (date?: string, time?: string) => {
    if (!date) return 'the next available slot';
    const scheduleTime = time || '09:00:00';
    const scheduledAt = new Date(`${date}T${scheduleTime}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      return `${date} ${scheduleTime}`;
    }
    return scheduledAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const autoScheduleKeyword = async (keywordId: string) => {
    setAutoSchedulingKeywordId(keywordId);

    try {
      const response = await fetch('/api/calendar/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_id: keywordId,
          auto_schedule: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to schedule keyword');
      }

      setKeywords(prev => {
        const updated = prev.map(k => 
          k.id === keywordId ? { ...k, queued: true } : k
        );
        calculateStats(updated);
        return updated;
      });

      showNotification(`Keyword scheduled for ${formatScheduledDateTime(data.scheduled_date, data.scheduled_time)}.`, 'success');
    } catch (error) {
      console.error('Error auto-scheduling keyword:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to schedule keyword', 'error');
    } finally {
      setAutoSchedulingKeywordId(null);
    }
  };

  const addToQueue = async (keywordId: string) => {
    const keyword = keywords.find(k => k.id === keywordId);
    
    if (keyword?.queued) {
      setSelectedKeywordId(keywordId);
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
    } else if (keyword) {
      await autoScheduleKeyword(keywordId);
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
        
        showNotification(`Keyword ${isEditingSchedule ? 'rescheduled' : 'scheduled'} successfully! It will be generated on ${scheduledAt.toLocaleString()}.`, 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to schedule keyword', 'error');
      }
    } catch (error) {
      console.error('Error scheduling keyword:', error);
      showNotification('Failed to schedule keyword', 'error');
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

  // Load profiles for keyword generation and filtering
  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('user_onboarding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedProfiles = (data || []) as Array<{ id: string; business_name?: string; website_url: string; industry?: string }>;
      setProfiles(typedProfiles);
      
      // If we have an onboardingId in URL, use it; otherwise use first profile
      if (onboardingId && typedProfiles.some(p => p.id === onboardingId)) {
        setSelectedProfileId(onboardingId);
        setFilterProfileId(onboardingId);
      } else if (typedProfiles.length > 0) {
        setSelectedProfileId(typedProfiles[0].id);
        // Don't auto-set filter - let user choose "All Websites" by default
      }
    } catch (err: any) {
      console.error('Error loading profiles:', err);
      setGenerateError(err.message);
    } finally {
      setLoadingProfiles(false);
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

  // Quick Add Website handlers
  const handleQuickAddWebsiteNext = () => {
    // Validate current step
    if (quickAddStep === 0) {
      if (!websiteUrl.trim()) {
        setGenerateError('Please enter a website URL');
        return;
      }
      setGenerateError(null);
      setQuickAddStep(1);
    } else if (quickAddStep === 1) {
      if (!businessName.trim()) {
        setGenerateError('Please enter a business name');
        return;
      }
      if (!industry.trim()) {
        setGenerateError('Please select an industry');
        return;
      }
      setGenerateError(null);
      setQuickAddStep(2);
    } else if (quickAddStep === 2) {
      if (!targetAudience.trim()) {
        setGenerateError('Please describe your target audience');
        return;
      }
      setGenerateError(null);
      setQuickAddStep(3);
      handleQuickAddWebsiteAnalysis();
    }
  };

  const handleQuickAddWebsiteBack = () => {
    if (quickAddStep > 0) {
      setQuickAddStep(quickAddStep - 1);
      setGenerateError(null);
    }
  };

  const handleQuickAddWebsiteAnalysis = async () => {
    setIsAnalyzingWebsite(true);
    setGenerateError(null);
    setGenerateSuccess(null);
    setQuickAddAnalysisProgress({
      competitor_analysis: false,
      site_analysis: false,
      google_trends: false,
      serp_analysis: false,
      keyword_scoring: false
    });

    // Check credits
    const creditResult = await checkCredits(REQUIRED_CREDITS_FOR_KEYWORD_GENERATION);
    if (!creditResult || creditResult.error || !creditResult.hasEnoughCredits) {
      setRequiredCreditsForDialog(REQUIRED_CREDITS_FOR_KEYWORD_GENERATION);
      setShowOutOfCreditsDialog(true);
      setIsAnalyzingWebsite(false);
      return;
    }

    try {
      // Use the onboarding API endpoint for comprehensive analysis
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          businessName: businessName.trim(),
          industry: industry.trim(),
          targetAudience: targetAudience.trim(),
          businessDescription: businessDescription.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to analyze website';
        throw new Error(errorMessage);
      }

      // Simulate progress updates
      const progressSteps = [
        'competitor_analysis',
        'site_analysis', 
        'google_trends',
        'serp_analysis',
        'keyword_scoring'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between steps
        setQuickAddAnalysisProgress(prev => ({
          ...prev,
          [progressSteps[i]]: true
        }));
      }

      setGenerateSuccess({
        keywordsGenerated: data.analysisResults?.totalKeywords || 0,
        profileId: data.onboardingProfileId
      });
      
      // Reload keywords
      if (onboardingId) {
        await loadKeywords(onboardingId);
      } else {
        await loadAllOnboardingKeywords();
        await loadProfiles(); // Refresh profiles list
      }

      // Close modal after 3 seconds
      setTimeout(() => {
        closeQuickAddWebsiteModal();
        if (data.onboardingProfileId) {
          router.push(`/dashboard/keywords?onboarding=${data.onboardingProfileId}`);
        }
      }, 3000);

    } catch (err: any) {
      console.error('Error analyzing website:', err);
      setGenerateError(err.message);
      setIsAnalyzingWebsite(false);
    }
  };

  const closeQuickAddWebsiteModal = () => {
    setShowQuickAddWebsiteModal(false);
    setQuickAddStep(0);
    setWebsiteUrl('');
    setBusinessName('');
    setIndustry('');
    setBusinessDescription('');
    setTargetAudience('');
    setQuickAddAnalysisProgress({
      competitor_analysis: false,
      site_analysis: false,
      google_trends: false,
      serp_analysis: false,
      keyword_scoring: false
    });
    setGenerateError(null);
    setGenerateSuccess(null);
    setIsAnalyzingWebsite(false);
  };

  // Manual Add handlers
  const handleManualAdd = async () => {
    if (!selectedProfileForManual) {
      setGenerateError('Please select a project');
      return;
    }

    const keywordList = manualKeywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordList.length === 0) {
      setGenerateError('Please enter at least one keyword');
      return;
    }

    setIsAddingManual(true);
    setGenerateError(null);
    setGenerateSuccess(null);

    try {
      const response = await fetch('/api/keywords/manual-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileForManual,
          keywords: keywordList,
          enrichWithDataForSEO
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add keywords');
      }

      setGenerateSuccess(data);
      
      // Reload keywords
      if (onboardingId) {
        await loadKeywords(onboardingId);
      } else {
        await loadAllOnboardingKeywords();
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setManualKeywords('');
        setGenerateSuccess(null);
      }, 2000);

    } catch (err: any) {
      console.error('Error adding keywords:', err);
      setGenerateError(err.message);
    } finally {
      setIsAddingManual(false);
    }
  };

  const closeManualAddModal = () => {
    setShowManualAddModal(false);
    setManualKeywords('');
    setSelectedProfileForManual('');
    setEnrichWithDataForSEO(false);
    setGenerateError(null);
    setGenerateSuccess(null);
    setIsAddingManual(false);
  };

  // Load profiles for manual add
  useEffect(() => {
    if (showManualAddModal) {
      loadProfiles();
      if (profiles.length > 0 && !selectedProfileForManual) {
        setSelectedProfileForManual(profiles[0].id);
      }
    }
  }, [showManualAddModal]);

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
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pt-28 md:pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {filterProfileId ? 'Keywords' : 'All Keywords'}
            </h1>
            <p className="text-slate-600">
              {filterProfileId 
                ? 'Keywords discovered during your onboarding analysis with real metrics from DataForSEO.'
                : 'All keywords discovered across your onboarding analyses. Each keyword includes real search volume, CPC, and competition data from DataForSEO.'
              }
            </p>
          </div>

          {/* Website Filter */}
          {profiles.length > 0 && (
            <div className="mb-6 flex justify-center">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Filter by Website
                </label>
                <select
                  value={filterProfileId || ''}
                  onChange={(e) => {
                    const newProfileId = e.target.value || null;
                    setFilterProfileId(newProfileId);
                    // Update URL if needed
                    if (newProfileId) {
                      router.push(`/dashboard/keywords?onboarding=${newProfileId}`);
                    } else {
                      router.push('/dashboard/keywords');
                    }
                  }}
                  disabled={loadingProfiles}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 transition-colors min-w-[250px]"
                >
                  <option value="">All Websites</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.business_name || profile.website_url} {profile.industry ? `(${profile.industry})` : ''}
                    </option>
                  ))}
                </select>
                {filterProfileId && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Showing: {profiles.find(p => p.id === filterProfileId)?.business_name || profiles.find(p => p.id === filterProfileId)?.website_url || 'Selected Website'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAddKeywordsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Generate Keywords
                  </button>
                  <button 
                    onClick={() => setShowQuickAddWebsiteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Quick Add Website
                  </button>
                  <button 
                    onClick={() => setShowManualAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Manual Entry
                  </button>
                </div>
                
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
                          disabled={!keyword.queued && autoSchedulingKeywordId === keyword.id}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
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
                          ) : autoSchedulingKeywordId === keyword.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Scheduling...
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
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Add Keywords</h3>
                    <p className="text-sm text-slate-500">Generate new keywords using DataForSEO</p>
                  </div>
                  <button
                    onClick={closeAddKeywordsModal}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Selection */}
                {profiles.length > 0 ? (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Select Project
                    </label>
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 transition-colors"
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
                    <label className="block text-sm font-semibold text-slate-700">
                      Seed Keywords
                    </label>
                    <button
                      onClick={addSeedKeyword}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium text-sm rounded-lg transition-colors"
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
                          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 transition-colors"
                        />
                        {seedKeywords.length > 1 && (
                          <button
                            onClick={() => removeSeedKeyword(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove keyword"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Tip: Use specific topics related to your industry for best results</span>
                  </p>
                </div>

                {/* Advanced Options */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-left mb-4 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <h4 className="text-base font-semibold text-slate-900">Advanced Options</h4>
                    <span className={`text-slate-400 text-xl transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>{showAdvanced ? '−' : '+'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 p-5 bg-slate-50 rounded-lg border border-slate-200">
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
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={closeAddKeywordsModal}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateKeywords}
                    disabled={isGenerating || seedKeywords.filter(k => k.trim()).length === 0 || !selectedProfileId}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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

     {notification && (
       <div
         className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur bg-white/95 flex items-start gap-3 ${
           notification.type === 'success'
             ? 'border-emerald-200'
             : 'border-red-200'
         }`}
       >
         {notification.type === 'success' ? (
           <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
         ) : (
           <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
         )}
         <div className="flex-1 text-sm text-slate-800">{notification.message}</div>
         <button
           onClick={dismissNotification}
           className="text-slate-400 hover:text-slate-600 transition-colors font-semibold"
           aria-label="Dismiss notification"
         >
           X
         </button>
       </div>
          )}

          {/* Quick Add Website Modal - Multi-step like onboarding */}
          {showQuickAddWebsiteModal && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-8 my-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Quick Add Website</h3>
                    <p className="text-sm text-slate-500">
                      {quickAddStep === 0 && 'Enter your website URL'}
                      {quickAddStep === 1 && 'Business Information'}
                      {quickAddStep === 2 && 'Target Audience'}
                      {quickAddStep === 3 && 'Comprehensive Analysis'}
                    </p>
                  </div>
                  <button
                    onClick={closeQuickAddWebsiteModal}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8">
                  {[0, 1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        quickAddStep > step ? 'bg-emerald-600 text-white' :
                        quickAddStep === step ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {quickAddStep > step ? <CheckCircle className="h-5 w-5" /> : step + 1}
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-2 ${
                          quickAddStep > step ? 'bg-emerald-600' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  {/* Step 0: Website URL */}
                  {quickAddStep === 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Website URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
                      />
                    </div>
                  )}

                  {/* Step 1: Business Information */}
                  {quickAddStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Business Information</h4>
                        <p className="text-sm text-slate-600 mb-4">Help us understand your business better</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Your Company Name"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Industry <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                        >
                          <option value="">Select your industry</option>
                          <option value="technology">Technology</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="finance">Finance</option>
                          <option value="education">Education</option>
                          <option value="retail">Retail & E-commerce</option>
                          <option value="real-estate">Real Estate</option>
                          <option value="legal">Legal Services</option>
                          <option value="consulting">Consulting</option>
                          <option value="marketing">Marketing & Advertising</option>
                          <option value="food-beverage">Food & Beverage</option>
                          <option value="travel">Travel & Hospitality</option>
                          <option value="fitness">Fitness & Wellness</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Business Description (Optional)
                        </label>
                        <textarea
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          placeholder="Briefly describe what your business does..."
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Target Audience */}
                  {quickAddStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Target Audience</h4>
                        <p className="text-sm text-slate-600 mb-4">Define who your ideal customers are</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Target Audience <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Describe your ideal customers (e.g., small business owners, marketing professionals, tech-savvy millennials...)"
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400 resize-none"
                        />
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-900">Keyword Discovery Process:</h4>
                            <ul className="mt-2 text-sm text-slate-700 space-y-1">
                              <li>• <strong>Competitor Analysis:</strong> Find keywords your competitors rank for</li>
                              <li>• <strong>Site Analysis:</strong> Identify your current keyword performance</li>
                              <li>• <strong>Google Trends:</strong> Discover trending and seasonal opportunities</li>
                              <li>• <strong>SERP Analysis:</strong> Find content gaps and ranking opportunities</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Analysis Progress */}
                  {quickAddStep === 3 && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex justify-center mb-4">
                          <div className="p-4 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full">
                            <Search className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          {isAnalyzingWebsite ? 'Analyzing Your Market...' : 'Ready to Analyze'}
                        </h3>
                        <p className="text-slate-600">
                          {isAnalyzingWebsite 
                            ? 'This may take a few minutes. We\'re scanning competitors, analyzing your site, checking Google trends, and examining SERP data.'
                            : 'Click "Start Analysis" to begin the comprehensive keyword discovery process.'
                          }
                        </p>
                      </div>

                      {isAnalyzingWebsite && (
                        <div className="space-y-4">
                          {Object.entries(quickAddAnalysisProgress).map(([key, completed]) => (
                            <div key={key} className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                completed ? 'bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100' : 'bg-slate-100'
                              }`}>
                                {completed ? (
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-slate-900 capitalize">
                                  {key.replace('_', ' ')}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {completed ? 'Completed' : 'In progress...'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {generateSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Analysis Complete!</p>
                              <p className="text-sm text-green-700 mt-1">
                                Generated {generateSuccess.keywordsGenerated} keywords. Redirecting to keywords page...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {generateError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{generateError}</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    {quickAddStep > 0 && quickAddStep < 3 && (
                      <button
                        onClick={handleQuickAddWebsiteBack}
                        className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                      >
                        Previous
                      </button>
                    )}
                    <button
                      onClick={closeQuickAddWebsiteModal}
                      className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                    >
                      Cancel
                    </button>
                    {quickAddStep < 3 && (
                      <button
                        onClick={handleQuickAddWebsiteNext}
                        disabled={isAnalyzingWebsite}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        {quickAddStep === 2 ? (
                          <>
                            <Search className="h-4 w-4" />
                            Start Analysis
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Keyword Entry Modal */}
          {showManualAddModal && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-8 my-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Manual Keyword Entry</h3>
                    <p className="text-sm text-slate-500">Add keywords you're already targeting</p>
                  </div>
                  <button
                    onClick={closeManualAddModal}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {profiles.length > 0 ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Project <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedProfileForManual}
                        onChange={(e) => setSelectedProfileForManual(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900"
                      >
                        {profiles.map(profile => (
                          <option key={profile.id} value={profile.id}>
                            {profile.business_name || profile.website_url} {profile.industry ? `(${profile.industry})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                          No projects found. Please add a website first.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Keywords <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Enter one keyword per line</p>
                    <textarea
                      value={manualKeywords}
                      onChange={(e) => setManualKeywords(e.target.value)}
                      placeholder="personal injury lawyer&#10;car accident attorney&#10;workers compensation lawyer"
                      rows={8}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-900 placeholder-slate-400 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      {manualKeywords.split('\n').filter(k => k.trim()).length} keyword(s) entered
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enrichWithDataForSEO}
                        onChange={(e) => setEnrichWithDataForSEO(e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700">Enrich with DataForSEO metrics</span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Fetch search volume, difficulty, and CPC for each keyword (uses DataForSEO API)
                        </p>
                      </div>
                    </label>
                  </div>

                  {generateError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{generateError}</p>
                      </div>
                    </div>
                  )}

                  {generateSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Success!</p>
                          <p className="text-sm text-green-700 mt-1">
                            Added {generateSuccess.added} keyword(s) to your project.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={closeManualAddModal}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualAdd}
                      disabled={isAddingManual || !selectedProfileForManual || !manualKeywords.trim()}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      {isAddingManual ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Keywords
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* Guide Link */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Need Help Linking Websites and WordPress Sites?</h2>
            <p className="text-slate-700 mb-4">
              Learn how to properly connect your websites to WordPress sites for automatic content separation and publishing.
            </p>
            <Link 
              href="/dashboard/guide"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              View Complete Guide
            </Link>
          </div>
        </div>
      </div>

      <OutOfCreditsDialog
        open={showOutOfCreditsDialog}
        onOpenChange={setShowOutOfCreditsDialog}
        requiredCredits={requiredCreditsForDialog}
      />
    </>
  );
}