"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquareText,
  Star,
  BarChart3,
  Loader2,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              }`}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function BarChartSimple({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-12 shrink-0">{d.label}</span>
          <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
            <div
              className={`h-full rounded-md transition-all duration-700 ${d.color}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

interface AnalyticsData {
  avgRating: number;
  replyRate: number;
  totalReviews: number;
  ratingDistribution: { label: string; value: number }[];
  monthlyReviews: { label: string; value: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
}

export default function AnalyticsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const supabase = createClient();
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating, status, review_date")
          .eq("business_id", businessId);

        if (!reviews || reviews.length === 0) {
          setData(null);
          setLoading(false);
          return;
        }

        const total = reviews.length;
        const avgRating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10;
        const replied = reviews.filter(
          (r) => r.status === "auto_replied" || r.status === "manually_replied"
        ).length;
        const replyRate = Math.round((replied / total) * 100);

        const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
          label: `${star} star`,
          value: reviews.filter((r) => r.rating === star).length,
        }));

        const now = new Date();
        const monthlyReviews = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const month = d.toLocaleString("en", { month: "short" });
          const count = reviews.filter((r) => {
            const rd = new Date(r.review_date);
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
          }).length;
          return { label: month, value: count };
        });

        const positive = reviews.filter((r) => r.rating >= 4).length;
        const neutral = reviews.filter((r) => r.rating === 3).length;
        const negative = reviews.filter((r) => r.rating <= 2).length;

        setData({
          avgRating,
          replyRate,
          totalReviews: total,
          ratingDistribution,
          monthlyReviews,
          sentiment: {
            positive: Math.round((positive / total) * 100),
            neutral: Math.round((neutral / total) * 100),
            negative: Math.round((negative / total) * 100),
          },
        });
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError("Failed to load analytics data");
      }
      setLoading(false);
    }
    loadAnalytics();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-destructive mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">No review data available yet.</p>
        </div>
      </div>
    );
  }

  const ratingColors = ["bg-emerald-500", "bg-emerald-400", "bg-amber-400", "bg-orange-400", "bg-red-400"];
  const sentimentData = [
    { label: "Positive", percentage: data.sentiment.positive, color: "bg-emerald-500" },
    { label: "Neutral", percentage: data.sentiment.neutral, color: "bg-amber-400" },
    { label: "Negative", percentage: data.sentiment.negative, color: "bg-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Review performance metrics and insights
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Star} label="Average Rating" value={data.avgRating.toString()} />
        <StatCard icon={MessageSquareText} label="Reply Rate" value={`${data.replyRate}%`} />
        <StatCard icon={Clock} label="Total Reviews" value={data.totalReviews.toString()} />
        <StatCard icon={BarChart3} label="Monthly Reviews" value={data.monthlyReviews[5]?.value.toString() || "0"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of all reviews by star rating</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartSimple
              data={data.ratingDistribution.map((d, i) => ({
                ...d,
                color: ratingColors[i],
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Reviews</CardTitle>
            <CardDescription>Number of reviews received per month</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartSimple
              data={data.monthlyReviews.map((d) => ({
                ...d,
                color: "bg-primary",
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Overview</CardTitle>
            <CardDescription>Overall sentiment of your reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentimentData.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-sm text-muted-foreground">{s.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${s.color}`}
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
