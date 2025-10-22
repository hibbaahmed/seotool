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

interface CalendarProps {
  onPostClick?: (post: ScheduledPost) => void;
  onAddPost?: (date: string) => void;
  className?: string;
}

export default function BlogCalendar({ onPostClick, onAddPost, className = '' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
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

  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/calendar/posts');
      if (response.ok) {
        const posts = await response.json();
        setScheduledPosts(posts);
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, [currentDate]);

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return scheduledPosts.filter(post => post.scheduled_date === dateString);
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

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
          <p className="text-slate-600">Plan and schedule your articles</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <span className="text-sm text-slate-500">
            {totalPostsThisMonth} articles this month
          </span>
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
          const isCurrentDay = isToday(date);
          const isPast = isPastDate(date);

          return (
            <div
              key={index}
              className={`h-24 border border-slate-200 p-2 relative ${
                isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
              } ${isPast ? 'bg-slate-50' : 'hover:bg-slate-50'} transition-colors`}
            >
              {/* Date number */}
              <div className={`text-sm font-medium mb-1 ${
                isCurrentDay ? 'text-blue-600' : isPast ? 'text-slate-400' : 'text-slate-900'
              }`}>
                {date.getDate()}
              </div>

              {/* Posts for this date */}
              <div className="space-y-1">
                {postsForDate.slice(0, 2).map((post) => (
                  <div
                    key={post.id}
                    className={`text-xs p-1 rounded cursor-pointer transition-colors ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : post.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                    onClick={() => onPostClick?.(post)}
                    title={post.title}
                  >
                    <div className="truncate font-medium">{post.title}</div>
                    <div className="text-xs opacity-75">
                      {post.status.toUpperCase()}
                    </div>
                  </div>
                ))}
                {postsForDate.length > 2 && (
                  <div className="text-xs text-slate-500 text-center">
                    +{postsForDate.length - 2} more
                  </div>
                )}
              </div>

              {/* Add post button */}
              {!isPast && (
                <button
                  onClick={() => onAddPost?.(date.toISOString().split('T')[0])}
                  className="absolute top-1 right-1 p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Add post"
                >
                  <Plus className="h-3 w-3 text-slate-500" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span className="text-slate-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-slate-600">Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-slate-600">Cancelled</span>
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
