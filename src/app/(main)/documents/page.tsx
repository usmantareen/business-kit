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
import { FileText, MoreHorizontal, Search, Copy, Trash2, Eye, Pencil } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function DocumentsPage() {
  const router = useRouter()
  const { documents, load, filters, setFilters, remove, duplicate, convert } = useDocumentStore()
  const [initialized, setInitialized] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    load().then(() => setInitialized(true))
  }, [])

  if (!initialized) {
    return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>
  }

  const filtered = useDocumentStore.getState().filteredDocuments()

  const handleDelete = async (id: string) => {
    await remove(id)
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

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Manage your business documents" actions={[{ label: "New Document", href: "/documents/new" }]} />

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

          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={FileText}
                title="No documents found"
                description={filters.search || filters.status !== "all" || filters.docType !== "all" ? "Try adjusting your filters" : "Create your first document to get started"}
                action={filters.search || filters.status !== "all" || filters.docType !== "all" ? undefined : (
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
                    return (
                      <TableRow key={doc.id} className="cursor-pointer" onClick={() => router.push(`/documents/${doc.id}`)}>
                        <TableCell className="font-medium">{doc.docNumber || "—"}</TableCell>
                        <TableCell>{DocTypeLabel[doc.docType]}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {doc.customer?.customerName || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(doc.issueDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(doc.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(doc.grandTotal, doc.currencySymbol, doc.numberFormat)}
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
    </div>
  )
}
