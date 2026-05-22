"use client"

import { Clock } from "lucide-react"

type PolymarketBadgeProps = {
  lastUpdated: Date | null
  isRefreshing?: boolean
}

const formatUpdated = (value: Date | null) => {
  if (!value) return "--"
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function PolymarketBadge({ lastUpdated, isRefreshing }: PolymarketBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-up opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
        </span>
        Live from Polymarket
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        Last updated {formatUpdated(lastUpdated)}
        {isRefreshing && <span className="text-primary">• syncing</span>}
      </span>
    </div>
  )
}
