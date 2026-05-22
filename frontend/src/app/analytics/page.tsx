"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeInView } from "@/components/fade-in-view"
import { BarChart3, Brain, Target, TrendingUp, LineChart as LineChartIcon, LayoutGrid, Play, Download } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Scatter, ScatterChart } from "recharts"

type AccuracyStats = {
  total_predictions: number
  resolved_predictions: number
  brier_score: number | null
  win_rate: number | null
  calibration: { bin: string; avg_predicted: number | null; avg_actual: number | null; count: number }[]
}

type ModelPerformance = {
  model_version: string
  total_predictions: number
  resolved_predictions: number
  avg_brier_score: number | null
  win_rate: number | null
  avg_edge: number | null
}

type ModelsResponse = { models: ModelPerformance[] }

type BacktestResult = {
  strategy: string
  total_trades: number
  winning_trades: number
  win_rate: number
  total_return_pct: number
  max_drawdown_pct: number
  sharpe_ratio: number | null
}

export default function AnalyticsPage() {
  const [accuracy, setAccuracy] = useState<AccuracyStats | null>(null)
  const [models, setModels] = useState<ModelPerformance[]>([])
  const [backtest, setBacktest] = useState<BacktestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        setError(null)
        const [accuracyData, modelsData] = await Promise.all([
          api.getAccuracy() as Promise<AccuracyStats>,
          api.getModels() as Promise<ModelsResponse>,
        ])
        setAccuracy(accuracyData)
        setModels(modelsData.models)
        try { setBacktest(await api.getBacktest({ strategy: "kelly" }) as BacktestResult) } catch (_) { }
        setLastUpdated(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally { setIsLoading(false) }
    }
    fetchData()
  }, [])

  const accuracyData = useMemo(() => accuracy?.calibration?.map((b) => ({ month: b.bin, accuracy: Math.round(((b.avg_actual ?? 0) * 100) * 10) / 10, signals: b.count })) || [], [accuracy])
  const calibrationData = useMemo(() => accuracy?.calibration?.map((b) => ({ predicted: Math.round(((b.avg_predicted ?? 0) * 100) * 10) / 10, actual: Math.round(((b.avg_actual ?? 0) * 100) * 10) / 10, perfect: Math.round(((b.avg_predicted ?? 0) * 100) * 10) / 10 })) || [], [accuracy])
  const modelComparison = useMemo(() => models.map((m) => ({ name: m.model_version, accuracy: m.win_rate ? Math.round(m.win_rate * 1000) / 10 : 0, brierScore: m.avg_brier_score ?? 0, signals: m.total_predictions, sharpe: m.avg_edge ?? 0 })), [models])
  const backtestResults = useMemo(() => backtest ? [{ strategy: backtest.strategy, return: backtest.total_return_pct, sharpe: backtest.sharpe_ratio ?? 0, maxDD: backtest.max_drawdown_pct, trades: backtest.total_trades }] : [], [backtest])

  if (isLoading) return <div className="min-h-screen"><div className="mx-auto max-w-7xl px-4 pt-6"><div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Loading analytics...</div></div></div>

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Model performance and market analytics</p>
          </div>
          <PolymarketBadge lastUpdated={lastUpdated} />
        </motion.div>

        {error && <div className="rounded-lg border border-border bg-card p-6 text-sm text-down mb-6">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Brier Score", value: accuracy?.brier_score !== null ? accuracy!.brier_score!.toFixed(3) : "--", desc: "Lower is better", icon: Target },
            { label: "Win Rate", value: accuracy?.win_rate !== null ? `${(accuracy!.win_rate! * 100).toFixed(1)}%` : "--", desc: "All time", icon: TrendingUp },
            { label: "Total Signals", value: accuracy?.total_predictions ? accuracy.total_predictions.toLocaleString() : "--", desc: "All time", icon: BarChart3 },
            { label: "Avg Edge", value: models.length ? `${(models.reduce((s, m) => s + (m.avg_edge ?? 0), 0) / models.length * 100).toFixed(2)}%` : "--", desc: "Per signal", icon: Brain },
          ].map((item, i) => (
            <FadeInView key={item.label} delay={i * 0.05}>
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
                    <item.icon className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="text-2xl font-bold font-number">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>

        <Tabs defaultValue="accuracy" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
          </TabsList>

          <TabsContent value="accuracy">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LineChartIcon className="h-4 w-4 text-primary" />Accuracy Over Time</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={accuracyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[85, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar yAxisId="right" dataKey="signals" fill="hsl(var(--primary) / 0.1)" name="Signals" />
                        <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Accuracy" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" />Calibration</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="predicted" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <YAxis dataKey="actual" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: any) => `${v}%`} />
                        <Scatter data={calibrationData} fill="hsl(var(--primary))" name="Actual" line={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }} shape="circle" />
                        <Line data={calibrationData} dataKey="perfect" stroke="hsl(var(--border))" strokeDasharray="5 5" name="Perfect" dot={false} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-primary rounded" />Actual</span>
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-border rounded" />Perfect</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="models">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />Model Comparison</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                        <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Accuracy</th>
                        <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Brier</th>
                        <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Signals</th>
                        <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Edge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelComparison.length ? modelComparison.map((m) => (
                        <tr key={m.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-3"><span className={cn("font-medium", m.name === "Ensemble" && "text-primary")}>{m.name}</span></td>
                          <td className="py-3 px-3 text-right font-number">{m.accuracy}%</td>
                          <td className="py-3 px-3 text-right font-number text-muted-foreground">{m.brierScore}</td>
                          <td className="py-3 px-3 text-right font-number">{m.signals.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-number">{m.sharpe}</td>
                        </tr>
                      )) : <tr><td className="py-4 px-3 text-sm text-muted-foreground" colSpan={5}>No model data yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backtest">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Play className="h-4 w-4 text-primary" />Backtest Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Strategy</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Return</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sharpe</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Max DD</th>
                          <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Trades</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backtestResults.length ? backtestResults.map((bt) => (
                          <tr key={bt.strategy} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-2 font-medium">{bt.strategy}</td>
                            <td className="py-3 px-2 text-right text-up font-medium font-number">+{bt.return}%</td>
                            <td className="py-3 px-2 text-right font-number">{bt.sharpe}</td>
                            <td className="py-3 px-2 text-right text-down font-number">{bt.maxDD}%</td>
                            <td className="py-3 px-2 text-right font-number">{bt.trades}</td>
                          </tr>
                        )) : <tr><td className="py-4 px-2 text-sm text-muted-foreground" colSpan={5}>No backtest data yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Button size="sm" className="gap-1.5"><Play className="h-3.5 w-3.5" />Run</Button>
                    <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />Export</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Returns</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={backtestResults} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="strategy" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: any) => [`${v}%`, "Return"]} />
                        <Bar dataKey="return" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
