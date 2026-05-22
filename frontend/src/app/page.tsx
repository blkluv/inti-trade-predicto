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

function MarketCard({ market }: { market: MarketItem }) {
  const odds = market.current_odds !== null ? Math.round(market.current_odds * 100) : null
  const noOdds = odds !== null ? 100 - odds : null
  return (
    <Link
      href={`/markets/${market.id}`}
      className="relative flex flex-col justify-between rounded-xl shadow-md shadow-black/4 h-full overflow-hidden pt-3 pb-4 px-3 group/card transition hover:-translate-y-px hover:shadow-black/8 hover:shadow-md bg-neutral-900 hover:bg-neutral-800 border border-border/60"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase">
            {market.category?.[0] || "M"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-muted-foreground truncate block">
              {market.category || "General"}
            </span>
          </div>
        </div>
        <h3 className="text-sm font-medium leading-snug line-clamp-2 mt-1">
          {market.question}
        </h3>
      </div>

      <div className="mt-3 space-y-2">
        <div className="text-center">
          <div className="text-3xl font-bold font-number tracking-tight">
            {odds !== null ? `${odds}%` : "--"}
          </div>
          <div className="h-1.5 rounded-full bg-neutral-700 mt-1.5 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", odds !== null && odds >= 50 ? "bg-up" : "bg-down")}
              style={{ width: `${odds ?? 50}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-muted-foreground font-number">
              {noOdds !== null ? `${noOdds}%` : "--"} NO
            </span>
            <span className="text-[11px] font-medium font-number">
              YES {odds !== null ? `${odds}%` : "--"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground font-number tabular-nums">
            {formatCurrency(market.volume_24h)} Vol
          </span>
          <div className={cn(
            "flex items-center justify-center h-6 px-2 rounded text-[10px] font-semibold",
            odds !== null && odds >= 50 ? "bg-up/15 text-up" : "bg-down/15 text-down"
          )}>
            {odds !== null && odds >= 50 ? "YES" : "NO"}
          </div>
        </div>
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
    .slice(0, 8)

  const cryptoMarkets = markets
    .filter((m) => m.category?.toLowerCase() === "crypto" && !m.resolved)
    .sort((a, b) => b.volume_24h - a.volume_24h)
    .slice(0, 4)

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
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl shadow-md border border-border/60 bg-neutral-900 p-4 min-h-[200px] animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-md bg-muted" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded mb-6" />
                <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Trending</span>
            </div>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-10">
              {topMarkets.map((market, i) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                >
                  <MarketCard market={market} />
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
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-10">
                  {cryptoMarkets.map((market, i) => (
                    <motion.div
                      key={market.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                    >
                      <MarketCard market={market} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="rounded-xl border border-border/60 bg-neutral-900 p-4 mt-8 flex items-center gap-3">
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
