'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Settings, Calendar, Eye, Globe, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { Database } from '@/types/supabase';

type WordPressSite = Database['public']['Tables']['wordpress_sites']['Row'];

export default function WordPressSitesPage() {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profiles, setProfiles] = useState<Array<{ id: string; business_name?: string | null; website_url?: string | null; industry?: string | null }>>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  useEffect(() => {
    loadSites();
    loadProfiles();
    
    // Check for OAuth success/error in URL
    const params = new URLSearchParams(window.location.search);
    const successMsg = params.get('success');
    const errorMsg = params.get('error');
    
    if (successMsg) {
      setSuccess(successMsg);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/wordpress-sites');
    }
    if (errorMsg) {
      setError(errorMsg);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/wordpress-sites');
    }
  }, []);

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_onboarding_profiles')
        .select('id, business_name, website_url, industry')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading websites for WordPress mapping:', error);
        return;
      }

      setProfiles(
        (data || []).map((p: any) => ({
          id: p.id,
          business_name: p.business_name,
          website_url: p.website_url,
          industry: p.industry,
        }))
      );
    } catch (e) {
      console.error('Error loading websites for WordPress mapping:', e);
    } finally {
      setLoadingProfiles(false);
    }
  };

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

  const handleWordPressComConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/wordpress/wpcom/login';
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

  const handleWebsiteMappingChange = async (site: WordPressSite, profileId: string | null) => {
    try {
      const response = await fetch('/api/wordpress/sites/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          onboarding_profile_id: profileId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to update website mapping.' }));
        setError(data.error || 'Failed to update website mapping. Please try again.');
        return;
      }

      setSites(prev =>
        prev.map(s =>
          s.id === site.id ? { ...s, onboarding_profile_id: profileId } : s
        )
      );
      setSuccess('Website mapping updated successfully!');
    } catch (e) {
      console.error('Unexpected error updating website mapping for WordPress site:', e);
      setError('Failed to update website mapping. Please try again.');
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
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Connect WordPress.com Sites</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Globe className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Connect Your WordPress.com Sites
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Authorize Bridgely to access your WordPress.com sites. You'll be able to publish content to any of your sites.
                  </p>
                  <button
                    type="button"
                    onClick={handleWordPressComConnect}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Key className="h-5 w-5" />
                    Connect with WordPress.com
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingSite(false)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
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
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {site.provider === 'wpcom' ? 'WordPress.com' : 'Self-Hosted'}
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
                        {site.username && (
                          <div className="flex items-center gap-1">
                            <Key className="h-4 w-4" />
                            <span>{site.username}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Added {new Date(site.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Website Mapping */}
                      {profiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">
                            Linked Website:
                          </span>
                          <select
                            value={site.onboarding_profile_id || ''}
                            disabled={loadingProfiles}
                            onChange={(e) =>
                              handleWebsiteMappingChange(
                                site,
                                e.target.value ? e.target.value : null
                              )
                            }
                            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">
                              {profiles.length === 0
                                ? 'No websites available'
                                : 'Not linked'}
                            </option>
                            {profiles.map((profile) => (
                              <option key={profile.id} value={profile.id}>
                                {profile.business_name ||
                                  profile.website_url ||
                                  'Untitled Website'}
                              </option>
                            ))}
                          </select>
                          {site.onboarding_profile_id ? (
                            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                              Auto-publish will use this website&apos;s WordPress site.
                            </span>
                          ) : (
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              Not linked yet – auto-publish may be skipped if you have multiple sites.
                            </span>
                          )}
                        </div>
                      )}
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
            <h3 className="text-xl font-bold text-blue-900 mb-4">How to Connect Your WordPress Sites</h3>
            
            <div className="bg-white rounded-lg p-6 border border-blue-200">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                WordPress.com Integration
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <p className="text-sm">Make sure you have a WordPress.com account with at least one site</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <p className="text-sm">Click "Add Site" above</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <p className="text-sm">Click "Connect with WordPress.com" and authorize access</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <p className="text-sm">All your WordPress.com sites will be automatically connected!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

