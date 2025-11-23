'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Loader2, CheckCircle2, Megaphone } from 'lucide-react';

type ContentLength = 'short' | 'medium' | 'long';

interface UserSettings {
  content_length: ContentLength;
  auto_promote_business?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [selectedLength, setSelectedLength] = useState<ContentLength>('long');
  const [autoPromote, setAutoPromote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
      setSelectedLength(data.content_length || 'long');
      setAutoPromote(data.auto_promote_business ?? false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_length: selectedLength,
          auto_promote_business: autoPromote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const data = await response.json();
      setSettings(data);
      setSelectedLength(data.content_length || 'long');
      setAutoPromote(data.auto_promote_business ?? false);
      setSaved(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const contentLengthOptions: Array<{
    value: ContentLength;
    label: string;
    description: string;
    wordCount: string;
  }> = [
    {
      value: 'short',
      label: 'Short',
      description: 'Quick, snackable content perfect for social engagement',
      wordCount: '1,000-1,500 words',
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Balanced depth without overwhelming readers',
      wordCount: '2,000-3,000 words',
    },
    {
      value: 'long',
      label: 'Long',
      description: 'Comprehensive, in-depth articles optimized for SEO ranking',
      wordCount: '3,800-4,200 words',
    },
  ];

  const originalContentLength = settings?.content_length || 'long';
  const originalAutoPromote = settings?.auto_promote_business ?? false;
  const hasChanges =
    selectedLength !== originalContentLength || autoPromote !== originalAutoPromote;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pt-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
          </div>
          <p className="text-lg text-slate-600">
            Customize your content generation preferences
          </p>
        </div>

        {/* Save Button and Messages */}
        <div className="mb-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {saved && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-600">
                Settings saved successfully!
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              saving || !hasChanges
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Content Length Settings */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Content Length
            </h2>
            <p className="text-slate-600">
              Choose the length of content that will be generated for your blog posts. 
              This setting applies to all future content generation.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {contentLengthOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedLength === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="content_length"
                  value={option.value}
                  checked={selectedLength === option.value}
                  onChange={(e) => setSelectedLength(e.target.value as ContentLength)}
                  className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-900">
                      {option.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({option.wordCount})
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Auto Promotion Settings */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Auto Promotion</h2>
                  <p className="text-sm text-slate-500">
                    Spotlight your business throughout every article automatically.
                  </p>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                When enabled, we take the <strong>business_name</strong> and <strong>website_url</strong>{' '}
                you provided during onboarding and weave natural callouts throughout each blog post.
                These callouts look like expert recommendations, not advertisements.
              </p>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Mentions are spaced throughout the article so they feel organic.</li>
                <li>Calls to action automatically link to your onboarding website URL.</li>
                <li>Great for agencies or founders who want their brand present in every post.</li>
              </ul>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">
                {autoPromote ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoPromote}
                onClick={() => setAutoPromote((prev) => !prev)}
                className={`relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  autoPromote ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition duration-200 ${
                    autoPromote ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              autoPromote
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {autoPromote ? (
              <p>
                ✅ Auto promotion is <strong>on</strong>. Future articles will automatically highlight your
                business using your onboarding details.
              </p>
            ) : (
              <p>
                Auto promotion is currently <strong>off</strong>. Enable it whenever you want your brand to
                appear throughout every blog post without manual edits.
              </p>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 How Content Length Works
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Short:</strong> Ideal for attorneys who want concise, actionable content that encourages consultation calls</li>
            <li>• <strong>Medium:</strong> Perfect balance for most businesses looking to provide value without overwhelming readers</li>
            <li>• <strong>Long:</strong> Best for SEO-focused agencies targeting high search rankings with comprehensive content</li>
            <li>• This setting only affects <strong>future</strong> content generation. Existing posts are not changed.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

