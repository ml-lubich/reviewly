import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_STRIPE_PORTAL } from "@/lib/constants";

export async function POST(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResponse = checkRateLimit(`stripe-portal:${user.id}`, RATE_LIMIT_STRIPE_PORTAL);
  if (rateLimitResponse) return rateLimitResponse;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getAppUrl()}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Portal session failed" },
      { status: 500 }
    );
  }
}
