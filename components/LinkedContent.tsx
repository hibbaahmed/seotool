"use client"

import { useEffect, useState } from 'react';

interface LinkedContentProps {
  content: string;
  slug: string;
  className?: string;
}

// Helper function to remove "Title:" and "Meta Description:" labels
function removeTitleAndMetaLabels(html: string): string {
  let cleaned = html;
  
  // Remove "Title:" and "Meta Description:" patterns (handle various formats)
  // When they appear together on same line
  cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n<]+/gi, '');
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^M]+Meta Description:\s*[^<]+(<\/p>|$)/gi, '');
  
  // Remove individually
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p>\s*Meta Description:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Title:\s*[^\n<]+/gim, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Meta Description:\s*[^\n<]+/gim, '');
  
  // Remove at the very start of content
  cleaned = cleaned.replace(/^(<p>)?\s*Title:\s*[^\n<]+/im, '');
  cleaned = cleaned.replace(/^(<p>)?\s*Meta Description:\s*[^\n<]+/im, '');
  
  // Clean up empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/^(\s*<p>\s*<\/p>\s*)+/gi, '');
  
  return cleaned.trim();
}

// Helper function to remove duplicate titles at the start of content
function removeDuplicateTitles(html: string): string {
  // Remove duplicate H1 tags at the start
  // Pattern: <h1>Title</h1> appearing multiple times at the start
  let cleaned = html;
  
  // Extract all H1 tags at the start
  const h1Matches = cleaned.match(/^<h1[^>]*>(.+?)<\/h1>/gi);
  if (h1Matches && h1Matches.length > 1) {
    // Get the first H1 text
    const firstH1Text = h1Matches[0].replace(/<[^>]+>/g, '').trim();
    // Remove all subsequent duplicate H1s
    let seenFirst = false;
    cleaned = cleaned.replace(/<h1[^>]*>(.+?)<\/h1>/gi, (match, content) => {
      const text = content.replace(/<[^>]+>/g, '').trim();
      if (!seenFirst) {
        seenFirst = true;
        return ''; // Remove first occurrence too (title is shown in header)
      }
      // If it's a duplicate of the first, remove it
      if (text === firstH1Text || text.toLowerCase() === firstH1Text.toLowerCase()) {
        return '';
      }
      // If it's a different title-like text, remove it too
      if (text.length > 10 && text.length < 150) {
        return '';
      }
      return match;
    });
  }
  
  // Also handle plain text titles that appear at the start
  // Remove consecutive title-like lines (short lines without sentence structure)
  const lines = cleaned.split('\n');
  let startIndex = 0;
  let foundContent = false;
  
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    const lineHtml = line.replace(/<[^>]+>/g, '').trim();
    
    // Skip H1 tags (already handled)
    if (line.match(/^<h1[^>]*>/)) {
      startIndex = i + 1;
      continue;
    }
    
    // If we find a paragraph with actual content (starts with lowercase, has sentence structure)
    if (line.match(/^<p[^>]*>/) && (lineHtml.match(/^[a-z]/) || lineHtml.includes('. ') || lineHtml.length > 100)) {
      foundContent = true;
      startIndex = i;
      break;
    }
    
    // If we find standalone text that looks like a title (not a paragraph)
    if (lineHtml && !line.match(/^<p/) && !line.match(/^<h/)) {
      if (lineHtml.length > 10 && lineHtml.length < 150 && !lineHtml.includes('. ') && !lineHtml.match(/^[a-z]/)) {
        startIndex = i + 1;
        continue;
      }
    }
  }
  
  // Skip blank lines
  while (startIndex < lines.length && lines[startIndex].trim() === '') {
    startIndex++;
  }
  
  if (foundContent || startIndex > 0) {
    cleaned = lines.slice(startIndex).join('\n');
  }
  
  return cleaned;
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
            // Remove Title and Meta Description labels first
            let cleaned = removeTitleAndMetaLabels(processedContent);
            // Remove duplicate titles
            cleaned = removeDuplicateTitles(cleaned);
            // Add IDs to headings for TOC functionality
            const contentWithIds = addHeadingIds(cleaned);
            setLinkedContent(contentWithIds);
          }
        } else {
          // Fallback to original content if API fails
          let cleaned = removeTitleAndMetaLabels(content);
          cleaned = removeDuplicateTitles(cleaned);
          const contentWithIds = addHeadingIds(cleaned);
          setLinkedContent(contentWithIds);
        }
      } catch (error) {
        console.error('Error adding internal links:', error);
        // Fallback to original content
        let cleaned = removeTitleAndMetaLabels(content);
        cleaned = removeDuplicateTitles(cleaned);
        const contentWithIds = addHeadingIds(cleaned);
        setLinkedContent(contentWithIds);
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if we have content
    if (content && slug) {
      addInternalLinks();
    } else {
      let cleaned = removeTitleAndMetaLabels(content);
      cleaned = removeDuplicateTitles(cleaned);
      const contentWithIds = addHeadingIds(cleaned);
      setLinkedContent(contentWithIds);
      setIsProcessing(false);
    }
  }, [content, slug]);

  // Clean content before rendering (both processing and fallback states)
  const displayContent = isProcessing 
    ? removeDuplicateTitles(removeTitleAndMetaLabels(content))
    : linkedContent;

  return (
    <div className={className}>
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
    </div>
  );
}

