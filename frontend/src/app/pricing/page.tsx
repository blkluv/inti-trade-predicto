"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FadeInView } from "@/components/fade-in-view"
import { CheckCircle2, XCircle, TrendingUp, HelpCircle, Zap, Shield, Headphones } from "lucide-react"

const tiers = [
  {
    name: "Free",
    price: "$0",
    desc: "Get started with basic signals",
    features: [
      { name: "Signals per day", value: "5", free: true, pro: true, enterprise: true },
      { name: "Signal delay", value: "24 hours", free: true, pro: true, enterprise: true },
      { name: "Basic metrics", value: true, free: true, pro: true, enterprise: true },
      { name: "Email alerts", value: true, free: true, pro: true, enterprise: true },
      { name: "Real-time delivery", value: false, free: false, pro: true, enterprise: true },
      { name: "Full reasoning traces", value: false, free: false, pro: true, enterprise: true },
      { name: "API access", value: false, free: false, pro: true, enterprise: true },
      { name: "Kelly sizing calculator", value: false, free: false, pro: true, enterprise: true },
      { name: "Priority support", value: false, free: false, pro: true, enterprise: true },
      { name: "Custom models", value: false, free: false, pro: false, enterprise: true },
      { name: "Dedicated infrastructure", value: false, free: false, pro: false, enterprise: true },
      { name: "White-label options", value: false, free: false, pro: false, enterprise: true },
      { name: "SLA guarantee", value: false, free: false, pro: false, enterprise: true },
      { name: "Team accounts", value: false, free: false, pro: false, enterprise: true },
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    desc: "For serious traders",
    features: [
      { name: "Signals per day", value: "Unlimited", free: false, pro: true, enterprise: true },
      { name: "Signal delay", value: "Real-time", free: false, pro: true, enterprise: true },
      { name: "Basic metrics", value: true, free: true, pro: true, enterprise: true },
      { name: "Email alerts", value: true, free: true, pro: true, enterprise: true },
      { name: "Real-time delivery", value: true, free: false, pro: true, enterprise: true },
      { name: "Full reasoning traces", value: true, free: false, pro: true, enterprise: true },
      { name: "API access", value: true, free: false, pro: true, enterprise: true },
      { name: "Kelly sizing calculator", value: true, free: false, pro: true, enterprise: true },
      { name: "Priority support", value: true, free: false, pro: true, enterprise: true },
      { name: "Custom models", value: true, free: false, pro: true, enterprise: true },
      { name: "Dedicated infrastructure", value: true, free: false, pro: true, enterprise: true },
      { name: "White-label options", value: true, free: false, pro: true, enterprise: true },
      { name: "SLA guarantee", value: true, free: false, pro: true, enterprise: true },
      { name: "Team accounts", value: true, free: false, pro: true, enterprise: true },
    ],
    cta: "Start Pro",
    highlighted: true,
  },
]

const faqs = [
  { q: "Can I upgrade from Free to Pro anytime?", a: "Yes. Upgrade instantly from your dashboard. All your data and settings carry over." },
  { q: "Do you offer refunds?", a: "Pro plans come with a 14-day money-back guarantee. No questions asked." },
  { q: "Can I use the API for commercial purposes?", a: "Yes, the Pro plan includes commercial API usage rights." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards and crypto (USDC)." },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-primary/20 bg-primary/10 text-primary mb-4">
            <Zap className="h-3.5 w-3.5" />
            Simple Pricing
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more power. All plans include core AI intelligence.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 bg-muted rounded-lg p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual <span className="text-primary text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto mb-20">
          {tiers.map((tier, i) => (
            <FadeInView key={tier.name} delay={i * 0.1}>
              <Card className={cn(
                "relative border-border/50",
                tier.highlighted && "border-primary/30"
              )}>
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="yellow" className="px-3 py-1">RECOMMENDED</Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {annual ? (tier.price === "$0" ? "$0" : `$${Math.round(parseInt(tier.price.slice(1)) * 0.8)}`) : tier.price}
                    </span>
                    {tier.price !== "$0" && <span className="text-sm text-muted-foreground">/month</span>}
                  </div>
                  {annual && tier.price !== "$0" && (
                    <p className="text-xs text-primary mt-1">Billed annually (${Math.round(parseInt(tier.price.slice(1)) * 0.8 * 12)}/yr)</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{tier.desc}</p>

                  <div className="mt-8 space-y-4">
                    {tier.features.map((feature) => (
                      <div key={feature.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{feature.name}</span>
                        {typeof feature.value === "boolean" ? (
                          feature.value ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )
                        ) : (
                          <span className="font-medium text-xs">{feature.value as string}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    className={cn(
                      "mt-8 w-full h-11",
                      tier.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    )}
                    variant={tier.highlighted ? "default" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <FadeInView className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          </FadeInView>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <FadeInView key={faq.q} delay={0.05}>
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <h3 className="font-medium text-sm">{faq.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              </FadeInView>
            ))}
          </div>

          <FadeInView delay={0.1}>
            <Card className="border-border/50 mt-8 bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Headphones className="h-6 w-6 text-primary mx-auto mb-3" />
                <h3 className="font-semibold">Have more questions?</h3>
                <p className="text-sm text-muted-foreground mt-1">Contact our support team for any other queries.</p>
                <Button variant="outline" className="mt-4">Contact Support</Button>
              </CardContent>
            </Card>
          </FadeInView>
        </div>
      </div>
    </div>
  )
}
