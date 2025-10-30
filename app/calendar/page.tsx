'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Eye, Clock, Globe, FileText } from 'lucide-react';
import BlogCalendar from '@/components/BlogCalendar';
import { supabaseBrowser } from '@/lib/supabase/browser';

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
}

export default function CalendarPage() {
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<ScheduledKeyword | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [availableKeywords, setAvailableKeywords] = useState<Array<{ id: string; keyword: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeHour, setTimeHour] = useState<string>('09');
  const [timeMinute, setTimeMinute] = useState<string>('00');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [stagger, setStagger] = useState<boolean>(false);

  const to24Hour = (h12: string, period: 'AM' | 'PM') => {
    let h = parseInt(h12, 10) % 12;
    if (period === 'PM') h += 12;
    return String(h).padStart(2, '0');
  };

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
    setSelectedKeyword(null);
  };

  const handleKeywordClick = (keyword: ScheduledKeyword) => {
    setSelectedKeyword(keyword);
    setSelectedPost(null);
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
          const { data } = await supabase
            .from('discovered_keywords')
            .select('id, keyword, scheduled_for_generation, generation_status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          const unscheduled = (data || []).filter((k: any) => !k.scheduled_for_generation && k.generation_status !== 'generated');
          setAvailableKeywords(unscheduled.map((k: any) => ({ id: k.id, keyword: k.keyword })));
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

  const handleGenerateNow = async (keyword?: ScheduledKeyword) => {
    const keywordToGenerate = keyword || selectedKeyword;
    if (!keywordToGenerate) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_id: keywordToGenerate.id,
          keyword: keywordToGenerate.keyword,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Content generated successfully! Redirecting to view your content...');
        // Redirect to the generated content
        if (result.content_id) {
          window.location.href = `/dashboard/saved-content?id=${result.content_id}`;
        } else {
          window.location.reload();
        }
      } else {
        alert('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content');
    } finally {
      setIsGenerating(false);
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
    return new Date(dateString).toLocaleDateString('en-US', {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <BlogCalendar 
                onPostClick={handlePostClick}
                onAddPost={handleAddPost}
                onKeywordClick={handleKeywordClick}
                onGenerateKeyword={handleGenerateNow}
              />
            </div>

            {/* Post/Keyword Details Sidebar */}
            <div className="lg:col-span-1">
              {selectedKeyword ? (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sticky top-24">
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
                      {selectedKeyword.generation_status === 'pending' && (
                        <button
                          onClick={() => handleGenerateNow()}
                          disabled={isGenerating}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              Generate Now
                            </>
                          )}
                        </button>
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
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sticky top-24">
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
              ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sticky top-24">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Select a Post
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Click on any scheduled post in the calendar to view its details here.
                    </p>
                  </div>
                </div>
              )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Schedule Keywords</h3>
                <p className="text-slate-600 text-sm">{formatDate(selectedDate)}</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setSelectedIds([]); }} className="text-slate-400 hover:text-slate-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Time selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                <div className="flex gap-2 max-w-xs">
                  <select value={timeHour} onChange={(e)=>setTimeHour(e.target.value)} className="px-3 py-2 border rounded-lg">
                    {Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(h=> <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={timeMinute} onChange={(e)=>setTimeMinute(e.target.value)} className="px-3 py-2 border rounded-lg">
                    {Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=> <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={timePeriod} onChange={(e)=>setTimePeriod(e.target.value as 'AM'|'PM')} className="px-3 py-2 border rounded-lg">
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={stagger} onChange={(e)=>setStagger(e.target.checked)} />
                  Stagger by 5 minutes per keyword
                </label>
              </div>

              {/* Keywords list */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Choose keywords to schedule</label>
                <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                  {isLoadingKeywords ? (
                    <div className="p-4 text-slate-500 text-sm">Loading keywords...</div>
                  ) : availableKeywords.length === 0 ? (
                    <div className="p-4 text-slate-500 text-sm">No unscheduled keywords available.</div>
                  ) : (
                    availableKeywords.map(k => (
                      <label key={k.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(k.id)}
                          onChange={(e)=> setSelectedIds(prev => e.target.checked ? [...prev, k.id] : prev.filter(id=>id!==k.id))}
                        />
                        <span className="text-slate-800 text-sm">{k.keyword}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button onClick={() => { setShowAddModal(false); setSelectedIds([]); }} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button
                disabled={selectedIds.length===0}
                onClick={async ()=>{
                  try {
                    const baseTime = `${to24Hour(timeHour, timePeriod)}:${timeMinute}:00`;
                    for (let i=0;i<selectedIds.length;i++){
                      const id = selectedIds[i];
                      let time = baseTime;
                      if (stagger) {
                        const hh = parseInt(to24Hour(timeHour, timePeriod),10);
                        const mm = parseInt(timeMinute,10);
                        const mins = hh*60 + mm + i*5;
                        const nh = Math.floor(mins/60)%24; const nm = mins%60;
                        time = `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}:00`;
                      }
                      await fetch('/api/calendar/keywords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ keyword_id: id, scheduled_date: selectedDate, scheduled_time: time })
                      });
                    }
                    setShowAddModal(false);
                    setSelectedIds([]);
                    window.location.reload();
                  } catch (e) {
                    console.error(e);
                    alert('Failed to schedule keywords');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >Schedule {selectedIds.length>0?`(${selectedIds.length})`:''}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



