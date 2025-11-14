import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'customer_details'],
    });

    // Extract customer information
    const customerDetails = session.customer_details;
    const customer = typeof session.customer === 'string' 
      ? await stripe.customers.retrieve(session.customer)
      : session.customer;

    // Check if customer exists and is not deleted
    const customerEmail = customer && typeof customer !== 'string' && !('deleted' in customer)
      ? customer.email
      : null;

    return NextResponse.json({
      email: customerDetails?.email || customerEmail,
      firstName: customerDetails?.name?.split(' ')[0] || null,
      lastName: customerDetails?.name?.split(' ').slice(1).join(' ') || null,
      city: customerDetails?.address?.city || null,
      state: customerDetails?.address?.state || null,
      zipCode: customerDetails?.address?.postal_code || null,
      country: customerDetails?.address?.country || null,
      phone: customerDetails?.phone || null,
    });
  } catch (error: any) {
    console.error('Error fetching session data:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

