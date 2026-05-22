"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { FadeInView } from "@/components/fade-in-view"
import {
  ArrowLeft, TrendingUp, TrendingDown, Brain, ChevronDown, ChevronUp,
  ExternalLink, Newspaper, BarChart3, MessageCircle, Target
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from "recharts"

type MarketDetail = {
  id: string
  source: string
  question: string
  description: string | null
  category: string | null
  outcomes: string[]
  current_odds: number | null
  volume_24h: number
  liquidity: number
  end_date: string | null
  resolved: boolean
  resolution_outcome: string | null
  resolution_source: string | null
  ai_signal: null | {
    signal_id: string
    predicted_prob: number
    edge: number
    confidence: number
    recommended_action: string
    model_version: string
    created_at: string
  }
  created_at: string
  updated_at: string
}

type PricePoint = {
  outcome: string | null
  price: number
  volume: number | null
  fetched_at: string
}

type PriceHistoryResponse = {
  market_id: string
  prices: PricePoint[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--"
  return `${Math.round(value * 100)}%`
}


export default function MarketDetailPage() {
  const params = useParams()
  const marketId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  const [showReasoning, setShowReasoning] = useState(false)
  const [market, setMarket] = useState<MarketDetail | null>(null)
  const [prices, setPrices] = useState<PricePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const priceHistory = useMemo(() => {
    if (!prices.length) return []
    return prices.map((point) => ({
      date: new Date(point.fetched_at).toLocaleDateString([], { month: "short", day: "numeric" }),
      yes: point.price,
      ai: market?.ai_signal?.predicted_prob ?? point.price,
    }))
  }, [prices, market?.ai_signal?.predicted_prob])

  const fetchMarket = async (showLoading: boolean) => {
    if (!marketId) return
    if (showLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
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
      if (showLoading) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchMarket(true)
    const interval = setInterval(() => fetchMarket(false), 60_000)
    return () => clearInterval(interval)
  }, [marketId])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FadeInView direction="none">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">Polymarket</Badge>
                    {market?.category && (
                      <Badge variant="secondary" className="text-xs">{market.category}</Badge>
                    )}
                    <Badge variant="yellow" className="text-xs">
                      <Brain className="mr-1 h-3 w-3" />
                      AI Tracked
                    </Badge>
                    <div className="ml-auto">
                      <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
                    </div>
                  </div>
                  {isLoading && (
                    <p className="text-sm text-muted-foreground">Loading live market...</p>
                  )}
                  {!isLoading && error && (
                    <p className="text-sm text-down">{error}</p>
                  )}
                  {!isLoading && !error && market && (
                    <>
                      <h1 className="text-2xl font-bold leading-relaxed">
                        {market.question}
                      </h1>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {market.description || "Realtime market data sourced directly from Polymarket."}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.1}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Price History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {priceHistory.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory}>
                        <defs>
                          <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ecb81" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0ecb81" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FCD535" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip
                          contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: "4px", fontSize: "13px" }}
                          formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                        />
                        <Area type="monotone" dataKey="yes" stroke="#0ecb81" fill="url(#yesGrad)" strokeWidth={2} name="Market Price" />
                        <Area type="monotone" dataKey="ai" stroke="#FCD535" fill="url(#aiGrad)" strokeWidth={2} strokeDasharray="5 5" name="AI Prediction" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Price history will appear once Polymarket prices are collected.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-up rounded" />Market Price</span>
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-primary rounded" />AI Prediction</span>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.2}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    Source Articles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {market?.ai_signal?.signal_id ? (
                    <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
                      News sources are connected via NewsAPI and enrich signal reasoning in real-time. New articles will appear here as signals are generated.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
                      Waiting for AI signal generation to attach articles.
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeInView>
          </div>

          <div className="space-y-6">
            <FadeInView direction="none" delay={0.05}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Prediction Gauge</p>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="#FCD535"
                          strokeWidth="8"
                          strokeDasharray={`${Math.max(0, Math.min(1, market?.ai_signal?.predicted_prob ?? 0)) * 339.29} 339.29`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-3xl font-bold text-foreground">
                        {formatPercent(market?.ai_signal?.predicted_prob ?? null)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {market?.ai_signal
                        ? `AI predicts YES with ${formatPercent(market.ai_signal.predicted_prob)} confidence`
                        : "AI predictions will appear once signals are generated"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.1}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Current Odds</span>
                      <span className="font-semibold">{formatPercent(market?.current_odds ?? null)} YES</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-up"
                        style={{ width: `${Math.max(0, Math.min(100, Math.round((market?.current_odds ?? 0) * 100)))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">AI Prediction</span>
                      <span className="font-semibold text-primary">
                        {formatPercent(market?.ai_signal?.predicted_prob ?? null)} YES
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, Math.round((market?.ai_signal?.predicted_prob ?? 0) * 100)))}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">AI Edge</span>
                      <span className="font-semibold text-primary">
                        {market?.ai_signal ? `${market.ai_signal.edge > 0 ? "+" : ""}${(market.ai_signal.edge * 100).toFixed(1)}%` : "--"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, Math.abs((market?.ai_signal?.edge ?? 0) * 1000))}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.15}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Kelly Sizing</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edge</span>
                      <span className="text-primary font-medium">+3.0%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kelly %</span>
                      <span className="font-medium">4.8%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suggested Size</span>
                      <span className="font-medium">2.4%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <Badge variant="up" className="text-xs">High</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.2}>
              <Card className="border-border/50">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="w-full p-6 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Reasoning Trace</span>
                    </div>
                    {showReasoning ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
                {showReasoning && (
                  <div className="px-6 pb-6">
                    <Separator className="mb-4" />
                    <div className="space-y-3 text-sm text-muted-foreground">
                      {market?.ai_signal?.recommended_action && (
                        <p>
                          <span className="text-foreground font-medium">Recommended Action</span><br />
                          {market.ai_signal.recommended_action.toUpperCase()}
                        </p>
                      )}
                      {market?.ai_signal?.model_version && (
                        <p>
                          <span className="text-foreground font-medium">Model</span><br />
                          {market.ai_signal.model_version}
                        </p>
                      )}
                      {!market?.ai_signal && (
                        <p>
                          Signals are still processing. This panel will populate once the AI completes analysis.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.25}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Sentiment Breakdown</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
                    Sentiment is derived from NewsAPI articles and AI scoring. It will display once signals are generated.
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <div className="flex gap-3">
              <Link href="#" className="inline-flex items-center justify-center flex-1 h-11 text-sm font-semibold rounded bg-up text-white hover:brightness-110 transition-all">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Buy YES
              </Link>
              <Link href="#" className="inline-flex items-center justify-center flex-1 h-11 text-sm font-semibold rounded bg-down text-white hover:brightness-110 transition-all">
                <TrendingDown className="mr-1.5 h-4 w-4" />
                Buy NO
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
