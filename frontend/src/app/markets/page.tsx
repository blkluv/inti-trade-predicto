"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Search, SlidersHorizontal } from "lucide-react"
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
  const [status, setStatus] = useState<"all" | "active" | "resolved">("all")
  const [showFilters, setShowFilters] = useState(false)
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
      if (status === "active" && market.resolved) return false
      if (status === "resolved" && !market.resolved) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === "liquidity") return b.liquidity - a.liquidity
      if (sortBy === "odds") return (b.current_odds ?? 0) - (a.current_odds ?? 0)
      return b.volume_24h - a.volume_24h
    }), [markets, search, activeCategory, status, sortBy])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Browse and trade prediction markets</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
              {["All", ...new Set(markets.map((m) => m.category).filter((c): c is string => Boolean(c)))].slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    activeCategory === cat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-colors",
                showFilters ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden mb-5"
          >
            <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Sort by</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="volume">24h Volume</option>
                  <option value="liquidity">Liquidity</option>
                  <option value="odds">Yes Odds</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => fetchMarkets(false)}
                  disabled={isRefreshing}
                  className="h-9 px-4 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                <div className="h-3 w-16 bg-muted rounded mb-3" />
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded mb-4" />
                <div className="flex justify-between"><div className="h-3 w-20 bg-muted rounded" /><div className="h-3 w-20 bg-muted rounded" /></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-down">{error}</div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((market, i) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.25 }}
                >
                  <Link href={`/markets/${market.id}`} className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-muted-foreground/30 hover:shadow-sm group">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {market.category || "General"}
                      </span>
                      {market.resolved && (
                        <span className="text-[11px] font-medium text-down uppercase tracking-wider">Resolved</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {market.question}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-2xl font-bold font-number",
                          !market.resolved ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {formatPercent(market.current_odds)}
                        </span>
                        <span className="text-xs text-muted-foreground">YES</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{formatCurrency(market.volume_24h)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No markets found</p>
                <p className="text-xs mt-1">Try a different search or filter</p>
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
