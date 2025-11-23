"use client";
import React, { useState } from 'react';
import { Check, Search, Calendar, Settings, TrendingUp, Globe, Home, BarChart3, Info, Star, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import Checkout from "./Checkout";
import useUser from "../../app/hook/useUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

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
//   "**Unlimited AI Rewrites**—fine-tune any article to perfection",
//   "**Unlimited Team Members**—collaborate with your entire organization",
//   "**Custom Feature Requests**—we build what you need"
];

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
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

const faqData = [
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
];

export default function Price() {
  const { user, loading } = useUser();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Check if user has an active subscription
  const hasActiveSubscription = !!user?.subscription?.customer_id;
  
  // Price ID for checkout
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH || '';
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Handle subscription button click
  const handleSubscriptionClick = () => {
    if (hasActiveSubscription) {
      setShowSubscriptionModal(true);
      return;
    }
  };
  
  // Function to redirect to subscription management
  const goToManageSubscription = () => {
    window.location.href = "/dashboard";
    setShowSubscriptionModal(false);
  };

  return (
    <div className="min-h-screen bg-white pricing-page">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 font-sans">
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
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-none pricing-amount">$99</span>
                    <span className="text-xl lg:text-2xl font-semibold text-slate-600">/month</span>
                  </div>
                </div>

                {/* CTA Button */}
                {hasActiveSubscription ? (
                  <Button
                    className={cn(
                      "w-full bg-slate-300 text-slate-500 cursor-not-allowed py-4 px-6 rounded-xl font-bold text-lg mb-4 shadow-lg flex items-center justify-center gap-2"
                    )}
                    onClick={handleSubscriptionClick}
                    disabled
                  >
                    Start for Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Checkout 
                    priceId={priceId} 
                    className={cn(
                      "w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg mb-4 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 group"
                    )}
                    buttonText={
                      <span className="flex items-center gap-2">
                        Start for Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    }
                  />
                )}

                {/* Trial Details */}
                <div className="flex items-center justify-center gap-2 text-slate-600 text-sm mb-8 font-normal text-center">
                  <span className="font-semibold text-slate-700">$1 for 3 days, then $99/month. Cancel anytime.</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                      <p>The $1 trial charge helps us prevent fraud and ensures we're working with serious customers. It's a small verification fee that gives you full access to test our platform risk-free.</p>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  </div>
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

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white mt-20">
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
              {faqData.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Subscription Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              You Already Have an Active Subscription
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              You currently have an active subscription plan. You can manage your existing subscription or view its details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700">
              Your subscription will end on{" "}
              <span className="text-blue-600 font-medium">
                {user?.subscription?.end_at ? new Date(user.subscription.end_at).toDateString() : "N/A"}
              </span>
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              className="bg-slate-200 hover:bg-slate-300 text-slate-900"
              onClick={() => setShowSubscriptionModal(false)}
            >
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              onClick={goToManageSubscription}
            >
              Manage Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}