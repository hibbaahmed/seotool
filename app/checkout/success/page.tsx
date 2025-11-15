"use client"
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { trackEnhancedFacebookEvent } from '@/lib/facebook-tracking-utils';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get checkout details from URL params
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan') || 'Business';
  const value = searchParams.get('value') || '69';

  useEffect(() => {
    // Track successful purchase with enhanced Facebook tracking
    const numericValue = parseFloat(value);
    const eventId = `purchase_${sessionId || Date.now()}`;
    
    const trackingData = {
      value: numericValue,
      currency: 'USD',
      content_type: 'subscription',
      content_name: `${plan} Plan`,
      content_category: 'SEO Tool',
      content_ids: [plan.toLowerCase()],
      num_items: 1,
    };

    // Initial tracking without user data
    trackEnhancedFacebookEvent('Purchase', trackingData, undefined, eventId);

    // Enhanced user data for better matching (fetched separately for privacy)
    if (sessionId) {
      fetch(`/api/get-session-data?session_id=${sessionId}`)
        .then(response => response.json())
        .then(sessionData => {
          if (sessionData.email) {
            // Enhanced user data for better match quality
            const userData = {
              em: sessionData.email,
              ...(sessionData.firstName && { fn: sessionData.firstName }),
              ...(sessionData.lastName && { ln: sessionData.lastName }),
              ...(sessionData.city && { ct: sessionData.city }),
              ...(sessionData.state && { st: sessionData.state }),
              ...(sessionData.zipCode && { zp: sessionData.zipCode }),
              ...(sessionData.country && { country: sessionData.country }),
            };

            // Track enhanced purchase event with user data
            trackEnhancedFacebookEvent('Purchase', trackingData, userData, eventId);
            
            console.log('🎯 Enhanced Facebook Purchase event tracked with complete user data');
          }
        })
        .catch(err => {
          console.warn('⚠️ Could not fetch session data for enhanced tracking:', err);
        });
    }

    // Auto-redirect countdown - redirect to onboarding after purchase
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          // Redirect to onboarding after successful purchase
          router.push('/onboarding');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, plan, value, sessionId]);

  const handleManualRedirect = () => {
    setIsRedirecting(true);
    // Redirect to onboarding after successful purchase
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Payment Successful! 🎉
        </h1>
        
        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
          Welcome to Bridgely {plan}! Your subscription is now active. Let's set up your account to get started.
        </p>

        {/* Plan Details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">{plan} Plan Activated</h2>
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-slate-600">
            You now have unlimited access to SEO research, content generation, and all advanced features.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">What's Next?</h3>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-slate-600">Complete your onboarding setup</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-slate-600">We'll analyze your website and competitors</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-slate-600">Get your personalized keyword list</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleManualRedirect}
              disabled={isRedirecting}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              {isRedirecting ? 'Redirecting...' : 'Start Onboarding'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Link href="/onboarding">
              <Button
                size="lg"
                variant="outline"
                className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-200 w-full sm:w-auto"
              >
                Complete Setup
              </Button>
            </Link>
          </div>
          
          <div className="text-slate-500 text-sm">
            {countdown > 0 ? (
              <p>Redirecting to onboarding in {countdown} seconds...</p>
            ) : (
              <p>Redirecting now...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
