"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { TrendingUp, Globe, ArrowUpRight, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

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

function MarketRow({ market }: { market: MarketItem }) {
  const odds = market.current_odds !== null ? Math.round(market.current_odds * 100) : null
  const oddsColor = odds !== null ? (odds > 50 ? "text-up" : odds < 50 ? "text-down" : "text-foreground") : "text-muted-foreground"
  return (
    <Link
      href={`/markets/${market.id}`}
      className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/40 group border-b border-border"
    >
      <div className={cn("w-16 shrink-0 text-right font-bold font-number text-lg tabular-nums", oddsColor)}>
        {odds !== null ? `${odds}%` : "--"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground mb-0.5">
          {market.category || "General"}
        </div>
        <div className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
          {market.question}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11px] text-muted-foreground tabular-nums">
        <span>{formatCurrency(market.volume_24h)} Vol</span>
        <span>{formatCurrency(market.liquidity)} Liq</span>
      </div>
    </Link>
  )
}

export default function Home() {
  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getMarkets({ page: "1", page_size: "20" }) as MarketResponse
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
    .slice(0, 10)

  const cryptoMarkets = markets
    .filter((m) => m.category?.toLowerCase() === "crypto" && !m.resolved)
    .sort((a, b) => b.volume_24h - a.volume_24h)
    .slice(0, 5)

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold">Predicto</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time Polymarket intelligence</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} />
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 animate-pulse border-b border-border">
                <div className="w-16 h-8 bg-muted rounded shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                </div>
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Trending</span>
            </div>
            <div className="mb-8">
              {topMarkets.map((market, i) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015, duration: 0.15 }}
                >
                  <MarketRow market={market} />
                </motion.div>
              ))}
            </div>

            {cryptoMarkets.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Crypto</span>
                  <Link href="/markets?category=Crypto" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
                    View all <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="mb-8">
                  {cryptoMarkets.map((market, i) => (
                    <motion.div
                      key={market.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.15 }}
                    >
                      <MarketRow market={market} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="rounded-lg border border-border bg-card p-4 mt-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm flex-1">
            AI-powered signals with reasoning traces and edge calculations.
          </p>
          <Link
            href="/signals"
            className="inline-flex items-center justify-center h-8 px-4 text-xs font-semibold rounded bg-primary text-yellow-foreground hover:brightness-110 transition-all shrink-0"
          >
            View Signals
          </Link>
        </div>
      </div>
    </div>
  )
}
