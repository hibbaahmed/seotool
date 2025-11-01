import { supabaseAdmin } from '@/lib/supabase/admin';
import { marked } from 'marked';

export default async function SavedContentDetailPage({ params }: any) {
  const id = (await params)?.id ?? params?.id;
  const supabase = await supabaseAdmin();

  const { data, error } = await supabase
    .from('content_writer_outputs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-3xl w-full text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Article not found</h1>
          <p className="text-slate-600">We couldn't find that saved article. It may have been deleted.</p>
        </div>
      </div>
    );
  }

  // Extract title from content_output - prioritize generated title over topic
  const contentOutput = (data as any).content_output || '';
  const topic = (data as any).topic || 'Generated Article';
  let extractedTitle = null;
  
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
  
  // Final fallback: use topic only if absolutely no title found
  if (!extractedTitle) {
    extractedTitle = topic;
  }

  // Clean content by removing Title and Meta Description sections
  let cleanedContent = contentOutput;
  
  // Remove Title section (with various formats)
  cleanedContent = cleanedContent.replace(/(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n[^\n]+\n?/gi, '');
  cleanedContent = cleanedContent.replace(/(?:^|\n)Title:\s*"?[^"\n]+"?\n?/gi, '');
  
  // Remove Meta Description section (with various formats)
  cleanedContent = cleanedContent.replace(/(?:^|\n)(?:\d+\.\s*)?\*\*Meta Description\*\*[:\s]*\n[^\n]+\n?/gi, '');
  cleanedContent = cleanedContent.replace(/(?:^|\n)Meta Description:\s*"?[^"\n]+"?\n?/gi, '');
  
  // If there's a "Content" section header, remove it too (keep only the content itself)
  cleanedContent = cleanedContent.replace(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/gi, '\n');
  cleanedContent = cleanedContent.replace(/(?:^|\n)(?:\d+\.\s*)?#\s*Content[:\s]*\n/gi, '\n');
  
  // Remove the duplicate H1 title (which appears as "# [Title]" after the Content section marker)
  // This is the title that matches the extracted title, so we remove it to avoid duplication
  const lines = cleanedContent.split('\n');
  let startIndex = 0;
  
  // Skip duplicate H1 at the start (which matches the extracted title)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    // Check if this is an H1 that matches the extracted title
    if (line.match(/^#\s+.+$/)) {
      const h1Title = line.replace(/^#\s+/, '').trim();
      // If the H1 matches the extracted title (allowing for small variations), skip it
      if (h1Title.toLowerCase() === extractedTitle.toLowerCase() || 
          h1Title.toLowerCase().includes(extractedTitle.toLowerCase()) ||
          extractedTitle.toLowerCase().includes(h1Title.toLowerCase())) {
        startIndex = i + 1;
        // Skip any blank lines after the H1
        while (startIndex < lines.length && lines[startIndex].trim() === '') {
          startIndex++;
        }
        break;
      } else if (line && !line.match(/^\d+\./)) {
        // Found actual content (not a heading or numbered item)
        startIndex = i;
        break;
      }
    } else if (line && !line.startsWith('#') && !line.match(/^\d+\./)) {
      // Found actual content (not a heading or numbered item)
      startIndex = i;
      break;
    }
  }
  
  cleanedContent = lines.slice(startIndex).join('\n');
  
  // Apply paragraph spacing (similar to processContent function)
  // Ensure blank lines between paragraphs
  const linesArray = cleanedContent.split('\n');
  const spacedLines: string[] = [];
  
  for (let i = 0; i < linesArray.length; i++) {
    const currentLine = linesArray[i];
    const currentTrimmed = currentLine.trim();
    
    spacedLines.push(currentLine);
    
    // Check if we need to add spacing after this line
    if (i < linesArray.length - 1) {
      const nextLine = linesArray[i + 1];
      const nextTrimmed = nextLine.trim();
      
      // Skip if current line is already blank
      if (!currentTrimmed) {
        continue;
      }
      
      // If current line is a paragraph (non-structural) and next line is also a paragraph
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
        // Check if there's NOT already a blank line between them
        let hasBlankLine = false;
        for (let j = i + 1; j < linesArray.length && j <= i + 2; j++) {
          if (!linesArray[j].trim()) {
            hasBlankLine = true;
            break;
          }
          // If we hit another paragraph or structural element, stop looking
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
  
  cleanedContent = spacedLines.join('\n');
  
  // Clean up any triple+ newlines (should be max 2)
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
  
  // Trim any leading/trailing whitespace
  cleanedContent = cleanedContent.trim();

  const html = marked.parse(cleanedContent || '') as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{extractedTitle}</h1>
            {(data as any).created_at && (
              <p className="text-sm text-slate-500 mb-6">Saved on {new Date((data as any).created_at).toLocaleString()}</p>
            )}
            <div className="prose prose-lg max-w-none content-writer-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
}


