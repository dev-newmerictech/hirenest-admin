// Reusable statistics card component following Single Responsibility Principle

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/20">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 font-medium">{description}</p>}
      </CardContent>
    </Card>
  )
}
