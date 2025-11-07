import Link from "next/link";
import FAQ from "../../components/FAQ";
import PricingSection from "../../components/PricingSection";

export default function Price() {
  return (
    <main className="min-h-screen bg-white text-slate-900 pt-32 pb-20">
      <div className="w-full max-w-7xl mx-auto space-y-8">
          <PricingSection />
        <FAQ />
      </div>
    </main>
  );
}


// "use client"
// import React from 'react';
// import { Check, Search, Calendar, Settings, TrendingUp, Globe, Home, BarChart3, Info, Star, ArrowRight } from 'lucide-react';
// import { Footer } from '@/components/layout/Footer'

// const keyFeatures = [
//   {
//     icon: Search,
//     title: "Personalized Keywords",
//     description: "Custom list for your niche"
//   },
//   {
//     icon: Calendar,
//     title: "Daily Articles",
//     description: "30 articles every month"
//   },
//   {
//     icon: Settings,
//     title: "Auto-Publishing",
//     description: "Zero manual work"
//   },
//   {
//     icon: TrendingUp,
//     title: "SEO/GEO Optimized",
//     description: "Built to rank #1"
//   }
// ]

// const solutionFeatures = [
//   {
//     icon: Calendar,
//     title: "Personalized Plan",
//     description: "Get a custom personalized plan for your business, full of keyword ideas and a ready-to-execute content plan."
//   },
//   {
//     icon: Calendar,
//     title: "Daily Article Generation",
//     description: "6,000-8,500 word SEO/GEO optimized articles daily, complete with images and internal/external linking."
//   },
//   {
//     icon: Home,
//     title: "Auto-Publish to Your Website",
//     description: "Auto-publish to WordPress, Webflow, Shopify, Wix or any other platform with webhooks."
//   },
//   {
//     icon: BarChart3,
//     title: "Rank on Google & AI Search",
//     description: "Optimized to rank on Google, ChatGPT, Claude, Gemini, and other search engines."
//   }
// ]

// const pricingFeatures = [
//   "**30 Articles a month** generated and published on auto-pilot",
//   "**Unlimited Users** in your Organization",
//   "**Auto Keyword Research** made for you hands-free",
//   "Integrates with WordPress, Webflow, Shopify, Framer and many **other platforms**",
//   "**High DR Backlinks** built for you on auto-pilot through our **Backlink Exchange**",
//   "**AI Images** generated in different styles",
//   "**Relevant YouTube videos** integrated into articles",
//   "Articles generated in **150+ languages**",
//   "**Unlimited AI Rewrites**",
//   "**Custom Features requests**"
// ]

// export default function PricingPage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pricing-page">
//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 font-sans">
//         {/* Header Section - Centered */}
//         <div className="text-center mb-16">
//           <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
//             Unlock Traffic on Autopilot
//           </h1>
//           <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
//             Publish SEO/GEO optimized articles every day on autopilot. Drive traffic from Google, ChatGPT, and other search engines without lifting a finger.
//           </p>
//         </div>

//         {/* Key Feature Highlights - Centered Row */}
//         <div className="flex flex-wrap justify-center gap-8 mb-20">
//           {keyFeatures.map((feature, index) => (
//             <div key={index} className="flex flex-col items-center text-center max-w-[200px]">
//               <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
//                 <feature.icon className={`w-6 h-6 text-white`} />
//               </div>
//               <h3 className="font-bold text-slate-900 mb-1 text-base">{feature.title}</h3>
//               <p className="text-sm text-slate-600 font-normal">{feature.description}</p>
//             </div>
//           ))}
//         </div>

//         {/* Two Column Layout - Centered */}
//         <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto items-start lg:items-center">
//           {/* Left Column - Pricing Card */}
//           <div className="flex-1 flex justify-center lg:justify-start">
//             <div className="relative bg-white border border-slate-200 rounded-2xl p-8 lg:p-10 shadow-xl w-full max-w-md">
//               {/* Most Popular Tag */}
//               <div className="absolute -top-3 right-6">
//                 <span className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-1.5 rounded-full text-xs font-semibold">
//                   For ambitious entrepreneurs
//                 </span>
//               </div>

//               {/* Plan Info */}
//               <div className="mb-8">
//                 <div className="flex items-center gap-2 text-slate-600 text-sm mb-4 font-normal">
//                   <Globe className="w-4 h-4 text-blue-600" />
//                   <span>1 website</span>
//                 </div>
//                 <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 tracking-tight">All in One</h3>
//                 <p className="text-slate-600 text-base mb-6 font-normal">Perfect for individual businesses</p>
                
//                 {/* Pricing */}
//                 <div className="mb-8">
//                   <div className="flex items-baseline gap-2 mb-2">
//                     <span className="text-slate-400 line-through text-lg font-normal">$200</span>
//                     <span className="text-slate-400 line-through text-lg font-normal">/monthly</span>
//                   </div>
//                   <div className="flex items-baseline gap-2">
//                     <span className="text-7xl lg:text-8xl font-bold text-slate-900 tracking-tight leading-none pricing-amount">$99</span>
//                   </div>
//                 </div>

//                 {/* CTA Button */}
//                 <button className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg mb-4 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
//                   Get Started for Free
//                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//                 </button>

//                 {/* Trial Details */}
//                 <div className="flex items-center gap-2 text-slate-600 text-sm mb-8 font-normal text-center justify-center">
//                   <span>Cancel anytime. No questions asked!</span>
//                 </div>

//                 {/* Features List */}
//                 <div className="space-y-4">
//                   <h4 className="text-2xl font-bold text-slate-900 mb-4">What's included:</h4>
//                   {pricingFeatures.map((feature, index) => {
//                     // Extract bold parts (text between **) and check for link patterns
//                     const parts = feature.split(/(\*\*[^*]+\*\*)/g);
//                     // Check if this feature should have links
//                     const hasLinks = feature.includes('other platforms') || feature.includes('Backlink Exchange');
//                     return (
//                       <div key={index} className="flex items-start gap-3">
//                         <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
//                         <span className="text-base text-slate-700 leading-relaxed font-normal">
//                           {parts.map((part, i) => {
//                             if (part.startsWith('**') && part.endsWith('**')) {
//                               const text = part.slice(2, -2);
//                               // Check if this should be a link
//                               if (hasLinks && (text === 'other platforms' || text === 'Backlink Exchange')) {
//                                 return (
//                                   <strong key={i} className="font-bold text-purple-600 hover:text-purple-700 cursor-pointer underline">
//                                     {text}
//                                   </strong>
//                                 );
//                               }
//                               return <strong key={i} className="font-bold text-slate-900">{text}</strong>;
//                             }
//                             return <span key={i}>{part}</span>;
//                           })}
//                         </span>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Solution Details */}
//           <div className="flex-1 flex flex-col justify-center">
//             {/* Solution Heading */}
//             <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3 text-center lg:text-left tracking-tight">
//               All-in-One Traffic Solution
//             </h2>
//             <p className="text-lg text-slate-600 mb-10 text-center lg:text-left font-normal leading-relaxed">
//               Everything you need to rank and get traffic on autopilot
//             </p>

//             {/* Detailed Features */}
//             <div className="space-y-6 mb-10">
//               {solutionFeatures.map((feature, index) => {
//                 const iconBgClasses = [
//                   'bg-gradient-to-br from-blue-50 to-indigo-50',
//                   'bg-gradient-to-br from-indigo-50 to-purple-50',
//                   'bg-gradient-to-br from-purple-50 to-violet-50',
//                   'bg-gradient-to-br from-blue-50 to-indigo-50'
//                 ];
//                 const iconTextClasses = [
//                   'text-blue-600',
//                   'text-indigo-600',
//                   'text-purple-600',
//                   'text-blue-600'
//                 ];
//                 return (
//                   <div key={index} className="flex gap-4">
//                     <div className={`p-2 rounded-lg ${iconBgClasses[index % iconBgClasses.length]}`}>
//                       <feature.icon className={`w-6 h-6 ${iconTextClasses[index % iconTextClasses.length]} flex-shrink-0`} />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-slate-900 mb-2 text-lg">{feature.title}</h3>
//                       <p className="text-base text-slate-600 font-normal leading-relaxed">{feature.description}</p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Testimonial */}
//             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 lg:p-8 border border-blue-100">
//               <div className="flex gap-1 mb-4">
//                 {[...Array(5)].map((_, i) => (
//                   <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
//                 ))}
//               </div>
//               <p className="text-slate-800 italic mb-5 text-base leading-relaxed font-normal">
//                 "RankPill has allowed our small team to focus on areas where we excel, rather than spending time brainstorming and writing content. It's saved us several hours every week!"
//               </p>
//               <div>
//                 <p className="font-bold text-slate-900 text-base">Josh Kennedy</p>
//                 <p className="text-sm text-slate-600 font-normal">Co-Founder, Outpost Labs</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   )
// }
