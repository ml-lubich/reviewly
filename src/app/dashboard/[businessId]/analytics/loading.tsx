import { Card, CardContent, CardHeader } from "@/components/ui/card";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`}
    />
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <ShimmerBlock className="h-9 w-9 rounded-lg" />
        </div>
        <ShimmerBlock className="h-7 w-16 mb-1" />
        <ShimmerBlock className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({ barCount }: { barCount: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <ShimmerBlock className="h-5 w-40" />
          <ShimmerBlock className="h-4 w-56" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: barCount }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <ShimmerBlock className="h-4 w-12 shrink-0" />
              <div className="flex-1" style={{ maxWidth: `${80 - i * 12}%` }}>
                <ShimmerBlock className="h-8 w-full rounded-md" />
              </div>
              <ShimmerBlock className="h-4 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <ShimmerBlock className="h-7 w-28" />
        <ShimmerBlock className="h-4 w-64" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton barCount={5} />
        <ChartCardSkeleton barCount={6} />

        {/* Sentiment overview */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <ShimmerBlock className="h-5 w-40" />
              <ShimmerBlock className="h-4 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <ShimmerBlock className="h-4 w-16" />
                    <ShimmerBlock className="h-4 w-8" />
                  </div>
                  <ShimmerBlock className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
