"use client"

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { Document } from "@/src/types"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

function useCSSVar(name: string): string {
  const { theme } = useTheme()
  const [value, setValue] = useState("")
  useEffect(() => {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    setValue(val || "")
  }, [theme, name])
  return value
}

const statusColors: Record<string, string> = {
  paid: "hsl(142 71% 45%)",
  pending: "hsl(38 92% 50%)",
  overdue: "hsl(0 84.2% 60.2%)",
  draft: "hsl(0 0% 60%)",
  cancelled: "hsl(0 0% 45%)",
}

const statusColorsDark: Record<string, string> = {
  paid: "hsl(142 70% 35%)",
  pending: "hsl(38 92% 40%)",
  overdue: "hsl(0 62.8% 30.6%)",
  draft: "hsl(0 0% 40%)",
  cancelled: "hsl(0 0% 30%)",
}

interface ChartProps { documents: Document[] }

export function RevenueChart({ documents }: ChartProps) {
  const foreground = useCSSVar("--foreground")
  const mutedForeground = useCSSVar("--muted-foreground")
  const border = useCSSVar("--border")

  const paid = documents.filter((d) => d.status === "paid")
  const monthly: Record<string, number> = {}
  for (const doc of paid) {
    const m = doc.issueDate?.slice(0, 7) || "unknown"
    monthly[m] = (monthly[m] || 0) + doc.grandTotal
  }
  const months = Object.keys(monthly).sort()
  const vals = months.map((m) => monthly[m])
  if (!months.length) return null

  const bc = foreground || "hsl(0 0% 9%)"
  const bg = bc.replace(")", " / 0.1)")

  return (
    <div className="h-48">
      <Line data={{
        labels: months.map((m) => {
          const [y, mo] = m.split("-")
          return new Date(Number(y), Number(mo) - 1).toLocaleString("default", { month: "short", year: "2-digit" })
        }),
        datasets: [{
          label: "Revenue", data: vals,
          borderColor: bc, backgroundColor: bg,
          fill: true, tension: 0.4, pointRadius: 3,
        }]
      }} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: mutedForeground || "hsl(0 0% 45%)", font: { size: 11 } } },
          y: { grid: { color: border || "hsl(0 0% 90%)" }, ticks: { color: mutedForeground || "hsl(0 0% 45%)", font: { size: 11 } } },
        },
      }} />
    </div>
  )
}

export function PaymentStatusChart({ documents }: ChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const statusCounts: Record<string, number> = {}
  for (const doc of documents) {
    statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1
  }
  const labels = Object.keys(statusCounts)
  const vals = Object.values(statusCounts)
  if (!labels.length) return null

  const colors = labels.map((l) => {
    if (isDark) return statusColorsDark[l] || "hsl(0 0% 40%)"
    return statusColors[l] || "hsl(0 0% 60%)"
  })

  return (
    <div className="h-48 flex items-center justify-center">
      <Doughnut data={{
        labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
        datasets: [{
          data: vals,
          backgroundColor: colors,
          borderWidth: 0,
        }]
      }} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { padding: 12, usePointStyle: true } } },
      }} />
    </div>
  )
}

export function DocTypeChart({ documents }: ChartProps) {
  const foreground = useCSSVar("--color-chart-1")
  const mutedForeground = useCSSVar("--muted-foreground")
  const border = useCSSVar("--border")

  const typeCounts: Record<string, number> = {}
  for (const doc of documents) {
    typeCounts[doc.docType] = (typeCounts[doc.docType] || 0) + 1
  }
  const labels = Object.keys(typeCounts)
  const vals = Object.values(typeCounts)
  if (!labels.length) return null

  return (
    <div className="h-48">
      <Bar data={{
        labels: labels.map((l) => {
          const map: Record<string, string> = { invoice: "Inv", quotation: "Quo", estimate: "Est", receipt: "Rct", "purchase-order": "PO", "credit-note": "CN", proforma: "Pro", "delivery-challan": "DC" }
          return map[l] || l
        }),
        datasets: [{
          label: "Count", data: vals,
          backgroundColor: foreground || "hsl(0 0% 9%)",
          borderRadius: 4,
        }]
      }} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: mutedForeground || "hsl(0 0% 45%)", font: { size: 11 } } },
          y: { grid: { color: border || "hsl(0 0% 90%)" }, beginAtZero: true, ticks: { stepSize: 1, color: mutedForeground || "hsl(0 0% 45%)" } },
        },
      }} />
    </div>
  )
}
