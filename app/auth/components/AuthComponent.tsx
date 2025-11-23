"use client";
import { Button } from "../../../components/ui/Button";
import { KeyRound } from "lucide-react";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { supabaseBrowser } from "../../../lib/supabase/browser";
import { useSearchParams } from "next/navigation";

export default function AuthComponent() {
	const params = useSearchParams();
	const next = params.get("next") || "";
	const handleLoginWithOAuth = (provider: "github" | "google") => {
		const supabase = supabaseBrowser();
		
		// Normalize the origin to always use www subdomain (except localhost)
		let normalizedOrigin = location.origin;
		if (!location.hostname.includes("localhost") && !location.hostname.startsWith("www.")) {
			normalizedOrigin = location.origin.replace("://", "://www.");
		}
		
		const redirectTo = `${normalizedOrigin}/auth/callback${next ? `?next=${next}` : ""}`;
		console.log("OAuth redirect URL:", redirectTo);
		
		supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo,
			},
		});
	};

	return (
		<div className="flex items-center justify-center w-full">
			<div className="w-full space-y-4">
				<Button
					className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 font-medium py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
					variant="outline"
					onClick={() => handleLoginWithOAuth("google")}
				>
					<FcGoogle className="w-5 h-5" />
					Continue with Google
				</Button>
			</div>
		</div>
	);
}