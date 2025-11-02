/**
 * Decode HTML entities in strings (especially for titles from WordPress)
 * Converts entities like &#8217; to actual characters like '
 */

export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  // Create a temporary DOM element to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  let decoded = textarea.value;
  
  // Also handle numeric entities manually for server-side usage
  // Common WordPress entities
  decoded = decoded.replace(/&#8217;/g, "'");
  decoded = decoded.replace(/&#8216;/g, "'");
  decoded = decoded.replace(/&#8220;/g, '"');
  decoded = decoded.replace(/&#8221;/g, '"');
  decoded = decoded.replace(/&#8211;/g, '–');
  decoded = decoded.replace(/&#8212;/g, '—');
  decoded = decoded.replace(/&apos;/g, "'");
  decoded = decoded.replace(/&rsquo;/g, "'");
  decoded = decoded.replace(/&lsquo;/g, "'");
  decoded = decoded.replace(/&quot;/g, '"');
  decoded = decoded.replace(/&ldquo;/g, '"');
  decoded = decoded.replace(/&rdquo;/g, '"');
  decoded = decoded.replace(/&ndash;/g, '–');
  decoded = decoded.replace(/&mdash;/g, '—');
  decoded = decoded.replace(/&amp;/g, '&');
  
  return decoded;
}

/**
 * Server-side version that doesn't require DOM
 */
export function decodeHtmlEntitiesServer(text: string): string {
  if (!text) return text;
  
  // Handle numeric entities
  let decoded = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  // Handle hex entities
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Handle named entities
  decoded = decoded.replace(/&apos;/g, "'");
  decoded = decoded.replace(/&rsquo;/g, "'");
  decoded = decoded.replace(/&lsquo;/g, "'");
  decoded = decoded.replace(/&quot;/g, '"');
  decoded = decoded.replace(/&ldquo;/g, '"');
  decoded = decoded.replace(/&rdquo;/g, '"');
  decoded = decoded.replace(/&ndash;/g, '–');
  decoded = decoded.replace(/&mdash;/g, '—');
  decoded = decoded.replace(/&amp;/g, '&');
  decoded = decoded.replace(/&nbsp;/g, ' ');
  
  return decoded;
}

