import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
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

    // Get plan name and value from priceId - Updated to match current pricing
    const planInfo = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH || '']: { name: 'Starter', value: 16 },
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH || '']: { name: 'Starter', value: 8 },
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS || '']: { name: 'Daily', value: 34 },
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS_YEAR || '']: { name: 'Daily', value: 17 },
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS || '']: { name: 'Influencer', value: 58 },
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS_YEAR || '']: { name: 'Influencer', value: 29 },
    };
    
    const planData = planInfo[priceId] || { name: 'Daily', value: 34 };
    const planName = planData.name;
    const planValue = planData.value;
    
    // Construct base URL with proper scheme
    const getBaseUrl = () => {
      // Check if NEXT_PUBLIC_URL is set and has a scheme
      if (process.env.NEXT_PUBLIC_URL) {
        const url = process.env.NEXT_PUBLIC_URL.trim();
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
      
      // Fallback: construct from request headers (for localhost)
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      return `${protocol}://${host}`;
    };
    
    const baseUrl = getBaseUrl();
    console.log('🔗 Using base URL for checkout:', baseUrl);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${planName}&value=${planValue}`,
      cancel_url: `${baseUrl}/price`,
      customer_email: userEmail,
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
      // subscription_data: {
      //   trial_period_days: 7,
      // },
      payment_method_collection: 'always',
      // Collect more customer information for better Facebook tracking
      billing_address_collection: 'required',
    });

    return NextResponse.json({ 
      id: session.id,
      url: session.url // Include the checkout URL for direct redirect
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}