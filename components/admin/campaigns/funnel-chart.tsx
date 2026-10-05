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
  leads: number;
  applications: number;
  dailyTrends?: Array<{
    date: string;
    impressions: number;
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
    label: "Impressions",
    color: "#818cf8",
  },
  leads: {
    label: "Leads",
    color: "#4241FF",
  },
  applications: {
    label: "Applications",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function FunnelChart({
  impressions,
  leads,
  applications,
  dailyTrends,
  title = "Campaign Funnel Performance",
}: FunnelChartProps) {
  const funnelData = [
    {
      stage: "Impressions",
      count: impressions,
      conversion: "100%",
      fill: "#818cf8",
    },
    {
      stage: "Fast-Track Leads",
      count: leads,
      conversion:
        impressions > 0 ? `${((leads / impressions) * 100).toFixed(1)}%` : "0%",
      fill: "#4241FF",
    },
    {
      stage: "Applications",
      count: applications,
      conversion:
        leads > 0 ? `${((applications / leads) * 100).toFixed(1)}%` : "0%",
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
          <div className="h-[260px] w-full">
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
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(66, 65, 255, 0.05)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border mt-3 text-center">
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                Impressions
              </span>
              <span className="text-lg font-bold text-foreground">
                {impressions.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                Lead Conv.
              </span>
              <span className="text-lg font-bold text-primary">
                {impressions > 0
                  ? `${((leads / impressions) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[11px] text-muted-foreground block">
                App Conv.
              </span>
              <span className="text-lg font-bold text-green-600">
                {leads > 0
                  ? `${((applications / leads) * 100).toFixed(1)}%`
                  : "0%"}
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
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4241FF" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4241FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#818cf8"
                    fillOpacity={1}
                    fill="url(#colorImpressions)"
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#4241FF"
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
