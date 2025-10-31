'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Edit, Trash2, Eye } from 'lucide-react';

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

interface CalendarProps {
  onPostClick?: (post: ScheduledPost) => void;
  onAddPost?: (date: string) => void;
  onKeywordClick?: (keyword: ScheduledKeyword) => void;
  onGenerateKeyword?: (keyword: ScheduledKeyword) => void;
  className?: string;
}

export default function BlogCalendar({ onPostClick, onAddPost, onKeywordClick, onGenerateKeyword, className = '' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [scheduledKeywords, setScheduledKeywords] = useState<ScheduledKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  // Fetch scheduled posts and keywords
  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/calendar/posts');
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
      const response = await fetch(`/api/calendar/keywords?month=${year}-${month}`);
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
  }, [currentDate]);

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
              className={`h-32 border border-slate-200 p-2 relative group ${
                isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
              } ${isPast ? 'bg-slate-50' : 'hover:bg-slate-50 cursor-pointer'} transition-colors overflow-hidden`}
            >
              {/* Date number */}
              <div className={`text-sm font-medium mb-1 ${
                isCurrentDay ? 'text-blue-600' : isPast ? 'text-slate-400' : 'text-slate-900'
              }`}>
                {date.getDate()}
              </div>

              {/* Items for this date */}
              <div className="space-y-1 overflow-y-auto max-h-24">
                {/* Posts */}
                {postsForDate.map((post) => (
                  <div
                    key={post.id}
                    className={`text-xs p-1 rounded cursor-pointer transition-colors ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : post.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPostClick?.(post);
                    }}
                    title={post.title}
                  >
                    <div className="truncate font-medium">{post.title}</div>
                  </div>
                ))}
                
                {/* Keywords */}
                {keywordsForDate.map((keyword) => (
                  <div
                    key={keyword.id}
                    className={`text-xs p-1 rounded transition-colors relative group ${
                      keyword.generation_status === 'generated' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : keyword.generation_status === 'generating'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : keyword.generation_status === 'failed'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}
                    title={keyword.keyword}
                  >
                    <div 
                      className="truncate font-medium cursor-pointer pr-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (keyword.generation_status === 'generated' && keyword.generated_content_id) {
                          window.location.href = `/dashboard/saved-content/${keyword.generated_content_id}`;
                        } else {
                          onKeywordClick?.(keyword);
                        }
                      }}
                    >
                      🔑 {keyword.keyword}
                    </div>
                    {/* Generate button for pending keywords */}
                    {keyword.generation_status === 'pending' && onGenerateKeyword && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateKeyword(keyword);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all opacity-0 group-hover:opacity-100"
                        title="Generate Now"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                    )}
                    {/* Eye icon removed: clicking the chip opens the detail page directly */}
                  </div>
                ))}
              </div>

              {/* Add post button */}
              {!isPast && (
                <>
                  {/* Centered hover overlay button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddPost?.(date.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </>
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



