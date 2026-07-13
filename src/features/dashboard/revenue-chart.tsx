"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  type Chart as ChartType,
  type TooltipItem,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { useMemo, useSyncExternalStore } from "react"
import type { Document } from "@/src/types"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

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

interface RevenueChartProps {
  documents: Document[]
  currencySymbol?: string
}

export default function RevenueChart({ documents, currencySymbol = "₹" }: RevenueChartProps) {
  const mutedForeground = useCSSVar("--muted-foreground")
  const border = useCSSVar("--border")
  const foreground = useCSSVar("--foreground")

  const { months, values, total, peak, peakLabel, hasData } = useMemo(() => {
    const paidDocs = documents.filter((d) => d.status === "paid")
    const monthlyData: Record<string, number> = {}
    for (const doc of paidDocs) {
      const month = doc.issueDate?.slice(0, 7) || "unknown"
      monthlyData[month] = (monthlyData[month] || 0) + doc.grandTotal
    }
    const ms = Object.keys(monthlyData).sort()
    const vs = ms.map((m) => monthlyData[m])
    const tot = vs.reduce((a, b) => a + b, 0)
    const peakVal = vs.length ? Math.max(...vs) : 0
    const peakIdx = vs.indexOf(peakVal)
    return {
      months: ms,
      values: vs,
      total: tot,
      peak: peakVal,
      peakLabel: peakIdx >= 0 ? ms[peakIdx] : "",
      hasData: vs.length > 0,
    }
  }, [documents])

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium text-foreground/80">No revenue yet</p>
        <p className="text-xs text-muted-foreground">Mark invoices as paid to see trends here</p>
      </div>
    )
  }

  const lineColor = foreground || "hsl(0 0% 9%)"

  const data = {
    labels: months.map((m: string) => {
      const [y, mo] = m.split("-")
      const date = new Date(Number(y), Number(mo) - 1)
      return date.toLocaleString("default", { month: "short", year: "2-digit" })
    }),
    datasets: [
      {
        fill: true,
        label: "Revenue",
        data: values,
        borderColor: lineColor,
        backgroundColor: (ctx: { chart: ChartType }) => {
          const chart = ctx.chart
          const { ctx: c, chartArea } = chart
          if (!chartArea) return lineColor + "20"
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          g.addColorStop(0, lineColor.replace(")", " / 0.28)").replace("hsl", "hsla"))
          g.addColorStop(1, lineColor.replace(")", " / 0)").replace("hsl", "hsla"))
          return g
        },
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  }

  const fmtCompact = (v: number) => {
    if (v >= 1_00_00_000) return `${currencySymbol}${(v / 1_00_00_000).toFixed(1)}Cr`
    if (v >= 1_00_000) return `${currencySymbol}${(v / 1_00_000).toFixed(1)}L`
    if (v >= 1_000) return `${currencySymbol}${(v / 1_000).toFixed(1)}K`
    return `${currencySymbol}${v.toFixed(0)}`
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "hsl(0 0% 9%)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx: TooltipItem<"line">) => ` ${fmtCompact(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: mutedForeground || "hsl(0 0% 45%)", font: { size: 11 } },
      },
      y: {
        grid: {
          color: (border || "hsl(0 0% 90%)").replace(")", " / 0.5)").replace("hsl", "hsla"),
          drawTicks: false,
        },
        border: { display: false },
        ticks: {
          color: mutedForeground || "hsl(0 0% 45%)",
          font: { size: 11 },
          callback: (v: string | number) => fmtCompact(Number(v)),
          padding: 8,
        },
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
            Lifetime revenue
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {fmtCompact(total)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
            Peak month
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums">
            {peakLabel
              ? new Date(peakLabel + "-01").toLocaleString("default", { month: "long", year: "numeric" })
              : "—"}
            <span className="ml-2 text-muted-foreground">{fmtCompact(peak)}</span>
          </p>
        </div>
      </div>
      <div className="h-56">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
