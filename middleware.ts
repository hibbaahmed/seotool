import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { protectedPaths } from "./lib/constant/index"; // Import the protected paths
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Redirect non-www to www for consistent domain usage
  const url = new URL(request.url);
  if (url.hostname === 'bridgely.io') {
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = 'www.bridgely.io';
    return NextResponse.redirect(redirectUrl, 301);
  }
  
  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Define public routes
  const publicRoutes = ["/api/inngest", "/onboarding"];

  // Skip authentication for public routes
  if (publicRoutes.includes(url.pathname)) {
    return res;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL("/price", request.url));
    }
    return res;
  } else {
    if (protectedPaths.includes(url.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return res;
  }
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // Feel free to modify this pattern to include more paths.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};