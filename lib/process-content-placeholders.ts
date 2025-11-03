/**
 * Process content placeholders for images and tables
 * Replaces [Image] and [Table] markers with actual content or formatted placeholders
 */

export function processContentPlaceholders(
  content: string,
  imageUrls: string[]
): string {
  let processed = content;
  let imageIndex = 0;

  // Replace [Image: description] placeholders with actual images
  processed = processed.replace(/\[Image:\s*([^\]]+)\]/gi, (match, description) => {
    if (imageIndex < imageUrls.length) {
      const url = imageUrls[imageIndex++];
      const alt = description.trim() || 'Article image';
      return `\n\n![${alt}](${url})\n\n`;
    }
    // If no images left, return empty (remove placeholder)
    return '';
  });

  // Remove [Table: description] placeholders entirely (tables should be already generated)
  processed = processed.replace(/\[Table:\s*([^\]]+)\]/gi, (match, description) => {
    // Just remove the placeholder - the AI should have generated the actual table
    return '';
  });

  return processed;
}

/**
 * Validate content structure for Outrank-style requirements
 */
export function validateContentStructure(content: string): {
  isValid: boolean;
  issues: string[];
  h2Count: number;
  h3Count: number;
  hasTable: boolean;
  hasFAQ: boolean;
  wordCount: number;
} {
  const issues: string[] = [];

  // Count H2 and H3 headings
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;

  // Check for tables
  const hasTable = content.includes('|') && content.includes('---');

  // Check for FAQ section
  const hasFAQ = /## FAQ|## Frequently Asked Questions|##\s*Common Questions/i.test(content);

  // Estimate word count
  const wordCount = content.split(/\s+/).length;

  // Validation rules
  if (h2Count < 4) {
    issues.push(`Only ${h2Count} H2 sections (need at least 4)`);
  }

  if (h3Count < h2Count * 2) {
    issues.push(`Only ${h3Count} H3 subsections (need at least 2 per H2: ${h2Count * 2})`);
  }

  if (!hasTable) {
    issues.push('No comparison tables found');
  }

  if (!hasFAQ) {
    issues.push('No FAQ section found');
  }

  if (wordCount < 2000) {
    issues.push(`Only ${wordCount} words (target: 2,500-3,500)`);
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    issues,
    h2Count,
    h3Count,
    hasTable,
    hasFAQ,
    wordCount,
  };
}

/**
 * Add pro tip callouts to content
 * Looks for sentences that could be pro tips and formats them
 */
export function enhanceWithProTips(content: string): string {
  // This is a placeholder for future enhancement
  // Could use NLP to identify valuable tips and convert to blockquotes
  return content;
}

/**
 * Ensure images and videos are not placed next to each other
 * Adds substantial spacing (at least 2-3 paragraphs) between adjacent media elements
 */
export function ensureMediaSpacing(content: string): string {
  let processed = content;

  // First pass: Find all media elements (images and videos) and their positions
  const mediaElements: Array<{ start: number; end: number; type: string }> = [];
  
  // Find all markdown images: ![alt](url)
  const imageRegex = /!\[[^\]]*\]\([^)]+\)/g;
  let imageMatch;
  while ((imageMatch = imageRegex.exec(processed)) !== null) {
    mediaElements.push({
      start: imageMatch.index,
      end: imageMatch.index + imageMatch[0].length,
      type: 'image'
    });
  }

  // Find all video iframes: <iframe ...></iframe> or <iframe .../>
  const iframeRegex = /<iframe[^>]*>(?:.*?<\/iframe>|)/gis;
  let iframeMatch;
  // Reset lastIndex since we're using the same regex
  iframeRegex.lastIndex = 0;
  while ((iframeMatch = iframeRegex.exec(processed)) !== null) {
    mediaElements.push({
      start: iframeMatch.index,
      end: iframeMatch.index + iframeMatch[0].length,
      type: 'video'
    });
  }

  // Sort by position (start index)
  mediaElements.sort((a, b) => a.start - b.start);

  // Second pass: Process in reverse order to maintain correct positions when inserting
  for (let i = mediaElements.length - 2; i >= 0; i--) {
    const current = mediaElements[i];
    const next = mediaElements[i + 1];

    // Get content between current and next media element
    const between = processed.substring(current.end, next.start);
    
    // Count line breaks and non-whitespace characters
    const lineBreaks = (between.match(/\n/g) || []).length;
    const nonWhitespaceLength = between.replace(/[\s\n]/g, '').length;
    
    // If there's minimal text content (less than 100 chars) and insufficient spacing (less than 4 line breaks)
    // Add substantial spacing between media elements
    if (nonWhitespaceLength < 100 && lineBreaks < 4) {
      // Insert at least 3 blank lines (representing 2-3 paragraphs) between media elements
      const insertPosition = current.end;
      processed = processed.slice(0, insertPosition) + '\n\n\n\n' + processed.slice(insertPosition);
      
      // Update positions of all subsequent media elements
      const offset = 4; // 4 newlines added
      for (let j = i + 1; j < mediaElements.length; j++) {
        mediaElements[j].start += offset;
        mediaElements[j].end += offset;
      }
    }
  }

  return processed;
}

/**
 * Ensure proper spacing between sections
 */
export function normalizeContentSpacing(content: string): string {
  let normalized = content;

  // First, ensure images and videos have proper spacing
  normalized = ensureMediaSpacing(normalized);

  // Ensure double line breaks before H2
  normalized = normalized.replace(/([^\n])\n## /g, '$1\n\n## ');

  // Ensure double line breaks before H3
  normalized = normalized.replace(/([^\n])\n### /g, '$1\n\n### ');

  // Ensure images and videos have proper spacing from surrounding content
  // Add spacing before images/videos if there's no sufficient spacing
  normalized = normalized.replace(/([^\n])\n(!\[[^\]]*\]\([^)]+\))/g, '$1\n\n$2');
  normalized = normalized.replace(/([^\n])\n(<iframe[^>]*>)/g, '$1\n\n$2');
  
  // Add spacing after images/videos if there's no sufficient spacing
  normalized = normalized.replace(/(!\[[^\]]*\]\([^)]+\))\n([^\n])/g, '$1\n\n$2');
  normalized = normalized.replace(/(<\/iframe>)\n([^\n])/g, '$1\n\n$2');

  // Remove excessive line breaks (more than 3)
  normalized = normalized.replace(/\n{4,}/g, '\n\n\n');

  // Ensure proper spacing around tables
  normalized = normalized.replace(/([^\n])\n(\|[^\n]+\|)/g, '$1\n\n$2');
  normalized = normalized.replace(/(\|[^\n]+\|)\n([^\n|])/g, '$1\n\n$2');

  // Ensure proper spacing around blockquotes
  normalized = normalized.replace(/([^\n])\n(> )/g, '$1\n\n$2');
  normalized = normalized.replace(/(> [^\n]+)\n([^>\n])/g, '$1\n\n$2');

  // Final check: ensure images and videos are not immediately adjacent
  // Pattern: image or video followed immediately (with minimal spacing) by another image or video
  normalized = normalized.replace(
    /(!\[[^\]]*\]\([^)]+\)|<iframe[^>]*>(?:.*?<\/iframe>|))\s*\n{0,2}\s*(!\[[^\]]*\]\([^)]+\)|<iframe[^>]*>(?:.*?<\/iframe>|))/gis,
    '$1\n\n\n\n$2'
  );

  return normalized;
}

