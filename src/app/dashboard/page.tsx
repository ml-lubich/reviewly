"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquareText,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Send,
  Pencil,
  Check,
  Loader2,
  X,
  Plus,
  RefreshCw,
  Building2,
  Star,
  CalendarDays,
  Store,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { calculateBusinessStats, sortReviews } from "@/lib/data";
import { REVIEWS_PER_PAGE, SEARCH_DEBOUNCE_MS, NEGATIVE_RATING_MAX, REVIEW_SORT_OPTIONS, SORT_NEWEST } from "@/lib/constants";
import type { ReviewSortValue } from "@/lib/constants";
import type { Business, Review, BusinessStats } from "@/lib/types";

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" as const },
  auto_replied: { label: "Auto-replied", variant: "success" as const },
  manually_replied: { label: "Replied", variant: "success" as const },
  skipped: { label: "Skipped", variant: "secondary" as const },
};

function ReviewCard({
  review,
}: {
  review: Review;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingReply, setEditingReply] = useState(false);
  const [replyText, setReplyText] = useState(review.reply?.final_text || "");
  const [published, setPublished] = useState(review.reply?.status === "published");
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handlePublishReply() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", replyText }),
      });
      if (!res.ok) throw new Error("Failed to publish reply");
      setPublished(true);
      toast.success("Reply published successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
    setPublishing(false);
  }

  async function handleSaveReply() {
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", replyText }),
      });
      if (!res.ok) throw new Error("Failed to save reply");
      setEditingReply(false);
      toast.success("Reply saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  }

  const status = STATUS_CONFIG[review.status];

  return (
    <Card className={`transition-all ${expanded ? "ring-1 ring-primary/20" : "hover:border-border"}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 text-sm font-semibold text-primary">
            {review.reviewer_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium">{review.reviewer_name}</span>
              <StarRating rating={review.rating} />
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(review.review_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {review.review_text}
            </p>

            {review.reply && !editingReply && (
              <ReplyDisplay
                replyText={replyText || review.reply.final_text || ""}
                published={published}
                publishing={publishing}
                onEdit={() => {
                  setEditingReply(true);
                  setReplyText(review.reply?.final_text || "");
                }}
                onPublish={handlePublishReply}
              />
            )}

            {editingReply && (
              <div className="mt-3">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveReply} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingReply(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {review.status === "pending" && !review.reply && !expanded && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => setExpanded(true)}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate AI Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Write Reply
                </Button>
              </div>
            )}

            {expanded && !review.reply && (
              <GenerateReplySection
                review={review}
                onClose={() => setExpanded(false)}
                onPublish={(text) => {
                  setReplyText(text);
                  setPublished(true);
                  setExpanded(false);
                }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReplyDisplay({
  replyText,
  published,
  publishing,
  onEdit,
  onPublish,
}: {
  replyText: string;
  published: boolean;
  publishing: boolean;
  onEdit: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg bg-muted/50 border border-border/50 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <MessageSquareText className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Reply</span>
        {published && (
          <Badge variant="success" className="text-[10px]">Published</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{replyText}</p>
      {!published && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" onClick={onPublish} disabled={publishing}>
            {publishing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      )}
    </div>
  );
}

function GenerateReplySection({
  review,
  onClose,
  onPublish,
}: {
  review: Review;
  onClose: () => void;
  onPublish: (text: string) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [editText, setEditText] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (data.reply) {
        setGeneratedText(data.reply.generated_text);
        setEditText(data.reply.generated_text);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate reply");
    }
    setGenerating(false);
  }

  async function handlePublish(text: string) {
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", replyText: text }),
      });
      if (!res.ok) throw new Error("Failed to publish reply");
      onPublish(text);
      toast.success("Reply published successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Reply</span>
        </div>
        <button onClick={onClose}>
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {!generatedText && !generating && (
        <div className="space-y-3">
          <Button onClick={handleGenerate} size="sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Generate Reply
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-primary/5 px-2 text-muted-foreground">or write your own</span>
            </div>
          </div>
          <Textarea
            placeholder="Type your reply..."
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
          />
          {editText && (
            <Button size="sm" onClick={() => handlePublish(editText)}>
              <Send className="h-3 w-3 mr-1" />
              Publish Reply
            </Button>
          )}
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Generating reply...
        </div>
      )}

      {generatedText && !generating && (
        <div className="space-y-3">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handlePublish(editText)}>
              <Send className="h-3 w-3 mr-1" />
              Publish
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerate}>
              <Sparkles className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatLastSynced(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function countReviewsThisMonth(reviews: Review[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return reviews.filter(
    (r) => new Date(r.review_date) >= startOfMonth
  ).length;
}

const EMPTY_STATS: BusinessStats = { total_reviews: 0, pending_replies: 0, replied_count: 0, average_rating: 0 };

function mapReviewsFromSupabase(revs: Record<string, unknown>[]): Review[] {
  return revs.map((r) => ({
    ...r,
    reply: Array.isArray(r.reply) && r.reply.length > 0 ? r.reply[0] : null,
  })) as Review[];
}

async function fetchReviewsForBusiness(supabase: ReturnType<typeof createClient>, businessId: string): Promise<Review[]> {
  const { data: revs, error } = await supabase
    .from("reviews")
    .select("*, reply:replies(*)")
    .eq("business_id", businessId)
    .order("review_date", { ascending: false });

  if (error) throw error;
  return mapReviewsFromSupabase(revs || []);
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Something went wrong</p>
            <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const selectedBusinessId = searchParams.get("business");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState<ReviewSortValue>(SORT_NEWEST);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [chipNeedsReply, setChipNeedsReply] = useState(false);
  const [chipNegative, setChipNegative] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<BusinessStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadReviews = useCallback(async (biz: Business) => {
    setReviewsError(null);
    try {
      const supabase = createClient();
      const mappedReviews = await fetchReviewsForBusiness(supabase, biz.id);
      setReviews(mappedReviews);
      setStats(calculateBusinessStats(mappedReviews));
      setLastSyncedAt(biz.updated_at);
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : "Failed to load reviews");
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    setBusinessError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: bizList, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBusinesses(bizList || []);

      if (bizList && bizList.length > 0) {
        const biz = selectedBusinessId
          ? bizList.find((b: Business) => b.id === selectedBusinessId) || bizList[0]
          : bizList[0];
        setBusiness(biz);
        await loadReviews(biz);
      }
    } catch (err) {
      setBusinessError(err instanceof Error ? err.message : "Failed to load businesses");
    }
    setLoading(false);
  }, [loadReviews, selectedBusinessId]);

  async function syncReviews() {
    if (!business) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      if (!res.ok) throw new Error("Sync failed");

      const supabase = createClient();
      const mappedReviews = await fetchReviewsForBusiness(supabase, business.id);
      setReviews(mappedReviews);
      setStats(calculateBusinessStats(mappedReviews));
      setLastSyncedAt(new Date().toISOString());
      toast.success("Reviews synced successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    }
    setSyncing(false);
  }

  async function exportCsv() {
    if (!business) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/reviews/export?businessId=${business.id}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reviews-${business.business_name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
    setExporting(false);
  }

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  useEffect(() => {
    if (!business) return;

    const supabase = createClient();
    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews", filter: `business_id=eq.${business.id}` },
        (payload) => {
          const newReview = { ...payload.new, reply: null } as Review;
          setReviews((prev) => [newReview, ...prev]);
          setStats((prev) => ({
            ...prev,
            total_reviews: prev.total_reviews + 1,
            pending_replies: prev.pending_replies + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setChipNeedsReply(false);
    setChipNegative(false);
  }, [selectedBusinessId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterRating, debouncedSearch, chipNeedsReply, chipNegative, sortBy]);

  const pendingCount = useMemo(() => reviews.filter((r) => r.status === "pending").length, [reviews]);
  const negativeCount = useMemo(() => reviews.filter((r) => r.rating <= NEGATIVE_RATING_MAX).length, [reviews]);

  const filteredReviews = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    const filtered = reviews.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
      if (chipNeedsReply && r.status !== "pending") return false;
      if (chipNegative && r.rating > NEGATIVE_RATING_MAX) return false;
      if (query) {
        const matchesName = r.reviewer_name.toLowerCase().includes(query);
        const matchesText = r.review_text?.toLowerCase().includes(query);
        if (!matchesName && !matchesText) return false;
      }
      return true;
    });
    return sortReviews(filtered, sortBy);
  }, [reviews, filterStatus, filterRating, chipNeedsReply, chipNegative, debouncedSearch, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

  const reviewsThisMonth = countReviewsThisMonth(reviews);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (businessError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your business reviews</p>
        </div>
        <InlineError message={businessError} onRetry={loadBusinesses} />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Get started by connecting your business</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect your first business</h2>
            <p className="text-muted-foreground mb-2 max-w-md mx-auto">
              Link your Google Business Profile to start managing reviews with AI-powered replies.
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Once connected, we&apos;ll automatically sync your reviews and you can reply to them
              individually or let AI handle responses in your configured tone.
            </p>
            <Button onClick={() => window.location.href = "/api/google/connect"}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Google Business
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage reviews for {business.business_name}
          </p>
          {lastSyncedAt && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last synced {formatLastSynced(lastSyncedAt)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {reviews.length > 0 && (
            <Button onClick={exportCsv} disabled={exporting} variant="outline" size="sm">
              <Download className={`h-4 w-4 mr-1 ${exporting ? "animate-pulse" : ""}`} />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          )}
          <Button onClick={syncReviews} disabled={syncing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Reviews"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Businesses" value={businesses.length.toString()} />
        <StatCard icon={MessageSquareText} label="Total Reviews" value={stats.total_reviews.toString()} />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={stats.average_rating > 0 ? stats.average_rating.toFixed(1) : "--"}
        />
        <StatCard
          icon={CalendarDays}
          label="This Month"
          value={reviewsThisMonth.toString()}
          trend={reviewsThisMonth > 0 ? `${reviewsThisMonth} new review${reviewsThisMonth === 1 ? "" : "s"}` : undefined}
        />
      </div>

      {reviewsError ? (
        <InlineError
          message={reviewsError}
          onRetry={() => loadReviews(business)}
        />
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
                <div className="flex gap-3">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="auto_replied">Auto-replied</option>
                    <option value="manually_replied">Replied</option>
                    <option value="skipped">Skipped</option>
                  </Select>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <option value="all">All ratings</option>
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3">3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                  </Select>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as ReviewSortValue)}>
                    {REVIEW_SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or review text... (⌘K)"
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChipNeedsReply((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      chipNeedsReply
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Needs Reply
                    {pendingCount > 0 && (
                      <span className={`inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.25rem] text-[10px] font-bold ${
                        chipNeedsReply ? "bg-primary-foreground/20 text-primary-foreground" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      }`}>
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setChipNegative((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      chipNegative
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Negative
                    {negativeCount > 0 && (
                      <span className={`inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.25rem] text-[10px] font-bold ${
                        chipNegative ? "bg-primary-foreground/20 text-primary-foreground" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      }`}>
                        {negativeCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquareText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews match your filters.</p>
                </CardContent>
              </Card>
            ) : (
              paginatedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>

          {filteredReviews.length > REVIEWS_PER_PAGE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}–{Math.min(startIndex + REVIEWS_PER_PAGE, filteredReviews.length)} of {filteredReviews.length} reviews
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
