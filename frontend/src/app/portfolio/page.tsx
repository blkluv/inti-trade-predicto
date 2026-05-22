"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeInView } from "@/components/fade-in-view"
import { Wallet, TrendingUp, TrendingDown, Target, BarChart3, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

const summaryCards = [
  { label: "Balance", value: "$47,320", change: "+$2,180", positive: true, icon: Wallet },
  { label: "Total PnL", value: "+$6,842", change: "+16.9%", positive: true, icon: TrendingUp },
  { label: "Win Rate", value: "68.4%", change: "+2.1%", positive: true, icon: Target },
  { label: "Sharpe", value: "1.84", change: "+0.12", positive: true, icon: BarChart3 },
]

const positions = [
  { market: "BTC > $150k Q3 2026", side: "YES", size: "$4,200", entry: 0.55, current: 0.62, pnl: "+$536", pnlPct: 12.7 },
  { market: "Fed rate cut June 2026", side: "YES", size: "$3,800", entry: 0.57, current: 0.62, pnl: "+$333", pnlPct: 8.8 },
  { market: "US GDP > 3% Q2 2026", side: "NO", size: "$2,100", entry: 0.65, current: 0.58, pnl: "+$226", pnlPct: 10.8 },
  { market: "AI regulation 2026", side: "YES", size: "$1,500", entry: 0.38, current: 0.42, pnl: "+$63", pnlPct: 4.2 },
  { market: "Super Bowl MVP QB", side: "NO", size: "$950", entry: 0.26, current: 0.22, pnl: "+$38", pnlPct: 4.0 },
  { market: "ETH staking > 5%", side: "YES", size: "$2,800", entry: 0.55, current: 0.52, pnl: "-$84", pnlPct: -3.0 },
]

const allocationData = [
  { name: "Crypto", value: 42, color: "#FCD535" },
  { name: "Economics", value: 28, color: "#0ecb81" },
  { name: "Politics", value: 15, color: "#3b82f6" },
  { name: "Sports", value: 10, color: "#8b5cf6" },
  { name: "Science", value: 5, color: "#f6465d" },
]

const pnlHistory = [{ week: "W1", pnl: 1.2 }, { week: "W2", pnl: -0.8 }, { week: "W3", pnl: 2.1 }, { week: "W4", pnl: 1.5 }, { week: "W5", pnl: 2.8 }, { week: "W6", pnl: 1.1 }]

const riskMetrics = [
  { label: "VaR (95%)", value: "$1,240", status: "good" },
  { label: "Max Drawdown", value: "8.2%", status: "good" },
  { label: "Concentration", value: "42%", status: "warning" },
  { label: "Leverage", value: "1.2x", status: "good" },
  { label: "Correlation", value: "0.34", status: "good" },
]

export default function PortfolioPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your positions and performance</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {summaryCards.map((item, i) => (
            <FadeInView key={item.label} delay={i * 0.05}>
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
                    <item.icon className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="text-2xl font-bold font-number">{item.value}</div>
                  <div className={cn("flex items-center gap-1 text-xs mt-1 font-number", item.positive ? "text-up" : "text-down")}>
                    {item.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {item.change}
                  </div>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <FadeInView direction="none" delay={0.1}>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Positions</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Market</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Side</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Entry</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Current</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-2 font-medium truncate max-w-[180px]">{pos.market}</td>
                            <td className="py-3 px-2 text-right"><Badge variant={pos.side === "YES" ? "up" : "down"} className="text-[10px]">{pos.side}</Badge></td>
                            <td className="py-3 px-2 text-right font-number">{pos.size}</td>
                            <td className="py-3 px-2 text-right font-number">{pos.entry.toFixed(2)}</td>
                            <td className="py-3 px-2 text-right font-number">{pos.current.toFixed(2)}</td>
                            <td className={cn("py-3 px-2 text-right font-medium font-number", pos.pnlPct >= 0 ? "text-up" : "text-down")}>{pos.pnl}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>
          </div>

          <div className="space-y-4">
            <FadeInView direction="none" delay={0.1}>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2">Allocation</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                          {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: any, name: any) => [`${value}%`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {allocationData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="ml-auto font-medium font-number">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.15}>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" />Risk</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {riskMetrics.map((m) => (
                    <div key={m.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-number">{m.value}</span>
                        <span className={cn("h-2 w-2 rounded-full", m.status === "good" ? "bg-up" : "bg-primary")} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeInView>
          </div>
        </div>

        <FadeInView delay={0.2}>
          <Card className="border-border">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />PnL History</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pnlHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: any) => [`${v}%`, "PnL"]} />
                    <Line type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </FadeInView>
      </div>
    </div>
  )
}
