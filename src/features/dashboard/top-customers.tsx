"use client"

import { InitialsAvatar } from "@/src/components/shared/initials-avatar"
import { formatCurrency } from "@/src/lib/formatters"
import type { Document, Customer } from "@/src/types"

interface TopCustomersProps {
  documents: Document[]
  customers: Customer[]
  currencySymbol: string
  numberFormat: "indian" | "international"
}

export function TopCustomers({ documents, currencySymbol, numberFormat }: TopCustomersProps) {
  const totals = new Map<string, { name: string; total: number; count: number }>()
  for (const d of documents) {
    if (!d.customer) continue
    const id = d.customer.id
    const cur = totals.get(id) || { name: d.customer.customerName, total: 0, count: 0 }
    cur.total += d.grandTotal
    cur.count += 1
    totals.set(id, cur)
  }

  const sorted = Array.from(totals.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)

  const max = sorted.length ? sorted[0][1].total : 1

  if (sorted.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-foreground/80">No customers yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Add customers to see your top earners</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {sorted.map(([id, info], idx) => {
        const pct = (info.total / max) * 100
        return (
          <li key={id} className="group flex items-center gap-3">
            <span className="w-4 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <InitialsAvatar name={info.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">{info.name}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCurrency(info.total, currencySymbol, numberFormat)}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/80 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {info.count} {info.count === 1 ? "doc" : "docs"}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
