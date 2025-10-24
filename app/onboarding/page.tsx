'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  Building2, 
  Users, 
  Target, 
  CheckCircle, 
  Loader2, 
  ArrowRight,
  Search,
  TrendingUp,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  inProgress: boolean;
}

interface AnalysisProgress {
  competitor_analysis: boolean;
  site_analysis: boolean;
  google_trends: boolean;
  serp_analysis: boolean;
  keyword_scoring: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    competitor_analysis: false,
    site_analysis: false,
    google_trends: false,
    serp_analysis: false,
    keyword_scoring: false
  });
  const [formData, setFormData] = useState({
    websiteUrl: '',
    businessName: '',
    industry: '',
    targetAudience: '',
    businessDescription: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [onboardingProfileId, setOnboardingProfileId] = useState<string | null>(null);
  const [summary, setSummary] = useState<null | {
    totalKeywords: number;
    highOpportunityKeywords: number;
    mediumOpportunityKeywords: number;
    lowOpportunityKeywords: number;
    metricsSource?: 'dataforseo' | 'ai';
  }>(null);

  const steps: OnboardingStep[] = [
    {
      id: 'website',
      title: 'Enter Your Website',
      description: 'Tell us about your website so we can analyze it',
      icon: <Globe className="h-6 w-6" />,
      completed: !!formData.websiteUrl,
      inProgress: currentStep === 0
    },
    {
      id: 'business',
      title: 'Business Information',
      description: 'Help us understand your business better',
      icon: <Building2 className="h-6 w-6" />,
      completed: !!formData.businessName && !!formData.industry,
      inProgress: currentStep === 1
    },
    {
      id: 'audience',
      title: 'Target Audience',
      description: 'Define who your ideal customers are',
      icon: <Users className="h-6 w-6" />,
      completed: !!formData.targetAudience,
      inProgress: currentStep === 2
    },
    {
      id: 'analysis',
      title: 'Comprehensive Analysis',
      description: 'We\'ll scan competitors, your site, Google trends, and SERP',
      icon: <Search className="h-6 w-6" />,
      completed: Object.values(analysisProgress).every(Boolean),
      inProgress: isAnalyzing
    },
    {
      id: 'results',
      title: 'Your Keyword List',
      description: 'View your complete keyword opportunities',
      icon: <Target className="h-6 w-6" />,
      completed: false,
      inProgress: false
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.websiteUrl) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid website URL';
    }
    
    if (!formData.businessName) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    if (!formData.targetAudience) {
      newErrors.targetAudience = 'Target audience is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 2) { // Don't go to analysis step manually
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStartAnalysis = async () => {
    // Ensure user is authenticated before calling API
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
    } catch {}

    if (!validateForm()) {
      setCurrentStep(0); // Go back to first step with errors
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(3); // Move to analysis step

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setOnboardingProfileId(result.onboardingProfileId);
      if (result?.analysisResults) {
        setSummary({
          totalKeywords: Number(result.analysisResults.totalKeywords || 0),
          highOpportunityKeywords: Number(result.analysisResults.highOpportunityKeywords || 0),
          mediumOpportunityKeywords: Number(result.analysisResults.mediumOpportunityKeywords || 0),
          lowOpportunityKeywords: Number(result.analysisResults.lowOpportunityKeywords || 0),
          metricsSource: result.analysisResults.metricsSource === 'dataforseo' ? 'dataforseo' : 'ai',
        });
      } else {
        setSummary(null);
      }
      
      // Simulate progress updates
      const progressSteps = [
        'competitor_analysis',
        'site_analysis', 
        'google_trends',
        'serp_analysis',
        'keyword_scoring'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between steps
        setAnalysisProgress(prev => ({
          ...prev,
          [progressSteps[i]]: true
        }));
      }

      // Move to results step
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setErrors({ general: 'Analysis failed. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewResults = () => {
    if (onboardingProfileId) {
      router.push(`/dashboard/keywords?onboarding=${onboardingProfileId}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-700 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className={`w-full px-6 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all duration-200 text-lg bg-slate-50 focus:bg-white ${
                  errors.websiteUrl ? 'border-red-400 bg-red-50' : 'hover:border-slate-300'
                }`}
              />
              {errors.websiteUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>
              )}
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">What we'll analyze:</h4>
                  <ul className="text-slate-600 space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                      Your current keyword rankings
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                      Technical SEO issues
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                      Content gaps and opportunities
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                      Competitor analysis
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                      Google trends and SERP data
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Your Company Name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.businessName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
                Industry *
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.industry ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select your industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="real-estate">Real Estate</option>
                <option value="legal">Legal Services</option>
                <option value="consulting">Consulting</option>
                <option value="marketing">Marketing & Advertising</option>
                <option value="food-beverage">Food & Beverage</option>
                <option value="travel">Travel & Hospitality</option>
                <option value="fitness">Fitness & Wellness</option>
                <option value="other">Other</option>
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessDescription" className="block text-sm font-medium text-slate-700 mb-2">
                Business Description (Optional)
              </label>
              <textarea
                id="businessDescription"
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleInputChange}
                rows={3}
                placeholder="Briefly describe what your business does..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700 mb-2">
                Target Audience *
              </label>
              <textarea
                id="targetAudience"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your ideal customers (e.g., small business owners, marketing professionals, tech-savvy millennials...)"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.targetAudience ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.targetAudience && (
                <p className="mt-1 text-sm text-red-600">{errors.targetAudience}</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Keyword Discovery Process:</h4>
                  <ul className="mt-2 text-sm text-green-800 space-y-1">
                    <li>• <strong>Competitor Analysis:</strong> Find keywords your competitors rank for</li>
                    <li>• <strong>Site Analysis:</strong> Identify your current keyword performance</li>
                    <li>• <strong>Google Trends:</strong> Discover trending and seasonal opportunities</li>
                    <li>• <strong>SERP Analysis:</strong> Find content gaps and ranking opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {isAnalyzing ? 'Analyzing Your Market...' : 'Ready to Analyze'}
              </h3>
              <p className="text-slate-600">
                {isAnalyzing 
                  ? 'This may take a few minutes. We\'re scanning competitors, analyzing your site, checking Google trends, and examining SERP data.'
                  : 'Click "Start Analysis" to begin the comprehensive keyword discovery process.'
                }
              </p>
            </div>

            {isAnalyzing && (
              <div className="space-y-4">
                {Object.entries(analysisProgress).map(([key, completed]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900 capitalize">
                        {key.replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {completed ? 'Completed' : 'In progress...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Analysis Complete!
              </h3>
              <p className="text-slate-600 mb-6">
                {summary && summary.totalKeywords > 0
                  ? `We've discovered ${summary.totalKeywords} keyword opportunities for your business. View your complete keyword list with opportunity ratings.`
                  : `We've discovered keyword opportunities for your business. View your complete keyword list with opportunity ratings.`}
              </p>
            </div>

            {summary && summary.totalKeywords > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <h4 className="text-lg font-semibold text-slate-900">Your Keyword Opportunities</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{summary.totalKeywords}</div>
                    <div className="text-sm text-slate-600">Total Keywords</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{summary.highOpportunityKeywords}</div>
                    <div className="text-sm text-slate-600">High Opportunity</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-100">
                    <div className="text-2xl font-bold text-yellow-600">{summary.mediumOpportunityKeywords}</div>
                    <div className="text-sm text-slate-600">Medium Opportunity</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="text-2xl font-bold text-gray-600">{summary.lowOpportunityKeywords}</div>
                    <div className="text-sm text-slate-600">Low Opportunity</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h5 className="font-medium text-slate-900 mb-2">What's Next?</h5>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Review your keyword list with opportunity ratings</li>
                <li>• Prioritize high-opportunity keywords for content creation</li>
                <li>• Use competitor insights to improve your strategy</li>
                <li>• Track your progress and rankings over time</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-3xl mb-8 shadow-lg">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Welcome to Your SEO Journey
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
              Discover keyword opportunities through comprehensive analysis of your competitors, 
              site performance, Google trends, and search results.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-16">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 ${
                      step.completed 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : step.inProgress 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-7 w-7" />
                      ) : step.inProgress ? (
                        <Loader2 className="h-7 w-7 animate-spin" />
                      ) : (
                        <span className="text-lg font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-4 w-full text-center">
                      <p className={`text-sm font-semibold ${
                        step.completed || step.inProgress ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 mx-auto max-w-28 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-6 transition-all duration-300 ${
                      step.completed ? 'bg-slate-900' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm">
            {errors.general && (
              <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                {steps[currentStep].title}
              </h2>
              <p className="text-lg text-slate-500 font-light">{steps[currentStep].description}</p>
            </div>

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-16">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-8 py-4 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Previous
              </button>

              <div className="flex gap-4">
                {currentStep === 2 ? (
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                    className="px-12 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 font-semibold text-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Start Analysis
                        <ArrowRight className="h-6 w-6" />
                      </>
                    )}
                  </button>
                ) : currentStep === 4 ? (
                  <button
                    onClick={handleViewResults}
                    className="px-12 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center gap-3 font-semibold text-lg"
                  >
                    View Keyword List
                    <ArrowRight className="h-6 w-6" />
                  </button>
                ) : currentStep < 2 ? (
                  <button
                    onClick={handleNext}
                    className="px-12 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center gap-3 font-semibold text-lg"
                  >
                    Next
                    <ArrowRight className="h-6 w-6" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
