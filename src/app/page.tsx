"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Star,
  Zap,
  MessageSquareText,
  BarChart3,
  Shield,
  Clock,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Reviewly</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-40 left-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute top-60 right-1/4 h-[250px] w-[250px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            AI-powered review management
          </div>

          <h1 className="animate-fade-in-delay-1 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Never miss a{" "}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Google Review
            </span>{" "}
            again
          </h1>

          <p className="animate-fade-in-delay-2 mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
            Reviewly uses AI to craft perfect responses to every review — in
            your brand&apos;s unique voice. Save hours, delight customers, and
            grow your online reputation on autopilot.
          </p>

          <div className="animate-fade-in-delay-3 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </div>

          <div className="animate-fade-in-delay-3 mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              No credit card required
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Cancel anytime
            </span>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="animate-fade-in-delay-3 mt-16 mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-1 shadow-2xl shadow-primary/5 pulse-glow">
            <div className="rounded-lg bg-card p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs text-muted-foreground">reviewly.app/dashboard</div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Sarah M.", rating: 5, text: "Absolutely love this place! The baristas are so friendly...", status: "AI Reply Ready" },
                  { name: "James T.", rating: 4, text: "Great coffee and nice ambiance. Got a bit crowded...", status: "Published" },
                  { name: "Priya K.", rating: 2, text: "Waited 20 minutes for a simple espresso...", status: "Needs Review" },
                ].map((review, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 p-3 md:p-4">
                    <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {review.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{review.name}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Star key={j} className={`h-3 w-3 ${j < review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{review.text}</p>
                    </div>
                    <span className={`hidden md:inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      review.status === "Published" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                      review.status === "AI Reply Ready" ? "bg-primary/15 text-primary" :
                      "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}>
                      {review.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: MessageSquareText,
      title: "AI-Crafted Replies",
      description:
        "Generate personalized, on-brand responses to every review using GPT-4o. Positive or negative, we handle it perfectly.",
    },
    {
      icon: Zap,
      title: "Auto-Reply Mode",
      description:
        "Set it and forget it. Enable auto-reply to respond to new reviews instantly, or review each response before publishing.",
    },
    {
      icon: Star,
      title: "Tone Matching",
      description:
        "Configure your brand voice — friendly, professional, casual, or custom. Every reply sounds authentically you.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Track response rates, sentiment trends, and reply times. Know exactly how your reputation is performing.",
    },
    {
      icon: Shield,
      title: "Multi-Location Support",
      description:
        "Manage reviews across all your business locations from a single dashboard. Different tones per location.",
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description:
        "AI replies are generated in seconds, not hours. Cut your average response time from days to minutes.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to manage reviews
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Reviewly automates the entire review response workflow so you can
            focus on running your business.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Connect your Google Business",
      description: "Link your Google Business Profile in one click. We'll start syncing your reviews automatically.",
    },
    {
      step: "02",
      title: "Set your brand voice",
      description: "Tell us your tone — friendly, professional, witty — and provide example responses for the AI to learn from.",
    },
    {
      step: "03",
      title: "AI generates replies",
      description: "For every new review, our AI crafts a personalized response that matches your brand perfectly.",
    },
    {
      step: "04",
      title: "Review or auto-publish",
      description: "Approve each reply manually, edit as needed, or enable auto-mode to respond instantly.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Four simple steps to automate your review responses forever.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-bold text-primary/10 mb-4">{s.step}</div>
              <h3 className="mb-2 font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for a single location",
      features: [
        "1 business location",
        "Up to 100 reviews/month",
        "AI reply generation",
        "Manual approval workflow",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: "$79",
      description: "For growing businesses",
      popular: true,
      features: [
        "Up to 5 locations",
        "Unlimited reviews",
        "AI reply generation",
        "Auto-reply mode",
        "Analytics dashboard",
        "Priority support",
        "Custom tone per location",
      ],
    },
    {
      name: "Enterprise",
      price: "$199",
      description: "For large organizations",
      features: [
        "Unlimited locations",
        "Unlimited reviews",
        "AI reply generation",
        "Auto-reply mode",
        "Advanced analytics",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 ${
                plan.popular
                  ? "border-primary bg-card shadow-lg shadow-primary/10 scale-105"
                  : "border-border/50 bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mb-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary p-8 md:p-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <h2 className="relative text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to automate your reviews?
          </h2>
          <p className="relative mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of businesses using Reviewly to respond faster,
            grow their reputation, and win more customers.
          </p>
          <div className="relative mt-8">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Reviewly</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Reviewly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
