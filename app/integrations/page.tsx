'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Link as LinkIcon, Globe, CheckCircle, AlertCircle, Send } from 'lucide-react';

type Integration = {
  id: string;
  provider: string;
  name: string;
  config: any;
  created_at: string;
};

type Provider = 'wordpress'|'wpcom'|'webflow'|'notion'|'shopify'|'wix'|'framer'|'webhook';

const providers: { key: Provider; label: string }[] = [
  { key: 'wordpress', label: 'WordPress (Self-hosted)' },
  { key: 'wpcom', label: 'WordPress.com' },
  { key: 'webflow', label: 'Webflow' },
  { key: 'notion', label: 'Notion' },
  { key: 'shopify', label: 'Shopify Blog' },
  { key: 'wix', label: 'Wix Blog' },
  { key: 'framer', label: 'Framer CMS' },
  { key: 'webhook', label: 'Webhook' },
];

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState<Provider>('wordpress');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string>('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/integrations');
    const data = await res.json();
    if (res.ok) setItems(data.integrations || []);
    setLoading(false);
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/integrations?id=${id}`, { method: 'DELETE' });
    if (res.ok) setItems(items.filter(i => i.id !== id));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, name, config }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems([data.integration, ...items]);
      setAdding(false);
      setName('');
      setConfig({});
    } else {
      setMessage(data.error || 'Failed to connect');
    }
  };

  const renderConfigFields = () => {
    const field = (key: string, label: string, type: 'text'|'password' = 'text', placeholder?: string) => (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <input
          type={type}
          value={config[key] || ''}
          onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
        />
      </div>
    );

    switch (provider) {
      case 'wordpress':
        return (
          <>
            {field('url', 'Site URL', 'text', 'https://yoursite.com')}
            {field('username', 'Username')}
            {field('password', 'Application Password', 'password')}
            {field('postType', 'Post Type (optional)', 'text', 'posts')}
          </>
        );
      case 'wpcom':
        return (<>
          {field('accessToken', 'Access Token', 'password')}
          {field('siteId', 'Site ID')}
        </>);
      case 'webflow':
        return (<>
          {field('token', 'Token', 'password')}
          {field('siteId', 'Site ID')}
          {field('collectionId', 'Collection ID')}
        </>);
      case 'notion':
        return (<>
          {field('token', 'Integration Token', 'password')}
          {field('databaseId', 'Database ID')}
        </>);
      case 'shopify':
        return (<>
          {field('storeDomain', 'Store Domain', 'text', 'yourstore.myshopify.com')}
          {field('accessToken', 'Admin API Token', 'password')}
          {field('blogId', 'Blog ID')}
          {field('apiVersion', 'API Version (optional)', 'text', '2024-07')}
        </>);
      case 'wix':
        return (<>
          {field('accessToken', 'Access Token', 'password')}
          {field('blogId', 'Blog ID (optional)')}
        </>);
      case 'framer':
        return (<>
          {field('token', 'API Token', 'password')}
          {field('projectId', 'Project ID')}
          {field('collectionId', 'Collection ID')}
        </>);
      case 'webhook':
        return (<>
          {field('url', 'Webhook URL')}
          {field('secret', 'Secret (optional)', 'password')}
        </>);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Integrations</h1>
              <p className="text-xl text-slate-600">Connect platforms to auto-publish your content</p>
            </div>
            <button
              onClick={() => setAdding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" /> Add Integration
            </button>
          </div>

          {adding && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Connect a Provider</h2>
              {message && (
                <div className="mb-4 p-3 rounded border flex items-center gap-2 text-sm text-red-700 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  {message}
                </div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
                    <select
                      value={provider}
                      onChange={e => { setProvider(e.target.value as Provider); setConfig({}); }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    >
                      {providers.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="My Site / Blog"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderConfigFields()}
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">Connect</button>
                  <button type="button" onClick={() => setAdding(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Integrations Yet</h3>
              <p className="text-slate-600 mb-6">Connect platforms to start auto-publishing content.</p>
              <button onClick={() => setAdding(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add Integration
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map(i => (
                <div key={i.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{i.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{i.provider}</span>
                    </div>
                    <p className="text-xs text-slate-500">Connected {new Date(i.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onDelete(i.id)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






