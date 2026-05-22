"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FadeInView } from "@/components/fade-in-view"
import { Brain, RefreshCw, TrendingUp, TrendingDown, Clock } from "lucide-react"

type SignalItem = {
  id: string
  market_id: string
  predicted_prob: number
  market_odds: number
  edge: number
  confidence: number
  recommended_action: string
  model_version: string
  executed: boolean
  created_at: string
}

type SignalResponse = {
  items: SignalItem[]
  total: number
  page: number
  page_size: number
}

const formatRelative = (value: string) => {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.round(diffMin / 60)
  return `${diffHours}h ago`
}

export default function SignalsPage() {
  const [minEdge, setMinEdge] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSignals = async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      setError(null)
      const data = await api.getSignals({ page: "1", page_size: "50" }) as SignalResponse
      setSignals(data.items)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals")
    } finally {
      if (showLoading) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchSignals(true)
    const interval = setInterval(() => fetchSignals(false), 60_000)
    return () => clearInterval(interval)
  }, [])

  const filtered = signals
    .filter((s) => (s.edge * 100) >= minEdge)
    .sort((a, b) => b.edge - a.edge)

  const handleRefresh = () => fetchSignals(false)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Live Signals</h1>
              <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
            </div>
            <p className="mt-2 text-muted-foreground">Real-time AI-powered trade signals, sorted by edge</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Min edge:</span>
              <Input
                type="number"
                value={minEdge}
                onChange={(e) => setMinEdge(Number(e.target.value))}
                className="w-16 h-8 text-sm text-center"
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <div className="space-y-px bg-border rounded-lg overflow-hidden">
          {isLoading && (
            <div className="bg-card p-6 text-center text-sm text-muted-foreground">
              Loading live signals...
            </div>
          )}
          {!isLoading && error && (
            <div className="bg-card p-6 text-center text-sm text-down">
              {error}
            </div>
          )}
          {!isLoading && !error && filtered.map((signal, i) => (
            <FadeInView key={signal.id} delay={i * 0.03}>
              <Link href={`/markets/${signal.market_id}`}>
                <div className={cn(
                  "bg-card p-5 transition-colors hover:bg-muted cursor-pointer block",
                )}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px] items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={signal.recommended_action === "buy" ? "up" : "down"} className="text-xs">
                          {signal.recommended_action === "buy" ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                          {signal.recommended_action.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">Polymarket</Badge>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">Signal for {signal.market_id}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Model {signal.model_version}</p>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-lg font-bold font-mono", signal.edge > 0 ? "text-up" : "text-down")}>
                          {signal.edge > 0 ? "+" : ""}{(signal.edge * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">edge</span>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Confidence</span>
                          <span className="font-mono">{Math.round(signal.confidence * 100)}%</span>
                        </div>
                        <Progress value={Math.round(signal.confidence * 100)} className="h-1.5" />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>AI: <span className="text-primary font-medium font-mono">{Math.round(signal.predicted_prob * 100)}%</span></span>
                        <span>Market: <span className="text-foreground font-medium font-mono">{Math.round(signal.market_odds * 100)}%</span></span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelative(signal.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeInView>
          ))}
        </div>

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No signals match your filter criteria</p>
            <p className="text-sm mt-1">Try lowering the minimum edge threshold</p>
          </div>
        )}
      </div>
    </div>
  )
}
