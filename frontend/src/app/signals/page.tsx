"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, TrendingDown, Clock } from "lucide-react"

type SignalItem = {
  id: string
  market_id: string
  predicted_prob: number
  market_odds: number
  edge: number
  confidence: number
  recommended_action: string
  model_version: string
  created_at: string
}

type SignalResponse = { items: SignalItem[]; total: number }

const formatRelative = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  return `${Math.round(diffMin / 60)}h ago`
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

export default function SignalsPage() {
  const [minEdge, setMinEdge] = useState(0)
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSignals = async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      setError(null)
      const data = await api.getSignals({ page: "1", page_size: "50" }) as SignalResponse
      setSignals(data.items)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSignals(true)
    const interval = setInterval(() => fetchSignals(false), 60_000)
    return () => clearInterval(interval)
  }, [])

  const filtered = signals.filter((s) => (s.edge * 100) >= minEdge).sort((a, b) => b.edge - a.edge)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">Signals</h1>
          <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min edge:</span>
            <input type="number" value={minEdge} onChange={(e) => setMinEdge(Number(e.target.value))}
              className="w-16 h-8 rounded-lg border border-border bg-card text-sm text-center text-foreground focus:outline-none" min={0} max={100} />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <button onClick={() => fetchSignals(false)} disabled={isRefreshing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground transition-colors">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-neutral-900 p-4 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-3 w-full bg-muted rounded mb-2" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-down">{error}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((signal, i) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015, duration: 0.2 }}
              >
                <Link
                  href={`/markets/${signal.market_id}`}
                  className="rounded-xl border border-border/60 bg-neutral-900 hover:bg-neutral-800 transition-colors p-4 flex items-center gap-4 group"
                >
                  <div className="shrink-0">
                    <Badge variant={signal.recommended_action === "buy" ? "up" : "down"} className="text-[10px]">
                      {signal.recommended_action === "buy" ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
                      {signal.recommended_action.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      Market #{signal.market_id.slice(0, 8)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>{signal.model_version}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelative(signal.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Edge</div>
                      <span className={cn("text-base font-bold font-number", signal.edge > 0 ? "text-up" : "text-down")}>
                        {signal.edge > 0 ? "+" : ""}{(signal.edge * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Conf</div>
                      <span className="text-sm font-semibold font-number">{Math.round(signal.confidence * 100)}%</span>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">AI/Mkt</div>
                      <span className="text-sm font-number">
                        <span className="text-primary">{formatPercent(signal.predicted_prob)}</span>
                        <span className="text-muted-foreground">/</span>
                        <span>{formatPercent(signal.market_odds)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No signals yet</p>
                <p className="text-xs mt-1">Signals will appear once AI analysis is running</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
