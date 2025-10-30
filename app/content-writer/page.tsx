'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { PenTool, FileText, ArrowRight, Eye, Download, Save, Calendar, Clock } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import QuickWordPressPublishButton from '@/components/QuickWordPressPublishButton';

export default function ContentWriterPage() {
  const [isWriting, setIsWriting] = useState(false);
  const [results, setResults] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    scheduled_time: '09:00',
    platform: 'blog',
    notes: ''
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    contentType: 'blog-post',
    targetAudience: '',
    tone: 'professional',
    length: 'medium',
    additionalContext: ''
  });

  // Replace IMAGE_PLACEMENT placeholders with Markdown images and normalize spacing
  const processContent = (text: string, urls: string[] = []): string => {
    if (!text) return '';

    let urlIndex = 0;
    const replaced = text.replace(/\[IMAGE_PLACEMENT:\s*"([^"]+)"\]/g, (_m, alt: string) => {
      const url = urls[urlIndex++] || urls[urls.length - 1] || '';
      if (!url) return '';
      return `\n\n![${alt}](${url})\n\n`;
    });

    // Ensure blank line before and after headings and images
    let normalized = replaced
      // blank line before headings
      .replace(/([^\n])\n(#{2,3}\s)/g, '$1\n\n$2')
      // blank line after heading line if missing
      .replace(/^(#{2,3}[^\n]*)(?!\n\n)/gm, '$1\n')
      // ensure blank lines around images
      .replace(/([^\n])\n(!\[[^\]]*\]\([^\)]+\))/g, '$1\n\n$2')
      .replace(/(!\[[^\]]*\]\([^\)]+\))(?!\n\n)/g, '$1\n\n');

    return normalized;
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWriting(true);
    setResults('');
    setImages([]);
    setSaveMessage(''); // Clear previous save messages

    try {
      // Get user ID for image uploads
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const response = await fetch('/api/ai/content-writer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Create ${formData.contentType} content with the following specifications:
Topic: "${formData.topic}"
Content Type: ${formData.contentType}
Target Audience: "${formData.targetAudience}"
Tone: ${formData.tone}
Length: ${formData.length}
Additional Context: "${formData.additionalContext}"

Please provide high-quality, engaging content that meets these requirements.`
          }],
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Content generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let receivedImages: string[] = [];
      let buffer = ''; // Buffer to hold incomplete lines

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'images') {
                receivedImages = data.urls || [];
                setImages(receivedImages);
                console.log('🖼️ Received images:', receivedImages.length);
              } else if (data.type === 'token') {
                accumulatedText += data.value;
                setResults(accumulatedText); // Update display with accumulated text
              } else if (data.type === 'done') {
                setIsWriting(false);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Skip incomplete JSON
            }
          }
        }
      }

      // Automatically save the content when complete
      if (accumulatedText.trim()) {
        await autoSaveContent(accumulatedText, receivedImages);
      }
    } catch (error) {
      console.error('Content generation error:', error);
      setResults(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setIsWriting(false);
    }
  };

  const autoSaveContent = async (contentOutput: string, imageUrls: string[] = []) => {
    const processed = processContent(contentOutput, imageUrls);
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSaveMessage('Content completed but not saved (user not authenticated)');
        return;
      }

      const contentData = {
        user_id: user.id,
        topic: formData.topic,
        content_type: formData.contentType,
        target_audience: formData.targetAudience,
        tone: formData.tone,
        length: formData.length,
        additional_context: formData.additionalContext,
        content_output: processed,
        image_urls: imageUrls
      };

      const { data: savedContent, error } = await supabase
        .from('content_writer_outputs')
        .insert(contentData as any)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error saving content:', error);
        setSaveMessage('Content completed but failed to save. You can try saving manually.');
      } else {
        setSaveMessage('Content completed and saved automatically!');
        console.log('Saved content:', savedContent);
        console.log('Image URLs from saved content:', (savedContent as any)?.image_urls);
        
        // Load images from the saved record
        if (savedContent && (savedContent as any).image_urls && Array.isArray((savedContent as any).image_urls)) {
          setImages((savedContent as any).image_urls as string[]);
          console.log('Set images from saved content:', (savedContent as any).image_urls);
        } else {
          console.log('No image_urls found in saved content or not an array');
        }
      }
    } catch (error) {
      console.error('Error auto-saving content:', error);
      setSaveMessage('Content completed but failed to save. You can try saving manually.');
    }
  };

  // Load images stored in DB for the current user/topic
  const refreshImagesFromDb = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found for refresh');
        return;
      }

      console.log('Refreshing images for topic:', formData.topic);
      const { data, error } = await supabase
        .from('content_writer_outputs')
        .select('image_urls, topic, created_at')
        .eq('user_id', user.id)
        .eq('topic', formData.topic)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Refresh query result:', { data, error });
      
      if (error) {
        console.error('Error refreshing images:', error);
        return;
      }

      if (data && (data as any).image_urls && Array.isArray((data as any).image_urls)) {
        setImages((data as any).image_urls as string[]);
        console.log('Refreshed images:', (data as any).image_urls);
      } else {
        console.log('No image_urls found in refresh query');
      }
    } catch (err) {
      console.error('Error in refreshImagesFromDb:', err);
    }
  };

  const handleSaveContent = async () => {
    if (!results.trim()) {
      setSaveMessage('No content results to save');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSaveMessage('User not authenticated');
        return;
      }

      const contentData = {
        user_id: user.id,
        topic: formData.topic,
        content_type: formData.contentType,
        target_audience: formData.targetAudience,
        tone: formData.tone,
        length: formData.length,
        additional_context: formData.additionalContext,
        content_output: processContent(results, images),
      };

      const { data: savedContent, error } = await supabase
        .from('content_writer_outputs')
        .insert(contentData as any)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving content:', error);
        setSaveMessage('Failed to save content. Please try again.');
      } else {
        setSaveMessage('Content saved successfully!');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveMessage('Error saving content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadContent = () => {
    if (!results.trim()) {
      return;
    }

    const blob = new Blob([results], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${formData.topic}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleScheduleContent = async () => {
    if (!results.trim()) {
      setSaveMessage('No content to schedule');
      return;
    }

    if (!scheduleData.scheduled_date) {
      setSaveMessage('Please select a date to schedule the post');
      return;
    }

    setIsScheduling(true);
    setSaveMessage('');

    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSaveMessage('User not authenticated');
        return;
      }

      // First save the content if not already saved
      let contentId = null;
      try {
        const contentData = {
          user_id: user.id,
          topic: formData.topic,
          content_type: formData.contentType,
          target_audience: formData.targetAudience,
          tone: formData.tone,
          length: formData.length,
          additional_context: formData.additionalContext,
          content_output: results,
          image_urls: images
        };

        const { data: savedContent, error: saveError } = await supabase
          .from('content_writer_outputs')
          .insert(contentData as any)
          .select('id')
          .single();

        if (!saveError && savedContent) {
          contentId = (savedContent as any).id;
        }
      } catch (saveError) {
        console.log('Content already saved or save failed, continuing with scheduling');
      }

      // Schedule the post
      const schedulePayload = {
        title: formData.topic,
        content: processContent(results, images),
        scheduled_date: scheduleData.scheduled_date,
        scheduled_time: scheduleData.scheduled_time + ':00',
        platform: scheduleData.platform,
        notes: scheduleData.notes,
        image_urls: images,
        content_id: contentId
      };

      const response = await fetch('/api/calendar/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule post');
      }

      setSaveMessage('Content scheduled successfully!');
      setShowScheduleModal(false);
      
      // Reset schedule data
      setScheduleData({
        scheduled_date: '',
        scheduled_time: '09:00',
        platform: 'blog',
        notes: ''
      });

    } catch (error) {
      console.error('Error scheduling content:', error);
      setSaveMessage(`Error scheduling content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleScheduleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScheduleData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <PenTool className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              AI Content Writer
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Generate high-quality, engaging content tailored to your specific needs. Create blog posts, articles, marketing copy, and more with AI assistance.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Input */}
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                  What topic do you want to write about? *
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., 'The Future of AI in Healthcare', '10 Tips for Remote Work Success', 'Sustainable Fashion Trends'"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-900"
                  required
                />
              </div>

              {/* Content Type and Audience Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contentType" className="block text-sm font-medium text-slate-700 mb-2">
                    Content Type
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="blog-post">Blog Post</option>
                    <option value="article">Article</option>
                    <option value="social-media">Social Media Post</option>
                    <option value="email">Email Newsletter</option>
                    <option value="product-description">Product Description</option>
                    <option value="landing-page">Landing Page Copy</option>
                    <option value="press-release">Press Release</option>
                    <option value="case-study">Case Study</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700 mb-2">
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., 'tech professionals', 'small business owners', 'healthcare workers'"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Tone and Length Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-2">
                    Writing Tone
                  </label>
                  <select
                    id="tone"
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="conversational">Conversational</option>
                    <option value="technical">Technical</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="informative">Informative</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-slate-700 mb-2">
                    Content Length
                  </label>
                  <select
                    id="length"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="short">Short (300-500 words)</option>
                    <option value="medium">Medium (800-1200 words)</option>
                    <option value="long">Long (1500-2500 words)</option>
                    <option value="comprehensive">Comprehensive (2500+ words)</option>
                  </select>
                </div>
              </div>

              {/* Additional Context */}
              <div>
                <label htmlFor="additionalContext" className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  id="additionalContext"
                  name="additionalContext"
                  rows={4}
                  value={formData.additionalContext}
                  onChange={handleInputChange}
                  placeholder="Include any specific requirements, key points to cover, SEO keywords, or other details that will help create better content..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-900"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                disabled={isWriting}
              >
                {isWriting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Writing Content...
                  </>
                ) : (
                  <>
                    <PenTool className="h-5 w-5" />
                    Generate Content
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <p className="text-xs text-slate-500 text-center mt-3">
                💾 Content will be automatically saved to your account
              </p>
            </form>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-green-600" />
                  <h3 className="text-2xl font-bold text-slate-900">Generated Content</h3>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </button>
                  <button
                    onClick={handleSaveContent}
                    disabled={isSaving}
                    className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    title="Re-save content (already saved automatically)"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Re-save'}
                  </button>
                  <button
                    onClick={handleDownloadContent}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  
                  {/* WordPress Publish Button */}
                  <QuickWordPressPublishButton
                    contentId={`content-${Date.now()}`} // Generate unique ID
                    contentType="content"
                    contentTitle={formData.topic}
                    contentBody={processContent(results, images)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    onSuccess={(result) => {
                      setSaveMessage('Content published to WordPress successfully!');
                    }}
                    onError={(error) => {
                      setSaveMessage(`Failed to publish: ${error}`);
                    }}
                  />
                </div>
              </div>
              
              {saveMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  saveMessage.includes('automatically') || saveMessage.includes('successfully')
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                  {saveMessage}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: typeof results === 'string' ? (marked.parse(processContent(results, images)) as string) : '' }}
                  />
                </div>
              </div>

              {/* Generated Images */}
              {images.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-xl font-bold text-slate-900">Generated Images</h4>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                      {images.length} images
                    </span>
                    <button
                      type="button"
                      onClick={refreshImagesFromDb}
                      className="ml-auto text-sm font-medium text-blue-700 hover:text-blue-800 underline"
                    >
                      Refresh from DB
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                          }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => window.open(imageUrl, '_blank')}
                            className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4 inline mr-2" />
                            View Full Size
                          </button>
                        </div>
                        <div className="mt-2 text-center">
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = imageUrl;
                              link.download = `content-image-${index + 1}.jpg`;
                              link.click();
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 inline mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Image Usage Tips:</span>
                    </div>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      <li>• Images are automatically selected based on your content topic</li>
                      <li>• Use these images to enhance your content's visual appeal</li>
                      <li>• Consider adding alt text for better SEO when using in your projects</li>
                      <li>• Images are optimized for web use and ready for download</li>
                    </ul>
                  </div>
                </div>
              )}

              {!isWriting && !results.includes('Error:') && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Tips:</span>
                  </div>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Copy the content to use in your projects</li>
                    <li>• Review and edit as needed for your specific use case</li>
                    <li>• Consider adding images, links, or additional sections</li>
                    <li>• Use different tones and lengths for varied content types</li>
                    <li>• Save successful prompts for future content generation</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                  <h3 className="text-xl font-bold text-slate-900">Schedule Post</h3>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleScheduleContent(); }} className="space-y-4">
                {/* Post Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Post Title
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>

                {/* Schedule Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Schedule Date *
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={scheduleData.scheduled_date}
                    onChange={handleScheduleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Schedule Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={scheduleData.scheduled_time}
                    onChange={handleScheduleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Platform
                  </label>
                  <select
                    name="platform"
                    value={scheduleData.platform}
                    onChange={handleScheduleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="blog">Blog</option>
                    <option value="wordpress">WordPress</option>
                    <option value="medium">Medium</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={scheduleData.notes}
                    onChange={handleScheduleInputChange}
                    rows={3}
                    placeholder="Add any notes about this scheduled post..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isScheduling ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        Schedule Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
