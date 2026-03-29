import { SupabaseClient } from "@supabase/supabase-js";
import { TIER_LIMITS } from "./stripe";
import type { SubscriptionTier } from "./types";

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();

  if (!data || data.status !== "active") return "free";
  return data.tier as SubscriptionTier;
}

export function canAddBusiness(
  tier: SubscriptionTier,
  currentBusinessCount: number
): boolean {
  const limit = TIER_LIMITS[tier]?.businesses ?? 1;
  return currentBusinessCount < limit;
}

export function canUseAutoReply(tier: SubscriptionTier): boolean {
  return TIER_LIMITS[tier]?.autoReply ?? false;
}
