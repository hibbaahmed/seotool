import { inngest, type Events } from '@/lib/inngest';
import { createClient } from '@/utils/supabase/server';
import { getAdapter } from '@/lib/integrations/getAdapter';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { marked } from 'marked';

// Helper function to remove excessive bold formatting from HTML
// Keeps bold only for FAQ questions, removes from all other content
function removeExcessiveBoldFromHTML(html: string): string {
  const faqQuestionPlaceholders: string[] = [];
  let placeholderIndex = 0;
  
  const faqQuestionPatterns = [
    /<p[^>]*>\s*<(strong|b)[^>]*>\s*Q[:\\.]\s+([^<]+)<\/(strong|b)>\s*<\/p>/gi,
    /<(strong|b)[^>]*>\s*Q[:\\.]\s+([^<]+)<\/(strong|b)>/gi
  ];
  
  for (const pattern of faqQuestionPatterns) {
    html = html.replace(pattern, (match) => {
      if (match.includes('__FAQ_QUESTION_')) {
        return match;
      }
      const placeholder = `__FAQ_QUESTION_${placeholderIndex}__`;
      faqQuestionPlaceholders.push(match);
      placeholderIndex++;
      return placeholder;
    });
  }
  
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gis, '$1');
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gis, '$1');
  
  faqQuestionPlaceholders.forEach((question, index) => {
    html = html.replace(`__FAQ_QUESTION_${index}__`, question);
  });
  
  return html;
}

// Helper function to add inline spacing styles to HTML
function addInlineSpacing(html: string): string {
  const iframePlaceholders: string[] = [];
  const iframeRegex = /<iframe[^>]*>(?:.*?<\/iframe>|)/gis;
  const embedRegex = /<embed[^>]*\/?>/gis;
  const objectRegex = /<object[^>]*>.*?<\/object>/gis;
  
  html = html.replace(iframeRegex, (match) => {
    if (match.trim()) {
      const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
      iframePlaceholders.push(match);
      return placeholder;
    }
    return match;
  });
  
  html = html.replace(embedRegex, (match) => {
    const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
    iframePlaceholders.push(match);
    return placeholder;
  });
  
  html = html.replace(objectRegex, (match) => {
    const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
    iframePlaceholders.push(match);
    return placeholder;
  });
  
  html = html.replace(/<p>/gi, '<p style="margin-top: 1.5em; margin-bottom: 1.5em; line-height: 1.75;">');
  html = html.replace(/<h2>/gi, '<h2 style="margin-top: 2em; margin-bottom: 1em; font-weight: 700;">');
  html = html.replace(/<h3>/gi, '<h3 style="margin-top: 1.75em; margin-bottom: 0.875em; font-weight: 700;">');
  html = html.replace(/<h4>/gi, '<h4 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h5>/gi, '<h5 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h6>/gi, '<h6 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  
  // Add professional styling to tables
  html = html.replace(/<table>/gi, '<table style="margin-top: 2rem; margin-bottom: 2rem; width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); font-size: 15px; border: none;">');
  html = html.replace(/<thead>/gi, '<thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">');
  html = html.replace(/<th>/gi, '<th style="color: white; font-weight: 600; text-align: left; padding: 16px 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border: none;">');
  html = html.replace(/<td>/gi, '<td style="padding: 16px 20px; color: #374151; line-height: 1.6; border: none; border-bottom: 1px solid #e5e7eb;">');
  html = html.replace(/<tr>/gi, '<tr style="transition: background-color 0.2s ease;">');
  
  html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
  
  iframePlaceholders.forEach((iframe, index) => {
    html = html.replace(`__IFRAME_PLACEHOLDER_${index}__`, iframe);
  });
  
  return html;
}

// Helper function to extract title and clean content for WordPress publishing
// Matches the exact logic from the original API route
function extractTitleAndContentForWordPress(contentOutput: string, keywordText: string): { title: string; cleanedContent: string } {
  console.log(`🔍 extractTitleAndContentForWordPress: Analyzing content (${contentOutput.length} chars)`);
  
  let extractedTitle: string | null = null;
  
  // Check if content is already cleaned (no markers, has multiple headings)
  const hasContentMarkers = /(?:^|\n)(?:\d+\.?\s*)?\*\*(?:Title|Meta Description|Content)\*\*/i.test(contentOutput);
  const hasTitleLabels = /(?:^|\n)(?:Title|Meta Description):\s/i.test(contentOutput);
  const hasMultipleHeadings = (contentOutput.match(/^##\s+/gm) || []).length >= 3;
  const hasSubstantialContent = contentOutput.length > 2000;
  const looksLikeCleanMarkdown = hasMultipleHeadings && hasSubstantialContent && !hasContentMarkers && !hasTitleLabels;
  
  // If content is already cleaned, extract title from H1 and return content as-is
  // Make this check more lenient to avoid re-processing already-cleaned content
  const hasAnyHeadings = (contentOutput.match(/^##\s+/gm) || []).length >= 1;
  const hasH1 = /^#\s+/m.test(contentOutput);
  
  if (looksLikeCleanMarkdown || (!hasContentMarkers && !hasTitleLabels) || (hasAnyHeadings || hasH1)) {
    console.log(`✅ Content appears already cleaned (${contentOutput.length} chars, ${(contentOutput.match(/^##\s+/gm) || []).length} H2 headings), extracting title from H1`);
    
    // Extract title from first H1
    const h1Match = contentOutput.match(/^#\s+([^\n]+)/m);
    if (h1Match && h1Match[1]) {
      const h1Title = h1Match[1].trim();
      // Accept any H1 that's not a section marker
      // This allows AI-generated titles that include the keyword
      if (h1Title.length > 5 && 
          !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction)$/i)) {
        extractedTitle = h1Title;
      }
    }
    
    // Fallback to keyword if no H1 found
    if (!extractedTitle) {
      extractedTitle = keywordText;
    }
    
    console.log(`✅ Using cleaned content as-is WITHOUT any processing. Title: ${extractedTitle}, Content length: ${contentOutput.length} chars`);
    console.log(`📊 Returning full content: ${contentOutput.length} characters`);
    return {
      title: extractedTitle,
      cleanedContent: contentOutput.trim()
    };
  }
  
  console.log(`⚠️ Content has markers, proceeding with extraction`);
  
  // Priority 1: Extract from Title section with comprehensive patterns
  const titlePatterns = [
    /(?:^|\n)\d+\.\s*\*\*Title\*\*[:\s]*\n\s*([^\n]+?)(?:\n|$)/i,
    /(?:^|\n)\*\*Title\*\*[:\s]*\n\s*([^\n]+?)(?:\n|$)/i,
    /(?:^|\n)1\.\s*\*\*Title\*\*[:\s]*\n\s*([^\n]+?)(?:\n|$)/i,
    /(?:^|\n)Title:\s*"?([^"\n]+?)"?\s*(?:\n|$)/i,
    /(?:^|\n)\*\*Title\*\*:\s*([^\n]+?)(?:\n|$)/i,
    /Title[:\s]+\*\*([^\n]+?)\*\*/i,
    /Title[:\s]+"([^"]+?)"/i,
    /Title[:\s]+'([^']+?)'/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = contentOutput.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/^["']|["']$/g, '').replace(/^\*\*|\*\*$/g, '');
      // Accept titles that are longer than just the keyword itself (indicates added value)
      // Only reject if it's literally just "title" or is suspiciously short
      if (candidate.length > 5 && candidate.toLowerCase() !== 'title') {
        extractedTitle = candidate;
        break;
      }
    }
  }
  
  // Priority 2: Extract from H1 in content section
  if (!extractedTitle) {
    const contentSectionMatch = contentOutput.match(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/i);
    if (contentSectionMatch) {
      const afterContent = contentOutput.substring(contentSectionMatch.index! + contentSectionMatch[0].length);
      const h1Match = afterContent.match(/^#\s+([^\n]+)/m);
      if (h1Match && h1Match[1]) {
        const h1Title = h1Match[1].trim();
        // Accept any H1 that's not a section marker
        if (h1Title.length > 5 && 
            !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction)$/i)) {
          extractedTitle = h1Title;
        }
      }
    }
  }
  
  // Priority 3: Try to find any H1 in the content
  if (!extractedTitle) {
    const h1Patterns = [
      /(?:^|\n)#\s+([^\n]+?)(?:\n|$)/gm,
      /#\s+([^\n]+?)(?:\n|$)/gm
    ];
    for (const pattern of h1Patterns) {
      const matches = [...contentOutput.matchAll(pattern)];
      for (const match of matches) {
        if (match && match[1]) {
          const h1Title = match[1].trim();
          // Accept any H1 that's not a section marker (use $ to match end of string)
          if (h1Title.length > 5 && 
              !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction|\d+\.)$/i)) {
            extractedTitle = h1Title;
            break;
          }
        }
      }
      if (extractedTitle) break;
    }
  }
  
  // Final fallback: use keyword
  if (!extractedTitle) {
    extractedTitle = keywordText;
  }
  
  console.log(`✅ Extracted title: ${extractedTitle}`);
  
  // Extract and clean content
  let cleaned = contentOutput;
  cleaned = cleaned.replace(/^\d+\.?\s*\*\*Title\*\*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*Title:.*$/gmi, '');
  cleaned = cleaned.replace(/^\*\*Title\*\*[:\s]*.*$/gmi, '');
  cleaned = cleaned.replace(/^Title:\s*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*\*\*Meta Description\*\*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*Meta Description:.*$/gmi, '');
  cleaned = cleaned.replace(/^\*\*Meta Description\*\*[:\s]*.*$/gmi, '');
  cleaned = cleaned.replace(/^Meta Description:\s*.*$/gmi, '');
  cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n]+/gi, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Title:\s*[^\n]+/gim, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Meta Description:\s*[^\n]+/gim, '');
  
  // Extract Content section - but be more careful to get ALL content
  const contentPatterns = [
    /(?:^|\n)\d+\.?\s*\*\*Content\*\*[:\s]*\n?(.*)$/is,
    /(?:^|\n)\*\*Content\*\*[:\s]*\n?(.*)$/is,
    /(?:^|\n)3\.\s+\*\*Content\*\*[:\s]*\n?(.*)$/is
  ];
  
  let extractedContent = '';
  let foundContentMarker = false;
  
  for (const pattern of contentPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      extractedContent = match[1].trim();
      foundContentMarker = true;
      console.log(`✅ Found content marker. Extracted length: ${extractedContent.length} chars`);
      break;
    }
  }
  
  // If no Content section found, use everything after removing metadata
  if (!extractedContent || !foundContentMarker) {
    console.log(`⚠️ No content marker found, using cleaned content as-is (${cleaned.length} chars)`);
    extractedContent = cleaned.trim();
  }
  
  console.log(`📊 Final extracted content length: ${extractedContent.length} characters`);
  
  if (extractedContent.length < 1000) {
    console.warn(`⚠️ WARNING: Extracted content is very short (${extractedContent.length} chars)! This might indicate a problem.`);
  }
  
  // Remove duplicate titles at the start
  const lines = extractedContent.split('\n');
  let startIndex = 0;
  let foundFirstTitle = false;
  const foundTitles: string[] = [];
  
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    if (line.match(/^#\s+.+$/)) {
      const titleText = line.replace(/^#\s+/, '').trim();
      if (!foundFirstTitle) {
        foundFirstTitle = true;
        foundTitles.push(titleText);
        startIndex = i + 1;
      } else {
        if (foundTitles.length > 0 && (titleText === foundTitles[0] || titleText.toLowerCase() === foundTitles[0].toLowerCase())) {
          startIndex = i + 1;
          continue;
        }
        if (titleText.length > 10 && titleText.length < 100) {
          startIndex = i + 1;
          continue;
        }
      }
    } else if (line && !line.startsWith('#') && !line.match(/^\d+\./) && !line.startsWith('*')) {
      if (line.length > 10 && line.length < 150 && !line.includes('. ') && !line.match(/^[a-z]/)) {
        if (foundTitles.length > 0 && (line === foundTitles[0] || line.toLowerCase() === foundTitles[0].toLowerCase())) {
          startIndex = i + 1;
          continue;
        }
        if (!foundFirstTitle && line.length < 100) {
          foundTitles.push(line);
          foundFirstTitle = true;
          startIndex = i + 1;
          continue;
        }
      }
      if (line.length > 50 || line.match(/^[a-z]/) || line.includes('. ')) {
        break;
      }
    }
  }
  
  while (startIndex < lines.length && lines[startIndex].trim() === '') {
    startIndex++;
  }
  
  extractedContent = lines.slice(startIndex).join('\n');
  
  // Remove remaining numbered sections and clean up
  extractedContent = extractedContent.replace(/^\d+\.?\s*\*\*[^*]+\*\*.*$/gmi, '');
  extractedContent = extractedContent.replace(/^\d+\.?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*:.*$/gmi, '');
  extractedContent = extractedContent.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*$/gmi, '');
  extractedContent = extractedContent.replace(/^\*\*(?:Title|Meta Description|Content|SEO Suggestions|Image Suggestions|Call-to-Action)\*\*\s*$/gmi, '');
  extractedContent = extractedContent.replace(/Title:\s*[^M]+Meta Description:\s*[^\n]+/gi, '');
  extractedContent = extractedContent.replace(/(?:^|\n)\s*Title:\s*[^\n]+/gim, '');
  extractedContent = extractedContent.replace(/(?:^|\n)\s*Meta Description:\s*[^\n]+/gim, '');
  extractedContent = extractedContent.replace(/\n*\n?Internal link anchor ideas:[\s\S]*$/gmi, '');
  extractedContent = extractedContent.replace(/\n*\n?Image suggestions?:[\s\S]*$/gmi, '');
  extractedContent = extractedContent.replace(/\n*\n?Internal link[^:]*:[\s\S]*$/gmi, '');
  extractedContent = extractedContent.replace(/\n+SEO Suggestions:?[\s\S]*$/gmi, '');
  extractedContent = extractedContent.replace(/\n(?:##\s*)?Key Takeaways:?\s*[\s\S]*?(?=\n##\s|$)/gmi, '\n');
  extractedContent = extractedContent.replace(/^\s*\[Call-to-Action\]:.*$/gmi, '');
  extractedContent = extractedContent.replace(/\n##\s*Table of Contents[\s\S]*?(?=\n##\s|$)/gmi, '\n');
  extractedContent = extractedContent.replace(/\n(?:\s*[–\-]\s*["'“][^"'”]+["'”]\s*\n?)+\s*$/g, '\n');
  extractedContent = extractedContent.replace(/^\s*##\s*$/gmi, '');
  extractedContent = extractedContent.replace(/^###\s+\*\*(.+?)\*\*\s*$/gmi, '### $1');
  extractedContent = extractedContent.replace(/^##\s+\*\*(.+?)\*\*\s*$/gmi, '## $1');
  
  // Remove repetitive content after conclusion
  // Find the conclusion heading and keep only the conclusion section (first substantial paragraph)
  const conclusionRegex = /(?:^|\n)##\s+Conclusion\s*\n/i;
  const conclusionMatch = extractedContent.match(conclusionRegex);
  
  if (conclusionMatch && conclusionMatch.index !== undefined) {
    const conclusionStart = conclusionMatch.index;
    const afterConclusionStart = conclusionStart + conclusionMatch[0].length;
    const afterConclusion = extractedContent.substring(afterConclusionStart);
    
    // Find the first substantial paragraph (ending with double newline or end of string)
    // This is the main conclusion paragraph
    const firstParagraphMatch = afterConclusion.match(/^(.+?)(?:\n\n|\n##\s|$)/s);
    
    if (firstParagraphMatch && firstParagraphMatch.index !== undefined) {
      const firstParaEnd = afterConclusionStart + firstParagraphMatch.index + firstParagraphMatch[0].length;
      
      // Check if there's repetitive content after the first paragraph
      const afterFirstPara = afterConclusion.substring(firstParagraphMatch[0].length);
      const repetitivePattern = /^(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?:\n|$)/gmi;
      
      if (afterFirstPara.match(repetitivePattern)) {
        // Remove everything after the first conclusion paragraph
        extractedContent = extractedContent.substring(0, firstParaEnd).trim();
      } else {
        // Keep first 2 paragraphs if they're substantial and not repetitive
        const paragraphMatches = afterConclusion.match(/.+?(?=\n\n|\n##\s|$)/gs) || [];
        let conclusionEnd = conclusionStart + conclusionMatch[0].length;
        for (let i = 0; i < Math.min(2, paragraphMatches.length); i++) {
          const paraText = paragraphMatches[i];
          if (paraText && paraText.trim().length > 20) {
            const paraIndex = afterConclusion.indexOf(paraText);
            if (paraIndex !== -1) {
              conclusionEnd = afterConclusionStart + paraIndex + paraText.length;
            }
          }
        }
        extractedContent = extractedContent.substring(0, conclusionEnd).trim();
      }
    }
    
    // Final cleanup: Remove any remaining repetitive bullet-like sentences
    extractedContent = extractedContent.replace(/\n(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?=\n|$)/gi, '');
  }
  
  // DON'T truncate after conclusion - keep ALL content including FAQ sections
  // Only remove truly repetitive promotional boilerplate at the very end
  const contentLength = extractedContent.length;
  const endThreshold = Math.floor(contentLength * 0.8); // Last 20% of content
  
  // Only remove metadata sections that appear at the VERY END
  const stopKeywords = [
    '\n4. **SEO Suggestions',
    '\n**SEO Suggestions**',
    '\n## SEO Suggestions',
    '\n4. **Image Suggestions',
    '\n**Image Suggestions**',
    '\n## Image Suggestions',
    '\n5. **Call-to-Action',
    '\n**Call-to-Action**',
    '\n## Call-to-Action'
  ];
  
  for (const stopKeyword of stopKeywords) {
    const index = extractedContent.indexOf(stopKeyword);
    if (index !== -1 && index >= endThreshold) {
      // Make sure there's no FAQ or other legitimate content before this
      const beforeKeyword = extractedContent.substring(0, index);
      const afterKeyword = extractedContent.substring(index + stopKeyword.length);
      const hasFAQBefore = /##\s+FAQ/i.test(beforeKeyword);
      const isMetadataSection = afterKeyword.trim().length < 200 || afterKeyword.trim().match(/^\s*$/);
      
      if (!hasFAQBefore && isMetadataSection) {
        extractedContent = extractedContent.substring(0, index);
        break;
      }
    }
  }
  
  // Remove repetitive promotional text only at the very end (last 500 chars)
  const last500Chars = extractedContent.substring(Math.max(0, extractedContent.length - 500));
  const repetitivePromoPattern = /(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?:\n|$)/gi;
  const promoMatches = [...last500Chars.matchAll(repetitivePromoPattern)];
  
  if (promoMatches.length >= 2) {
    const lastHeadingMatch = extractedContent.match(/(?:^|\n)(##\s+[^\n]+)(?:\n|$)/g);
    if (lastHeadingMatch && lastHeadingMatch.length > 0) {
      const lastHeading = lastHeadingMatch[lastHeadingMatch.length - 1];
      const lastHeadingIndex = extractedContent.lastIndexOf(lastHeading);
      
      if (lastHeadingIndex !== -1) {
        const afterLastHeading = extractedContent.substring(lastHeadingIndex + lastHeading.length);
        const promoTextLength = afterLastHeading.match(repetitivePromoPattern)?.join('').length || 0;
        if (promoTextLength > afterLastHeading.length * 0.5) {
          const headingEnd = lastHeadingIndex + lastHeading.length;
          const firstParaAfterHeading = afterLastHeading.match(/^(.+?)(?:\n\n|\n##\s|$)/s);
          if (firstParaAfterHeading) {
            const keepUpTo = headingEnd + firstParaAfterHeading.index! + firstParaAfterHeading[0].length;
            extractedContent = extractedContent.substring(0, keepUpTo).trim();
          }
        }
      }
    }
  }
  
  // Remove standalone repetitive promotional sentences only at the very end
  const contentLines = extractedContent.split('\n');
  const cleanedLines: string[] = [];
  let foundFAQ = false;
  
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i];
    const trimmed = line.trim();
    
    if (trimmed.match(/^##\s+FAQ/i)) {
      foundFAQ = true;
      cleanedLines.push(line);
      continue;
    }
    
    if (foundFAQ) {
      cleanedLines.push(line);
      continue;
    }
    
    const isPromoLine = /^(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*$/i.test(trimmed);
    
    if (isPromoLine && i > contentLines.length * 0.9 && !foundFAQ && !trimmed.match(/^[-*>\d]/)) {
      continue;
    }
    
    cleanedLines.push(line);
  }
  
  extractedContent = cleanedLines.join('\n');
  
  // Clean up whitespace and apply paragraph spacing
  extractedContent = extractedContent
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim();
  
  // Apply paragraph spacing
  const linesArray = extractedContent.split('\n');
  const spacedLines: string[] = [];
  
  for (let i = 0; i < linesArray.length; i++) {
    const currentLine = linesArray[i];
    const currentTrimmed = currentLine.trim();
    
    spacedLines.push(currentLine);
    
    if (i < linesArray.length - 1) {
      const nextLine = linesArray[i + 1];
      const nextTrimmed = nextLine.trim();
      
      if (!currentTrimmed) {
        continue;
      }
      
      const isCurrentParagraph = currentTrimmed && 
          !currentTrimmed.startsWith('#') &&
          !currentTrimmed.startsWith('![') &&
          !currentTrimmed.startsWith('>') &&
          !currentTrimmed.startsWith('|') &&
          !currentTrimmed.startsWith('- ') &&
          !currentTrimmed.startsWith('* ') &&
          !/^\d+\.\s/.test(currentTrimmed);
      
      const isNextParagraph = nextTrimmed &&
          !nextTrimmed.startsWith('#') &&
          !nextTrimmed.startsWith('![') &&
          !nextTrimmed.startsWith('>') &&
          !nextTrimmed.startsWith('|') &&
          !nextTrimmed.startsWith('- ') &&
          !nextTrimmed.startsWith('* ') &&
          !/^\d+\.\s/.test(nextTrimmed);
      
      if (isCurrentParagraph && isNextParagraph) {
        let hasBlankLine = false;
        for (let j = i + 1; j < linesArray.length && j <= i + 2; j++) {
          if (!linesArray[j].trim()) {
            hasBlankLine = true;
            break;
          }
          if (linesArray[j].trim() && 
              (linesArray[j].trim().startsWith('#') || 
               linesArray[j].trim().startsWith('![') ||
               linesArray[j].trim().startsWith('>') ||
               linesArray[j].trim().startsWith('|') ||
               linesArray[j].trim().startsWith('- ') ||
               linesArray[j].trim().startsWith('* ') ||
               /^\d+\.\s/.test(linesArray[j].trim()))) {
            break;
          }
        }
        
        if (!hasBlankLine) {
          spacedLines.push('');
        }
      }
    }
  }
  
  extractedContent = spacedLines.join('\n');
  extractedContent = extractedContent.replace(/\n{3,}/g, '\n\n');
  extractedContent = extractedContent.replace(/^[\s>*]*Here is a [^\n]*?blog post[^\n]*?:\s*\n?/i, '');
  
  if (extractedTitle) {
    const esc = extractedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    extractedContent = extractedContent.replace(new RegExp(`^#\\s+${esc}\\s*$`, 'gmi'), '');
  }
  
  return { title: extractedTitle, cleanedContent: extractedContent };
}


// Function to schedule a blog post for publishing
export const scheduleBlogPost = inngest.createFunction(
  { id: 'schedule-blog-post' },
  { event: 'blog/post.schedule' },
  async ({ event, step }) => {
    const { postId, scheduledDate, scheduledTime, platform, title, content, userId, imageUrls, notes } = event.data;

    // Calculate the exact publish time
    const publishDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    // If the scheduled time is in the past, publish immediately
    if (publishDateTime <= now) {
      return await step.run('publish-immediately', async () => {
        await inngest.send({
          name: 'blog/post.publish',
          data: {
            postId,
            platform,
            title,
            content,
            userId,
            imageUrls,
          },
        });
      });
    }

    // Schedule the post for future publishing
    await step.sleepUntil('schedule-publish', publishDateTime);
    
    await inngest.send({
      name: 'blog/post.publish',
      data: {
        postId,
        platform,
        title,
        content,
        userId,
        imageUrls,
      },
    });
  }
);

// Function to publish a blog post
export const publishBlogPost = inngest.createFunction(
  { id: 'publish-blog-post' },
  { event: 'blog/post.publish' },
  async ({ event, step }) => {
    const { postId, platform, title, content, userId, imageUrls, publishUrl } = event.data;

    // Update post status to published
    const supabase = await createClient();
    
    const updateResult = await step.run('update-post-status', async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'published',
          publish_url: publishUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating post status:', error);
        throw new Error(`Failed to update post status: ${error.message}`);
      }

      return data;
    });

    // Platform-specific publishing logic
    const publishResult = await step.run('publish-to-platform', async () => {
      switch (platform) {
        case 'wordpress':
          return await publishToWordPress(title, content, imageUrls);
        case 'medium':
          return await publishToMedium(title, content, imageUrls);
        case 'linkedin':
          return await publishToLinkedIn(title, content, imageUrls);
        case 'twitter':
          return await publishToTwitter(title, content, imageUrls);
        case 'blog':
        default:
          return await publishToBlog(title, content, imageUrls);
      }
    });

    // Update post with publish URL if available
    if (publishResult?.url) {
      await step.run('update-publish-url', async () => {
        await supabase
          .from('scheduled_posts')
          .update({ publish_url: publishResult.url })
          .eq('id', postId)
          .eq('user_id', userId);
      });
    }

    return {
      success: true,
      postId,
      platform,
      publishUrl: publishResult?.url,
    };
  }
);

// Function to cancel a scheduled post
export const cancelBlogPost = inngest.createFunction(
  { id: 'cancel-blog-post' },
  { event: 'blog/post.cancel' },
  async ({ event, step }) => {
    const { postId, userId } = event.data;

    const supabase = await createClient();

    return await step.run('cancel-post', async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling post:', error);
        throw new Error(`Failed to cancel post: ${error.message}`);
      }

      return data;
    });
  }
);

// Platform-specific publishing functions
async function publishToWordPress(title: string, content: string, imageUrls?: string[]) {
  // Implement WordPress publishing logic
  // This would integrate with WordPress REST API
  console.log('Publishing to WordPress:', title);
  
  // Example implementation:
  // const response = await fetch('https://your-wordpress-site.com/wp-json/wp/v2/posts', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.WORDPRESS_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     title,
  //     content,
  //     status: 'publish',
  //   }),
  // });
  
  return { url: `https://your-wordpress-site.com/posts/${Date.now()}` };
}

async function publishToMedium(title: string, content: string, imageUrls?: string[]) {
  // Implement Medium publishing logic
  console.log('Publishing to Medium:', title);
  
  // Example implementation:
  // const response = await fetch('https://api.medium.com/v1/posts', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.MEDIUM_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     title,
  //     contentFormat: 'html',
  //     content,
  //     publishStatus: 'public',
  //   }),
  // });
  
  return { url: `https://medium.com/@your-username/${Date.now()}` };
}

async function publishToLinkedIn(title: string, content: string, imageUrls?: string[]) {
  // Implement LinkedIn publishing logic
  console.log('Publishing to LinkedIn:', title);
  
  // Example implementation:
  // const response = await fetch('https://api.linkedin.com/v2/shares', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.LINKEDIN_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
  //     lifecycleState: 'PUBLISHED',
  //     specificContent: {
  //       'com.linkedin.ugc.ShareContent': {
  //         shareCommentary: {
  //           text: content,
  //         },
  //         shareMediaCategory: 'NONE',
  //       },
  //     },
  //   }),
  // });
  
  return { url: `https://linkedin.com/feed/update/${Date.now()}` };
}

async function publishToTwitter(title: string, content: string, imageUrls?: string[]) {
  // Implement Twitter/X publishing logic
  console.log('Publishing to Twitter:', title);
  
  // Example implementation:
  // const response = await fetch('https://api.twitter.com/2/tweets', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.TWITTER_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     text: content.substring(0, 280), // Twitter character limit
  //   }),
  // });
  
  return { url: `https://twitter.com/your-username/status/${Date.now()}` };
}

async function publishToBlog(title: string, content: string, imageUrls?: string[]) {
  // For your own blog platform
  console.log('Publishing to blog:', title);
  
  // This could save to your own database, generate static files, etc.
  return { url: `https://your-blog.com/posts/${Date.now()}` };
}

// Daily cron job to check and generate content for scheduled keywords at 6 AM
export const dailyContentGeneration = inngest.createFunction(
  { 
    id: 'daily-content-generation',
    name: 'Daily Content Generation at 6 AM'
  },
  { cron: '0 6 * * *' }, // Run every day at 6 AM
  async ({ event, step }) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🕐 Daily content generation check for ${today}`);

    // Get all keywords scheduled for today
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const keywords = await step.run('fetch-scheduled-keywords', async () => {
      const { data, error } = await supabase
        .from('discovered_keywords')
        .select('*')
        .eq('scheduled_date', today)
        .eq('scheduled_for_generation', true)
        .eq('generation_status', 'pending');

      if (error) {
        console.error('Error fetching scheduled keywords:', error);
        return [];
      }

      console.log(`📋 Found ${data?.length || 0} keywords to generate for ${today}`);
      return data || [];
    });

    // Generate content for each keyword
    for (const keyword of keywords) {
      await step.run(`generate-content-${keyword.id}`, async () => {
        try {
          console.log(`🚀 Generating content for keyword: ${keyword.keyword}`);
          
          // Send event to generate content for this keyword
          await inngest.send({
            name: 'calendar/keyword.generate',
            data: {
              keywordId: keyword.id,
              keyword: keyword.keyword,
              userId: keyword.user_id,
              relatedKeywords: keyword.related_keywords,
            },
          });
          
          return { success: true, keyword: keyword.keyword };
        } catch (error) {
          console.error(`Error generating content for keyword ${keyword.id}:`, error);
          
          // Update keyword status to failed
          await supabase
            .from('discovered_keywords')
            .update({ generation_status: 'failed' })
            .eq('id', keyword.id);
          
          return { success: false, keyword: keyword.keyword, error };
        }
      });
    }

    return {
      date: today,
      keywordsProcessed: keywords.length,
    };
  }
);

// Event-based scheduling: schedule a single keyword at an exact time
export const scheduleKeywordGeneration = inngest.createFunction(
  {
    id: 'schedule-keyword-generation',
    name: 'Schedule Keyword Generation at Specific Time'
  },
  { event: 'calendar/keyword.schedule' },
  async ({ event, step }) => {
    const { keywordId, keyword, userId, runAtISO, relatedKeywords } = event.data;

    // Sleep until the specified datetime
    await step.sleepUntil('wait-until-scheduled-time', new Date(runAtISO));

    // Then trigger the actual generation
    await inngest.send({
      name: 'calendar/keyword.generate',
      data: { keywordId, keyword, userId, relatedKeywords }
    });

    return { scheduledFor: runAtISO, keywordId };
  }
);

// Function to generate content for a single keyword
// This function does all the work directly in Inngest to avoid Vercel timeouts
export const generateKeywordContent = inngest.createFunction(
  { 
    id: 'generate-keyword-content',
    name: 'Generate Content for Keyword',
    retries: 2, // Retry up to 2 times on failure (Inngest will handle retries)
  },
  { event: 'calendar/keyword.generate' },
  async ({ event, step }) => {
    const { keywordId, keyword, userId, relatedKeywords } = event.data;

    console.log(`🚀 Starting content generation for: ${keyword} (ID: ${keywordId})`);

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 1: Verify user and fetch keyword data
    const { user, keywordData } = await step.run('fetch-keyword-data', async () => {
      // Verify user exists
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Fetch keyword data
      const { data, error } = await supabase
        .from('discovered_keywords')
        .select('*')
        .eq('id', keywordId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        throw new Error(`Keyword not found: ${keywordId}`);
      }

      // Update status to generating
      await supabase
        .from('discovered_keywords')
        .update({ generation_status: 'generating' })
        .eq('id', keywordId);

      return { user: userData.user, keywordData: data };
    });

    const keywordText = keywordData.keyword || keyword;

    // Step 1.5: Check credits before generation
    const requiredCredits = 1;
    const { currentCredits } = await step.run('check-credits', async () => {
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (creditsError || !creditsData) {
        throw new Error('Could not fetch user credits');
      }

      const currentCredits = creditsData.credits || 0;

      if (currentCredits < requiredCredits) {
        throw new Error(`Insufficient credits. You need ${requiredCredits} credit(s) to generate content. You currently have ${currentCredits} credit(s).`);
      }

      return { currentCredits };
    });

    // Step 2: Fetch related keywords
    const { primaryKeywords, secondaryKeywords, longTailKeywords } = await step.run('fetch-related-keywords', async () => {
      let primary: string[] = [];
      let secondary: string[] = [];
      let longTail: string[] = [];

      try {
        // Check if we have keyword_type data
        if ((keywordData as any).keyword_type) {
          const { data: relatedData } = await supabase
            .from('discovered_keywords')
            .select('keyword, keyword_type, search_volume')
            .or(`parent_keyword_id.eq.${keywordId},id.eq.${keywordId}`)
            .order('search_volume', { ascending: false });
          
          if (relatedData && relatedData.length > 0) {
            relatedData.forEach((kw: any) => {
              if (kw.keyword_type === 'primary') {
                primary.push(kw.keyword);
              } else if (kw.keyword_type === 'secondary') {
                secondary.push(kw.keyword);
              } else if (kw.keyword_type === 'long-tail') {
                longTail.push(kw.keyword);
              }
            });
          }
        }
        
        // If no classified keywords, try to fetch from DataForSEO
        if (primary.length === 0 && secondary.length === 0 && longTail.length === 0) {
          try {
            const { fetchKeywordsFromDataForSEO, saveKeywordsToDatabase } = await import('@/lib/dataforseo-keywords');
            
            const keywordSet = await fetchKeywordsFromDataForSEO(keywordText, 2840, {
              includeQuestions: true,
              includeRelated: true,
              maxResults: 30
            });
            
            primary = keywordSet.primary.map((k: any) => k.keyword);
            secondary = keywordSet.secondary.map((k: any) => k.keyword).slice(0, 10);
            longTail = keywordSet.longTail.map((k: any) => k.keyword).slice(0, 15);
            
            // Save keywords to database for future use
            if ((keywordData as any).onboarding_profile_id) {
              await saveKeywordsToDatabase(
                keywordSet,
                (keywordData as any).onboarding_profile_id,
                userId
              );
            }
          } catch (dataForSeoError) {
            console.warn('⚠️ DataForSEO fetch failed, using related_keywords field:', dataForSeoError);
            secondary = (keywordData as any).related_keywords || [];
          }
        }
        
        // Ensure primary keyword is included
        if (!primary.includes(keywordText)) {
          primary.unshift(keywordText);
        }
      } catch (error) {
        console.warn('⚠️ Error fetching related keywords:', error);
        secondary = (keywordData as any).related_keywords || [];
        if (primary.length === 0) {
          primary = [keywordText];
        }
      }

      return { primaryKeywords: primary, secondaryKeywords: secondary, longTailKeywords: longTail };
    });

    // Step 3: Search for and upload images
    const uploadedImageUrls = await step.run('upload-images', async () => {
      let candidateImages: string[] = [];
      
      try {
        // Search for images via Tavily
        if (process.env.TAVILY_API_KEY) {
          const tavilyResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query: keywordText,
              search_depth: 'basic',
              include_images: true,
              max_results: 5
            })
          });
          
          if (tavilyResponse.ok) {
            const tavilyData = await tavilyResponse.json();
            if (Array.isArray(tavilyData.images)) {
              candidateImages = tavilyData.images.filter(Boolean);
            }
          }
        }

        // Use demo images if no images found
        if (candidateImages.length === 0) {
          candidateImages = [
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800'
          ];
        }

        // Upload to Supabase storage
        const uploadedUrls: string[] = [];
        const storage = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        for (let i = 0; i < Math.min(candidateImages.length, 5); i++) {
          try {
            const externalUrl = candidateImages[i];
            const resp = await fetch(externalUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': new URL(externalUrl).origin,
              },
              cache: 'no-store',
            });
            
            if (!resp.ok) continue;

            let contentType = resp.headers.get('Content-Type') || '';
            if (!contentType || contentType === 'application/octet-stream') {
              const urlPath = new URL(externalUrl).pathname.toLowerCase();
              if (urlPath.endsWith('.png')) contentType = 'image/png';
              else if (urlPath.endsWith('.gif')) contentType = 'image/gif';
              else if (urlPath.endsWith('.webp')) contentType = 'image/webp';
              else contentType = 'image/jpeg';
            }

            const blob = await resp.blob();
            if (blob.type && blob.type !== 'application/octet-stream') {
              const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
              if (validImageTypes.includes(blob.type)) {
                contentType = blob.type;
              }
            }

            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!validImageTypes.includes(contentType)) {
              contentType = 'image/jpeg';
            }

            const id = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
            const typeToExt: Record<string, string> = { 
              'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 
              'image/webp': 'webp', 'image/gif': 'gif' 
            };
            const ext = typeToExt[contentType.toLowerCase()] || 'jpg';
            const path = `user_uploads/${userId}/${id}.${ext}`;

            const uploadRes = await storage.storage.from('photos').upload(path, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType,
            });
            
            if (uploadRes.error) continue;

            const { data: pub } = storage.storage.from('photos').getPublicUrl(path);
            if (pub?.publicUrl) {
              uploadedUrls.push(pub.publicUrl);
            }
          } catch (err) {
            console.error(`Error uploading image ${i + 1}:`, err);
            continue;
          }
        }

        return uploadedUrls;
      } catch (error) {
        console.warn('⚠️ Image upload failed:', error);
        return [];
      }
    });

    // Step 4: Search for YouTube videos
    const videos = await step.run('search-youtube-videos', async () => {
      const videoList: Array<{ id: string; title: string; url: string }> = [];
      
      if (process.env.YOUTUBE_API_KEY) {
        try {
          const youtubeResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(keywordText)}&maxResults=3&key=${process.env.YOUTUBE_API_KEY}&videoEmbeddable=true`
          );
          
          if (youtubeResponse.ok) {
            const youtubeData = await youtubeResponse.json();
            if (youtubeData.items && youtubeData.items.length > 0) {
              youtubeData.items.forEach((item: any) => {
                videoList.push({
                  id: item.id.videoId,
                  title: item.snippet.title,
                  url: `https://www.youtube.com/watch?v=${item.id.videoId}`
                });
              });
            }
          }
        } catch (error) {
          console.error('❌ YouTube search error:', error);
        }
      }

      return videoList;
    });

    // Step 5: Fetch user's business information for personalized CTA
    const { businessName, websiteUrl } = await step.run('fetch-business-info', async () => {
      try {
        const { data: profileData } = await supabase
          .from('user_onboarding_profiles')
          .select('business_name, website_url')
          .eq('user_id', userId)
          .single();
        
        if (profileData) {
          return {
            businessName: profileData.business_name || 'our company',
            websiteUrl: profileData.website_url || ''
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch business profile:', error);
      }
      
      return {
        businessName: 'our company',
        websiteUrl: ''
      };
    });
    
    console.log(`✅ Using business name: ${businessName}`);

    // Step 5.5: Fetch user settings for content length preference
    const contentLength = await step.run('fetch-user-settings', async () => {
      try {
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('content_length')
          .eq('user_id', userId)
          .maybeSingle();
        
        return (settingsData?.content_length || 'long') as 'short' | 'medium' | 'long';
      } catch (error) {
        console.warn('⚠️ Could not fetch user settings, using default (long):', error);
        return 'long' as const;
      }
    });

    // Step 6: Generate content using multi-phase generation
    const { generateMultiPhaseContent } = await import('@/lib/multi-phase-generation');
    const { generateKeywordContentPrompt } = await import('@/lib/content-generation-prompts');

    const contentPrompt = generateKeywordContentPrompt({
      keyword: keywordText,
      primaryKeywords,
      secondaryKeywords,
      longTailKeywords,
      contentType: 'blog post',
      targetAudience: 'General audience',
      tone: 'professional',
      imageUrls: uploadedImageUrls,
      businessName,
      websiteUrl,
      contentLength
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    // Break multi-phase generation into separate steps to avoid Vercel timeouts
    // Each step is a separate HTTP request, so Vercel doesn't timeout
    
    // Import helpers from multi-phase-generation
    const { getOutlinePrompt, getSectionsPrompt, getFinalSectionsPrompt, generateSinglePhase } = await import('./multi-phase-generation');
    
    // Phase 1: Generate Outline
    const outline = await step.run('generate-outline', async () => {
      console.log('📋 Phase 1: Generating outline...');
      return await generateSinglePhase(
        getOutlinePrompt(keywordText, contentPrompt, businessName),
        apiKey,
        3000
      );
    });
    console.log(`✅ Phase 1 complete. Outline length: ${outline.length} characters`);

    // Phase 2: Generate Introduction + First 4 sections
    const sections1to4 = await step.run('generate-sections-1-4', async () => {
      console.log('✍️ Phase 2: Writing introduction and sections 1-4...');
      return await generateSinglePhase(
        getSectionsPrompt(keywordText, contentPrompt, outline, '1-4', uploadedImageUrls, videos, 'introduction and first 4 sections'),
        apiKey,
        5000
      );
    });
    const words1to4 = sections1to4.split(/\s+/).length;
    console.log(`✅ Phase 2 complete. ~${words1to4} words`);

    // Phase 3: Generate Sections 5-8
    const sections5to8 = await step.run('generate-sections-5-8', async () => {
      console.log('✍️ Phase 3: Writing sections 5-8...');
      return await generateSinglePhase(
        getSectionsPrompt(keywordText, contentPrompt, outline, '5-8', uploadedImageUrls, videos, 'sections 5-8'),
        apiKey,
        5000
      );
    });
    const words5to8 = sections5to8.split(/\s+/).length;
    console.log(`✅ Phase 3 complete. ~${words5to8} words`);

    // Phase 4: Generate Final Sections, FAQ, Conclusion
    const finalSections = await step.run('generate-final-sections', async () => {
      console.log('✍️ Phase 4: Writing final sections, FAQ, and conclusion...');
      return await generateSinglePhase(
        getFinalSectionsPrompt(keywordText, contentPrompt, outline, uploadedImageUrls, videos, businessName, websiteUrl),
        apiKey,
        8000
      );
    });
    const wordsFinal = finalSections.split(/\s+/).length;
    console.log(`✅ Phase 4 complete. ~${wordsFinal} words`);

    // Combine all phases
    const fullContent = sections1to4 + '\n\n' + sections5to8 + '\n\n' + finalSections;
    const totalWords = words1to4 + words5to8 + wordsFinal;
    console.log(`🎉 Multi-phase generation complete! Total: ~${totalWords} words`);

    const generatedContent = {
      outline,
      sections1to4,
      sections5to8,
      finalSections,
      fullContent,
    };

    // Step 6: Process and clean content (comprehensive cleaning like original API route)
    const processedContent = await step.run('process-content', async () => {
      let fullContent = generatedContent.fullContent;

      // Remove boilerplate opening line
      fullContent = fullContent.replace(/^[\s>*]*Here is a [^\n]*?blog post[^\n]*?:\s*\n?/i, '');
      
      // Remove "Meta Description:" label ANYWHERE in content
      fullContent = fullContent.replace(/Meta Description:\s*[^\n]+/gi, '');
      fullContent = fullContent.replace(/\*\*Meta Description\*\*:?\s*[^\n]+/gi, '');
      fullContent = fullContent.replace(/\d+\.\s*\*\*Meta Description\*\*:?\s*[^\n]+/gi, '');
      
      // Remove "Title:" label ANYWHERE in content
      fullContent = fullContent.replace(/(?:^|\n)#\s+[^\n]*Meta Description[^\n]*/gi, '\n');
      fullContent = fullContent.replace(/(?:^|\n)Title:\s*[^\n]+/gi, '\n');
      fullContent = fullContent.replace(/\*\*Title\*\*:?\s*[^\n]+/gi, '');
      fullContent = fullContent.replace(/\d+\.\s*\*\*Title\*\*:?\s*[^\n]+/gi, '');
      
      // Remove when both appear together ANYWHERE
      fullContent = fullContent.replace(/Title:\s*[^M\n]+Meta Description:\s*[^\n]+/gi, '');
      
      // Remove broken/incomplete image tags
      fullContent = fullContent.replace(/<img\s+src="[^"]*(?:user_uploads\/\d+)?#[^"]*"[^>]*>/gi, '');
      fullContent = fullContent.replace(/<img\s+src="[^"]*"(?!\s*\/>|\s*>)[^>]*/gi, '');
      
      // Remove "Post-Processing and Enhancement" and similar section markers
      fullContent = fullContent.replace(/\n*(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)\n*/gi, '\n');
      
      // Remove instruction markers that shouldn't be in content
      fullContent = fullContent.replace(/\n*#\s*Remaining H2 Sections?\n*/gi, '\n');
      fullContent = fullContent.replace(/\n*#\s*(?:Write|Add|Include)\s+[^\n]+\n*/gi, '\n');
      fullContent = fullContent.replace(/\n*\[(?:Write|Add|Include|Insert|Place)[^\]]*\]\n*/gi, '\n');
      
      // Remove orphaned table headers (tables with only header row, no data)
      fullContent = fullContent.replace(/\|[^|\n]+\|[^|\n]+\|[^\n]*\n\s*\|[-\s]+\|[-\s]+\|[^\n]*\n(?!\s*\|[^-\n])/gm, '');
      
      // Remove standalone table separator lines that got orphaned
      fullContent = fullContent.replace(/^\s*\|[-\s]+\|[-\s]+\|[^\n]*\n/gm, '');
      
      // Fix tables with paragraph text in table rows - extract and place after table
      fullContent = fullContent.replace(/(\n(?:\|[^\n]+\|\n)+)(\|\s*([A-Z][^|]{50,}[.!](?:\s+[A-Z][^|]+[.!])+[^|]*)\s*\|)\n/gm, (match, tableRows, rowWithText, textContent) => {
        const cleanText = textContent.trim();
        return `${tableRows}\n\n${cleanText}\n\n`;
      });
      
      // Remove instruction comments in brackets or parentheses
      fullContent = fullContent.replace(/\[(?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\]]*\]/gi, '');
      fullContent = fullContent.replace(/\((?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\)]*\)/gi, '');

      // Expansion pass: if word count is too low, ask the writer to expand
      // Get minimum word count threshold based on content length preference
      const minWordThreshold = contentLength === 'short' ? 1000 : contentLength === 'medium' ? 2000 : 3800;
      const plainWordCount = fullContent.replace(/[#>*_`|\[\]()*]/g, '').split(/\s+/).filter(Boolean).length;
      if (plainWordCount < minWordThreshold) {
        try {
          const maxWords = contentLength === 'short' ? 1500 : contentLength === 'medium' ? 3000 : 4200;
          console.log(`✏️ Draft length ${plainWordCount} words < ${minWordThreshold}. Requesting expansion to ${minWordThreshold}-${maxWords} words (${contentLength})...`);
          const { generateExpansionPrompt } = await import('@/lib/content-generation-prompts');
          const expansionPrompt = generateExpansionPrompt(fullContent, businessName, websiteUrl, contentLength);

          // Call Claude API directly for expansion (since we're in Inngest, no timeout issues)
          const expandResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 16000,
              temperature: 0.7,
              messages: [
                { role: 'user', content: expansionPrompt }
              ]
            })
          });

          if (expandResponse.ok) {
            const expandData = await expandResponse.json();
            const expanded = expandData.content[0]?.text || '';
            if (expanded && expanded.length > fullContent.length) {
              fullContent = expanded;
              console.log('✅ Expansion applied');
            }
          } else {
            console.warn('⚠️ Expansion request failed');
          }
        } catch (expErr) {
          console.warn('⚠️ Expansion pass error:', expErr);
        }
      }

      // Ensure at least one YouTube video embed if available and none present
      try {
        const hasIframe = /<iframe\s[^>]*src="https:\/\/www\.youtube\.com\/embed\//i.test(fullContent);
        if (!hasIframe && videos && videos.length > 0) {
          const first = videos[0];
          const videoId = first?.id || (first?.url ? String(first.url).split('v=')[1]?.split('&')[0] : '');
          if (videoId) {
            const iframeHtml = `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n\n`;
            const firstH2Idx = fullContent.search(/\n##\s+[^\n]+/);
            if (firstH2Idx !== -1) {
              const h2End = fullContent.indexOf('\n', firstH2Idx + 1);
              const insertAt = h2End !== -1 ? h2End + 1 : fullContent.length;
              fullContent = fullContent.slice(0, insertAt) + iframeHtml + fullContent.slice(insertAt);
              console.log('🎥 Inserted fallback YouTube iframe after first H2');
            } else {
              const firstParaMatch = fullContent.match(/^(.+?)(\n\n|$)/s);
              if (firstParaMatch && typeof firstParaMatch.index === 'number') {
                const insertAt = firstParaMatch[0].length;
                fullContent = fullContent.slice(0, insertAt) + iframeHtml + fullContent.slice(insertAt);
                console.log('🎥 Inserted fallback YouTube iframe after intro');
              } else {
                fullContent += iframeHtml;
                console.log('🎥 Appended fallback YouTube iframe at end');
              }
            }
          }
        }
      } catch (videoInsertErr) {
        console.warn('⚠️ Failed to insert fallback YouTube iframe:', videoInsertErr);
      }

      // Post-process content: normalize spacing and placeholders
      try {
        const { processContentPlaceholders, normalizeContentSpacing } = await import('@/lib/process-content-placeholders');
        fullContent = processContentPlaceholders(fullContent, uploadedImageUrls);
        fullContent = normalizeContentSpacing(fullContent);

        // Remove any in-article Table of Contents sections if present
        fullContent = fullContent.replace(/\n##\s*Table of Contents[\s\S]*?(?=\n##\s|$)/gmi, '\n');
        // Remove standalone '##' lines
        fullContent = fullContent.replace(/^\s*##\s*$/gmi, '');
        // Remove Key Takeaways sections entirely
        fullContent = fullContent.replace(/\n(?:##\s*)?Key Takeaways:?\s*[\s\S]*?(?=\n##\s|$)/gmi, '\n');
        // Remove [Call-to-Action]: placeholder lines
        fullContent = fullContent.replace(/^\s*\[Call-to-Action\]:.*$/gmi, '');
        // Clean up H3 headings with bold markdown (### **Text** -> ### Text)
        fullContent = fullContent.replace(/^###\s+\*\*(.+?)\*\*\s*$/gmi, '### $1');
        // Also clean H2 headings with bold (## **Text** -> ## Text)
        fullContent = fullContent.replace(/^##\s+\*\*(.+?)\*\*\s*$/gmi, '## $1');

        console.log('✨ Content post-processing complete (placeholders, spacing, TOC removed)');
      } catch (processError) {
        console.warn('⚠️ Content post-processing failed (continuing anyway):', processError);
      }

      // Clean up broken/malformed image markdown
      // Remove incomplete image URLs (like those with &#8230; or truncated URLs)
      fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*https?:\/\/[^\s\)]*&#8230[^\s\)]*\)/gi, '');
      fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*https?:\/\/[^\s\)]*\.\.\.[^\s\)]*\)/gi, '');
      fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*[^)]*publi[^)]*\)/gi, '');
      // Remove image markdown with incomplete URLs ending with ; or spaces
      fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*[^)]*\s+;?\s*\)/gi, '');
      // Remove any image markdown that has an incomplete URL (contains special chars that shouldn't be in URLs)
      fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*[^)]*[;&#][^)]*\)/gi, '');

      // Verify images are embedded in the content markdown
      // If not embedded, manually embed them
      const hasEmbeddedImages = /!\[.*?\]\([^)]+\)/.test(fullContent);
      
      if (!hasEmbeddedImages && uploadedImageUrls && uploadedImageUrls.length > 0) {
        console.log('⚠️ No embedded images detected in body, manually embedding...');
        
        let insertPosition = 0;
        const titleMatch = fullContent.match(/#\s+[^\n]+\n\n/);
        if (titleMatch) {
          insertPosition = titleMatch.index! + titleMatch[0].length;
        }

        const afterTitle = fullContent.substring(insertPosition);
        const firstParagraphMatch = afterTitle.match(/^(.+?)(\n\n|$)/s);
        const imageInsertPosition = firstParagraphMatch
          ? insertPosition + firstParagraphMatch[1].length
          : insertPosition;

        const firstImageMarkdown = `\n\n![${keywordText}](${uploadedImageUrls[0]})\n\n`;
        fullContent =
          fullContent.slice(0, imageInsertPosition) +
          firstImageMarkdown +
          fullContent.slice(imageInsertPosition);

        if (uploadedImageUrls.length > 1) {
          const searchStart = imageInsertPosition + firstImageMarkdown.length;
          const h2Pattern = /^##\s+[^\n]+$/gm;
          const h2Matches: RegExpMatchArray[] = [];
          let match;
          const searchContent = fullContent.substring(searchStart);

          while ((match = h2Pattern.exec(searchContent)) !== null) {
            h2Matches.push(match);
          }

          if (h2Matches.length > 0) {
            const imagesToPlace = Math.min(uploadedImageUrls.length - 1, h2Matches.length);
            const spacing = Math.max(1, Math.floor(h2Matches.length / imagesToPlace));
            let addedLength = 0;

            for (let i = 0; i < imagesToPlace && i + 1 < uploadedImageUrls.length; i++) {
              const h2Index = Math.min((i + 1) * spacing - 1, h2Matches.length - 1);
              const h2Match = h2Matches[h2Index];

              if (h2Match && h2Match.index !== undefined) {
                const h2GlobalPos = searchStart + addedLength + h2Match.index + h2Match[0].length;
                const afterH2 = fullContent.substring(h2GlobalPos);
                const paraMatch = afterH2.match(/^(.+?)(\n\n|$)/s);

                if (paraMatch) {
                  const imgPos = h2GlobalPos + paraMatch[1].length;
                  const imgMarkdown = `\n\n![${keywordText} - Image ${i + 2}](${uploadedImageUrls[i + 1]})\n\n`;
                  fullContent = fullContent.slice(0, imgPos) + imgMarkdown + fullContent.slice(imgPos);
                  addedLength += imgMarkdown.length;
                }
              }
            }
          }
        }
      }

      return fullContent;
    });

    // Step 7: Save content to database
    const savedContent = await step.run('save-content', async () => {
      const { data, error } = await supabase
        .from('content_writer_outputs')
        .insert({
          user_id: userId,
          topic: keywordText,
          content_type: 'blog post',
          target_audience: 'General audience',
          tone: 'professional',
          length: 'long',
          content_output: processedContent,
          image_urls: uploadedImageUrls,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving generated content:', error);
        throw error;
      }

      return data;
    });

    // Step 8: Update keyword status
    await step.run('update-keyword-status', async () => {
      await supabase
        .from('discovered_keywords')
        .update({
          generation_status: 'generated',
          generated_content_id: savedContent.id,
          generated_at: new Date().toISOString(),
        })
        .eq('id', keywordId);
    });

    // Step 9: Deduct credits after successful content generation
    await step.run('deduct-credits', async () => {
      const { error: deductError } = await supabase
        .from('credits')
        .update({ credits: currentCredits - requiredCredits })
        .eq('user_id', userId);

      if (deductError) {
        console.error('⚠️ CRITICAL: Content generated successfully but failed to deduct credits:', deductError);
        throw deductError;
      } else {
        console.log(`✅ Deducted ${requiredCredits} credit(s) from user ${userId} for blog post generation. Remaining: ${currentCredits - requiredCredits}`);
      }
    });

    // Step 10: Auto-publish to WordPress if configured (optional, non-blocking)
    try {
      await step.run('auto-publish-wordpress', async () => {
        const { data: site } = await supabase
          .from('wordpress_sites')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (site) {
          // Extract title and clean content using the same logic as original API route
          const { title: extractedTitle, cleanedContent: extractedContent } = extractTitleAndContentForWordPress(
            processedContent,
            keywordText
          );

          // Convert markdown to HTML with proper table handling
          const { 
            convertMarkdownTablesToHtml, 
            convertHtmlPipeTablesToHtml, 
            ensureWordPressTableStyles,
            stripLeadingHeading
          } = await import('@/lib/wordpress/content-formatting');
          
          // Strip leading heading first (title is already extracted)
          let contentForConversion = stripLeadingHeading(extractedContent);
          
          // Convert markdown tables to HTML before parsing
          contentForConversion = convertMarkdownTablesToHtml(contentForConversion);
          
          // Parse markdown to HTML
          let htmlContent = marked.parse(contentForConversion, { async: false }) as string;
          
          // Convert any remaining pipe tables that were wrapped in <p> tags
          htmlContent = convertHtmlPipeTablesToHtml(htmlContent);
          
          // Ensure all tables have proper WordPress styling
          htmlContent = ensureWordPressTableStyles(htmlContent);
          
          // Fix image markdown that wasn't converted
          let finalHtml = htmlContent;
          if (finalHtml.includes('![') && finalHtml.includes('](')) {
            finalHtml = finalHtml.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="width: 100%; height: auto; margin: 2rem 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" loading="lazy" />');
          }
          
          // Remove excessive bold formatting (keep only FAQ questions bold)
          finalHtml = removeExcessiveBoldFromHTML(finalHtml);
          
          // Add inline spacing styles
          finalHtml = addInlineSpacing(finalHtml);
          
          // Add automatic internal links to content before publishing
          try {
            const { addInternalLinksToContent } = await import('@/lib/add-links-to-content');
            console.log('🔗 Attempting to add internal links to content...');
            const { linkedContent, linksAdded } = await addInternalLinksToContent(
              finalHtml,
              extractedTitle
            );
            if (linksAdded > 0) {
              console.log(`✅ Successfully added ${linksAdded} internal links`);
              finalHtml = linkedContent;
            } else {
              console.log('⚠️ No links were added (no similar posts found or no matches)');
            }
          } catch (linkError) {
            console.error('⚠️ Failed to add internal links (continuing anyway):', linkError);
          }
          
          // Add automatic external links to authoritative sources
          try {
            const { addExternalLinksToContent } = await import('@/lib/add-links-to-content');
            console.log('🌐 Attempting to add contextual external links to content...');
            const { linkedContent: externalLinkedContent, linksAdded: externalLinksAdded } = await addExternalLinksToContent(
              finalHtml,
              extractedTitle,
              2 // Add up to 2 external links
            );
            if (externalLinksAdded > 0) {
              console.log(`✅ Successfully added ${externalLinksAdded} contextual external links`);
              finalHtml = externalLinkedContent;
            } else {
              console.log('⚠️ No external links were added');
            }
          } catch (externalLinkError) {
            console.error('⚠️ Failed to add external links (continuing anyway):', externalLinkError);
          }
          
          // Add strategic business promotion mentions throughout the article
          try {
            const { addBusinessPromotionToContent } = await import('@/lib/add-links-to-content');
            console.log('💼 Attempting to add business promotion mentions...');
            const { linkedContent: promotedContent, mentionsAdded } = await addBusinessPromotionToContent(
              finalHtml,
              userId,
              4 // Add up to 4 business mentions
            );
            if (mentionsAdded > 0) {
              console.log(`✅ Successfully added ${mentionsAdded} business promotion mentions`);
              finalHtml = promotedContent;
            } else {
              console.log('⚠️ No business mentions were added');
            }
          } catch (promotionError) {
            console.error('⚠️ Failed to add business promotion (continuing anyway):', promotionError);
          }
          
          // Final cleanup: Remove any bold that might have been re-added during link processing
          finalHtml = removeExcessiveBoldFromHTML(finalHtml);
          
          const provider = (site as any).provider || ((site as any).access_token ? 'wpcom' : 'wordpress');
          const adapter = getAdapter(provider, {
            accessToken: (site as any).access_token,
            siteId: (site as any).site_id,
            url: (site as any).url,
            username: (site as any).username,
            password: (site as any).password,
            postType: (site as any).post_type,
          });
          
          const excerpt = extractedContent.substring(0, 160).replace(/[#*]/g, '') + '...';
          const publishResult = await adapter.publish({
            title: extractedTitle,
            html: finalHtml,
            excerpt,
            tags: ['ai-generated', 'seotool'],
            imageUrl: uploadedImageUrls && uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : undefined,
          });
          
          console.log('✅ Calendar content auto-published to WordPress:', publishResult);
        }
      });
    } catch (error) {
      // Don't fail the whole process if auto-publish fails
      console.error('⚠️ Auto-publish failed:', error);
    }

    return {
      keywordId,
      keyword,
      success: true,
      contentId: savedContent.id,
    };
  }
);