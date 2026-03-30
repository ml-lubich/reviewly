"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Store } from "lucide-react";

export function EmptyBusinessState({ onBusinessCreated }: { onBusinessCreated: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          googlePlaceId: googlePlaceId.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create business");
      }
      toast.success("Business created");
      await onBusinessCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create business");
    }
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Get started by adding your business</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Add your first business</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a business to start managing reviews with AI-powered replies.
          </p>

          {showForm ? (
            <form onSubmit={handleCreate} className="mx-auto max-w-sm space-y-3">
              <Input
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
                required
              />
              <Input
                placeholder="Google Place ID (optional)"
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
              />
              <div className="flex gap-2 justify-center">
                <Button type="submit" disabled={creating || !businessName.trim()}>
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {creating ? "Creating..." : "Create Business"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
