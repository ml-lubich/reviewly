"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquareText,
  Star,
  BarChart3,
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
  change: string;
  positive: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            }`}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function BarChartSimple({
  data,
  max,
}: {
  data: { label: string; value: number; color: string }[];
  max: number;
}) {
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

export default function AnalyticsPage() {
  const ratingDistribution = [
    { label: "5 star", value: 124, color: "bg-emerald-500" },
    { label: "4 star", value: 68, color: "bg-emerald-400" },
    { label: "3 star", value: 29, color: "bg-amber-400" },
    { label: "2 star", value: 15, color: "bg-orange-400" },
    { label: "1 star", value: 11, color: "bg-red-400" },
  ];

  const monthlyReviews = [
    { label: "Oct", value: 32, color: "bg-primary/60" },
    { label: "Nov", value: 38, color: "bg-primary/60" },
    { label: "Dec", value: 29, color: "bg-primary/60" },
    { label: "Jan", value: 41, color: "bg-primary/70" },
    { label: "Feb", value: 44, color: "bg-primary/80" },
    { label: "Mar", value: 47, color: "bg-primary" },
  ];

  const sentimentData = [
    { label: "Positive", percentage: 78, color: "bg-emerald-500" },
    { label: "Neutral", percentage: 12, color: "bg-amber-400" },
    { label: "Negative", percentage: 10, color: "bg-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Review performance metrics and insights
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Star}
          label="Average Rating"
          value="4.6"
          change="+0.2"
          positive
        />
        <StatCard
          icon={MessageSquareText}
          label="Reply Rate"
          value="94%"
          change="+8%"
          positive
        />
        <StatCard
          icon={Clock}
          label="Avg Response Time"
          value="2.4h"
          change="-1.2h"
          positive
        />
        <StatCard
          icon={BarChart3}
          label="Monthly Reviews"
          value="47"
          change="+12%"
          positive
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of all reviews by star rating</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={ratingDistribution} max={124} />
          </CardContent>
        </Card>

        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Reviews</CardTitle>
            <CardDescription>Number of reviews received per month</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={monthlyReviews} max={47} />
          </CardContent>
        </Card>

        {/* Sentiment overview */}
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

        {/* Response time breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Response Performance</CardTitle>
            <CardDescription>How quickly you reply to reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Under 1 hour", value: "34%", bar: 34 },
                { label: "1-3 hours", value: "41%", bar: 41 },
                { label: "3-12 hours", value: "18%", bar: 18 },
                { label: "12-24 hours", value: "5%", bar: 5 },
                { label: "Over 24 hours", value: "2%", bar: 2 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${item.bar}%` }}
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
