import { cn } from "@/lib/utils"
import { EDGE_COLORS } from "@/lib/constants"

interface EdgeBadgeProps {
  edge: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5 gap-0.5",
  md: "text-sm px-2.5 py-1 gap-1",
  lg: "text-base px-3 py-1.5 gap-1",
} as const

export function EdgeBadge({ edge, size = "md", className }: EdgeBadgeProps) {
  const isPositive = edge > 0
  const isNeutral = edge === 0
  const colorClass = isNeutral
    ? EDGE_COLORS.neutral
    : isPositive
      ? EDGE_COLORS.positive
      : EDGE_COLORS.negative

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-mono font-semibold",
        "bg-black/20 border border-current/20",
        sizeClasses[size],
        colorClass,
        className,
      )}
    >
      <span className="text-[10px] leading-none">
        {isPositive ? "\u25B2" : isNeutral ? "\u2014" : "\u25BC"}
      </span>
      {isPositive ? "+" : ""}{(edge * 100).toFixed(1)}%
    </span>
  )
}
