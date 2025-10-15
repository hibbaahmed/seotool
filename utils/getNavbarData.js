// utils/getNavbarData.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from "next/headers";

export async function getNavbarData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { data: credits } = await supabase.from("credits").select("*").eq("user_id", user?.id ?? '').single();

  return { user, credits };
}