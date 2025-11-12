"use client";
import useUser from "../hook/useUser";
import { Button } from "../../components/ui/Button";
import { Loader2 } from "lucide-react"; // For loading indicator
import { manageBilling } from "../../lib/actions/stripe";
import React from "react";

export function isSubscriptionActive(subscription: {
	customer_id: string | null;
	subscription_id: string | null;
	end_at: string | null;
	cancel_at: string | null;
  }): boolean {
	// No subscription data means not active
	if (!subscription?.customer_id || !subscription?.subscription_id) {
	  return false;
	}
  
	const now = new Date();
  
	// If there's a cancel_at date, check if we're still before that date
	if (subscription.cancel_at) {
	  const cancelDate = new Date(subscription.cancel_at);
	  // User has access until cancel_at date
	  return now < cancelDate;
	}
  
	// If there's an end_at date (billing period end), check if subscription is still valid
	if (subscription.end_at) {
	  const endDate = new Date(subscription.end_at);
	  return now < endDate;
	}
  
	// If we have subscription data but no dates, assume active
	return true;
  }

export default function Subscription() {
    const { user, loading } = useUser();

	if (loading) {
		return (
			<div className="flex justify-center items-center p-6">
				<Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
			</div>
		);
	}

	const handleBilling = async () => {
		if (user?.subscription?.customer_id) {
			const data = JSON.parse(
				await manageBilling(user?.subscription?.customer_id)
			);
			window.location.href = data.url;
		}
	};

	// Check if subscription is scheduled for cancellation
	const isCancelScheduled = user?.subscription?.cancel_at !== null;
	const cancelDate = user?.subscription?.cancel_at 
		? new Date(user.subscription.cancel_at)
		: null;

	// Check if subscription is still active (even if cancel is scheduled)
	const hasActiveSubscription = user?.subscription?.customer_id && 
		(!isCancelScheduled || (cancelDate && new Date() < cancelDate));

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-semibold text-slate-900">
					Hi, <span className="text-indigo-600">{user?.display_name}</span>
				</h2>

				{hasActiveSubscription && !isCancelScheduled && user?.subscription?.end_at && (
					<p className="text-sm text-slate-600 mt-2">
						Your subscription renews on{" "}
						<span className="font-medium text-slate-900">
							{new Date(user.subscription.end_at).toLocaleDateString(undefined, {
								weekday: "short",
								month: "short",
								day: "2-digit",
								year: "numeric",
							})}
						</span>
					</p>
				)}

				{hasActiveSubscription && isCancelScheduled && cancelDate && (
					<div className="mt-2">
						<p className="text-sm text-amber-600 font-medium">
							⚠️ Subscription scheduled for cancellation
						</p>
						<p className="text-sm text-slate-600 mt-1">
							You'll have access until{" "}
							<span className="font-medium text-slate-900">
								{cancelDate.toLocaleDateString(undefined, {
									weekday: "short",
									month: "short",
									day: "2-digit",
									year: "numeric",
								})}
							</span>
						</p>
					</div>
				)}
				
				{!hasActiveSubscription && (
					<p className="text-sm text-slate-600 mt-2">
						You don't have an active subscription.
					</p>
				)}
			</div>

			{user?.subscription?.customer_id && (
				<Button 
					className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
					onClick={handleBilling}
				>
					{isCancelScheduled ? "Reactivate or Manage Subscription" : "Manage Subscription"}
				</Button>
			)}
		</div>
	);
}