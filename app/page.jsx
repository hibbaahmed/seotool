"use client"
import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Sparkles, CheckCircle, Star, Users, Clock, Shield, Code, Globe, Award, Quote, Zap, TrendingUp, Briefcase, Lightbulb, ChevronDown, Search, Link2, Image, Megaphone, Plug } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import { supabaseBrowser } from '@/lib/supabase/browser';
import PricingSection from "../components/PricingSection";
import { Footer } from "../components/layout/Footer";

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <button
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold text-slate-900 text-lg pr-8">{question}</span>
                <ChevronDown 
                    className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                    }`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="px-6 pb-5 pt-0">
                    <p className="text-slate-600 leading-relaxed">{answer}</p>
                </div>
            </div>
        </div>
    );
};
const HomePage = () => {
    const router = useRouter();
    const cloudflareStreamId = process.env.NEXT_PUBLIC_CF_STREAM_UID;
    const [websiteUrl, setWebsiteUrl] = useState('');

    useEffect(() => {
        const checkUserOnboarding = async () => {
            const supabase = supabaseBrowser();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Check if user has completed onboarding
                const { data: onboardingProfile } = await supabase
                    .from('user_onboarding_profiles')
                    .select('onboarding_status')
                    .eq('user_id', user.id)
                    .single();
                
                // Check if user has an active subscription
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('customer_id, subscription_id')
                    .eq('user_id', user.id)
                    .single();
                
                const hasSubscription = !!subscription?.customer_id;
                const hasCompletedOnboarding = onboardingProfile?.onboarding_status === 'completed';
                
                // If user has subscription but hasn't completed onboarding, redirect to onboarding
                if (hasSubscription && !hasCompletedOnboarding) {
                    router.push('/onboarding');
                    return;
                }
                
                // If user doesn't have subscription, show pricing first (before onboarding)
                if (!hasSubscription) {
                    router.push('/price');
                    return;
                }
                
                // If user has completed onboarding, go to dashboard
                if (hasCompletedOnboarding) {
                    router.push('/dashboard');
                    return;
                }
            }
        };

        checkUserOnboarding();
    }, [router]);
    return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-visible bg-white">
      <Nav/>
            {/* Content */}
            <div className="relative z-10 text-slate-900">
                
                {/* Hero Section */}
                <section className="flex items-center justify-center min-h-[85vh] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-20 overflow-visible">
                    <div className="text-center max-w-6xl mx-auto w-full">
                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold leading-[1.2] mb-8 tracking-tight px-2">
                            <span className="text-slate-900">
                                Grow Google, ChatGPT Traffic on{' '}
                            </span>
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Autopilot
                            </span>
                        </h1>
                        
                        {/* Subheadline */}
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-700 mb-12 max-w-3xl mx-auto leading-relaxed font-semibold">
                            Rank on Google. Get cited on ChatGPT. We research, write, and publish SEO content for you — 24/7, on autopilot.
                        </p>
                        
                        {/* CTA Button */}
                        <div className="flex justify-center mb-6">
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-semibold text-base sm:text-lg transition-colors duration-200 group"
                            >
                                Start Growing Your Traffic
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
                            </Link>
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-12">
                            <div className="flex items-center gap-2 text-slate-700">
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    50k+
                                </div>
                                <span className="text-sm text-slate-600">Articles Created</span>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-2xl font-bold text-slate-900">4.9/5</span>
                                </div>
                                <span className="text-sm text-slate-600">Rated</span>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
                            <div className="text-sm text-slate-600 max-w-xs">
                                Generated 10,000+ articles for customers worldwide
                            </div>
                        </div>

                        {/* Demo Video */}
                        <div className="w-full max-w-4xl mx-auto mb-8">
                            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                                {cloudflareStreamId ? (
                                  <iframe
                                    src={`https://iframe.videodelivery.net/${cloudflareStreamId}?autoplay=true&muted=true`}
                                    title="Bridgely SEO automation tool demo"
                                    loading="lazy"
                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
                                    Add NEXT_PUBLIC_CF_STREAM_UID to show the video
                                  </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                  </div>
                  
            {/* Main Content */}
            <div className="bg-white text-slate-900 relative z-20">
                
                {/* Problem Section */}
                <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Stop Wasting Time on SEO. Start Getting Results.
                            </h2>
                            <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
                                You're spending too much time on content that doesn't rank. Hiring writers costs too much. Managing SEO tools is overwhelming. Let Bridgely handle it all automatically, so you can focus on what actually grows your business.
                            </p>
                        </div>

                        {/* Visual Comparison: Challenge vs Solution */}
                        <div className="relative mb-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                                {/* Left Column - With Bridgely */}
                                <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 lg:p-8">
                                    <div className="mb-6">
                                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                                            With Bridgely
                                        </h3>
                                        <p className="text-slate-600 text-sm">The smart, data-driven automated approach:</p>
                                    </div>
                                    
                                    {/* Gemini Image */}
                                    <div className="mb-6">
                                        <NextImage
                                            src="/gemini.png"
                                            alt="Bridgely Analytics Dashboard"
                                            width={600}
                                            height={400}
                                            className="rounded-xl shadow-lg object-contain w-full"
                                            priority
                                        />
                                    </div>
                                    
                                    {/* Solution Features */}
                                    <div className="space-y-3 mb-6">
                                        {[
                                            { num: "1", text: "Add Your Website (5 minutes)", desc: "Our AI analyzes your business and finds high-potential keywords automatically." },
                                            { num: "2", text: "Plan Months of Content in Seconds", desc: "Turn keywords into a full content calendar. AI handles everything daily." },
                                            { num: "3", text: "Get Traffic on Autopilot", desc: "Bridgely works behind the scenes—researching, writing, optimizing, and publishing." }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-white text-xs font-bold">{item.num}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-slate-900 font-semibold text-sm mb-1">{item.text}</div>
                                                    <div className="text-slate-600 text-xs">{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <Link 
                                        href="/dashboard"
                                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full group"
                                    >
                                        Start Growing Traffic Now
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>

                                {/* VS Divider */}
                                <div className="hidden lg:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                                    <div className="bg-slate-100 text-slate-600 font-bold text-sm px-4 py-2 rounded-full border-2 border-white shadow-lg">
                                        VS
                                    </div>
                                </div>

                                {/* Right Column - The Challenge */}
                                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 lg:p-8">
                                    <div className="mb-6">
                                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                                            The Challenge
                                        </h3>
                                        <p className="text-slate-600 text-sm">The backwards approach that wastes time and money:</p>
                                    </div>
                                    
                                    {/* Gemini2 Image */}
                                    <div className="mb-6">
                                        <NextImage
                                            src="/gemini2.png"
                                            alt="The Challenge - Backwards Approach"
                                            width={600}
                                            height={400}
                                            className="rounded-xl shadow-lg object-contain w-full"
                                            priority
                                        />
                                    </div>
                                    
                                    {/* Problem List */}
                                    <div className="space-y-3">
                                        {[
                                            { text: "Endless hours writing, editing, and optimizing" },
                                            { text: "High costs for freelancers or agency retainers" },
                                            { text: "Paying for multiple, expensive SEO tools" },
                                            { text: "Guessing which keywords will actually work" },
                                            { text: "Wasting time on content that never ranks" }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-red-600 text-xs font-bold">×</span>
                                                </div>
                                                <span className="text-slate-700 text-sm">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Callout */}
                        <div className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-8 md:p-10 text-center text-white shadow-lg overflow-hidden">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative z-10">
                                <div className="mb-5">
                                    <h3 className="text-2xl md:text-3xl font-semibold mb-3 leading-tight">
                                        Ready to Automate Your SEO?
                                    </h3>
                                    <p className="text-base md:text-lg text-blue-50/90 max-w-2xl mx-auto leading-relaxed">
                                        Join 500+ businesses scaling their content with Bridgely.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link 
                                        href="/dashboard"
                                        className="group inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-7 py-3 rounded-lg font-medium text-base transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Get Started Today
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="features">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-16">
                            <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                                HOW IT WORKS
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-12">
                                <div className="flex-1">
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                                        How we <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">automate SEO</span> for you
                                        <ArrowRight className="inline-block w-8 h-8 md:w-10 md:h-10 text-slate-900 ml-2 transform rotate-[-45deg]" />
                                    </h2>
                                </div>
                                <div className="flex-1 lg:max-w-xl">
                                    <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                                        Stop wasting hours on manual SEO work. Our AI platform handles keyword research, content creation, and optimization—delivering ranking articles every single day, automatically.
                                    </p>
                                    <Link 
                                        href="/dashboard"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                                    >
                                        See It In Action
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Three Step Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Step 1: Deep Analysis */}
                            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                                        <Sparkles className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                        Discover your winning keywords
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Our AI analyzes your industry, competitors, and audience to uncover high-opportunity keywords you're missing. Get data-driven insights that actually convert.
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                                    <div className="mb-3">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Enter Your Website</label>
                                        <input
                                            type="text"
                                            placeholder="yourbusiness.com"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                            className="w-full bg-white rounded-lg px-4 py-3 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={() => router.push('/login')}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Find Keywords
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Step 2: 30-Day Plan */}
                            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                                        <Clock className="w-7 h-7 text-indigo-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                        Build your content calendar
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Instantly schedule weeks of content. Each article targets high-value keywords ranked by traffic potential and competition level—so you know exactly what to publish and when.
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                                    <div className="space-y-3">
                                        <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-xs font-semibold text-indigo-600">4 Sat</div>
                                                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Published</span>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900 mb-2">how to write blog posts</div>
                                            <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                                                <span>Volume: 2154</span>
                                                <span>Difficulty: 9</span>
                                            </div>
                                            <button 
                                                onClick={() => window.location.href = '/login'}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1"
                                            >
                                                View Article
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm opacity-75">
                                            <div className="text-xs font-semibold text-indigo-600 mb-2">5 Sun</div>
                                            <div className="text-sm font-semibold text-slate-900 mb-2">how to monetize b...</div>
                                            <div className="flex items-center gap-4 text-xs text-slate-600">
                                                <span>Volume: 1950</span>
                                                <span>Difficulty: 12</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Generate on Autopilot */}
                            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                                        <Zap className="w-7 h-7 text-purple-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                        Publish ranking content daily
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Every morning, wake up to a new SEO-optimized article ready to publish. We handle research, writing, optimization, and formatting—you get traffic without the work.
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                                    <div className="text-center">
                                        <div className="relative inline-block mb-4">
                                            <div className="w-32 h-32 rounded-full border-8 border-green-200 flex items-center justify-center">
                                                <div className="w-24 h-24 rounded-full border-8 border-green-500 flex items-center justify-center">
                                                    <span className="text-3xl font-bold text-slate-900">97%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-900 mb-2">SEO Quality Score</div>
                                        <div className="text-xs text-slate-600">2,554 words • 7 sections</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Everything You Need Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                                Everything You Need to Get Traffic on Autopilot
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                Bridgely includes all the tools and features you need to create, optimize, and publish content that ranks and gets you traffic on autopilot.
                            </p>
                        </div>

                        {/* 3x3 Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Auto Keywords */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                        <Search className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Auto Keywords</h3>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    After onboarding, Bridgely analyzes your niche and competitors to build a personalized keyword list filled with opportunities to get traffic from.
                                </p>
                                <div className="space-y-2">
                                    {['AI blog generator', 'content automation', 'GEO writing tool'].map((keyword, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-slate-700 font-medium">{keyword}</span>
                                            <span className="text-slate-500 ml-auto">{idx === 0 ? '1.2K' : idx === 1 ? '890' : '650'}</span>
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Auto Research */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Auto Research</h3>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    Before writing, Bridgely analyzes top-ranking articles for your keyword and gets data on how to create a better article to outrank them.
                                </p>
                                <div className="space-y-2">
                                    <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 text-center">Competitor Analysis</div>
                                    <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 text-center">Top Rankings</div>
                                </div>
                            </div>

                            {/* Auto Linking */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                        <Link2 className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Auto Linking</h3>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    Bridgely automatically adds internal, external links to every post - helping your content rank higher and look more trustworthy to search engines.
                                </p>
                                <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg p-3 border border-slate-200">
                                    <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
                                        <p>SEO optimization involves understanding search engine algorithms and implementing best practices.</p>
                                        <p>
                                            Learn more about <span className="font-bold text-blue-600 underline underline-offset-2 bg-blue-50 px-1 py-0.5 rounded">internal linking strategies</span> to improve your site structure.
                                        </p>
                                        <p>
                                            According to <span className="font-bold text-green-600 underline underline-offset-2 bg-green-50 px-1 py-0.5 rounded">authoritative sources</span>, content quality is crucial for rankings.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-xs text-slate-600">2 internal links</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-xs text-slate-600">1 external link</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Auto Media */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                        <Image className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Auto Media</h3>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    Have good looking articles without extra time. Auto Media takes images and videos from the web that match your content, automatically finding and inserting relevant visuals.
                                </p>
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-3 border border-slate-200">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div className="aspect-video bg-gradient-to-br from-blue-200 to-indigo-200 rounded flex items-center justify-center">
                                            <Image className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="aspect-video bg-gradient-to-br from-purple-200 to-pink-200 rounded flex items-center justify-center">
                                            <Image className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>2 images found</span>
                                        <span className="mx-1">•</span>
                                        <span>1 video embedded</span>
                                    </div>
                                </div>
                            </div>

                            {/* Auto Promotion */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                                        <Megaphone className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Auto Promotion</h3>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    Our AI strategically places your business mentions throughout each article. Turn every blog post into a converting sales page without being promotional.
                                </p>
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                                    <div className="text-xs text-slate-700 leading-relaxed mb-2">
                                        Companies like <span className="font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">Your Business</span> offer solutions that help streamline workflows and boost productivity.
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>3 mentions added</span>
                                    </div>
                                </div>
                            </div>

                            {/* Integrations */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                        <Plug className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Integrations</h3>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    Connect your WordPress site - then forget about it. Bridgely will publish content to your site everyday on autopilot.
                                </p>
                                <div className="flex items-center justify-center mb-3">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 flex items-center justify-center min-h-[70px] w-full">
                                        <div className="text-base font-bold text-blue-700">WordPress</div>
                                    </div>
                                </div>
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors">
                                    Enable Integration
                                </button>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="testimonials">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Trusted by leading businesses<br />
                                <span className="text-blue-600">delivering real results</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[{
                                name: 'Sarah Johnson',
                                role: 'SEO Director',
                                company: 'Digital Growth Solutions',
                                quote: 'Bridgely has revolutionized our content workflow. We\'ve seen a 300% increase in content output while maintaining quality.',
                                initial: 'S'
                            },{
                                name: 'Mike Chen',
                                role: 'Founder',
                                company: 'TechStart Marketing',
                                quote: 'The AI SEO Agent alone has saved us 20 hours per week. Our clients are seeing better rankings and more traffic.',
                                initial: 'M'
                            },{
                                name: 'Emily Rodriguez',
                                role: 'Content Manager',
                                company: 'ScaleUp Solutions',
                                quote: 'Finally, a tool that understands SEO from the ground up. Our clients love the results and we love the time savings.',
                                initial: 'E'
                            }].map((testimonial, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                                    <div className="flex items-center mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <Quote className="w-8 h-8 text-slate-400 mb-4" />
                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                        {testimonial.quote}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {testimonial.initial}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{testimonial.name}</div>
                                            <div className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Backlink Exchange Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                                <Link2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                                Backlink Exchange Network
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                Connect with quality websites in your niche. Exchange backlinks automatically and build domain authority—all within Bridgely.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                    <Search className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Find Quality Partners</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Discover relevant websites in your niche with matching domain authority and traffic. Our AI matches you with the best exchange partners.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Automatic Exchange</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Set it once and forget it. Bridgely handles the entire backlink exchange process—from outreach to link placement and monitoring.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Boost Domain Authority</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Build quality backlinks that improve your search rankings. Every exchange is monitored to ensure you're getting high-quality, relevant links.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 md:p-12 border-2 border-blue-200 shadow-xl">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                                        How It Works
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                1
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Submit Your Site</h4>
                                                <p className="text-slate-600 text-sm">Add your website to our network and set your niche, domain authority, and preferences.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                2
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Get Matched</h4>
                                                <p className="text-slate-600 text-sm">Our system automatically finds compatible partners based on your niche and domain metrics.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                3
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Exchange Links</h4>
                                                <p className="text-slate-600 text-sm">Bridgely handles the entire exchange—outreach, negotiation, and link placement—all automatically.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                            <div>
                                                <div className="font-semibold text-slate-900">Active Exchanges</div>
                                                <div className="text-2xl font-bold text-blue-600">250+</div>
                                            </div>
                                            <Globe className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                            <div>
                                                <div className="font-semibold text-slate-900">Avg. DA Increase</div>
                                                <div className="text-2xl font-bold text-indigo-600">+12</div>
                                            </div>
                                            <TrendingUp className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                                            <div>
                                                <div className="font-semibold text-slate-900">Network Size</div>
                                                <div className="text-2xl font-bold text-purple-600">1,200+</div>
                                            </div>
                                            <Users className="w-8 h-8 text-purple-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link 
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Join the Backlink Exchange Network
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <p className="text-sm text-slate-500 mt-4">Included with all Bridgely plans</p>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <div id="pricing">
                    <PricingSection />
                </div>

                {/* Final CTA Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-slate-900">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                            Ready to transform your<br />
                            SEO workflow?
                        </h2>
                        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Join 500+ businesses already using Bridgely to rank on Google and get cited on ChatGPT.
                        </p>
                        
                        <div className="flex justify-center mb-12">
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-semibold text-base sm:text-lg transition-colors duration-200 group"
                            >
                                Automate Your SEO Now
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
                            </Link>
                        </div>

                        <div className="flex items-center justify-center gap-8 text-slate-500 text-sm flex-wrap">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>30 articles per month</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Fully automated publishing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-lg text-slate-600">
                                Everything you need to know about Bridgely
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    question: "How does Bridgely generate and publish articles automatically?",
                                    answer: "Bridgely uses AI-powered automation to research keywords, create SEO-optimized content, and publish directly to your WordPress site or other platforms. Once configured, the system runs 24/7, generating up to 30 articles per month based on your keyword strategy."
                                },
                                {
                                    question: "Can I customize the content that gets generated?",
                                    answer: "Yes! You can set your keyword strategy, customize content style, add your brand voice, and review content before it's published. You also have unlimited AI rewrites to fine-tune any article to match your exact requirements."
                                },
                                {
                                    question: "What platforms does Bridgely integrate with?",
                                    answer: "Bridgely integrates with WordPress, Webflow, Shopify, Framer, and many other platforms via webhooks. We also support WordPress.com and self-hosted WordPress installations."
                                },
                                {
                                    question: "How does Bridgely help me rank on Google and ChatGPT?",
                                    answer: "Bridgely creates long-form, SEO-optimized content (6,000-8,500 words) with proper keyword optimization, internal linking, and structured data. This helps you rank on Google. For ChatGPT citations, we optimize content for AI search engines by creating comprehensive, authoritative articles that AI models reference when answering queries."
                                },
                                {
                                    question: "How many articles can I generate per month?",
                                    answer: "The Business plan includes 30 SEO/GEO optimized articles per month, all generated and published automatically. This includes keyword research, content creation, image integration, YouTube video embedding, and automatic publishing."
                                },
                                {
                                    question: "Can multiple team members use Bridgely?",
                                    answer: "Yes! Bridgely includes unlimited team members in your organization. Everyone can collaborate on keyword strategy, review content, and manage publishing schedules."
                                },
                                {
                                    question: "What happens if I want to cancel?",
                                    answer: "You can cancel anytime with no questions asked. There are no long-term contracts or cancellation fees. Your subscription will remain active until the end of your billing period."
                                },
                                {
                                    question: "Do you offer custom features or integrations?",
                                    answer: "Yes! Bridgely offers custom feature requests. If you need specific integrations or functionality for your workflow, we can work with you to implement custom solutions."
                                }
                            ].map((faq, index) => (
                                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                    {/* CTA Banner */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 mt-16 rounded-2xl max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 md:mb-3">
                                    DON'T WAIT TO RANK
                                </p>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                                    Your competitors are already using <span className="text-yellow-300">AI-powered SEO</span>
                                </h2>
                            </div>
                            <div className="flex-shrink-0">
                                <Link 
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 bg-white border-2 border-purple-600 text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-purple-50 transition-colors duration-200 shadow-lg"
                                >
                                    Start Ranking Now
                                    <ArrowRight className="w-5 h-5 text-slate-900" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    )
};

export default HomePage;