"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, RefreshCw, TrendingUp, TrendingDown, Clock, Target } from "lucide-react"

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Signals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">AI-generated trade signals sorted by edge</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </motion.div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min edge:</span>
            <Input type="number" value={minEdge} onChange={(e) => setMinEdge(Number(e.target.value))} className="w-16 h-8 text-sm text-center" min={0} max={100} />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchSignals(false)} disabled={isRefreshing} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5 animate-pulse">
                <div className="h-4 w-40 bg-muted rounded mb-3" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-down">{error}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((signal, i) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link href={`/markets/${signal.market_id}`} className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50 group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant={signal.recommended_action === "buy" ? "up" : "down"} className="text-[10px]">
                          {signal.recommended_action === "buy" ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                          {signal.recommended_action.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Market #{signal.market_id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Model: {signal.model_version}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelative(signal.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-0.5">Edge</div>
                        <span className={cn("text-lg font-bold font-number", signal.edge > 0 ? "text-up" : "text-down")}>
                          {signal.edge > 0 ? "+" : ""}{(signal.edge * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-0.5">Confidence</div>
                        <span className="font-semibold font-number">{Math.round(signal.confidence * 100)}%</span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-0.5">AI / Market</div>
                        <span className="text-sm font-number">
                          <span className="text-primary">{formatPercent(signal.predicted_prob)}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span>{formatPercent(signal.market_odds)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
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
