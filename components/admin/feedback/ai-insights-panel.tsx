import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, AlertCircle, ThumbsUp, TrendingUp, Calendar } from "lucide-react"
import { format } from "date-fns"
import { FeedbackInsights } from "@/lib/api/feedback"

interface AiInsightsPanelProps {
  insights: FeedbackInsights | null;
  loading: boolean;
  generating: boolean;
  insufficientDataMsg: string | null;
  onGenerate: () => void;
}

export function AiInsightsPanel({ insights, loading, generating, insufficientDataMsg, onGenerate }: AiInsightsPanelProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Synthesis
          </CardTitle>
          <CardDescription>Weekly aggregated insights from valid user feedback</CardDescription>
        </div>
        <Button onClick={onGenerate} disabled={generating}>
          {generating ? "Generating..." : "✨ Generate Weekly Insights"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading || generating ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : insufficientDataMsg ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p>{insufficientDataMsg}</p>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> 
              Last generated: {format(new Date(insights.generatedAt), "MMM dd, yyyy HH:mm")}
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Pillar 1: Critical Friction */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-[var(--chart-5)]">
                  <AlertCircle className="h-4 w-4" /> Critical Friction
                </h4>
                {insights.criticalFriction.map((item, i) => (
                  <Card key={i} className="border-[var(--chart-5)]/20 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.featureKey}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.impact.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">"{item.issue}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pillar 2: Emerging Requests */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-[var(--chart-1)]">
                  <TrendingUp className="h-4 w-4" /> Emerging Requests
                </h4>
                {insights.emergingRequests.map((item, i) => (
                  <Card key={i} className="border-[var(--chart-1)]/20 shadow-sm">
                    <CardContent className="p-3">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground mb-1 inline-block">{item.featureKey}</span>
                      <p className="text-sm font-medium mb-1">"{item.request}"</p>
                      <p className="text-xs text-muted-foreground">↳ {item.userValue}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pillar 3: Core Wins */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-[var(--chart-3)]">
                  <ThumbsUp className="h-4 w-4" /> Core Wins
                </h4>
                {insights.coreWins.map((item, i) => (
                  <Card key={i} className="border-[var(--chart-3)]/20 shadow-sm">
                    <CardContent className="p-3">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground mb-1 inline-block">{item.featureKey}</span>
                      <p className="text-sm font-medium">"{item.praise}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            <p>No insights generated yet. Click the button above to analyze recent feedback.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
