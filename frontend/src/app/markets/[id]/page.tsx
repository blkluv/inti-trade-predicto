"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { FadeInView } from "@/components/fade-in-view"
import {
  ArrowLeft, TrendingUp, TrendingDown, Brain, ChevronDown, ChevronUp,
  ExternalLink, Newspaper, BarChart3, MessageCircle, Target
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from "recharts"

const priceHistory = [
  { date: "Jan", yes: 0.45, ai: 0.52 },
  { date: "Feb", yes: 0.48, ai: 0.55 },
  { date: "Mar", yes: 0.52, ai: 0.58 },
  { date: "Apr", yes: 0.55, ai: 0.62 },
  { date: "May", yes: 0.50, ai: 0.60 },
  { date: "Jun", yes: 0.58, ai: 0.65 },
  { date: "Jul", yes: 0.62, ai: 0.68 },
]

const sentimentData = [
  { source: "News", positive: 65, negative: 20, neutral: 15 },
  { source: "Social", positive: 45, negative: 35, neutral: 20 },
  { source: "On-chain", positive: 72, negative: 12, neutral: 16 },
  { source: "Expert", positive: 58, negative: 25, neutral: 17 },
]

const sourceArticles = [
  { title: "Federal Reserve signals potential rate adjustment in June meeting", source: "Reuters", date: "2h ago", sentiment: "positive" },
  { title: "Inflation data comes in softer than expected", source: "Bloomberg", date: "4h ago", sentiment: "positive" },
  { title: "Market analysts split on direction of next FOMC decision", source: "CNBC", date: "6h ago", sentiment: "neutral" },
  { title: "Treasury yields drop amid economic uncertainty", source: "FT", date: "12h ago", sentiment: "positive" },
]

export default function MarketDetailPage() {
  const params = useParams()
  const [showReasoning, setShowReasoning] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FadeInView direction="none">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">Polymarket</Badge>
                    <Badge variant="secondary" className="text-xs">Economics</Badge>
                    <Badge variant="yellow" className="text-xs">
                      <Brain className="mr-1 h-3 w-3" />
                      AI Tracked
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold leading-relaxed">
                    Will the Federal Reserve cut interest rates in June 2026?
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Market predicting whether the Federal Open Market Committee (FOMC) will
                    announce a reduction to the federal funds rate at its June 2026 meeting.
                    Based on CME FedWatch data, economic indicators, and expert analysis.
                  </p>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.1}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Price History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceHistory}>
                        <defs>
                          <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ecb81" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0ecb81" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FCD535" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#848e9c" }} axisLine={false} tickLine={false} domain={[0.3, 0.8]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip
                          contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: "4px", fontSize: "13px" }}
                          formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                        />
                        <Area type="monotone" dataKey="yes" stroke="#0ecb81" fill="url(#yesGrad)" strokeWidth={2} name="Market Price" />
                        <Area type="monotone" dataKey="ai" stroke="#FCD535" fill="url(#aiGrad)" strokeWidth={2} strokeDasharray="5 5" name="AI Prediction" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-up rounded" />Market Price</span>
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-primary rounded" />AI Prediction</span>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.2}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    Source Articles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sourceArticles.map((article, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{article.source} &middot; {article.date}</p>
                      </div>
                      <Badge variant={article.sentiment === "positive" ? "up" : "outline"} className="shrink-0 text-xs capitalize">
                        {article.sentiment}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeInView>
          </div>

          <div className="space-y-6">
            <FadeInView direction="none" delay={0.05}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Prediction Gauge</p>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#FCD535" strokeWidth="8" strokeDasharray={`${(65 / 100) * 339.29} 339.29`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-3xl font-bold text-foreground">65%</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">AI predicts YES with 65% confidence</p>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.1}>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Current Odds</span>
                      <span className="font-semibold">62% YES</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-up" style={{ width: "62%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">AI Prediction</span>
                      <span className="font-semibold text-primary">65% YES</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: "65%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">AI Edge</span>
                      <span className="font-semibold text-primary">+3.0%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: "30%" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.15}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Kelly Sizing</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edge</span>
                      <span className="text-primary font-medium">+3.0%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kelly %</span>
                      <span className="font-medium">4.8%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suggested Size</span>
                      <span className="font-medium">2.4%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <Badge variant="up" className="text-xs">High</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.2}>
              <Card className="border-border/50">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="w-full p-6 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Reasoning Trace</span>
                    </div>
                    {showReasoning ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
                {showReasoning && (
                  <div className="px-6 pb-6">
                    <Separator className="mb-4" />
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p><span className="text-foreground font-medium">Step 1: Data Collection</span><br />Gathered latest economic indicators: CPI at 3.1%, unemployment 3.8%, GDP growth 2.8%.</p>
                      <p><span className="text-foreground font-medium">Step 2: Sentiment Analysis</span><br />Fed minutes show dovish tilt. Market pricing implies 55% chance of cut.</p>
                      <p><span className="text-foreground font-medium">Step 3: Model Ensemble</span><br />GPT-4o: 68% | Claude 3.5: 62% | Gemini: 64% → Ensemble: 65%</p>
                      <p><span className="text-foreground font-medium">Step 4: Edge Calculation</span><br />Market at 62% vs AI at 65%. Positive edge of 3.0% identified.</p>
                    </div>
                  </div>
                )}
              </Card>
            </FadeInView>

            <FadeInView direction="none" delay={0.25}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Sentiment Breakdown</span>
                  </div>
                  <div className="space-y-3">
                    {sentimentData.map((s) => (
                      <div key={s.source}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{s.source}</span>
                          <span className="text-xs">
                            <span className="text-up">{s.positive}%</span>
                            {" / "}
                            <span className="text-down">{s.negative}%</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                          <div className="bg-up h-full" style={{ width: `${s.positive}%` }} />
                          <div className="bg-muted-foreground h-full" style={{ width: `${s.neutral}%` }} />
                          <div className="bg-down h-full" style={{ width: `${s.negative}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeInView>

            <div className="flex gap-3">
              <Link href="#" className="inline-flex items-center justify-center flex-1 h-11 text-sm font-semibold rounded bg-up text-white hover:brightness-110 transition-all">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Buy YES
              </Link>
              <Link href="#" className="inline-flex items-center justify-center flex-1 h-11 text-sm font-semibold rounded bg-down text-white hover:brightness-110 transition-all">
                <TrendingDown className="mr-1.5 h-4 w-4" />
                Buy NO
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
