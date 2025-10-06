// Reusable status badge component

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: boolean | string
  activeLabel?: string
  inactiveLabel?: string
}

export function StatusBadge({ status, activeLabel = "Active", inactiveLabel = "Inactive" }: StatusBadgeProps) {
  const isActive = typeof status === "boolean" ? status : status === "active"

  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(
        isActive ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-muted text-muted-foreground",
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
