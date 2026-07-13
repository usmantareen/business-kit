"use client"

import type { Document } from "@/src/types"
import { MinimalTemplate } from "@/src/templates/minimal"
import { ModernTemplate } from "@/src/templates/modern"
import { CorporateTemplate } from "@/src/templates/corporate"
import { ElegantTemplate } from "@/src/templates/elegant"
import { DarkTemplate } from "@/src/templates/dark"

interface DocumentPreviewProps {
  document: Document
  template?: string
}

export function DocumentPreview({ document, template = "minimal" }: DocumentPreviewProps) {
  switch (template) {
    case "modern":
      return <ModernTemplate document={document} />
    case "corporate":
      return <CorporateTemplate document={document} />
    case "elegant":
      return <ElegantTemplate document={document} />
    case "dark":
      return <DarkTemplate document={document} />
    default:
      return <MinimalTemplate document={document} />
  }
}
