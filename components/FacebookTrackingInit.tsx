'use client';

import { useEffect } from 'react';
import { initFacebookTracking, captureFbclid } from '@/lib/facebook-tracking-utils';

/**
 * Component to initialize Facebook tracking on app load
 * Captures fbclid from URL and ensures fbp exists
 * This improves Event Match Quality by ensuring we have fbc/fbp for all events
 */
export default function FacebookTrackingInit() {
  useEffect(() => {
    // Initialize on mount
    initFacebookTracking();
    
    // Also capture on URL changes (for SPAs)
    const handleRouteChange = () => {
      captureFbclid();
    };
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}

