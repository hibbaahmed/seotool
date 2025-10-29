import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface TokenResponse {
  access_token: string;
  token_type: string;
  blog_id?: string;
  blog_url?: string;
  scope?: string;
}

interface WordPressSite {
  ID: number;
  name: string;
  URL: string;
  description: string;
  is_private: boolean;
}

interface SitesResponse {
  sites: WordPressSite[];
}

/**
 * Handles WordPress.com OAuth callback
 * GET /api/wordpress/wpcom/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('WordPress.com OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('OAuth authorization failed')}`,
          request.url
        )
      );
    }

    // Validate code and state
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('Invalid OAuth callback')}`,
          request.url
        )
      );
    }

    // Verify state parameter (CSRF protection)
    const cookieState = request.cookies.get('wpcom_oauth_state')?.value;
    if (!cookieState || cookieState !== state) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('Invalid state parameter')}`,
          request.url
        )
      );
    }

    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const userId = stateData.userId;

    // Get OAuth credentials
    const clientId = process.env.WPCOM_CLIENT_ID;
    const clientSecret = process.env.WPCOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing WordPress.com OAuth credentials');
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('OAuth not configured')}`,
          request.url
        )
      );
    }

    // Dynamically determine redirect URI based on request origin (must match login request)
    const redirectUri = request.nextUrl.origin + '/api/wordpress/wpcom/callback';

    // Exchange code for access token
    const tokenResponse = await fetch('https://public-api.wordpress.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('Failed to get access token')}`,
          request.url
        )
      );
    }

    const tokenData: TokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user's WordPress.com sites
    const sitesResponse = await fetch('https://public-api.wordpress.com/rest/v1.1/me/sites', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!sitesResponse.ok) {
      const errorText = await sitesResponse.text();
      console.error('Failed to fetch sites:', errorText);
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('Failed to fetch your sites')}`,
          request.url
        )
      );
    }

    const sitesData: SitesResponse = await sitesResponse.json();

    if (!sitesData.sites || sitesData.sites.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/wordpress-sites?error=${encodeURIComponent('No WordPress.com sites found')}`,
          request.url
        )
      );
    }

    // Store sites in database
    const supabase = await createClient();

    // For each site, create or update a record
    for (const site of sitesData.sites) {
      // Check if site already exists
      const { data: existing } = await supabase
        .from('wordpress_sites')
        .select('id')
        .eq('user_id', userId)
        .eq('site_id', site.ID.toString())
        .eq('provider', 'wpcom')
        .single();

      if (existing) {
        // Update existing site
        await supabase
          .from('wordpress_sites')
          .update({
            name: site.name,
            url: site.URL,
            access_token: accessToken,
            // WordPress.com tokens don't expire by default, but we set a far future date
            token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new site
        await supabase
          .from('wordpress_sites')
          .insert({
            user_id: userId,
            provider: 'wpcom',
            site_id: site.ID.toString(),
            name: site.name,
            url: site.URL,
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
          });
      }
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL(
        `/dashboard/wordpress-sites?success=${encodeURIComponent(`Connected ${sitesData.sites.length} WordPress.com site(s) successfully!`)}`,
        request.url
      )
    );

    response.cookies.delete('wpcom_oauth_state');

    return response;

  } catch (error) {
    console.error('WordPress.com OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/wordpress-sites?error=${encodeURIComponent('OAuth callback failed')}`,
        request.url
      )
    );
  }
}



