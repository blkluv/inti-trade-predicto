"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FadeInView } from "@/components/fade-in-view"
import { Search, TrendingUp, Filter, ArrowUpRight, BarChart3 } from "lucide-react"

type MarketItem = {
  id: string
  source: string
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
  page: number
  page_size: number
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


export default function MarketsPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [status, setStatus] = useState<"all" | "active" | "resolved">("all")
  const [sortBy, setSortBy] = useState<"volume" | "liquidity" | "odds">("volume")
  const [minVolume, setMinVolume] = useState("")
  const [minLiquidity, setMinLiquidity] = useState("")
  const [minOdds, setMinOdds] = useState("")
  const [maxOdds, setMaxOdds] = useState("")
  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const categories = useMemo(() => {
    const catSet = new Set(
      markets
        .map((market) => market.category)
        .filter((category): category is string => Boolean(category))
    )
    return ["All", ...Array.from(catSet)]
  }, [markets])

  const fetchMarkets = async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      setError(null)
      const data = await api.getMarkets({ page: "1", page_size: "100" }) as MarketResponse
      setMarkets(data.items)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets")
    } finally {
      if (showLoading) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchMarkets(true)
    const interval = setInterval(() => fetchMarkets(false), 60_000)
    return () => clearInterval(interval)
  }, [])

  const filtered = markets.filter((market) => {
    const matchSearch = market.question.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === "All" || market.category === activeCategory
    const matchStatus =
      status === "all" || (status === "active" ? !market.resolved : market.resolved)

    const volumeFloor = minVolume ? Number(minVolume) : null
    const liquidityFloor = minLiquidity ? Number(minLiquidity) : null
    const oddsMinValue = minOdds ? Number(minOdds) / 100 : null
    const oddsMaxValue = maxOdds ? Number(maxOdds) / 100 : null

    const matchVolume = volumeFloor === null || market.volume_24h >= volumeFloor
    const matchLiquidity = liquidityFloor === null || market.liquidity >= liquidityFloor

    const oddsValue = market.current_odds
    const matchOdds =
      (oddsMinValue === null && oddsMaxValue === null) ||
      (oddsValue !== null &&
        (oddsMinValue === null || oddsValue >= oddsMinValue) &&
        (oddsMaxValue === null || oddsValue <= oddsMaxValue))

    return matchSearch && matchCategory && matchStatus && matchVolume && matchLiquidity && matchOdds
  }).sort((a, b) => {
    if (sortBy === "liquidity") return b.liquidity - a.liquidity
    if (sortBy === "odds") return (b.current_odds ?? 0) - (a.current_odds ?? 0)
    return b.volume_24h - a.volume_24h
  })

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
            <PolymarketBadge lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
          </div>
          <p className="mt-2 text-muted-foreground">Realtime Polymarket markets with live pricing and liquidity</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                  activeCategory === cat
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                )}
              >
                {cat}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMarkets(false)}
              disabled={isRefreshing}
              className="gap-2"
            >
              <Filter className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-3 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | "active" | "resolved")}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "volume" | "liquidity" | "odds")}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="volume">24h Volume</option>
              <option value="liquidity">Liquidity</option>
              <option value="odds">Yes Odds</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Min Volume</label>
            <Input
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              placeholder="0"
              className="h-10"
              min={0}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Min Liquidity</label>
            <Input
              type="number"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(e.target.value)}
              placeholder="0"
              className="h-10"
              min={0}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Min Yes %</label>
            <Input
              type="number"
              value={minOdds}
              onChange={(e) => setMinOdds(e.target.value)}
              placeholder="0"
              className="h-10"
              min={0}
              max={100}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Max Yes %</label>
            <Input
              type="number"
              value={maxOdds}
              onChange={(e) => setMaxOdds(e.target.value)}
              placeholder="100"
              className="h-10"
              min={0}
              max={100}
            />
          </div>
        </div>

        <div className="grid gap-px bg-border rounded-lg overflow-hidden sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading && (
            <div className="col-span-full bg-card p-8 text-center text-sm text-muted-foreground">
              Loading live markets...
            </div>
          )}
          {!isLoading && error && (
            <div className="col-span-full bg-card p-8 text-center text-sm text-down">
              {error}
            </div>
          )}
          {!isLoading && !error && filtered.map((market, i) => (
            <FadeInView key={market.id} delay={i * 0.03}>
              <Link href={`/markets/${market.id}`}>
                <div className="bg-card p-5 h-full transition-colors hover:bg-muted cursor-pointer flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">Polymarket</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {formatCurrency(market.volume_24h)}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium leading-relaxed flex-1 mb-4">
                    {market.question}
                  </h3>
                  <div className="space-y-3 mt-auto">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>YES</span>
                        <span className="font-semibold font-mono text-foreground">
                          {formatPercent(market.current_odds)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-up"
                          style={{ width: `${Math.max(0, Math.min(100, Math.round((market.current_odds ?? 0) * 100)))}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">AI edge pending</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </FadeInView>
          ))}
        </div>

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No markets found</p>
            <p className="text-sm mt-1">Try a different search term or category</p>
          </div>
        )}
      </div>
    </div>
  )
}
