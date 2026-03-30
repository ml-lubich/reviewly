"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import type { Business } from "@/lib/types";
import {
  Save,
  Plus,
  X,
  Sparkles,
  MessageSquareText,
  Zap,
  Volume2,
  Loader2,
} from "lucide-react";

const tonePresets = [
  { label: "Friendly", description: "Warm, casual, and approachable" },
  { label: "Professional", description: "Polished, courteous, and formal" },
  { label: "Casual", description: "Relaxed, fun, and conversational" },
  { label: "Empathetic", description: "Understanding, caring, and supportive" },
];

export default function SettingsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [toneDescription, setToneDescription] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [examples, setExamples] = useState<string[]>([]);
  const [newExample, setNewExample] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [negativeStrategy, setNegativeStrategy] = useState("apologize_resolve");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusiness() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single();

        if (data) {
          setBusiness(data);
          setToneDescription(data.tone_description || "");
          setAutoReply(data.auto_reply_enabled);
          setExamples(data.example_responses || []);
          setNegativeStrategy(data.negative_review_strategy || "apologize_resolve");
        }
      } catch (err) {
        console.error("Failed to load business settings:", err);
        setLoadError("Failed to load settings");
      }
      setLoading(false);
    }
    loadBusiness();
  }, [businessId]);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("businesses")
        .update({
          tone_description: toneDescription,
          auto_reply_enabled: autoReply,
          example_responses: examples,
          negative_review_strategy: negativeStrategy,
        })
        .eq("id", businessId);

      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings. Please try again.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return <p className="text-destructive py-8">{loadError}</p>;
  }

  if (!business) {
    return <p className="text-muted-foreground py-8">Business not found.</p>;
  }

  function addExample() {
    if (newExample.trim()) {
      setExamples([...examples, newExample.trim()]);
      setNewExample("");
    }
  }

  function removeExample(index: number) {
    setExamples(examples.filter((_, i) => i !== index));
  }

  function selectPreset(label: string, description: string) {
    setSelectedPreset(label);
    setToneDescription(description + ". " + toneDescription);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure how Reviewly responds to reviews for {business.business_name}
        </p>
      </div>

      {/* Auto-reply toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Auto-Reply Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically publish AI-generated replies without manual approval
                </p>
              </div>
            </div>
            <Switch checked={autoReply} onCheckedChange={setAutoReply} />
          </div>
          {autoReply && (
            <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Auto-reply is enabled. AI-generated replies will be published automatically to new reviews.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tone configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Brand Voice & Tone</CardTitle>
              <CardDescription>
                Describe how you want your replies to sound
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Quick presets</label>
            <div className="flex flex-wrap gap-2">
              {tonePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => selectPreset(preset.label, preset.description)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selectedPreset === preset.label
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tone description
            </label>
            <Textarea
              value={toneDescription}
              onChange={(e) => setToneDescription(e.target.value)}
              placeholder="Describe your brand's voice and tone for review responses..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Be specific about how you want responses to sound. Include adjectives, style notes, and any phrases to include or avoid.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Example responses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Example Responses</CardTitle>
              <CardDescription>
                Provide examples of ideal replies so the AI can learn your style
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {examples.map((example, i) => (
            <div
              key={i}
              className="group flex items-start gap-3 rounded-lg bg-muted/50 border border-border/50 p-3"
            >
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="flex-1 text-sm text-muted-foreground">{example}</p>
              <button
                onClick={() => removeExample(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Add an example response..."
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExample()}
            />
            <Button variant="outline" onClick={addExample} disabled={!newExample.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Negative review strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Negative Review Strategy</CardTitle>
          <CardDescription>
            How should AI handle 1-3 star reviews?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "Apologize & offer resolution",
              value: "apologize_resolve",
              desc: "Express sincere apology and invite the reviewer to reach out directly",
            },
            {
              label: "Acknowledge & redirect",
              value: "acknowledge_redirect",
              desc: "Thank for feedback, acknowledge concern, redirect to private channel",
            },
            {
              label: "Flag for manual review",
              value: "flag_manual",
              desc: "Don't auto-reply to negative reviews; flag them for your attention",
            },
          ].map((strategy) => {
            const isActive = negativeStrategy === strategy.value;
            return (
              <div
                key={strategy.value}
                onClick={() => setNegativeStrategy(strategy.value)}
                className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      isActive ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{strategy.label}</span>
                  {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 ml-6">{strategy.desc}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
