"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface FadeInViewProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  duration?: number
  once?: boolean
}

export function FadeInView({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.5,
  once = true,
}: FadeInViewProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: "-60px" })

  const directionOffset = {
    up: { y: 24 },
    down: { y: -24 },
    left: { x: 24 },
    right: { x: -24 },
    none: {},
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directionOffset[direction] }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
