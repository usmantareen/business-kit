"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDocumentStore } from "@/src/lib/stores/document-store"
import { useCustomerStore } from "@/src/lib/stores/customer-store"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import type { DocumentType, Document, Item, Customer, CompanyInfo, DocumentStatus, PaymentMethod, PaymentRecord } from "@/src/types"
import { DocTypeLabel, generateDocNumber, getDefaultNumberingConfig, CurrencySymbols, DOCUMENT_STATUSES } from "@/src/types"
import type { Product } from "@/src/types"
import { generateId, now, formatCurrency, formatNumber } from "@/src/lib/formatters"
import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Badge } from "@/src/components/ui/badge"
import { Separator } from "@/src/components/ui/separator"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/src/components/ui/command"
import { useProductStore } from "@/src/lib/stores/product-store"
import { Plus, Trash2, GripVertical, Save, Printer, Copy, Pen, Package, Building2, Mail, Globe, MapPin, Hash, Phone, FileText, Search } from "lucide-react"
import { FormField } from "@/src/components/shared/form-field"
import SignatureCanvas from "react-signature-canvas"
import { generateUPIQR } from "@/src/services/qr"
import { toast } from "sonner"
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface DocumentBuilderProps {
  docType: DocumentType
  documentId?: string
}

interface ItemForm {
  id: string
  description: string
  quantity: number
  unit: string
  price: number
  discount: number
  discountType: "percentage" | "fixed"
  tax: number
  taxType: "inclusive" | "exclusive"
  total: number
}

function createEmptyItem(): ItemForm {
  return { id: generateId(), description: "", quantity: 1, unit: "", price: 0, discount: 0, discountType: "percentage", tax: 0, taxType: "exclusive", total: 0 }
}

function toFiniteNumber(raw: string): number {
  if (raw === "") return 0
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

function SortableItemRow({ item, index, items, onUpdate, onDuplicate, onRemove, products }: {
  item: ItemForm
  index: number
  items: ItemForm[]
  onUpdate: (id: string, field: keyof ItemForm, value: string | number) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  products: { name: string; description: string; unit: string; price: number; tax: number; category: string }[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const lineTotal = item.quantity * item.price
  const inputClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof ItemForm) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      const target = e.currentTarget
      if (target.value === "" && items.length > 1) {
        onRemove(item.id)
      }
    }
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("grid grid-cols-[32px_1fr_80px_70px_100px_80px_80px_80px_100px_44px_44px] gap-1 items-center", items.length > 1 && "mb-1")}>
      <button type="button" className="flex items-center justify-center h-9 w-8 cursor-grab text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <input
            className={inputClass}
            placeholder="Description"
            value={item.description}
            onChange={(e) => onUpdate(item.id, "description", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "description")}
          />
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" align="start">
          <Command>
            <CommandInput placeholder="Search products..." />
            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>
              {products.map((p) => (
                <CommandItem
                  key={p.name}
                  onSelect={() => {
                    onUpdate(item.id, "description", p.name)
                    onUpdate(item.id, "unit", p.unit)
                    onUpdate(item.id, "price", p.price)
                    onUpdate(item.id, "tax", p.tax)
                  }}
                >
                  <Package className="mr-2 h-3 w-3 text-muted-foreground" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.price.toFixed(2)}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        className={inputClass}
        type="number"
        step="0.01"
        min="0"
        placeholder="0"
        value={item.quantity || ""}
        onChange={(e) => onUpdate(item.id, "quantity", toFiniteNumber(e.target.value))}
        onKeyDown={(e) => handleKeyDown(e, "quantity")}
      />

      <input
        className={inputClass}
        placeholder="Unit"
        value={item.unit}
        onChange={(e) => onUpdate(item.id, "unit", e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, "unit")}
      />

      <input
        className={inputClass}
        type="number"
        step="0.01"
        min="0"
        placeholder="0"
        value={item.price || ""}
        onChange={(e) => onUpdate(item.id, "price", toFiniteNumber(e.target.value))}
        onKeyDown={(e) => handleKeyDown(e, "price")}
      />

      <div className="flex gap-0.5">
        <input
          className={cn(inputClass, "w-[calc(100%-28px)]")}
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          value={item.discount || ""}
          onChange={(e) => onUpdate(item.id, "discount", toFiniteNumber(e.target.value))}
          onKeyDown={(e) => handleKeyDown(e, "discount")}
        />
        <button
          type="button"
          className={cn("w-6 h-9 text-[10px] font-medium rounded-md border border-input bg-transparent hover:bg-accent", item.discountType === "percentage" ? "text-primary" : "text-muted-foreground")}
          onClick={() => onUpdate(item.id, "discountType", item.discountType === "percentage" ? "fixed" : "percentage")}
          title={item.discountType === "percentage" ? "Percentage" : "Fixed"}
        >
          {item.discountType === "percentage" ? "%" : "$"}
        </button>
      </div>

      <div className="flex gap-0.5">
        <input
          className={cn(inputClass, "w-[calc(100%-28px)]")}
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          value={item.tax || ""}
          onChange={(e) => onUpdate(item.id, "tax", toFiniteNumber(e.target.value))}
          onKeyDown={(e) => handleKeyDown(e, "tax")}
        />
        <button
          type="button"
          className={cn("w-6 h-9 text-[10px] font-medium rounded-md border border-input bg-transparent hover:bg-accent", item.taxType === "exclusive" ? "text-primary" : "text-muted-foreground")}
          onClick={() => onUpdate(item.id, "taxType", item.taxType === "exclusive" ? "inclusive" : "exclusive")}
          title={item.taxType === "exclusive" ? "Exclusive" : "Inclusive"}
        >
          {item.taxType === "exclusive" ? "E" : "I"}
        </button>
      </div>

      <div className="flex items-center justify-end h-9 px-2 text-sm font-medium tabular-nums">
        {lineTotal.toFixed(2)}
      </div>

      <button type="button" className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onDuplicate(item.id)} title="Duplicate row">
        <Copy className="h-4 w-4" />
      </button>

      <button type="button" className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-destructive disabled:opacity-30" onClick={() => onRemove(item.id)} disabled={items.length <= 1} title="Delete row">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function DocumentBuilder({ docType, documentId }: DocumentBuilderProps) {
  const router = useRouter()
  const docStore = useDocumentStore()
  const customerStore = useCustomerStore()
  const settingsStore = useSettingsStore()

  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const [companyLogo, setCompanyLogo] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyTaxNumber, setCompanyTaxNumber] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")

  const [docNumber, setDocNumber] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState<DocumentStatus>("draft")

  const [items, setItems] = useState<ItemForm[]>([createEmptyItem()])

  const [subtotal, setSubtotal] = useState(0)
  const [discountTotal, setDiscountTotal] = useState(0)
  const [taxTotal, setTaxTotal] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [additionalCharges, setAdditionalCharges] = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)

  const [currency, setCurrency] = useState("INR")
  const [currencySymbol, setCurrencySymbol] = useState("₹")

  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentDetails, setPaymentDetails] = useState("")
  const [upiId, setUpiId] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState("")

  const [signature, setSignature] = useState("")
  const [stamp, setStamp] = useState("")

  const [documentDiscount, setDocumentDiscount] = useState(0)
  const [documentDiscountType, setDocumentDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [docPayments, setDocPayments] = useState<PaymentRecord[]>([])

  const [newPayDate, setNewPayDate] = useState("")
  const [newPayAmount, setNewPayAmount] = useState(0)
  const [newPayMethod, setNewPayMethod] = useState("")
  const [newPayNotes, setNewPayNotes] = useState("")

  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const sigRef = useRef<SignatureCanvas>(null)

  const [customCurrency, setCustomCurrency] = useState("")
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const customerDropdownRef = useRef<HTMLDivElement>(null)

  const settings = settingsStore.settings
  const productStore = useProductStore()
  const products = productStore.products

  useEffect(() => {
    Promise.all([
      settingsStore.load(),
      customerStore.load(),
      docStore.load(),
      productStore.load(),
    ]).then(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (documentId) {
      const doc = docStore.getById(documentId)
      if (doc) {
        setCompanyLogo(doc.company?.logo || settings?.company?.logo || "")
        setCompanyName(doc.company?.companyName || settings?.company?.companyName || "")
        setCompanyEmail(doc.company?.email || settings?.company?.email || "")
        setCompanyWebsite(doc.company?.website || settings?.company?.website || "")
        setCompanyAddress(doc.company?.address || settings?.company?.address || "")
        setCompanyTaxNumber(doc.company?.taxNumber || settings?.company?.taxNumber || "")
        setCompanyPhone(doc.company?.phone || settings?.company?.phone || "")
        setSelectedCustomer(doc.customer)
        setDocNumber(doc.docNumber)
        setReferenceNumber(doc.referenceNumber)
        setPoNumber(doc.poNumber)
        setIssueDate(doc.issueDate)
        setDueDate(doc.dueDate)
        setStatus(doc.status)
        setItems(doc.items.map((i) => ({ ...i })))
        setShipping(doc.shipping)
        setAdditionalCharges(doc.additionalCharges)
        setCurrency(doc.currency)
        setCurrencySymbol(doc.currencySymbol)
        setPaymentMethod(doc.payment.method)
        setPaymentDetails(doc.payment.details)
        setUpiId(doc.payment.upiId)
        setNotes(doc.notes)
        setTerms(doc.terms)
        setSignature(doc.signature)
        setStamp(doc.stamp)
        setDocumentDiscount(doc.documentDiscount || 0)
        setDocumentDiscountType(doc.documentDiscountType || "percentage")
        setDocPayments(doc.payments || [])
        return
      }
    }
    if (settings) {
      const c = settings.company
      setCompanyLogo(c.logo)
      setCompanyName(c.companyName)
      setCompanyEmail(c.email)
      setCompanyWebsite(c.website)
      setCompanyAddress(c.address)
      setCompanyTaxNumber(c.taxNumber)
      setCompanyPhone(c.phone)
    }
    const defCurrency = settings?.currencies.find((c) => c.isDefault) || { code: "INR", symbol: "₹" }
    setCurrency(defCurrency.code)
    setCurrencySymbol(defCurrency.symbol)
  }, [loaded, documentId])

  useEffect(() => {
    if (documentId || !settings) return
    const config = settings.numbering[docType] || getDefaultNumberingConfig(docType)
    setDocNumber(generateDocNumber(config))
  }, [settings, docType, documentId])

  useEffect(() => {
    if (documentId) return
    const today = new Date().toISOString().split("T")[0]
    setIssueDate(today)
    const due = new Date()
    due.setDate(due.getDate() + 30)
    setDueDate(due.toISOString().split("T")[0])
  }, [documentId])

  const computeTotals = useCallback(() => {
    let s = 0
    let d = 0
    let t = 0
    for (const item of items) {
      const lineTotal = item.quantity * item.price
      s += lineTotal
      let discount = 0
      if (item.discountType === "percentage") {
        discount = lineTotal * (item.discount / 100)
      } else {
        discount = item.discount
      }
      d += discount
      const afterDiscount = lineTotal - discount
      if (item.taxType === "inclusive") {
        t += afterDiscount - afterDiscount / (1 + item.tax / 100)
      } else {
        t += afterDiscount * (item.tax / 100)
      }
    }
    const sVal = Math.round(s * 100) / 100
    const dVal = Math.round(d * 100) / 100
    const tVal = Math.round(t * 100) / 100
    let docDisc = 0
    if (documentDiscount > 0) {
      if (documentDiscountType === "percentage") {
        docDisc = Math.round(sVal * (documentDiscount / 100) * 100) / 100
      } else {
        docDisc = documentDiscount
      }
    }
    const gVal = Math.round((sVal - dVal + tVal + shipping + additionalCharges - docDisc) * 100) / 100
    setSubtotal(sVal)
    setDiscountTotal(dVal)
    setTaxTotal(tVal)
    setGrandTotal(gVal)
  }, [items, shipping, additionalCharges, documentDiscount, documentDiscountType])

  useEffect(() => { computeTotals() }, [computeTotals])

  useEffect(() => {
    if (upiId && paymentMethod === "upi") {
      generateUPIQR(upiId, grandTotal > 0 ? grandTotal : undefined, companyName || undefined)
        .then((url) => setQrCodeUrl(url || ""))
    } else {
      setQrCodeUrl("")
    }
  }, [upiId, paymentMethod, grandTotal, companyName])

  const getCurrencySymbol = useCallback((code: string): string => {
    if (settings) {
      const found = settings.currencies.find((c) => c.code === code)
      if (found) return found.symbol
    }
    return CurrencySymbols[code] || code
  }, [settings])

  useEffect(() => {
    if (!customCurrency) {
      setCurrencySymbol(getCurrencySymbol(currency))
    } else {
      setCurrencySymbol(customCurrency)
    }
  }, [currency, customCurrency, getCurrencySymbol])

  const handleItemUpdate = useCallback((id: string, field: keyof ItemForm, value: string | number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value as never } : item)))
  }, [])

  const handleItemDuplicate = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx === -1) return prev
      const newItem = { ...prev[idx], id: generateId() }
      const next = [...prev]
      next.splice(idx + 1, 0, newItem)
      return next
    })
  }, [])

  const handleItemRemove = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((i) => i.id !== id)
    })
  }, [])

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const handleCompanyLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setCompanyLogo(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleStamp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setStamp(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const saveSignature = () => {
    const dataUrl = sigRef.current?.toDataURL()
    if (dataUrl) {
      setSignature(dataUrl)
      setShowSignatureDialog(false)
    }
  }

  const clearSignature = () => {
    sigRef.current?.clear()
  }

  const filteredCustomers = customerStore.search(customerSearch)

  const selectedCustomerOptions = settings?.currencies || []
  const allCurrencies = selectedCustomerOptions.length > 0
    ? selectedCustomerOptions
    : Object.entries(CurrencySymbols).map(([code, symbol]) => ({ code, symbol, isDefault: code === "INR" }))

  const handleSave = useCallback(async () => {
    if (saving) return
    if (!docNumber.trim()) { toast.error("Document number is required"); return }
    if (!issueDate) { toast.error("Issue date is required"); return }
    if (!dueDate) { toast.error("Due date is required"); return }
    if (items.length === 0 || items.every((i) => !i.description.trim())) {
      toast.error("At least one item with a description is required")
      return
    }
    setSaving(true)
    try {
      const company: CompanyInfo = {
        logo: companyLogo,
        companyName,
        email: companyEmail,
        website: companyWebsite,
        address: companyAddress,
        taxNumber: companyTaxNumber,
        phone: companyPhone,
      }
      const itemsData: Item[] = items.map((item) => ({
        ...item,
        total: item.quantity * item.price,
      }))
      const docData: Omit<Document, "id" | "createdAt" | "updatedAt"> = {
        docType,
        status,
        docNumber,
        referenceNumber,
        poNumber,
        issueDate,
        dueDate,
        company,
        customer: selectedCustomer,
        billTo: selectedCustomer?.billingAddress || "",
        shipTo: selectedCustomer?.shippingAddress || "",
        items: itemsData,
        subtotal,
        discountTotal,
        taxTotal,
        shipping,
        additionalCharges,
        grandTotal,
        currency,
        currencySymbol,
        numberFormat: settings?.numberFormat || "indian",
        payment: { method: paymentMethod, details: paymentDetails, upiId },
        payments: docPayments,
        documentDiscount,
        documentDiscountType,
        notes,
        terms,
        signature,
        stamp,
        template: settings?.selectedTemplate || "minimal",
      }
      if (documentId) {
        await docStore.update(documentId, docData)
        toast.success("Document updated")
      } else {
        const config = settings?.numbering[docType] || getDefaultNumberingConfig(docType)
        const docDataWithNumber = { ...docData, docNumber: docData.docNumber || generateDocNumber(config) }
        await docStore.add(docDataWithNumber)
        if (settings) {
          const currentConfig = settings.numbering[docType] || getDefaultNumberingConfig(docType)
          await settingsStore.updateNumbering(docType, { ...currentConfig, nextNumber: currentConfig.nextNumber + 1 })
        }
        toast.success("Document saved")
      }
      router.push("/documents")
    } catch {
      toast.error("Failed to save document")
    } finally {
      setSaving(false)
    }
  }, [saving, companyLogo, companyName, companyEmail, companyWebsite, companyAddress, companyTaxNumber, companyPhone, items, docType, status, docNumber, referenceNumber, poNumber, issueDate, dueDate, selectedCustomer, subtotal, discountTotal, taxTotal, shipping, additionalCharges, grandTotal, currency, currencySymbol, settings, paymentMethod, paymentDetails, upiId, notes, terms, signature, stamp, documentId, docStore, settingsStore, router])

  const handleDuplicate = useCallback(() => {
    if (!documentId) {
      toast.error("Save the document first before duplicating")
      return
    }
    docStore.duplicate(documentId).then((doc) => {
      if (doc) {
        toast.success("Document duplicated")
        router.push(`/documents/${doc.id}`)
      }
    })
  }, [documentId, docStore, router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        if (documentId) {
          router.push(`/documents/${documentId}/preview`)
        } else {
          toast.error("Save the document first to preview")
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault()
        handleDuplicate()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleSave, handleDuplicate, documentId, router])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!loaded) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" /></div>
  }

  const inputClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {documentId ? "Edit" : "New"} {DocTypeLabel[docType]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Fill in the details below</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={() => {
            if (documentId) router.push(`/documents/${documentId}/preview`)
            else toast.error("Save first to preview")
          }}>
            <Printer className="mr-1 h-4 w-4" /> Preview
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="h-16 w-16 rounded-lg object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-xs">Logo</div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="logo-upload">Company Logo</Label>
              <Input id="logo-upload" type="file" accept="image/*" onChange={handleCompanyLogo} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Company Name" htmlFor="companyName" icon={<Building2 className="h-3.5 w-3.5" />}>
              <Input id="companyName" placeholder="Acme Corporation" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </FormField>
            <FormField label="Email" htmlFor="companyEmail" icon={<Mail className="h-3.5 w-3.5" />}>
              <Input id="companyEmail" type="email" placeholder="contact@company.com" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
            </FormField>
            <FormField label="Website" htmlFor="companyWebsite" icon={<Globe className="h-3.5 w-3.5" />}>
              <Input id="companyWebsite" placeholder="www.company.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
            </FormField>
            <FormField label="Address" htmlFor="companyAddress" className="md:col-span-2" icon={<MapPin className="h-3.5 w-3.5" />}>
              <Input id="companyAddress" placeholder="123 Business Street, City" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
            </FormField>
            <FormField label="Tax Number" htmlFor="companyTaxNumber" icon={<Hash className="h-3.5 w-3.5" />}>
              <Input id="companyTaxNumber" placeholder="GST123456789" value={companyTaxNumber} onChange={(e) => setCompanyTaxNumber(e.target.value)} />
            </FormField>
            <FormField label="Phone" htmlFor="companyPhone" icon={<Phone className="h-3.5 w-3.5" />}>
              <Input id="companyPhone" placeholder="+1 (555) 123-4567" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer & Document Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField label="Customer" icon={<Search className="h-3.5 w-3.5" />}>
                <div className="relative" ref={customerDropdownRef}>
                  <input
                    className={inputClass}
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true) }}
                    onFocus={() => setCustomerDropdownOpen(true)}
                  />
                  {customerDropdownOpen && (
                    <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="px-3 py-2 text-sm">
                          <p className="text-muted-foreground mb-1.5">No customers found</p>
                          <Link
                            href="/customers/new"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            onClick={() => setCustomerDropdownOpen(false)}
                          >
                            <Plus className="h-3 w-3" /> Create new customer
                          </Link>
                        </div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent", selectedCustomer?.id === c.id && "bg-accent")}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomerDropdownOpen(false) }}
                          >
                            <div className="font-medium">{c.customerName}</div>
                            {c.companyName && <div className="text-xs text-muted-foreground">{c.companyName}</div>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </FormField>
              {selectedCustomer && (
                <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                  <div className="text-sm font-medium">{selectedCustomer.customerName}</div>
                  {selectedCustomer.companyName && <div className="text-xs text-muted-foreground">{selectedCustomer.companyName}</div>}
                  <div className="pt-2 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Bill To</div>
                    <div className="text-xs">{selectedCustomer.billingAddress || "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Ship To</div>
                    <div className="text-xs">{selectedCustomer.shippingAddress || "—"}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Document Number" htmlFor="docNumber" icon={<FileText className="h-3.5 w-3.5" />}>
                  <Input id="docNumber" placeholder="INV-0001" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
                </FormField>
                <FormField label="Reference #" htmlFor="referenceNumber" icon={<Hash className="h-3.5 w-3.5" />}>
                  <Input id="referenceNumber" placeholder="REF-001" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
                </FormField>
                <FormField label="PO Number" htmlFor="poNumber" icon={<Hash className="h-3.5 w-3.5" />}>
                  <Input id="poNumber" placeholder="PO-12345" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                </FormField>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as DocumentStatus)}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[32px_1fr_80px_70px_100px_80px_80px_80px_100px_44px_44px] gap-1 px-1 py-2 text-xs font-medium text-muted-foreground border-b mb-2">
                  <div />
                  <div>Description</div>
                  <div>Qty</div>
                  <div>Unit</div>
                  <div>Price</div>
                  <div>Disc</div>
                  <div>Tax</div>
                  <div className="text-right">Total</div>
                  <div />
                  <div />
                </div>
                {items.map((item, index) => (
                    <SortableItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      items={items}
                      onUpdate={handleItemUpdate}
                      onDuplicate={handleItemDuplicate}
                      onRemove={handleItemRemove}
                      products={products}
                    />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Button variant="outline" size="sm" className="mt-3" onClick={addItem}>
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount Total</span>
                <span className="font-medium text-destructive">-{currencySymbol}{discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax Total</span>
                <span className="font-medium">{currencySymbol}{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <input
                  className="w-24 h-7 rounded border border-input bg-transparent px-2 text-sm text-right tabular-nums"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping || ""}
                  onChange={(e) => setShipping(toFiniteNumber(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Additional Charges</span>
                <input
                  className="w-24 h-7 rounded border border-input bg-transparent px-2 text-sm text-right tabular-nums"
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalCharges || ""}
                  onChange={(e) => setAdditionalCharges(toFiniteNumber(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Doc Discount</span>
                <div className="flex items-center gap-0.5">
                  <input
                    className="w-20 h-7 rounded border border-input bg-transparent px-2 text-sm text-right tabular-nums"
                    type="number"
                    step="0.01"
                    min="0"
                    value={documentDiscount || ""}
                    onChange={(e) => setDocumentDiscount(toFiniteNumber(e.target.value))}
                  />
                  <button
                    type="button"
                    className="w-6 h-7 text-[10px] font-medium rounded border border-input bg-transparent hover:bg-accent"
                    onClick={() => setDocumentDiscountType(documentDiscountType === "percentage" ? "fixed" : "percentage")}
                    title={documentDiscountType === "percentage" ? "Percentage" : "Fixed"}
                  >
                    {documentDiscountType === "percentage" ? "%" : "$"}
                  </button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Grand Total</span>
                <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={customCurrency || currency}
                onValueChange={(v) => {
                  if (v === "__custom__") {
                    setCustomCurrency("$")
                    setCurrency("CUSTOM")
                  } else {
                    setCustomCurrency("")
                    setCurrency(v)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {customCurrency && (
              <div className="space-y-1.5">
                <Label>Custom Currency Symbol</Label>
                <Input value={customCurrency} onChange={(e) => setCustomCurrency(e.target.value)} placeholder="e.g. $, €, ₹" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@upi" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="paymentDetails">Payment Details</Label>
              <textarea
                id="paymentDetails"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
              />
            </div>
          </div>
          {qrCodeUrl && (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
              <img src={qrCodeUrl} alt="UPI QR Code" className="h-24 w-24" />
              <div className="text-sm text-muted-foreground">Scan this QR code to pay via UPI</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {docPayments.length > 0 && (
            <div className="space-y-2">
              {docPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-green-600">{currencySymbol}{p.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">{p.date}</span>
                    {p.method && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{p.method}</span>}
                    {p.notes && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{p.notes}</span>}
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDocPayments((prev) => prev.filter((pp) => pp.id !== p.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="text-sm font-medium text-right">
                Total Received: {currencySymbol}
                {docPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)} &nbsp;|&nbsp;
                Balance: {currencySymbol}
                {(grandTotal - docPayments.reduce((s, p) => s + p.amount, 0)).toFixed(2)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={newPayDate} onChange={(e) => setNewPayDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" step="0.01" min="0" value={newPayAmount || ""} onChange={(e) => setNewPayAmount(toFiniteNumber(e.target.value))} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Input value={newPayMethod} onChange={(e) => setNewPayMethod(e.target.value)} placeholder="Cash, Bank, UPI..." />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={newPayNotes} onChange={(e) => setNewPayNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!newPayDate || newPayAmount <= 0) {
                toast.error("Please enter a valid date and amount")
                return
              }
              setDocPayments((prev) => [...prev, {
                id: generateId(),
                date: newPayDate,
                amount: newPayAmount,
                method: newPayMethod,
                notes: newPayNotes,
              }])
              setNewPayDate("")
              setNewPayAmount(0)
              setNewPayMethod("")
              setNewPayNotes("")
              toast.success("Payment recorded")
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Payment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              {settings && settings.noteTemplates.length > 0 && (
                <Select onValueChange={(v) => {
                  const tmpl = settings.noteTemplates.find((t) => t.id === v)
                  if (tmpl) setNotes(tmpl.content)
                }}>
                  <SelectTrigger className="w-40 h-7 text-xs">
                    <SelectValue placeholder="Pick template" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.noteTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <textarea
              id="notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the customer..."
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="terms">Terms & Conditions</Label>
              {settings && settings.termsTemplates.length > 0 && (
                <Select onValueChange={(v) => {
                  const tmpl = settings.termsTemplates.find((t) => t.id === v)
                  if (tmpl) setTerms(tmpl.content)
                }}>
                  <SelectTrigger className="w-40 h-7 text-xs">
                    <SelectValue placeholder="Pick template" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.termsTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <textarea
              id="terms"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Terms and conditions..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signature & Stamp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Signature</Label>
              {signature ? (
                <div className="relative inline-block">
                  <img src={signature} alt="Signature" className="h-20 border rounded" />
                  <button
                    type="button"
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive align-top"
                    onClick={() => setSignature("")}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Pen className="mr-1 h-4 w-4" /> Draw Signature
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Draw Signature</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-md">
                      <SignatureCanvas
                        ref={sigRef}
                        penColor="black"
                        canvasProps={{ className: "w-full h-40 rounded-md", style: { width: "100%", height: 160 } }}
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={clearSignature}>Clear</Button>
                      <Button size="sm" onClick={saveSignature}>Save Signature</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stamp-upload">Stamp</Label>
              {stamp ? (
                <div className="relative inline-block">
                  <img src={stamp} alt="Stamp" className="h-20 border rounded" />
                  <button
                    type="button"
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive align-top"
                    onClick={() => setStamp("")}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <Input id="stamp-upload" type="file" accept="image/*" onChange={handleStamp} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-background border-t py-3 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button variant="outline" onClick={handleDuplicate} disabled={!documentId}>
          <Copy className="mr-1 h-4 w-4" /> Duplicate
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save Document"}
        </Button>
      </div>
    </div>
  )
}
