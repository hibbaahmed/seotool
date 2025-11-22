'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Globe,
  Link2,
  Shield,
  AlertCircle,
  CheckCircle,
  Database,
  Loader2,
  Clock,
} from 'lucide-react';

type WebflowSite = {
  id: string;
  name: string;
  site_id: string;
  site_name?: string | null;
  site_slug?: string | null;
  domain?: string | null;
  collection_id: string;
  collection_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ScreenVariant = 'marketing' | 'dashboard';

interface WebflowSitesScreenProps {
  variant?: ScreenVariant;
}

const initialFormState = {
  name: '',
  token: '',
  siteId: '',
  collectionId: '',
};

export default function WebflowSitesScreen({ variant = 'marketing' }: WebflowSitesScreenProps) {
  const [sites, setSites] = useState<WebflowSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/webflow/sites');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Webflow connections');
      }
      setSites(data.sites || []);
    } catch (err) {
      console.error('Error loading Webflow sites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Webflow connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        token: form.token.trim(),
        siteId: form.siteId.trim(),
        collectionId: form.collectionId.trim(),
      };

      const response = await fetch('/api/webflow/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Webflow site');
      }

      setSites((prev) => [data.site, ...prev]);
      setForm(initialFormState);
      setIsAdding(false);
      setSuccess('Webflow collection connected successfully!');
    } catch (err) {
      console.error('Error adding Webflow site:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Webflow site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Delete this Webflow collection connection?')) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/webflow/sites?id=${siteId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete Webflow site');
      }
      setSites((prev) => prev.filter((site) => site.id !== siteId));
      setSuccess('Webflow collection removed.');
    } catch (err) {
      console.error('Error deleting Webflow site:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete Webflow site');
    }
  };

  const handleTestSite = async (siteId: string) => {
    setError('');
    setSuccess('');
    setTestingId(siteId);
    try {
      const response = await fetch('/api/webflow/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed');
      }
      setSuccess('Connection verified successfully!');
    } catch (err) {
      console.error('Error testing Webflow site:', err);
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const topPadding = variant === 'dashboard' ? 'pt-32' : 'pt-20';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className={`${topPadding} px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold mb-2">
                Webflow Integration
              </p>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Connect Your Webflow Collections
              </h1>
              <p className="text-lg text-slate-600">
                Store your Webflow site token, site ID, and collection ID to publish content directly.
              </p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Connect Collection
            </button>
          </div>

          {(error || success) && (
            <div className="mb-6 space-y-3">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  {success}
                </div>
              )}
            </div>
          )}

          {isAdding && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Connect Webflow Collection</h2>
                  <p className="text-sm text-slate-500">
                    Paste your Site API Token, Site ID, and Collection ID to enable publishing.
                  </p>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAddSite} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Label
                    </label>
                    <input
                      type="text"
                      placeholder="Marketing Blog"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Site ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="your-site-id"
                        value={form.siteId}
                        onChange={(e) => setForm((prev) => ({ ...prev, siteId: e.target.value }))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                        required
                      />
                      {form.token && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch('https://api.webflow.com/sites', {
                                headers: {
                                  Authorization: `Bearer ${form.token}`,
                                  'accept-version': '1.0.0',
                                },
                              });
                              const sites = await res.json();
                              if (sites && sites.length > 0) {
                                setForm(prev => ({ ...prev, siteId: sites[0].id }));
                                setSuccess(`Found Site ID: ${sites[0].id}`);
                              } else {
                                setError('No sites found with this token');
                              }
                            } catch (err) {
                              setError('Failed to fetch Site ID. Check your token.');
                            }
                          }}
                          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                        >
                          Fetch ID
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      The Site ID is a long alphanumeric string (like <code className="bg-gray-100 px-1 rounded">62b2b1a8dd516e5800d2505a</code>), NOT the site name/slug like "ripppl". Click "Fetch ID" above after entering your token to automatically get it.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Collection ID
                    </label>
                    <input
                      type="text"
                      placeholder="content-collection-id"
                      value={form.collectionId}
                      onChange={(e) => setForm((prev) => ({ ...prev, collectionId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Open your Webflow Designer → CMS Collections → Select your blog collection → Settings → API Info.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Site API Token
                    </label>
                    <input
                      type="password"
                      placeholder="pat_xxx"
                      value={form.token}
                      onChange={(e) => setForm((prev) => ({ ...prev, token: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Go to Webflow Project Settings → Apps & Integrations → Site API section → Click "Generate API token". Copy it immediately - Webflow only shows it once!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting ? 'Connecting…' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {sites.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Webflow Connections</h3>
              <p className="text-slate-600 mb-6">
                Connect a Webflow collection to publish long-form content directly from Bridgely.
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Connect Webflow
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {sites.map((site) => {
                const siteUrl = site.domain
                  ? site.domain.startsWith('http')
                    ? site.domain
                    : `https://${site.domain}`
                  : null;

                return (
                  <div
                    key={site.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-slate-900">{site.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              site.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {site.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-400" />
                            {site.domain || site.site_name || 'Webflow Site'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-slate-400" />
                            Collection ID:&nbsp;
                            <span className="font-mono text-xs text-slate-700">{site.collection_id}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-slate-400" />
                            Site ID:&nbsp;
                            <span className="font-mono text-xs text-slate-700">{site.site_id}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            Added {new Date(site.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleTestSite(site.id)}
                          disabled={testingId === site.id}
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium border border-emerald-200 hover:bg-emerald-100 disabled:opacity-70"
                        >
                          {testingId === site.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Testing…
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Test Connection
                            </>
                          )}
                        </button>
                        {siteUrl && (
                          <a
                            href={siteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                            Open Site
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteSite(site.id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 bg-blue-50 rounded-2xl border border-blue-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-blue-900">How Webflow Connections Work</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-blue-900">
              <div className="bg-white rounded-xl p-6 border border-blue-100">
                <h4 className="font-semibold mb-4">Generate Your Credentials</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <strong>Step 1:</strong> Open your Webflow Dashboard → Select your project → Click "Settings" (or the three dots menu on the project tile).
                  </li>
                  <li>
                    <strong>Step 2:</strong> In the left sidebar, click <strong>"Apps & Integrations"</strong> (it has a grid icon).
                  </li>
                  <li>
                    <strong>Step 3:</strong> Scroll to the <strong>"Site API"</strong> section. Click <strong>"Generate API token"</strong>. In the modal, set these permissions:
                    <ul className="ml-4 mt-2 space-y-1 list-disc">
                      <li><strong>CMS:</strong> Full access (or Read & write)</li>
                      <li><strong>Sites:</strong> Read (or Read & write)</li>
                    </ul>
                    Set all other permissions to "No access". Click "Generate token" and copy it immediately (Webflow only shows it once!).
                  </li>
                  <li>
                    <strong>Step 4:</strong> After entering your API token in the form above, click the <strong>"Fetch ID"</strong> button next to the Site ID field. This will automatically fetch and populate your Site ID using the Webflow API. The Site ID is a long alphanumeric string (not the site name like "ripppl").
                  </li>
                  <li>
                    <strong>Step 5:</strong> Open the Webflow Designer → Go to <strong>CMS Collections</strong> → Select your blog/news collection → In the right sidebar, click <strong>"Settings"</strong> → Scroll to <strong>"API Info"</strong> → Copy the <strong>Collection ID</strong>.
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 border border-blue-100">
                <h4 className="font-semibold mb-4">Publishing Expectations</h4>
                <ul className="space-y-3 text-sm">
                  <li>- Bridgely securely stores your token server-side.</li>
                  <li>- Each collection connection maps to a single CMS collection.</li>
                  <li>- You can add multiple connections per Webflow site if you manage separate collections.</li>
                  <li>- Delete a connection anytime; tokens are removed immediately.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

