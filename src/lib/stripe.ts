import Stripe from "stripe";
import { getStripeSecretKey } from "./env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return stripeClient;
}

export const STRIPE_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || "",
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "",
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
};

export const TIER_LIMITS: Record<string, { businesses: number; autoReply: boolean }> = {
  free: { businesses: 1, autoReply: false },
  starter: { businesses: 1, autoReply: false },
  professional: { businesses: 5, autoReply: true },
  enterprise: { businesses: Infinity, autoReply: true },
};
