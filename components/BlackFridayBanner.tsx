'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'bf-banner-dismissed';

export default function BlackFridayBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Unable to persist Black Friday banner state', error);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-sm sm:text-base">
        <p className="font-semibold tracking-tight">
          Black Friday Discount! Save <span className="text-amber-300">50% OFF</span> and lock your spot before the price increase.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-white text-slate-900 px-4 py-1.5 text-sm font-semibold shadow hover:scale-[1.02] transition-transform"
          >
            Claim Offer
          </Link>
          <button
            aria-label="Dismiss Black Friday banner"
            onClick={handleDismiss}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

