"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EdgeBadge } from "@/components/ui/edge-badge"

interface SignalCardProps {
  id: string
  question: string
  edge: number
  confidence: number
  predictedProbability: number
  marketProbability: number
  reasoning?: string
  direction?: "buy" | "sell" | "hold"
  category?: string
  timestamp?: string
  onAction?: (id: string) => void
  className?: string
}

const directionConfig = {
  buy: { label: "BUY", class: "text-green-400 border-green-400/20 bg-green-400/5" },
  sell: { label: "SELL", class: "text-red-400 border-red-400/20 bg-red-400/5" },
  hold: { label: "HOLD", class: "text-muted-foreground border-border bg-muted/10" },
} as const

export function SignalCard({
  id,
  question,
  edge,
  confidence,
  predictedProbability,
  marketProbability,
  reasoning,
  direction,
  category,
  timestamp,
  onAction,
  className,
}: SignalCardProps) {
  const dir = direction
    ? directionConfig[direction]
    : edge > 0
      ? directionConfig.buy
      : edge < 0
        ? directionConfig.sell
        : directionConfig.hold

  const confidenceColor =
    confidence > 0.7
      ? "linear-gradient(90deg, #22c55e, #16a34a)"
      : confidence > 0.4
        ? "linear-gradient(90deg, #eab308, #d97706)"
        : "linear-gradient(90deg, #ef4444, #dc2626)"

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 glow-card transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {category && (
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {category}
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground leading-snug mt-0.5 line-clamp-2">
            {question}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono",
              dir.class,
            )}
          >
            {dir.label}
          </span>
          <EdgeBadge edge={edge} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-[11px] text-muted-foreground font-medium">Predicted</span>
          <p className="text-lg font-bold font-mono text-primary mt-0.5">
            {(predictedProbability * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground font-medium">Market</span>
          <p className="text-lg font-bold font-mono text-muted-foreground mt-0.5">
            {(marketProbability * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">Confidence</span>
          <span className="text-[11px] font-mono font-semibold text-foreground">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: confidenceColor }}
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {reasoning && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {reasoning}
        </p>
      )}

      <div className="flex items-center justify-between">
        {timestamp && (
          <span className="text-[11px] text-muted-foreground">{timestamp}</span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction?.(id)}
          className="ml-auto"
        >
          View Signal
        </Button>
      </div>
    </div>
  )
}
