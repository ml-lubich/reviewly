"use client";

import { Button } from "@/components/ui/button";
import { CheckSquare, X, Sparkles, Send, Loader2 } from "lucide-react";

export function BulkActionToolbar({
  selectedCount,
  onDeselectAll,
  onBulkGenerate,
  onBulkPublish,
  bulkLoading,
}: {
  selectedCount: number;
  onDeselectAll: () => void;
  onBulkGenerate: () => void;
  onBulkPublish: () => void;
  bulkLoading: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-50">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedCount} review{selectedCount === 1 ? "" : "s"} selected
            </span>
            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onBulkGenerate} disabled={bulkLoading}>
              {bulkLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
              Generate Replies
            </Button>
            <Button size="sm" onClick={onBulkPublish} disabled={bulkLoading}>
              {bulkLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
              Publish Replies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
