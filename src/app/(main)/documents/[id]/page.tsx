"use client"

import { useParams } from "next/navigation"
import { DocumentBuilderWrapper } from "@/src/features/documents/components/document-builder-wrapper"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { useEffect, useState } from "react"
import { Spinner } from "@/src/components/shared/spinner"
import { EmptyState } from "@/src/components/shared/empty-state"
import { Button } from "@/src/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function EditDocumentPage() {
  const params = useParams()
  const id = params.id as string
  const [docType, setDocType] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const load = useDocumentStore((s) => s.load)

  useEffect(() => {
    load().then(() => {
      const doc = useDocumentStore.getState().getById(id)
      if (doc) setDocType(doc.docType)
      else setNotFound(true)
    })
  }, [id, load])

  if (notFound) {
    return (
      <div className="flex h-96 items-center justify-center">
        <EmptyState icon={FileText} title="Document not found" description="The document you're looking for doesn't exist or has been deleted." action={<Button asChild><Link href="/documents">Back to Documents</Link></Button>} />
      </div>
    )
  }

  if (!docType) {
    return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>
  }

  return <DocumentBuilderWrapper docType={docType as any} documentId={id} />
}
