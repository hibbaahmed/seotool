import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Prevent Next.js / Vercel from caching responses
replicate.fetch = (url, options) => {
  return fetch(url, { ...options, cache: "no-store" });
};

// Determine the webhook host
const WEBHOOK_HOST = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NGROK_HOST;

export async function POST(request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error(
        'The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it.'
      );
    }

    const { prompt, width, height, refine,
      scheduler,
      lora_scale,
      guidance_scale,
      high_noise_frac,
      prompt_strength,
      num_inference_steps } = await request.json();

    // Setup Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            } catch (error) {
              console.error('Error setting cookies:', error.message);
            }
          },
        },
      }
    );

    // Fetch the user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated for prediction generation');
    }

    // Fetch the user's current credits
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
        { error: 'Not enough credits to generate prediction' },
        { status: 400 }
      );
    }

    // Prediction options
    const options = {
      version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
      input: {
        prompt, width, height, refine,
        scheduler,
        lora_scale,
        guidance_scale,
        high_noise_frac,
        prompt_strength,
        num_inference_steps
      }
    };

    if (WEBHOOK_HOST) {
      options.webhook = `${WEBHOOK_HOST}/api/webhooks`;
      options.webhook_events_filter = ["start", "completed"];
    }

    const prediction = await replicate.predictions.create(options);

    if (prediction?.error) {
      return NextResponse.json({ detail: prediction.error }, { status: 500 });
    }

    // Subtract 1 credit from the user's account
    const { error: updateCreditError } = await supabase
      .from('credits')
      .update({ credits: credits - 1 })
      .eq('user_id', user.id);

    if (updateCreditError) {
      throw new Error('Could not update user credits');
    }

    return NextResponse.json(prediction, { status: 201 });

  } catch (error) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

