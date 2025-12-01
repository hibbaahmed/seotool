"use client"
import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

// FAQ Component
const FAQ = () => {
    const faqs = [
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

    return (
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
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </div>
            {/* CTA Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 mt-16 rounded-2xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 md:mb-3">
                                READY TO START?
                            </p>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                                Start driving traffic today with a <span className="text-yellow-300">free trial!</span>
                            </h2>
                        </div>
                        <div className="flex-shrink-0">
                            <Link 
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-purple-600 text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-purple-50 transition-colors duration-200 shadow-lg"
                            >
                                Get Started for Free
                                <ArrowRight className="w-5 h-5 text-slate-900" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;

