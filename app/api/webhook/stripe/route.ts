import { Database } from "../../../../types/supabase";
import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buffer } from "node:stream/consumers";
import { supabaseAdmin } from "../../../../lib/supabase/admin";
import FacebookConversionsAPI from "../../../../lib/facebook-conversions-api";
import crypto from 'crypto';

// Disable body parsing for webhooks - we need the raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to hash data for Facebook (required)
function hashDataForFacebook(data?: string): string | undefined {
  if (!data) return undefined;
  try {
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  } catch (error) {
    console.error('Error hashing data:', error);
    return undefined;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl) {
	throw new Error("MISSING NEXT_PUBLIC_SUPABASE_URL!");
}

if (!supabaseServiceRoleKey) {
	throw new Error("MISSING SUPABASE_SERVICE_ROLE_KEY!");
}

if (!stripeSecretKey) {
	throw new Error("MISSING STRIPE_SECRET_KEY!");
}

if (!endpointSecret) {
	console.warn("⚠️ WARNING: STRIPE_ENDPOINT_SECRET is not set. Webhook signature verification will fail.");
	console.warn("💡 For local testing, run: stripe listen --forward-to localhost:3000/api/webhook/stripe");
	console.warn("💡 Then copy the webhook signing secret (whsec_xxx) to your .env.local file");
}

const stripe = new Stripe(stripeSecretKey);

// Monthly price IDs
const tenCreditPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEN_CREDITS as string;
const twentyfiveCreditsPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS as string;
const fiftyCreditsPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS as string;

// Yearly price IDs
const tenCreditPriceIdYear = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEN_CREDITS_YEAR as string;
const twentyfiveCreditsPriceIdYear = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS_YEAR as string;
const fiftyCreditsPriceIdYear = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS_YEAR as string;

// Log all price IDs for debugging
console.log('🔑 Loaded Stripe Price IDs:', {
	monthly: {
		ten: tenCreditPriceId,
		twentyfive: twentyfiveCreditsPriceId,
		fifty: fiftyCreditsPriceId
	},
	yearly: {
		ten: tenCreditPriceIdYear,
		twentyfive: twentyfiveCreditsPriceIdYear,
		fifty: fiftyCreditsPriceIdYear
	}
});

const creditsPerPriceId: {
	[key: string]: number;
} = {
	// Monthly plans
	[tenCreditPriceId]: 120,
	[twentyfiveCreditsPriceId]: 300,
	[fiftyCreditsPriceId]: 600,
	// Yearly plans (same credits, different price ID)
	[tenCreditPriceIdYear]: 120,
	[twentyfiveCreditsPriceIdYear]: 300,
	[fiftyCreditsPriceIdYear]: 600,
};

const supabase = createClient<Database>(
	supabaseUrl as string,
	supabaseServiceRoleKey as string,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	}
);

export async function POST(req: any) {
	try {
		// Check if endpoint secret is configured
		if (!endpointSecret) {
			console.error("❌ STRIPE_ENDPOINT_SECRET is not configured");
			return Response.json(
				{ 
					error: "Webhook secret not configured",
					message: "Please set STRIPE_ENDPOINT_SECRET in your .env.local file. For local testing, use the secret from 'stripe listen' command."
				},
				{ status: 500 }
			);
		}

		const rawBody = await buffer(req.body);
		const headersList = await headers();
		const sig = headersList.get("stripe-signature");

		if (!sig) {
			console.error("❌ Missing stripe-signature header");
			return Response.json(
				{ error: "Missing stripe-signature header" },
				{ status: 400 }
			);
		}

		let event;
		try {
			event = stripe.webhooks.constructEvent(
				rawBody,
				sig,
				endpointSecret
			);
			console.log("✅ Webhook signature verified:", event.type);
		} catch (err: any) {
			console.error("❌ Webhook signature verification failed:", err.message);
			console.error("💡 Make sure you're using the correct webhook secret:");
			console.error("   - Local testing: Use secret from 'stripe listen' (whsec_xxx)");
			console.error("   - Production: Use secret from Stripe Dashboard webhook endpoint");
			return Response.json(
				{ 
					error: `Webhook signature verification failed: ${err?.message}`,
					hint: "Check that STRIPE_ENDPOINT_SECRET matches your webhook endpoint secret"
				},
				{ status: 400 }
			);
		}
		switch (event.type) {
			case "checkout.session.completed":
				// Handle successful checkout completion
				const checkoutSession = event.data.object;
				const checkoutEmail = checkoutSession.customer_details?.email;
				const checkoutAmount = (checkoutSession.amount_total || 0) / 100;
				const checkoutPlan = checkoutSession.metadata?.plan || 'Basic';
				
				console.log('🛒 Checkout completed:', {
					email: checkoutEmail,
					amount: checkoutAmount,
					plan: checkoutPlan,
					sessionId: checkoutSession.id
				});
				
				// Send Enhanced Facebook Conversions API event for checkout completion
				// This ensures we capture the purchase immediately with all available data
				if (checkoutEmail) {
					try {
						// Extract all available customer data for better match quality
						const customerDetails = checkoutSession.customer_details;
						
						// Extract name from customer details
						const customerName = customerDetails?.name || '';
						const nameParts = customerName.split(' ');
						const firstName = nameParts[0] || '';
						const lastName = nameParts.slice(1).join(' ') || '';
						
						// Use session ID for consistent event ID matching with client-side
						const sessionId = checkoutSession.id;
						
						// Prepare enhanced user data for better Facebook matching
                        const userData = {
                            em: hashDataForFacebook(checkoutEmail),
                            ...(firstName && { fn: hashDataForFacebook(firstName) }),
                            ...(lastName && { ln: hashDataForFacebook(lastName) }),
                            ...(customerDetails?.address?.city && { ct: hashDataForFacebook(customerDetails.address.city) }),
                            ...(customerDetails?.address?.state && { st: hashDataForFacebook(customerDetails.address.state) }),
                            ...(customerDetails?.address?.postal_code && { zp: hashDataForFacebook(customerDetails.address.postal_code) }),
                            ...(customerDetails?.address?.country && { country: hashDataForFacebook(customerDetails.address.country) }),
                            client_ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '0.0.0.0',
                            client_user_agent: req.headers['user-agent'] || 'Server',
                            // Add Facebook identifiers for better matching - these are crucial for ad attribution
                            ...(checkoutSession.metadata?.fbc && { fbc: checkoutSession.metadata.fbc }),
                            ...(checkoutSession.metadata?.fbp && { fbp: checkoutSession.metadata.fbp })
                        };
						
                        console.log('🔐 Enhanced user data prepared for Facebook:', {
                            email: checkoutEmail,
                            firstName: firstName ? 'included' : 'missing',
                            lastName: lastName ? 'included' : 'missing',
                            address: customerDetails?.address ? 'included' : 'missing',
                            fbc: checkoutSession.metadata?.fbc ? 'present' : 'missing',
                            fbp: checkoutSession.metadata?.fbp ? 'present' : 'missing'
                        });
						
						// Create enhanced Facebook event data
						const facebookEventData = {
							data: [{
								event_name: 'Purchase',
								event_time: Math.floor(Date.now() / 1000),
								event_id: `purchase_${sessionId}`, // Match client-side event ID for deduplication
								action_source: 'website',
								event_source_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
								
								// Enhanced user data for matching
								user_data: userData,
								
								// Custom data
								custom_data: {
									plan_name: checkoutPlan,
									subscription_type: 'recurring',
									currency: 'USD',
									value: checkoutAmount,
									content_type: 'subscription',
									content_category: 'Video Creation Tool',
									content_name: `${checkoutPlan} Plan`,
									content_ids: [checkoutPlan.toLowerCase()],
									num_items: 1
								},
								
								// Standard parameters
								currency: 'USD',
								value: checkoutAmount
							}],
							
							// Test event flag (remove in production)
							test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
						};
						
						console.log('📤 Sending Purchase event to Facebook from checkout.session.completed:', JSON.stringify(facebookEventData, null, 2));
						
						// Send directly to Facebook API
						const facebookResponse = await fetch(
							`https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PIXEL_ID}/events`,
							{
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({
									...facebookEventData,
									access_token: process.env.FACEBOOK_ACCESS_TOKEN
								})
							}
						);
						
						const facebookResult = await facebookResponse.json();
						
						if (facebookResult.error) {
							console.error('Facebook Conversions API Error:', facebookResult.error);
						} else {
							console.log('✅ Facebook Conversions API checkout event sent successfully:', facebookResult);
						}
						
					} catch (facebookError) {
						console.error('💥 Error sending Facebook checkout event:', facebookError);
					}
				}
				break;
				
			case "customer.subscription.created":
				// Handle new subscription creation
				const newSubscription = event.data.object;
				// Get customer email from customer object, not directly from subscription
				const subCustomerId = newSubscription.customer as string;
				const subAmount = (newSubscription.items.data[0]?.price.unit_amount || 0) / 100;
				const subPlan = newSubscription.items.data[0]?.price.metadata?.plan_name || 'Basic';
				
				console.log('📅 New subscription created:', {
					customerId: subCustomerId,
					amount: subAmount,
					plan: subPlan
				});
				
				// Send Facebook Conversions API event for subscription creation
				// Note: We'll get the email from the invoice.payment_succeeded event instead
				// since that's where we have access to the email
				break;
				
			case "invoice.payment_succeeded":
				// update here
				const result = event.data.object;
				const end_at = new Date(
					result.lines.data[0]?.period.end * 1000
				).toISOString();
				const customer_id = result.customer as string;
				const subscription_id = result.subscription as string;
				const email = result.customer_email as string;
				const error = await onPaymentSucceeded(
					end_at,
					customer_id,
					subscription_id,
					email,
					req
				);
				if (error) {
					console.log(error);
					return Response.json({ error: error.message });
				}
				break;
			case "customer.subscription.deleted":
				const deleteSubscription = event.data.object;
                const cancelError = await onSubCancel(deleteSubscription.id, req);
				if (cancelError) {
					console.log(cancelError);
					return Response.json({ error: cancelError.message });
				}
				break;
			default:
				console.log(`Unhandled event type ${event.type}`);
		}
		return Response.json({});
	} catch (e) {
		return Response.json({ error: `Webhook Error}` });
	}
}

async function onPaymentSucceeded(
	end_at: string,
	customer_id: string,
	subscription_id: string,
	email: string,
	req: any
) {
	const supabase = await supabaseAdmin();

	// Look up the user_id directly from the profiles table using email
	const { data: profileData, error: profileError } = await supabase
		.from("profiles")
		.select("id")
		.eq("email", email)
		.single();

	if (profileError) {
		console.error("Error finding user profile:", profileError);
		return profileError;
	}

	const userId = profileData.id;

	// Get the subscription details from Stripe
	const subscription = await stripe.subscriptions.retrieve(subscription_id, {
		expand: ['items.data.price']
	});

	// Calculate total credits from all subscription items
	let totalCredits = 0;
	console.log('🔍 Processing subscription items for credits calculation...');
	console.log('📋 Available price IDs in mapping:', Object.keys(creditsPerPriceId));
	console.log('🔍 Environment variables check:', {
		tenMonthly: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEN_CREDITS,
		tenYearly: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEN_CREDITS_YEAR,
		twentyfiveMonthly: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS,
		twentyfiveYearly: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TWENTYFIVE_CREDITS_YEAR,
		fiftyMonthly: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS,
		fiftyYearly: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FIFTY_CREDITS_YEAR
	});
	
	subscription.items.data.forEach(item => {
		const priceId = item.price.id;
		const quantity = item.quantity || 1;
		const creditsForPrice = creditsPerPriceId[priceId] || 0;
		totalCredits += creditsForPrice * quantity;
		
		console.log('📦 Processing item:', { 
			priceId, 
			quantity, 
			creditsForPrice, 
			runningTotal: totalCredits,
			priceFound: !!creditsPerPriceId[priceId],
			priceMetadata: item.price.metadata
		});
		
		// If price not found, log a warning
		if (!creditsPerPriceId[priceId]) {
			console.warn('⚠️ Price ID not found in credits mapping:', priceId);
			console.warn('🔍 Available price IDs:', Object.keys(creditsPerPriceId));
			console.warn('🔍 This price ID might be missing from environment variables');
		}
	});

	console.log('Final credits calculation:', {
		userId,
		totalCredits,
		subscription_id,
		customer_id,
		availablePriceIds: Object.keys(creditsPerPriceId),
		priceIdMapping: creditsPerPriceId
	});

	// Update subscription table - note that we no longer reference user_id
	const { error: subscriptionError } = await supabase
		.from("subscription")
		.update({
			end_at,
			customer_id,
			subscription_id,
			// updated_at: new Date().toISOString()
		})
		.eq("email", email);
	
	if (subscriptionError) {
		console.error('Error updating subscription:', subscriptionError);
		return subscriptionError;
	}
	
	// Update credits table with both IDs and the new credits amount
	// First check if a record exists
	const { data: existingCredits, error: checkError } = await supabase
		.from("credits")
		.select("*")
		.eq("user_id", userId)
		.single();

	let creditsError;
	if (existingCredits) {
		// Update existing record
		const { error } = await supabase
			.from("credits")
			.update({
				customer_id,
				subscription_id,
				credits: totalCredits,
			})
			.eq("user_id", userId);
		creditsError = error;
	} else {
		// Insert new record
		const { error } = await supabase
			.from("credits")
			.insert({
				user_id: userId,
				email,
				customer_id,
				subscription_id,
				credits: totalCredits,
			});
		creditsError = error;
	}
	
	if (creditsError) {
		console.error('Error updating credits:', creditsError);
		return creditsError;
	}

	console.log('Successfully updated tables:', {
		userId,
		subscription_id,
		customer_id,
		totalCredits,
		email
	});

	// Note: Facebook Purchase event is now sent from checkout.session.completed
	// to avoid duplicate events and ensure immediate tracking with complete customer data
	console.log('📝 Payment succeeded - Facebook Purchase event already sent from checkout.session.completed');
	
	return null;
}

async function onSubCancel(subscription_id: string, req: any) {
	const supabase = await supabaseAdmin();

	// First find the subscription to get the email
	const { data: subData, error: subError } = await supabase
		.from("subscription")
		.select("email")
		.eq("subscription_id", subscription_id)
		.single();

	if (subError) {
		console.error("Error finding subscription:", subError);
		return subError;
	}

	const email = subData.email;

	// Now look up the user_id from the profiles table
	const { data: profileData, error: profileError } = await supabase
		.from("profiles")
		.select("id")
		.eq("email", email)
		.single();

	if (profileError) {
		console.error("Error finding user profile:", profileError);
		return profileError;
	}

	const userId = profileData.id;

	// Update both tables
	const [subUpdateError, creditsUpdateError] = await Promise.all([
		supabase
			.from("subscription")
			.update({
				customer_id: null,
				subscription_id: null,
				// updated_at: new Date().toISOString()
			})
			.eq("subscription_id", subscription_id),
		
		supabase
			.from("credits")
			.update({
				customer_id: null,
				subscription_id: null,
				credits: 0,
				// updated_at: new Date().toISOString()
			})
			.eq("user_id", userId)
	]).then(([subRes, creditsRes]) => [subRes.error, creditsRes.error]);

	if (subUpdateError) {
		console.error("Error updating subscription:", subUpdateError);
		return subUpdateError;
	}

	if (creditsUpdateError) {
		console.error("Error updating credits:", creditsUpdateError);
		return creditsUpdateError;
	}

	// Send Facebook Conversions API event for subscription cancellation
	try {
		const facebookAPI = new FacebookConversionsAPI();
		
		console.log('🔄 Sending Facebook Unsubscribe event for cancelled subscription...', {
			email: email,
			subscription_id: subscription_id
		});
		
    await facebookAPI.sendSubscriptionEvent({
            email: email,
            planName: 'Cancelled',
            planValue: 0,
            currency: 'USD',
            eventType: 'Unsubscribe',
            ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '0.0.0.0',
            userAgent: req.headers['user-agent'] || 'Server',
            request: req
        });
		
		console.log('✅ Facebook Conversions API Unsubscribe event sent successfully');
	} catch (facebookError) {
		console.error('❌ Error sending Facebook Unsubscribe event:', facebookError);
		// Don't fail the webhook if Facebook tracking fails
	}

	return null;
}