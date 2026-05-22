"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { PolymarketBadge } from "@/components/polymarket-badge"
import {
  TrendingUp, Shield, BarChart3, Brain, Zap, Globe, Target,
  ChevronRight, ArrowUpRight, Activity, Layers, Check, Sparkles,
  ChevronDown, Lock, Server, Star,
} from "lucide-react"

function FadeInSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      className="font-mono font-bold tracking-tight"
    >
      {isInView ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.01 }}
        >
          <CounterFrom zero={0} to={value} decimals={decimals} />
          {suffix}
        </motion.span>
      ) : (
        <span>0{suffix}</span>
      )}
    </motion.span>
  )
}

function CounterFrom({ zero, to, decimals = 0 }: { zero: number; to: number; decimals?: number }) {
  const [count, setCount] = useState(zero)
  const started = useRef(false)

  useInView(
    { current: null },
    { once: true }
  )

  if (!started.current) {
    started.current = true
    const steps = 30
    const increment = (to - zero) / steps
    let current = zero
    const timer = setInterval(() => {
      current += increment
      if (current >= to) {
        current = to
        clearInterval(timer)
      }
      setCount(current)
    }, 40)
  }

  return <span>{count.toFixed(decimals)}</span>
}

const stats = [
  { value: 94.2, suffix: "%", label: "Prediction Accuracy", sub: "30-day rolling average", decimals: 1 },
  { value: 12.4, suffix: "M", label: "Tracked Volume", sub: "Across all major markets", decimals: 1 },
  { value: 3200, suffix: "+", label: "Signals Generated", sub: "And counting", decimals: 0 },
  { value: 2, suffix: "s", label: "Signal Latency", sub: "Real-time intelligence", decimals: 0 },
]

const steps = [
  { icon: Globe, title: "Connect Polymarket", desc: "Realtime Polymarket data streams directly into your dashboard with US-based routing.", number: "01" },
  { icon: Brain, title: "AI Analysis", desc: "Our ensemble of LLMs analyzes news, on-chain data, and market sentiment in real-time.", number: "02" },
  { icon: Zap, title: "Smart Signals", desc: "Get actionable trade signals with edge calculations, Kelly sizing, and full reasoning traces.", number: "03" },
]

const features = [
  { icon: BarChart3, title: "Real-time Intelligence", desc: "Live signal generation with minute-level refresh from Polymarket." },
  { icon: Globe, title: "Polymarket Coverage", desc: "All markets, one unified Polymarket-native dashboard." },
  { icon: Target, title: "Smart Position Sizing", desc: "Kelly criterion-based sizing with configurable risk parameters and drawdown protection." },
  { icon: Layers, title: "Full Reasoning Traces", desc: "Every signal includes the complete AI reasoning chain. Audit every prediction." },
]

type MarketItem = {
  id: string
  question: string
  current_odds: number | null
  volume_24h: number
  liquidity: number
}

type MarketResponse = {
  items: MarketItem[]
}

type TopMarket = {
  question: string
  yes: number
  volume: string
  liquidity: string
}

const fallbackTopMarkets: TopMarket[] = Array.from({ length: 4 }, () => ({
  question: "Loading live markets from Polymarket...",
  yes: 0,
  volume: "--",
  liquidity: "--",
}))

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

const faqItems = [
  { q: "What is Inti Trade Predicto?", a: "Inti Trade Predicto is an AI-powered prediction market intelligence platform focused on Polymarket, providing actionable trading insights with full reasoning transparency." },
  { q: "How accurate are the signals?", a: "Our ensemble AI system maintains a 94.2% accuracy rate on a 30-day rolling average. We use multiple LLMs cross-validating each other to reduce bias and improve prediction quality." },
  { q: "Which markets do you support?", a: "We currently support Polymarket markets only, delivered in real time via our US-based backend." },
  { q: "Is there a free tier?", a: "Yes! Our Free tier gives you 5 signals per day with 24-hour delay and basic metrics. Upgrade to Pro for unlimited real-time signals with full reasoning traces." },
  { q: "Can I build on top of your API?", a: "Pro and Enterprise tiers include API access. Enterprise customers also get custom models, dedicated infrastructure, and white-label options." },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [topMarkets, setTopMarkets] = useState<TopMarket[]>(fallbackTopMarkets)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchTopMarkets = async () => {
      try {
        const data = await api.getMarkets({ page: "1", page_size: "4" }) as MarketResponse
        const mapped = data.items.map((market) => ({
          question: market.question,
          yes: Math.round((market.current_odds ?? 0) * 100),
          volume: formatCurrency(market.volume_24h),
          liquidity: formatCurrency(market.liquidity),
        }))
        setTopMarkets(mapped.length ? mapped : fallbackTopMarkets)
        setLastUpdated(new Date())
      } catch (err) {
        setTopMarkets(fallbackTopMarkets)
      }
    }

    fetchTopMarkets()
    const interval = setInterval(fetchTopMarkets, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-border bg-card text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-up opacity-75 live-dot" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
                </span>
                AI-Powered Prediction Intelligence
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Trade Prediction Markets with{" "}
              <span className="text-primary">Intelligence</span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Harness ensemble AI to discover, analyze, and trade prediction markets
              with institutional-grade intelligence. Real-time signals. Full reasoning transparency.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 flex items-center justify-center gap-3 flex-col sm:flex-row"
            >
              <Link
                href="/signals"
                className="inline-flex items-center justify-center h-11 px-7 text-sm font-semibold rounded bg-primary text-yellow-foreground hover:brightness-110 transition-all"
              >
                See Live Signals
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link
                href="/markets"
                className="inline-flex items-center justify-center h-11 px-7 text-sm font-semibold rounded border border-border bg-card text-foreground hover:bg-muted transition-all"
              >
                Browse Markets
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card p-5 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl text-foreground">
                  <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <p className="mt-1.5 text-sm font-medium text-foreground">{stat.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-3 text-muted-foreground">From raw market data to actionable signals in three steps</p>
          </FadeInSection>
          <div className="grid gap-px bg-border rounded-lg overflow-hidden sm:grid-cols-3">
            {steps.map((step, i) => (
              <FadeInSection key={step.title} delay={i * 0.15} className="bg-card p-6 sm:p-8">
                <span className="text-3xl font-bold text-muted-foreground/20">{step.number}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mt-4 mb-4">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETS TABLE CARD */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <FadeInSection className="flex flex-wrap items-center justify-between gap-4 mb-6">
             <div>
               <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Trending Markets</h2>
               <p className="mt-1 text-muted-foreground">Top prediction markets by volume</p>
             </div>
             <PolymarketBadge lastUpdated={lastUpdated} />
             <Link
               href="/markets"
               className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
             >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <div className="rounded-lg border border-border overflow-hidden">
               <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px_100px] gap-4 px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-card border-b border-border">
                 <span>Market</span>
                 <span className="text-right">Yes %</span>
                 <span className="text-right">Volume</span>
                 <span className="text-right">Liquidity</span>
               </div>
               {topMarkets.map((market, i) => (
                 <Link
                   key={`${market.question}-${i}`}
                   href="/markets"
                  className={cn(
                    "block px-5 py-4 transition-colors hover:bg-muted",
                    i < topMarkets.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="sm:grid sm:grid-cols-[1fr_120px_120px_100px] sm:gap-4 sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <p className="text-sm font-medium leading-snug">{market.question}</p>
                    </div>
                    <div className="flex sm:block items-center justify-between mt-2 sm:mt-0">
                      <span className="sm:hidden text-xs text-muted-foreground">Yes %</span>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <div className="h-1.5 w-16 sm:w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-up"
                            style={{ width: `${market.yes}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono font-semibold">{market.yes}%</span>
                      </div>
                    </div>
                     <div className="flex sm:block items-center justify-between mt-1 sm:mt-0">
                       <span className="sm:hidden text-xs text-muted-foreground">Volume</span>
                       <span className="text-sm font-mono text-right sm:text-right">{market.volume}</span>
                     </div>
                     <div className="hidden sm:flex items-center justify-end">
                       <span className="text-sm font-mono font-semibold text-muted-foreground">
                         {market.liquidity}
                       </span>
                     </div>
                   </div>
                 </Link>
               ))}
            </div>
            <div className="mt-4 text-center sm:hidden">
              <Link href="/markets" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View All Markets <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Built for Serious Traders</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to trade prediction markets with confidence</p>
          </FadeInSection>
          <div className="grid gap-px bg-border rounded-lg overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.1} className="bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDS SAFU BAND */}
      <section className="border-b border-border py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-bold">Funds Are SAFU</h3>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Your data and signals are protected by enterprise-grade encryption. We never hold your funds —
                trades execute directly on your connected exchange accounts. Industry-standard security
                practices, audited regularly.
              </p>
            </div>
            <div className="flex items-center gap-6 lg:ml-auto shrink-0">
              <div className="text-center">
                <Lock className="h-5 w-5 text-up mx-auto" />
                <span className="text-xs text-muted-foreground mt-1 block">AES-256</span>
              </div>
              <div className="text-center">
                <Server className="h-5 w-5 text-up mx-auto" />
                <span className="text-xs text-muted-foreground mt-1 block">SOC 2</span>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 text-up mx-auto" />
                <span className="text-xs text-muted-foreground mt-1 block">2FA</span>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to know about Inti Trade Predicto</p>
          </FadeInSection>
          <FadeInSection delay={0.1}>
            <div className="space-y-px bg-border rounded-lg overflow-hidden">
              {faqItems.map((item, i) => (
                <div key={i} className="bg-card">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200",
                      openFaq === i && "rotate-180"
                    )} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="rounded-lg bg-card border border-border p-8 sm:p-12 lg:p-16 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto" />
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
              Start Trading Smarter Today
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Join thousands of traders using AI-powered intelligence to make better prediction market decisions.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-col sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center h-11 px-7 text-sm font-semibold rounded bg-primary text-yellow-foreground hover:brightness-110 transition-all"
              >
                Get Started Free
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link
                href="/markets"
                className="inline-flex items-center justify-center h-11 px-7 text-sm font-semibold rounded border border-border bg-background text-foreground hover:bg-muted transition-all"
              >
                Explore Markets
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  )
}
