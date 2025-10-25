"use client"
import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface QuickPublishButtonProps {
  contentId: string;
  contentType: 'content' | 'analysis' | 'seo_research';
  contentTitle: string;
  contentBody: string;
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

const QuickWordPressPublishButton: React.FC<QuickPublishButtonProps> = ({
  contentId,
  contentType,
  contentTitle,
  contentBody,
  className = '',
  onSuccess,
  onError
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleQuickPublish = async () => {
    setIsPublishing(true);
    setMessage('');
    setMessageType('');

    try {
      // First, get the first available WordPress site
      const sitesResponse = await fetch('/api/wordpress/sites');
      const sitesData = await sitesResponse.json();
      
      if (!sitesResponse.ok || !sitesData.sites?.length) {
        throw new Error('No WordPress sites connected');
      }

      const siteId = sitesData.sites[0].id;

      // Publish the content
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
          contentId: contentId,
          contentType: contentType,
          publishOptions: {
            status: 'publish',
            excerpt: contentBody.substring(0, 160) + '...',
            tags: ['ai-generated', 'seo-tool']
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Content published to WordPress!');
        setMessageType('success');
        onSuccess?.(data);
      } else {
        throw new Error(data.error || 'Failed to publish content');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish content';
      setMessage(errorMessage);
      setMessageType('error');
      onError?.(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleQuickPublish}
        disabled={isPublishing}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors ${className}`}
      >
        {isPublishing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Quick Publish to WordPress
          </>
        )}
      </button>

      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message}
        </div>
      )}
    </div>
  );
};

export default QuickWordPressPublishButton;
