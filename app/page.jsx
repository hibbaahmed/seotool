"use client"
import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Sparkles, CheckCircle, Star, Users, Clock, Shield, Code, Globe, Award, Quote, Zap, TrendingUp, Briefcase, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import BlogSection from "@/components/BlogSection";
import { supabaseBrowser } from '@/lib/supabase/browser';
const HomePage = () => {
    const [isYearly, setIsYearly] = useState(true);
    const router = useRouter();

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
                
                // If no onboarding profile exists or it's not completed, redirect to onboarding
                if (!onboardingProfile || onboardingProfile.onboarding_status !== 'completed') {
                    router.push('/onboarding');
                } else {
                    router.push('/dashboard');
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
                <section className="flex items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8 pt-32">
                    <div className="text-center max-w-6xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full px-4 py-2 mb-8">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-700 text-sm font-medium">AI-Powered SEO Automation</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 tracking-tight">
                            Rank Clients on Google<br />
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                and Get Cited on ChatGPT
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
                            The ultimate SEO automation system for agencies. AI-powered content creation, optimization, and syndication that delivers results.
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-sm hover:shadow-md">
                                <Briefcase className="w-5 h-5" />
                                View Demo
                            </button>
                        </div>
                        
                        {/* Social Proof */}
                        <div className="flex items-center justify-center gap-8 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>500+ agencies</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>5/5 average rating</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span>300% more output</span>
                            </div>
                        </div>
                    </div>
                </section>
                  </div>
                  
            {/* Main Content */}
            <div className="bg-white text-slate-900 relative z-20">
                
                {/* Problem Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                SEO is broken for agencies<br />
                                <span className="text-red-600">Time-consuming and ineffective</span>
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                Manual content creation, outdated optimization tools, and endless client requests. There has to be a better way.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Clock className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Hours Per Article</h3>
                                <p className="text-slate-600">Manual content creation eats up your team's time every week.</p>
                            </div>
                            
                            <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Zap className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Inconsistent Quality</h3>
                                <p className="text-slate-600">SEO optimization varies widely. Some content ranks, some doesn't.</p>
                            </div>
                            
                            <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Lightbulb className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">No Visibility</h3>
                                <p className="text-slate-600">Hard to track what's working and measure actual ROI.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Solution Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="features">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Complete SEO automation<br />
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    in one platform
                                </span>
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                AI-powered content creation, optimization, and syndication. From ideation to ranking.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="space-y-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">AI Content Generation</h3>
                                            <p className="text-slate-600">Create optimized, SEO-ready content in minutes, not hours.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Code className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Automatic Optimization</h3>
                                            <p className="text-slate-600">Schema markup, meta tags, internal linking - all automated.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Globe className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Platform Publishing</h3>
                                            <p className="text-slate-600">Publish to WordPress, custom CMS, and social media instantly.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                                <div className="bg-slate-50 rounded-xl p-6 text-green-600 font-mono text-sm space-y-2">
                                    <div className="text-slate-500">$ seoflow create --topic "best seo practices 2024"</div>
                                    <div className="text-slate-500">✓ Analyzing search intent...</div>
                                    <div className="text-slate-500">✓ Generating 2000-word article...</div>
                                    <div className="text-slate-500">✓ Optimizing keywords...</div>
                                    <div className="text-slate-500">✓ Creating schema markup...</div>
                                    <div className="text-green-600">✓ Publishing to WordPress...</div>
                                    <div className="text-green-600 font-bold">✓ Live at: example.com/seo-guide</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <p className="text-slate-600 text-lg font-semibold">Powerful features built for agencies</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[{
                                title: 'AI SEO Editor',
                                desc: 'Edit and optimize existing content with intelligent suggestions and improvements.'
                            },{
                                title: 'SEO Agent',
                                desc: 'Automatically detect and fix SEO issues across your entire website.'
                            },{
                                title: 'Autoblog System',
                                desc: 'Automated content generation from RSS feeds, news, and keyword monitoring.'
                            },{
                                title: 'Analytics Dashboard',
                                desc: 'Track performance, rankings, and ROI with comprehensive analytics.'
                            },{
                                title: 'White-Label Solution',
                                desc: 'Rebrand as your own and offer to clients without technical overhead.'
                            },{
                                title: 'Team Collaboration',
                                desc: 'Manage workflows, approvals, and client communication in one place.'
                            }].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="mt-1 text-blue-600 flex-shrink-0">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                                        <p className="text-slate-600 mt-2">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="testimonials">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                Trusted by leading agencies<br />
                                <span className="text-blue-600">delivering real results</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[{
                                name: 'Sarah Johnson',
                                role: 'SEO Director',
                                company: 'Digital Growth Agency',
                                quote: 'SEOFlow has revolutionized our content workflow. We\'ve seen a 300% increase in content output while maintaining quality.',
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
                                <div className="text-slate-800 mb-3 font-semibold text-lg">Agencies Using</div>
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
                                <p className="text-slate-600">Per agency user</p>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-bold text-pink-600 mb-2">5/5</div>
                                <div className="text-slate-800 mb-3 font-semibold text-lg">Star Rating</div>
                                <p className="text-slate-600">From our community</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Blog Section */}
                <BlogSection maxPosts={3} />

                {/* Pricing Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="pricing">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Simple, transparent pricing
                            </h2>
                            <p className="text-xl text-slate-600">Start free. Scale as you grow.</p>
                        </div>

                        {/* Benefits */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
                            <div className="flex items-center gap-3 text-slate-600">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium">14-day free trial, no credit card required</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium">Transparent pricing, no hidden fees</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Users className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium">Trusted by 500+ agencies worldwide</span>
                            </div>
                        </div>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                                Bill Monthly
                            </span>
                            <button
                                onClick={() => setIsYearly(!isYearly)}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                                    isYearly ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                        isYearly ? 'translate-x-9' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <div className="flex flex-col items-center">
                                <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                                    Bill Yearly
                                </span>
                                {isYearly && (
                                    <span className="text-xs font-medium text-blue-600">
                                        (2 Months Free)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[{
                                name: 'Starter',
                                monthlyPrice: 29,
                                yearlyPrice: 290,
                                description: 'Perfect for freelancers and small agencies starting their SEO journey',
                                gradient: 'from-slate-50 to-white',
                                borderColor: 'border-slate-200',
                                popular: false,
                                features: [
                                    '5 projects per month',
                                    '10,000 AI-generated words',
                                    'Basic SEO analysis',
                                    'Email support',
                                    'WordPress integration',
                                    '1 user account',
                                    'Basic analytics'
                                ]
                            },{
                                name: 'Professional',
                                monthlyPrice: 99,
                                yearlyPrice: 990,
                                description: 'Ideal for growing agencies and teams scaling their SEO operations',
                                gradient: 'from-blue-50 to-indigo-50',
                                borderColor: 'border-blue-200',
                                popular: true,
                                features: [
                                    '25 projects per month',
                                    '50,000 AI-generated words',
                                    'Advanced SEO analysis',
                                    'Priority support',
                                    'All integrations',
                                    'Team collaboration (up to 5 users)',
                                    'Custom branding',
                                    'Advanced analytics',
                                    'API access',
                                    'White-label reports'
                                ]
                            },{
                                name: 'Enterprise',
                                monthlyPrice: 200,
                                yearlyPrice: 2000,
                                description: 'For large agencies and enterprises with advanced SEO needs',
                                gradient: 'from-indigo-50 to-purple-50',
                                borderColor: 'border-indigo-200',
                                popular: false,
                                features: [
                                    'Unlimited projects',
                                    'Unlimited AI-generated words',
                                    'White-label solution',
                                    'Dedicated support',
                                    'Custom integrations',
                                    'Unlimited users',
                                    'SLA guarantee',
                                    'Custom training',
                                    'On-premise deployment',
                                    'Advanced security'
                                ]
                            }].map((plan, idx) => (
                                <div key={idx} className={`relative bg-gradient-to-br ${plan.gradient} border ${plan.borderColor} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${plan.popular ? 'ring-2 ring-blue-300 ring-opacity-50 shadow-blue-100' : ''}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold mb-2 text-slate-900">
                                            {plan.name}
                                        </h3>
                                        <div className="text-4xl font-bold mb-1 text-slate-900">
                                            ${isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                                            <span className="text-lg font-normal text-slate-600">/month</span>
                                        </div>
                                        {isYearly && (
                                            <div className="text-sm mb-2 text-slate-600">
                                                ${plan.yearlyPrice}/year billed annually
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-600">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <span className="text-sm text-slate-600">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <Link href="/dashboard" className="block">
                                        <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}`}>
                                            {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                                        </button>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Additional Info */}
                        <div className="text-center mt-16">
                            <p className="text-slate-600 text-sm mb-4">
                                All plans include 24/7 support and regular updates
                            </p>
                            <div className="flex items-center justify-center gap-4 text-slate-500 text-sm">
                                <span>✓ SSL Security</span>
                                <span>✓ 99.9% Uptime</span>
                                <span>✓ Data Backup</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-slate-900">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                            Ready to transform your<br />
                            SEO workflow?
                        </h2>
                        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Join 500+ agencies already using SEOFlow to rank clients on Google and get cited on ChatGPT.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                Start Free Trial
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

                {/* Footer */}
                <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-200">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-bold text-xl text-slate-900">SEOFlow</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    AI-powered SEO automation for agencies.
                                </p>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
                                <div className="space-y-3">
                                    <a href="#features" className="block text-slate-600 hover:text-slate-900 transition-colors">Features</a>
                                    <a href="#pricing" className="block text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">API</a>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
                                <div className="space-y-3">
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">About</a>
                                    <Link href="/blog" className="block text-slate-600 hover:text-slate-900 transition-colors">Blog</Link>
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Careers</a>
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Contact</a>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
                                <div className="space-y-3">
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Help Center</a>
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Documentation</a>
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Community</a>
                                    <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Status</a>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                            <p className="text-slate-500 text-sm">
                                © 2024 SEOFlow. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6 text-sm text-slate-500">
                                <a href="#" className="hover:text-slate-700 transition-colors">Privacy</a>
                                <a href="#" className="hover:text-slate-700 transition-colors">Terms</a>
                                <a href="#" className="hover:text-slate-700 transition-colors">Cookies</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
};

export default HomePage;