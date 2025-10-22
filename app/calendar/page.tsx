'use client';

import { useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Eye, Clock, Globe, FileText } from 'lucide-react';
import BlogCalendar from '@/components/BlogCalendar';

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

export default function CalendarPage() {
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
  };

  const handleAddPost = (date: string) => {
    setSelectedDate(date);
    setShowAddModal(true);
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
              Plan, schedule, and manage your blog posts with our intuitive calendar interface.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <BlogCalendar 
                onPostClick={handlePostClick}
                onAddPost={handleAddPost}
              />
            </div>

            {/* Post Details Sidebar */}
            <div className="lg:col-span-1">
              {selectedPost ? (
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

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Schedule New Post</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  To schedule a new post, first create content using our AI Content Writer, then you can schedule it from there.
                </p>
                <button
                  onClick={() => window.location.href = '/content-writer'}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                >
                  Go to Content Writer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
