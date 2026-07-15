"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { PageHeader } from "@/src/components/shared/page-header"
import { EmptyState } from "@/src/components/shared/empty-state"
import { Spinner } from "@/src/components/shared/spinner"
import { Card, CardContent } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Checkbox } from "@/src/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/src/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/src/components/ui/dropdown-menu"
import { formatCurrency, formatDate, formatStatus, getStatusColor } from "@/src/lib/formatters"
import { DocTypeLabel, type DocumentType, type DocumentStatus, DOCUMENT_TYPES, DOCUMENT_STATUSES } from "@/src/types"
import { conversionMap } from "@/src/features/documents/doc-type-config"
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog"
import { FileText, MoreHorizontal, Search, Copy, Trash2, Eye, Pencil, CheckSquare, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function DocumentsPage() {
  const router = useRouter()
  const { documents, load, filters, setFilters, remove, duplicate, convert, bulkUpdateStatus, bulkDelete } = useDocumentStore()
  const [initialized, setInitialized] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  useEffect(() => {
    load().then(() => setInitialized(true))
  }, [])

  if (!initialized) {
    return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>
  }

  const filtered = useDocumentStore.getState().filteredDocuments()
  const filteredIds = new Set(filtered.map((d) => d.id))

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleDelete = async (id: string) => {
    await remove(id)
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
    toast.success("Document deleted")
  }

  const handleDuplicate = async (id: string) => {
    const doc = await duplicate(id)
    if (doc) toast.success("Document duplicated")
  }

  const handleConvert = async (id: string, type: DocumentType) => {
    const doc = await convert(id, type)
    if (doc) toast.success(`Converted to ${DocTypeLabel[type]}`)
  }

  const handleBulkStatus = async (status: DocumentStatus) => {
    const ids = Array.from(selectedIds)
    await bulkUpdateStatus(ids, status)
    toast.success(`Updated ${ids.length} document${ids.length > 1 ? "s" : ""} to ${formatStatus(status)}`)
    clearSelection()
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    await bulkDelete(ids)
    toast.success(`Deleted ${ids.length} document${ids.length > 1 ? "s" : ""}`)
    clearSelection()
    setBulkDeleteConfirm(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Manage your business documents" actions={[{ label: "New Document", href: "/documents/new" }]} />

      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 flex items-center justify-between rounded-lg border bg-accent/80 backdrop-blur px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Change Status</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {DOCUMENT_STATUSES.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleBulkStatus(s)}>
                    {formatStatus(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setBulkDeleteConfirm(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by number, customer, email..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ status: v as DocumentStatus | "all" })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {DOCUMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.docType}
              onValueChange={(v) => setFilters({ docType: v as DocumentType | "all" })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{DocTypeLabel[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Input
              type="date"
              className="w-36 h-8 text-xs"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              placeholder="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="w-36 h-8 text-xs"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              placeholder="To date"
            />
            {(filters.dateFrom || filters.dateTo) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilters({ dateFrom: "", dateTo: "" })}>
                Clear dates
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={FileText}
                title="No documents found"
                description={filters.search || filters.status !== "all" || filters.docType !== "all" || filters.dateFrom || filters.dateTo ? "Try adjusting your filters" : "Create your first document to get started"}
                action={filters.search || filters.status !== "all" || filters.docType !== "all" || filters.dateFrom || filters.dateTo ? undefined : (
                  <Button asChild>
                    <Link href="/documents/new">
                      Create Document
                    </Link>
                  </Button>
                )}
              />
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => {
                    const isOverdue = doc.status === "pending" && new Date(doc.dueDate) < new Date()
                    const paidAmount = (doc.payments || []).reduce((s, p) => s + p.amount, 0)
                    const isSelected = selectedIds.has(doc.id)
                    return (
                      <TableRow key={doc.id} className={isSelected ? "bg-accent/60" : "cursor-pointer"} onClick={() => router.push(`/documents/${doc.id}`)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(doc.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{doc.docNumber || "—"}</TableCell>
                        <TableCell>{DocTypeLabel[doc.docType]}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {doc.customer?.customerName || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(doc.issueDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(doc.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(doc.grandTotal, doc.currencySymbol, doc.numberFormat)}
                          {paidAmount > 0 && paidAmount < doc.grandTotal && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({formatCurrency(paidAmount, doc.currencySymbol, doc.numberFormat)} paid)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={isOverdue ? "bg-destructive/15 text-destructive" : getStatusColor(doc.status)}>
                            {isOverdue ? "Overdue" : formatStatus(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}`) }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(doc.id) }}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}/preview`) }}>
                                <Eye className="mr-2 h-4 w-4" /> Preview & Print
                              </DropdownMenuItem>
                              {conversionMap[doc.docType]?.length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <Pencil className="mr-2 h-4 w-4" /> Convert to
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      {conversionMap[doc.docType].map((t) => (
                                        <DropdownMenuItem
                                          key={t}
                                          onClick={(e) => { e.stopPropagation(); handleConvert(doc.id, t) }}
                                        >
                                          {DocTypeLabel[t]}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc.id) }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete document"
        description="This cannot be undone. The document will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (deleteTarget) {
            await handleDelete(deleteTarget)
            setDeleteTarget(null)
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title="Delete selected documents"
        description={`This will permanently delete ${selectedIds.size} document${selectedIds.size > 1 ? "s" : ""}. This cannot be undone.`}
        confirmLabel="Delete All"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}
