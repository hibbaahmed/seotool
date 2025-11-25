'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Eye, Clock, Globe, FileText, BarChart3, Target, Star } from 'lucide-react';
import BlogCalendar from '@/components/BlogCalendar';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useCredits } from '@/app/context/CreditsContext';
import OutOfCreditsDialog from '@/components/OutOfCreditsDialog';
import { checkCredits } from '@/app/utils/creditCheck';

interface KeywordStats {
  totalKeywords: number;
  recommended: number;
  starred: number;
  queued: number;
  generated: number;
}

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'published' | 'cancelled';
  platform: string;
  publish_url?: string;
  notes?: string;
  image_urls?: string[];
}

interface ScheduledKeyword {
  id: string;
  keyword: string;
  scheduled_date: string;
  scheduled_time?: string;
  generation_status: 'pending' | 'generating' | 'generated' | 'failed';
  search_volume: number;
  difficulty_score: number;
  opportunity_level: 'low' | 'medium' | 'high';
  generated_content_id?: string;
  content_writer_outputs?: {
    id: string;
    topic: string;
    content_output: string;
  };
  publishing_info?: {
    siteName?: string;
    siteUrl?: string;
    publishUrl?: string;
  };
}

export default function CalendarPage() {
  const { checkUserCredits, deductCredits, refreshCredits } = useCredits();
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<ScheduledKeyword | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingKeywordId, setGeneratingKeywordId] = useState<string | null>(null); // Track which keyword is generating
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [availableKeywords, setAvailableKeywords] = useState<Array<{ id: string; keyword: string; search_volume?: number; difficulty_score?: number; opportunity_level?: 'low'|'medium'|'high'; starred?: boolean; scheduled_for_generation?: boolean; generation_status?: 'pending'|'generating'|'generated'|'failed'; onboarding_profile_id?: string }>>([]);
  const [modalFilter, setModalFilter] = useState<'all'|'recommended'|'starred'>('all');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeHour, setTimeHour] = useState<string>('09');
  const [timeMinute, setTimeMinute] = useState<string>('00');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [distributeEnabled, setDistributeEnabled] = useState(false);
  const [distributeDays, setDistributeDays] = useState<number>(7);
  const [itemsPerDay, setItemsPerDay] = useState<number>(1);
  const [overrideStartDate, setOverrideStartDate] = useState<string | null>(null);
  const [keywordStats, setKeywordStats] = useState<KeywordStats>({
    totalKeywords: 0,
    recommended: 0,
    starred: 0,
    queued: 0,
    generated: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showOutOfCreditsDialog, setShowOutOfCreditsDialog] = useState(false);
  const [requiredCreditsForDialog, setRequiredCreditsForDialog] = useState(1);

  // Website/Project filtering
  const [websites, setWebsites] = useState<Array<{ id: string; business_name?: string; website_url: string; industry?: string }>>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('all'); // 'all' or specific profile ID
  const [websiteMap, setWebsiteMap] = useState<Map<string, { name: string; url: string }>>(new Map());

  // Debug: Track dialog state changes
  useEffect(() => {
    console.log('📊 Calendar - Dialog state changed:', showOutOfCreditsDialog, 'requiredCredits:', requiredCreditsForDialog);
  }, [showOutOfCreditsDialog, requiredCreditsForDialog]);

  const to24Hour = (h12: string, period: 'AM' | 'PM') => {
    let h = parseInt(h12, 10) % 12;
    if (period === 'PM') h += 12;
    return String(h).padStart(2, '0');
  };

  // Load websites/profiles
  useEffect(() => {
    const loadWebsites = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data, error } = await supabase
          .from('user_onboarding_profiles')
          .select('id, business_name, website_url, industry')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const profiles = (data || []) as Array<{
          id: string;
          business_name?: string | null;
          website_url: string;
        }>;

        setWebsites(profiles);
        
        // Create map for quick lookups
        const map = new Map<string, { name: string; url: string }>();
        profiles.forEach(profile => {
          map.set(profile.id, {
            name: profile.business_name || profile.website_url,
            url: profile.website_url
          });
        });
        setWebsiteMap(map);
      } catch (err) {
        console.error('Error loading websites:', err);
      }
    };

    loadWebsites();
  }, []);

  // Load keyword stats (filtered by website if selected)
  useEffect(() => {
    const loadKeywordStats = async () => {
      try {
        setLoadingStats(true);
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setKeywordStats({
            totalKeywords: 0,
            recommended: 0,
            starred: 0,
            queued: 0,
            generated: 0
          });
          return;
        }

        let query = supabase
          .from('discovered_keywords')
          .select('opportunity_level, starred, scheduled_for_generation, generation_status')
          .eq('user_id', user.id);

        // Filter by website if one is selected
        if (selectedWebsiteId !== 'all') {
          query = query.eq('onboarding_profile_id', selectedWebsiteId);
        }

        const { data: keywords, error } = await query;

        if (error) {
          console.error('Error loading keyword stats:', error);
          return;
        }

        if (keywords && Array.isArray(keywords)) {
          const stats: KeywordStats = {
            totalKeywords: keywords.length,
            recommended: keywords.filter((k: any) => k.opportunity_level === 'high').length,
            starred: keywords.filter((k: any) => k.starred).length,
            queued: keywords.filter((k: any) => k.scheduled_for_generation).length,
            generated: keywords.filter((k: any) => k.generation_status === 'generated').length
          };
          setKeywordStats(stats);
        }
      } catch (error) {
        console.error('Error loading keyword stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadKeywordStats();
  }, [selectedWebsiteId]);

  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [publicationInfo, setPublicationInfo] = useState<{
    siteName?: string;
    siteUrl?: string;
    publishUrl?: string;
    platform?: string;
  } | null>(null);

  const handlePostClick = (post: ScheduledPost) => {
    // Only show details if not published (published posts open directly in calendar)
    if (post.status !== 'published' || !post.publish_url) {
      setSelectedPost(post);
      setSelectedKeyword(null);
    }
  };

  const handleKeywordClick = (keyword: ScheduledKeyword) => {
    // Only show details if not published (published keywords open directly in calendar)
    if (keyword.generation_status !== 'generated' || !(keyword as any).publishing_info?.publishUrl) {
      setSelectedKeyword(keyword);
      setSelectedPost(null);
    }
  };

  const handleAddPost = (date: string) => {
    setSelectedDate(date);
    (async () => {
      try {
        setIsLoadingKeywords(true);
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAvailableKeywords([]);
        } else {
          let query = supabase
            .from('discovered_keywords')
            .select('id, keyword, scheduled_for_generation, generation_status, search_volume, difficulty_score, opportunity_level, starred, onboarding_profile_id')
            .eq('user_id', user.id)
            .eq('scheduled_for_generation', false) // Only unscheduled keywords
            .order('created_at', { ascending: false });

          // Filter by website if one is selected
          if (selectedWebsiteId !== 'all') {
            query = query.eq('onboarding_profile_id', selectedWebsiteId);
          }

          const { data } = await query;
          const allKeywords = (data || []);
          setAvailableKeywords(allKeywords.map((k: any) => ({ 
            id: k.id, 
            keyword: k.keyword,
            search_volume: k.search_volume,
            difficulty_score: k.difficulty_score,
            opportunity_level: k.opportunity_level,
            starred: !!k.starred,
            scheduled_for_generation: !!k.scheduled_for_generation,
            generation_status: k.generation_status,
            onboarding_profile_id: k.onboarding_profile_id
          })));
          setSelectedIds([]);
        }
      } catch (e) {
        console.error('Failed to load keywords', e);
        setAvailableKeywords([]);
      } finally {
        setIsLoadingKeywords(false);
        setShowAddModal(true);
      }
    })();
  };

  const handleGenerateNow = async (keyword?: ScheduledKeyword, isTest = false) => {
    const keywordToGenerate = keyword || selectedKeyword;
    if (!keywordToGenerate) {
      console.warn('No keyword selected for generation');
      return;
    }

    console.log('🚀 Starting generation for keyword:', keywordToGenerate.keyword);

    // Both test and full generation require 1 credit
    const requiredCredits = 1;
    
    // Check credits directly - simple and straightforward
    console.log('🔍 Checking credits before generation...');
    const creditResult = await checkCredits(requiredCredits);
    console.log('🔍 Credit check result:', creditResult);
    
    // Defensive check - ensure we have a valid result
    if (!creditResult || creditResult.error) {
      console.error('❌ Error checking credits:', creditResult?.error);
      setRequiredCreditsForDialog(requiredCredits);
      setShowOutOfCreditsDialog(true);
      return;
    }
    
    // Check if user has enough credits
    if (!creditResult.hasEnoughCredits) {
      console.warn('❌ BLOCKED: User has', creditResult.credits, 'credits, needs', requiredCredits);
      setRequiredCreditsForDialog(requiredCredits);
      setShowOutOfCreditsDialog(true);
      setIsGenerating(false);
      setGeneratingKeywordId(null);
      console.log('✅ Dialog state set to true, returning early - API call will NOT happen');
      return; // STOP - do not proceed - this return MUST prevent API call
    }
    
    console.log('✅ Credits OK:', creditResult.credits, '>=', requiredCredits);
    console.log('✅ Proceeding with API call...');

    setIsGenerating(true);
    setGeneratingKeywordId(keywordToGenerate.id); // Track which keyword is generating
    try {
      console.log('📡 Making API call to /api/calendar/generate...');
      const response = await fetch('/api/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_id: keywordToGenerate.id,
          keyword: keywordToGenerate.keyword,
          is_test: isTest, // Pass test mode flag
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Credits are deducted server-side, refresh the credits context
        await refreshCredits();

        alert(isTest 
          ? 'Test content generated successfully! Redirecting to view your content...' 
          : 'Content generated successfully! Redirecting to view your content...');
        // Redirect to the generated content
        if (result.content_id) {
          window.location.href = `/dashboard/saved-content?id=${result.content_id}`;
        } else {
          window.location.reload();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate content' }));
        alert(errorData.error || 'Failed to generate content');
        
        // If it's a credit error, refresh credits to update UI
        if (response.status === 402) {
          await refreshCredits();
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content');
    } finally {
      setIsGenerating(false);
      setGeneratingKeywordId(null); // Clear generating state
    }
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    
    if (confirm('Are you sure you want to delete this scheduled post?')) {
      try {
        const response = await fetch(`/api/calendar/posts/${selectedPost.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setSelectedPost(null);
          // Refresh calendar
          window.location.reload();
        } else {
          alert('Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
      }
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date as local time to avoid timezone issues
    // dateString is in format YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Website Selector */}
          {websites.length > 0 && (
            <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Filter by Website:
                </label>
                <select
                  value={selectedWebsiteId}
                  onChange={(e) => setSelectedWebsiteId(e.target.value)}
                  className="flex-1 max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                >
                  <option value="all">All Websites</option>
                  {websites.map(website => (
                    <option key={website.id} value={website.id}>
                      {website.business_name || website.website_url} {website.industry ? `(${website.industry})` : ''}
                    </option>
                  ))}
                </select>
                {selectedWebsiteId !== 'all' && websiteMap.has(selectedWebsiteId) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {websiteMap.get(selectedWebsiteId)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Content Calendar
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Plan, schedule, and manage your blog posts. Hover over keywords to generate content instantly!
            </p>
          </div>

          {/* Keyword Stats Cards */}
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* All Keywords */}
              <div className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 ring-1 ring-inset ring-indigo-200">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? '...' : keywordStats.totalKeywords}
                    </div>
                    <div className="text-sm text-slate-600">All Keywords</div>
                  </div>
                </div>
              </div>

              {/* Recommended */}
              <div className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 ring-1 ring-inset ring-emerald-200">
                    <Target className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? '...' : keywordStats.recommended}
                    </div>
                    <div className="text-sm text-slate-600">Recommended</div>
                  </div>
                </div>
              </div>

              {/* Starred */}
              <div className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-inset ring-amber-200">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? '...' : keywordStats.starred}
                    </div>
                    <div className="text-sm text-slate-600">Starred</div>
                  </div>
                </div>
              </div>

              {/* Queued */}
              <div className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 ring-1 ring-inset ring-violet-200">
                    <Clock className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? '...' : keywordStats.queued}
                    </div>
                    <div className="text-sm text-slate-600">Queued</div>
                  </div>
                </div>
              </div>

              {/* Generated */}
              <div className="text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-inset ring-sky-200">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? '...' : keywordStats.generated}
                    </div>
                    <div className="text-sm text-slate-600">Generated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Calendar - full width */}
            <div className="col-span-1">
              <BlogCalendar 
                onPostClick={handlePostClick}
                onAddPost={handleAddPost}
                onKeywordClick={handleKeywordClick}
                onGenerateKeyword={handleGenerateNow}
                generatingKeywordId={generatingKeywordId}
                selectedWebsiteId={selectedWebsiteId}
                websiteMap={websiteMap}
              />
            </div>

            {/* Publication Info Modal */}
            {showPublicationModal && publicationInfo && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPublicationModal(false)}>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Publication Info</h3>
                    <button
                      onClick={() => setShowPublicationModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedPost && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Article Title
                        </label>
                        <p className="text-slate-900 font-medium">{selectedPost.title}</p>
                      </div>
                    )}

                    {selectedKeyword && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Keyword
                        </label>
                        <p className="text-slate-900 font-medium">{selectedKeyword.keyword}</p>
                      </div>
                    )}

                    {publicationInfo.siteName && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Published On
                        </label>
                        <div className="flex items-center gap-2 text-slate-900">
                          <Globe className="h-4 w-4" />
                          <span className="font-medium">{publicationInfo.siteName}</span>
                        </div>
                        {publicationInfo.siteUrl && (
                          <p className="text-sm text-slate-600 mt-1">{publicationInfo.siteUrl}</p>
                        )}
                      </div>
                    )}

                    {publicationInfo.platform && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Platform
                        </label>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {publicationInfo.platform}
                        </span>
                      </div>
                    )}

                    {publicationInfo.publishUrl && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Published URL
                        </label>
                        <a
                          href={publicationInfo.publishUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm underline flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Article on WordPress
                        </a>
                      </div>
                    )}

                    {!publicationInfo.publishUrl && !publicationInfo.siteName && (
                      <div className="text-center py-4">
                        <p className="text-slate-600">Publication information not available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Post/Keyword Details Sidebar - removed to enlarge calendar */}
            <div className="hidden">
              {selectedKeyword ? (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Keyword Details</h3>
                    <button
                      onClick={() => setSelectedKeyword(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Keyword */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Keyword
                      </label>
                      <p className="text-lg font-bold text-slate-900">{selectedKeyword.keyword}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedKeyword.generation_status === 'generated' 
                          ? 'bg-green-100 text-green-800'
                          : selectedKeyword.generation_status === 'generating'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedKeyword.generation_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {selectedKeyword.generation_status.toUpperCase()}
                      </span>
                    </div>

                    {/* Scheduled Date */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Scheduled For
                      </label>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedKeyword.scheduled_date)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedKeyword.scheduled_time
                          ? `Will auto-generate at ${new Date(`2000-01-01T${selectedKeyword.scheduled_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                          : 'Will auto-generate at 6:00 AM'}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600">Search Volume</div>
                        <div className="text-lg font-bold text-slate-900">{selectedKeyword.search_volume.toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600">Difficulty</div>
                        <div className="text-lg font-bold text-slate-900">{selectedKeyword.difficulty_score}</div>
                      </div>
                    </div>

                    {/* Opportunity Level */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Opportunity
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedKeyword.opportunity_level === 'high'
                          ? 'bg-green-100 text-green-800'
                          : selectedKeyword.opportunity_level === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedKeyword.opportunity_level.toUpperCase()}
                      </span>
                    </div>

                    {/* Generated Content Link */}
                    {selectedKeyword.generation_status === 'generated' && selectedKeyword.generated_content_id && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Generated Content
                        </label>
                        <a
                          href={`/dashboard/saved-content?id=${selectedKeyword.generated_content_id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm underline flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Generated Article
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      {(selectedKeyword.generation_status === 'pending' || selectedKeyword.generation_status === 'generated' || selectedKeyword.generation_status === 'failed') && (
                        <>
                          {/* Test Generate Button */}
                          <button
                            onClick={() => handleGenerateNow(undefined, true)}
                            disabled={isGenerating}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            title="Generate a short test blog post (200-300 words) - 1 credit required"
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating Test...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4" />
                                Test Generate (200-300 words)
                              </>
                            )}
                          </button>
                          
                          {/* Full Generate Button */}
                          <button
                            onClick={() => handleGenerateNow()}
                            disabled={isGenerating}
                            className={`w-full ${
                              selectedKeyword.generation_status === 'generated' 
                                ? 'bg-orange-600 hover:bg-orange-700' 
                                : selectedKeyword.generation_status === 'failed'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4" />
                                {selectedKeyword.generation_status === 'generated' 
                                  ? 'Regenerate Content' 
                                  : selectedKeyword.generation_status === 'failed'
                                  ? 'Retry Generation'
                                  : 'Generate Full Blog Post'}
                            </>
                          )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedKeyword(null)}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedPost ? (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">Post Details</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditPost}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit post"
                      >
                        <Edit className="h-4 w-4 text-slate-600" />
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Title
                      </label>
                      <p className="text-slate-900 font-medium">{selectedPost.title}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedPost.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : selectedPost.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedPost.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Schedule */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Scheduled
                      </label>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedPost.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(selectedPost.scheduled_time)}</span>
                      </div>
                    </div>

                    {/* Platform */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Platform
                      </label>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Globe className="h-4 w-4" />
                        <span className="capitalize">{selectedPost.platform}</span>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Content Preview
                      </label>
                      <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-sm text-slate-700 line-clamp-4">
                          {selectedPost.content.substring(0, 200)}
                          {selectedPost.content.length > 200 && '...'}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedPost.notes && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Notes
                        </label>
                        <p className="text-slate-700 text-sm">{selectedPost.notes}</p>
                      </div>
                    )}

                    {/* Images */}
                    {selectedPost.image_urls && selectedPost.image_urls.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Images ({selectedPost.image_urls.length})
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedPost.image_urls.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-16 object-cover rounded-lg border border-slate-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/100x64?text=Image';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Publish URL */}
                    {selectedPost.publish_url && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Published URL
                        </label>
                        <a
                          href={selectedPost.publish_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm underline flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Published Post
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={() => setSelectedPost(null)}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Schedule New Post</span>
              </button>
              <button
                onClick={() => window.location.href = '/content-writer'}
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <FileText className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Create Content</span>
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/saved-content'}
                className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">View Saved Content</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Keywords Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-200/30 backdrop-blur-sm"
          onClick={() => { setShowAddModal(false); setSelectedIds([]); }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-y-scroll border border-blue-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Schedule Keywords</h3>
                <p className="text-slate-600 text-sm">{formatDate(selectedDate)}</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setSelectedIds([]); }} className="text-slate-500 hover:text-slate-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6 bg-white">
              {/* Time selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 bg-white border border-slate-200 rounded-lg p-2">
                    <select value={timeHour} onChange={(e)=>setTimeHour(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                      {Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(h=> <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={timeMinute} onChange={(e)=>setTimeMinute(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                      {Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=> <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={timePeriod} onChange={(e)=>setTimePeriod(e.target.value as 'AM'|'PM')} className="px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                  {/* Removed stagger option for simplicity */}
                </div>
              </div>

              {/* Distribution controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="distributeEnabled"
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={distributeEnabled}
                    onChange={(e)=> setDistributeEnabled(e.target.checked)}
                  />
                  <label htmlFor="distributeEnabled" className="text-sm text-slate-800 font-medium">Distribute across days</label>
                </div>
                {distributeEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        value={(overrideStartDate || selectedDate) || ''}
                        onChange={(e)=> setOverrideStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Length</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        value={distributeDays}
                        onChange={(e)=> setDistributeDays(parseInt(e.target.value, 10))}
                      >
                        <option value={7}>Next 7 days</option>
                        <option value={14}>Next 14 days</option>
                        <option value={30}>Next 30 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Items per day</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        value={itemsPerDay}
                        onChange={(e)=> setItemsPerDay(Math.max(1, parseInt(e.target.value || '1', 10)))}
                      />
                    </div>
                  </div>
                )}
                {distributeEnabled && (
                  <p className="mt-2 text-xs text-slate-500">Selected keywords will be queued starting from the start date, {itemsPerDay} per day.</p>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 -mt-2">
                {(['all','recommended','starred'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={()=>setModalFilter(tab)}
                    className={`px-3 py-1.5 text-sm rounded-full border ${modalFilter===tab ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {tab === 'all' ? 'All' : tab === 'recommended' ? 'Recommended' : 'Starred'}
                  </button>
                ))}
              </div>

              {/* Keywords list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Choose keywords to schedule</label>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{selectedIds.length} selected</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="selectAll"
                      type="checkbox"
                      className="h-4 w-4 accent-blue-600"
                      checked={availableKeywords.length>0 && selectedIds.length===availableKeywords.length}
                      onChange={(e)=>{
                        if (e.target.checked) setSelectedIds(availableKeywords.map(k=>k.id));
                        else setSelectedIds([]);
                      }}
                    />
                    <label htmlFor="selectAll" className="text-sm text-slate-700">Select all</label>
                  </div>
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Search keywords..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      value={keywordSearch}
                      onChange={(e)=> setKeywordSearch(e.target.value)}
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/></svg>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg max-h-80 overflow-y-scroll divide-y divide-slate-100">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_auto] items-center px-3 py-2 bg-slate-50 text-xs font-medium text-slate-600 sticky top-0 z-10 border-b border-slate-200">
                    <span>Keyword</span>
                    <span>Opportunity</span>
                  </div>
                  {isLoadingKeywords ? (
                    <div className="p-4 text-slate-500 text-sm">Loading keywords...</div>
                  ) : availableKeywords.length === 0 ? (
                    <div className="p-4 text-slate-500 text-sm">No unscheduled keywords available.</div>
                  ) : (
                    availableKeywords
                      .filter(k => modalFilter==='all' ? true : modalFilter==='recommended' ? k.opportunity_level === 'high' : !!k.starred)
                      .filter(k => k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()))
                      .map(k => (
                      <label key={k.id} className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-blue-600 focus-visible:outline-none"
                            checked={selectedIds.includes(k.id)}
                            disabled={k.scheduled_for_generation}
                            onChange={(e)=> setSelectedIds(prev => e.target.checked ? [...prev, k.id] : prev.filter(id=>id!==k.id))}
                          />
                          <div className="flex flex-col">
                            <span className="text-slate-900 text-sm font-medium">{k.keyword}</span>
                            <span className="text-xs text-slate-500">Volume: {k.search_volume?.toLocaleString?.() || 0} · Difficulty: {k.difficulty_score ?? 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {k.opportunity_level && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              k.opportunity_level === 'high' ? 'bg-green-50 text-green-700 border-green-200' :
                              k.opportunity_level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {k.opportunity_level.charAt(0).toUpperCase() + k.opportunity_level.slice(1)}
                            </span>
                          )}
                          {k.scheduled_for_generation && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>
                          )}
                          {k.generation_status==='generated' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Generated</span>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 sticky bottom-0 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Test Generate Button - only show if exactly one keyword is selected */}
                {selectedIds.length === 1 && (
                  <button
                    onClick={async () => {
                      try {
                        const selectedKeywordId = selectedIds[0];
                        const keyword = availableKeywords.find(k => k.id === selectedKeywordId);
                        if (!keyword) {
                          alert('Keyword not found');
                          return;
                        }

                        // Check credits directly - simple and straightforward
                        console.log('🔍 (Test) Checking credits before generation...');
                        const creditResult = await checkCredits(1);
                        console.log('🔍 (Test) Credit check result:', creditResult);
                        
                        if (!creditResult || creditResult.error) {
                          console.error('❌ (Test) Error checking credits:', creditResult?.error);
                          setRequiredCreditsForDialog(1);
                          setShowOutOfCreditsDialog(true);
                          setIsGenerating(false);
                          return;
                        }
                        
                        if (!creditResult.hasEnoughCredits) {
                          console.warn('❌ (Test) BLOCKED: User has', creditResult.credits, 'credits, needs 1');
                          setRequiredCreditsForDialog(1);
                          setShowOutOfCreditsDialog(true);
                          setIsGenerating(false);
                          console.log('✅ (Test) Dialog state set to true, returning early');
                          return; // STOP - do not proceed
                        }
                        
                        console.log('✅ (Test) Credits OK:', creditResult.credits, '>= 1');

                        setIsGenerating(true);
                        try {
                          const response = await fetch('/api/calendar/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              keyword_id: keyword.id,
                              keyword: keyword.keyword,
                              is_test: true, // Test generation
                            }),
                          });

                          if (response.ok) {
                            const result = await response.json();
                            
                            // Credits are deducted server-side, refresh the credits context
                            await refreshCredits();

                            alert('Test content generated successfully! Redirecting to view your content...');
                            // Redirect to the generated content
                            if (result.content_id) {
                              window.location.href = `/dashboard/saved-content?id=${result.content_id}`;
                            } else {
                              window.location.reload();
                            }
                          } else {
                            const errorData = await response.json().catch(() => ({ error: 'Failed to generate content' }));
                            alert(errorData.error || 'Failed to generate test content');
                            
                            // If it's a credit error, refresh credits to update UI
                            if (response.status === 402) {
                              await refreshCredits();
                            }
                          }
                        } catch (error) {
                          console.error('Error generating test content:', error);
                          alert('Failed to generate test content');
                        } finally {
                          setIsGenerating(false);
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to generate test content');
                      }
                    }}
                    disabled={isGenerating || selectedIds.length !== 1}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    title="Generate a short test blog post (200-300 words) - 1 credit required"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating Test...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Test Generate (200-300 words)
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowAddModal(false); setSelectedIds([]); }} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button
                  disabled={selectedIds.length===0}
                  onClick={async ()=>{
                    try {
                      // Check credits before scheduling
                      console.log('🔍 Checking credits before scheduling keywords...');
                      const creditResult = await checkCredits(1);
                      console.log('🔍 Credit check result:', creditResult);
                      
                      if (!creditResult || creditResult.error) {
                        console.error('❌ Error checking credits:', creditResult?.error);
                        setRequiredCreditsForDialog(1);
                        setShowOutOfCreditsDialog(true);
                        return;
                      }
                      
                      if (!creditResult.hasEnoughCredits) {
                        console.warn('❌ BLOCKED: User has', creditResult.credits, 'credits, needs 1 to schedule');
                        setRequiredCreditsForDialog(1);
                        setShowOutOfCreditsDialog(true);
                        return; // STOP - do not proceed with scheduling
                      }
                      
                      console.log('✅ Credits OK:', creditResult.credits, '>= 1, proceeding with scheduling');

                      const baseTime = `${to24Hour(timeHour, timePeriod)}:${timeMinute}:00`;
                      const addDays = (ymd: string, days: number) => {
                        const d = new Date(ymd);
                        d.setDate(d.getDate() + days);
                        return d.toISOString().slice(0,10);
                      };
                      const start = (overrideStartDate || selectedDate || new Date().toISOString().slice(0,10));

                      let successCount = 0;
                      let failedCount = 0;
                      const errors: string[] = [];

                      for (let i=0;i<selectedIds.length;i++){
                        const id = selectedIds[i];
                        const time = baseTime;
                        // Determine scheduled date
                        let scheduled_date = start;
                        if (distributeEnabled) {
                          const dayIndex = Math.floor(i / Math.max(1, itemsPerDay));
                          scheduled_date = addDays(start, dayIndex);
                        }

                        const requestBody = { keyword_id: id, scheduled_date, scheduled_time: time };
                        console.log(`📤 Scheduling keyword ${i+1}/${selectedIds.length}:`, requestBody);

                        const response = await fetch('/api/calendar/keywords', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(requestBody)
                        });

                        if (response.ok) {
                          successCount++;
                          console.log(`✅ Keyword ${i+1} scheduled successfully`);
                        } else {
                          failedCount++;
                          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                          console.error(`❌ Keyword ${i+1} failed (${response.status}):`, errorData);
                          
                          // If it's a credit error, show the dialog
                          if (response.status === 402) {
                            setRequiredCreditsForDialog(1);
                            setShowOutOfCreditsDialog(true);
                            await refreshCredits();
                          }
                          
                          errors.push(`Keyword ${id}: ${errorData.error || response.statusText}`);
                        }
                      }

                      console.log(`✅ Scheduled ${successCount} keywords successfully`);
                      if (failedCount > 0) {
                        console.error(`❌ Failed to schedule ${failedCount} keywords:`, errors);
                        // Show error details in alert for easier debugging
                        const errorSummary = errors.slice(0, 3).join('\n'); // Show first 3 errors
                        const moreText = errors.length > 3 ? `\n\n...and ${errors.length - 3} more errors` : '';
                        alert(`Scheduled ${successCount} keywords successfully, but ${failedCount} failed:\n\n${errorSummary}${moreText}\n\nDO NOT CLOSE THIS - Check Network tab now!`);
                        // Don't reload on error so user can inspect Network tab
                      } else {
                        // Only reload if all succeeded
                        setShowAddModal(false);
                        setSelectedIds([]);
                        window.location.reload();
                      }
                    } catch (e) {
                      console.error('Failed to schedule keywords:', e);
                      alert(`Failed to schedule keywords: ${e instanceof Error ? e.message : 'Unknown error'}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >Schedule {selectedIds.length>0?`(${selectedIds.length})`:''}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Out of Credits Dialog */}
      <OutOfCreditsDialog 
        open={showOutOfCreditsDialog}
        onOpenChange={setShowOutOfCreditsDialog}
        requiredCredits={requiredCreditsForDialog}
      />
    </div>
  );
}



