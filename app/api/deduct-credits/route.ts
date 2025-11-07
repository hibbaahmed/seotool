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

      const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      throw new Error('Could not fetch user credits');
    }

    const { credits } = creditsData;

    // Check if the user has enough credits
    if (credits < 1) {
      return NextResponse.json(
        { error: 'Not enough credits to generate script' },
        { status: 400 }
      );
    }

    // Subtract 1 credit from the user's account
    const { error: updateCreditError } = await supabase
      .from('credits')
      .update({ credits: credits - 1 })
      .eq('user_id', user.id);

    if (updateCreditError) {
      throw new Error('Could not update user credits');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}