import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { exchangeCodeForTokens } from "@/lib/google-oauth";

const GBP_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const GBP_BIZ_API = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=google_auth_denied`);
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Fetch the user's Google Business accounts
    const accountsRes = await fetch(`${GBP_API}/accounts`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!accountsRes.ok) {
      throw new Error("Failed to fetch Google Business accounts");
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    if (accounts.length === 0) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=no_google_business`);
    }

    // For each account, fetch locations (businesses)
    for (const account of accounts) {
      const accountName = account.name; // "accounts/123"

      const locationsRes = await fetch(
        `${GBP_BIZ_API}/${accountName}/locations?readMask=name,title,storefrontAddress`,
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );

      if (!locationsRes.ok) continue;

      const locationsData = await locationsRes.json();
      const locations = locationsData.locations || [];

      for (const location of locations) {
        const locationName = location.name; // "locations/456"
        const businessName = location.title || "Unnamed Business";

        // Check if this business already exists for this user
        const { data: existing } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .eq("google_account_id", accountName)
          .eq("google_location_id", locationName)
          .single();

        if (existing) {
          // Update tokens
          await supabase
            .from("businesses")
            .update({
              google_access_token: tokens.access_token,
              google_refresh_token: tokens.refresh_token || null,
              google_token_expires_at: expiresAt.toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Create new business
          await supabase.from("businesses").insert({
            owner_id: user.id,
            business_name: businessName,
            google_account_id: accountName,
            google_location_id: locationName,
            google_access_token: tokens.access_token,
            google_refresh_token: tokens.refresh_token || null,
            google_token_expires_at: expiresAt.toISOString(),
          });
        }
      }
    }

    return NextResponse.redirect(`${appUrl}/dashboard?connected=true`);
  } catch (err) {
    console.error("Google Business callback error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?error=google_connect_failed`);
  }
}
