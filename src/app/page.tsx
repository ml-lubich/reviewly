"use client";

import { useState, useEffect, useRef } from "react";
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
  Quote,
  ChevronDown,
  Menu,
  X,
  Globe,
  Mail,
  ExternalLink,
  Users,
  TrendingUp,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-400 shadow-lg shadow-primary/25">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Reviewly</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/login" className="hidden sm:inline-flex">
            <Button size="sm" className="shadow-md shadow-primary/20">
              Start free
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-center">
                Log in
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full justify-center">
                Start free
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-36">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-gradient-to-b from-primary/8 to-transparent blur-3xl" />
        <div className="absolute top-40 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-3xl animate-float" />
        <div className="absolute top-60 right-1/4 h-[280px] w-[280px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium">
            <Zap className="h-3.5 w-3.5" />
            AI-powered review management
          </div>

          <h1 className="animate-fade-in-delay-1 text-5xl font-extrabold tracking-tight leading-[1.1] sm:text-6xl md:text-7xl lg:text-8xl">
            Never miss a{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Google Review
            </span>{" "}
            again
          </h1>

          <p className="animate-fade-in-delay-2 mt-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
            Reviewly uses AI to craft perfect responses to every review — in
            your brand&apos;s unique voice. Save hours, delight customers, and
            grow your online reputation on autopilot.
          </p>

          <div className="animate-fade-in-delay-3 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 h-12">
                See how it works
              </Button>
            </Link>
          </div>

          <div className="animate-fade-in-delay-3 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Cancel anytime
            </span>
          </div>
        </div>

        {/* Social proof stats */}
        <div className="animate-fade-in-delay-3 mt-16 mx-auto max-w-3xl">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Users, value: "2,500+", label: "Businesses" },
              { icon: MessageSquareText, value: "1.2M+", label: "Replies sent" },
              { icon: TrendingUp, value: "4.7", label: "Avg. rating boost" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="animate-fade-in-delay-3 mt-16 mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-1.5 shadow-2xl shadow-primary/5 pulse-glow">
            <div className="rounded-xl bg-card p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">reviewly.app/dashboard</div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Sarah M.", rating: 5, text: "Absolutely love this place! The baristas are so friendly...", status: "AI Reply Ready" },
                  { name: "James T.", rating: 4, text: "Great coffee and nice ambiance. Got a bit crowded...", status: "Published" },
                  { name: "Priya K.", rating: 2, text: "Waited 20 minutes for a simple espresso...", status: "Needs Review" },
                ].map((review, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 p-3 md:p-4 transition-colors hover:bg-muted/50">
                    <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-indigo-400/20 text-sm font-medium text-primary">
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
    <section id="features" className="py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
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
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-400/10 text-primary transition-all duration-300 group-hover:from-primary group-hover:to-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
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
    <section id="how-it-works" className="py-24 md:py-36 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            How it works
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Four simple steps to automate your review responses forever.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="relative group">
              <div className="text-6xl font-extrabold bg-gradient-to-b from-primary/15 to-transparent bg-clip-text text-transparent mb-4">
                {s.step}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
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
      name: "Free",
      price: "$0",
      description: "Try it out, no commitment",
      features: [
        "1 business location",
        "AI reply generation",
        "Manual approval",
        "Community support",
      ],
    },
    {
      name: "Starter",
      price: "$29",
      description: "For a single location, more features",
      features: [
        "1 business location",
        "AI reply generation",
        "Basic analytics",
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
        "AI reply generation",
        "Auto-reply mode",
        "Advanced analytics",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "$199",
      description: "For large organizations",
      features: [
        "Unlimited locations",
        "AI reply generation",
        "Auto-reply mode",
        "Advanced analytics",
        "Priority support",
        "API access",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "glass border-primary/30 shadow-xl shadow-primary/10 scale-[1.02] lg:scale-105"
                  : "glass"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-indigo-400 px-4 py-0.5 text-xs font-semibold text-white shadow-lg shadow-primary/25">
                  Most popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block">
                <Button
                  className={`w-full h-11 rounded-xl font-medium transition-all ${
                    plan.popular ? "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.price === "$0" ? "Get started free" : "Start free trial"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      name: "Rachel Chen",
      role: "Owner, The Golden Whisk Bakery",
      quote:
        "Before Reviewly, I spent an hour every morning replying to Google reviews. Now the AI handles it perfectly in our warm, friendly tone. Our reply rate went from 40% to 100% overnight.",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      role: "GM, AutoCare Plus (3 locations)",
      quote:
        "Managing reviews across three shops was a nightmare. Reviewly lets us keep a consistent brand voice everywhere while saving us 15+ hours a week. Our Google rating went up from 4.1 to 4.6 in two months.",
      rating: 5,
    },
    {
      name: "Dr. Priya Sharma",
      role: "Director, Bright Smile Dental",
      quote:
        "The tone-matching is what sold me. Patients get thoughtful, empathetic responses to sensitive reviews — not generic templates. It genuinely feels like we wrote each one ourselves.",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 md:py-36 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Testimonials
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by business owners
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how Reviewly is helping real businesses grow their reputation.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }, (_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <Quote className="h-8 w-8 text-primary/20 mb-3" />
              <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-indigo-400/20 text-sm font-semibold text-primary">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      question: "How does Reviewly connect to my Google Business Profile?",
      answer:
        "After you sign in, you'll go through a secure Google OAuth flow that grants Reviewly permission to read your reviews and post replies on your behalf. Your credentials are never stored — we use secure access tokens that you can revoke at any time.",
    },
    {
      question: "Can I review AI replies before they're published?",
      answer:
        "Absolutely. By default, Reviewly generates a draft reply for each review that you can edit, approve, or discard. If you prefer a hands-off approach, you can enable auto-reply mode to publish responses automatically.",
    },
    {
      question: "What happens if the AI writes something I don't like?",
      answer:
        "You always have full control. Every generated reply can be edited before publishing. You can also fine-tune the AI's behavior by adjusting your tone settings, providing example responses, and adding custom instructions.",
    },
    {
      question: "Does Reviewly work with multiple business locations?",
      answer:
        "Yes. On the Pro plan, you can connect up to 5 Google Business locations and configure different tones and auto-reply settings for each one, all from a single dashboard.",
    },
    {
      question: "Is there a free plan?",
      answer:
        "Yes — we offer a free plan with up to 10 AI-generated replies per month for one location. Every paid plan also comes with a 14-day free trial so you can experience the full feature set before committing.",
    },
  ];

  return (
    <section id="faq" className="py-24 md:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about Reviewly.
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/20"
            >
              <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium [&::-webkit-details-marker]:hidden list-none">
                {faq.question}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0 ml-4" />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 md:py-36 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-blue-500 p-8 md:p-20 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to automate your reviews?
          </h2>
          <p className="relative mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Join thousands of businesses using Reviewly to respond faster, grow
            their reputation, and win more customers.
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-xl h-12 px-8 text-base font-semibold"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 h-12 px-8 text-base"
              >
                View pricing
              </Button>
            </Link>
          </div>
          <p className="relative mt-6 text-sm text-white/50">
            No credit card required. Free plan available forever.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-400 shadow-md shadow-primary/20">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold tracking-tight">Reviewly</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI-powered Google Review management. Respond faster, grow your
              reputation, and win more customers.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Website" className="text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Email" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Blog" className="text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a></li>
              <li><a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Reviewly. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with AI, built for humans.
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
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
