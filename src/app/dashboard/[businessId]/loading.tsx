import { Card, CardContent } from "@/components/ui/card";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`}
    />
  );
}

export default function BusinessDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-center gap-3">
        <ShimmerBlock className="h-4 w-4 rounded" />
        <ShimmerBlock className="h-4 w-20" />
      </div>

      {/* Business info header */}
      <div className="flex items-center gap-4">
        <ShimmerBlock className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <ShimmerBlock className="h-6 w-48" />
          <ShimmerBlock className="h-4 w-32" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <ShimmerBlock className="h-4 w-24" />
                  <ShimmerBlock className="h-7 w-16" />
                </div>
                <ShimmerBlock className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content area */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <ShimmerBlock className="h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border border-border/50 p-4">
                <ShimmerBlock className="hidden sm:block h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShimmerBlock className="h-4 w-28" />
                    <ShimmerBlock className="h-4 w-16" />
                  </div>
                  <ShimmerBlock className="h-4 w-full" />
                  <ShimmerBlock className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
