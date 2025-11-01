/**
 * Content Linker - Automatically adds internal links to blog content
 * Analyzes content and intelligently inserts links to related posts
 */

import { PostMetadata, findLinkOpportunities, extractKeywords } from './blog-interlinking';

export interface LinkSuggestion {
  targetPost: {
    slug: string;
    title: string;
    excerpt: string;
  };
  anchorText: string;
  position: number;
  relevance: number;
  context: string; // The sentence/phrase where link should be inserted
}

export interface LinkedContentResult {
  linkedContent: string;
  linksAdded: number;
  suggestions: LinkSuggestion[];
}

/**
 * Find the best anchor text for a link opportunity
 */
function generateAnchorText(
  context: string,
  targetTitle: string,
  targetKeywords: string[]
): string {
  // Try to find a natural phrase in the context that matches target keywords
  const contextLower = context.toLowerCase();
  
  // Look for exact keyword matches in context
  for (const keyword of targetKeywords.slice(0, 5)) {
    if (contextLower.includes(keyword.toLowerCase())) {
      // Extract a phrase containing the keyword (3-5 words)
      const words = context.split(/\s+/);
      const keywordIndex = words.findIndex(w => 
        w.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (keywordIndex !== -1) {
        const start = Math.max(0, keywordIndex - 1);
        const end = Math.min(words.length, keywordIndex + 3);
        const phrase = words.slice(start, end).join(' ');
        
        // Clean up the phrase
        return phrase.replace(/[^\w\s]/g, '').trim();
      }
    }
  }
  
  // Fallback: use a relevant phrase from target title
  const titleWords = targetTitle.split(/\s+/).filter(w => w.length > 3);
  if (titleWords.length > 0) {
    // Take 2-4 words from the title
    const phraseLength = Math.min(titleWords.length, 4);
    return titleWords.slice(0, phraseLength).join(' ');
  }
  
  // Final fallback
  return targetTitle;
}

/**
 * Insert link into HTML content at a specific position
 */
function insertLinkIntoContent(
  content: string,
  anchorText: string,
  targetSlug: string,
  context: string
): string {
  // Remove HTML tags from context for matching
  const cleanContext = context.replace(/<[^>]*>/g, '').trim();
  
  // Find the position in the original HTML content
  // Try multiple strategies to find the right place to insert
  
  // Strategy 1: Find exact text match (case-insensitive)
  const regex = new RegExp(
    escapeRegExp(cleanContext.substring(0, Math.min(50, cleanContext.length))),
    'i'
  );
  
  const match = content.match(regex);
  if (match && match.index !== undefined) {
    const beforeMatch = content.substring(0, match.index);
    const afterMatch = content.substring(match.index);
    
    // Find where the actual anchor text starts in the context
    const anchorIndex = cleanContext.toLowerCase().indexOf(anchorText.toLowerCase());
    if (anchorIndex !== -1) {
      // Count to the position of anchor text, accounting for HTML tags
      let charCount = 0;
      let inTag = false;
      let htmlCharCount = 0;
      
      for (let i = 0; i < afterMatch.length; i++) {
        if (afterMatch[i] === '<') inTag = true;
        if (afterMatch[i] === '>') inTag = false;
        if (inTag) htmlCharCount++;
        else charCount++;
        if (charCount >= anchorIndex) {
          const insertPos = match.index + i + 1;
          
          // Insert link, being careful about HTML structure
          const beforeAnchor = content.substring(0, insertPos);
          const anchorSection = content.substring(insertPos);
          
          // Find word boundaries for the anchor text
          const anchorRegex = new RegExp(
            `(${escapeRegExp(anchorText)})`,
            'i'
          );
          
          const anchorMatch = anchorSection.match(anchorRegex);
          if (anchorMatch && anchorMatch.index !== undefined) {
            const linkStart = insertPos + anchorMatch.index;
            const linkEnd = linkStart + anchorMatch[1].length;
            
            // Check if already linked (don't double-link)
            const beforeLink = content.substring(0, linkStart);
            const afterLink = content.substring(linkEnd);
            
            // Simple check: if there's already an <a> tag nearby, skip
            const nearbyHtml = content.substring(Math.max(0, linkStart - 20), linkEnd + 20);
            if (/<a\s+href/i.test(nearbyHtml)) {
              return content; // Already has a link, skip
            }
            
            const linkedContent = 
              beforeLink +
              `<a href="/blog/${targetSlug}" class="internal-link" data-link-type="auto-generated">${anchorMatch[1]}</a>` +
              afterLink;
            
            return linkedContent;
          }
        }
      }
    }
  }
  
  // Strategy 2: Insert at sentence level (simpler approach)
  // Split content by sentences and find matching sentence
  const sentences = content.split(/([.!?]+\s+|<[^>]*>)/);
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].replace(/<[^>]*>/g, '').trim();
    if (sentence.toLowerCase().includes(cleanContext.toLowerCase().substring(0, 30))) {
      // Found matching sentence, insert link
      const words = sentence.split(/\s+/);
      const anchorWords = anchorText.split(/\s+/);
      
      // Find where anchor words appear
      for (let j = 0; j < words.length - anchorWords.length + 1; j++) {
        const slice = words.slice(j, j + anchorWords.length).join(' ').toLowerCase();
        if (slice === anchorText.toLowerCase()) {
          // Found anchor text, insert link
          const beforeWords = words.slice(0, j).join(' ');
          const anchorSection = words.slice(j, j + anchorWords.length).join(' ');
          const afterWords = words.slice(j + anchorWords.length).join(' ');
          
          // Reconstruct with link
          const linkedSentence = 
            (beforeWords ? beforeWords + ' ' : '') +
            `<a href="/blog/${targetSlug}" class="internal-link" data-link-type="auto-generated">${anchorSection}</a>` +
            (afterWords ? ' ' + afterWords : '');
          
          sentences[i] = sentences[i].replace(sentence, linkedSentence);
          return sentences.join('');
        }
      }
    }
  }
  
  return content; // Return unchanged if no suitable position found
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main function to automatically link content to related posts
 */
export async function autoLinkContent(
  content: string,
  currentPostSlug: string,
  relatedPosts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    keywords?: string[];
  }>,
  maxLinks: number = 3
): Promise<LinkedContentResult> {
  let linkedContent = content;
  const suggestions: LinkSuggestion[] = [];
  let linksAdded = 0;
  
  // Process each related post
  for (const post of relatedPosts.slice(0, maxLinks)) {
    // Extract keywords from target post
    const targetKeywords = post.keywords || extractKeywords(
      post.title + ' ' + post.excerpt,
      10
    );
    
    // Find link opportunities
    const opportunities = findLinkOpportunities(
      content,
      {
        id: post.slug,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.excerpt,
        categories: [],
        tags: [],
        keywords: targetKeywords,
      },
      maxLinks
    );
    
    // Process each opportunity
    for (const opportunity of opportunities) {
      if (linksAdded >= maxLinks) break;
      
      // Generate anchor text
      const anchorText = generateAnchorText(
        opportunity.text,
        post.title,
        targetKeywords
      );
      
      // Check if this anchor text already exists as a link in content
      const existingLinkPattern = new RegExp(
        `<a[^>]*>.*?${escapeRegExp(anchorText)}}[^<]*</a>`,
        'i'
      );
      
      if (existingLinkPattern.test(linkedContent)) {
        continue; // Skip if already linked
      }
      
      // Insert the link
      const beforeLink = linkedContent;
      linkedContent = insertLinkIntoContent(
        linkedContent,
        anchorText,
        post.slug,
        opportunity.text
      );
      
      // If link was successfully inserted
      if (linkedContent !== beforeLink) {
        linksAdded++;
        suggestions.push({
          targetPost: {
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
          },
          anchorText,
          position: opportunity.position,
          relevance: opportunity.relevance,
          context: opportunity.text,
        });
      }
    }
  }
  
  return {
    linkedContent,
    linksAdded,
    suggestions,
  };
}

/**
 * Simple regex-based linking for common phrases
 * This is a fallback method that's less sophisticated but more reliable
 */
export function simpleAutoLink(
  content: string,
  relatedPosts: Array<{
    slug: string;
    title: string;
    keywords?: string[];
  }>,
  maxLinks: number = 3
): string {
  let linkedContent = content;
  let linksAdded = 0;
  
  // Process posts in order of relevance
  for (const post of relatedPosts.slice(0, maxLinks * 2)) {
    if (linksAdded >= maxLinks) break;
    
    // Extract keywords from post title and generate link phrases
    const keywords = post.keywords || extractKeywords(post.title, 5);
    const titleWords = post.title.split(/\s+/).filter(w => w.length > 4);
    
    // Create phrases to search for (2-4 word phrases)
    const phrases: string[] = [];
    
    // Add 3-word phrases from title
    for (let i = 0; i <= titleWords.length - 3; i++) {
      phrases.push(titleWords.slice(i, i + 3).join(' '));
    }
    
    // Add 2-word phrases from title
    for (let i = 0; i <= titleWords.length - 2; i++) {
      phrases.push(titleWords.slice(i, i + 2).join(' '));
    }
    
    // Add single important keywords
    keywords.slice(0, 3).forEach(kw => phrases.push(kw));
    
    // Try to link each phrase (longest first)
    phrases.sort((a, b) => b.length - a.length);
    
    for (const phrase of phrases) {
      if (linksAdded >= maxLinks) break;
      
      // Create regex to find phrase, but not if already inside a link
      const regex = new RegExp(
        `(?<!<a[^>]*>)(?<!href=["'])[^>]*\\b(${escapeRegExp(phrase)})\\b(?![^<]*</a>)`,
        'gi'
      );
      
      const matches = linkedContent.matchAll(regex);
      let matchCount = 0;
      
      for (const match of matches) {
        if (matchCount >= 1) break; // Only link first occurrence per post
        if (linksAdded >= maxLinks) break;
        
        // Check if we're not inside an existing link
        const beforeMatch = linkedContent.substring(0, match.index);
        const lastLinkOpen = beforeMatch.lastIndexOf('<a ');
        const lastLinkClose = beforeMatch.lastIndexOf('</a>');
        
        if (lastLinkOpen > lastLinkClose) {
          continue; // We're inside an existing link
        }
        
        // Replace with linked version
        const linkedPhrase = `<a href="/blog/${post.slug}" class="internal-link" data-link-type="auto-generated">${match[1]}</a>`;
        linkedContent = 
          linkedContent.substring(0, match.index) +
          linkedPhrase +
          linkedContent.substring((match.index || 0) + match[0].length);
        
        linksAdded++;
        matchCount++;
        break; // Move to next post
      }
    }
  }
  
  return linkedContent;
}

