"use client"

import { useEffect, useState } from 'react';

interface LinkedContentProps {
  content: string;
  slug: string;
  className?: string;
}

/**
 * Client component that processes content and adds internal links
 * Uses server-side API for reliable link insertion
 */
export default function LinkedContent({ content, slug, className }: LinkedContentProps) {
  const [linkedContent, setLinkedContent] = useState(content);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const addInternalLinks = async () => {
      try {
        setIsProcessing(true);
        
        // Use the API endpoint to process content
        const response = await fetch('/api/wordpress/link-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            slug,
          }),
        });

        if (response.ok) {
          const { linkedContent: processedContent, linksAdded } = await response.json();
          if (processedContent) {
            setLinkedContent(processedContent);
          }
        } else {
          // Fallback to original content if API fails
          setLinkedContent(content);
        }
      } catch (error) {
        console.error('Error adding internal links:', error);
        // Fallback to original content
        setLinkedContent(content);
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if we have content
    if (content && slug) {
      addInternalLinks();
    } else {
      setLinkedContent(content);
      setIsProcessing(false);
    }
  }, [content, slug]);

  return (
    <div className={className}>
      {isProcessing ? (
        <div 
          className={className}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div 
          className={className}
          dangerouslySetInnerHTML={{ __html: linkedContent }}
        />
      )}
    </div>
  );
}

