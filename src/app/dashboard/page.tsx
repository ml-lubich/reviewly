"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MessageSquareText,
  Clock,
  Plus,
  RefreshCw,
  Building2,
  Star,
  CalendarDays,
  Download,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { calculateBusinessStats, sortReviews } from "@/lib/data";
import { REVIEWS_PER_PAGE, SEARCH_DEBOUNCE_MS, NEGATIVE_RATING_MAX, SORT_NEWEST } from "@/lib/constants";
import type { ReviewSortValue } from "@/lib/constants";
import type { Business, Review, BusinessStats } from "@/lib/types";
import {
  formatLastSynced,
  countReviewsThisMonth,
  fetchReviewsForBusiness,
  EMPTY_STATS,
} from "@/lib/dashboard-helpers";
import {
  StatCard,
  InlineError,
  FilterBar,
  ReviewList,
  BulkActionToolbar,
  AddReviewForm,
  EmptyBusinessState,
} from "@/components/dashboard";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(paginatedReviews.map((r) => r.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleBulkGenerate() {
    const pendingSelected = filteredReviews.filter(
      (r) => selectedIds.has(r.id) && r.status === "pending" && !r.reply
    );
    if (pendingSelected.length === 0) {
      toast.error("No pending reviews without replies selected");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/reviews/bulk-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: pendingSelected.map((r) => r.id),
          action: "generate",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk generate failed");
      toast.success(`Generated ${data.succeeded} replies${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
      if (business) await loadReviews(business);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk generate failed");
    }
    setBulkLoading(false);
  }

  async function handleBulkPublish() {
    const withDrafts = filteredReviews.filter(
      (r) => selectedIds.has(r.id) && r.reply && r.reply.status !== "published"
    );
    if (withDrafts.length === 0) {
      toast.error("No unpublished replies selected");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/reviews/bulk-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: withDrafts.map((r) => r.id),
          action: "publish",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk publish failed");
      toast.success(`Published ${data.succeeded} replies${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
      if (business) await loadReviews(business);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk publish failed");
    }
    setBulkLoading(false);
  }

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
    setSelectedIds(new Set());
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
    return <EmptyBusinessState onBusinessCreated={loadBusinesses} />;
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
          <Button onClick={() => setShowAddReview(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Review
          </Button>
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

      {showAddReview && business && (
        <AddReviewForm
          businessId={business.id}
          onReviewAdded={async () => {
            if (business) await loadReviews(business);
          }}
          onClose={() => setShowAddReview(false)}
        />
      )}

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
          <FilterBar
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterRating={filterRating}
            onFilterRatingChange={setFilterRating}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchInputRef={searchInputRef}
            chipNeedsReply={chipNeedsReply}
            onChipNeedsReplyToggle={() => setChipNeedsReply((prev) => !prev)}
            chipNegative={chipNegative}
            onChipNegativeToggle={() => setChipNegative((prev) => !prev)}
            pendingCount={pendingCount}
            negativeCount={negativeCount}
          />

          <ReviewList
            filteredReviews={filteredReviews}
            paginatedReviews={paginatedReviews}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAllVisible={selectAllVisible}
            onDeselectAll={deselectAll}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

          <BulkActionToolbar
            selectedCount={selectedIds.size}
            onDeselectAll={deselectAll}
            onBulkGenerate={handleBulkGenerate}
            onBulkPublish={handleBulkPublish}
            bulkLoading={bulkLoading}
          />
        </>
      )}
    </div>
  );
}
