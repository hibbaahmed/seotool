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


