"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { calculateBusinessStats } from "@/lib/data";
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
  business,
}: {
  review: Review;
  business: Business;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingReply, setEditingReply] = useState(false);
  const [replyText, setReplyText] = useState(review.reply?.final_text || "");
  const [published, setPublished] = useState(review.reply?.status === "published");
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublishReply() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", replyText }),
      });
      if (!res.ok) throw new Error("Failed to publish reply");
      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
    setPublishing(false);
  }

  async function handleSaveReply() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", replyText }),
      });
      if (!res.ok) throw new Error("Failed to save reply");
      setEditingReply(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
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

            {error && (
              <div className="mt-2 text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}

            {review.reply && !editingReply && (
              <ReplyDisplay
                replyText={replyText || review.reply.final_text || ""}
                published={published}
                publishing={publishing}
                onEdit={() => {
                  setEditingReply(true);
                  setReplyText(review.reply!.final_text || "");
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
                business={business}
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
  business,
  onClose,
  onPublish,
}: {
  review: Review;
  business: Business;
  onClose: () => void;
  onPublish: (text: string) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Failed to generate reply");
    }
    setGenerating(false);
  }

  async function handlePublish(text: string) {
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", replyText: text }),
      });
      if (!res.ok) throw new Error("Failed to publish reply");
      onPublish(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
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

      {error && (
        <div className="mb-3 text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

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

const EMPTY_STATS: BusinessStats = { total_reviews: 0, pending_replies: 0, replied_count: 0, average_rating: 0 };

function mapReviewsFromSupabase(revs: Record<string, unknown>[]): Review[] {
  return revs.map((r) => ({
    ...r,
    reply: Array.isArray(r.reply) && r.reply.length > 0 ? r.reply[0] : null,
  })) as Review[];
}

async function fetchReviewsForBusiness(supabase: ReturnType<typeof createClient>, businessId: string): Promise<Review[]> {
  const { data: revs } = await supabase
    .from("reviews")
    .select("*, reply:replies(*)")
    .eq("business_id", businessId)
    .order("review_date", { ascending: false });

  return mapReviewsFromSupabase(revs || []);
}

export default function DashboardPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<BusinessStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function syncReviews() {
    if (!business) return;
    setSyncing(true);
    setSyncError(null);
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
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    }
    setSyncing(false);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: businesses } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!businesses || businesses.length === 0) { setLoading(false); return; }

        const biz = businesses[0];
        setBusiness(biz);

        const mappedReviews = await fetchReviewsForBusiness(supabase, biz.id);
        setReviews(mappedReviews);
        setStats(calculateBusinessStats(mappedReviews));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
      setLoading(false);
    }
    loadData();
  }, []);

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

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No business connected</h2>
            <p className="text-muted-foreground mb-4">
              Connect your Google Business Profile to start managing reviews with AI.
            </p>
            <Button onClick={() => window.location.href = "/api/google/connect"}>
              Connect Google Business
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage reviews for {business.business_name}
          </p>
        </div>
        <Button onClick={syncReviews} disabled={syncing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Reviews"}
        </Button>
      </div>

      {syncError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {syncError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MessageSquareText} label="Total Reviews" value={stats.total_reviews.toString()} />
        <StatCard icon={AlertCircle} label="Pending Reply" value={stats.pending_replies.toString()} />
        <StatCard
          icon={Check}
          label="Replied"
          value={stats.replied_count.toString()}
          trend={stats.total_reviews > 0 ? `${Math.round((stats.replied_count / stats.total_reviews) * 100)}% reply rate` : undefined}
        />
        <StatCard icon={Clock} label="Avg Rating" value={stats.average_rating.toString()} />
      </div>

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
          filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} business={business} />
          ))
        )}
      </div>
    </div>
  );
}
