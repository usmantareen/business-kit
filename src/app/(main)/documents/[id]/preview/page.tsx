"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import { Button } from "@/src/components/ui/button"
import { Card } from "@/src/components/ui/card"
import { Printer, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { DocumentPreview } from "@/src/features/documents/components/document-preview"
import { toast } from "sonner"
import { generatePDF } from "@/src/services/pdf"

export default function DocumentPreviewPage() {
  const params = useParams()
  const id = params.id as string
  const [doc, setDoc] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      useDocumentStore.getState().load(),
      useSettingsStore.getState().load(),
    ]).then(() => {
      const d = useDocumentStore.getState().getById(id)
      const s = useSettingsStore.getState().settings
      if (d) {
        const mergedCompany = {
          logo: d.company?.logo || s?.company?.logo || "",
          companyName: d.company?.companyName || s?.company?.companyName || "",
          email: d.company?.email || s?.company?.email || "",
          website: d.company?.website || s?.company?.website || "",
          address: d.company?.address || s?.company?.address || "",
          taxNumber: d.company?.taxNumber || s?.company?.taxNumber || "",
          phone: d.company?.phone || s?.company?.phone || "",
        }
        const mergedDoc = {
          ...d,
          company: mergedCompany,
          template: d.template || s?.selectedTemplate || "minimal",
          numberFormat: d.numberFormat || s?.numberFormat || "indian",
        }
        setDoc(mergedDoc)
      } else {
        setDoc(null)
      }
      setSettings(s)
      setLoading(false)
    })
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handlePDF = async () => {
    if (!doc) return
    try {
      await generatePDF(doc, doc.template || settings?.selectedTemplate || "minimal")
      toast.success("PDF downloaded")
    } catch (err: any) {
      console.error("PDF generation failure:", err)
      toast.error(`Failed to generate PDF: ${err.message || err}`)
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>
  }

  if (!doc) {
    return <div className="flex h-screen items-center justify-center"><p className="text-muted-foreground">Document not found</p></div>
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={`/documents/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-medium">{doc.docNumber} — Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDF}>
              <Download className="mr-1 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8" ref={previewRef}>
        <DocumentPreview document={doc} template={doc.template || settings?.selectedTemplate || "minimal"} />
      </div>
    </div>
  )
}
