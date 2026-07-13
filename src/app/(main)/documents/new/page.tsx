import Link from "next/link"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { type DocumentType } from "@/src/types"
import { docTypeConfig } from "@/src/features/documents/doc-type-config"
import {
  FileText, FileSpreadsheet, FileSearch, FileBadge,
  ShoppingCart, FileDown, FileCheck, Truck,
} from "lucide-react"

const typeIcons: Record<string, typeof FileText> = {
  invoice: FileText,
  quotation: FileSearch,
  estimate: FileSpreadsheet,
  receipt: FileBadge,
  "purchase-order": ShoppingCart,
  "credit-note": FileDown,
  proforma: FileCheck,
  "delivery-challan": Truck,
}

const featuredTypes: DocumentType[] = ["invoice", "quotation", "estimate", "receipt"]
const otherTypes: DocumentType[] = ["purchase-order", "credit-note", "proforma", "delivery-challan"]

export default function NewDocumentPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* HEADER */}
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Step 1 of 2
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          What are you creating today?
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Pick a document type to start. Each one is tailored to a specific use case — invoicing, quoting,
          acknowledging payment, and more.
        </p>
      </header>

      {/* FEATURED TILES — large, with arrow */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Most used
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {featuredTypes.map((type) => {
            const config = docTypeConfig[type]
            const Icon = typeIcons[type] || FileText
            return (
              <Link
                key={type}
                href={`/documents/new/${type}`}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-foreground/80">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground/70" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border bg-background px-1.5 py-0.5 font-mono">
                    {config.numberPrefix}-0001
                  </span>
                  <span>auto-numbered · draft saved automatically</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* COMPACT LIST — other types */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          More types
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {otherTypes.map((type) => {
              const config = docTypeConfig[type]
              const Icon = typeIcons[type] || FileText
              return (
                <li key={type}>
                  <Link
                    href={`/documents/new/${type}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{config.description}</p>
                    </div>
                    <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                      {config.numberPrefix}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/70" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </div>
  )
}
