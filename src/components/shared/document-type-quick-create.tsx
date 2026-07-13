"use client"

import Link from "next/link"
import {
  FileText, FileSpreadsheet, Receipt, ShoppingCart, FileX,
  FileSignature, Truck, Calculator,
} from "lucide-react"

const tiles = [
  { type: "invoice", label: "Invoice", icon: FileText },
  { type: "quotation", label: "Quotation", icon: FileSpreadsheet },
  { type: "estimate", label: "Estimate", icon: Calculator },
  { type: "receipt", label: "Receipt", icon: Receipt },
  { type: "purchase-order", label: "Purchase Order", icon: ShoppingCart },
  { type: "credit-note", label: "Credit Note", icon: FileX },
  { type: "proforma", label: "Proforma", icon: FileSignature },
  { type: "delivery-challan", label: "Delivery Challan", icon: Truck },
]

export function DocumentTypeQuickCreate() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {tiles.map((t) => {
        const Icon = t.icon
        return (
          <Link
            key={t.type}
            href={`/documents/new/${t.type}`}
            className="group relative overflow-hidden rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="relative flex flex-col items-start gap-2">
              <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium leading-tight text-foreground/90">{t.label}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
