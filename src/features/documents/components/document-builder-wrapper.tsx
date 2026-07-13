"use client"

import { DocumentBuilder } from "./document-builder"
import type { DocumentType } from "@/src/types"

interface WrapperProps {
  docType: DocumentType
  documentId?: string
}

export function DocumentBuilderWrapper({ docType, documentId }: WrapperProps) {
  return <DocumentBuilder docType={docType} documentId={documentId} />
}
