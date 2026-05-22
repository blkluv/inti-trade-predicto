"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeInView } from "@/components/fade-in-view"
import {
  BarChart3, Brain, Target, TrendingUp, LineChart as LineChartIcon,
  LayoutGrid, Play, Download, Clock
} from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ComposedChart, Scatter, ScatterChart,
  ZAxis,
} from "recharts"

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

type ModelsResponse = {
  models: ModelPerformance[]
}

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
    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        setError(null)
        const [accuracyData, modelsData] = await Promise.all([
          api.getAccuracy() as Promise<AccuracyStats>,
          api.getModels() as Promise<ModelsResponse>,
        ])
        setAccuracy(accuracyData)
        setModels(modelsData.models)
        try {
          const backtestData = await api.getBacktest({ strategy: "kelly" }) as BacktestResult
          setBacktest(backtestData)
        } catch (err) {
          setBacktest(null)
        }
        setLastUpdated(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const accuracyData = useMemo(() => {
    if (!accuracy?.calibration) return []
    return accuracy.calibration.map((bucket) => ({
      month: bucket.bin,
      accuracy: Math.round(((bucket.avg_actual ?? 0) * 100) * 10) / 10,
      signals: bucket.count,
    }))
  }, [accuracy])

  const calibrationData = useMemo(() => {
    if (!accuracy?.calibration) return []
    return accuracy.calibration.map((bucket) => ({
      predicted: Math.round(((bucket.avg_predicted ?? 0) * 100) * 10) / 10,
      actual: Math.round(((bucket.avg_actual ?? 0) * 100) * 10) / 10,
      perfect: Math.round(((bucket.avg_predicted ?? 0) * 100) * 10) / 10,
    }))
  }, [accuracy])

  const modelComparison = useMemo(() => {
    if (!models.length) return []
    return models.map((model) => ({
      name: model.model_version,
      accuracy: model.win_rate ? Math.round(model.win_rate * 1000) / 10 : 0,
      brierScore: model.avg_brier_score ?? 0,
      signals: model.total_predictions,
      sharpe: model.avg_edge ?? 0,
    }))
  }, [models])

  const backtestResults = useMemo(() => {
    if (!backtest) return []
    return [
      {
        strategy: backtest.strategy,
        return: backtest.total_return_pct,
        sharpe: backtest.sharpe_ratio ?? 0,
        maxDD: backtest.max_drawdown_pct,
        trades: backtest.total_trades,
      },
    ]
  }, [backtest])

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
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <PolymarketBadge lastUpdated={lastUpdated} />
          </div>
          <p className="mt-2 text-muted-foreground">Deep dive into model performance and market analytics</p>
        </motion.div>

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground mb-8">
            Loading analytics...
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-down mb-8">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Brier Score", value: accuracy?.brier_score !== null && accuracy?.brier_score !== undefined ? accuracy.brier_score.toFixed(3) : "--", desc: "Lower is better", icon: Target },
            { label: "Overall Win Rate", value: accuracy?.win_rate !== null && accuracy?.win_rate !== undefined ? `${(accuracy.win_rate * 100).toFixed(1)}%` : "--", desc: "Last 30 days", icon: TrendingUp },
            { label: "Total Signals", value: accuracy?.total_predictions ? accuracy.total_predictions.toLocaleString() : "--", desc: "All time", icon: BarChart3 },
            { label: "Avg Edge", value: models.length ? `${(models.reduce((sum, model) => sum + (model.avg_edge ?? 0), 0) / models.length * 100).toFixed(2)}%` : "--", desc: "Per signal", icon: Brain },
          ].map((item, i) => (
            <FadeInView key={item.label} delay={i * 0.05}>
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
                    <item.icon className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>

        <Tabs defaultValue="accuracy" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="accuracy">Accuracy Overview</TabsTrigger>
            <TabsTrigger value="models">Model Comparison</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
          </TabsList>

          <TabsContent value="accuracy">
            <div className="grid gap-8 lg:grid-cols-2">
              <FadeInView direction="none">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4 text-primary" />
                      Accuracy Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={accuracyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} domain={[85, 100]} tickFormatter={(v) => `${v}%`} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: "4px", fontSize: "12px" }}
                          />
                          <Bar yAxisId="right" dataKey="signals" fill="rgba(252,213,53,0.15)" name="Signals" />
                          <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#FCD535" strokeWidth={2.5} dot={{ fill: "#FCD535", r: 4 }} name="Accuracy %" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>

              <FadeInView direction="none" delay={0.1}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      Calibration Curve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                          <XAxis dataKey="predicted" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                          <YAxis dataKey="actual" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: "4px", fontSize: "12px" }}
                            formatter={(value) => `${value}%`}
                          />
                          <Scatter data={calibrationData} fill="#FCD535" name="Actual" line={{ stroke: "#FCD535", strokeWidth: 1 }} shape="circle" />
                          <Line data={calibrationData} dataKey="perfect" stroke="#2b3139" strokeDasharray="5 5" name="Perfect" dot={false} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-primary rounded" />Actual</span>
                      <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-border rounded" />Perfect</span>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>
            </div>
          </TabsContent>

          <TabsContent value="models">
            <FadeInView direction="none">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Model Performance Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                          <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Accuracy</th>
                          <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Brier Score</th>
                          <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Signals</th>
                          <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sharpe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelComparison.length ? modelComparison.map((model) => (
                          <tr key={model.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium",
                                  model.name === "Ensemble" && "text-primary"
                                )}>{model.name}</span>
                                {model.name === "Ensemble" && <Badge variant="yellow" className="text-xs">Best</Badge>}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums">{model.accuracy}%</td>
                            <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">{model.brierScore}</td>
                            <td className="py-3 px-3 text-right tabular-nums">{model.signals.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right tabular-nums font-medium">{model.sharpe}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td className="py-4 px-3 text-sm text-muted-foreground" colSpan={5}>No model data yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>
          </TabsContent>

          <TabsContent value="backtest">
            <div className="grid gap-8 lg:grid-cols-2">
              <FadeInView direction="none">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      Backtest Results
                    </CardTitle>
                  </CardHeader>
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
                            <td className="py-3 px-2 text-right text-up font-medium tabular-nums">+{bt.return}%</td>
                            <td className="py-3 px-2 text-right tabular-nums">{bt.sharpe}</td>
                            <td className="py-3 px-2 text-right text-down tabular-nums">{bt.maxDD}%</td>
                            <td className="py-3 px-2 text-right tabular-nums">{bt.trades}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td className="py-4 px-2 text-sm text-muted-foreground" colSpan={5}>No backtest data yet.</td>
                          </tr>
                        )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      <Button size="sm" className="gap-1.5">
                        <Play className="h-3.5 w-3.5" />
                        Run Backtest
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>

              <FadeInView direction="none" delay={0.1}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Strategy Returns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={backtestResults} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                          <XAxis type="number" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <YAxis type="category" dataKey="strategy" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} width={120} />
                          <Tooltip
                            contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: "4px", fontSize: "12px" }}
                            formatter={(value) => [`${value}%`, "Return"]}
                          />
                          <Bar dataKey="return" fill="#FCD535" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </FadeInView>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
