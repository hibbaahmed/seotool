import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    const { priceId, userEmail, promotekit_referral, fbc, fbp } = await req.json();
    
    // Use Facebook cookies from request body (sent by frontend) or fallback to headers
    let finalFbc = fbc || '';
    let finalFbp = fbp || '';
    
    // Fallback to extracting from request headers if not provided in body
    if (!finalFbc || !finalFbp) {
      const cookies = req.headers.get('cookie') || '';
      const fbcMatch = cookies.match(/_fbc=([^;]+)/);
      const fbpMatch = cookies.match(/_fbp=([^;]+)/);
      finalFbc = finalFbc || (fbcMatch ? decodeURIComponent(fbcMatch[1]) : '');
      finalFbp = finalFbp || (fbpMatch ? decodeURIComponent(fbpMatch[1]) : '');
    }
    
    console.log('🔍 Facebook cookies for checkout session:', { 
      fbc: finalFbc ? 'present' : 'missing', 
      fbp: finalFbp ? 'present' : 'missing' 
    });

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Validate email if provided
    const isValidEmail = (email: string | undefined | null): boolean => {
      if (!email || email.trim() === '') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim());
    };

    // Get plan name and value from priceId - Updated to match current pricing
    const planInfo = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH || '']: { name: 'Business', value: 69 },
    };
    
    const planData = planInfo[priceId] || { name: 'Business', value: 69 };
    const planName = planData.name;
    const planValue = planData.value;
    
    // Construct base URL with proper scheme - improved fallback handling
    const getBaseUrl = (): string => {
      // Priority 1: Check if NEXT_PUBLIC_URL is set and valid
      if (process.env.NEXT_PUBLIC_URL) {
        const url = process.env.NEXT_PUBLIC_URL.trim();
        if (url && url !== 'undefined') {
          // If it already has http:// or https://, use it as is
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          }
          // Otherwise, add https:// (or http:// for localhost)
          if (url.includes('localhost') || url.includes('127.0.0.1')) {
            return `http://${url}`;
          }
          return `https://${url}`;
        }
      }
      
      // Priority 2: Construct from request headers
      try {
        const host = req.headers.get('host');
        if (host && host !== 'undefined') {
          const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
          return `${protocol}://${host}`;
        }
      } catch (e) {
        console.warn('Could not get host from headers:', e);
      }
      
      // Priority 3: Fallback to localhost for development
      console.warn('⚠️ Could not determine base URL, using localhost fallback');
      return 'http://localhost:3000';
    };
    
    const baseUrl = getBaseUrl();
    console.log('🔗 Using base URL for checkout:', baseUrl);
    
    if (!baseUrl || baseUrl.includes('undefined')) {
      return NextResponse.json({ error: 'Invalid base URL configuration' }, { status: 500 });
    }
    
    // Build session creation parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${planName}&value=${planValue}`,
      cancel_url: `${baseUrl}/price`,
      metadata: {
        promotekit_referral: promotekit_referral || '',
        plan: planName,
        plan_value: planValue.toString(),
        currency: 'USD',
        // Store Facebook cookies for server-side tracking
        fbc: finalFbc || '',
        fbp: finalFbp || ''
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      payment_method_collection: 'always',
      // Collect more customer information for better Facebook tracking
      billing_address_collection: 'required',
    };

    // Only include customer_email if it's valid
    if (userEmail && isValidEmail(userEmail)) {
      sessionParams.customer_email = userEmail.trim();
      console.log('✅ Using customer email:', userEmail.trim());
    } else {
      console.warn('⚠️ No valid customer email provided, Stripe will collect it during checkout');
      // Don't include customer_email - Stripe will collect it during checkout
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ 
      id: session.id,
      url: session.url // Include the checkout URL for direct redirect
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}