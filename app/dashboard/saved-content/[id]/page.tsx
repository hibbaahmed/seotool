'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { marked } from 'marked';

interface PageProps {
  params: { id: string };
}

export default async function SavedContentDetailPage({ params }: PageProps) {
  const id = params.id;
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

  const html = marked.parse((data as any).content_output || '') as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{(data as any).topic || 'Generated Article'}</h1>
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


