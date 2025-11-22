import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated for script upload');
      }

    if (!user.email) {
        throw new Error('User email not found');
    }

    // Fetch credits data
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      throw new Error('Could not fetch user credits');
    }

    // Fetch subscription data to check trial status
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscription')
      .select('trial_ends_at')
      .eq('email', user.email)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      // Don't fail - just log and continue without trial check
    }

    const { credits } = creditsData;

    // Check if user is in trial period - skip credit deduction during trial
    const now = new Date();
    const trialEndsAt = subscriptionData?.trial_ends_at ? new Date(subscriptionData.trial_ends_at) : null;
    const isInTrial = trialEndsAt && now < trialEndsAt;

    if (isInTrial) {
      console.log('🎉 User is in trial period - skipping credit deduction (unlimited usage)');
      return NextResponse.json({ success: true, trial: true });
    }

    // Check if the user has enough credits (only if not in trial)
    if (credits < 1) {
      return NextResponse.json(
        { error: 'Not enough credits to generate script' },
        { status: 400 }
      );
    }

    // Subtract 1 credit from the user's account (only if not in trial)
    const { error: updateCreditError } = await supabase
      .from('credits')
      .update({ credits: credits - 1 })
      .eq('user_id', user.id);

    if (updateCreditError) {
      throw new Error('Could not update user credits');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}