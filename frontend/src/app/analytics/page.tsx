"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
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

const accuracyData = [
  { month: "Jan", accuracy: 92, signals: 420 },
  { month: "Feb", accuracy: 91, signals: 480 },
  { month: "Mar", accuracy: 94, signals: 510 },
  { month: "Apr", accuracy: 93, signals: 540 },
  { month: "May", accuracy: 95, signals: 580 },
  { month: "Jun", accuracy: 94, signals: 600 },
]

const calibrationData = [
  { predicted: 10, actual: 8, perfect: 10 },
  { predicted: 20, actual: 18, perfect: 20 },
  { predicted: 30, actual: 28, perfect: 30 },
  { predicted: 40, actual: 38, perfect: 40 },
  { predicted: 50, actual: 48, perfect: 50 },
  { predicted: 60, actual: 62, perfect: 60 },
  { predicted: 70, actual: 72, perfect: 70 },
  { predicted: 80, actual: 82, perfect: 80 },
  { predicted: 90, actual: 88, perfect: 90 },
]

const modelComparison = [
  { name: "Ensemble", accuracy: 94.2, brierScore: 0.042, signals: 3200, sharpe: 1.84 },
  { name: "GPT-4o", accuracy: 91.5, brierScore: 0.051, signals: 2800, sharpe: 1.52 },
  { name: "Claude 3.5", accuracy: 92.8, brierScore: 0.048, signals: 2900, sharpe: 1.63 },
  { name: "Gemini", accuracy: 89.2, brierScore: 0.058, signals: 2400, sharpe: 1.31 },
]

const backtestResults = [
  { strategy: "Top 10 by Edge", return: 42.5, sharpe: 1.92, maxDD: -8.2, trades: 340 },
  { strategy: "Kelly Sized", return: 38.2, sharpe: 1.84, maxDD: -6.8, trades: 280 },
  { strategy: "Equal Weight", return: 31.8, sharpe: 1.45, maxDD: -12.4, trades: 310 },
  { strategy: "High Conviction", return: 45.1, sharpe: 1.71, maxDD: -14.2, trades: 120 },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-2 text-muted-foreground">Deep dive into model performance and market analytics</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Brier Score", value: "0.042", desc: "Lower is better", icon: Target },
            { label: "Overall Win Rate", value: "94.2%", desc: "Last 30 days", icon: TrendingUp },
            { label: "Total Signals", value: "3,200+", desc: "All time", icon: BarChart3 },
            { label: "Avg Edge", value: "+4.8%", desc: "Per signal", icon: Brain },
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
                        {modelComparison.map((model) => (
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
                        ))}
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
                          {backtestResults.map((bt) => (
                            <tr key={bt.strategy} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-2 font-medium">{bt.strategy}</td>
                              <td className="py-3 px-2 text-right text-up font-medium tabular-nums">+{bt.return}%</td>
                              <td className="py-3 px-2 text-right tabular-nums">{bt.sharpe}</td>
                              <td className="py-3 px-2 text-right text-down tabular-nums">{bt.maxDD}%</td>
                              <td className="py-3 px-2 text-right tabular-nums">{bt.trades}</td>
                            </tr>
                          ))}
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
