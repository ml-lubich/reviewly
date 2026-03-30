"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { REVIEW_SORT_OPTIONS } from "@/lib/constants";
import type { ReviewSortValue } from "@/lib/constants";

export function FilterBar({
  filterStatus,
  onFilterStatusChange,
  filterRating,
  onFilterRatingChange,
  sortBy,
  onSortByChange,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  chipNeedsReply,
  onChipNeedsReplyToggle,
  chipNegative,
  onChipNegativeToggle,
  pendingCount,
  negativeCount,
}: {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterRating: string;
  onFilterRatingChange: (value: string) => void;
  sortBy: ReviewSortValue;
  onSortByChange: (value: ReviewSortValue) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  chipNeedsReply: boolean;
  onChipNeedsReplyToggle: () => void;
  chipNegative: boolean;
  onChipNegativeToggle: () => void;
  pendingCount: number;
  negativeCount: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Recent Reviews</CardTitle>
          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={onFilterStatusChange}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="auto_replied">Auto-replied</option>
              <option value="manually_replied">Replied</option>
              <option value="skipped">Skipped</option>
            </Select>
            <Select value={filterRating} onValueChange={onFilterRatingChange}>
              <option value="all">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </Select>
            <Select value={sortBy} onValueChange={(v) => onSortByChange(v as ReviewSortValue)}>
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
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search by name or review text... (⌘K)"
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onChipNeedsReplyToggle}
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
              onClick={onChipNegativeToggle}
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
  );
}
