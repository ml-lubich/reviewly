"use client";

import { useState } from "react";
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
} from "lucide-react";
import { mockBusinesses, getBusinessReviews, type Review } from "@/lib/mock-data";

const business = mockBusinesses[0];
const allReviews = getBusinessReviews(business.id);

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
  onGenerateReply,
}: {
  review: Review;
  onGenerateReply: (review: Review) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingReply, setEditingReply] = useState(false);
  const [replyText, setReplyText] = useState(review.reply?.finalText || "");
  const [published, setPublished] = useState(review.reply?.status === "published");

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
            {review.reviewerName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium">{review.reviewerName}</span>
              <StarRating rating={review.rating} />
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(review.reviewDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {review.reviewText}
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
                <p className="text-sm text-muted-foreground">{replyText || review.reply.finalText}</p>
                {!published && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingReply(true);
                        setReplyText(review.reply!.finalText);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPublished(true)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Publish
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
                    onClick={() => setEditingReply(false)}
                  >
                    <Check className="h-3 w-3 mr-1" />
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
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review.reviewText,
          reviewerName: review.reviewerName,
          rating: review.rating,
          toneDescription: business.toneDescription,
          exampleResponses: business.exampleResponses,
        }),
      });
      const data = await res.json();
      setGeneratedText(data.reply);
      setEditText(data.reply);
    } catch {
      setGeneratedText(
        "Sorry, we couldn't generate a reply right now. Please try again or write your own."
      );
      setEditText("");
    }
    setGenerating(false);
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
            <Button size="sm" onClick={() => onPublish(editText)}>
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
            <Button size="sm" onClick={() => onPublish(editText)}>
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

  const filteredReviews = allReviews.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
    return true;
  });

  const pending = allReviews.filter((r) => r.status === "pending").length;
  const replied = allReviews.filter(
    (r) => r.status === "auto_replied" || r.status === "manually_replied"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage reviews for {business.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquareText}
          label="Total Reviews"
          value={business.totalReviews.toString()}
          trend="+12 this month"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Reply"
          value={pending.toString()}
        />
        <StatCard
          icon={Check}
          label="Replied"
          value={replied.toString()}
          trend="67% reply rate"
        />
        <StatCard
          icon={Clock}
          label="Avg Response Time"
          value="2.4h"
          trend="1.2h faster than avg"
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
              onGenerateReply={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
