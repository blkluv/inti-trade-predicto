import Link from "next/link"
import { cn } from "@/lib/utils"

type MarketItem = {
  id: string
  question: string
  category: string | null
  current_odds: number | null
  volume_24h: number
  liquidity: number
  end_date: string | null
  resolved: boolean
  created_at: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }).format(value)

export function MarketCard({ market, index }: { market: MarketItem; index?: number }) {
  const odds = market.current_odds !== null ? Math.round(market.current_odds * 100) : null
  const noOdds = odds !== null ? 100 - odds : null
  const catLabel = market.category || "General"
  const catInitial = catLabel[0]

  return (
    <Link
      href={`/markets/${market.id}`}
      className="pm-card flex flex-col h-full group"
    >
      <div className="flex flex-col gap-3 p-3.5 flex-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] bg-muted text-sm font-bold text-muted-foreground uppercase">
            {catInitial}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              {catLabel}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {market.question}
        </h3>
      </div>

      <div className="px-3.5 pb-3.5 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center h-14 rounded-[8px] bg-up/85 text-white font-semibold">
            <span className="text-[15px] font-bold font-number leading-none">
              {odds !== null ? `${odds}%` : "--"}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider mt-0.5 opacity-90">
              YES
            </span>
          </div>
          <div className="flex flex-col items-center justify-center h-14 rounded-[8px] bg-down/85 text-white font-semibold">
            <span className="text-[15px] font-bold font-number leading-none">
              {noOdds !== null ? `${noOdds}%` : "--"}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider mt-0.5 opacity-90">
              NO
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-number tabular-nums">
            {formatCurrency(market.volume_24h)} Vol
          </span>
          {market.end_date && (
            <span className="text-[11px] text-muted-foreground">
              {new Date(market.end_date).toLocaleDateString([], { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
