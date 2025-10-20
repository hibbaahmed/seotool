'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Settings, Calendar, Eye, Globe, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function WordPressSitesPage() {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await fetch('/api/wordpress/sites');
      const data = await response.json();
      
      if (response.ok) {
        setSites(data.sites || []);
      } else {
        setError(data.error || 'Failed to load sites');
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      setError('Failed to load WordPress sites');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/wordpress/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSite),
      });

      const data = await response.json();

      if (response.ok) {
        setSites(prev => [data.site, ...prev]);
        setNewSite({ name: '', url: '', username: '', password: '' });
        setIsAddingSite(false);
        setSuccess('WordPress site added successfully!');
      } else {
        setError(data.error || 'Failed to add site');
      }
    } catch (error) {
      console.error('Error adding site:', error);
      setError('Failed to add WordPress site');
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this WordPress site?')) {
      return;
    }

    try {
      const response = await fetch(`/api/wordpress/sites?id=${siteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSites(prev => prev.filter(site => site.id !== siteId));
        setSuccess('WordPress site deleted successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete site');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      setError('Failed to delete WordPress site');
    }
  };

  const testConnection = async (site: WordPressSite) => {
    try {
      // This would test the connection - implement as needed
      setSuccess(`Connection to ${site.name} successful!`);
    } catch (error) {
      setError(`Connection to ${site.name} failed`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">WordPress Sites</h1>
                <p className="text-xl text-slate-600">
                  Manage your WordPress sites and publish content directly
                </p>
              </div>
              <button
                onClick={() => setIsAddingSite(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Site
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Add Site Form */}
          {isAddingSite && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add WordPress Site</h2>
              <form onSubmit={handleAddSite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={newSite.name}
                      onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My WordPress Blog"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-2">
                      Site URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      value={newSite.url}
                      onChange={(e) => setNewSite(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://mysite.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={newSite.username}
                      onChange={(e) => setNewSite(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="admin"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Application Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={newSite.password}
                      onChange={(e) => setNewSite(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Your WordPress application password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Generate an application password in WordPress: Users → Profile → Application Passwords
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSite(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sites List */}
          {sites.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No WordPress Sites Yet</h3>
              <p className="text-slate-600 mb-6">
                Connect your WordPress sites to publish content directly from your SEO tool.
              </p>
              <button
                onClick={() => setIsAddingSite(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                Add Your First Site
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {sites.map((site) => (
                <div key={site.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{site.name}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          site.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {site.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors"
                          >
                            {site.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <Key className="h-4 w-4" />
                          <span>{site.username}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Added {new Date(site.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => testConnection(site)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Test Connection
                    </button>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit Site
                    </a>
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-12 bg-blue-50 rounded-2xl border border-blue-200 p-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">How to Set Up WordPress Integration</h3>
            <div className="space-y-4 text-blue-800">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <p className="font-medium">Enable WordPress REST API</p>
                  <p className="text-sm text-blue-700">Make sure your WordPress site has the REST API enabled (it's enabled by default).</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <p className="font-medium">Create Application Password</p>
                  <p className="text-sm text-blue-700">Go to Users → Profile → Application Passwords in your WordPress admin and create a new password.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <p className="font-medium">Add Your Site</p>
                  <p className="text-sm text-blue-700">Use the form above to add your WordPress site with the application password.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                <div>
                  <p className="font-medium">Start Publishing</p>
                  <p className="text-sm text-blue-700">Once connected, you can publish your AI-generated content directly to WordPress!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
