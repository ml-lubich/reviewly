"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquareText, ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS_PER_PAGE } from "@/lib/constants";
import { ReviewCard } from "./review-card";
import type { Review } from "@/lib/types";

export function ReviewList({
  filteredReviews,
  paginatedReviews,
  selectedIds,
  onToggleSelect,
  onSelectAllVisible,
  onDeselectAll,
  currentPage,
  totalPages,
  onPageChange,
}: {
  filteredReviews: Review[];
  paginatedReviews: Review[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAllVisible: () => void;
  onDeselectAll: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;

  return (
    <>
      {paginatedReviews.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <Checkbox
            checked={paginatedReviews.length > 0 && paginatedReviews.every((r) => selectedIds.has(r.id))}
            indeterminate={paginatedReviews.some((r) => selectedIds.has(r.id)) && !paginatedReviews.every((r) => selectedIds.has(r.id))}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAllVisible();
              } else {
                onDeselectAll();
              }
            }}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : "Select all"}
          </span>
        </div>
      )}

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
            <ReviewCard
              key={review.id}
              review={review}
              selected={selectedIds.has(review.id)}
              onToggleSelect={onToggleSelect}
            />
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
              onClick={() => onPageChange(currentPage - 1)}
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
