"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon, Layers } from "lucide-react";

export interface PlatformBreakdownItem {
  platform: string;
  displayName: string;
  campaignsCount: number;
  impressions: number;
  leads: number;
  applications: number;
  conversionRate: number;
}

interface CampaignChannelDonutProps {
  data?: PlatformBreakdownItem[];
  isLoading?: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: "#0a66c2",
  instagram: "#e1306c",
  facebook: "#1877f2",
  naukri: "#0078d4",
  indeed: "#2164f3",
  google_ads: "#ea4335",
  whatsapp: "#25d366",
  twitter: "#1da1f2",
  x: "#111827",
  direct: "#6366f1",
  referral: "#8b5cf6",
};

const DEFAULT_COLOR_PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

export function CampaignChannelDonut({
  data,
  isLoading,
}: CampaignChannelDonutProps) {
  if (isLoading) {
    return (
      <Card className="h-full border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Platform Traffic & Attribution Share
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Skeleton className="h-[280px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const items = data && data.length > 0 ? data : [];
  const totalPlatformImpressions = items.reduce(
    (acc, it) => acc + (it.impressions || 0),
    0,
  );

  const chartData = items.map((item, idx) => ({
    name:
      item.displayName ||
      item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.impressions,
    applications: item.applications,
    leads: item.leads,
    cvr: `${item.conversionRate}%`,
    color:
      CHANNEL_COLORS[item.platform.toLowerCase()] ||
      DEFAULT_COLOR_PALETTE[idx % DEFAULT_COLOR_PALETTE.length],
  }));

  const chartConfig: ChartConfig = items.reduce((acc, item, idx) => {
    acc[item.platform] = {
      label:
        item.displayName ||
        item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
      color:
        CHANNEL_COLORS[item.platform.toLowerCase()] ||
        DEFAULT_COLOR_PALETTE[idx % DEFAULT_COLOR_PALETTE.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="h-full border-border/70 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              <span>Platform Traffic & Attribution Share</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Candidate inflow volume and conversion quality by channel
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
            {items.length} Channels
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {items.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Layers className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No channel attribution data</p>
            <p className="text-xs mt-1">
              Campaigns have not received traffic in this date range
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Donut Chart */}
            <div className="md:col-span-5 h-[220px] flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="name"
                          labelFormatter={(val) => `${val}`}
                        />
                      }
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Metrics List */}
            <div className="md:col-span-7 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const color =
                  CHANNEL_COLORS[item.platform.toLowerCase()] ||
                  DEFAULT_COLOR_PALETTE[idx % DEFAULT_COLOR_PALETTE.length];
                const share =
                  totalPlatformImpressions > 0
                    ? (
                        (item.impressions / totalPlatformImpressions) *
                        100
                      ).toFixed(1)
                    : "0.0";
                return (
                  <div
                    key={item.platform}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium capitalize truncate">
                        {item.displayName || item.platform}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <div className="font-semibold text-foreground font-mono">
                          {item.impressions.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {share}% share
                        </div>
                      </div>

                      <div className="w-16">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          {item.applications.toLocaleString()} apps
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.conversionRate}% CVR
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
