"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { Activity, TrendingUp } from "lucide-react";

interface TimeSeriesItem {
  date: string;
  impressions: number;
  clicks?: number;
  views?: number;
  leads: number;
  applications: number;
}

interface CampaignTimeseriesChartProps {
  data?: TimeSeriesItem[];
  isLoading?: boolean;
}

const chartConfig = {
  impressions: {
    label: "Visitors Landed",
    color: "#6366f1", // Indigo
  },
  clicks: {
    label: "Clicked 'Apply'",
    color: "#0ea5e9", // Sky Blue
  },
  leads: {
    label: "Created Accounts",
    color: "#f59e0b", // Amber
  },
  applications: {
    label: "Submitted Applications",
    color: "#10b981", // Emerald
  },
} satisfies ChartConfig;

export function CampaignTimeseriesChart({
  data,
  isLoading,
}: CampaignTimeseriesChartProps) {
  const [activeSeries, setActiveSeries] = useState<{
    impressions: boolean;
    clicks: boolean;
    leads: boolean;
    applications: boolean;
  }>({
    impressions: true,
    clicks: true,
    leads: true,
    applications: true,
  });

  const toggleSeries = (series: keyof typeof activeSeries) => {
    setActiveSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  if (isLoading) {
    return (
      <Card className="h-full border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Acquisition Velocity & Conversion Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Skeleton className="h-[280px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const seriesData = data && data.length > 0 ? data : [];

  return (
    <Card className="h-full border-border/70 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>Acquisition Velocity & Conversion Trend</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Volume trajectory across funnel checkpoints over time
            </p>
            {seriesData.length === 1 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-muted text-muted-foreground border border-border">
                  Single-day checkpoint: {seriesData[0].impressions} Visitors Landed • {seriesData[0].clicks ?? 0} Clicked 'Apply' • {seriesData[0].leads} Created Accounts • {seriesData[0].applications} Submitted Applications
                </span>
              </div>
            )}
          </div>

          {/* Interactive Metric Filter Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleSeries("impressions")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                activeSeries.impressions
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "bg-muted/40 border-transparent text-muted-foreground opacity-60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Visitors Landed</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSeries("clicks")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                activeSeries.clicks
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 font-semibold"
                  : "bg-muted/40 border-transparent text-muted-foreground opacity-60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Clicked 'Apply'</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSeries("leads")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                activeSeries.leads
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold"
                  : "bg-muted/40 border-transparent text-muted-foreground opacity-60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Created Accounts</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSeries("applications")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                activeSeries.applications
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "bg-muted/40 border-transparent text-muted-foreground opacity-60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Submitted Applications</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {seriesData.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">
              No timeseries telemetry recorded
            </p>
            <p className="text-xs mt-1">
              Adjust your date range or campaign filter to see activity
            </p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
                data={seriesData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="fillImpressions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient
                    id="fillClicks"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient
                    id="fillApplications"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  padding={{ left: 24, right: 24 }}
                  tickFormatter={(val) => {
                    try {
                      return format(parseISO(val), "MMM dd");
                    } catch {
                      return val;
                    }
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{
                    stroke: "rgba(100, 116, 139, 0.2)",
                    strokeWidth: 1,
                  }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => {
                        try {
                          return format(parseISO(label), "EEE, MMM dd, yyyy");
                        } catch {
                          return label;
                        }
                      }}
                    />
                  }
                />
                {activeSeries.impressions && (
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#fillImpressions)"
                    dot={
                      seriesData.length <= 1
                        ? { r: 5, strokeWidth: 2, fill: "#6366f1" }
                        : { r: 2.5, strokeWidth: 1 }
                    }
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                )}
                {activeSeries.clicks && (
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fill="url(#fillClicks)"
                    dot={
                      seriesData.length <= 1
                        ? { r: 5, strokeWidth: 2, fill: "#0ea5e9" }
                        : { r: 2.5, strokeWidth: 1 }
                    }
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                )}
                {activeSeries.leads && (
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#fillLeads)"
                    dot={
                      seriesData.length <= 1
                        ? { r: 5, strokeWidth: 2, fill: "#f59e0b" }
                        : { r: 2.5, strokeWidth: 1 }
                    }
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                )}
                {activeSeries.applications && (
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#fillApplications)"
                    dot={
                      seriesData.length <= 1
                        ? { r: 5, strokeWidth: 2, fill: "#10b981" }
                        : { r: 2.5, strokeWidth: 1 }
                    }
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
