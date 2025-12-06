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

// Solo month price ID
const soloMonthPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH as string;

// Log price ID for debugging
if (soloMonthPriceId) {
	console.log('🔑 Loaded Stripe Price ID:', soloMonthPriceId);
} else {
	console.warn('⚠️ NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH is not set');
}

// Credits mapping - 30 articles per month = 30 credits
const creditsPerPriceId: {
	[key: string]: number;
} = {
	[soloMonthPriceId]: 30,
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
					sessionId: checkoutSession.id,
					mode: checkoutSession.mode,
					subscription: checkoutSession.subscription
				});
				
				// If this is a subscription, update credits immediately
				// Note: We don't have the invoice period end yet, so end_at will be calculated from subscription
				if (checkoutSession.mode === 'subscription' && checkoutSession.subscription && checkoutEmail) {
					try {
						const subscriptionId = typeof checkoutSession.subscription === 'string' 
							? checkoutSession.subscription 
							: (checkoutSession.subscription as any)?.id;
						
						if (subscriptionId) {
							console.log('💰 Processing subscription credits for checkout:', {
								subscriptionId,
								email: checkoutEmail,
								sessionId: checkoutSession.id
							});
							// Don't pass end_at here - it will be calculated from subscription
							await updateCreditsFromSubscription(checkoutEmail, subscriptionId);
							console.log('✅ Credits updated successfully in checkout.session.completed');
						} else {
							console.warn('⚠️ No subscription ID found in checkout session');
						}
					} catch (creditsError) {
						const errorMessage = creditsError instanceof Error ? creditsError.message : String(creditsError);
						console.error('❌ Error updating credits in checkout.session.completed:', errorMessage);
						console.error('💡 Credits will be updated when invoice.payment_succeeded event fires');
						// Don't fail the webhook - invoice.payment_succeeded will handle it
					}
				} else {
					console.log('ℹ️ Skipping credits update - not a subscription checkout:', {
						mode: checkoutSession.mode,
						hasSubscription: !!checkoutSession.subscription,
						hasEmail: !!checkoutEmail
					});
				}
				
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
						// Include external_id for consistent user identification across sessions
						const externalId = checkoutEmail ? hashDataForFacebook(checkoutEmail) : undefined;
						
                        const userData = {
                            em: hashDataForFacebook(checkoutEmail),
                            ...(firstName && { fn: hashDataForFacebook(firstName) }),
                            ...(lastName && { ln: hashDataForFacebook(lastName) }),
                            ...(customerDetails?.address?.city && { ct: hashDataForFacebook(customerDetails.address.city) }),
                            ...(customerDetails?.address?.state && { st: hashDataForFacebook(customerDetails.address.state) }),
                            ...(customerDetails?.address?.postal_code && { zp: hashDataForFacebook(customerDetails.address.postal_code) }),
                            ...(customerDetails?.address?.country && { country: hashDataForFacebook(customerDetails.address.country) }),
                            ...(customerDetails?.phone && { ph: hashDataForFacebook(customerDetails.phone.replace(/[^0-9]/g, '')) }),
                            client_ip_address: req.headers.get?.('x-forwarded-for') || req.headers.get?.('x-real-ip') || '0.0.0.0',
                            client_user_agent: req.headers.get?.('user-agent') || 'Server',
                            // Add Facebook identifiers for better matching - these are crucial for ad attribution
                            ...(checkoutSession.metadata?.fbc && { fbc: checkoutSession.metadata.fbc }),
                            ...(checkoutSession.metadata?.fbp && { fbp: checkoutSession.metadata.fbp }),
                            // Add external_id for consistent user identification (hashed email)
                            ...(externalId && { external_id: externalId })
                        };
						
                        console.log('🔐 Enhanced user data prepared for Facebook:', {
                            email: checkoutEmail,
                            firstName: firstName ? 'included' : 'missing',
                            lastName: lastName ? 'included' : 'missing',
                            phone: customerDetails?.phone ? 'included' : 'missing',
                            address: customerDetails?.address ? 'included' : 'missing',
                            fbc: checkoutSession.metadata?.fbc ? 'present' : 'missing',
                            fbp: checkoutSession.metadata?.fbp ? 'present' : 'missing',
                            external_id: externalId ? 'included' : 'missing'
                        });
						
						// Create enhanced Facebook event data
						const eventSourceUrl = `${process.env.NEXT_PUBLIC_URL}/checkout/success`;
						
						// Determine if this is a test event (development or localhost)
						const isDevelopment = process.env.NODE_ENV === 'development';
						const isLocalhost = eventSourceUrl.includes('localhost') || 
											eventSourceUrl.includes('127.0.0.1') ||
											eventSourceUrl.includes('192.168.') ||
											eventSourceUrl.includes('10.');
						
						const facebookEventData = {
							data: [{
								event_name: 'Purchase',
								event_time: Math.floor(Date.now() / 1000),
								event_id: `purchase_${sessionId}`, // Match client-side event ID for deduplication
								action_source: 'website',
								event_source_url: eventSourceUrl,
								
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
							
							// Test event flag - mark as test if development OR localhost
							// This prevents localhost test purchases from being counted as real events
							test_event_code: (isDevelopment || isLocalhost) ? 'TEST12345' : undefined
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

			
case "customer.subscription.updated":
	// Handle subscription updates (for cancellations)
	console.log('🔄 customer.subscription.updated event received');
	const updatedSubscription = event.data.object;
	const updateError = await onSubUpdate(updatedSubscription, req);
	if (updateError) {
		console.log('❌ Error in onSubUpdate:', updateError);
		const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
		return Response.json({ error: errorMessage });
	}
	break;
				
			case "invoice.payment_succeeded":
				// update here
				const result = event.data.object as Stripe.Invoice;
				const end_at = new Date(
					result.lines.data[0]?.period.end * 1000
				).toISOString();
				const customer_id = result.customer as string;
				// Access subscription property with proper type handling
				const subscriptionField = (result as any).subscription;
				const subscription_id = typeof subscriptionField === 'string' 
					? subscriptionField 
					: (subscriptionField as Stripe.Subscription | null)?.id || '';
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
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					return Response.json({ error: errorMessage });
				}
				break;
			case "customer.subscription.deleted":
				const deleteSubscription = event.data.object;
                const cancelError = await onSubCancel(deleteSubscription.id, req);
				if (cancelError) {
					console.log(cancelError);
					const errorMessage = cancelError instanceof Error ? cancelError.message : 'Unknown error';
					return Response.json({ error: errorMessage });
				}
				break;
			default:
				console.log(`Unhandled event type ${event.type}`);
		}
		return Response.json({});
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		return Response.json({ error: `Webhook Error: ${errorMessage}` });
	}
}

// Helper function to update credits from a subscription
async function updateCreditsFromSubscription(email: string, subscriptionId: string, providedEndAt?: string): Promise<void> {
	const supabase = await supabaseAdmin();

	// Look up the user_id from the profiles table using email
	const { data: profileData, error: profileError } = await supabase
		.from("profiles")
		.select("id")
		.eq("email", email)
		.single();

	if (profileError) {
		console.error("Error finding user profile for credits update:", profileError);
		throw profileError;
	}

	const userId = profileData.id;

	// Get customer ID from subscription
	const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ['items.data.price', 'customer']
	});

	const customerId = typeof subscription.customer === 'string' 
		? subscription.customer 
		: (subscription.customer as any)?.id;

	// Check if subscription is in trial period and get trial end date
	let trialEndsAt: string | null = null;
	const isInTrial = subscription.status === 'trialing';
	if (isInTrial && subscription.trial_end) {
		trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
		console.log('🎉 Subscription is in trial period, trial ends at:', trialEndsAt);
		console.log('⏸️ Skipping credit allocation during trial - credits will be added after trial ends');
	}

	// Get subscription period end date - try multiple methods
	let subscriptionEndDate: string | null = null;
	
	// Method 1: Use provided end_at if available (from invoice.payment_succeeded)
	if (providedEndAt) {
		// Convert ISO string to YYYY-MM-DD format if needed
		subscriptionEndDate = providedEndAt.includes('T') 
			? providedEndAt.split('T')[0] 
			: providedEndAt.split(' ')[0]; // Handle space-separated date
		console.log('✅ Using provided end_at:', subscriptionEndDate);
	}
	
	// Method 2: Try to get from subscription.current_period_end
	if (!subscriptionEndDate) {
		const currentPeriodEnd = (subscription as any).current_period_end as number | undefined;
		if (currentPeriodEnd) {
			subscriptionEndDate = new Date(currentPeriodEnd * 1000).toISOString().split('T')[0];
			console.log('✅ Using subscription.current_period_end:', subscriptionEndDate);
		}
	}
	
	// Method 3: Try to get from plan object directly
	if (!subscriptionEndDate) {
		const plan = (subscription as any).plan as any;
		if (plan) {
			const interval = plan.interval; // 'month' or 'year'
			const intervalCount = plan.interval_count || 1;
			const billingCycleAnchor = (subscription as any).billing_cycle_anchor as number | undefined;
			
			if (billingCycleAnchor && interval) {
				const startDate = new Date(billingCycleAnchor * 1000);
				let endDate = new Date(startDate);
				
				if (interval === 'month') {
					endDate.setMonth(endDate.getMonth() + intervalCount);
				} else if (interval === 'year') {
					endDate.setFullYear(endDate.getFullYear() + intervalCount);
				} else if (interval === 'day') {
					endDate.setDate(endDate.getDate() + intervalCount);
				} else if (interval === 'week') {
					endDate.setDate(endDate.getDate() + (intervalCount * 7));
				}
				
				subscriptionEndDate = endDate.toISOString().split('T')[0];
				console.log('✅ Calculated end_at from billing_cycle_anchor and plan interval:', subscriptionEndDate);
			}
		}
	}
	
	// Method 4: Calculate from items.data[0].price (subscription items)
	if (!subscriptionEndDate) {
		const items = (subscription as any).items?.data;
		if (items && items.length > 0) {
			const price = items[0].price;
			const interval = price?.recurring?.interval;
			const intervalCount = price?.recurring?.interval_count || 1;
			const billingCycleAnchor = (subscription as any).billing_cycle_anchor as number | undefined;
			
			if (billingCycleAnchor && interval) {
				const startDate = new Date(billingCycleAnchor * 1000);
				let endDate = new Date(startDate);
				
				if (interval === 'month') {
					endDate.setMonth(endDate.getMonth() + intervalCount);
				} else if (interval === 'year') {
					endDate.setFullYear(endDate.getFullYear() + intervalCount);
				} else if (interval === 'day') {
					endDate.setDate(endDate.getDate() + intervalCount);
				} else if (interval === 'week') {
					endDate.setDate(endDate.getDate() + (intervalCount * 7));
				}
				
				subscriptionEndDate = endDate.toISOString().split('T')[0];
				console.log('✅ Calculated end_at from billing_cycle_anchor and items price interval:', subscriptionEndDate);
			}
		}
	}
	
	// Method 5: Use start_date + 1 month as fallback
	if (!subscriptionEndDate) {
		const startDate = (subscription as any).start_date as number | undefined;
		if (startDate) {
			const endDate = new Date(startDate * 1000);
			endDate.setMonth(endDate.getMonth() + 1);
			subscriptionEndDate = endDate.toISOString().split('T')[0];
			console.log('⚠️ Using fallback: start_date + 1 month:', subscriptionEndDate);
		}
	}

	if (!subscriptionEndDate) {
		console.warn('⚠️ Could not determine subscription end date from any method');
		console.warn('📋 Subscription object keys:', Object.keys(subscription));
		console.warn('📋 Subscription items:', JSON.stringify((subscription as any).items, null, 2));
	}

	// Calculate total credits from subscription items
	let totalCredits = 0;
	console.log('🔍 Calculating credits from subscription:', subscriptionId);
	
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
			priceFound: !!creditsPerPriceId[priceId]
		});
		
		// If price not found, log a warning
		if (!creditsPerPriceId[priceId]) {
			console.warn('⚠️ Price ID not found in credits mapping:', priceId);
			console.warn('🔍 Expected price ID:', soloMonthPriceId);
			console.warn('🔍 Make sure NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO_MONTH matches your Stripe price ID');
		}
	});

	// Warn if credits are 0 - this shouldn't happen for valid subscriptions
	if (totalCredits === 0) {
		console.warn('⚠️ WARNING: Calculated credits is 0! This might indicate a price ID mismatch.');
		console.warn('📋 Subscription items:', subscription.items.data.map(item => ({
			priceId: item.price.id,
			priceFound: !!creditsPerPriceId[item.price.id],
			metadata: item.price.metadata
		})));
		console.warn('🔑 Expected price ID:', soloMonthPriceId);
		console.warn('🔍 Available price IDs in mapping:', Object.keys(creditsPerPriceId));
	}

	console.log('✅ Credits calculation:', {
		userId,
		totalCredits,
		subscription_id: subscriptionId,
		customer_id: customerId,
		email,
		subscriptionEndDate,
		priceIds: subscription.items.data.map(item => item.price.id)
	});

	// Update subscription table with end_at and trial_ends_at if we have them
	const subscriptionUpdate: any = {
		customer_id: customerId,
		subscription_id: subscriptionId,
	};
	
	if (subscriptionEndDate) {
		subscriptionUpdate.end_at = subscriptionEndDate;
	}
	
	// Add trial_ends_at if subscription is in trial
	if (trialEndsAt) {
		subscriptionUpdate.trial_ends_at = trialEndsAt;
	}
	
	const { error: subscriptionError } = await supabase
		.from("subscription")
		.update(subscriptionUpdate)
		.eq("email", email);
	
	if (subscriptionError) {
		console.error('Error updating subscription:', subscriptionError);
		throw subscriptionError;
	}

	// Update credits table - check if record exists first
	const { data: existingCredits, error: checkError } = await supabase
		.from("credits")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle(); // Use maybeSingle() to handle case where no record exists
	
	if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
		console.error('Error checking existing credits:', checkError);
		throw checkError;
	}
	
	// Validate that we have the required end_at date
	// If we still don't have it, use a default of 30 days from now
	if (!subscriptionEndDate) {
		const fallbackDate = new Date();
		fallbackDate.setDate(fallbackDate.getDate() + 30);
		subscriptionEndDate = fallbackDate.toISOString().split('T')[0];
		console.warn('⚠️ Using fallback end_at (30 days from now):', subscriptionEndDate);
	}

	// During trial period, give 100 starter credits when they pay the setup fee
	// Additional credits will be added when trial ends and subscription renews
	if (isInTrial) {
		console.log('🎉 User is in trial period - allocating 100 starter credits');
		console.log('✅ Subscription info updated with starter credits for paid trial');
		
		const TRIAL_STARTER_CREDITS = 100;
		
		// Update/create credits record with 100 starter credits
		let creditsError;
		if (existingCredits) {
			// Update existing record - set to 100 credits for trial
			console.log('🔄 Updating existing credits record (trial - adding starter credits):', {
				oldCredits: existingCredits.credits,
				newCredits: TRIAL_STARTER_CREDITS,
				end_at: subscriptionEndDate
			});
			const updateData: any = {
				customer_id: customerId,
				subscription_id: subscriptionId,
				credits: TRIAL_STARTER_CREDITS, // Give 100 starter credits for paid trial
				email: email,
				end_at: subscriptionEndDate,
			};
			
			const { error } = await supabase
				.from("credits")
				.update(updateData)
				.eq("user_id", userId);
			creditsError = error;
		} else {
			// Create new record with 100 starter credits during trial
			console.log('➕ Creating credits record during trial (100 starter credits):', subscriptionEndDate);
			const insertData: any = {
				user_id: userId,
				email: email,
				customer_id: customerId,
				subscription_id: subscriptionId,
				credits: TRIAL_STARTER_CREDITS, // Give 100 starter credits for paid trial
				end_at: subscriptionEndDate,
			};
			
			const { error } = await supabase
				.from("credits")
				.insert(insertData);
			creditsError = error;
		}
		
		if (creditsError) {
			console.error('Error updating credits during trial:', creditsError);
			throw creditsError;
		}
		
		console.log('✅ Successfully updated subscription and credits record (trial - 100 starter credits added):', {
			userId,
			subscription_id: subscriptionId,
			customer_id: customerId,
			email,
			trialEndsAt,
			starterCredits: TRIAL_STARTER_CREDITS
		});
		return; // Exit early - starter credits allocated for trial
	}

	// Not in trial - add credits normally
	let creditsError;
	if (existingCredits) {
		// Update existing record - only update if we have valid credits
		console.log('🔄 Updating existing credits record:', {
			oldCredits: existingCredits.credits,
			newCredits: totalCredits,
			end_at: subscriptionEndDate
		});
		const updateData: any = {
			customer_id: customerId,
			subscription_id: subscriptionId,
			credits: totalCredits > 0 ? totalCredits : existingCredits.credits, // Don't set to 0 if calculation failed
			email: email,
			end_at: subscriptionEndDate,
		};
		
		// Note: trial_ends_at is now stored in subscription table, not credits table
		
		const { error } = await supabase
			.from("credits")
			.update(updateData)
			.eq("user_id", userId);
		creditsError = error;
	} else {
		// Insert new record - only insert if we have valid credits
		if (totalCredits > 0) {
			console.log('➕ Inserting new credits record with', totalCredits, 'credits, end_at:', subscriptionEndDate);
			const insertData: any = {
				user_id: userId,
				email: email,
				customer_id: customerId,
				subscription_id: subscriptionId,
				credits: totalCredits,
				end_at: subscriptionEndDate,
			};
			
			// Note: trial_ends_at is now stored in subscription table, not credits table
			
			const { error } = await supabase
				.from("credits")
				.insert(insertData);
			creditsError = error;
		} else {
			console.error('❌ Cannot insert credits: totalCredits is 0. Price ID mismatch likely.');
			throw new Error('Credits calculation resulted in 0. Check price ID mapping.');
		}
	}
	
	if (creditsError) {
		console.error('Error updating credits:', creditsError);
		throw creditsError;
	}

	console.log('✅ Successfully updated credits and subscription:', {
		userId,
		subscription_id: subscriptionId,
		customer_id: customerId,
		totalCredits,
		email
	});
}

async function onPaymentSucceeded(
	end_at: string,
	customer_id: string,
	subscription_id: string,
	email: string,
	req: any
) {
	try {
		// Get subscription from Stripe to check trial status
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
		const subscription = await stripe.subscriptions.retrieve(subscription_id, {
			expand: ['items.data.price', 'customer']
		});

		// Check if subscription is still in trial period
		let trialEndsAt: string | null = null;
		if (subscription.status === 'trialing' && subscription.trial_end) {
			trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
			console.log('🎉 Subscription is still in trial period, trial ends at:', trialEndsAt);
		} else {
			// If trial has ended, clear trial_ends_at
			console.log('✅ Trial period has ended, clearing trial_ends_at');
		}

		// Update credits and subscription (this will be idempotent if already updated in checkout.session.completed)
		// Pass the end_at from the invoice so we use the correct period end date
		await updateCreditsFromSubscription(email, subscription_id, end_at);
		
		// Also update subscription table with the end_at from the invoice and trial status
		// (updateCreditsFromSubscription already updates subscription, but we want to ensure end_at is set correctly)
		const supabase = await supabaseAdmin();
		const subscriptionUpdate: any = {
			end_at, // This is the end_at from the invoice period
			customer_id,
			subscription_id,
		};

		// Update trial_ends_at based on current subscription status
		if (trialEndsAt) {
			subscriptionUpdate.trial_ends_at = trialEndsAt;
		} else {
			// Clear trial_ends_at if trial has ended
			subscriptionUpdate.trial_ends_at = null;
		}

		const { error: subscriptionError } = await supabase
			.from("subscription")
			.update(subscriptionUpdate)
			.eq("email", email);
		
		if (subscriptionError) {
			console.error('Error updating subscription end date:', subscriptionError);
			return subscriptionError;
		}

		console.log('📝 Payment succeeded - credits and subscription updated with end_at:', end_at, 'trial_ends_at:', trialEndsAt);
		return null;
	} catch (error) {
		console.error('Error in onPaymentSucceeded:', error);
		return error instanceof Error ? error : new Error('Unknown error');
	}
}

// Updated onSubUpdate - Store cancel_at instead of nulling
async function onSubUpdate(subscription: Stripe.Subscription, req: any) {
	console.log('🔄 Subscription update received:', {
		id: subscription.id,
		cancel_at_period_end: subscription.cancel_at_period_end,
		cancel_at: subscription.cancel_at,
		canceled_at: subscription.canceled_at,
		status: subscription.status
	});

	// Handle cancellations - check for cancel_at, cancel_at_period_end, OR canceled_at
	if (subscription.cancel_at || subscription.cancel_at_period_end || subscription.canceled_at) {
		const cancelAtDate = subscription.cancel_at 
			? new Date(subscription.cancel_at * 1000).toISOString() 
			: null;
		
		console.log('⚠️ Subscription scheduled for cancellation:', {
			cancel_at: cancelAtDate,
			cancel_at_period_end: subscription.cancel_at_period_end,
			canceled_at: subscription.canceled_at
		});
		
		// Store the cancellation date instead of immediately revoking access
		return await onSubScheduledCancel(subscription.id, cancelAtDate, req);
	}

	// Handle if status changed to "canceled" or "incomplete_expired"
	if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
		console.log('⚠️ Subscription status is canceled/expired - revoking access now');
		return await onSubCancel(subscription.id, req);
	}

	console.log('ℹ️ Subscription update does not require cancellation action');
	return null;
}

// NEW FUNCTION: Store scheduled cancellation date
async function onSubScheduledCancel(subscription_id: string, cancel_at: string | null, req: any) {
	const supabase = await supabaseAdmin();

	console.log('📅 Storing scheduled cancellation:', {
		subscription_id,
		cancel_at
	});

	// Find the subscription to get the email
	const { data: subData, error: subError } = await supabase
		.from("subscription")
		.select("email")
		.eq("subscription_id", subscription_id)
		.single();

	if (subError) {
		console.error("❌ Error finding subscription:", subError);
		return subError;
	}

	const email = subData.email;

	if (!email) {
		console.error("❌ No email found in subscription record!");
		return new Error("No email found in subscription");
	}

	// Look up the user_id from the profiles table
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

	// Update subscription table with cancel_at date
	// Use type assertion since cancel_at exists in the database but may not be in TypeScript types
	const { error: subUpdateError } = await supabase
		.from("subscription")
		.update({
			cancel_at: cancel_at // Store the cancellation date
		} as any)
		.eq("subscription_id", subscription_id);

	if (subUpdateError) {
		console.error("❌ Error updating subscription cancel_at:", subUpdateError);
		return subUpdateError;
	}

	// Update credits table with cancel_at date
	// Use type assertion since cancel_at exists in the database but may not be in TypeScript types
	const { error: creditsUpdateError } = await supabase
		.from("credits")
		.update({
			cancel_at: cancel_at // Store the cancellation date
		} as any)
		.eq("user_id", userId);

	if (creditsUpdateError) {
		console.error("❌ Error updating credits cancel_at:", creditsUpdateError);
		return creditsUpdateError;
	}

	console.log('✅ Scheduled cancellation stored successfully:', {
		email,
		userId,
		subscription_id,
		cancel_at
	});

	// Send Facebook Conversions API event for subscription cancellation
	try {
		const facebookAPI = new FacebookConversionsAPI();
		
		console.log('🔄 Sending Facebook Unsubscribe event for scheduled cancellation...', {
			email: email,
			subscription_id: subscription_id,
			cancel_at: cancel_at
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
	}

	return null;
}

// Keep the existing onSubCancel for when subscription is actually deleted
async function onSubCancel(subscription_id: string, req: any) {
	const supabase = await supabaseAdmin();

	console.log('🔴 CANCELLATION WEBHOOK RECEIVED (final deletion):', subscription_id);

	// First find the subscription to get the email
	const { data: subData, error: subError } = await supabase
		.from("subscription")
		.select("*")
		.eq("subscription_id", subscription_id)
		.single();

	if (subError) {
		console.error("❌ Error finding subscription:", subError);
		return subError;
	}

	console.log('📋 Found subscription data:', JSON.stringify(subData, null, 2));

	const email = subData.email;

	if (!email) {
		console.error("❌ No email found in subscription record!");
		return new Error("No email found in subscription");
	}

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

	console.log('🔄 Actually cancelling subscription in database (nulling data):', {
		subscription_id,
		email,
		userId
	});

	// NOW null out everything since the subscription has actually ended
	// Use type assertion since cancel_at exists in the database but may not be in TypeScript types
	const { data: subUpdateData, error: subUpdateError } = await supabase
		.from("subscription")
		.update({
			customer_id: null,
			subscription_id: null,
			cancel_at: null, // Clear the scheduled cancellation date
		} as any)
		.eq("subscription_id", subscription_id)
		.select();

	console.log('📊 Subscription update result:', {
		error: subUpdateError,
		rowsAffected: subUpdateData?.length || 0,
		updatedData: subUpdateData
	});
	
	// Update credits table
	// Use type assertion since cancel_at exists in the database but may not be in TypeScript types
	const { data: creditsUpdateData, error: creditsUpdateError } = await supabase
		.from("credits")
		.update({
			customer_id: null,
			subscription_id: null,
			credits: 0,
			cancel_at: null, // Clear the scheduled cancellation date
		} as any)
		.eq("user_id", userId)
		.select();

	console.log('📊 Credits update result:', {
		error: creditsUpdateError,
		rowsAffected: creditsUpdateData?.length || 0,
		updatedData: creditsUpdateData
	});

	if (subUpdateError) {
		console.error("❌ Error updating subscription:", subUpdateError);
		return subUpdateError;
	}

	if (creditsUpdateError) {
		console.error("❌ Error updating credits:", creditsUpdateError);
		return creditsUpdateError;
	}

	console.log('✅ Subscription cancelled successfully in database:', {
		email,
		userId,
		subscriptionRowsAffected: subUpdateData?.length || 0,
		creditsRowsAffected: creditsUpdateData?.length || 0
	});

	return null;
}
