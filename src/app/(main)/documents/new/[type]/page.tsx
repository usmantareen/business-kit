"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import { Spinner } from "@/src/components/shared/spinner"
import { DOCUMENT_TYPES, type DocumentType, generateDocNumber, getDefaultNumberingConfig } from "@/src/types"

function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value)
}

export default function NewDocumentByTypePage() {
  const params = useParams()
  const router = useRouter()
  const typeParam = (params.type as string) || ""
  const docStore = useDocumentStore()
  const settingsStore = useSettingsStore()

  useEffect(() => {
    if (!isDocumentType(typeParam)) {
      return
    }

    let cancelled = false
    void Promise.all([docStore.load(), settingsStore.load()]).then(async () => {
      if (cancelled) return
      const settings = settingsStore.settings
      const config =
        settings?.numbering?.[typeParam] || getDefaultNumberingConfig(typeParam)
      const today = new Date().toISOString().split("T")[0]
      const due = new Date()
      due.setDate(due.getDate() + 30)
      const defCurrency =
        settings?.currencies?.find((c) => c.isDefault) || { code: "INR", symbol: "₹" }
      const company = settings?.company

      const newDoc = await docStore.add({
        docType: typeParam,
        status: "draft",
        docNumber: generateDocNumber(config),
        referenceNumber: "",
        poNumber: "",
        issueDate: today,
        dueDate: due.toISOString().split("T")[0],
        company: company || {
          logo: "",
          companyName: "",
          email: "",
          website: "",
          address: "",
          taxNumber: "",
          phone: "",
        },
        customer: null,
        billTo: "",
        shipTo: "",
        items: [],
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        shipping: 0,
        additionalCharges: 0,
        grandTotal: 0,
        currency: defCurrency.code,
        currencySymbol: defCurrency.symbol,
        numberFormat: settings?.numberFormat || "indian",
        payment: { method: "", details: "", upiId: "" },
        notes: "",
        terms: "",
        signature: "",
        stamp: "",
        template: settings?.selectedTemplate || "minimal",
      })
      if (cancelled) return
      const currentConfig =
        settingsStore.settings?.numbering?.[typeParam] || getDefaultNumberingConfig(typeParam)
      await settingsStore.updateNumbering(typeParam, {
        ...currentConfig,
        nextNumber: currentConfig.nextNumber + 1,
      })
      if (cancelled) return
      router.replace(`/documents/${newDoc.id}`)
    })

    return () => {
      cancelled = true
    }
  }, [typeParam])

  if (!isDocumentType(typeParam)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <p>Unknown document type.</p>
        <Link href="/documents/new" className="text-foreground underline">
          Back to picker
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Preparing a new {typeParam.replace("-", " ")}…</p>
    </div>
  )
}
