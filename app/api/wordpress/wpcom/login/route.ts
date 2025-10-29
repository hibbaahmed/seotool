import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Initiates WordPress.com OAuth flow
 * GET /api/wordpress/wpcom/login
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get OAuth credentials from environment
    const clientId = process.env.WPCOM_CLIENT_ID;
    const clientSecret = process.env.WPCOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing WordPress.com OAuth credentials');
      return NextResponse.json(
        { error: 'WordPress.com OAuth not configured' },
        { status: 500 }
      );
    }

    // Dynamically determine redirect URI based on request origin
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const redirectUri = `${origin}/api/wordpress/wpcom/callback`;

    // Generate a random state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(7)
      })
    ).toString('base64url');

    // Store state in a temporary table or cookie for verification
    // For now, we'll use a cookie
    const response = NextResponse.redirect(
      `https://public-api.wordpress.com/oauth2/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=global&` +
      `state=${state}`
    );

    // Set cookie with state for verification in callback
    response.cookies.set('wpcom_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('WordPress.com OAuth login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}



