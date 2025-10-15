'use client';

import { useMemo, useState } from 'react';

export default function BlogWriterForm() {
  const [formData, setFormData] = useState({
    topic: '',
    brand: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const disabled = useMemo(() => loading || !formData.topic || !formData.brand, [loading, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/workflows/blog-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to generate blog post');
      }
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">AI Blog Writer</h2>
            <p className="text-slate-500 text-sm mt-1">Enter a topic and brand. We’ll research, write, and add images automatically.</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                placeholder="Best SEO practices for 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                placeholder="YourCompany"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Generating blog post…
                </>
              ) : (
                'Generate Blog Post'
              )}
            </button>
          </form>

          {/* Right: Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Preview</h3>
              {result?.blogPost?.filePath && (
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  {result.blogPost.filePath}
                </a>
              )}
            </div>

            {!result && (
              <div className="flex-1 grid place-items-center text-slate-400 text-sm">
                Generated content will appear here
              </div>
            )}

            {result?.success && (
              <div className="flex-1 overflow-auto rounded-lg bg-white border border-slate-200 p-4">
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Title</div>
                  <div className="text-slate-900 font-medium">{result.blogPost.title}</div>
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Content</div>
                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
{result.blogPost.content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
