import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/admin/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare, TrendingUp, Activity } from "lucide-react"
import { FeedbackMetrics } from "@/lib/api/feedback"

interface KpiRowProps {
  metrics: FeedbackMetrics | null;
  loading: boolean;
}

export function KpiRow({ metrics, loading }: KpiRowProps) {
  if (loading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Global CSAT"
        value={`${metrics.globalCsat.toFixed(1)} / 5.0`}
        icon={Star}
        description="Average platform rating"
      />
      <StatCard
        title="30-Day Velocity"
        value={metrics.thirtyDayVolume}
        icon={Activity}
        description="Total feedback received"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[16px] font-medium text-muted-foreground">Sentiment Split</CardTitle>
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex h-2 w-full overflow-hidden rounded-full mt-2">
            <div className="bg-(--chart-3)" style={{ width: `${metrics.sentimentDistribution.Positive}%` }} />
            <div className="bg-(--chart-4)" style={{ width: `${metrics.sentimentDistribution.Neutral}%` }} />
            <div className="bg-(--chart-5)" style={{ width: `${metrics.sentimentDistribution.Negative}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-(--chart-3)"/>{metrics.sentimentDistribution.Positive.toFixed(0)}% Pos</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-(--chart-4)"/>{metrics.sentimentDistribution.Neutral.toFixed(0)}% Neu</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-(--chart-5)"/>{metrics.sentimentDistribution.Negative.toFixed(0)}% Neg</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[16px] font-medium text-muted-foreground">Delta Leaderboard</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-1 mt-1">
          <div className="flex justify-between text-sm">
            <span className="truncate pr-2">{metrics.bestFeature?.feature || 'N/A'}</span>
            <span className="text-green-500 font-medium">{metrics.bestFeature?.score.toFixed(1) || '0.0'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="truncate pr-2 text-muted-foreground">{metrics.worstFeature?.feature || 'N/A'}</span>
            <span className="text-red-500 font-medium">{metrics.worstFeature?.score.toFixed(1) || '0.0'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
