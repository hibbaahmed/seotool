"use client"
import React, { useState, useEffect } from 'react';
import { Edit, Save, Upload, Eye, Trash2, ExternalLink, Calendar, User, FileText, ArrowLeft } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import QuickWordPressPublishButton from '@/components/QuickWordPressPublishButton';

interface SavedContent {
  id: string;
  user_id: string;
  topic: string;
  content_type: string;
  target_audience: string;
  tone: string;
  length: string;
  additional_context: string;
  content_output: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

interface ContentEditorProps {
  content: SavedContent;
  onClose: () => void;
  onSave: (updatedContent: SavedContent) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ content, onClose, onSave }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/content-writer/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editedContent.id,
          topic: editedContent.topic,
          content_type: editedContent.content_type,
          target_audience: editedContent.target_audience,
          tone: editedContent.tone,
          length: editedContent.length,
          additional_context: editedContent.additional_context,
          content_output: editedContent.content_output,
          image_urls: editedContent.image_urls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save content');
      }

      setSaveMessage('Content saved successfully!');
      onSave(data.content);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveMessage('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('content_writer_outputs')
        .delete()
        .eq('id', editedContent.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error deleting content:', error);
      setSaveMessage('Failed to delete content');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Edit Content</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing 
                    ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Edit className="w-4 h-4 inline mr-2" />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              saveMessage.includes('successfully') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}

          {/* Content Parameters */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Content Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={editedContent.topic}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, topic: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content Type</label>
                <select
                  value={editedContent.content_type}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, content_type: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="blog-post">Blog Post</option>
                  <option value="article">Article</option>
                  <option value="social-media">Social Media</option>
                  <option value="email">Email</option>
                  <option value="product-description">Product Description</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={editedContent.target_audience}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, target_audience: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
                <select
                  value={editedContent.tone}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, tone: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Length</label>
                <select
                  value={editedContent.length}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, length: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generated Content */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Generated Content</h3>
              {!isEditing && (
                <div className="flex items-center gap-2">
                  <QuickWordPressPublishButton
                    contentId={editedContent.id}
                    contentType="content"
                    contentTitle={editedContent.topic}
                    contentBody={editedContent.content_output}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    onSuccess={(result) => {
                      setSaveMessage('Content published to WordPress successfully!');
                    }}
                    onError={(error) => {
                      setSaveMessage(`Failed to publish: ${error}`);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <textarea
                value={editedContent.content_output}
                onChange={(e) => setEditedContent(prev => ({ ...prev, content_output: e.target.value }))}
                disabled={!isEditing}
                rows={20}
                className="w-full bg-transparent border-none outline-none resize-none text-slate-900 font-mono text-sm leading-relaxed disabled:text-slate-500"
                placeholder="Generated content will appear here..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(editedContent.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Updated: {new Date(editedContent.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
