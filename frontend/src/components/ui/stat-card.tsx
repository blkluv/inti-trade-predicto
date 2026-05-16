"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change?: number
  description?: string
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  change,
  description,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const changeAbs = change !== undefined ? Math.abs(change) : 0

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 glow-card transition-all duration-300 hover:glow-card",
        !className?.includes("glow-card") && "hover:shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold font-mono",
              isPositive && "text-green-400",
              isNegative && "text-red-400",
              !isPositive && !isNegative && "text-muted-foreground",
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {isPositive ? "+" : isNegative ? "-" : ""}
            {changeAbs.toFixed(1)}%
          </div>
        )}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <p className="text-2xl font-bold text-foreground mt-0.5 font-mono">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
      )}
    </div>
  )
}
