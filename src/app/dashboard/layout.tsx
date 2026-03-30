"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  LayoutDashboard,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  Check,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { createClient } from "@/lib/supabase";
import type { Business } from "@/lib/types";
import { useState, useEffect, useRef } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [userInitial, setUserInitial] = useState("U");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const selectedBusinessId = searchParams.get("business");

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserInitial(user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U");

        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setBusinesses(data);
          const selected = selectedBusinessId
            ? data.find((b: Business) => b.id === selectedBusinessId) || data[0]
            : data[0];
          setActiveBusiness(selected);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }
    loadData();
  }, [selectedBusinessId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectBusiness(business: Business) {
    setActiveBusiness(business);
    setSwitcherOpen(false);
    router.push(`/dashboard?business=${business.id}`);
  }

  const businessParam = activeBusiness ? `?business=${activeBusiness.id}` : "";
  const navItems = [
    { label: "Dashboard", href: `/dashboard${businessParam}`, icon: LayoutDashboard },
    ...(activeBusiness
      ? [
          { label: "Settings", href: `/dashboard/${activeBusiness.id}/settings`, icon: Settings },
          { label: "Analytics", href: `/dashboard/${activeBusiness.id}/analytics`, icon: BarChart3 },
        ]
      : []),
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Reviewly</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Business selector */}
        <div className="border-b border-border p-4">
          {activeBusiness ? (
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="w-full rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{activeBusiness.business_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeBusiness.google_place_id ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    switcherOpen && "rotate-180"
                  )} />
                </div>
              </button>
              {switcherOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-1 shadow-md">
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => selectBusiness(biz)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        biz.id === activeBusiness.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="truncate flex-1 text-left">{biz.business_name}</span>
                      {biz.id === activeBusiness.id && (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-border mt-1 pt-1">
                    <Link
                      href="/api/google/connect"
                      onClick={() => setSwitcherOpen(false)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Connect a business
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/api/google/connect">
              <div className="rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Connect a business
                </p>
              </div>
            </Link>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {userInitial}
            </div>
          </div>
        </header>
        <div className="p-6 md:p-8 max-w-6xl">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
