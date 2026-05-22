"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { TrendingUp, TrendingDown, BarChart3, Globe, Brain, Zap, ArrowUpRight, Target } from "lucide-react"

type MarketItem = {
  id: string
  question: string
  category: string | null
  current_odds: number | null
  volume_24h: number
  liquidity: number
  end_date: string | null
  resolved: boolean
  created_at: string
}

type MarketResponse = {
  items: MarketItem[]
  total: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }).format(value)

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--"
  return `${Math.round(value * 100)}%`
}

export default function Home() {
  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getMarkets({ page: "1", page_size: "12" }) as MarketResponse
        setMarkets(data.items || [])
        setLastUpdated(new Date())
      } catch (_) { } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [])

  const topMarkets = markets
    .filter((m) => !m.resolved)
    .sort((a, b) => b.volume_24h - a.volume_24h)
    .slice(0, 6)

  const cryptoMarkets = markets
    .filter((m) => m.category?.toLowerCase() === "crypto" && !m.resolved)
    .sort((a, b) => b.volume_24h - a.volume_24h)
    .slice(0, 4)

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time prediction market intelligence from Polymarket</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} />
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded mb-4" />
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Trending</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {topMarkets.map((market, i) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link href={`/markets/${market.id}`} className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-muted-foreground/30 hover:shadow-sm group">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {market.category || "General"}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {market.question}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-number">{formatPercent(market.current_odds)}</span>
                        <span className="text-xs text-muted-foreground">YES</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">{formatCurrency(market.volume_24h)}</span>
                        <span className="tabular-nums">{formatCurrency(market.liquidity)} Liq</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {cryptoMarkets.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Crypto</span>
                  <Link href="/markets?category=Crypto" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
                    View all <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                  {cryptoMarkets.map((market, i) => (
                    <motion.div
                      key={market.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <Link href={`/markets/${market.id}`} className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-muted-foreground/30 hover:shadow-sm group">
                        <h3 className="text-sm font-medium leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {market.question}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-number">{formatPercent(market.current_odds)}</span>
                            <span className="text-xs text-muted-foreground">YES</span>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(market.volume_24h)}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="rounded-lg border border-border bg-card p-5 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">AI-Powered Intelligence</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ensemble AI analyzes market data in real-time to generate trading signals with full reasoning traces.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/signals"
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold rounded bg-primary text-yellow-foreground hover:brightness-110 transition-all gap-1.5"
              >
                <Zap className="h-4 w-4" />
                View Signals
              </Link>
              <Link
                href="/markets"
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold rounded border border-border text-foreground hover:bg-muted transition-all"
              >
                All Markets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
