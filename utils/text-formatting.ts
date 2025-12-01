/**
 * Utility functions for text formatting to prevent unwanted line breaks
 */

/**
 * Prevent breaking in abbreviations like U.S., Dr., Mr., etc.
 * Replaces patterns like "U.S." with "U.\u00A0S." (non-breaking space)
 * 
 * @param text - The text to process
 * @returns Text with non-breaking spaces in abbreviations
 */
export function preventAbbreviationBreaks(text: string): string {
  if (!text) return '';
  
  // Common abbreviation patterns: single letter, period, single letter
  // Examples: U.S., Dr., Mr., Mrs., Ms., Ph.D., etc.
  // Pattern: word boundary, single capital letter, period, single capital letter, word boundary
  // Also handle multi-letter abbreviations like U.S.A. -> U.\u00A0S.\u00A0A.
  let result = text;
  
  // Handle patterns like "U.S." (single letter, period, single letter)
  result = result.replace(/\b([A-Z])\.([A-Z])\b/g, '$1.\u00A0$2');
  
  // Handle patterns like "U.S.A." (multiple single letters with periods)
  result = result.replace(/\b([A-Z])\.([A-Z])\.([A-Z])\b/g, '$1.\u00A0$2.\u00A0$3');
  
  // Handle patterns like "Ph.D." (letters, period, single letter, period)
  result = result.replace(/\b([A-Z][a-z]+)\.([A-Z])\./g, '$1.\u00A0$2.');
  
  return result;
}

/**
 * React hook to format text with abbreviation breaks prevented
 * Use this in React components for text that might contain abbreviations
 */
export function useFormattedText(text: string | null | undefined): string {
  if (!text) return '';
  return preventAbbreviationBreaks(text);
}

