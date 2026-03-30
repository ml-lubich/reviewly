import { Card, CardContent } from "@/components/ui/card";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <ShimmerBlock className="h-7 w-40 mb-2" />
        <ShimmerBlock className="h-4 w-64" />
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

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <ShimmerBlock className="h-5 w-32" />
            <div className="flex gap-3">
              <ShimmerBlock className="h-9 w-32 rounded-md" />
              <ShimmerBlock className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <ShimmerBlock className="hidden sm:block h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShimmerBlock className="h-4 w-24" />
                    <ShimmerBlock className="h-4 w-20" />
                    <ShimmerBlock className="h-5 w-16 rounded-full" />
                  </div>
                  <ShimmerBlock className="h-4 w-full" />
                  <ShimmerBlock className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
