"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, Search, Menu, X, Sparkles } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

const browseLinks = [
  { href: "/markets?sort=new", label: "New", icon: "new" },
  { href: "/markets", label: "Trending", icon: "trend" },
  { href: "/markets?sort=popular", label: "Popular", icon: "pop" },
  { href: "/markets?sort=liquid", label: "Liquid", icon: "liq" },
  { href: "/markets?sort=ending", label: "Ending Soon", icon: "end" },
  { href: "/markets?sort=competitive", label: "Competitive", icon: "comp" },
]

const topics = [
  { href: "/markets?category=Live%20Crypto", label: "Live Crypto" },
  { href: "/markets?category=Politics", label: "Politics" },
  { href: "/markets?category=Middle%20East", label: "Middle East" },
  { href: "/markets?category=Crypto", label: "Crypto" },
  { href: "/markets?category=Sports", label: "Sports" },
  { href: "/markets?category=Pop%20Culture", label: "Pop Culture" },
  { href: "/markets?category=Tech", label: "Tech" },
  { href: "/markets?category=AI", label: "AI" },
]

const moreLinks = [
  { href: "/analytics", label: "Analytics" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Sign In" },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [topicsOpen, setTopicsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const browseRef = useRef<HTMLDivElement>(null)
  const topicsRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) setBrowseOpen(false)
      if (topicsRef.current && !topicsRef.current.contains(e.target as Node)) setTopicsOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1350px] items-center gap-2 px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-tight">
            Inti<span className="text-primary">Trade</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5">
          <div ref={browseRef} className="relative">
            <button
              onClick={() => { setBrowseOpen(!browseOpen); setTopicsOpen(false); setMoreOpen(false) }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors h-9"
            >
              Browse
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", browseOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {browseOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-border bg-popover shadow-lg py-2 z-50"
                >
                  {browseLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setBrowseOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={topicsRef} className="relative">
            <button
              onClick={() => { setTopicsOpen(!topicsOpen); setBrowseOpen(false); setMoreOpen(false) }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors h-9"
            >
              Topics
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", topicsOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {topicsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 w-52 rounded-xl border border-border bg-popover shadow-lg py-2 z-50"
                >
                  {topics.map((topic) => (
                    <Link
                      key={topic.href}
                      href={topic.href}
                      onClick={() => setTopicsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {topic.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center h-9 border-l border-border ml-1 pl-2 gap-0.5">
            <Link href="/markets" className={cn("px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors", pathname === "/markets" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>Markets</Link>
            <Link href="/signals" className={cn("px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors", pathname === "/signals" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>Signals</Link>
          </div>

          <div ref={moreRef} className="relative">
            <button
              onClick={() => { setMoreOpen(!moreOpen); setBrowseOpen(false); setTopicsOpen(false) }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors h-9"
            >
              More
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", moreOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 w-44 rounded-xl border border-border bg-popover shadow-lg py-2 z-50"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <Link href="/markets" className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <Search className="h-4 w-4" />
          </Link>
          {status === "authenticated" && session ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground max-w-[100px] truncate">{session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">Log out</button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors">Sign In</Link>
              <Link href="/pricing" className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold rounded-lg bg-primary text-white hover:brightness-110 transition-all">Sign Up</Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden ml-auto p-2 text-muted-foreground hover:text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 py-4 space-y-1">
              <Link href="/markets" onClick={() => setMobileOpen(false)} className={cn("block px-3 py-2 text-sm font-medium rounded-md", pathname === "/markets" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>Markets</Link>
              <Link href="/signals" onClick={() => setMobileOpen(false)} className={cn("block px-3 py-2 text-sm font-medium rounded-md", pathname === "/signals" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>Signals</Link>
              <Link href="/analytics" onClick={() => setMobileOpen(false)} className={cn("block px-3 py-2 text-sm font-medium rounded-md", pathname === "/analytics" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>Analytics</Link>
              <Link href="/portfolio" onClick={() => setMobileOpen(false)} className={cn("block px-3 py-2 text-sm font-medium rounded-md", pathname === "/portfolio" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>Portfolio</Link>
              <div className="pt-3 space-y-2 border-t border-border mt-3">
                {status === "authenticated" && session ? (
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors">Sign Out</button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors">Sign In</Link>
                    <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg bg-primary text-white">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
