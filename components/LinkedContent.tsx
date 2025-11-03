"use client"

import { useEffect, useState } from 'react';

interface LinkedContentProps {
  content: string;
  slug: string;
  className?: string;
}

// Helper function to add IDs to headings for TOC navigation
function addHeadingIds(html: string): string {
  // Add IDs to H2 tags
  html = html.replace(/<h2([^>]*)>(.+?)<\/h2>/gi, (match, attrs, text) => {
    // Skip if it already has an id
    if (attrs.includes('id=')) return match;
    
    const cleanText = text.replace(/<[^>]+>/g, ''); // Remove any HTML tags
    const id = cleanText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `<h2${attrs} id="${id}">${text}</h2>`;
  });
  
  // Add IDs to H3 tags
  html = html.replace(/<h3([^>]*)>(.+?)<\/h3>/gi, (match, attrs, text) => {
    // Skip if it already has an id
    if (attrs.includes('id=')) return match;
    
    const cleanText = text.replace(/<[^>]+>/g, '');
    const id = cleanText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `<h3${attrs} id="${id}">${text}</h3>`;
  });
  
  return html;
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
            // Add IDs to headings for TOC functionality
            const contentWithIds = addHeadingIds(processedContent);
            setLinkedContent(contentWithIds);
          }
        } else {
          // Fallback to original content if API fails
          const contentWithIds = addHeadingIds(content);
          setLinkedContent(contentWithIds);
        }
      } catch (error) {
        console.error('Error adding internal links:', error);
        // Fallback to original content
        const contentWithIds = addHeadingIds(content);
        setLinkedContent(contentWithIds);
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if we have content
    if (content && slug) {
      addInternalLinks();
    } else {
      const contentWithIds = addHeadingIds(content);
      setLinkedContent(contentWithIds);
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

