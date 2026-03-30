import { Card, CardContent, CardHeader } from "@/components/ui/card";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`}
    />
  );
}

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <ShimmerBlock className="h-7 w-32" />
        <ShimmerBlock className="h-4 w-64" />
      </div>

      {/* Auto-reply toggle card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShimmerBlock className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <ShimmerBlock className="h-5 w-32" />
                <ShimmerBlock className="h-4 w-72" />
              </div>
            </div>
            <ShimmerBlock className="h-6 w-11 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Tone configuration card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <ShimmerBlock className="h-5 w-40" />
              <ShimmerBlock className="h-4 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <ShimmerBlock className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <ShimmerBlock key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <ShimmerBlock className="h-4 w-28" />
            <ShimmerBlock className="h-24 w-full rounded-md" />
            <ShimmerBlock className="h-3 w-80" />
          </div>
        </CardContent>
      </Card>

      {/* Example responses card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <ShimmerBlock className="h-5 w-40" />
              <ShimmerBlock className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 border border-border/50 p-3">
              <ShimmerBlock className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-3/4" />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <ShimmerBlock className="h-10 flex-1 rounded-md" />
            <ShimmerBlock className="h-10 w-10 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Negative review strategy card */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <ShimmerBlock className="h-5 w-48" />
            <ShimmerBlock className="h-4 w-52" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShimmerBlock className="h-4 w-4 rounded-full" />
                <ShimmerBlock className="h-4 w-44" />
              </div>
              <ShimmerBlock className="h-3 w-72 ml-6" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save button */}
      <ShimmerBlock className="h-10 w-32 rounded-md" />
    </div>
  );
}
