import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGoogleAuthUrl } from "@/lib/google-oauth";
import { getAppUrl } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_GOOGLE_CONNECT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  // Check if Google OAuth is configured before attempting
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google Business integration is not yet configured. Please contact support." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", getAppUrl()));
  }

  const rateLimitResponse = checkRateLimit(`google-connect:${user.id}`, RATE_LIMIT_GOOGLE_CONNECT);
  if (rateLimitResponse) return rateLimitResponse;

  const authUrl = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(authUrl);
}
