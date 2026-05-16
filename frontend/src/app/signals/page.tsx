"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FadeInView } from "@/components/fade-in-view"
import { Brain, Zap, RefreshCw, TrendingUp, TrendingDown, Clock, ArrowUpRight } from "lucide-react"

const allSignals = [
  { id: "1", question: "Will BTC exceed $150k by Q3 2026?", edge: 12.7, confidence: 78, predictedProb: 68, marketProb: 55, side: "YES", market: "Polymarket", reasoning: "Strong on-chain accumulation detected. Institutional inflows at ATH levels. Historical pre-halving patterns suggest upside.", timestamp: "2 min ago" },
  { id: "2", question: "Will Fed cut rates in June 2026?", edge: 8.3, confidence: 72, predictedProb: 65, marketProb: 57, side: "YES", market: "Kalshi", reasoning: "CPI trending below 3% threshold. Fed minutes show dovish language. Market under-pricing probability.", timestamp: "5 min ago" },
  { id: "3", question: "Will US GDP exceed 3% in Q2 2026?", edge: 6.8, confidence: 65, predictedProb: 42, marketProb: 35, side: "YES", market: "Kalshi", reasoning: "Consumer spending resilient. Manufacturing PMI expansionary. Labor market tight.", timestamp: "12 min ago" },
  { id: "4", question: "Will AI regulation pass in 2026?", edge: 5.2, confidence: 58, predictedProb: 44, marketProb: 38, side: "YES", market: "Polymarket", reasoning: "Bipartisan support growing. EU AI Act creating precedent. Industry lobbying for clear rules.", timestamp: "18 min ago" },
  { id: "5", question: "Will US state adopt Bitcoin reserves?", edge: 4.5, confidence: 62, predictedProb: 23, marketProb: 18, side: "YES", market: "Polymarket", reasoning: "Multiple state-level bills introduced. Sovereign wealth fund interest rising.", timestamp: "25 min ago" },
  { id: "6", question: "Will ETH staking yield exceed 5%?", edge: 3.9, confidence: 55, predictedProb: 59, marketProb: 55, side: "YES", market: "Polymarket", reasoning: "Network activity increasing. EIP improvements boosting fee revenue.", timestamp: "30 min ago" },
  { id: "7", question: "Will Super Bowl MVP be a QB?", edge: -2.4, confidence: 45, predictedProb: 72, marketProb: 74, side: "NO", market: "Kalshi", reasoning: "Defensive player odds improving. Analytics suggest spread of votes.", timestamp: "45 min ago" },
  { id: "8", question: "Will WHO declare pandemic by 2027?", edge: 1.8, confidence: 35, predictedProb: 24, marketProb: 22, side: "YES", market: "PredictIt", reasoning: "Surveillance data shows novel pathogen monitoring increased.", timestamp: "1h ago" },
]

export default function SignalsPage() {
  const [minEdge, setMinEdge] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filtered = allSignals
    .filter((s) => s.edge >= minEdge)
    .sort((a, b) => b.edge - a.edge)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Signals</h1>
            <p className="mt-2 text-muted-foreground">Real-time AI-powered trade signals, sorted by edge</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Min edge:</span>
              <Input
                type="number"
                value={minEdge}
                onChange={(e) => setMinEdge(Number(e.target.value))}
                className="w-16 h-8 text-sm text-center"
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <div className="space-y-px bg-border rounded-lg overflow-hidden">
          {filtered.map((signal, i) => (
            <FadeInView key={signal.id} delay={i * 0.03}>
              <Link href={`/markets/${signal.id}`}>
                <div className={cn(
                  "bg-card p-5 transition-colors hover:bg-muted cursor-pointer block",
                )}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px] items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={signal.side === "YES" ? "up" : "down"} className="text-xs">
                          {signal.side === "YES" ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                          {signal.side}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{signal.market}</Badge>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{signal.question}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{signal.reasoning}</p>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-lg font-bold font-mono", signal.edge > 0 ? "text-up" : "text-down")}>
                          {signal.edge > 0 ? "+" : ""}{signal.edge}%
                        </span>
                        <span className="text-xs text-muted-foreground">edge</span>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Confidence</span>
                          <span className="font-mono">{signal.confidence}%</span>
                        </div>
                        <Progress value={signal.confidence} className="h-1.5" />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>AI: <span className="text-primary font-medium font-mono">{signal.predictedProb}%</span></span>
                        <span>Market: <span className="text-foreground font-medium font-mono">{signal.marketProb}%</span></span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {signal.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeInView>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No signals match your filter criteria</p>
            <p className="text-sm mt-1">Try lowering the minimum edge threshold</p>
          </div>
        )}
      </div>
    </div>
  )
}
