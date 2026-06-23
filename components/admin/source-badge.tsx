"use client"

import { cn } from "@/lib/utils"

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  // Paid ad sources (auto-detected from click IDs)
  google_ads: { label: "YouTube Ads", color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20", icon: "▶" },
  meta: { label: "Meta Ads", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: "f" },
  // Organic / custom link sources (from utm_source)
  youtube: { label: "YouTube", color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20", icon: "▶" },
  instagram: { label: "Instagram", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20", icon: "📷" },
  facebook: { label: "Facebook", color: "bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-600/20", icon: "f" },
  x: { label: "X", color: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/20", icon: "𝕏" },
  twitter: { label: "X", color: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/20", icon: "𝕏" },
  reddit: { label: "Reddit", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20", icon: "◉" },
  organic: { label: "Organic", color: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20", icon: "🌱" },
  direct: { label: "Direct", color: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20", icon: "→" },
}

interface SourceBadgeProps {
  source?: string
  className?: string
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const normalizedSource = (source || "direct").toLowerCase()
  const config = SOURCE_CONFIG[normalizedSource] || SOURCE_CONFIG.direct

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.color,
        className
      )}
    >
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  )
}
