"use client"
import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Sparkles, CheckCircle, Star, Users, Clock, Shield, Code, Globe, Award, Quote, Zap, TrendingUp, Briefcase, Lightbulb, ChevronDown, Search, Link2, Image, Megaphone, Plug } from "lucide-react";
import Link from "next/link";
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
    <div className="min-h-screen relative overflow-hidden bg-white">
      <Nav/>
            {/* Content */}
            <div className="relative z-10 text-slate-900">
                
                {/* Hero Section */}
                <section className="flex items-center justify-center min-h-[85vh] px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                    <div className="text-center max-w-6xl mx-auto">
                        {/* Search Engine Badges */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-sm font-semibold text-slate-700">Google</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 8.904c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" fill="#10A37F"/>
                                </svg>
                                <span className="text-sm font-semibold text-slate-700">ChatGPT</span>
                            </div>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.1] mb-8 tracking-tight">
                            <span className="text-slate-900 block sm:inline">Organic Traffic on</span>
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block sm:inline sm:ml-2">
                                Autopilot
                            </span>
                        </h1>
                        
                        {/* Subheadline */}
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-slate-700 mb-6 max-w-4xl mx-auto leading-relaxed font-semibold">
                            Get traffic from Google, ChatGPT, and other search engines on autopilot.
                        </p>
                        
                        <p className="text-base sm:text-lg md:text-lg lg:text-xl xl:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Our platform automatically researches, writes, optimizes, and publishes articles for you 24/7.  
                            <span className="font-semibold text-slate-700"> Rank on Google and get cited on ChatGPT</span> — all in one place.
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Join with Google
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 hover:text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <Briefcase className="w-5 h-5" />
                                Get Started
                            </Link>
                        </div>

                        {/* Demo Video */}
                        <div className="w-full max-w-4xl mx-auto mb-16">
                            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                                {cloudflareStreamId ? (
                                  <iframe
                                    src={`https://iframe.videodelivery.net/${cloudflareStreamId}`}
                                    title="Bridgely SEO automation tool demo"
                                    loading="lazy"
                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;"
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
                        
                        {/* Key Benefits */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">AI-Powered Research</h3>
                                <p className="text-sm text-slate-600">Automated keyword discovery and content strategy</p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">24/7 Publishing</h3>
                                <p className="text-sm text-slate-600">Automatic content generation and optimization</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Multi-Engine SEO</h3>
                                <p className="text-sm text-slate-600">Rank on Google and get cited on ChatGPT</p>
                            </div>
                        </div>
                        
                        {/* Social Proof */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">500+ businesses trust Bridgely</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">4.9/5 average rating</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium">30 articles/month on autopilot</span>
                            </div>
                        </div>
                    </div>
                </section>
                  </div>
                  
            {/* Main Content */}
            <div className="bg-white text-slate-900 relative z-20">
                
                {/* Problem Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                                THE REALITY CHECK
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Your Business Deserves to Get Traffic and Sales
                            </h2>
                            <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium">
                                You shouldn't have to spend hours writing or pay thousands to agencies just to grow. Forget juggling multiple SEO/GEO tools. Our AI agent handles everything, bringing traffic and sales to you even when you sleep.
                            </p>
                        </div>

                        {/* Two Column Layout: Problems vs Solution */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-12">
                            {/* Left Column - Problems */}
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                                    The Problems You Face
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">8+ Hours</span>
                                                    <span className="text-sm font-semibold text-slate-600">Per Article</span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">Research, writing, optimization, and revisions. Your team is drowning in manual work while competitors automate.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">60%</span>
                                                    <span className="text-sm font-semibold text-slate-600">Don't Rank</span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">Your content misses the mark. Keyword stuffing, outdated strategies, and no real optimization—clients see zero ROI.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Zap className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">$0</span>
                                                    <span className="text-sm font-semibold text-slate-600">Scalability</span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">You can't scale. More clients = more hours = burned-out team. Growth becomes a curse, not a blessing.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Lightbulb className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Zero</span>
                                                    <span className="text-sm font-semibold text-slate-600">Visibility</span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">You're flying blind. No real data on what works, what ranks, or why clients are churning. It's all guesswork.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Competitors</span>
                                                    <span className="text-sm font-semibold text-slate-600">Win Contracts</span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed">They promise faster delivery, better results, and lower prices. You're losing deals because you're stuck in 2015 workflows.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Bridgely Solution */}
                            <div className="lg:sticky lg:top-8 flex flex-col">
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                    Bridgely
                                </h3>
                                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-7 shadow-2xl hover:shadow-3xl transition-all flex flex-col relative overflow-hidden">
                                    {/* Decorative background elements */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                                    
                                    <div className="relative z-10 flex flex-col">
                                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/20">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-xl">
                                                <TrendingUp className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-white mb-0.5">Bridgely</h4>
                                                <p className="text-blue-100 text-xs font-medium">All-in-One SEO Platform</p>
                                            </div>
                                        </div>
                                        
                                        <p className="text-white text-base font-bold mb-5">
                                            Replace multiple tools with one powerful platform:
                                        </p>
                                        
                                        <div className="space-y-2 mb-5">
                                            {[
                                                { name: 'Keyword Research & Discovery', icon: Sparkles },
                                                { name: 'AI Content Generation', icon: Zap },
                                                { name: 'SEO Analysis & Optimization', icon: TrendingUp },
                                                { name: 'Image Integration', icon: Globe },
                                                { name: 'Automated Workflows', icon: Clock }
                                            ].map((feature, idx) => {
                                                const IconComponent = feature.icon;
                                                return (
                                                    <div key={idx} className="flex items-center gap-3 group bg-white/10 backdrop-blur-sm rounded-lg p-2.5 hover:bg-white/15 transition-all">
                                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                                                            <IconComponent className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span className="text-white font-semibold text-sm flex-1">{feature.name}</span>
                                                        <CheckCircle className="w-4 h-4 text-white/80 flex-shrink-0" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="pt-4 border-t border-white/20">
                                            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/20">
                                                <div className="flex items-center justify-center gap-5">
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-white">$500+</div>
                                                        <div className="text-blue-100 text-xs font-medium">Saved/month</div>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/30"></div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-white">20+ hrs</div>
                                                        <div className="text-blue-100 text-xs font-medium">Saved/week</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link 
                                                href="/dashboard"
                                                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 w-full group"
                                            >
                                                Get Started Now
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Callout */}
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-xl">
                            <p className="text-xl md:text-2xl font-bold mb-2">
                                Every hour on manual SEO is money out the door.
                            </p>
                            <p className="text-lg text-blue-100">
                                Stop watching your margins shrink. Start automating and scale your SEO without scaling your team.
                            </p>
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
                                        Try It Free
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
                                        <div className="bg-white rounded-lg px-4 py-3 border border-slate-200 text-slate-700 font-medium">
                                            yourbusiness.com
                                        </div>
                                    </div>
                                    <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
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
                                            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1">
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

                {/* Stats Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                The results speak for themselves<br />
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">500+</div>
                                <div className="text-slate-800 mb-3 font-semibold text-lg">Businesses Using</div>
                                <p className="text-slate-600">Growing every day</p>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">300%</div>
                                <div className="text-slate-800 mb-3 font-semibold text-lg">More Content Output</div>
                                <p className="text-slate-600">On average for clients</p>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">50+ hrs</div>
                                <div className="text-slate-800 mb-3 font-semibold text-lg">Saved Per Month</div>
                                <p className="text-slate-600">Per business user</p>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-pink-600 mb-2">5/5</div>
                                <div className="text-slate-800 mb-3 font-semibold text-lg">Star Rating</div>
                                <p className="text-slate-600">From our community</p>
                            </div>
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
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Join with Google
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-sm hover:shadow-md">
                                <Briefcase className="w-5 h-5" />
                                Contact Sales
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-8 text-slate-500 text-sm flex-wrap">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>14-day free trial</span>
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
                </section>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    )
};

export default HomePage;