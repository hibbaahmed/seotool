"use client"
import React, { useState } from 'react';
import { Check, RefreshCw, DollarSign, Users, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer'

const pricingPlans = [
  {
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Perfect for freelancers and small agencies starting their SEO journey",
    gradient: 'from-slate-50 to-white',
    borderColor: 'border-slate-200',
    features: [
      "5 projects per month",
      "10,000 AI-generated words",
      "Basic SEO analysis",
      "Email support",
      "WordPress integration",
      "1 user account",
      "Basic analytics"
    ],
    buttonText: "Start Free Trial",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
    isPopular: false
  },
  {
    name: "Professional",
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "Ideal for growing agencies and teams scaling their SEO operations",
    gradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    features: [
      "25 projects per month",
      "50,000 AI-generated words",
      "Advanced SEO analysis",
      "Priority support",
      "All integrations",
      "Team collaboration (up to 5 users)",
      "Custom branding",
      "Advanced analytics",
      "API access",
      "White-label reports"
    ],
    buttonText: "Start Free Trial",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
    isPopular: true
  },
  {
    name: "Enterprise",
    monthlyPrice: 200,
    yearlyPrice: 2000,
    description: "For large agencies and enterprises with advanced SEO needs",
    gradient: 'from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-200',
    features: [
      "Unlimited projects",
      "Unlimited AI-generated words",
      "White-label solution",
      "Dedicated support",
      "Custom integrations",
      "Unlimited users",
      "SLA guarantee",
      "Custom training",
      "On-premise deployment",
      "Advanced security"
    ],
    buttonText: "Contact Sales",
    buttonStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
    isPopular: false
  }
]

const benefits = [
  {
    icon: RefreshCw,
    text: "14-day free trial, no credit card required"
  },
  {
    icon: DollarSign,
    text: "Transparent pricing, no hidden fees"
  },
  {
    icon: Users,
    text: "Trusted by 500+ agencies worldwide"
  }
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-8">
            Simple and transparent pricing
          </h1>
          
          {/* Benefits */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-slate-600">
                <benefit.icon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
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
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gradient-to-br ${plan.gradient} border ${plan.borderColor} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                plan.isPopular ? 'ring-2 ring-blue-300 ring-opacity-50 shadow-blue-100' : ''
              }`}
            >
              {plan.isPopular && (
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
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </button>
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
      </main>

      <Footer />
    </div>
  )
}
