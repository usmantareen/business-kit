"use client"

import Link from "next/link"
import { FilePlus, FileEdit, CheckCircle2, Send, XCircle } from "lucide-react"
import { formatCurrency } from "@/src/lib/formatters"
import type { Document } from "@/src/types"

interface ActivityTimelineProps {
  documents: Document[]
  currencySymbol: string
  numberFormat: "indian" | "international"
}

const actionMeta: Record<string, { icon: typeof FilePlus; label: string }> = {
  paid: { icon: CheckCircle2, label: "marked as paid" },
  pending: { icon: Send, label: "sent to customer" },
  overdue: { icon: XCircle, label: "became overdue" },
  draft: { icon: FileEdit, label: "saved as draft" },
  cancelled: { icon: XCircle, label: "cancelled" },
  created: { icon: FilePlus, label: "created" },
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 4) return `${w}w ago`
  return new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export function ActivityTimeline({ documents, currencySymbol, numberFormat }: ActivityTimelineProps) {
  const items = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)

  if (items.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-foreground/80">No activity yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Activity will appear here as you work</p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-4">
      <span className="absolute left-[15px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {items.map((doc) => {
        const meta = actionMeta[doc.status] || actionMeta.created
        const Icon = meta.icon
        return (
          <li key={doc.id} className="relative flex items-start gap-3 pl-0">
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-4 ring-background border">
              <Icon className="h-3.5 w-3.5 text-foreground/80" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm leading-snug">
                <Link
                  href={`/documents/${doc.id}`}
                  className="font-mono text-xs font-medium text-foreground/80 hover:text-foreground hover:underline"
                >
                  {doc.docNumber || "Draft"}
                </Link>{" "}
                <span className="text-muted-foreground">{meta.label}</span>
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{formatCurrency(doc.grandTotal, doc.currencySymbol || currencySymbol, numberFormat)}</span>
                <span className="text-border">·</span>
                <span>{timeAgo(doc.updatedAt)}</span>
                {doc.customer?.customerName && (
                  <>
                    <span className="text-border">·</span>
                    <span className="truncate">{doc.customer.customerName}</span>
                  </>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
