"use client";
import useUser from "../hook/useUser";
import { Button } from "../../components/ui/Button";
import { Loader2 } from "lucide-react"; // For loading indicator
import { manageBilling } from "../../lib/actions/stripe";
import React from "react";

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

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-semibold text-slate-900">
					Hi, <span className="text-indigo-600">{user?.display_name}</span>
				</h2>

				{user?.subscription?.end_at && (
					<p className="text-sm text-slate-600 mt-2">
						Your subscription renews on{" "}
						<span className="font-medium text-slate-900">
							{new Date(user?.subscription?.end_at).toLocaleDateString(undefined, {
								weekday: "short",
								month: "short",
								day: "2-digit",
								year: "numeric",
							})}
						</span>
					</p>
				)}
			</div>

			{user?.subscription?.customer_id && (
				<Button 
					className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
					onClick={handleBilling}
				>
					Manage Subscription
				</Button>
			)}
		</div>
	);
}