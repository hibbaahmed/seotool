"use client";
import React from 'react';
import { Check, Search, Calendar, Settings, TrendingUp, Globe, Home, BarChart3, Star, ArrowRight } from 'lucide-react';
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import Link from "next/link";

const keyFeatures = [
  {
    icon: Search,
    title: "AI-Powered Research",
    description: "Automated keyword discovery and content strategy"
  },
  {
    icon: Calendar,
    title: "24/7 Publishing",
    description: "Automatic content generation and optimization"
  },
  {
    icon: Settings,
    title: "Zero Manual Work",
    description: "Set it and forget it—fully automated"
  },
  {
    icon: TrendingUp,
    title: "Multi-Engine SEO",
    description: "Rank on Google and get cited on ChatGPT"
  }
];

const solutionFeatures = [
  {
    icon: Search,
    title: "Discover Your Winning Keywords",
    description: "Our AI analyzes your industry, competitors, and audience to uncover high-opportunity keywords you're missing. Get data-driven insights that actually convert—no more guessing what to write about."
  },
  {
    icon: Calendar,
    title: "Publish Ranking Content Daily",
    description: "Every morning, wake up to a new 6,000-8,500 word SEO/GEO optimized article ready to publish. We handle research, writing, optimization, images, and linking—you get traffic without the work."
  },
  {
    icon: Home,
    title: "Auto-Publish to Your Website",
    description: "Connect once, publish forever. Auto-publish to WordPress, Webflow, Shopify, Wix, or any platform with webhooks. Your content goes live automatically—zero manual work required."
  },
  {
    icon: BarChart3,
    title: "Rank on Google & Get Cited on ChatGPT",
    description: "Optimized to rank on Google, ChatGPT, Claude, Gemini, and other search engines. Our content is built to get cited by AI models and rank in traditional search—all in one place."
  }
];

const pricingFeatures = [
  "**30 SEO/GEO Optimized Articles** per month—generated and published automatically",
  "**Save 8+ Hours Per Article**—no more manual research, writing, or optimization",
  "**6,000-8,500 Word Long-Form Articles** that rank and get cited by AI",
  "**Auto Keyword Research**—discover high-opportunity keywords hands-free",
  "**Auto Internal & External Linking**—built-in SEO optimization",
  "**AI Images & YouTube Videos**—automatically integrated into every article",
  "**Auto-Publishing** to WordPress",
];

const PricingSection = () => {

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Centered */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 tracking-tight leading-[1.1]">
            <span className="text-slate-900">Unlock Traffic on</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block sm:inline sm:ml-2">
              Autopilot
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-700 mb-6 max-w-4xl mx-auto leading-relaxed font-semibold">
            Publish SEO-optimized articles every day on autopilot. Drive traffic from Google, ChatGPT, and other search engines without lifting a finger.
          </p>
        </div>

        {/* Two Column Layout - Centered */}
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto items-start lg:items-center">
          {/* Left Column - Pricing Card */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-8 lg:p-10 shadow-lg hover:shadow-xl transition-all w-full max-w-md">
              {/* Most Popular Tag */}
              <div className="absolute -top-3 right-6">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md">
                  For ambitious entrepreneurs
                </span>
              </div>

              {/* Plan Info */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-slate-600 text-sm mb-4 font-normal">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>1 website</span>
                </div>
                <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">All in One</h3>
                <p className="text-slate-600 text-base mb-6 font-normal">Replace multiple tools with one powerful platform. Save $500+ per month and 20+ hours per week.</p>
                
                {/* Pricing */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-slate-400 line-through text-lg font-normal">$200</span>
                    <span className="text-slate-400 line-through text-lg font-normal">/monthly</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl lg:text-8xl font-bold text-slate-900 tracking-tight leading-none pricing-amount">$69</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href="/login">
                  <Button
                    className={cn(
                      "w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg mb-4 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 group"
                    )}
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                {/* Trial Details */}
                <div className="flex items-center gap-2 text-slate-600 text-sm mb-8 font-normal text-center justify-center">
                  <span>Cancel anytime. No questions asked!</span>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <h4 className="text-2xl font-bold text-slate-900 mb-4">What's included:</h4>
                  {pricingFeatures.map((feature, index) => {
                    // Extract bold parts (text between **) and check for link patterns
                    const parts = feature.split(/(\*\*[^*]+\*\*)/g);
                    // Check if this feature should have links
                    const hasLinks = feature.includes('other platforms') || feature.includes('Backlink Exchange');
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-base text-slate-700 leading-relaxed font-normal">
                          {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              const text = part.slice(2, -2);
                              // Check if this should be a link
                              if (hasLinks && (text === 'other platforms' || text === 'Backlink Exchange')) {
                                return (
                                  <strong key={i} className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 cursor-pointer underline">
                                    {text}
                                  </strong>
                                );
                              }
                              return <strong key={i} className="font-bold text-slate-900">{text}</strong>;
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Solution Details */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Solution Heading */}
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3 text-center lg:text-left tracking-tight leading-tight">
              Replace Manual SEO with <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Automation</span>
            </h2>
            <p className="text-lg text-slate-600 mb-10 text-center lg:text-left font-normal leading-relaxed">
              Stop watching your margins shrink. Start automating and scale your SEO without scaling your team. Everything you need to rank and get traffic on autopilot.
            </p>

            {/* Detailed Features */}
            <div className="space-y-6 mb-10">
              {solutionFeatures.map((feature, index) => {
                const iconBgClasses = [
                  'bg-gradient-to-br from-blue-50 to-indigo-50',
                  'bg-gradient-to-br from-indigo-50 to-purple-50',
                  'bg-gradient-to-br from-purple-50 to-violet-50',
                  'bg-gradient-to-br from-blue-50 to-indigo-50'
                ];
                const iconTextClasses = [
                  'text-blue-600',
                  'text-indigo-600',
                  'text-purple-600',
                  'text-blue-600'
                ];
                return (
                  <div key={index} className="flex gap-3 items-start">
                    <div className={`p-1.5 rounded-lg ${iconBgClasses[index % iconBgClasses.length]} flex-shrink-0`}>
                      <feature.icon className={`w-5 h-5 ${iconTextClasses[index % iconTextClasses.length]}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-0.5 text-lg leading-tight">{feature.title}</h3>
                      <p className="text-base text-slate-600 font-normal leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Testimonial */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl p-6 lg:p-8 border-2 border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-800 italic mb-5 text-base leading-relaxed font-normal">
                "Bridgely has revolutionized our content workflow. We've seen a 300% increase in content output while maintaining quality. The AI SEO Agent alone has saved us 20 hours per week. Our clients are seeing better rankings and more traffic."
              </p>
              <div>
                <p className="font-bold text-slate-900 text-base">Sarah Johnson</p>
                <p className="text-sm text-slate-600 font-normal">SEO Director, Digital Growth Solutions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Feature Highlights - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-16 max-w-[500px] sm:max-w-[600px] md:max-w-3xl mx-auto justify-items-center">
          {keyFeatures.map((feature, index) => {
            const gradients = [
              'from-blue-50 to-indigo-50',
              'from-indigo-50 to-purple-50',
              'from-purple-50 to-violet-50',
              'from-blue-50 to-indigo-50'
            ];
            const iconColors = [
              'bg-blue-600',
              'bg-indigo-600',
              'bg-purple-600',
              'bg-blue-600'
            ];
            return (
              <div key={index} className={`bg-gradient-to-br ${gradients[index % gradients.length]} rounded-lg p-3 md:p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all aspect-square flex flex-col items-center justify-center text-center w-full max-w-[200px] md:max-w-none`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 ${iconColors[index % iconColors.length]} rounded-lg flex items-center justify-center mb-2 md:mb-3`}>
                  <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1 text-xs md:text-sm leading-tight">{feature.title}</h3>
                <p className="text-xs text-slate-600 font-normal leading-tight px-0.5 md:px-1">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
