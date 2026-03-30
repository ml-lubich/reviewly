"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import type { Subscription, SubscriptionTier } from "@/lib/types";
import {
  Check,
  Crown,
  Loader2,
  ExternalLink,
  Sparkles,
  Building2,
  Zap,
  BarChart3,
  Headphones,
  Code,
} from "lucide-react";

const PLAN_DETAILS: {
  tier: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: { label: string; icon: typeof Check }[];
}[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    description: "Try it out, no commitment",
    features: [
      { label: "1 business location", icon: Building2 },
      { label: "AI reply generation", icon: Sparkles },
      { label: "Manual approval", icon: Check },
      { label: "Community support", icon: Headphones },
    ],
  },
  {
    tier: "starter",
    name: "Starter",
    price: "$29",
    description: "For a single location, more features",
    features: [
      { label: "1 business location", icon: Building2 },
      { label: "AI reply generation", icon: Sparkles },
      { label: "Basic analytics", icon: BarChart3 },
      { label: "Email support", icon: Headphones },
    ],
  },
  {
    tier: "professional",
    name: "Professional",
    price: "$79",
    description: "For growing businesses",
    popular: true,
    features: [
      { label: "Up to 5 business locations", icon: Building2 },
      { label: "AI reply generation", icon: Sparkles },
      { label: "Auto-reply mode", icon: Zap },
      { label: "Advanced analytics", icon: BarChart3 },
      { label: "Priority support", icon: Headphones },
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: "$199",
    description: "For large organizations",
    features: [
      { label: "Unlimited business locations", icon: Building2 },
      { label: "AI reply generation", icon: Sparkles },
      { label: "Auto-reply mode", icon: Zap },
      { label: "Advanced analytics", icon: BarChart3 },
      { label: "Priority support", icon: Headphones },
      { label: "API access", icon: Code },
    ],
  },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentTier: SubscriptionTier = subscription?.tier ?? "free";

  useEffect(() => {
    async function loadSubscription() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to load subscription:", err);
        setLoadError("Failed to load billing information");
      }
      setLoading(false);
    }
    loadSubscription();
  }, []);

  async function handleUpgrade(tier: SubscriptionTier) {
    setActionLoading(tier);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadError(data.error || "Failed to start checkout");
      }
    } catch {
      setLoadError("Failed to start checkout. Please try again.");
    }
    setActionLoading(null);
  }

  async function handleManageBilling() {
    setActionLoading("portal");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadError(data.error || "Failed to open billing portal");
      }
    } catch {
      setLoadError("Failed to open billing portal. Please try again.");
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return <p className="text-destructive py-8">{loadError}</p>;
  }

  const tierOrder: SubscriptionTier[] = ["free", "starter", "professional", "enterprise"];
  const currentTierIndex = tierOrder.indexOf(currentTier);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current plan summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Current Plan</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="capitalize">
                    {currentTier}
                  </Badge>
                  {subscription?.cancel_at_period_end && (
                    <Badge variant="destructive">Cancels at period end</Badge>
                  )}
                </div>
              </div>
            </div>
            {subscription?.stripe_customer_id && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={actionLoading === "portal"}
              >
                {actionLoading === "portal" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
          {subscription?.current_period_end && (
            <p className="text-sm text-muted-foreground mt-3">
              Current period ends {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan comparison cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_DETAILS.map((plan) => {
            const planIndex = tierOrder.indexOf(plan.tier);
            const isCurrentPlan = plan.tier === currentTier;
            const isDowngrade = planIndex < currentTierIndex;
            const isUpgrade = planIndex > currentTierIndex;

            return (
              <Card
                key={plan.tier}
                className={`relative transition-all duration-300 ${
                  isCurrentPlan
                    ? "border-primary shadow-lg shadow-primary/10"
                    : plan.popular
                    ? "border-primary/30 shadow-md"
                    : ""
                }`}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-indigo-400 px-4 py-0.5 text-xs font-semibold text-white shadow-lg shadow-primary/25">
                    Most popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-xs font-semibold text-primary-foreground shadow-lg">
                    Current plan
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature.label} className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <feature.icon className="h-3 w-3 text-primary" />
                        </div>
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current plan
                      </Button>
                    ) : isUpgrade ? (
                      <Button
                        className="w-full shadow-md shadow-primary/20"
                        onClick={() => handleUpgrade(plan.tier)}
                        disabled={actionLoading === plan.tier}
                      >
                        {actionLoading === plan.tier ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Upgrade to {plan.name}
                      </Button>
                    ) : isDowngrade && subscription?.stripe_customer_id ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleManageBilling}
                        disabled={actionLoading === "portal"}
                      >
                        Manage Billing
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
