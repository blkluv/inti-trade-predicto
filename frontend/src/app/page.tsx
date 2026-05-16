"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FadeInView } from "@/components/fade-in-view"
import {
  TrendingUp, Shield, BarChart3, Brain, Zap, Globe, Target,
  CheckCircle2, ChevronRight, ArrowUpRight, Activity, Layers,
} from "lucide-react"

const stats = [
  { value: "94.2%", label: "Prediction Accuracy", sub: "30-day rolling average" },
  { value: "$12.4M", label: "Tracked Volume", sub: "Across all major markets" },
  { value: "3,200+", label: "Signals Generated", sub: "And counting" },
  { value: "< 2s", label: "Signal Latency", sub: "Real-time intelligence" },
]

const steps = [
  { icon: Globe, title: "Connect Markets", desc: "Seamlessly connect to Polymarket, Kalshi, and other prediction platforms via our API.", number: "01" },
  { icon: Brain, title: "AI Analysis", desc: "Our ensemble of LLMs analyzes news, on-chain data, and market sentiment in real-time.", number: "02" },
  { icon: Zap, title: "Smart Signals", desc: "Get actionable trade signals with edge calculations, Kelly sizing, and full reasoning traces.", number: "03" },
]

const features = [
  { icon: BarChart3, title: "Real-time Intelligence", desc: "Live signal generation with millisecond latency across all supported markets." },
  { icon: Globe, title: "Multi-market Coverage", desc: "Polymarket, Kalshi, PredictIt, and more — all in one unified dashboard." },
  { icon: Target, title: "Smart Position Sizing", desc: "Kelly criterion-based sizing with configurable risk parameters and drawdown protection." },
  { icon: Layers, title: "Full Reasoning Traces", desc: "Every signal includes the complete AI reasoning chain. Audit every prediction." },
]

const plans = [
  { name: "Free", price: "$0", desc: "Get started with basic signals", features: ["5 signals/day", "24h delay", "Basic metrics", "Email alerts"] },
  { name: "Pro", price: "$49", desc: "For serious traders", features: ["Unlimited signals", "Real-time delivery", "Full reasoning traces", "API access", "Kelly sizing calc", "Priority support"], popular: true },
  { name: "Enterprise", price: "$249", desc: "For institutions", features: ["Everything in Pro", "Custom models", "Dedicated infra", "White-label options", "SLA guarantee", "Team accounts"] },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-32 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge variant="edge" className="mb-6 px-4 py-1.5 text-sm">
                <Activity className="mr-1.5 h-3.5 w-3.5" />
                AI-Powered Prediction Intelligence
              </Badge>
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Where intelligence{" "}
              <span className="text-gradient-amber">meets prediction</span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto"
            >
              Harness the power of ensemble AI to discover, analyze, and trade prediction markets
              with institutional-grade intelligence. Real-time signals. Full reasoning transparency.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-10 flex items-center justify-center gap-4 flex-col sm:flex-row"
            >
              <Link href="/signals" className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 glow-amber")}>
                See Live Signals
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
              <Link href="/markets" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base")}>
                Browse Markets
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm card-hover">
                <CardContent className="p-5 text-center">
                  <span className="text-3xl font-bold tracking-tight text-gradient-amber">{stat.value}</span>
                  <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">From raw market data to actionable signals in three steps</p>
          </FadeInView>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <FadeInView key={step.title} delay={i * 0.15}>
                <Card className="relative h-full border-border/50 card-hover overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-4xl font-black text-primary/10">{step.number}</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20 grid-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for serious traders</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to trade prediction markets with confidence</p>
          </FadeInView>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeInView key={feature.title} delay={i * 0.1}>
                <Card className="h-full border-border/50 card-hover">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">Start free, upgrade when you need more power</p>
          </FadeInView>
          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <FadeInView key={plan.name} delay={i * 0.1}>
                <Card className={cn("relative border-border/50 card-hover", plan.popular && "border-primary/30 glow-amber")}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="edge" className="px-3 py-1 text-xs">RECOMMENDED</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.price !== "$0" && <span className="text-sm text-muted-foreground">/month</span>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className={cn("mt-8 w-full", plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")} variant={plan.popular ? "default" : "outline"}>
                      {plan.name === "Free" ? "Get Started" : `Start ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-bold">Inti Trade Predicto</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">AI-powered prediction market intelligence platform.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/markets" className="hover:text-foreground transition-colors">Markets</Link></li>
                <li><Link href="/signals" className="hover:text-foreground transition-colors">Signals</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">About</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Blog</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Careers</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Terms</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
            &copy; 2024 Inti Trade Predicto. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
