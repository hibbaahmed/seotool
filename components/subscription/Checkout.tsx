"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import useUser from "../../app/hook/useUser"; // Assuming you have a hook to get user info
import { trackEnhancedFacebookEvent, getPlanInfo, getFbcCookie, getFbpCookie } from '../../lib/facebook-tracking-utils';

interface CheckoutProps {
	priceId: string;
	className?: string;
	buttonText?: string | React.ReactNode;
}

// Declare the promotekit_referral property on the window interface
declare global {
  interface Window {
    promotekit_referral?: string;
  }
}

export default function Checkout({ priceId, className, buttonText = "Getting Started" }: CheckoutProps) {
	const { user } = useUser(); // Get user info
	const [loading, setLoading] = useState(false);
	
	const handleCheckout = async () => {
		setLoading(true);
		try {
			// Track InitiateCheckout event with enhanced Facebook tracking
			const planData = getPlanInfo(priceId);
			const eventId = `initiate_checkout_${Date.now()}`;
			
			const trackingData = {
				content_type: 'subscription',
				content_category: 'Video Creation Tool',
				content_name: `${planData.name} Plan`,
				content_ids: [planData.name.toLowerCase()],
				value: planData.value,
				currency: 'USD',
				num_items: 1,
			};

			const userData = user?.email ? { em: user.email } : undefined;
			
			trackEnhancedFacebookEvent('InitiateCheckout', trackingData, userData, eventId);
			
			// Get the referral directly from window.promotekit_referral
			const promotekitReferral = window.promotekit_referral || '';
			console.log("Starting checkout with referral:", promotekitReferral);
			
			// Get Facebook cookies for server-side tracking
			const fbcCookie = getFbcCookie();
			const fbpCookie = getFbpCookie();
			console.log("Facebook cookies for checkout:", { fbc: fbcCookie, fbp: fbpCookie });
			
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
				  priceId, 
				  userEmail: user?.email,
				  promotekit_referral: promotekitReferral,
				  // Include Facebook cookies for server-side tracking
				  fbc: fbcCookie,
				  fbp: fbpCookie
				}),
			});

			const data = await response.json();

			if (data.error) {
				console.error('Error creating checkout session:', data.error);
				alert('Failed to create checkout session');
				setLoading(false);
				return;
			}

			// Redirect directly to the checkout session URL
			if (data.url) {
				window.location.href = data.url;
			} else if (data.id) {
				// Fallback: construct the checkout URL from session ID if URL is not provided
				window.location.href = `https://checkout.stripe.com/c/pay/${data.id}`;
			} else {
				alert('Failed to get checkout session URL');
				setLoading(false);
			}
		} catch (error) {
			console.error('Error during checkout:', error);
			alert('An error occurred during checkout');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			className={`w-full flex items-center gap-2 ${className}`}
			onClick={handleCheckout}
			disabled={loading}
		>
			{buttonText}
			{loading && <AiOutlineLoading3Quarters className="animate-spin" />}
		</Button>
	);
}