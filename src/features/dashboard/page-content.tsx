"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { useCustomerStore } from "@/src/lib/stores/customer-store"
import { useProductStore } from "@/src/lib/stores/product-store"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import { StatCard } from "@/src/components/shared/stat-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { EmptyState } from "@/src/components/shared/empty-state"
import { Spinner } from "@/src/components/shared/spinner"
import { OnboardingWizard } from "@/src/components/shared/onboarding-wizard"
import { StatusPill } from "@/src/components/shared/status-pill"
import { InitialsAvatar } from "@/src/components/shared/initials-avatar"
import { DocumentTypeQuickCreate } from "@/src/components/shared/document-type-quick-create"
import { formatCurrency, formatDate } from "@/src/lib/formatters"
import { DocTypeLabel } from "@/src/types"
import {
  FileText, Users, Package, DollarSign, Clock, FileEdit, Plus,
  ArrowUpRight, Sparkles, Receipt, TrendingUp, CircleDollarSign, Settings,
} from "lucide-react"

const RevenueChart = dynamic(() => import("./revenue-chart"), { ssr: false })
const StatusBreakdown = dynamic(() => import("./status-breakdown").then((m) => m.StatusBreakdown), { ssr: false })
const TopCustomers = dynamic(() => import("./top-customers").then((m) => m.TopCustomers), { ssr: false })
const ActivityTimeline = dynamic(() => import("./activity-timeline").then((m) => m.ActivityTimeline), { ssr: false })

function pctChange(curr: number, prev: number): { value: string; positive: boolean; neutral: boolean } {
  if (prev === 0 && curr === 0) return { value: "0%", positive: true, neutral: true }
  if (prev === 0) return { value: "—", positive: true, neutral: true }
  const diff = ((curr - prev) / prev) * 100
  const sign = diff > 0 ? "+" : ""
  return { value: `${sign}${diff.toFixed(0)}%`, positive: diff >= 0, neutral: false }
}

function lastNMonthsRevenue(invoices: { status: string; grandTotal: number; issueDate: string }[], n: number): number[] {
  const buckets: number[] = new Array(n).fill(0)
  const now = new Date()
  for (const inv of invoices) {
    if (inv.status !== "paid" || !inv.issueDate) continue
    const d = new Date(inv.issueDate)
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (monthsAgo >= 0 && monthsAgo < n) buckets[n - 1 - monthsAgo] += inv.grandTotal
  }
  return buckets
}

export function DashboardPageContent() {
  const { documents, load: loadDocs } = useDocumentStore()
  const { customers, load: loadCust } = useCustomerStore()
  const { products, load: loadProd } = useProductStore()
  const { settings, loaded: settingsLoaded, load: loadSettings } = useSettingsStore()
  const [initialized, setInitialized] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("onboarding-dismissed") === "1"
  })

  useEffect(() => {
    Promise.all([loadDocs(), loadCust(), loadProd(), loadSettings()]).then(() => setInitialized(true))
  }, [])

  const dismissOnboarding = () => {
    localStorage.setItem("onboarding-dismissed", "1")
    setOnboardingDismissed(true)
  }

  const showOnboarding = initialized && settings && !settings.onboardingComplete && !onboardingDismissed

  const { greeting, longDate, firstName } = useMemo(() => {
    const now = new Date()
    const h = now.getHours()
    const g = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
    const ld = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    const fn = (settings?.company?.companyName || "there").split(/\s+/)[0]
    return { greeting: g, longDate: ld, firstName: fn }
  }, [settings])

  const stats = useMemo(() => {
    const invoices = documents.filter((d) => d.docType === "invoice")
    const paid = invoices.filter((d) => d.status === "paid")
    const outstanding = invoices
      .filter((d) => d.status === "pending" || d.status === "overdue")
      .reduce((s, d) => s + d.grandTotal, 0)
    const drafts = documents.filter((d) => d.status === "draft").length
    const totalRevenue = paid.reduce((s, d) => s + d.grandTotal, 0)

    const thisMonth = 30 * 24 * 60 * 60 * 1000
    const lastMonth = 60 * 24 * 60 * 60 * 1000
    const reference = new Date()
    const now = reference.getTime()
    const revenueThisMonth = paid
      .filter((d) => Date.parse(d.issueDate) > now - thisMonth)
      .reduce((s, d) => s + d.grandTotal, 0)
    const revenueLastMonth = paid
      .filter((d) => {
        const t = Date.parse(d.issueDate)
        return t > now - lastMonth && t <= now - thisMonth
      })
      .reduce((s, d) => s + d.grandTotal, 0)

    const invoicesThisMonth = documents.filter(
      (d) => Date.parse(d.issueDate) > now - thisMonth
    ).length
    const invoicesLastMonth = documents.filter((d) => {
      const t = Date.parse(d.issueDate)
      return t > now - lastMonth && t <= now - thisMonth
    }).length

    return {
      invoices,
      totalRevenue,
      outstanding,
      drafts,
      revenueThisMonth,
      revenueLastMonth,
      invoicesThisMonth,
      invoicesLastMonth,
      revenueSparkline: lastNMonthsRevenue(invoices, 8),
    }
  }, [documents])

  if (!initialized) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard onClose={dismissOnboarding} />
  }

  const fmt = settings?.numberFormat || "indian"
  const defaultCurrency = settings?.currencies.find((c) => c.isDefault)
  const symbol = defaultCurrency?.symbol || "₹"

  const recentDocs = [...documents].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
  const hasAnyData = documents.length > 0 || customers.length > 0 || products.length > 0

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12 stagger">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-foreground/[0.035] blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              {longDate}
            </p>
            <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              {greeting}, <span className="italic text-muted-foreground">{firstName}</span>.
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasAnyData
                ? `Here's how your business is doing today — ${stats.invoices.length} invoices, ${formatCurrency(stats.totalRevenue, symbol, fmt)} earned.`
                : "Set up your workspace and create your first document to get started."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/documents/new">
                <Plus className="h-4 w-4" /> New Document
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/analytics">
                <TrendingUp className="h-4 w-4" /> View Analytics
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* QUICK CREATE TILES */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Create a document</h2>
          <Link href="/documents/new" className="text-xs text-muted-foreground hover:text-foreground">
            All types →
          </Link>
        </div>
        <DocumentTypeQuickCreate />
      </section>

      {/* STATS — uniform, B&W */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Invoices"
            value={stats.invoices.length}
            icon={FileText}
            href="/documents"
            trend={pctChange(stats.invoicesThisMonth, stats.invoicesLastMonth)}
            description="vs last month"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue, symbol, fmt)}
            icon={DollarSign}
            trend={pctChange(stats.revenueThisMonth, stats.revenueLastMonth)}
            description="vs last month"
            sparkline={stats.revenueSparkline}
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats.outstanding, symbol, fmt)}
            icon={Clock}
            href="/documents"
            description="pending + overdue"
          />
          <StatCard
            title="Drafts"
            value={stats.drafts}
            icon={FileEdit}
            href="/documents"
            description="awaiting review"
          />
          <StatCard
            title="Customers"
            value={customers.length}
            icon={Users}
            href="/customers"
            description={customers.length === 1 ? "active contact" : "active contacts"}
          />
          <StatCard
            title="Products"
            value={products.length}
            icon={Package}
            href="/products"
            description={products.length === 1 ? "item in catalog" : "items in catalog"}
          />
        </div>
      </section>

      {/* MAIN GRID: Revenue + Status breakdown */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
                <CircleDollarSign className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
            </div>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Full report <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            <RevenueChart
              documents={stats.invoices}
              currencySymbol={symbol}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold">Invoice Status</CardTitle>
            </div>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            <StatusBreakdown documents={stats.invoices} />
          </CardContent>
        </Card>
      </section>

      {/* SECONDARY GRID: Recent + Activity */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* RECENT DOCUMENTS */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold">Recent Documents</CardTitle>
            </div>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              See all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentDocs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Create your first invoice, quotation, or estimate to get started."
                  action={
                    <Button asChild>
                      <Link href="/documents/new">
                        <Plus className="mr-1 h-4 w-4" /> Create Document
                      </Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y">
                {recentDocs.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-accent/40"
                    >
                      <InitialsAvatar
                        name={doc.customer?.customerName || DocTypeLabel[doc.docType]}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-medium text-foreground/80">
                            {doc.docNumber || "Draft"}
                          </p>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {DocTypeLabel[doc.docType]}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {doc.customer?.customerName || "No customer"} · {formatDate(doc.issueDate)}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(doc.grandTotal, doc.currencySymbol || symbol, fmt)}
                        </p>
                        <StatusPill status={doc.status} />
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/60" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ACTIVITY TIMELINE */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold">Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ActivityTimeline
              documents={documents}
              currencySymbol={symbol}
              numberFormat={fmt}
            />
          </CardContent>
        </Card>
      </section>

      {/* TOP CUSTOMERS */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md border bg-background p-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-sm font-semibold">Top Customers</CardTitle>
            </div>
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              All customers <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            <TopCustomers
              documents={documents}
              customers={customers}
              currencySymbol={symbol}
              numberFormat={fmt}
            />
          </CardContent>
        </Card>

        {/* ONBOARDING-STYLE PROMO / FOOTER CARD */}
        <Card className="relative overflow-hidden">
          <CardContent className="relative flex h-full flex-col justify-between gap-4 p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Tip
              </p>
              <h3 className="font-serif text-lg font-medium tracking-tight">
                Keep your books tidy
              </h3>
              <p className="text-sm text-muted-foreground">
                Set up your company info and default tax rates in settings to autofill every new document in one click.
              </p>
            </div>
            <Button asChild variant="outline" className="w-fit rounded-xl">
              <Link href="/settings">
                <Settings className="h-3.5 w-3.5" /> Open Settings
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
