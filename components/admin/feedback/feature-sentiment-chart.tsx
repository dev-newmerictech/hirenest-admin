import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { FeedbackMetrics } from "@/lib/api/feedback"

interface FeatureSentimentChartProps {
  metrics: FeedbackMetrics | null;
  loading: boolean;
}

export function FeatureSentimentChart({ metrics, loading }: FeatureSentimentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature-Sentiment Stack</CardTitle>
        <CardDescription>Volume distribution per feature</CardDescription>
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
            <BarChart 
              data={metrics.featureSentimentBreakdown} 
              layout="vertical"
              margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="feature" 
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={100}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="Positive" stackId="a" fill="var(--chart-3)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Neutral" stackId="a" fill="var(--chart-4)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Negative" stackId="a" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
