"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { MarketCard } from "@/components/market-card"
import { TrendingUp, Globe, ArrowUpRight, Sparkles, Zap } from "lucide-react"

type MarketItem = {
  id: string; question: string; category: string | null
  current_odds: number | null; volume_24h: number; liquidity: number
  end_date: string | null; resolved: boolean; created_at: string
}
type MarketResponse = { items: MarketItem[]; total: number }

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
      } catch (_) { } finally { setIsLoading(false) }
    }
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [])

  const topMarkets = markets.filter((m) => !m.resolved).sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 12)
  const cryptoMarkets = markets.filter((m) => m.category?.toLowerCase() === "crypto" && !m.resolved).sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 4)
  const politicsMarkets = markets.filter((m) => m.category?.toLowerCase() === "politics" && !m.resolved).sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 4)

  return (
    <div>
      <div className="mx-auto max-w-[1350px] px-4 lg:px-6 pt-8 pb-12">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold">Markets</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered prediction market intelligence</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} />
        </div>

        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Trending</span>
              <Link href="/markets" className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-10">
              {topMarkets.map((market, i) => (
                <motion.div key={market.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015, duration: 0.2 }}>
                  <MarketCard market={market} index={i} />
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-10">
              {cryptoMarkets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Crypto</span>
                    <Link href="/markets?category=Crypto" className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      View all <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {cryptoMarkets.map((market, i) => (
                      <motion.div key={market.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.2 }}>
                        <MarketCard market={market} index={i} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {politicsMarkets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Politics</span>
                    <Link href="/markets?category=Politics" className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                      View all <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {politicsMarkets.map((market, i) => (
                      <motion.div key={market.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.2 }}>
                        <MarketCard market={market} index={i} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pm-card p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                AI-powered signal generation with edge calculations, confidence scoring, and full reasoning traces.
              </p>
              <Link
                href="/signals"
                className="inline-flex items-center justify-center h-9 px-5 text-sm font-semibold rounded-lg bg-primary text-white hover:brightness-110 transition-all shrink-0"
              >
                View Signals
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
