"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { useCustomerStore } from "@/src/lib/stores/customer-store"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { PageHeader } from "@/src/components/shared/page-header"
import { StatCard } from "@/src/components/shared/stat-card"
import { EmptyState } from "@/src/components/shared/empty-state"
import { Spinner } from "@/src/components/shared/spinner"
import { Button } from "@/src/components/ui/button"
import { formatCurrency } from "@/src/lib/formatters"
import { type Document } from "@/src/types"
import { BarChart3, TrendingUp, DollarSign, FileText, Plus } from "lucide-react"
import dynamic from "next/dynamic"

const RevenueChart = dynamic(() => import("@/src/features/analytics/charts").then(m => ({ default: m.RevenueChart })), { ssr: false })
const DocTypeChart = dynamic(() => import("@/src/features/analytics/charts").then(m => ({ default: m.DocTypeChart })), { ssr: false })
const PaymentStatusChart = dynamic(() => import("@/src/features/analytics/charts").then(m => ({ default: m.PaymentStatusChart })), { ssr: false })

export default function AnalyticsPage() {
  const { documents, loaded: docsLoaded, load: loadDocs } = useDocumentStore()
  const { customers, loaded: custLoaded, load: loadCust } = useCustomerStore()
  const { settings, loaded: settingsLoaded, load: loadSettings } = useSettingsStore()
  const [init, setInit] = useState(false)

  useEffect(() => {
    Promise.all([loadDocs(), loadCust(), loadSettings()]).then(() => setInit(true))
  }, [])

  if (!init) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const paid = documents.filter((d) => d.status === "paid")
  const pending = documents.filter((d) => d.status === "pending" || d.status === "overdue")
  const totalRevenue = paid.reduce((s, d) => s + d.grandTotal, 0)
  const outstanding = pending.reduce((s, d) => s + d.grandTotal, 0)
  const defaultCurrency = settings?.currencies.find((c) => c.isDefault)
  const symbol = defaultCurrency?.symbol || "₹"

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Deep insights into your business performance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue, symbol)} icon={DollarSign} description="From paid documents" />
        <StatCard title="Outstanding" value={formatCurrency(outstanding, symbol)} icon={TrendingUp} description="Pending payments" />
        <StatCard title="Total Documents" value={documents.length} icon={FileText} />
        <StatCard title="Customers" value={customers.length} icon={BarChart3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            {paid.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No paid invoices yet"
                description="Revenue will appear here once invoices are marked as paid."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/documents/new/invoice">
                      <Plus className="mr-1 h-3 w-3" /> Create Invoice
                    </Link>
                  </Button>
                }
              />
            ) : (
              <RevenueChart documents={documents} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Create your first document to see payment status breakdown."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/documents/new/invoice">
                      <Plus className="mr-1 h-3 w-3" /> Create Document
                    </Link>
                  </Button>
                }
              />
            ) : (
              <PaymentStatusChart documents={documents} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Documents by Type</CardTitle></CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No documents yet"
                description="Document type distribution will appear here."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/documents">
                      View Documents
                    </Link>
                  </Button>
                }
              />
            ) : (
              <DocTypeChart documents={documents} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Customers</CardTitle></CardHeader>
          <CardContent>
            <TopCustomers documents={documents} symbol={symbol} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TopCustomers({ documents, symbol }: { documents: Document[]; symbol: string }) {
  const paid = documents.filter((d) => d.status === "paid")
  const customerTotals: Record<string, { name: string; total: number }> = {}
  for (const doc of paid) {
    const name = doc.customer?.customerName || "Unknown"
    if (!customerTotals[name]) customerTotals[name] = { name, total: 0 }
    customerTotals[name].total += doc.grandTotal
  }
  const sorted = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5)

  if (sorted.length === 0) {
    if (documents.length === 0) {
      return (
        <EmptyState icon={BarChart3} title="No data yet" description="Revenue-generating customers will appear here." action={
          <Button asChild variant="outline" size="sm">
            <Link href="/customers">
              <Plus className="mr-1 h-3 w-3" /> Add Customers
            </Link>
          </Button>
        } />
      )
    }
    return <EmptyState icon={BarChart3} title="No paid documents" description="Top customers appear once invoices are paid." />
  }

  return (
    <div className="space-y-3">
      {sorted.map((c) => (
        <div key={c.name} className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{c.name}</span>
          <span className="text-sm text-muted-foreground">{formatCurrency(c.total, symbol)}</span>
        </div>
      ))}
    </div>
  )
}
