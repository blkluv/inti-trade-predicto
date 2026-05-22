"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, Menu, X, Search, TrendingUp, BarChart3, Brain, Globe, Gamepad2, Cpu, FileText, Sparkles, MoreHorizontal, Atom } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

const browseSorts = [
  { href: "/markets?sort=trending", label: "Trending" },
  { href: "/markets?sort=new", label: "New" },
  { href: "/markets?sort=popular", label: "Popular" },
  { href: "/markets?sort=liquid", label: "Liquid" },
  { href: "/markets?sort=ending", label: "Ending Soon" },
  { href: "/markets?sort=competitive", label: "Competitive" },
]

const topics = [
  { href: "/markets?category=Politics", label: "Politics", icon: Globe },
  { href: "/markets?category=Crypto", label: "Crypto", icon: Sparkles },
  { href: "/markets?category=Sports", label: "Sports", icon: Gamepad2 },
  { href: "/markets?category=Technology", label: "Tech", icon: Cpu },
  { href: "/markets?category=Science", label: "Science", icon: Atom },
  { href: "/markets?category=Pop%20Culture", label: "Pop Culture", icon: Brain },
]

const moreLinks = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: FileText },
  { href: "/pricing", label: "Pricing", icon: TrendingUp },
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
    const handleClickOutside = (e: MouseEvent) => {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) setBrowseOpen(false)
      if (topicsRef.current && !topicsRef.current.contains(e.target as Node)) setTopicsOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tracking-tight text-foreground">
            Inti<span className="text-primary">Trade</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5 ml-3">
          <div ref={browseRef} className="relative">
            <button
              onClick={() => { setBrowseOpen(!browseOpen); setTopicsOpen(false); setMoreOpen(false) }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded transition-colors"
            >
              Browse
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", browseOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {browseOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-border bg-popover shadow-lg py-1"
                >
                  {browseSorts.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setBrowseOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              Topics
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", topicsOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {topicsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-border bg-popover shadow-lg py-1"
                >
                  {topics.map((topic) => (
                    <Link
                      key={topic.href}
                      href={topic.href}
                      onClick={() => setTopicsOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <topic.icon className="h-4 w-4" />
                      {topic.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-0.5 ml-1 border-l border-border pl-2">
            <Link
              href="/markets"
              className={cn(
                "px-2.5 py-1.5 text-sm font-medium rounded transition-colors",
                pathname === "/markets" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Markets
            </Link>
            <Link
              href="/signals"
              className={cn(
                "px-2.5 py-1.5 text-sm font-medium rounded transition-colors",
                pathname === "/signals" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Signals
            </Link>
          </div>

          <div ref={moreRef} className="relative">
            <button
              onClick={() => { setMoreOpen(!moreOpen); setBrowseOpen(false); setTopicsOpen(false) }}
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-border bg-popover shadow-lg py-1"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link
            href="/markets"
            className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>
          {status === "authenticated" && session ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground max-w-[100px] truncate">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center h-8 px-4 text-sm font-semibold rounded bg-primary text-yellow-foreground hover:brightness-110 transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden ml-auto p-2 text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 py-4 space-y-1">
              <Link href="/markets" onClick={() => setMobileOpen(false)}
                className={cn("block px-3 py-2 text-sm font-medium rounded transition-colors", pathname === "/markets" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                Markets
              </Link>
              <Link href="/signals" onClick={() => setMobileOpen(false)}
                className={cn("block px-3 py-2 text-sm font-medium rounded transition-colors", pathname === "/signals" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                Signals
              </Link>
              <Link href="/analytics" onClick={() => setMobileOpen(false)}
                className={cn("block px-3 py-2 text-sm font-medium rounded transition-colors", pathname === "/analytics" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                Analytics
              </Link>
              <Link href="/portfolio" onClick={() => setMobileOpen(false)}
                className={cn("block px-3 py-2 text-sm font-medium rounded transition-colors", pathname === "/portfolio" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                Portfolio
              </Link>
              <div className="pt-3 space-y-2 border-t border-border mt-3">
                {status === "authenticated" && session ? (
                  <button onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded transition-colors">
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}
                      className="block w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded transition-colors">
                      Sign In
                    </Link>
                    <Link href="/pricing" onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center h-10 px-5 text-sm font-semibold rounded bg-primary text-yellow-foreground">
                      Sign Up
                    </Link>
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
