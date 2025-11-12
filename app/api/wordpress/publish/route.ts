import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WordPressAPI } from '@/lib/wordpress/api';
import { marked } from 'marked';
import { addInternalLinksToContent, addExternalLinksToContent, addBusinessPromotionToContent } from '@/lib/add-links-to-content';

// Helper function to remove excessive bold formatting from HTML
// Keeps bold only for FAQ questions, removes from all other content
function removeExcessiveBoldFromHTML(html: string): string {
  // First, protect FAQ questions by temporarily replacing them
  const faqQuestionPlaceholders: string[] = [];
  let placeholderIndex = 0;
  
  // Match FAQ questions in various HTML formats:
  // - <p><strong>Q: ...</strong></p>
  // - <strong>Q: ...</strong>
  // - <p><b>Q: ...</b></p>
  // - <b>Q: ...</b>
  // Handle both Q: and Q. formats, case insensitive
  const faqQuestionPatterns = [
    /<p[^>]*>\s*<(strong|b)[^>]*>\s*Q[:\\.]\s+([^<]+)<\/(strong|b)>\s*<\/p>/gi,
    /<(strong|b)[^>]*>\s*Q[:\\.]\s+([^<]+)<\/(strong|b)>/gi
  ];
  
  for (const pattern of faqQuestionPatterns) {
    html = html.replace(pattern, (match) => {
      // Skip if already a placeholder
      if (match.includes('__FAQ_QUESTION_')) {
        return match;
      }
      const placeholder = `__FAQ_QUESTION_${placeholderIndex}__`;
      faqQuestionPlaceholders.push(match);
      placeholderIndex++;
      return placeholder;
    });
  }
  
  // Now remove ALL bold tags from the HTML (both <strong> and <b>)
  // Remove <strong> tags but keep the content (non-greedy to avoid matching across tags)
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gis, '$1');
  // Remove <b> tags but keep the content
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gis, '$1');
  
  // Restore FAQ questions with their bold formatting
  faqQuestionPlaceholders.forEach((question, index) => {
    html = html.replace(`__FAQ_QUESTION_${index}__`, question);
  });
  
  return html;
}

// Helper function to add inline spacing styles to HTML
function addInlineSpacing(html: string): string {
  // Add inline styles to ensure proper spacing in WordPress
  // This ensures spacing works regardless of the WordPress theme's CSS
  
  // Preserve iframes and embeds first (extract them temporarily)
  const iframePlaceholders: string[] = [];
  // Match iframes including self-closing or with content - handle multiline
  const iframeRegex = /<iframe[^>]*>(?:.*?<\/iframe>|)/gis;
  const embedRegex = /<embed[^>]*\/?>/gis;
  const objectRegex = /<object[^>]*>.*?<\/object>/gis;
  
  // Extract iframes (including YouTube embeds)
  html = html.replace(iframeRegex, (match) => {
    if (match.trim()) {
      const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
      iframePlaceholders.push(match);
      return placeholder;
    }
    return match;
  });
  
  // Extract embeds
  html = html.replace(embedRegex, (match) => {
    const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
    iframePlaceholders.push(match);
    return placeholder;
  });
  
  // Extract objects
  html = html.replace(objectRegex, (match) => {
    const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
    iframePlaceholders.push(match);
    return placeholder;
  });
  
  // Add spacing to paragraphs (1.5em top and bottom) - but not inside placeholders
  html = html.replace(/<p>/gi, '<p style="margin-top: 1.5em; margin-bottom: 1.5em; line-height: 1.75;">');
  
  // Add spacing to headings
  html = html.replace(/<h2>/gi, '<h2 style="margin-top: 2em; margin-bottom: 1em; font-weight: 700;">');
  html = html.replace(/<h3>/gi, '<h3 style="margin-top: 1.75em; margin-bottom: 0.875em; font-weight: 700;">');
  html = html.replace(/<h4>/gi, '<h4 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h5>/gi, '<h5 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h6>/gi, '<h6 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  
  // Remove top margin from first paragraph
  html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
  
  // Restore iframes and embeds
  iframePlaceholders.forEach((iframe, index) => {
    html = html.replace(`__IFRAME_PLACEHOLDER_${index}__`, iframe);
  });
  
  return html;
}

// Helper function to extract clean content from AI output
function extractContentFromAIOutput(fullOutput: string): string {
  if (!fullOutput) {
    console.warn('⚠️ extractContentFromAIOutput called with empty content');
    return '';
  }
  
  console.log(`🔍 Analyzing content for extraction. Total length: ${fullOutput.length} characters`);
  
  // CRITICAL: Check if content is already cleaned
  // The content from the database should already be fully processed by Inngest
  // We should NOT re-process it - just return it as-is
  const hasContentMarkers = /(?:^|\n)(?:\d+\.?\s*)?\*\*(?:Title|Meta Description|Content)\*\*/i.test(fullOutput);
  const hasTitleLabels = /(?:^|\n)(?:Title|Meta Description):\s/i.test(fullOutput);
  
  // VERY lenient check: if content has ANY H2 headings OR is substantial, treat as already cleaned
  // This ensures we don't re-process content that's already been cleaned by Inngest
  const hasAnyHeadings = (fullOutput.match(/^##\s+/gm) || []).length >= 1;
  const hasSubstantialContent = fullOutput.length > 1000; // More than 1000 chars
  const hasH1 = /^#\s+/m.test(fullOutput);
  
  // If content looks like markdown (has headings and substantial length) and doesn't have clear markers, use as-is
  if ((hasAnyHeadings || hasH1 || hasSubstantialContent) && !hasContentMarkers && !hasTitleLabels) {
    console.log(`✅ Content appears already cleaned (${fullOutput.length} chars, ${(fullOutput.match(/^##\s+/gm) || []).length} H2 headings), returning as-is WITHOUT any processing`);
    return fullOutput.trim();
  }
  
  console.log(`⚠️ Content has markers or looks raw, proceeding with extraction. hasContentMarkers=${hasContentMarkers}, hasTitleLabels=${hasTitleLabels}, hasHeadings=${hasAnyHeadings}, length=${fullOutput.length}`);
  
  let cleaned = fullOutput;
  
  // Step 1: Remove ALL numbered sections (very aggressive pattern matching)
  // Handle patterns: "1. **Title**", "1\. \*\*Title\*\*", "**Title**", with or without text after
  // Match lines starting with number, period, optional space, and Title/Meta/Content markers
  cleaned = cleaned.replace(/^\d+\.?\s*\*\*Title\*\*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*Title:.*$/gmi, '');
  cleaned = cleaned.replace(/^\*\*Title\*\*[:\s]*.*$/gmi, '');
  cleaned = cleaned.replace(/^Title:\s*.*$/gmi, '');
  // Also handle escaped versions
  cleaned = cleaned.replace(/^\d+\\.\s*\\\*\\\*Title\\\*\\\*.*$/gmi, '');
  
  // Step 2: Remove Meta Description sections
  cleaned = cleaned.replace(/^\d+\.?\s*\*\*Meta Description\*\*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*Meta Description:.*$/gmi, '');
  cleaned = cleaned.replace(/^\*\*Meta Description\*\*[:\s]*.*$/gmi, '');
  cleaned = cleaned.replace(/^Meta Description:\s*.*$/gmi, '');
  // Also handle escaped versions
  cleaned = cleaned.replace(/^\d+\\.\s*\\\*\\\*Meta Description\\\*\\\*.*$/gmi, '');
  
  // Remove "Title:" and "Meta Description:" when they appear together on same line
  cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n]+/gi, '');
  
  // Remove any remaining "Title:" or "Meta Description:" anywhere in content (not just start of line)
  cleaned = cleaned.replace(/(?:^|\n)\s*Title:\s*[^\n]+/gim, '');
  cleaned = cleaned.replace(/(?:^|\n)\s*Meta Description:\s*[^\n]+/gim, '');
  
  // Step 3: Find and extract the Content section (handle escaped and non-escaped markdown)
  // Look for "3. **Content**" or "**Content**" followed by actual content
  // IMPORTANT: Use the `s` flag to match across newlines and get ALL content after the marker
  const contentPatterns = [
    /(?:^|\n)\d+\.?\s*\*\*Content\*\*[:\s]*\n?(.*)$/is,  // With `s` flag, `.` matches newlines too
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
      console.log(`✅ Found content using pattern. Content length AFTER marker: ${extractedContent.length} characters`);
      console.log(`📊 First 200 chars of extracted content: ${extractedContent.substring(0, 200)}...`);
      break;
    }
  }
  
  // If no Content section found, use everything after removing metadata sections
  if (!extractedContent || !foundContentMarker) {
    console.log(`⚠️ No content marker found, using cleaned content as-is (${cleaned.length} chars)`);
    extractedContent = cleaned.trim();
    console.log(`📊 First 200 chars of content: ${extractedContent.substring(0, 200)}...`);
  }
  
  // CRITICAL: Log content length for debugging
  console.log(`📊 Content after extraction: ${extractedContent.length} characters`);
  if (extractedContent.length < 2000) {
    console.error(`❌ CRITICAL WARNING: Extracted content is very short (${extractedContent.length} chars)!`);
    console.error(`📋 Original input length was: ${fullOutput.length} characters`);
    console.error(`📋 Cleaned length before extraction was: ${cleaned.length} characters`);
    console.error(`⚠️ This indicates content is being lost during extraction!`);
  }
  
  // Step 4: Remove duplicate titles at the start (H1 format, plain text, or multiple occurrences)
  const contentLines = extractedContent.split('\n');
  let startIndex = 0;
  let foundFirstTitle = false;
  const foundTitles: string[] = [];
  
  // First pass: identify all title-like patterns at the start
  for (let i = 0; i < Math.min(10, contentLines.length); i++) {
    const line = contentLines[i].trim();
    
    // Check for H1 format: # Title
    if (line.match(/^#\s+.+$/)) {
      const titleText = line.replace(/^#\s+/, '').trim();
      if (!foundFirstTitle) {
        foundFirstTitle = true;
        foundTitles.push(titleText);
        startIndex = i + 1;
      } else {
        // Check if this is a duplicate of the first title
        if (foundTitles.length > 0 && (titleText === foundTitles[0] || titleText.toLowerCase() === foundTitles[0].toLowerCase())) {
          startIndex = i + 1;
          continue;
        }
        // If it's a different title but still looks like a title, skip it too
        if (titleText.length > 10 && titleText.length < 100) {
          startIndex = i + 1;
          continue;
        }
      }
    }
    // Check for plain text titles (standalone lines that look like titles)
    else if (line && !line.startsWith('#') && !line.match(/^\d+\./) && !line.startsWith('*')) {
      // If it's a short line that looks like a title (not a paragraph)
      if (line.length > 10 && line.length < 150 && !line.includes('. ') && !line.match(/^[a-z]/)) {
        // Check if it's a duplicate
        if (foundTitles.length > 0 && (line === foundTitles[0] || line.toLowerCase() === foundTitles[0].toLowerCase())) {
          startIndex = i + 1;
          continue;
        }
        // If we haven't found first title yet and this looks like one, mark it
        if (!foundFirstTitle && line.length < 100) {
          foundTitles.push(line);
          foundFirstTitle = true;
          startIndex = i + 1;
          continue;
        }
      }
      // If we hit actual paragraph content (starts with lowercase or has sentence structure), stop
      if (line.length > 50 || line.match(/^[a-z]/) || line.includes('. ')) {
        break;
      }
    }
  }
  
  // Skip blank lines after titles
  while (startIndex < contentLines.length && contentLines[startIndex].trim() === '') {
    startIndex++;
  }
  
  extractedContent = contentLines.slice(startIndex).join('\n');
  
  // Step 5: Remove any remaining numbered sections and metadata (very aggressive)
  extractedContent = extractedContent.replace(/^\d+\.?\s*\*\*[^*]+\*\*.*$/gmi, '');
  extractedContent = extractedContent.replace(/^\d+\.?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*:.*$/gmi, '');
  // Remove lines that are just section markers
  extractedContent = extractedContent.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*$/gmi, '');
  extractedContent = extractedContent.replace(/^\*\*(?:Title|Meta Description|Content|SEO Suggestions|Image Suggestions|Call-to-Action)\*\*\s*$/gmi, '');
  
  // Step 6: Only remove metadata sections that appear at the VERY END of the content
  // Don't remove sections that might be part of the main content (like FAQ after conclusion)
  // Check if these keywords appear near the end (last 20% of content)
  const contentLength = extractedContent.length;
  const endThreshold = Math.floor(contentLength * 0.8); // Last 20% of content
  
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
  
  // Only remove if the keyword appears in the last 20% of content
  for (const keyword of stopKeywords) {
    const index = extractedContent.indexOf(keyword);
    if (index !== -1 && index >= endThreshold) {
      // Make sure there's no FAQ or other legitimate content after conclusion before this
      const beforeKeyword = extractedContent.substring(0, index);
      const afterKeyword = extractedContent.substring(index + keyword.length);
      
      // Check if there's a FAQ section before this keyword (if so, don't remove)
      const hasFAQBefore = /##\s+FAQ/i.test(beforeKeyword);
      // Check if this is clearly a metadata section (short content after, or end of document)
      const isMetadataSection = afterKeyword.trim().length < 200 || afterKeyword.trim().match(/^\s*$/);
      
      if (!hasFAQBefore && isMetadataSection) {
        extractedContent = extractedContent.substring(0, index);
        break;
      }
    }
  }
  
  // Remove Key Takeaways sections only if they're at the very end
  const keyTakeawaysMatch = extractedContent.match(/\n(?:##\s*)?Key Takeaways:?\s*[\s\S]*$/i);
  if (keyTakeawaysMatch && keyTakeawaysMatch.index !== undefined && keyTakeawaysMatch.index >= endThreshold) {
    extractedContent = extractedContent.substring(0, keyTakeawaysMatch.index);
  }
  
  // Remove [Call-to-Action]: placeholder lines (these are always metadata)
  extractedContent = extractedContent.replace(/^\s*\[Call-to-Action\]:.*$/gmi, '');
  // Remove boilerplate lines like "Here is a 2,700-word comprehensive ... blog post ..."
  extractedContent = extractedContent.replace(/^[\s>*]*Here is a [^\n]*?blog post[^\n]*?:\s*\n?/i, '');
  // Clean up H3 headings with bold markdown (### **Text** -> ### Text)
  extractedContent = extractedContent.replace(/^###\s+\*\*(.+?)\*\*\s*$/gmi, '### $1');
  // Also clean H2 headings with bold (## **Text** -> ## Text)
  extractedContent = extractedContent.replace(/^##\s+\*\*(.+?)\*\*\s*$/gmi, '## $1');
  
  // DON'T truncate after conclusion - keep ALL content including FAQ sections
  // Only remove truly repetitive promotional boilerplate at the very end
  // Check for repetitive promotional text at the end (last 500 characters)
  const last500Chars = extractedContent.substring(Math.max(0, extractedContent.length - 500));
  const repetitivePromoPattern = /(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?:\n|$)/gi;
  const promoMatches = [...last500Chars.matchAll(repetitivePromoPattern)];
  
  // Only remove if there are multiple promotional sentences at the very end
  // and they're not part of a legitimate section
  if (promoMatches.length >= 2) {
    // Find the last legitimate section heading before the promotional text
    const lastHeadingMatch = extractedContent.match(/(?:^|\n)(##\s+[^\n]+)(?:\n|$)/g);
    if (lastHeadingMatch && lastHeadingMatch.length > 0) {
      const lastHeading = lastHeadingMatch[lastHeadingMatch.length - 1];
      const lastHeadingIndex = extractedContent.lastIndexOf(lastHeading);
      
      // Check if promotional text appears after the last heading
      if (lastHeadingIndex !== -1) {
        const afterLastHeading = extractedContent.substring(lastHeadingIndex + lastHeading.length);
        // Only remove if promotional text dominates the content after last heading
        const promoTextLength = afterLastHeading.match(repetitivePromoPattern)?.join('').length || 0;
        if (promoTextLength > afterLastHeading.length * 0.5) {
          // Keep everything up to and including the last heading, plus a reasonable amount after
          const headingEnd = lastHeadingIndex + lastHeading.length;
          // Find the first paragraph after the heading
          const firstParaAfterHeading = afterLastHeading.match(/^(.+?)(?:\n\n|\n##\s|$)/s);
          if (firstParaAfterHeading) {
            const keepUpTo = headingEnd + firstParaAfterHeading.index! + firstParaAfterHeading[0].length;
            extractedContent = extractedContent.substring(0, keepUpTo).trim();
          }
        }
      }
    }
  }
  
  // Remove standalone repetitive promotional sentences (but keep if they're in FAQ or other sections)
  // Only remove if they appear at the very end and are clearly boilerplate
  const promoCleaningLines = extractedContent.split('\n');
  const cleanedLines: string[] = [];
  let foundFAQ = false;
  
  for (let i = 0; i < promoCleaningLines.length; i++) {
    const line = promoCleaningLines[i];
    const trimmed = line.trim();
    
    // Detect FAQ section
    if (trimmed.match(/^##\s+FAQ/i)) {
      foundFAQ = true;
      cleanedLines.push(line);
      continue;
    }
    
    // After FAQ section starts, keep everything
    if (foundFAQ) {
      cleanedLines.push(line);
      continue;
    }
    
    // Check if this is a repetitive promotional line
    const isPromoLine = /^(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*$/i.test(trimmed);
    
    // Only remove if:
    // 1. It's a promotional line
    // 2. We're in the last 10% of lines (near the end)
    // 3. There's no FAQ section
    // 4. It's not part of a list or quote
    if (isPromoLine && i > promoCleaningLines.length * 0.9 && !foundFAQ && !trimmed.match(/^[-*>\d]/)) {
      // Skip this line
      continue;
    }
    
    cleanedLines.push(line);
  }
  
  extractedContent = cleanedLines.join('\n');
  
  // Step 7: Final cleanup - remove any remaining numbered section markers
  // Do multiple passes to catch any we missed
  const sectionMarkers = [
    /^\d+\.\s*\*\*Title\*\*/gmi,
    /^\d+\.\s*\*\*Meta Description\*\*/gmi,
    /^\d+\.\s*\*\*Content\*\*/gmi,
    /^\d+\.\s*\*\*SEO Suggestions\*\*/gmi,
    /^\d+\.\s*\*\*Image Suggestions\*\*/gmi,
    /^\d+\.\s*\*\*Call-to-Action\*\*/gmi,
    /^\*\*Title\*\*/gmi,
    /^\*\*Meta Description\*\*/gmi,
    /^\*\*Content\*\*/gmi,
    /^\*\*SEO Suggestions\*\*/gmi,
    /^\*\*Image Suggestions\*\*/gmi,
    /^\*\*Call-to-Action\*\*/gmi,
  ];
  
  for (const pattern of sectionMarkers) {
    extractedContent = extractedContent.replace(pattern, '');
  }
  
  // Step 8: Clean up extra whitespace and ensure proper paragraph spacing
  extractedContent = extractedContent
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with double newline
    .replace(/^\s+/gm, '')        // Remove leading whitespace from lines
    .replace(/\n\n\n+/g, '\n\n')  // Ensure max 2 newlines between paragraphs
    .trim();
  
  // Step 9: Ensure proper spacing after headings
  extractedContent = extractedContent.replace(/(^##?[^\n]+\n)(\n)/gm, '$1\n');
  extractedContent = extractedContent.replace(/([^\n])\n(##?[^\n]+$)/gm, '$1\n\n$2');
  
  // Step 10: Remove excessive bold formatting
  // Strategy: Keep bold ONLY for FAQ questions, remove all other bold formatting
  const formattingLines = extractedContent.split('\n');
  const cleanedContent: string[] = [];
  let inFAQSection = false;
  
  for (let i = 0; i < formattingLines.length; i++) {
    const line = formattingLines[i];
    const trimmed = line.trim();
    
    // Detect FAQ section
    if (trimmed.match(/^##\s+FAQ/i)) {
      inFAQSection = true;
      cleanedContent.push(line);
      continue;
    }
    
    // Detect end of FAQ section (new H2 heading)
    if (inFAQSection && trimmed.match(/^##\s+[^F]/)) {
      inFAQSection = false;
    }
    
    // In FAQ section: keep bold only for questions (Q: format)
    if (inFAQSection) {
      // Keep FAQ questions bold (lines starting with **Q: or **Q.)
      if (trimmed.match(/^\*\*Q[:\\.]\s+/i)) {
        cleanedContent.push(line);
      } else {
        // Remove all bold from FAQ answers and other FAQ content
        const unbolded = line.replace(/\*\*([^*]+?)\*\*/g, '$1');
        cleanedContent.push(unbolded);
      }
      continue;
    }
    
    // Outside FAQ section: remove all bold formatting
    // But preserve structure (headings, lists, blockquotes)
    if (trimmed.match(/^#/) || 
        trimmed.match(/^[-\*]\s/) || 
        trimmed.match(/^\d+\.\s/) ||
        trimmed.match(/^>\s/)) {
      // For headings and lists, remove bold but keep the content
      const unbolded = line.replace(/\*\*([^*]+?)\*\*/g, '$1');
      cleanedContent.push(unbolded);
    } else {
      // For regular paragraphs, remove all bold formatting
      const unbolded = line.replace(/\*\*([^*]+?)\*\*/g, '$1');
      cleanedContent.push(unbolded);
    }
  }
  
  extractedContent = cleanedContent.join('\n');
  
  return extractedContent;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      siteId, 
      contentId, 
      contentType, 
      publishOptions = {} 
    } = body;

    if (!siteId || !contentId || !contentType) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, contentId, contentType' 
      }, { status: 400 });
    }

    // Get the WordPress site
    const { data: site, error: siteError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }

    // Check if this is a WordPress.com site (OAuth)
    const isWPCom = (site as any).provider === 'wpcom';
    let publishedPost;

    // Get the content based on type
    let contentData;
    let tableName;

    switch (contentType) {
      case 'content':
        tableName = 'content_writer_outputs';
        break;
      case 'analysis':
        tableName = 'competitive_analysis';
        break;
      case 'seo_research':
        tableName = 'seo_research_outputs';
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Initialize WordPress API (only for self-hosted)
    let wpAPI: WordPressAPI | null = null;
    let tagIds: number[] = [];
    
    if (!isWPCom) {
      wpAPI = new WordPressAPI({
        id: (site as any).id,
        name: (site as any).name,
        url: (site as any).url,
        username: (site as any).username,
        password: (site as any).password,
        isActive: (site as any).is_active,
        createdAt: (site as any).created_at,
        updatedAt: (site as any).updated_at,
      });

      // Convert tag names to tag IDs if tags are provided as strings
      if (publishOptions.tags && publishOptions.tags.length > 0) {
        // Check if tags are strings (names) or numbers (IDs)
        if (typeof publishOptions.tags[0] === 'string') {
          // Tags are names, need to convert to IDs
          tagIds = await wpAPI.getOrCreateTagIds(publishOptions.tags);
        } else {
          // Tags are already IDs
          tagIds = publishOptions.tags;
        }
      }
    }

    // Prepare WordPress post data
    let postData: {
      title: string;
      content: string;
      excerpt: string;
      status: string;
      categories: any[];
      tags: any[];
      meta: any;
    } | null = null;
    
    switch (contentType) {
      case 'content':
        // Extract title from content_output - prioritize generated title over topic
        const contentOutput = (content as any).content_output || '';
        const topic = (content as any).topic || 'Generated Article';
        let extractedTitle = null;
        
        // Check if content has old-style markers or is already cleaned
        const hasMarkers = /(?:^|\n)(?:\d+\.?\s*)?\*\*(?:Title|Content)\*\*/i.test(contentOutput);
        
        if (!hasMarkers) {
          // Content is already cleaned - just extract the first H1
          console.log('Content appears already cleaned, extracting first H1 as title');
          const h1Match = contentOutput.match(/^#\s+([^\n]+)/m);
          if (h1Match && h1Match[1]) {
            extractedTitle = h1Match[1].trim();
            console.log(`✅ Extracted H1 title from cleaned content: ${extractedTitle}`);
          }
        } else {
          // Old-style content with markers - use comprehensive extraction
          console.log('Content has markers, using comprehensive title extraction');
          
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
              // Validate: title should be meaningful (not just "Title" or the topic)
              if (candidate.length > 5 && candidate.toLowerCase() !== 'title' && candidate.toLowerCase() !== topic.toLowerCase()) {
                extractedTitle = candidate;
                break;
              }
            }
          }
          
          // Priority 2: Extract from H1 in content section (after "Content" marker)
          if (!extractedTitle) {
            const contentSectionMatch = contentOutput.match(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/i);
            if (contentSectionMatch) {
              const afterContent = contentOutput.substring(contentSectionMatch.index! + contentSectionMatch[0].length);
              const h1Match = afterContent.match(/^#\s+([^\n]+)/m);
              if (h1Match && h1Match[1]) {
                const h1Title = h1Match[1].trim();
                // Validate: should be a real title, not section markers
                if (h1Title.length > 5 && 
                    !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction)/i) &&
                    h1Title.toLowerCase() !== topic.toLowerCase()) {
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
                  if (h1Title.length > 5 && 
                      !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction|\d+\.)/i) &&
                      h1Title.toLowerCase() !== topic.toLowerCase()) {
                    extractedTitle = h1Title;
                    break;
                  }
                }
              }
              if (extractedTitle) break;
            }
          }
        }
        
        // Final fallback: use topic only if absolutely no title found
        if (!extractedTitle) {
          extractedTitle = topic;
          console.warn(`⚠️ Could not extract title from content, using topic: ${topic}`);
        } else {
          console.log(`✅ Final extracted title: ${extractedTitle}`);
        }
        
        // Extract clean content from AI output (removes title, meta description, etc.)
        console.log(`\n========== WORDPRESS PUBLISHING: CONTENT EXTRACTION ==========`);
        console.log(`📝 Original database content length: ${contentOutput.length} characters`);
        console.log(`📋 First 500 chars: ${contentOutput.substring(0, 500)}...`);
        console.log(`📋 Last 500 chars: ...${contentOutput.substring(Math.max(0, contentOutput.length - 500))}`);
        
        const extractedContent = extractContentFromAIOutput(contentOutput);
        
        console.log(`\n========== EXTRACTION COMPLETE ==========`);
        console.log(`✅ Final extracted content length: ${extractedContent.length} characters`);
        console.log(`📊 Length comparison: Original=${contentOutput.length} → Extracted=${extractedContent.length}`);
        console.log(`📊 Content retained: ${((extractedContent.length / contentOutput.length) * 100).toFixed(1)}%`);
        
        // CRITICAL: Validate that we have substantial content
        if (extractedContent.length < contentOutput.length * 0.8) {
          console.error(`\n❌❌❌ CRITICAL ERROR: Lost ${contentOutput.length - extractedContent.length} characters (${(((contentOutput.length - extractedContent.length) / contentOutput.length) * 100).toFixed(1)}% loss)!`);
          console.error('⚠️ This indicates the extraction function is removing too much content!');
          console.error('📋 You should check the extraction logic in extractContentFromAIOutput()');
        }
        
        if (extractedContent.length < 2000) {
          console.error(`\n❌ CRITICAL WARNING: Extracted content is very short (${extractedContent.length} chars)!`);
          console.error(`📋 Original content length: ${contentOutput.length} characters`);
          console.error('⚠️ This might indicate content extraction is too aggressive or content is malformed.');
        }
        console.log(`==================================================\n`);
        
        postData = {
          title: extractedTitle,
          content: extractedContent,
          excerpt: extractedContent.substring(0, 160).replace(/[#*]/g, '') + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: tagIds,
          meta: {
            content_type: (content as any).content_type,
            target_audience: (content as any).target_audience,
            tone: (content as any).tone,
            length: (content as any).length,
          },
        };
        break;
      case 'analysis':
        // Get or create tag IDs for default tags (only for self-hosted)
        let analysisTagIds = tagIds;
        if (!isWPCom && wpAPI) {
          analysisTagIds = await wpAPI.getOrCreateTagIds([
            'competitive-analysis', 
            'business-analysis',
            ...publishOptions.tags || []
          ]);
        }
        
        postData = {
          title: `Competitive Analysis: ${(content as any).company_name} vs ${(content as any).competitor_name}`,
          content: (content as any).analysis_output,
          excerpt: (content as any).analysis_output.substring(0, 160) + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: analysisTagIds,
          meta: {
            analysis_type: (content as any).analysis_type,
            company_name: (content as any).company_name,
            competitor_name: (content as any).competitor_name,
          },
        };
        break;
      case 'seo_research':
        // Get or create tag IDs for default tags (only for self-hosted)
        let seoTagIds = tagIds;
        if (!isWPCom && wpAPI) {
          seoTagIds = await wpAPI.getOrCreateTagIds([
            'seo', 
            'research', 
            'keywords',
            ...publishOptions.tags || []
          ]);
        }
        
        postData = {
          title: `SEO Research: ${(content as any).query}`,
          content: (content as any).research_output,
          excerpt: (content as any).research_output.substring(0, 160) + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: seoTagIds,
          meta: {
            research_type: (content as any).research_type,
            target_audience: (content as any).target_audience,
            industry: (content as any).industry,
          },
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Ensure postData is defined
    if (!postData) {
      return NextResponse.json({ error: 'Failed to prepare post data' }, { status: 500 });
    }

    // Publish to WordPress
    if (isWPCom) {
      // Use WordPress.com REST API
      const accessToken = (site as any).access_token;
      const siteIdNum = (site as any).site_id;

      if (!accessToken || !siteIdNum) {
        return NextResponse.json({ 
          error: 'WordPress.com site missing credentials' 
        }, { status: 400 });
      }

      // WordPress.com API endpoint
      const endpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${siteIdNum}/posts/new`;
      
      // Convert Markdown to HTML for WordPress.com
      // Ensure images are properly converted from markdown (![alt](url)) to HTML (<img>)
      let htmlContent: string;
      console.log(`🔄 Converting markdown to HTML. Content length: ${postData.content.length} characters`);
      
      if (typeof postData.content === 'string' && postData.content.trim()) {
        // Parse markdown to HTML
        htmlContent = marked.parse(postData.content, { async: false }) as string;
        console.log(`✅ Markdown converted to HTML. HTML length: ${htmlContent.length} characters`);
        
        // Double-check that markdown images were converted (should be HTML <img> tags now)
        if (htmlContent.includes('![') && htmlContent.includes('](')) {
          // If markdown images still exist, manually convert them
          htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        }
        
        // Remove excessive bold formatting from HTML (keep only FAQ questions bold)
        htmlContent = removeExcessiveBoldFromHTML(htmlContent);
        
        // Add inline spacing styles
        htmlContent = addInlineSpacing(htmlContent);
        
        // Add automatic internal links AFTER converting to HTML
        try {
          console.log('🔗 Attempting to add internal links to content...');
          const { linkedContent, linksAdded } = await addInternalLinksToContent(
            htmlContent,
            postData.title
          );
          if (linksAdded > 0) {
            console.log(`✅ Successfully added ${linksAdded} internal links`);
            htmlContent = linkedContent;
          } else {
            console.log('⚠️ No links were added (no similar posts found or no matches)');
          }
        } catch (linkError) {
          console.error('⚠️ Failed to add internal links (continuing anyway):', linkError);
          // Continue without links if linking fails
        }
        
        // Add automatic external links
        try {
          console.log('🌐 Attempting to add contextual external links...');
          const { linkedContent: externalLinkedContent, linksAdded: externalLinksAdded } = await addExternalLinksToContent(
            htmlContent,
            postData.title,
            2
          );
          if (externalLinksAdded > 0) {
            console.log(`✅ Successfully added ${externalLinksAdded} external links`);
            htmlContent = externalLinkedContent;
          }
        } catch (externalLinkError) {
          console.error('⚠️ Failed to add external links (continuing anyway):', externalLinkError);
        }
        
        // Add business promotion mentions
        try {
          console.log('💼 Attempting to add business promotion mentions...');
          const { linkedContent: promotedContent, mentionsAdded } = await addBusinessPromotionToContent(
            htmlContent,
            user.id,
            3
          );
          if (mentionsAdded > 0) {
            console.log(`✅ Successfully added ${mentionsAdded} business mentions`);
            htmlContent = promotedContent;
          }
        } catch (promotionError) {
          console.error('⚠️ Failed to add business promotion (continuing anyway):', promotionError);
        }
        
        // Final cleanup: Remove any bold that might have been re-added during link processing
        // (This shouldn't happen, but being extra safe)
        htmlContent = removeExcessiveBoldFromHTML(htmlContent);
      } else {
        htmlContent = String(postData.content);
        
        // Remove excessive bold formatting from HTML (keep only FAQ questions bold)
        htmlContent = removeExcessiveBoldFromHTML(htmlContent);
        
        // Add links even for non-markdown content
        try {
          console.log('🔗 Attempting to add internal links to content...');
          const { linkedContent, linksAdded } = await addInternalLinksToContent(
            htmlContent,
            postData.title
          );
          if (linksAdded > 0) {
            console.log(`✅ Successfully added ${linksAdded} internal links`);
            htmlContent = linkedContent;
          } else {
            console.log('⚠️ No links were added (no similar posts found or no matches)');
          }
        } catch (linkError) {
          console.error('⚠️ Failed to add internal links (continuing anyway):', linkError);
          // Continue without links if linking fails
        }
        
        // Add automatic external links
        try {
          const { linkedContent: externalLinkedContent, linksAdded: externalLinksAdded } = await addExternalLinksToContent(
            htmlContent,
            postData.title,
            2
          );
          if (externalLinksAdded > 0) {
            htmlContent = externalLinkedContent;
          }
        } catch (externalLinkError) {
          console.error('⚠️ Failed to add external links (continuing anyway):', externalLinkError);
        }
        
        // Add business promotion mentions
        try {
          const { linkedContent: promotedContent, mentionsAdded } = await addBusinessPromotionToContent(
            htmlContent,
            user.id,
            3
          );
          if (mentionsAdded > 0) {
            htmlContent = promotedContent;
          }
        } catch (promotionError) {
          console.error('⚠️ Failed to add business promotion (continuing anyway):', promotionError);
        }
        
        // Final cleanup: Remove any bold that might have been re-added during link processing
        htmlContent = removeExcessiveBoldFromHTML(htmlContent);
      }
      
      // Log final content length before publishing
      console.log(`🚀 Publishing to WordPress.com. Final HTML content length: ${htmlContent.length} characters`);
      console.log(`📋 Post title: ${postData.title}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postData.title,
          content: htmlContent,
          excerpt: publishOptions.excerpt || postData.excerpt,
          status: publishOptions.status || 'publish',
          tags: publishOptions.tags || [],
          categories: publishOptions.categories || [],
          date: publishOptions.publishDate || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ WordPress.com publishing error:', error);
        console.error(`📊 Content that failed to publish - Length: ${htmlContent.length} characters`);
        return NextResponse.json({ 
          error: 'Failed to publish to WordPress.com',
          details: error
        }, { status: response.status });
      }
      
      publishedPost = await response.json();
      console.log(`✅ Successfully published to WordPress.com. Post ID: ${publishedPost.ID}, Content length: ${htmlContent.length} characters`);
    } else {
      // Use self-hosted WordPress REST API
      if (!wpAPI) {
        return NextResponse.json({ error: 'WordPress API not initialized' }, { status: 500 });
      }
      
      // Add automatic internal links to content before publishing (for self-hosted)
      let finalContent = postData.content;
      console.log(`🔄 Preparing content for self-hosted WordPress. Content length: ${finalContent.length} characters`);
      
      // Convert markdown to HTML if needed
      if (typeof finalContent === 'string' && finalContent.trim() && (finalContent.includes('#') || finalContent.includes('*'))) {
        finalContent = marked.parse(finalContent, { async: false }) as string;
        console.log(`✅ Markdown converted to HTML. HTML length: ${finalContent.length} characters`);
      }
      
      // Remove excessive bold formatting from HTML (keep only FAQ questions bold)
      finalContent = removeExcessiveBoldFromHTML(finalContent);
      
      // Add inline spacing
      finalContent = addInlineSpacing(finalContent);
      
      // Add internal links
      const { linkedContent } = await addInternalLinksToContent(
        finalContent,
        postData.title,
        process.env.NEXT_PUBLIC_BASE_URL
      );
      finalContent = linkedContent;
      
      // Add external links
      try {
        const { linkedContent: externalLinkedContent, linksAdded: externalLinksAdded } = await addExternalLinksToContent(
          finalContent,
          postData.title,
          2
        );
        if (externalLinksAdded > 0) {
          finalContent = externalLinkedContent;
        }
      } catch (e) {
        console.error('Failed to add external links:', e);
      }
      
      // Add business promotion
      try {
        const { linkedContent: promotedContent, mentionsAdded } = await addBusinessPromotionToContent(
          finalContent,
          user.id,
          3
        );
        if (mentionsAdded > 0) {
          finalContent = promotedContent;
        }
      } catch (e) {
        console.error('Failed to add business promotion:', e);
      }
      
      // Final cleanup: Remove any bold that might have been re-added during link processing
      finalContent = removeExcessiveBoldFromHTML(finalContent);
      
      console.log(`🚀 Publishing to self-hosted WordPress. Final HTML content length: ${finalContent.length} characters`);
      console.log(`📋 Post title: ${postData.title}`);
      
      postData.content = finalContent;
      
      if (publishOptions.publishDate) {
        publishedPost = await wpAPI.schedulePost(postData as any, publishOptions.publishDate);
        console.log(`✅ Successfully scheduled post. Content length: ${finalContent.length} characters`);
      } else {
        publishedPost = await wpAPI.createPost(postData as any);
        console.log(`✅ Successfully published post. Post ID: ${publishedPost?.id}, Content length: ${finalContent.length} characters`);
      }
    }

    // Log the publishing activity
    await supabase
      .from('publishing_logs')
      .insert({
        user_id: user.id,
        site_id: siteId,
        content_id: contentId,
        content_type: contentType,
        post_id: publishedPost.id,
        status: 'published',
        published_at: new Date().toISOString(),
      } as any);

    return NextResponse.json({ 
      success: true, 
      post: publishedPost,
      message: `Content successfully published to ${(site as any).name}` 
    });
  } catch (error) {
    console.error('WordPress publishing error:', error);
    return NextResponse.json({ 
      error: 'Failed to publish content to WordPress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Get publishing logs for the site
    const { data: logs, error } = await supabase
      .from('publishing_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching publishing logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('WordPress logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}