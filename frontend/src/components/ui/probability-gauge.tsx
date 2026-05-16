"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProbabilityGaugeProps {
  probability: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const sizeConfig = {
  sm: { width: 96, height: 54, strokeWidth: 6, needleLength: 28, labelSize: 11 },
  md: { width: 156, height: 86, strokeWidth: 8, needleLength: 48, labelSize: 16 },
  lg: { width: 216, height: 118, strokeWidth: 10, needleLength: 68, labelSize: 22 },
} as const

export function ProbabilityGauge({
  probability,
  size = "md",
  showLabel = true,
  className,
}: ProbabilityGaugeProps) {
  const config = sizeConfig[size]
  const { width, height, strokeWidth, needleLength, labelSize } = config
  const clampedProb = Math.max(0, Math.min(1, probability))

  const cx = width / 2
  const cy = height - strokeWidth
  const radius = Math.min(cx, cy) - strokeWidth / 2

  const polarToCartesian = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle)
    const end = polarToCartesian(endAngle)
    const diff = endAngle - startAngle
    const largeArcFlag = Math.abs(diff) > 180 ? "1" : "0"
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  const fullArc = describeArc(270, 90)

  const rotation = (clampedProb - 0.5) * 180

  const getColor = (prob: number) => {
    if (prob > 0.6) return "#0ecb81"
    if (prob > 0.4) return "#FCD535"
    return "#f6465d"
  }

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`bg-gauge-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f6465d" />
            <stop offset="50%" stopColor="#FCD535" />
            <stop offset="100%" stopColor="#0ecb81" />
          </linearGradient>
        </defs>

        <path
          d={fullArc}
          fill="none"
          stroke={`url(#bg-gauge-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.12}
        />

        <motion.path
          d={fullArc}
          fill="none"
          stroke={`url(#bg-gauge-${size})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(clampedProb, 0.01) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - needleLength}
            stroke={getColor(clampedProb)}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </motion.g>

        <circle cx={cx} cy={cy} r={4} fill={getColor(clampedProb)} />
        <circle cx={cx} cy={cy} r={1.5} fill="#0b0e11" />
      </svg>

      {showLabel && (
        <span
          className="font-bold font-mono tracking-tight"
          style={{
            color: getColor(clampedProb),
            fontSize: labelSize,
            marginTop: -2,
          }}
        >
          {(clampedProb * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}
