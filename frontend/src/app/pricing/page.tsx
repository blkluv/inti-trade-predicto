"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FadeInView } from "@/components/fade-in-view"
import { CheckCircle2, XCircle, Zap, Headphones } from "lucide-react"

const tiers = [
  {
    name: "Free", price: "$0", desc: "Get started with basic signals",
    features: [
      { name: "Signals per day", value: "5" },
      { name: "Signal delay", value: "24 hours" },
      { name: "Basic metrics", value: true },
      { name: "Real-time delivery", value: false },
      { name: "Full reasoning traces", value: false },
      { name: "API access", value: false },
      { name: "Priority support", value: false },
    ],
    cta: "Get Started Free", highlighted: false,
  },
  {
    name: "Pro", price: "$49", desc: "For serious traders",
    features: [
      { name: "Signals per day", value: "Unlimited" },
      { name: "Signal delay", value: "Real-time" },
      { name: "Basic metrics", value: true },
      { name: "Real-time delivery", value: true },
      { name: "Full reasoning traces", value: true },
      { name: "API access", value: true },
      { name: "Priority support", value: true },
    ],
    cta: "Start Pro", highlighted: true,
  },
]

const faqs = [
  { q: "Can I upgrade from Free to Pro anytime?", a: "Yes. Upgrade instantly from your dashboard." },
  { q: "Do you offer refunds?", a: "Pro plans come with a 14-day money-back guarantee." },
  { q: "Can I use the API for commercial purposes?", a: "Yes, Pro includes commercial API usage." },
  { q: "What payment methods do you accept?", a: "All major credit cards and crypto (USDC)." },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-primary/20 bg-primary/10 text-primary mb-4">
            <Zap className="h-3.5 w-3.5" />Simple Pricing
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more power.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 bg-muted rounded-lg p-1">
            <button onClick={() => setAnnual(false)} className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all", !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all", annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Annual <span className="text-primary text-xs ml-1">Save 20%</span></button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 max-w-3xl mx-auto mb-16">
          {tiers.map((tier, i) => (
            <FadeInView key={tier.name} delay={i * 0.1}>
              <Card className={cn("relative border-border", tier.highlighted && "border-primary/30")}>
                {tier.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge variant="yellow" className="px-3 py-1">RECOMMENDED</Badge></div>}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{annual && tier.price !== "$0" ? `$${Math.round(parseInt(tier.price.slice(1)) * 0.8)}` : tier.price}</span>
                    {tier.price !== "$0" && <span className="text-sm text-muted-foreground">/month</span>}
                  </div>
                  {annual && tier.price !== "$0" && <p className="text-xs text-primary mt-1">Billed annually</p>}
                  <p className="mt-2 text-sm text-muted-foreground">{tier.desc}</p>
                  <div className="mt-6 space-y-3">
                    {tier.features.map((f) => (
                      <div key={f.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{f.name}</span>
                        {typeof f.value === "boolean" ? (
                          f.value ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                        ) : <span className="font-medium text-xs">{f.value as string}</span>}
                      </div>
                    ))}
                  </div>
                  <Button className={cn("mt-6 w-full h-11", tier.highlighted ? "" : "")} variant={tier.highlighted ? "default" : "outline"}>{tier.cta}</Button>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">FAQs</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FadeInView key={faq.q} delay={0.05}>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm">{faq.q}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>
          <FadeInView delay={0.1}>
            <Card className="border-border mt-6 bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Headphones className="h-5 w-5 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Have more questions?</h3>
                <Button variant="outline" className="mt-3">Contact Support</Button>
              </CardContent>
            </Card>
          </FadeInView>
        </div>
      </div>
    </div>
  )
}
