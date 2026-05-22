"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Search } from "lucide-react"
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
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-number tabular-nums">
              {formatCurrency(market.volume_24h)} Vol
            </span>
          </div>
          <div className="flex -space-x-1">
            <div className={cn(
              "flex items-center justify-center h-6 px-2 rounded text-[10px] font-semibold",
              odds !== null && odds >= 50 ? "bg-up/15 text-up" : "bg-down/15 text-down"
            )}>
              {odds !== null && odds >= 50 ? "YES" : "NO"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
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
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl shadow-md border border-border/60 bg-neutral-900 p-4 min-h-[200px] animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-md bg-muted" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded mb-6" />
                <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
                <div className="h-1.5 w-full bg-muted rounded mb-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-down">{error}</div>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((market, i) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01, duration: 0.2 }}
                >
                  <MarketCard market={market} />
                </motion.div>
              ))}
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
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6"><div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground animate-pulse">Loading markets...</div></div>}>
      <MarketsPageContent />
    </Suspense>
  )
}
