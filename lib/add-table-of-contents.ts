/**
 * Add Table of Contents to markdown content
 * Extracts H2 and H3 headings and creates a navigable TOC
 */

export function addTableOfContents(content: string): string {
  // Extract all H2 and H3 headings
  const headingRegex = /^(##|###)\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1] === '##' ? 2 : 3;
    const text = match[2].trim();
    // Create URL-friendly ID
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    headings.push({ level, text, id });
  }
  
  // Don't add TOC if there are too few headings
  if (headings.length < 3) {
    return content;
  }
  
  // Generate TOC markdown
  let toc = '\n## Table of Contents\n\n';
  headings.forEach(h => {
    const indent = h.level === 3 ? '  ' : '';
    toc += `${indent}* [${h.text}](#${h.id})\n`;
  });
  toc += '\n';
  
  // Insert TOC after introduction (before first H2)
  // Find the first H2 that's not in the first 500 characters (likely after intro)
  const lines = content.split('\n');
  let insertIndex = 0;
  let charCount = 0;
  let foundIntro = false;
  
  for (let i = 0; i < lines.length; i++) {
    charCount += lines[i].length;
    
    // Look for first H2 after ~300 characters (after intro paragraphs)
    if (charCount > 300 && lines[i].startsWith('## ') && !foundIntro) {
      insertIndex = i;
      foundIntro = true;
      break;
    }
  }
  
  // If we found a good spot, insert TOC
  if (insertIndex > 0) {
    lines.splice(insertIndex, 0, toc);
    return lines.join('\n');
  }
  
  // Fallback: insert after first H2
  const firstH2Index = content.indexOf('\n## ');
  if (firstH2Index !== -1) {
    return content.slice(0, firstH2Index) + '\n' + toc + content.slice(firstH2Index);
  }
  
  return content;
}

/**
 * Add anchor IDs to headings in HTML for jump links
 */
export function addAnchorIdsToHeadings(html: string): string {
  // Add IDs to H2 and H3 tags
  html = html.replace(/<h2>(.+?)<\/h2>/gi, (match, text) => {
    const id = text
      .toLowerCase()
      .replace(/<[^>]+>/g, '') // Remove any HTML tags
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `<h2 id="${id}">${text}</h2>`;
  });
  
  html = html.replace(/<h3>(.+?)<\/h3>/gi, (match, text) => {
    const id = text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `<h3 id="${id}">${text}</h3>`;
  });
  
  return html;
}

