// Facebook Conversions API Service
// This provides server-side tracking for more reliable conversion data

import crypto from 'crypto';

const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FB_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const FB_API_VERSION = 'v18.0';

class FacebookConversionsAPI {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events`;
  }

  // Send a purchase event to Facebook Conversions API
  async sendPurchaseEvent(data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    planName: string;
    planValue: number;
    currency?: string;
    sessionId?: string;
    eventId?: string; // Add eventId parameter for deduplication
    ipAddress?: string;
    userAgent?: string;
    externalId?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    request?: any; // Add request parameter for cookie access
  }) {
    const {
      email,
      firstName,
      lastName,
      planName,
      planValue,
      currency = 'USD',
      sessionId,
      eventId,
      ipAddress,
      userAgent,
      externalId,
      city,
      state,
      zipCode,
      country
    } = data;

    // Use provided eventId or generate one for deduplication (must match client-side)
    const finalEventId = eventId || `purchase_${sessionId || Date.now()}`;
    
    const eventData = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: finalEventId, // Add event_id for deduplication
        action_source: 'website',
        event_source_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
        
        // User data for matching - more identifiers improve match quality
        user_data: {
          em: this.hashData(email),
          fn: this.hashData(firstName),
          ln: this.hashData(lastName),
          ct: this.hashData(city),
          st: this.hashData(state),
          zp: this.hashData(zipCode),
          country: this.hashData(country),
          client_ip_address: ipAddress,
          client_user_agent: userAgent,
          fbc: this.getFbcCookie(data.request),
          fbp: this.getFbpCookie(data.request),
          external_id: this.hashData(externalId || email)
        },
        
        // Custom data
        custom_data: {
          plan_name: planName,
          subscription_type: 'recurring',
          currency: currency,
          value: planValue
        },
        
        // Standard parameters
        currency: currency,
        value: planValue
      }],
      
      // Test event flag - mark as test if development OR localhost
      // This prevents localhost test purchases from being counted as real events
      test_event_code: (process.env.NODE_ENV === 'development' || 
                       (process.env.NEXT_PUBLIC_URL && (
                         process.env.NEXT_PUBLIC_URL.includes('localhost') ||
                         process.env.NEXT_PUBLIC_URL.includes('127.0.0.1')
                       ))) ? 'TEST12345' : undefined
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          access_token: FB_ACCESS_TOKEN
        })
      });

      const result = await response.json();
      
      if (result.error) {
        console.error('Facebook Conversions API Error:', result.error);
        return { success: false, error: result.error };
      }

      console.log('Facebook Conversions API Success:', result);
      return { success: true, data: result };

    } catch (error: any) {
      console.error('Facebook Conversions API Request Failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send a subscription event
  async sendSubscriptionEvent(data: {
    email?: string;
    planName: string;
    planValue: number;
    currency?: string;
    eventType?: string;
    ipAddress?: string;
    userAgent?: string;
    externalId?: string;
    request?: any;
  }) {
    const {
      email,
      planName,
      planValue,
      currency = 'USD',
      eventType = 'Subscribe', // Subscribe, Unsubscribe, etc.
      ipAddress,
      userAgent,
      externalId,
      request
    } = data;

    const eventData = {
      data: [{
        event_name: eventType,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
        
        user_data: {
          em: this.hashData(email),
          client_ip_address: ipAddress,
          client_user_agent: userAgent,
          fbc: this.getFbcCookie(request),
          fbp: this.getFbpCookie(request),
          external_id: this.hashData(externalId || email)
        },
        
        custom_data: {
          plan_name: planName,
          subscription_value: planValue,
          currency: currency
        },
        
        currency: currency,
        value: planValue
      }],
      
      test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          access_token: FB_ACCESS_TOKEN
        })
      });

      const result = await response.json();
      
      if (result.error) {
        console.error('Facebook Conversions API Error:', result.error);
        return { success: false, error: result.error };
      }

      console.log('Facebook Conversions API Success:', result);
      return { success: true, data: result };

    } catch (error: any) {
      console.error('Facebook Conversions API Request Failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Hash sensitive data (required by Facebook)
  hashData(data?: string): string | undefined {
    if (!data) return undefined;
    try {
      return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
    } catch (error) {
      console.error('Error hashing data:', error);
      return undefined;
    }
  }

  // Get Facebook click ID from cookie (if available)
  getFbcCookie(request?: any): string | undefined {
    if (typeof window !== 'undefined') {
      // Client-side: get from document.cookie
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === '_fbc') {
          return decodeURIComponent(value);
        }
      }
    } else if (request) {
      // Server-side: get from request headers or cookies
      const cookieHeader = request.headers?.cookie || request.headers?.Cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === '_fbc') {
            return decodeURIComponent(value);
          }
        }
      }
    }
    return undefined;
  }

  // Get Facebook browser ID from cookie (if available)
  getFbpCookie(request?: any): string | undefined {
    if (typeof window !== 'undefined') {
      // Client-side: get from document.cookie
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === '_fbp') {
          return decodeURIComponent(value);
        }
      }
    } else if (request) {
      // Server-side: get from request headers or cookies
      const cookieHeader = request.headers?.cookie || request.headers?.Cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === '_fbp') {
            return decodeURIComponent(value);
          }
        }
      }
    }
    return undefined;
  }

  // Send a custom event
  async sendCustomEvent(eventName: string, data: {
    email?: string;
    customData?: any;
    currency?: string;
    value?: number;
  }) {
    const eventData = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `${process.env.NEXT_PUBLIC_URL}`,
        
        user_data: {
          em: this.hashData(data.email)
        },
        
        custom_data: data.customData || {},
        
        currency: data.currency || 'USD',
        value: data.value
      }],
      
      test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          access_token: FB_ACCESS_TOKEN
        })
      });

      const result = await response.json();
      
      if (result.error) {
        console.error('Facebook Conversions API Error:', result.error);
        return { success: false, error: result.error };
      }

      console.log('Facebook Conversions API Success:', result);
      return { success: true, data: result };

    } catch (error: any) {
      console.error('Facebook Conversions API Request Failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default FacebookConversionsAPI; 