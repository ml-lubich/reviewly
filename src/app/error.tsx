"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-2 max-w-md">
        We hit an unexpected error. This has been logged and our team will look
        into it.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 mb-6 font-mono">
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-6" />}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset} variant="default" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
      <div className="mt-8 rounded-lg border border-border/50 bg-muted/30 p-4 max-w-md">
        <div className="flex items-start gap-3 text-left">
          <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">Still having trouble?</p>
            <p className="text-xs text-muted-foreground">
              Try clearing your browser cache, or contact support if the problem
              persists. You can also check our{" "}
              <a href="#" className="underline hover:text-foreground">
                status page
              </a>{" "}
              for known issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
