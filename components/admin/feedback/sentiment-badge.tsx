import { Badge } from "@/components/ui/badge"

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === "Positive") return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{sentiment}</Badge>
  if (sentiment === "Neutral") return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">{sentiment}</Badge>
  if (sentiment === "Negative") return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">{sentiment}</Badge>
  return <Badge className="bg-muted text-muted-foreground">{sentiment}</Badge>
}
