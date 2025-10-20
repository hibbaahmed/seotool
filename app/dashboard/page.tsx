import Link from 'next/link';
import { TrendingUp, FileText, Image, Search, ArrowRight, PenTool, History, BookOpen, Camera, BarChart3 } from 'lucide-react';

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

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
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
            </Link>

            <Link 
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
            </Link>

            <Link 
              href="/image-search"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Image className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Image Search
              </h3>
              <p className="text-slate-600 mb-4">
                Find and generate perfect images
              </p>
              <div className="flex items-center text-pink-600 font-medium group-hover:text-pink-700">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            <Link 
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
            </Link>

            <Link 
              href="/dashboard/saved-analyses"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <History className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Saved Analyses
              </h3>
              <p className="text-slate-600 mb-4">
                View and manage your saved competitive analyses
              </p>
              <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                <span>View Saved</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            <Link 
              href="/dashboard/saved-content"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Saved Content
              </h3>
              <p className="text-slate-600 mb-4">
                View and manage your AI-generated content
              </p>
              <div className="flex items-center text-emerald-600 font-medium group-hover:text-emerald-700">
                <span>View Saved</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            <Link 
              href="/dashboard/saved-searches"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Saved Image Searches
              </h3>
              <p className="text-slate-600 mb-4">
                View and manage your AI image search results
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>View Saved</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>

            <Link 
              href="/dashboard/saved-research"
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Saved SEO Research
              </h3>
              <p className="text-slate-600 mb-4">
                View and manage your SEO research results
              </p>
              <div className="flex items-center text-amber-600 font-medium group-hover:text-amber-700">
                <span>View Saved</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Recent Activity
            </h2>
            <div className="text-slate-600">
              <p>No recent activity yet. Start by exploring one of the tools above!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
