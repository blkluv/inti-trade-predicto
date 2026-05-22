"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Search, TrendingUp, TrendingDown } from "lucide-react"
import { useSearchParams } from "next/navigation"

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

function MarketsPageContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category") || ""

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(categoryFilter || "All")
  const [sortBy, setSortBy] = useState("volume")
  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (categoryFilter) setActiveCategory(categoryFilter)
  }, [categoryFilter])

  const categories = useMemo(() => {
    const catSet = new Set(markets.map((m) => m.category).filter((c): c is string => Boolean(c)))
    return ["All", ...Array.from(catSet)]
  }, [markets])

  const fetchMarkets = async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      setError(null)
      const data = await api.getMarkets({ page: "1", page_size: "100" }) as MarketResponse
      setMarkets(data.items)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMarkets(true)
    const interval = setInterval(() => fetchMarkets(false), 60_000)
    return () => clearInterval(interval)
  }, [])

  const filtered = useMemo(() => markets
    .filter((market) => {
      if (search && !market.question.toLowerCase().includes(search.toLowerCase())) return false
      if (activeCategory !== "All" && market.category !== activeCategory) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === "liquidity") return b.liquidity - a.liquidity
      if (sortBy === "odds") return (b.current_odds ?? 0) - (a.current_odds ?? 0)
      return b.volume_24h - a.volume_24h
    }), [markets, search, activeCategory, sortBy])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">Markets</h1>
          <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeCategory === cat
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground focus:outline-none"
          >
            <option value="volume">Volume</option>
            <option value="liquidity">Liquidity</option>
            <option value="odds">Odds</option>
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, i) => (
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
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-down">{error}</div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {filtered.map((market, i) => {
                const odds = market.current_odds !== null ? Math.round(market.current_odds * 100) : null
                const oddsColor = odds !== null ? (odds > 50 ? "text-up" : odds < 50 ? "text-down" : "text-foreground") : "text-muted-foreground"
                return (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.008, duration: 0.15 }}
                  >
                    <Link
                      href={`/markets/${market.id}`}
                      className="flex items-center gap-4 py-3.5 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/40 group"
                    >
                      <div className={cn("w-16 shrink-0 text-right font-bold font-number text-lg tabular-nums", oddsColor)}>
                        {odds !== null ? `${odds}%` : "--"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {market.category || "General"}
                          </span>
                          {market.resolved && (
                            <>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-down">Resolved</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {market.question}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                        <span title="24h Volume">{formatCurrency(market.volume_24h)} Vol</span>
                        <span title="Today">{formatCurrency(market.volume_24h)} today</span>
                        <span title="Liquidity">{formatCurrency(market.liquidity)} Liq</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 sm:hidden text-[11px] text-muted-foreground tabular-nums">
                        <span>{formatCurrency(market.volume_24h)}</span>
                      </div>
                      <div className="hidden lg:flex items-center gap-1 shrink-0 ml-2">
                        <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded", odds !== null && odds >= 50 ? "text-up bg-up/5" : "text-down bg-down/5")}>
                          {market.current_odds !== null && market.current_odds >= 0.5 ? "YES" : "NO"}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No markets found</p>
                <p className="text-xs mt-1 text-muted-foreground">Try a different search or filter</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6"><div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground animate-pulse">Loading markets...</div></div>}>
      <MarketsPageContent />
    </Suspense>
  )
}
