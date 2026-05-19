import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { FeedbackMetrics } from "@/lib/api/feedback"

interface TrendsChartProps {
  metrics: FeedbackMetrics | null;
  loading: boolean;
}

export function TrendsChart({ metrics, loading }: TrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Trends (30 Days)</CardTitle>
        <CardDescription>Daily volume breakdown by sentiment</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !metrics ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer
            config={{
              Positive: { label: "Positive", color: "var(--chart-3)" },
              Neutral: { label: "Neutral", color: "var(--chart-4)" },
              Negative: { label: "Negative", color: "var(--chart-5)" },
            }}
            className="h-[300px] w-full"
          >
            <AreaChart data={metrics.dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => {
                  try { return format(parseISO(val), 'MMM dd') } catch { return val }
                }} 
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="Positive" stackId="1" stroke="var(--chart-3)" fill="url(#fillPositive)" />
              <Area type="monotone" dataKey="Neutral" stackId="1" stroke="var(--chart-4)" fill="url(#fillNeutral)" />
              <Area type="monotone" dataKey="Negative" stackId="1" stroke="var(--chart-5)" fill="url(#fillNegative)" />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
