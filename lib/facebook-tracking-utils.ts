// Facebook Tracking Utilities for Enhanced Event Match Quality

/**
 * Get Facebook Click ID (fbc) from cookies
 * This helps Facebook attribute events to ad clicks
 */
export function getFbcCookie(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_fbc') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  
  /**
   * Get Facebook Browser ID (fbp) from cookies
   * This helps Facebook identify the browser for better matching
   */
  export function getFbpCookie(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_fbp') {
        return decodeURIComponent(value);
      }
    }
    return null;
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