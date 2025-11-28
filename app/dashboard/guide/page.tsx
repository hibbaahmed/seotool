'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  Globe, 
  Link as LinkIcon, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  ExternalLink,
  Key,
  Plus,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('step1');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="pt-32 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Guide</h1>
                <p className="text-xl text-slate-600 mt-1">
                  Learn how to link your websites and WordPress sites
                </p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Why Link Websites and WordPress Sites?</h2>
            <p className="text-blue-800">
              When you link each WordPress site to its corresponding website, Bridgely automatically ensures that:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-blue-800">
              <li>Content scheduled for <strong>example.com</strong> publishes only to the <strong>example.com blog</strong></li>
              <li>Content scheduled for <strong>mybusiness.com</strong> publishes only to the <strong>mybusiness.com blog</strong></li>
              <li>Your calendar stays organized by website</li>
              <li>Auto-publishing works correctly without manual selection</li>
            </ul>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('step1')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-700 font-bold text-lg">1</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-900">Create or Select a Website</h3>
                    <p className="text-slate-600 text-sm mt-1">Set up your website profile in Bridgely</p>
                  </div>
                </div>
                <ArrowRight 
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'step1' ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedSection === 'step1' && (
                <div className="px-6 pb-6 border-t border-slate-200">
                  <div className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Option A: Quick Add Website</h4>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                        <li>Go to <Link href="/dashboard/keywords" className="text-blue-600 hover:underline">Dashboard → Keywords</Link></li>
                        <li>Click the <strong className="text-slate-900">"Quick Add Website"</strong> button</li>
                        <li>Enter your <strong>Website URL</strong> (e.g., <code className="bg-slate-100 px-1 rounded">https://example.com</code>)</li>
                        <li>Optionally enter your <strong>Business Name</strong> (e.g., <code className="bg-slate-100 px-1 rounded">Example Business</code>)</li>
                        <li>Click <strong>"Analyze Website"</strong></li>
                      </ol>
                      <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        <strong>💡 Tip:</strong> This creates a website profile and automatically discovers keywords for that website. All keywords and content generated for this website will be tagged to it.
                      </p>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Option B: Use Existing Website</h4>
                      <p className="text-slate-700">
                        If you already have a website profile from onboarding, you can skip this step and proceed to connecting WordPress sites.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('step2')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-lg">2</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-900">Connect Your WordPress Sites</h3>
                    <p className="text-slate-600 text-sm mt-1">Link your WordPress.com or self-hosted WordPress blogs</p>
                  </div>
                </div>
                <ArrowRight 
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'step2' ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedSection === 'step2' && (
                <div className="px-6 pb-6 border-t border-slate-200">
                  <div className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">For WordPress.com Sites</h4>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                        <li>Go to <Link href="/dashboard/wordpress-sites" className="text-blue-600 hover:underline">Dashboard → WordPress Sites</Link></li>
                        <li>Click the <strong className="text-slate-900">"+ Add Site"</strong> button</li>
                        <li>Click <strong>"Connect with WordPress.com"</strong></li>
                        <li>Authorize Bridgely to access your WordPress.com account</li>
                        <li>All your WordPress.com sites will automatically appear in the list</li>
                      </ol>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="font-semibold text-slate-900 mb-2">For Self-Hosted WordPress Sites</h4>
                      <p className="text-slate-700 mb-2">
                        Self-hosted WordPress sites require manual connection with your site credentials. Contact support for assistance with self-hosted WordPress setup.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>✅ What happens:</strong> Each WordPress site you connect gets added to your Bridgely account. You can connect multiple WordPress sites for different websites.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('step3')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-700 font-bold text-lg">3</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-900">Link Website ↔ WordPress Site</h3>
                    <p className="text-slate-600 text-sm mt-1">The critical step: map each blog to its website</p>
                  </div>
                </div>
                <ArrowRight 
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'step3' ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedSection === 'step3' && (
                <div className="px-6 pb-6 border-t border-slate-200">
                  <div className="pt-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 font-semibold mb-2">
                        ⚠️ This step is required for proper website separation!
                      </p>
                      <p className="text-sm text-amber-700">
                        Without linking, Bridgely won't know which WordPress site belongs to which website, and auto-publishing may not work correctly.
                      </p>
                    </div>

                    <ol className="list-decimal list-inside space-y-3 text-slate-700 ml-4">
                      <li>On the <Link href="/dashboard/wordpress-sites" className="text-blue-600 hover:underline">WordPress Sites</Link> page, find each WordPress site card</li>
                      <li>Look for the <strong className="text-slate-900">"Linked Website"</strong> dropdown on each site</li>
                      <li>Select the website that blog belongs to:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-slate-600">
                          <li>If it's the example.com blog → select <strong>"example.com"</strong></li>
                          <li>If it's the mybusiness.com blog → select <strong>"mybusiness.com"</strong></li>
                          <li>If it's for another website → select that website</li>
                        </ul>
                      </li>
                      <li>You'll see a green status message: <strong>"Auto-publish will use this website's WordPress site"</strong></li>
                    </ol>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        <strong>✅ Once linked:</strong> This mapping is saved permanently. You only need to do this once per WordPress site. You can change it later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('step4')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-700 font-bold text-lg">4</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-900">Schedule and Publish with Separation</h3>
                    <p className="text-slate-600 text-sm mt-1">Use the calendar to schedule content for the right website</p>
                  </div>
                </div>
                <ArrowRight 
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'step4' ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedSection === 'step4' && (
                <div className="px-6 pb-6 border-t border-slate-200">
                  <div className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Using the Calendar</h4>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                        <li>Go to <Link href="/calendar" className="text-blue-600 hover:underline">Calendar</Link></li>
                        <li>Use the website filter at the top to select a website (e.g., <strong>"example.com"</strong> or <strong>"mybusiness.com"</strong>)</li>
                        <li>Schedule keywords for that website - they'll only show when that website is selected</li>
                        <li>When content is generated, it will <strong>automatically publish</strong> to the WordPress site you linked in Step 3</li>
                      </ol>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Manual Publishing from Saved Content</h4>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                        <li>Go to <Link href="/dashboard/saved-content" className="text-blue-600 hover:underline">Dashboard → Saved Content</Link></li>
                        <li>Open any saved article</li>
                        <li>Click <strong>"Quick Publish to WordPress"</strong></li>
                        <li>Select the WordPress site you want to publish to (or it will use the linked site if available)</li>
                        <li>Click publish</li>
                      </ol>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-sm text-emerald-800">
                        <strong>🎉 Result:</strong> Content scheduled for example.com publishes only to the example.com blog, and content for mybusiness.com publishes only to the mybusiness.com blog. Complete separation!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keywords Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('keywords')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Key className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-900">Managing Keywords</h3>
                    <p className="text-slate-600 text-sm mt-1">Add and organize keywords for your websites</p>
                  </div>
                </div>
                <ArrowRight 
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'keywords' ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedSection === 'keywords' && (
                <div className="px-6 pb-6 border-t border-slate-200">
                  <div className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Manual Keyword Entry</h4>
                      <p className="text-slate-700 mb-2">
                        If you already know which keywords you want to target, you can add them manually:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                        <li>Go to <Link href="/dashboard/keywords" className="text-blue-600 hover:underline">Dashboard → Keywords</Link></li>
                        <li>Click the <strong>"+ Manual Entry"</strong> button</li>
                        <li>Select the website/project you want to add keywords to</li>
                        <li>Enter your keywords, one per line (e.g., <code className="bg-slate-100 px-1 rounded">personal injury lawyer</code>)</li>
                        <li>Optionally check <strong>"Enrich with DataForSEO metrics"</strong> to automatically fetch search volume, difficulty, and CPC data for each keyword</li>
                        <li>Click <strong>"Add Keywords"</strong></li>
                      </ol>
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Tip:</strong> Manual entry is perfect for adding keywords you're already targeting. If you enable DataForSEO enrichment, you'll get full metrics (search volume, difficulty, CPC) just like auto-discovered keywords. Without enrichment, keywords are added with default values and can be updated later.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Filtering Keywords by Website</h4>
                      <p className="text-slate-700 mb-2">
                        The Keywords page now supports website filtering, just like the Calendar:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                        <li>Go to <Link href="/dashboard/keywords" className="text-blue-600 hover:underline">Dashboard → Keywords</Link></li>
                        <li>Use the <strong>"Filter by Website"</strong> dropdown at the top</li>
                        <li>Select <strong>"All Websites"</strong> to see all keywords, or choose a specific website to see only that website's keywords</li>
                        <li>The stats cards and keyword list will update to show only the selected website's data</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/dashboard/keywords"
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">Add Website</div>
                  <div className="text-sm text-slate-600">Quick Add Website</div>
                </div>
              </Link>
              
              <Link 
                href="/dashboard/wordpress-sites"
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">WordPress Sites</div>
                  <div className="text-sm text-slate-600">Connect and link sites</div>
                </div>
              </Link>
              
              <Link 
                href="/calendar"
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">Calendar</div>
                  <div className="text-sm text-slate-600">Schedule content</div>
                </div>
              </Link>
              
              <Link 
                href="/dashboard/saved-content"
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">Saved Content</div>
                  <div className="text-sm text-slate-600">Publish manually</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Troubleshooting</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Content not publishing to the right site?</h4>
                <p className="text-slate-700 text-sm">
                  Make sure you've completed Step 3: Link Website ↔ WordPress Site. Check the WordPress Sites page to verify each site has a website selected in the dropdown.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Getting "invalid_token" errors?</h4>
                <p className="text-slate-700 text-sm">
                  Your WordPress.com connection may have expired. Go to WordPress Sites → Add Site → Connect with WordPress.com again. This refreshes your connection without deleting any data.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Calendar showing all websites mixed together?</h4>
                <p className="text-slate-700 text-sm">
                  Use the website filter at the top of the Calendar page. Select a specific website to see only that website's scheduled content.
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-300">
                <h4 className="font-semibold text-slate-900 mb-2">Still need help?</h4>
                <p className="text-slate-700 text-sm mb-2">
                  If you're still experiencing issues, please contact our support team:
                </p>
                <a 
                  href="mailto:team@bridgely.io" 
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  <span>team@bridgely.io</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

