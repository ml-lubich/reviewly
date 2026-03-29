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

function ReviewCard({
  review,
  business,
  onGenerateReply,
}: {
  review: Review;
  business: Business;
  onGenerateReply: (review: Review) => void;
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
      await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", replyText }),
      });
      setPublished(true);
    } catch {
      // handle error
    }
    setPublishing(false);
  }

  async function handleSaveReply() {
    setSaving(true);
    try {
      await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", replyText }),
      });
      setEditingReply(false);
    } catch {
      // handle error
    }
    setSaving(false);
  }

  const statusConfig = {
    pending: { label: "Pending", variant: "warning" as const },
    auto_replied: { label: "Auto-replied", variant: "success" as const },
    manually_replied: { label: "Replied", variant: "success" as const },
    skipped: { label: "Skipped", variant: "secondary" as const },
  };

  const status = statusConfig[review.status];

  return (
    <Card
      className={`transition-all ${expanded ? "ring-1 ring-primary/20" : "hover:border-border"}`}
    >
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

            {/* Reply section */}
            {review.reply && !editingReply && (
              <div className="mt-3 rounded-lg bg-muted/50 border border-border/50 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquareText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">Reply</span>
                  {published && (
                    <Badge variant="success" className="text-[10px]">
                      Published
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{replyText || review.reply.final_text}</p>
                {!published && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingReply(true);
                        setReplyText(review.reply!.final_text || "");
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePublishReply}
                      disabled={publishing}
                    >
                      {publishing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                      {publishing ? "Publishing..." : "Publish"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Editing reply */}
            {editingReply && (
              <div className="mt-3">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveReply}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingReply(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Actions for pending reviews */}
            {review.status === "pending" && !review.reply && !expanded && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setExpanded(true);
                    onGenerateReply(review);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate AI Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Write Reply
                </Button>
              </div>
            )}

            {/* AI generation in progress / manual write */}
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

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await res.json();
      if (data.reply) {
        setGeneratedText(data.reply.generated_text);
        setEditText(data.reply.generated_text);
      }
    } catch {
      setGeneratedText(
        "Sorry, we couldn't generate a reply right now. Please try again or write your own."
      );
      setEditText("");
    }
    setGenerating(false);
  }

  async function handlePublish(text: string) {
    try {
      await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", replyText: text }),
      });
      onPublish(text);
    } catch {
      // show error
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

export default function DashboardPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<BusinessStats>({ total_reviews: 0, pending_replies: 0, replied_count: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function syncReviews() {
    if (!business) return;
    setSyncing(true);
    try {
      await fetch("/api/reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      // Reload reviews
      const supabase = createClient();
      const { data: revs } = await supabase
        .from("reviews")
        .select("*, reply:replies(*)")
        .eq("business_id", business.id)
        .order("review_date", { ascending: false });

      const mappedReviews = (revs || []).map((r: Record<string, unknown>) => ({
        ...r,
        reply: Array.isArray(r.reply) && r.reply.length > 0 ? r.reply[0] : null,
      })) as Review[];
      setReviews(mappedReviews);

      const total = mappedReviews.length;
      const pending = mappedReviews.filter((r) => r.status === "pending").length;
      const replied = mappedReviews.filter(
        (r) => r.status === "auto_replied" || r.status === "manually_replied"
      ).length;
      const avg = total > 0
        ? Math.round((mappedReviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
        : 0;
      setStats({ total_reviews: total, pending_replies: pending, replied_count: replied, average_rating: avg });
    } catch {
      // handle error
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

        const { data: revs } = await supabase
          .from("reviews")
          .select("*, reply:replies(*)")
          .eq("business_id", biz.id)
          .order("review_date", { ascending: false });

        const mappedReviews = (revs || []).map((r: Record<string, unknown>) => ({
          ...r,
          reply: Array.isArray(r.reply) && r.reply.length > 0 ? r.reply[0] : null,
        })) as Review[];

        setReviews(mappedReviews);

        const total = mappedReviews.length;
        const pending = mappedReviews.filter((r) => r.status === "pending").length;
        const replied = mappedReviews.filter(
          (r) => r.status === "auto_replied" || r.status === "manually_replied"
        ).length;
        const avg = total > 0
          ? Math.round((mappedReviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
          : 0;

        setStats({ total_reviews: total, pending_replies: pending, replied_count: replied, average_rating: avg });
      } catch {
        // Supabase not configured
      }
      setLoading(false);
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription for new reviews
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquareText}
          label="Total Reviews"
          value={stats.total_reviews.toString()}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Reply"
          value={stats.pending_replies.toString()}
        />
        <StatCard
          icon={Check}
          label="Replied"
          value={stats.replied_count.toString()}
          trend={stats.total_reviews > 0 ? `${Math.round((stats.replied_count / stats.total_reviews) * 100)}% reply rate` : undefined}
        />
        <StatCard
          icon={Clock}
          label="Avg Rating"
          value={stats.average_rating.toString()}
        />
      </div>

      {/* Filters */}
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

      {/* Review list */}
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
            <ReviewCard
              key={review.id}
              review={review}
              business={business!}
              onGenerateReply={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
