"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FadeInView } from "@/components/fade-in-view"
import { Search, TrendingUp, Filter, ArrowUpRight, BarChart3 } from "lucide-react"

const categories = ["All", "Politics", "Crypto", "Sports", "Economics", "Technology", "Science"]

const markets = [
  { id: "1", question: "Will BTC exceed $150k by Q3 2026?", source: "Polymarket", volume: "$2.4M", odds: 62, edge: 8.3, category: "Crypto" },
  { id: "2", question: "Will the Fed cut rates in June 2026?", source: "Kalshi", volume: "$1.8M", odds: 45, edge: 5.1, category: "Economics" },
  { id: "3", question: "Will AI regulation pass in 2026?", source: "Polymarket", volume: "$890K", odds: 38, edge: null, category: "Technology" },
  { id: "4", question: "Will Super Bowl LX MVP be a QB?", source: "Kalshi", volume: "$520K", odds: 78, edge: -2.4, category: "Sports" },
  { id: "5", question: "Will ETH 2.0 staking yield exceed 5%?", source: "Polymarket", volume: "$1.1M", odds: 55, edge: 12.7, category: "Crypto" },
  { id: "6", question: "Will WHO declare new pandemic by 2027?", source: "PredictIt", volume: "$340K", odds: 22, edge: null, category: "Science" },
  { id: "7", question: "Will US GDP growth exceed 3% in Q2?", source: "Kalshi", volume: "$2.1M", odds: 41, edge: 3.8, category: "Economics" },
  { id: "8", question: "Will a US state adopt Bitcoin reserves?", source: "Polymarket", volume: "$760K", odds: 18, edge: 6.2, category: "Crypto" },
]

export default function MarketsPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered = markets.filter((m) => {
    const matchSearch = m.question.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === "All" || m.category === activeCategory
    return matchSearch && matchCategory
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
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <p className="mt-2 text-muted-foreground">Browse and analyze prediction markets across all platforms</p>
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
          </div>
        </div>

        <div className="grid gap-px bg-border rounded-lg overflow-hidden sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((market, i) => (
            <FadeInView key={market.id} delay={i * 0.03}>
              <Link href={`/markets/${market.id}`}>
                <div className="bg-card p-5 h-full transition-colors hover:bg-muted cursor-pointer flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">{market.source}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {market.volume}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium leading-relaxed flex-1 mb-4">
                    {market.question}
                  </h3>
                  <div className="space-y-3 mt-auto">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>YES</span>
                        <span className="font-semibold font-mono text-foreground">{market.odds}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-up"
                          style={{ width: `${market.odds}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {market.edge !== null ? (
                        <span className={cn("text-xs font-mono font-semibold", market.edge > 0 ? "text-up" : "text-down")}>
                          {market.edge > 0 ? "+" : ""}{market.edge}% edge
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No AI edge</span>
                      )}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </FadeInView>
          ))}
        </div>

        {filtered.length === 0 && (
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
