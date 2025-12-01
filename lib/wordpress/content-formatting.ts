const TABLE_SEPARATOR_REGEX = /^\|?\s*[:\-]+(?:\s*\|\s*[:\-]+)*\s*\|?$/i;

function parseMarkdownTableRows(rows: string[]): string[][] {
  return rows
    .map(row => row.trim())
    .filter(row => row && !TABLE_SEPARATOR_REGEX.test(row))
    .map(row => row.split('|').map(cell => cell.trim()))
    .map(cells => {
      if (cells.length && cells[0] === '') cells.shift();
      if (cells.length && cells[cells.length - 1] === '') cells.pop();
      return cells;
    })
    .filter(cells => cells.length > 0);
}

function buildHtmlTableFromRows(rows: string[][]): string | null {
  if (rows.length < 2) return null;
  const headers = rows[0];
  const dataRows = rows.slice(1);
  if (!headers.length) return null;

  let html = '<table>\n<thead>\n<tr>\n';
  headers.forEach(header => {
    html += `  <th>${header}</th>\n`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';

  dataRows.forEach(row => {
    html += '<tr>\n';
    headers.forEach((_header, idx) => {
      html += `  <td>${row[idx] ?? ''}</td>\n`;
    });
    html += '</tr>\n';
  });

  html += '</tbody>\n</table>\n';
  return html;
}

export function convertMarkdownTablesToHtml(markdown: string): string {
  const tableBlockRegex = /(^|\n)(\s*\|.+\|\s*(?:\n\s*\|.+\|\s*){1,})(?=\n|$)/g;

  return markdown.replace(tableBlockRegex, (match, prefix: string, tableBlock: string) => {
    const rows = tableBlock
      .split('\n')
      .map(row => row.trim())
      .filter(row => row.startsWith('|') && row.endsWith('|'));

    const parsed = parseMarkdownTableRows(rows);
    const tableHtml = buildHtmlTableFromRows(parsed);

    if (!tableHtml) {
      return match;
    }

    return `${prefix}${tableHtml}`;
  });
}

export function convertHtmlPipeTablesToHtml(html: string): string {
  // Pattern 1: Tables wrapped in a single <p> tag with <br> separators
  const paragraphTableRegex = /<p>(\s*\|[^<]+?\|\s*(?:<br\s*\/?>\s*\|[^<]+?\|\s*)+)\s*<\/p>/gi;

  html = html.replace(paragraphTableRegex, (match, tableContent: string) => {
    const normalized = tableContent.replace(/<br\s*\/?>/gi, '\n');
    const rows = normalized
      .split('\n')
      .map(row => row.trim())
      .filter(row => row.startsWith('|') && row.endsWith('|'));

    const parsed = parseMarkdownTableRows(rows);
    const tableHtml = buildHtmlTableFromRows(parsed);

    return tableHtml ?? match;
  });

  // Pattern 2: Tables as consecutive <p> tags with pipe delimiters
  // Match sequences like: <p>| col1 | col2 |</p><p>| --- | --- |</p><p>| val1 | val2 |</p>
  const consecutivePipeRegex = /(?:<p>\s*\|[^<]+\|\s*<\/p>\s*){2,}/gi;
  
  html = html.replace(consecutivePipeRegex, (match) => {
    // Extract all pipe rows from the consecutive <p> tags
    const rows: string[] = [];
    const pTagRegex = /<p>\s*(\|[^<]+\|)\s*<\/p>/gi;
    let pMatch;
    
    while ((pMatch = pTagRegex.exec(match)) !== null) {
      rows.push(pMatch[1].trim());
    }
    
    if (rows.length < 2) return match;
    
    const parsed = parseMarkdownTableRows(rows);
    const tableHtml = buildHtmlTableFromRows(parsed);
    
    return tableHtml ?? match;
  });

  return html;
}

export function removeExcessiveBoldFromHTML(html: string): string {
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

// Note: We no longer inject <style> blocks as WordPress often strips the tags
// leaving raw CSS visible. Instead, we rely on inline styles applied by addInlineSpacing()
// and the ai-gradient-table class (which WordPress themes can optionally style)

export function ensureWordPressTableStyles(html: string): string {
  if (!html.includes('<table')) {
    return html;
  }

  // Just add the class to tables - inline styles will be applied by addInlineSpacing()
  // We don't add <style> blocks as WordPress often strips them, leaving raw CSS visible
  let processed = html.replace(/<table([^>]*)>/gi, (_match, attrs: string) => {
    if (/class=/i.test(attrs)) {
      if (/\bai-gradient-table\b/i.test(attrs)) {
        return `<table${attrs}>`;
      }
      const updatedAttrs = attrs.replace(
        /class="([^"]*)"/i,
        (_full, classes: string) => ` class="${classes} ai-gradient-table"`
      );
      return `<table${updatedAttrs}>`;
    }
    return `<table class="ai-gradient-table"${attrs}>`;
  });

  return processed;
}

export function addInlineSpacing(html: string): string {
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
  html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
  html = html.replace(
    /<table>/gi,
    '<table style="margin-top: 2.5rem; margin-bottom: 2.5rem; width: 100%; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 22px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); font-size: 15px; border: 1px solid rgba(226, 232, 240, 0.9);">'
  );
  html = html.replace(
    /<thead>/gi,
    '<thead style="background: linear-gradient(120deg, #5561ff 0%, #8c4bff 55%, #b44bff 100%);">'
  );
  html = html.replace(
    /<th>/gi,
    '<th style="color: #f8fafc; font-weight: 600; text-align: left; padding: 18px 26px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; border: none;">'
  );
  html = html.replace(
    /<td>/gi,
    '<td style="padding: 20px 26px; color: #0f172a; line-height: 1.6; border: none; font-weight: 500; border-bottom: 1px solid rgba(226, 232, 240, 0.9);">'
  );
  html = html.replace(
    /<tr>/gi,
    '<tr style="transition: transform 0.15s ease, box-shadow 0.15s ease;">'
  );

  html = ensureWordPressTableStyles(html);

  iframePlaceholders.forEach((iframe, index) => {
    html = html.replace(`__IFRAME_PLACEHOLDER_${index}__`, iframe);
  });

  return ensureWordPressTableStyles(html);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeHeaderImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/"/g, '&quot;');
}

export function insertHeaderImage(
  html: string,
  imageUrl?: string | null,
  altText?: string,
  options: { fallbackToExisting?: boolean } = {}
): string {
  let resolvedUrl = sanitizeHeaderImageUrl(imageUrl);

  if (!resolvedUrl && options.fallbackToExisting) {
    const existingMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (existingMatch && existingMatch[1]) {
      resolvedUrl = sanitizeHeaderImageUrl(existingMatch[1]);
    }
  }

  if (!resolvedUrl || html.includes('ai-header-image')) {
    return html;
  }

  const safeAlt = escapeHtmlAttribute(altText?.trim() || 'Featured article image');
  const headerBlock = `
<figure class="ai-header-image" style="margin: 0 0 2.5rem 0; width: 100%; border-radius: 28px; overflow: hidden; box-shadow: 0 25px 45px rgba(15, 23, 42, 0.18); background: linear-gradient(120deg, rgba(79, 70, 229, 0.08), rgba(236, 72, 153, 0.06));">
  <img src="${resolvedUrl}" alt="${safeAlt}" style="display: block; width: 100%; height: auto; max-height: 520px; object-fit: cover;" loading="lazy" decoding="async" />
</figure>
`.trim();

  // If there's an H1 at the start, REMOVE it and replace with header image
  // (WordPress theme already displays the title, we don't want it duplicated in content)
  if (/<h1[^>]*>[\s\S]*?<\/h1>/.test(html)) {
    return html.replace(/^(\s*)<h1[^>]*>[\s\S]*?<\/h1>\s*/i, `$1${headerBlock}\n\n`);
  }

  return `${headerBlock}\n${html}`;
}

export function stripLeadingHeading(content: string): string {
  if (!content) return content;
  let working = content.replace(/^\uFEFF/, '').trimStart();

  const markdownHeadingMatch = working.match(/^#\s+[^\n]+(\n|$)/);
  if (markdownHeadingMatch) {
    return working.slice(markdownHeadingMatch[0].length).trimStart();
  }

  const htmlHeadingMatch = working.match(/^<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (htmlHeadingMatch) {
    return working.slice(htmlHeadingMatch[0].length).trimStart();
  }

  return content;
}

/**
 * Remove duplicate images from HTML content that match the featured image URL
 * This prevents the featured image from appearing twice (once as WordPress featured image,
 * and once embedded in the content)
 */
export function removeDuplicateFeaturedImage(
  html: string,
  featuredImageUrl?: string | null
): string {
  if (!html || !featuredImageUrl) return html;
  
  const normalizedFeaturedUrl = featuredImageUrl.trim();
  if (!normalizedFeaturedUrl) return html;
  
  // Normalize the URL for comparison (remove trailing slashes, query params, etc.)
  const normalizeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Compare without query params and hash
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.replace(/\/$/, '');
    } catch {
      // If URL parsing fails, just trim and lowercase
      return url.trim().toLowerCase().replace(/\/$/, '');
    }
  };
  
  const normalizedFeatured = normalizeUrl(normalizedFeaturedUrl);
  
  // Find all img tags and their parent elements (figure, p, div, etc.)
  // We'll remove the entire parent element if it only contains the duplicate image
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const imagesToRemove: Array<{ match: string; fullMatch: string; index: number }> = [];
  
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgSrc = match[1];
    const normalizedImgSrc = normalizeUrl(imgSrc);
    
    // Check if this image matches the featured image
    if (normalizedImgSrc === normalizedFeatured || imgSrc === normalizedFeaturedUrl) {
      // Find the full match including the img tag
      const fullMatch = match[0];
      const matchIndex = match.index;
      
      // Mark ALL matching images for removal (including ai-header-image figures)
      // WordPress will display the featured image separately, so we don't want it in content
      imagesToRemove.push({
        match: fullMatch,
        fullMatch: fullMatch,
        index: matchIndex
      });
    }
  }
  
  // Remove images in reverse order to maintain indices
  let result = html;
  for (let i = imagesToRemove.length - 1; i >= 0; i--) {
    const { match: imgTag, index } = imagesToRemove[i];
    
    // Try to remove the entire parent element if it's a figure or p containing only the image
    const beforeImg = result.substring(0, index);
    const afterImg = result.substring(index + imgTag.length);
    
    // Check if the image is inside a figure tag (including ai-header-image)
    const figureMatch = beforeImg.match(/<figure[^>]*>[\s\S]{0,500}$/i);
    if (figureMatch) {
      // Find the closing </figure> tag
      const figureStart = beforeImg.lastIndexOf(figureMatch[0]);
      const remainingAfter = result.substring(figureStart);
      const figureEndMatch = remainingAfter.match(/<\/figure>/i);
      
      if (figureEndMatch) {
        const figureEnd = figureStart + remainingAfter.indexOf(figureEndMatch[0]) + figureEndMatch[0].length;
        // Remove the entire figure (including ai-header-image figures)
        result = result.substring(0, figureStart) + result.substring(figureEnd);
        continue;
      }
    }
    
    // Check if the image is inside a div tag (common wrapper)
    const divMatch = beforeImg.match(/<div[^>]*>[\s\S]{0,1000}$/i);
    if (divMatch) {
      const divStart = beforeImg.lastIndexOf(divMatch[0]);
      const remainingAfter = result.substring(divStart);
      const divEndMatch = remainingAfter.match(/<\/div>/i);
      
      if (divEndMatch) {
        const divEnd = divStart + remainingAfter.indexOf(divEndMatch[0]) + divEndMatch[0].length;
        const divContent = remainingAfter.substring(0, divEndMatch.index || 0);
        // Remove if div contains only whitespace, the image, and maybe some wrapper tags
        const cleanContent = divContent.replace(imgTag, '').replace(/<[^>]+>/g, '').trim();
        if (!cleanContent || /^\s*$/.test(cleanContent)) {
          result = result.substring(0, divStart) + result.substring(divEnd);
          continue;
        }
      }
    }
    
    // Check if the image is inside a paragraph tag
    const pMatch = beforeImg.match(/<p[^>]*>[\s\S]{0,500}$/i);
    if (pMatch) {
      const pStart = beforeImg.lastIndexOf(pMatch[0]);
      const remainingAfter = result.substring(pStart);
      const pEndMatch = remainingAfter.match(/<\/p>/i);
      
      if (pEndMatch) {
        const pEnd = pStart + remainingAfter.indexOf(pEndMatch[0]) + pEndMatch[0].length;
        const pContent = remainingAfter.substring(0, pEndMatch.index || 0);
        // Only remove if paragraph contains only whitespace and the image
        if (/^\s*$/.test(pContent.replace(imgTag, '').replace(/<[^>]+>/g, ''))) {
          result = result.substring(0, pStart) + result.substring(pEnd);
          continue;
        }
      }
    }
    
    // Otherwise, just remove the img tag itself
    result = result.substring(0, index) + result.substring(index + imgTag.length);
  }
  
  return result;
}

/**
 * Fix improperly formatted lists in HTML content
 * Converts plain text that looks like lists into proper HTML lists with headings
 */
export function fixImproperlyFormattedLists(html: string): string {
  if (!html) return html;

  let processed = html;
  
  // Pattern to match sequences of <p> tags that look like list items
  // Match groups of 2+ consecutive <p> tags with short content
  const consecutiveListItems = /((?:<p[^>]*>([^<]{1,100})<\/p>\s*){2,})/gi;
  
  processed = processed.replace(consecutiveListItems, (match) => {
    // Extract all the paragraph contents
    const items: string[] = [];
    const pTagRegex = /<p[^>]*>([^<]+)<\/p>/gi;
    let pMatch;
    
    while ((pMatch = pTagRegex.exec(match)) !== null) {
      const text = pMatch[1].trim();
      // Remove HTML entities and tags for analysis
      const cleanText = text.replace(/&[^;]+;/g, '').replace(/<[^>]+>/g, '');
      
      // Check if it looks like a list item
      // List items are typically: short, don't have multiple sentences, not ending with punctuation
      const isListItem = 
        cleanText.length > 0 && 
        cleanText.length < 120 && 
        !cleanText.match(/[.!?]\s+[A-Z]/) && // Not multiple sentences
        !cleanText.match(/^[A-Z][^.!?]{40,}[.!?]$/); // Not a long sentence ending with punctuation
      
      if (isListItem) {
        items.push(text);
      } else {
        // If we hit something that doesn't look like a list item, stop processing this group
        return match;
      }
    }
    
    // Need at least 2 items to form a list
    if (items.length < 2) {
      return match;
    }
    
    // Check if first item looks like a heading
    // Headings are typically: longer phrases, contain keywords, or are title case
    let heading: string | null = null;
    let listStartIndex = 0;
    
    const firstItem = items[0].replace(/<[^>]+>/g, '').trim();
    const isHeading = 
      firstItem.length > 12 ||
      /^(Site structure|Related Content|Footer Links|Internal|External|Best practices|Common|Key|Important|Technical|SEO|Content|Link)/i.test(firstItem) ||
      (firstItem.split(' ').length >= 2 && firstItem === firstItem.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
    
    if (isHeading) {
      heading = items[0];
      listStartIndex = 1;
      
      // Need at least 2 items after the heading
      if (items.length - listStartIndex < 2) {
        return match;
      }
    }
    
    // Build the HTML
    let result = '';
    if (heading) {
      // Extract text from heading (remove any HTML tags for the heading text)
      const headingText = heading.replace(/<[^>]+>/g, '').trim();
      result += `<h3>${headingText}</h3>\n`;
    }
    
    result += '<ul>\n';
    for (let i = listStartIndex; i < items.length; i++) {
      // Clean up the list item text
      const itemText = items[i].replace(/<[^>]+>/g, '').trim();
      result += `  <li>${itemText}</li>\n`;
    }
    result += '</ul>\n';
    
    return result;
  });
  
  return processed;
}


