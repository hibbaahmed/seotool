"use client"

import { useEffect, useState } from 'react';

interface LinkedContentProps {
  content: string;
  slug: string;
  className?: string;
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function isTitleLikeText(text: string): boolean {
  const normalized = stripHtmlTags(text);
  if (!normalized) return false;
  if (normalized.length > 150) return false;
  if (normalized.includes('. ') || normalized.includes('? ') || normalized.includes('! ')) {
    return false;
  }
  return /^[A-Z0-9]/.test(normalized);
}

// Helper function to remove "Title:" and "Meta Description:" labels
function removeTitleAndMetaLabels(html: string): string {
  let cleaned = html;

  // Remove "Title:" and "Meta Description:" patterns (handle various formats)
  // When they appear together on same line
  cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n<]+/gi, '');
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^M]+Meta Description:\s*[^<]+(<\/p>|$)/gi, '');

  // Remove individually - ANYWHERE in content (not just at start)
  cleaned = cleaned.replace(/<p>\s*Title:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/<p>\s*Meta Description:\s*[^<]+(<\/p>|$)/gi, '');
  cleaned = cleaned.replace(/Title:\s*[^\n<]+/gi, '');
  cleaned = cleaned.replace(/Meta Description:\s*[^\n<]+/gi, '');

  // Remove H1 tags containing "Meta Description"
  cleaned = cleaned.replace(/<h1[^>]*>[^<]*Meta Description[^<]*<\/h1>/gi, '');

  // Remove broken/incomplete image tags (only those with # in URL or truly malformed)
  cleaned = cleaned.replace(/<img\s+src="[^"]*#[^"]*"[^>]*>/gi, '');
  // Don't remove valid img tags - only remove ones that are truly incomplete (missing closing >)
  // The negative lookahead was too aggressive and removed valid images with multiple attributes
  
  // Remove "Post-Processing and Enhancement" and similar markers
  cleaned = cleaned.replace(/<p>\s*(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<h[2-6][^>]*>\s*(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)\s*<\/h[2-6]>/gi, '');
  
  // Remove instruction markers that shouldn't be in content
  cleaned = cleaned.replace(/<h1[^>]*>\s*Remaining H2 Sections?\s*<\/h1>/gi, '');
  cleaned = cleaned.replace(/<h[1-6][^>]*>\s*(?:Write|Add|Include)\s+[^<]+<\/h[1-6]>/gi, '');
  cleaned = cleaned.replace(/<p>\s*\[(?:Write|Add|Include|Insert|Place)[^\]]*\]\s*<\/p>/gi, '');
  
  // Remove orphaned table elements (tables with only headers, no data)
  cleaned = cleaned.replace(/<table[^>]*>\s*<thead[^>]*>[\s\S]*?<\/thead>\s*<tbody[^>]*>\s*<\/tbody>\s*<\/table>/gi, '');
  cleaned = cleaned.replace(/<table[^>]*>\s*<thead[^>]*>[\s\S]*?<\/thead>\s*<\/table>/gi, '');
  
  // Fix tables with paragraph text in table rows - extract and place after table
  // Look for table rows (<tr>) with cells (<td>) containing long paragraph text (50+ chars)
  cleaned = cleaned.replace(/(<\/table>)\s*(<table[^>]*>[\s\S]*?<tbody[^>]*>[\s\S]*?)(<tr[^>]*>\s*<td[^>]*>([^<]{50,}(?:[.!]\s+[A-Z][^<]+[.!])+[^<]*)<\/td>\s*<\/tr>)\s*([\s\S]*?<\/tbody>\s*<\/table>)/gi, 
    (match, prevTableEnd, tableStart, rowWithText, textContent, tableEnd) => {
      // Extract the paragraph text
      const cleanText = textContent.trim().replace(/<[^>]+>/g, '');
      // Return table without that row, plus the text as a paragraph after
      return `${prevTableEnd}${tableStart}${tableEnd}<p>${cleanText}</p>`;
    }
  );
  
  // Remove instruction placeholders in brackets or parentheses
  cleaned = cleaned.replace(/\[(?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\((?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\)]*\)/gi, '');

  // Clean up empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/^(\s*<p>\s*<\/p>\s*)+/gi, '');
  
  // Clean up multiple consecutive line breaks in HTML
  cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');

  return cleaned.trim();
}

// Helper function to remove duplicate titles at the start of content
function removeDuplicateTitles(html: string): string {
  if (!html) return html;

  let cleaned = html.trimStart();
  let removedTitleText = '';

  const leadingH1Regex = /^<h1[^>]*>([\s\S]*?)<\/h1>/i;
  const firstH1Match = cleaned.match(leadingH1Regex);
  if (firstH1Match) {
    removedTitleText = stripHtmlTags(firstH1Match[1]).toLowerCase();
    cleaned = cleaned.replace(leadingH1Regex, '').trimStart();
  }

  if (!removedTitleText) {
    const firstParagraphMatch = cleaned.match(/^<p[^>]*>([\s\S]*?)<\/p>/i);
    if (firstParagraphMatch && isTitleLikeText(firstParagraphMatch[1])) {
      removedTitleText = stripHtmlTags(firstParagraphMatch[1]).toLowerCase();
      cleaned = cleaned.replace(firstParagraphMatch[0], '').trimStart();
    } else {
      const leadingTextMatch = cleaned.match(/^([^<\n]+)(\n|$)/);
      if (leadingTextMatch && isTitleLikeText(leadingTextMatch[1])) {
        removedTitleText = stripHtmlTags(leadingTextMatch[1]).toLowerCase();
        cleaned = cleaned.slice(leadingTextMatch[0].length).trimStart();
      }
    }
  }

  if (removedTitleText) {
    cleaned = cleaned.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (match, content) => {
      const normalized = stripHtmlTags(content).toLowerCase();
      if (normalized === removedTitleText) {
        return '';
      }
      return match;
    });
  }

  const lines = cleaned.split('\n');
  let startIndex = 0;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) {
      startIndex = i + 1;
      continue;
    }
    if (line.match(/^<p[^>]*>/) && !isTitleLikeText(line)) {
      break;
    }
    if (isTitleLikeText(line)) {
      startIndex = i + 1;
      continue;
    }
    break;
  }

  if (startIndex > 0) {
    cleaned = lines.slice(startIndex).join('\n').trimStart();
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

