"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StarRating } from "@/components/star-rating";
import {
  MessageSquareText,
  Sparkles,
  Send,
  Pencil,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { STATUS_CONFIG } from "@/lib/dashboard-helpers";
import type { Review } from "@/lib/types";

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

export function ReviewCard({
  review,
  selected,
  onToggleSelect,
}: {
  review: Review;
  selected: boolean;
  onToggleSelect: (id: string) => void;
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
    <Card className={`transition-all ${selected ? "ring-1 ring-primary/30 bg-primary/[0.02]" : ""} ${expanded ? "ring-1 ring-primary/20" : "hover:border-border"}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(review.id)}
            />
          </div>
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
