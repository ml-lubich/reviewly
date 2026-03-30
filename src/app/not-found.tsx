import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Large 404 with decorative background */}
      <div className="relative mb-6">
        <span className="text-[10rem] font-bold leading-none text-muted/20 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Check the URL or head back to a familiar place.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button size="lg">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
