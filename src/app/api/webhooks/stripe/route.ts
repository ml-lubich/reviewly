import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getStripeWebhookSecret } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase-admin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret()
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook error for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function extractPeriodDates(subscription: Stripe.Subscription) {
  const firstItem = subscription.items?.data?.[0];
  return {
    periodStart: firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000).toISOString()
      : null,
    periodEnd: firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null,
  };
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error("Checkout session missing user_id or tier metadata");
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(
    session.subscription as string
  );

  const { periodStart, periodEnd } = extractPeriodDates(subscription);

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    tier,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: "user_id" });
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const { periodStart, periodEnd } = extractPeriodDates(subscription);

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      tier: "free",
    })
    .eq("stripe_subscription_id", subscription.id);
}
