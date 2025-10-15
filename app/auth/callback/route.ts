import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type CookieOptions, createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	// if "next" is in param, use it as the redirect URL
	const next = searchParams.get("next") ?? "/";

	if (code) {
		const cookieStore = await cookies();
		
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		
		if (!supabaseUrl || !supabaseAnonKey) {
			console.error('Missing Supabase environment variables');
			return NextResponse.redirect(`${origin}/auth/auth-code-error`);
		}
		
		const supabase = createServerClient(
			supabaseUrl,
			supabaseAnonKey,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll()
					},
					setAll(cookiesToSet) {
						try {
							cookiesToSet.forEach(({ name, value, options }) =>
								cookieStore.set(name, value, options)
							)
						} catch {
							// The `setAll` method was called from a Server Component.
							// This can be ignored if you have middleware refreshing
							// user sessions.
						}
					},
				},
			}
		);
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// return the user to an error page with instructions
	return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}