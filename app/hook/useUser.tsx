"use client";
import { supabaseBrowser } from "../../lib/supabase/browser";
import React, { useState, useEffect } from "react";

const initUser = {
	created_at: "",
	display_name: "",
	email: "",
	id: "",
	image_url: "",
	subscription: {
		created_at: "",
		customer_id: "",
		email: "",
		end_at: "",
		subscription_id: "",
	},
};

export default function useUser() {
	const [user, setUser] = useState(initUser);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const supabase = supabaseBrowser();
				const { data } = await supabase.auth.getSession();
				if (data.session?.user) {
					// fetch user profile information
					const { data: userProfile } = await supabase
						.from("profiles")
						.select("*,subscription(*)")
						.eq("id", data.session.user.id)
						.single();
					if (userProfile) {
						setUser(userProfile);
					}
				}
			} catch (err) {
				setError(err instanceof Error ? err : new Error('Unknown error'));
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, []);

	return { user, loading, error };
}