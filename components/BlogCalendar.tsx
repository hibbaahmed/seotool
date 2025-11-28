'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Edit, Trash2, Eye, GripVertical } from 'lucide-react';

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

interface CalendarProps {
  onPostClick?: (post: ScheduledPost) => void;
  onAddPost?: (date: string) => void;
  onKeywordClick?: (keyword: ScheduledKeyword) => void;
  onGenerateKeyword?: (keyword: ScheduledKeyword) => void;
  generatingKeywordId?: string | null; // Track which keyword is currently generating
  selectedProfileId?: string | null; // Filter by website/profile
  className?: string;
}

export default function BlogCalendar({ onPostClick, onAddPost, onKeywordClick, onGenerateKeyword, generatingKeywordId, selectedProfileId, className = '' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [scheduledKeywords, setScheduledKeywords] = useState<ScheduledKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<{ type: 'post' | 'keyword'; id: string } | null>(null);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Adjust for Monday start (convert Sunday=0 to Sunday=6, Monday=0)
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  // Fetch scheduled posts and keywords
  const fetchScheduledPosts = async () => {
    try {
      let url = '/api/calendar/posts';
      if (selectedProfileId) {
        url += `?onboarding_profile_id=${selectedProfileId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const posts = await response.json();
        setScheduledPosts(posts);
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

  const fetchScheduledKeywords = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      let url = `/api/calendar/keywords?month=${year}-${month}`;
      if (selectedProfileId) {
        url += `&onboarding_profile_id=${selectedProfileId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const keywords = await response.json();
        setScheduledKeywords(keywords);
      }
    } catch (error) {
      console.error('Error fetching scheduled keywords:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchScheduledPosts(), fetchScheduledKeywords()]);
      setLoading(false);
    };
    fetchData();
  }, [currentDate, selectedProfileId]);

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return scheduledPosts.filter(post => post.scheduled_date === dateString);
  };

  // Get keywords for a specific date
  const getKeywordsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return scheduledKeywords.filter(keyword => keyword.scheduled_date === dateString);
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Format month/year display
  const monthYearDisplay = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Get total posts for current month
  const totalPostsThisMonth = scheduledPosts.filter(post => {
    const postDate = new Date(post.scheduled_date);
    return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
  }).length;

  // Get total keywords for current month
  const totalKeywordsThisMonth = scheduledKeywords.filter(keyword => {
    const keywordDate = new Date(keyword.scheduled_date);
    return keywordDate.getMonth() === currentMonth && keywordDate.getFullYear() === currentYear;
  }).length;

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, type: 'post' | 'keyword', id: string) => {
    setDraggedItem({ type, id });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${type}:${id}`);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDraggedOverDate(null);
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverDate(dateString);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the calendar cell
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOverDate(null);
    }
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;

    const targetDateString = targetDate.toISOString().split('T')[0];
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      alert('Cannot move items to past dates');
      setDraggedItem(null);
      setDraggedOverDate(null);
      return;
    }

    try {
      if (draggedItem.type === 'post') {
        // Update post scheduled date
        const response = await fetch(`/api/calendar/posts/${draggedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduled_date: targetDateString
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update post');
        }

        // Update local state
        setScheduledPosts(prev => prev.map(post => 
          post.id === draggedItem.id 
            ? { ...post, scheduled_date: targetDateString }
            : post
        ));
      } else if (draggedItem.type === 'keyword') {
        // Find the keyword to preserve its scheduled_time
        const keyword = scheduledKeywords.find(k => k.id === draggedItem.id);
        const scheduled_time = keyword?.scheduled_time || '06:00:00';
        
        // Update keyword scheduled date (preserve time)
        const response = await fetch('/api/calendar/keywords', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword_id: draggedItem.id,
            scheduled_date: targetDateString,
            scheduled_time: scheduled_time
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update keyword');
        }

        // Update local state
        setScheduledKeywords(prev => prev.map(keyword => 
          keyword.id === draggedItem.id 
            ? { ...keyword, scheduled_date: targetDateString }
            : keyword
        ));
      }
    } catch (error) {
      console.error('Error moving item:', error);
      alert('Failed to move item. Please try again.');
    } finally {
      setDraggedItem(null);
      setDraggedOverDate(null);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
          <p className="text-slate-600">Plan and schedule your articles</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-500">
              {totalPostsThisMonth} posts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-purple-500">
              {totalKeywordsThisMonth} keywords
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Today
          </button>
        </div>
        <div className="text-lg font-semibold text-slate-900">
          {monthYearDisplay}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-slate-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-24"></div>;
          }

          const postsForDate = getPostsForDate(date);
          const keywordsForDate = getKeywordsForDate(date);
          const isCurrentDay = isToday(date);
          const isPast = isPastDate(date);
          const totalItems = postsForDate.length + keywordsForDate.length;

          return (
            <div
              key={index}
              onClick={() => !isPast && onAddPost?.(date.toISOString().split('T')[0])}
              onDragOver={(e) => !isPast && handleDragOver(e, date.toISOString().split('T')[0])}
              onDragLeave={handleDragLeave}
              onDrop={(e) => !isPast && handleDrop(e, date)}
              className={`h-32 border border-slate-200 p-2 relative group ${
                isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
              } ${
                isPast ? 'bg-slate-50' : 'hover:bg-slate-50 cursor-pointer'
              } ${
                draggedOverDate === date.toISOString().split('T')[0] && !isPast
                  ? 'bg-blue-100 border-blue-400 border-2' 
                  : ''
              } transition-colors overflow-hidden`}
            >
              {/* Date number */}
              <div className={`text-sm font-medium mb-1 ${
                isCurrentDay ? 'text-blue-600' : isPast ? 'text-slate-400' : 'text-slate-900'
              }`}>
                {date.getDate()}
              </div>

              {/* Items for this date */}
              <div className="space-y-1.5 overflow-y-auto max-h-24 relative z-10">
                {/* Posts */}
                {postsForDate.map((post) => {
                  // Extract subtitle/keywords from title or content
                  const subtitle = post.title.length > 50 
                    ? post.title.substring(0, 50) + '...'
                    : post.title;
                  
                  // Get first few words as subtitle
                  const titleWords = post.title.split(' ');
                  const shortTitle = titleWords.slice(0, 5).join(' ');
                  const keywords = titleWords.slice(5, 8).join(' ').toLowerCase();

                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'post', post.id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-move relative z-20 overflow-hidden group/item"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // If published, try to open WordPress URL directly
                        if (post.status === 'published') {
                          if (post.publish_url) {
                            window.open(post.publish_url, '_blank', 'noopener,noreferrer');
                          } else {
                            // Try to fetch publication URL
                            try {
                              const response = await fetch(`/api/calendar/posts/${post.id}/publication`);
                              if (response.ok) {
                                const data = await response.json();
                                if (data.publishUrl) {
                                  window.open(data.publishUrl, '_blank', 'noopener,noreferrer');
                                  return;
                                }
                              }
                            } catch (error) {
                              console.error('Error fetching publication URL:', error);
                            }
                          }
                        }
                        // If not published or no URL found, show details
                        onPostClick?.(post);
                      }}
                    >
                      {/* Drag handle and status badge */}
                      <div className="flex items-center justify-between">
                        <div className={`px-2 py-0.5 text-[10px] font-semibold uppercase flex-1 ${
                          post.status === 'published' 
                            ? 'bg-green-50 text-green-700'
                            : post.status === 'cancelled'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {post.status === 'published' ? 'PUBLISHED' : post.status === 'cancelled' ? 'CANCELLED' : 'SCHEDULED'}
                        </div>
                        <GripVertical className="h-3 w-3 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity mr-1" />
                      </div>
                      
                      {/* Title */}
                      <div className="px-2 py-1.5">
                        <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mb-0.5">
                          {post.title}
                        </div>
                        
                        {/* Subtitle/Keywords */}
                        {keywords && (
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {keywords}
                          </div>
                        )}
                      </div>
                      
                      {/* View Article Link */}
                      <div className="px-2 pb-1.5 flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>View Article</span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Keywords - Show all as rich cards */}
                {keywordsForDate.map((keyword) => {
                  const isGenerated = keyword.generation_status === 'generated';
                  const isPublished = isGenerated && keyword.publishing_info?.publishUrl;
                  
                  // Get status badge info
                  let statusBadge = {
                    text: 'PENDING',
                    bg: 'bg-purple-50',
                    textColor: 'text-purple-700'
                  };
                  
                  if (keyword.generation_status === 'generated') {
                    if (isPublished) {
                      statusBadge = { text: 'PUBLISHED', bg: 'bg-green-50', textColor: 'text-green-700' };
                    } else {
                      statusBadge = { text: 'GENERATED', bg: 'bg-green-50', textColor: 'text-green-700' };
                    }
                  } else if (keyword.generation_status === 'generating') {
                    statusBadge = { text: 'GENERATING', bg: 'bg-yellow-50', textColor: 'text-yellow-700' };
                  } else if (keyword.generation_status === 'failed') {
                    statusBadge = { text: 'FAILED', bg: 'bg-red-50', textColor: 'text-red-700' };
                  }
                  
                  return (
                    <div
                      key={keyword.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'keyword', keyword.id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-move relative z-20 overflow-hidden group/item"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // If generated, check if published first
                        if (keyword.generation_status === 'generated' && keyword.generated_content_id) {
                          // Try to fetch publication URL first (check if published)
                          try {
                            const response = await fetch(`/api/calendar/keywords/${keyword.id}/publication`);
                            if (response.ok) {
                              const data = await response.json();
                              if (data.publishUrl) {
                                // Article is published - open the blog post
                                window.open(data.publishUrl, '_blank', 'noopener,noreferrer');
                                return;
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching publication URL:', error);
                          }
                          
                          // If not published, check if we have publishUrl in publishing_info as fallback
                          if (keyword.publishing_info?.publishUrl) {
                            window.open(keyword.publishing_info.publishUrl, '_blank', 'noopener,noreferrer');
                            return;
                          }
                          
                          // Article is generated but not published - redirect to saved content
                          window.location.href = `/dashboard/saved-content?id=${keyword.generated_content_id}`;
                          return;
                        }
                        // If not generated or no content ID, show details
                        onKeywordClick?.(keyword);
                      }}
                    >
                      {/* Drag handle and status badge */}
                      <div className="flex items-center justify-between">
                        <div className={`px-2 py-0.5 text-[10px] font-semibold uppercase flex-1 ${statusBadge.bg} ${statusBadge.textColor}`}>
                          {statusBadge.text}
                        </div>
                        <GripVertical className="h-3 w-3 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity mr-1" />
                      </div>
                      
                      {/* Title */}
                      <div className="px-2 py-1.5">
                        <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mb-0.5">
                          {keyword.content_writer_outputs?.topic || keyword.keyword}
                        </div>
                        
                        {/* Subtitle */}
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {keyword.content_writer_outputs?.topic 
                            ? keyword.keyword.toLowerCase()
                            : `${keyword.opportunity_level} opportunity · Vol: ${keyword.search_volume?.toLocaleString() || 0}`}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="px-2 pb-1.5 flex items-center justify-between">
                        {isPublished ? (
                          <div 
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (keyword.publishing_info?.publishUrl) {
                                window.open(keyword.publishing_info.publishUrl, '_blank', 'noopener,noreferrer');
                              } else {
                                // Try to fetch publication URL
                                try {
                                  const response = await fetch(`/api/calendar/keywords/${keyword.id}/publication`);
                                  if (response.ok) {
                                    const data = await response.json();
                                    if (data.publishUrl) {
                                      window.open(data.publishUrl, '_blank', 'noopener,noreferrer');
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error fetching publication URL:', error);
                                }
                              }
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>View Article</span>
                          </div>
                        ) : keyword.generation_status === 'generated' && keyword.generated_content_id ? (
                          <div 
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Try to fetch publication URL first
                              try {
                                const response = await fetch(`/api/calendar/keywords/${keyword.id}/publication`);
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.publishUrl) {
                                    // Article is published - open the blog post
                                    window.open(data.publishUrl, '_blank', 'noopener,noreferrer');
                                    return;
                                  }
                                }
                              } catch (error) {
                                console.error('Error fetching publication URL:', error);
                              }
                              
                              // If not published, redirect to saved content
                              window.location.href = `/dashboard/saved-content?id=${keyword.generated_content_id}`;
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View Content</span>
                          </div>
                        ) : null}
                        
                        {/* Generate button for pending, generated, or failed keywords */}
                        {(keyword.generation_status === 'pending' || keyword.generation_status === 'generated' || keyword.generation_status === 'failed') && onGenerateKeyword && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('⚡ Regenerate button clicked for keyword:', keyword.keyword);
                              console.log('📊 Keyword status:', keyword.generation_status);
                              console.log('🔧 Calling onGenerateKeyword...');
                              onGenerateKeyword(keyword);
                            }}
                            disabled={generatingKeywordId === keyword.id}
                            className={`px-1.5 py-0.5 text-white rounded text-[10px] font-medium transition-all flex items-center gap-0.5 disabled:opacity-75 disabled:cursor-not-allowed ${
                              keyword.generation_status === 'generated' 
                                ? 'bg-orange-600 hover:bg-orange-700' 
                                : keyword.generation_status === 'failed'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            title={keyword.generation_status === 'generated' ? 'Regenerate Content' : keyword.generation_status === 'failed' ? 'Retry Generation' : 'Generate Now'}
                          >
                            {generatingKeywordId === keyword.id ? (
                              <>
                                <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></div>
                                <span className="text-[10px]">Generating...</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-[10px]">
                                  {keyword.generation_status === 'generated' 
                                    ? 'Regenerate' 
                                    : keyword.generation_status === 'failed'
                                    ? 'Retry'
                                    : 'Generate'}
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add post button - positioned in top-right corner */}
              {!isPast && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPost?.(date.toISOString().split('T')[0]);
                  }}
                  className={`absolute top-1 right-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded shadow hover:bg-blue-700 cursor-pointer transition-opacity z-0 ${
                    totalItems > 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Add new post or keyword"
                >
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span className="text-slate-600">Scheduled Post</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
          <span className="text-slate-600">Pending Keyword</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span className="text-slate-600">Generating</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-slate-600">Generated/Published</span>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}


