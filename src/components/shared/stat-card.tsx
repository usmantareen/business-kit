"use client"

import { type LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/src/lib/utils"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  className?: string
  trend?: { value: string; positive: boolean; neutral?: boolean }
  href?: string
  sparkline?: number[]
}

function MiniSparkline({ values }: { values: number[] }) {
  // Need at least 2 points and some variance to draw a meaningful line.
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  if (max === min) return null
  const range = max - min
  const w = 80
  const h = 28
  const step = w / (values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const path = `M ${points.join(" L ")}`
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`
  const gradId = `spark-${values.join("-").slice(0, 16)}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible text-foreground/70">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  trend,
  href,
  sparkline,
}: StatCardProps) {
  const hasFooter = !!(description || trend)
  const content = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-0.5",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
          {sparkline && <MiniSparkline values={sparkline} />}
        </div>
      </div>
      {/* Footer always rendered to keep cards equal height */}
      <div
        className={cn(
          "mt-3 flex min-h-[20px] items-center gap-2 text-xs",
          !hasFooter && "invisible"
        )}
        aria-hidden={!hasFooter}
      >
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 font-medium",
              trend.neutral
                ? "border-border text-muted-foreground"
                : "border-foreground/20 text-foreground/80"
            )}
          >
            {trend.neutral ? (
              <Minus className="h-3 w-3" />
            ) : trend.positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
        {description && <span className="text-muted-foreground">{description}</span>}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }
  return content
}
