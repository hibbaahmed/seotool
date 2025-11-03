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
 * Ensure proper spacing between sections
 */
export function normalizeContentSpacing(content: string): string {
  let normalized = content;

  // Ensure double line breaks before H2
  normalized = normalized.replace(/([^\n])\n## /g, '$1\n\n## ');

  // Ensure double line breaks before H3
  normalized = normalized.replace(/([^\n])\n### /g, '$1\n\n### ');

  // Remove excessive line breaks (more than 3)
  normalized = normalized.replace(/\n{4,}/g, '\n\n\n');

  // Ensure proper spacing around tables
  normalized = normalized.replace(/([^\n])\n(\|[^\n]+\|)/g, '$1\n\n$2');
  normalized = normalized.replace(/(\|[^\n]+\|)\n([^\n|])/g, '$1\n\n$2');

  // Ensure proper spacing around blockquotes
  normalized = normalized.replace(/([^\n])\n(> )/g, '$1\n\n$2');
  normalized = normalized.replace(/(> [^\n]+)\n([^>\n])/g, '$1\n\n$2');

  return normalized;
}

