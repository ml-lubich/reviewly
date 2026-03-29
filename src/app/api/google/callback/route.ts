import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { exchangeCodeForTokens } from "@/lib/google-oauth";
import { getAppUrl } from "@/lib/env";
import { SupabaseClient } from "@supabase/supabase-js";

const GBP_ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const GBP_BUSINESS_API = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
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
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const accounts = await fetchGoogleBusinessAccounts(tokens.access_token);

    if (accounts.length === 0) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=no_google_business`);
    }

    await syncBusinessLocations(supabase, user.id, accounts, tokens, expiresAt);

    return NextResponse.redirect(`${appUrl}/dashboard?connected=true`);
  } catch (err) {
    console.error("Google Business callback error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?error=google_connect_failed`);
  }
}

async function fetchGoogleBusinessAccounts(accessToken: string) {
  const res = await fetch(`${GBP_ACCOUNTS_API}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google Business accounts");
  }

  const data = await res.json();
  return data.accounts || [];
}

async function fetchLocationsForAccount(
  accountName: string,
  accessToken: string
) {
  const res = await fetch(
    `${GBP_BUSINESS_API}/${accountName}/locations?readMask=name,title,storefrontAddress`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.locations || [];
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
}

async function syncBusinessLocations(
  supabase: SupabaseClient,
  userId: string,
  accounts: { name: string }[],
  tokens: GoogleTokens,
  expiresAt: Date
) {
  for (const account of accounts) {
    const locations = await fetchLocationsForAccount(account.name, tokens.access_token);

    for (const location of locations) {
      await upsertBusinessLocation(supabase, userId, account.name, location, tokens, expiresAt);
    }
  }
}

async function upsertBusinessLocation(
  supabase: SupabaseClient,
  userId: string,
  accountName: string,
  location: { name: string; title?: string },
  tokens: GoogleTokens,
  expiresAt: Date
) {
  const locationName = location.name;
  const businessName = location.title || "Unnamed Business";

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .eq("google_account_id", accountName)
    .eq("google_location_id", locationName)
    .single();

  const tokenFields = {
    google_access_token: tokens.access_token,
    google_refresh_token: tokens.refresh_token || null,
    google_token_expires_at: expiresAt.toISOString(),
  };

  if (existing) {
    await supabase
      .from("businesses")
      .update(tokenFields)
      .eq("id", existing.id);
  } else {
    await supabase.from("businesses").insert({
      owner_id: userId,
      business_name: businessName,
      google_account_id: accountName,
      google_location_id: locationName,
      ...tokenFields,
    });
  }
}
