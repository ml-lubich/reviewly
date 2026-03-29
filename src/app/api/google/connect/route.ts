import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGoogleAuthUrl } from "@/lib/google-oauth";
import { getAppUrl } from "@/lib/env";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", getAppUrl()));
  }

  const authUrl = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(authUrl);
}
