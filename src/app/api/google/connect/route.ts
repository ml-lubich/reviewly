import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGoogleAuthUrl } from "@/lib/google-oauth";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  // Use user ID as state to verify callback
  const state = user.id;
  const authUrl = getGoogleAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
