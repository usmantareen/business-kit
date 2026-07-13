"use client"

import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js"
import { useSyncExternalStore } from "react"
import type { Document } from "@/src/types"

ChartJS.register(ArcElement, Tooltip)

function readVar(name: string): string {
  if (typeof window === "undefined") return ""
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function useCSSVar(name: string): string {
  return useSyncExternalStore(
    (cb) => {
      if (typeof document === "undefined") return () => {}
      const observer = new MutationObserver(cb)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
      return () => observer.disconnect()
    },
    () => readVar(name),
    () => ""
  )
}

interface StatusBreakdownProps {
  documents: Document[]
}

const STATUS_META: Record<string, { label: string; shade: number }> = {
  paid: { label: "Paid", shade: 0 },
  pending: { label: "Pending", shade: 1 },
  overdue: { label: "Overdue", shade: 2 },
  draft: { label: "Draft", shade: 3 },
  cancelled: { label: "Cancelled", shade: 4 },
}

const SHADE_FILL: Record<number, { bg: string; stroke: string }> = {
  0: { bg: "hsl(0 0% 9%)", stroke: "hsl(0 0% 100%)" },
  1: { bg: "hsl(0 0% 30%)", stroke: "hsl(0 0% 100%)" },
  2: { bg: "hsl(0 0% 50%)", stroke: "hsl(0 0% 100%)" },
  3: { bg: "hsl(0 0% 70%)", stroke: "hsl(0 0% 100%)" },
  4: { bg: "hsl(0 0% 85%)", stroke: "hsl(0 0% 100%)" },
}

export function StatusBreakdown({ documents }: StatusBreakdownProps) {
  const borderColor = useCSSVar("--border")

  const counts: Record<string, number> = { paid: 0, pending: 0, overdue: 0, draft: 0, cancelled: 0 }
  for (const d of documents) {
    counts[d.status] = (counts[d.status] || 0) + 1
  }
  const total = documents.length

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No invoices yet
      </div>
    )
  }

  const labels: string[] = []
  const data: number[] = []
  const colors: string[] = []
  for (const key of Object.keys(STATUS_META)) {
    if (counts[key] > 0) {
      labels.push(STATUS_META[key].label)
      data.push(counts[key])
      colors.push(SHADE_FILL[STATUS_META[key].shade].bg)
    }
  }

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderColor: borderColor || SHADE_FILL[0].stroke,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "hsl(0 0% 9%)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 8,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed / total) * 100).toFixed(0)}%)`,
        },
      },
    },
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <Doughnut data={chartData} options={options} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-xl font-semibold tabular-nums">{total}</p>
        </div>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {labels.map((label, i) => {
          const count = data[i]
          const pct = ((count / total) * 100).toFixed(0)
          return (
            <li key={label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-foreground/80">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                {label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {count} <span className="text-foreground/50">· {pct}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
