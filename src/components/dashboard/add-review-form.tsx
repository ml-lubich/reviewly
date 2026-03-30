"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2 } from "lucide-react";

export function AddReviewForm({
  businessId,
  onReviewAdded,
  onClose,
}: {
  businessId: string;
  onReviewAdded: () => Promise<void>;
  onClose: () => void;
}) {
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewerName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          reviewerName: reviewerName.trim(),
          rating,
          reviewText: reviewText.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add review");
      }
      toast.success("Review added");
      await onReviewAdded();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add review");
    }
    setSubmitting(false);
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <span className="font-medium">Add Review</span>
          </div>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Reviewer Name</label>
              <Input
                placeholder="John Doe"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <Select value={String(rating)} onValueChange={(v) => setRating(Number(v))}>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Review Text</label>
            <Textarea
              placeholder="Great service! Very professional..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !reviewerName.trim()}>
              {submitting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
              {submitting ? "Adding..." : "Add Review"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
