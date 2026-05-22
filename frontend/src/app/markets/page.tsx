"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { MarketCard } from "@/components/market-card"
import { Search, SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "next/navigation"

type MarketItem = {
  id: string; question: string; category: string | null
  current_odds: number | null; volume_24h: number; liquidity: number
  end_date: string | null; resolved: boolean; created_at: string
}
type MarketResponse = { items: MarketItem[]; total: number }

const sortOptions = [
  { value: "volume", label: "Volume" },
  { value: "liquidity", label: "Liquidity" },
  { value: "odds", label: "Odds" },
  { value: "new", label: "Newest" },
  { value: "ending", label: "Ending Soon" },
] as const

const quickFilters = [
  { label: "All", value: "All" },
  { label: "Crypto", value: "Crypto" },
  { label: "Politics", value: "Politics" },
  { label: "Sports", value: "Sports" },
  { label: "Technology", value: "Technology" },
  { label: "Science", value: "Science" },
]

function MarketsPageContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category") || ""
  const sortParam = searchParams.get("sort") || ""

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(categoryFilter || "All")
  const [sortBy, setSortBy] = useState(sortParam || "volume")
  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (categoryFilter) setActiveCategory(categoryFilter)
    if (sortParam) setSortBy(sortParam)
  }, [categoryFilter, sortParam])

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

  const filtered = useMemo(() => {
    let list = [...markets]
    if (search) list = list.filter((m) => m.question.toLowerCase().includes(search.toLowerCase()))
    if (activeCategory !== "All") list = list.filter((m) => m.category === activeCategory)
    if (sortBy === "liquidity") list.sort((a, b) => b.liquidity - a.liquidity)
    else if (sortBy === "odds") list.sort((a, b) => (b.current_odds ?? 0) - (a.current_odds ?? 0))
    else if (sortBy === "new") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === "ending") list.sort((a, b) => {
      if (!a.end_date) return 1; if (!b.end_date) return -1
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    })
    else list.sort((a, b) => b.volume_24h - a.volume_24h)
    return list
  }, [markets, search, activeCategory, sortBy])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1350px] px-4 lg:px-6 pt-8 pb-12">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold">Markets</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} markets</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {quickFilters.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                  activeCategory === cat.value
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 min-h-[240px] animate-pulse">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-[38px] w-[38px] rounded-[12px] bg-muted" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded mb-6" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 rounded-[8px] bg-muted" />
                  <div className="h-14 rounded-[8px] bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-down">{error}</div>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((market, i) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01, duration: 0.2 }}
                >
                  <MarketCard market={market} index={i} />
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
    <Suspense fallback={<div className="mx-auto max-w-[1350px] px-4 lg:px-6 pt-8"><div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground animate-pulse">Loading markets...</div></div>}>
      <MarketsPageContent />
    </Suspense>
  )
}
