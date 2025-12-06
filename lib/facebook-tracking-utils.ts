// Facebook Tracking Utilities for Enhanced Event Match Quality

/**
 * Capture fbclid from URL and store it for later use
 * This should be called on every page load to capture Facebook click IDs
 * The fbc format is: fb.{subdomain_index}.{creation_time}.{fbclid}
 */
export function captureFbclid(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    
    if (fbclid) {
      // Store fbclid in localStorage for persistence
      localStorage.setItem('fbclid', fbclid);
      localStorage.setItem('fbclid_timestamp', Date.now().toString());
      
      // Generate proper fbc format: fb.{subdomain_index}.{creation_time}.{fbclid}
      // subdomain_index is 1 for most cases
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      localStorage.setItem('fbc_generated', fbc);
      
      // Also set as a cookie for server-side access (90 day expiry)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      document.cookie = `_fbc=${encodeURIComponent(fbc)};path=/;expires=${expiryDate.toUTCString()};SameSite=Lax`;
      
      console.log('📱 Facebook Click ID captured from URL:', { fbclid, fbc });
    }
  } catch (error) {
    console.error('Error capturing fbclid:', error);
  }
}

/**
 * Get Facebook Click ID (fbc) from cookies or localStorage
 * This helps Facebook attribute events to ad clicks
 * Returns stored fbc or generates from stored fbclid
 */
export function getFbcCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First check for _fbc cookie (set by Facebook Pixel or our capture)
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbc') {
      return decodeURIComponent(value);
    }
  }
  
  // Check localStorage for our generated fbc
  const generatedFbc = localStorage.getItem('fbc_generated');
  if (generatedFbc) {
    // Check if it's not too old (90 days)
    const timestamp = localStorage.getItem('fbclid_timestamp');
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      if (age < ninetyDays) {
        return generatedFbc;
      }
    }
  }
  
  // Try to generate from stored fbclid
  const storedFbclid = localStorage.getItem('fbclid');
  if (storedFbclid) {
    const timestamp = localStorage.getItem('fbclid_timestamp');
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      if (age < ninetyDays) {
        return `fb.1.${timestamp}.${storedFbclid}`;
      }
    }
  }
  
  return null;
}

/**
 * Get Facebook Browser ID (fbp) from cookies or generate one
 * This helps Facebook identify the browser for better matching
 * fbp format: fb.{subdomain_index}.{creation_time}.{random_number}
 */
export function getFbpCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First check for _fbp cookie (set by Facebook Pixel)
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp') {
      return decodeURIComponent(value);
    }
  }
  
  // Check localStorage for our generated fbp
  let generatedFbp = localStorage.getItem('fbp_generated');
  if (generatedFbp) {
    return generatedFbp;
  }
  
  // Generate fbp if not available (shouldn't happen if Pixel is installed correctly)
  // Format: fb.{subdomain_index}.{creation_time}.{random_number}
  const randomNum = Math.floor(Math.random() * 2147483647);
  generatedFbp = `fb.1.${Date.now()}.${randomNum}`;
  localStorage.setItem('fbp_generated', generatedFbp);
  
  // Also set as a cookie for server-side access (90 day expiry)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 90);
  document.cookie = `_fbp=${encodeURIComponent(generatedFbp)};path=/;expires=${expiryDate.toUTCString()};SameSite=Lax`;
  
  console.log('📱 Generated Facebook Browser ID:', generatedFbp);
  return generatedFbp;
}

/**
 * Get external ID from local storage or generate one
 * This provides consistent user identification across sessions
 */
export function getExternalId(): string {
  if (typeof window === 'undefined') return `ext_${Date.now()}`;
  
  let externalId = localStorage.getItem('fb_external_id');
  if (!externalId) {
    externalId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('fb_external_id', externalId);
  }
  return externalId;
}

/**
 * Initialize Facebook tracking - call this on app load
 * Captures fbclid from URL and ensures fbp exists
 */
export function initFacebookTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Capture fbclid from URL if present
  captureFbclid();
  
  // Ensure fbp exists
  getFbpCookie();
  
  console.log('📱 Facebook tracking initialized:', {
    fbc: getFbcCookie() ? 'present' : 'missing',
    fbp: getFbpCookie() ? 'present' : 'missing',
    external_id: getExternalId() ? 'present' : 'missing'
  });
}

/**
 * Enhanced tracking data with all Facebook identifiers
 */
export function getEnhancedTrackingData() {
  return {
    fbc: getFbcCookie(),
    fbp: getFbpCookie(),
    external_id: getExternalId(),
  };
}
  
  /**
   * Check if we're in development/localhost environment
   * Client-side events don't support test_event_code, so we skip tracking in dev
   */
  function isDevelopmentEnvironment(): boolean {
    if (typeof window === 'undefined') {
      // Server-side: check NODE_ENV
      return process.env.NODE_ENV === 'development';
    }
    // Client-side: check if we're on localhost
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      process.env.NODE_ENV === 'development'
    );
  }

  /**
   * Track enhanced Facebook event with maximum match quality
   * NOTE: Client-side events are skipped in development/localhost to prevent test events
   * from being counted as real purchases. Server-side webhook handles test events properly.
   */
  export function trackEnhancedFacebookEvent(
    eventName: string,
    eventData: Record<string, any>,
    userData?: Record<string, any>,
    eventId?: string
  ) {
    if (typeof window === 'undefined' || !window.fbq) {
      console.warn('⚠️ Facebook Pixel not available');
      return;
    }

    // Skip tracking in development/localhost to prevent test events from being counted
    if (isDevelopmentEnvironment()) {
      console.log(`🚫 Skipping Facebook ${eventName} event in development/localhost to prevent test events`);
      return;
    }
  
    const enhancedData = {
      ...eventData,
      ...getEnhancedTrackingData(),
    };
  
    const options: Record<string, any> = {};
    
    if (eventId) {
      options.eventID = eventId;
    }
    
    if (userData) {
      options.userData = userData;
    }
  
    // Track the event
    window.fbq('track', eventName, enhancedData, options);
  
    // Also track with trackSingle for advanced data if userData is provided
    if (userData) {
      window.fbq('trackSingle', '596939250157416', eventName, enhancedData, options);
    }
  
    console.log(`🎯 Enhanced Facebook ${eventName} event tracked:`, {
      eventId,
      hasUserData: !!userData,
      ...enhancedData
    });
  }
  
  /**
   * Plan information mapping for consistent tracking
   */
  export const PLAN_INFO = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEN_CREDITS || '']: { 
      name: 'Beginner', 
      value: 16, 
      credits: 10 
    },
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEN_CREDITS_YEAR || '']: { 
      name: 'Beginner', 
      value: 8, 
      credits: 10 
    },
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS || '']: { 
      name: 'Basic', 
      value: 34, 
      credits: 25 
    },
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS_YEAR || '']: { 
      name: 'Basic', 
      value: 17, 
      credits: 25 
    },
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS || '']: { 
      name: 'Premium', 
      value: 58, 
      credits: 50 
    },
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS_YEAR || '']: { 
      name: 'Premium', 
      value: 29, 
      credits: 50 
    }
  };
  
  /**
   * Get plan information by price ID
   */
  export function getPlanInfo(priceId: string) {
    return PLAN_INFO[priceId] || { name: 'Basic', value: 34, credits: 25 };
  }
  
  // Declare global window interface for TypeScript
  declare global {
    interface Window {
      fbq?: (action: string, ...args: any[]) => void;
    }
  }