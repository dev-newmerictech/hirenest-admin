"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface FunnelChartProps {
  impressions: number;
  applyClicks?: number;
  leads: number;
  applications: number;
  dailyTrends?: Array<{
    date: string;
    impressions: number;
    clicks?: number;
    leads: number;
    applications: number;
  }>;
  title?: string;
}

const funnelChartConfig = {
  count: {
    label: "Candidates",
    color: "hsl(var(--primary))",
  },
  impressions: {
    label: "Visitors Landed",
    color: "#6366f1",
  },
  clicks: {
    label: "Clicked 'Apply'",
    color: "#0ea5e9",
  },
  leads: {
    label: "Created Accounts",
    color: "#f59e0b",
  },
  applications: {
    label: "Submitted Applications",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function FunnelChart({
  impressions,
  applyClicks,
  leads,
  applications,
  dailyTrends,
  title = "Campaign Funnel Performance",
}: FunnelChartProps) {
  const safeApps = applications;
  const safeLeads = Math.max(leads, safeApps);
  const safeClicks = Math.max(applyClicks ?? safeLeads, safeLeads);
  const safeImpressions = Math.max(impressions, safeClicks);

  const funnelData = [
    {
      stage: "1. Visitors Landed",
      count: safeImpressions,
      conversion: "100%",
      fill: "#6366f1",
    },
    {
      stage: "2. Clicked 'Apply'",
      count: safeClicks,
      conversion:
        safeImpressions > 0 ? `${((safeClicks / safeImpressions) * 100).toFixed(1)}%` : "0%",
      fill: "#0ea5e9",
    },
    {
      stage: "3. Created Accounts",
      count: safeLeads,
      conversion:
        safeImpressions > 0 ? `${((safeLeads / safeImpressions) * 100).toFixed(1)}%` : "0%",
      fill: "#f59e0b",
    },
    {
      stage: "4. Submitted Applications",
      count: safeApps,
      conversion:
        safeLeads > 0 ? `${((safeApps / safeLeads) * 100).toFixed(1)}%` : "0%",
      fill: "#10b981",
    },
  ];

  const hasTimeline = dailyTrends && dailyTrends.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage conversion rates from gate arrival to final application
          </p>
        </div>
      </div>

      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="funnel" className="text-xs">
            Funnel Stages
          </TabsTrigger>
          {hasTimeline && (
            <TabsTrigger value="timeline" className="text-xs">
              Daily Trends
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="funnel">
          <div className="h-[280px] w-full">
            <ChartContainer
              config={funnelChartConfig}
              className="h-full w-full"
            >
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  opacity={0.3}
                />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-border mt-3 text-center">
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                Visitors Landed
              </span>
              <span className="text-base font-bold text-foreground">
                {impressions.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                Clicked 'Apply'
              </span>
              <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                {safeClicks.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                Created Accounts
              </span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                {safeLeads.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                Submitted Applications
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {safeApps.toLocaleString()}
              </span>
            </div>
          </div>
        </TabsContent>

        {hasTimeline && (
          <TabsContent value="timeline">
            <div className="h-[260px] w-full">
              <ChartContainer
                config={funnelChartConfig}
                className="h-full w-full"
              >
                <AreaChart
                  data={dailyTrends}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorImpressions"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorClicks"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorImpressions)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#10b981"
                    fill="#10b981"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
