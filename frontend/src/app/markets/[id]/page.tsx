"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Brain, ChevronDown, ChevronUp, ExternalLink, BarChart3, Target, Clock } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

type MarketDetail = {
  id: string
  question: string
  description: string | null
  category: string | null
  current_odds: number | null
  volume_24h: number
  liquidity: number
  end_date: string | null
  resolved: boolean
  resolution_outcome: string | null
  ai_signal: null | {
    signal_id: string
    predicted_prob: number
    edge: number
    confidence: number
    recommended_action: string
    model_version: string
    created_at: string
  }
}

type PricePoint = { outcome: string | null; price: number; volume: number | null; fetched_at: string }
type PriceHistoryResponse = { market_id: string; prices: PricePoint[] }

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }).format(value)

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--"
  return `${Math.round(value * 100)}%`
}

export default function MarketDetailPage() {
  const params = useParams()
  const marketId = (typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "")
  const [showReasoning, setShowReasoning] = useState(false)
  const [market, setMarket] = useState<MarketDetail | null>(null)
  const [prices, setPrices] = useState<PricePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const priceHistory = useMemo(() => {
    if (!prices.length) return []
    return prices.map((p) => ({
      date: new Date(p.fetched_at).toLocaleDateString([], { month: "short", day: "numeric" }),
      yes: p.price,
      ai: market?.ai_signal?.predicted_prob ?? p.price,
    }))
  }, [prices, market?.ai_signal?.predicted_prob])

  useEffect(() => {
    if (!marketId) return
    const fetchData = async () => {
      setIsLoading(true)
      try {
        setError(null)
        const [marketData, priceData] = await Promise.all([
          api.getMarket(marketId) as Promise<MarketDetail>,
          api.getMarketPrices(marketId) as Promise<PriceHistoryResponse>,
        ])
        setMarket(marketData)
        setPrices((priceData.prices || []).slice().reverse())
        setLastUpdated(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load market")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [marketId])

  const oddsPct = market?.current_odds !== null && market?.current_odds !== undefined ? Math.round(market.current_odds * 100) : 50
  const aiPct = market?.ai_signal?.predicted_prob !== null && market?.ai_signal?.predicted_prob !== undefined ? Math.round(market.ai_signal.predicted_prob * 100) : null

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <Link href="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {market?.category || "General"}
                </span>
                {market?.resolved && (
                  <Badge variant="down" className="text-[10px]">Resolved</Badge>
                )}
                <div className="ml-auto">
                  <PolymarketBadge lastUpdated={lastUpdated} />
                </div>
              </div>
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-6 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ) : error ? (
                <p className="text-sm text-down">{error}</p>
              ) : (
                <>
                  <h1 className="text-xl font-bold leading-snug">{market?.question}</h1>
                  {market?.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{market.description}</p>
                  )}
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Price History</span>
              </div>
              <div className="h-[280px]">
                {priceHistory.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory}>
                      <defs>
                        <linearGradient id="yesG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FCD535" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value: any) => `${(Number(value) * 100).toFixed(1)}%`}
                      />
                      <Area type="monotone" dataKey="yes" stroke="#FCD535" fill="url(#yesG)" strokeWidth={2} name="Price" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading price data...</div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="text-center mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Current YES Price</span>
                <div className="text-5xl font-bold font-number mt-1">{formatPercent(market?.current_odds ?? null)}</div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${oddsPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>NO {100 - oddsPct}%</span>
                <span>YES {oddsPct}%</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">AI Signal</span>
              </div>
              {market?.ai_signal ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Prediction</span>
                    <span className="font-semibold font-number text-primary">{formatPercent(market.ai_signal.predicted_prob)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Edge</span>
                    <span className={cn("font-semibold font-number", market.ai_signal.edge > 0 ? "text-up" : "text-down")}>
                      {market.ai_signal.edge > 0 ? "+" : ""}{(market.ai_signal.edge * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-semibold font-number">{Math.round(market.ai_signal.confidence * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Action</span>
                    <Badge variant={market.ai_signal.recommended_action === "buy" ? "up" : "down"} className="text-[10px]">
                      {market.ai_signal.recommended_action.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">AI analysis pending...</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="font-semibold font-number">{formatCurrency(market?.volume_24h ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Liquidity</span>
                  <span className="font-semibold font-number">{formatCurrency(market?.liquidity ?? 0)}</span>
                </div>
                {market?.end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">End Date</span>
                    <span className="font-number text-xs">{new Date(market.end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full rounded-lg border border-border bg-card p-5 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Reasoning Trace</span>
                  </div>
                  {showReasoning ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {showReasoning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-4 border-x border-b border-border rounded-b-lg bg-card space-y-3 text-sm text-muted-foreground">
                    {market?.ai_signal?.recommended_action && (
                      <p><span className="text-foreground font-medium">Action</span><br />{market.ai_signal.recommended_action.toUpperCase()}</p>
                    )}
                    {market?.ai_signal?.model_version && (
                      <p><span className="text-foreground font-medium">Model</span><br />{market.ai_signal.model_version}</p>
                    )}
                    {!market?.ai_signal && <p>Signals will appear once AI analysis completes.</p>}
                  </div>
                </motion.div>
              )}
            </motion.div>

            <div className="flex gap-3">
              <Link href="#" className="flex items-center justify-center flex-1 h-11 text-sm font-semibold rounded-lg bg-up text-white hover:brightness-110 transition-all gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Buy YES
              </Link>
              <Link href="#" className="flex items-center justify-center flex-1 h-11 text-sm font-semibold rounded-lg bg-down text-white hover:brightness-110 transition-all gap-1.5">
                <TrendingDown className="h-4 w-4" />
                Buy NO
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
