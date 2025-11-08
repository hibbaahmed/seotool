"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    const planParam = searchParams.get('plan');
    
    setSessionId(sessionIdParam);
    setPlan(planParam);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Thank you for subscribing to Bridgely
          </p>
          {plan && (
            <p className="text-base text-slate-500">
              You've successfully subscribed to the <span className="font-semibold text-slate-700">{plan}</span> plan
            </p>
          )}
        </div>

        {sessionId && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Session ID:</p>
            <p className="text-xs text-slate-500 font-mono break-all">{sessionId}</p>
          </div>
        )}

        <div className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/pricing">
            <Button className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

