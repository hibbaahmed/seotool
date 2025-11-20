import Link from 'next/link';
import { TrendingUp, FileText, Image, Search, ArrowRight, PenTool, Archive, BarChart3, Globe, Link as LinkIcon, Calendar, Code } from 'lucide-react';
import Subscription from '../components/Subscription';
import { Card, CardContent } from '../../components/ui/Card';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome to your Dashboard
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Access all your AI-powered marketing tools in one place
            </p>
          </div>

          {/* Subscription Card - Moved Higher */}
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-lg mb-8">
            <CardContent className="p-6">
              <Subscription />
            </CardContent>
          </Card>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* <Link 
              href="/competitive-analysis"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Competitive Analysis
              </h3>
              <p className="text-slate-600 mb-4">
                Analyze competitors and find content gaps
              </p>
              <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link> */}

            <Link 
              href="/saved-content"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-sky-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Saved Articles
              </h3>
              <p className="text-slate-600 mb-4">
                Browse and manage your AI-generated articles
              </p>
              <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                <span>View Saved Content</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            {/* <Link 
              href="/content-writer"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                AI Content Writer
              </h3>
              <p className="text-slate-600 mb-4">
                Generate high-quality content for any purpose
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link> */}

            {/* <Link 
              href="/seo-research"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                SEO Research
              </h3>
              <p className="text-slate-600 mb-4">
                Research keywords and SEO opportunities
              </p>
              <div className="flex items-center text-orange-600 font-medium group-hover:text-orange-700">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link> */}

            {/* <Link 
              href="/dashboard/editor"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                SEO Editor
              </h3>
              <p className="text-slate-600 mb-4">
                Edit and optimize your content for search engines with AI assistance
              </p>
              <div className="flex items-center text-cyan-600 font-medium group-hover:text-cyan-700">
                <span>Open Editor</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link> */}

            {/* <Link 
              href="/saved"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                All Saved Content
              </h3>
              <p className="text-slate-600 mb-4">
                View and manage all your saved analyses, content, images, and research
              </p>
              <div className="flex items-center text-slate-600 font-medium group-hover:text-slate-700">
                <span>View All Saved</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link> */}

            <Link 
              href="/dashboard/wordpress-sites"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Connect Your Site
              </h3>
              <p className="text-slate-600 mb-4">
                Connect and manage your WordPress sites for direct publishing
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>Manage Sites</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            <Link 
              href="/dashboard/keywords"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Keywords
              </h3>
              <p className="text-slate-600 mb-4">
                View and manage keywords discovered during your onboarding analysis
              </p>
              <div className="flex items-center text-emerald-600 font-medium group-hover:text-emerald-700">
                <span>View Keywords</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            <Link 
              href="/calendar"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Calendar
              </h3>
              <p className="text-slate-600 mb-4">
                Plan, schedule, and manage your content calendar with keyword generation
              </p>
              <div className="flex items-center text-violet-600 font-medium group-hover:text-violet-700">
                <span>View Calendar</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            {/* <Link 
              href="/integrations"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Integrations
              </h3>
              <p className="text-slate-600 mb-4">
                Connect WordPress, Webflow, Notion, Shopify, Wix, Framer and more
              </p>
              <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                <span>Manage Integrations</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link> */}

          </div>

          {/* Recent Activity */}
          {/* <div className="mt-16 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Recent Activity
            </h2>
            <div className="text-slate-600">
              <p>No recent activity yet. Start by exploring one of the tools above!</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
