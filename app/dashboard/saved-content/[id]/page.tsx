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

  // Extract title from content_output if it exists
  const contentOutput = (data as any).content_output || '';
  let extractedTitle = (data as any).topic || 'Generated Article';
  
  // Try to extract title from the content_output
  // Format variations: **Title**\n[title text], Title:\n[title text], 1. **Title**\n[title text], or Title: "title text"
  const titlePatterns = [
    /(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n([^\n]+)/i,
    /(?:^|\n)Title:\s*"?([^"\n]+)"?/i,
    /(?:^|\n)\*\*Title\*\*[:\s]*\n([^\n]+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = contentOutput.match(pattern);
    if (match && match[1]) {
      extractedTitle = match[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
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


