"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import type {
  TaxPreset, NoteTemplate, TermsTemplate, NumberingConfig,
  Template, DocumentType, CompanyInfo, Settings,
} from "@/src/types"
import {
  TAX_TYPES, PAYMENT_METHODS, DocTypeLabel, DOCUMENT_TYPES,
  TEMPLATES, CurrencySymbols, defaultCurrencies,
  NumberingConfigSchema,
} from "@/src/types"
import { cn } from "@/src/lib/utils"
import { PageHeader } from "@/src/components/shared/page-header"
import { FormField } from "@/src/components/shared/form-field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/src/components/ui/select"
import { Separator } from "@/src/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/src/components/ui/dialog"
import { Checkbox } from "@/src/components/ui/checkbox"
import { EmptyState } from "@/src/components/shared/empty-state"
import { Textarea } from "@/src/components/ui/textarea"
import { Plus, Trash2, Download, Upload, Percent, CreditCard, FileText, FileSignature, Building2, Mail, Globe, MapPin, Hash, Phone, Type, ListOrdered } from "lucide-react"
import { toast } from "sonner"
import { generateId } from "@/src/lib/formatters"

const defaultCurrencyCodes = new Set(defaultCurrencies.map((c) => c.code))

const taxTypeLabels: Record<string, string> = {
  gst: "GST", cgst: "CGST", sgst: "SGST", igst: "IGST",
  vat: "VAT", "sales-tax": "Sales Tax", custom: "Custom",
}

const paymentTypeLabels: Record<string, string> = {
  upi: "UPI", "bank-transfer": "Bank Transfer", paypal: "PayPal",
  stripe: "Stripe", cash: "Cash", cheque: "Cheque", custom: "Custom",
}

const templateLabels: Record<string, string> = {
  minimal: "Minimal", modern: "Modern", corporate: "Corporate",
  elegant: "Elegant", dark: "Dark",
}

export default function SettingsPage() {
  const {
    settings, loaded, load,
    updateCompany, updateTaxPresets, updateCurrencies,
    updatePaymentMethods, updateNumbering, updateNoteTemplates,
    updateTermsTemplates, updateSelectedTemplate, updateTheme, updateNumberFormat,
  } = useSettingsStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [companyForm, setCompanyForm] = useState<CompanyInfo>({
    logo: "", companyName: "", email: "", website: "",
    address: "", taxNumber: "", phone: "",
  })

  useEffect(() => {
    if (!loaded) {
      load()
    }
  }, [loaded, load])

  useEffect(() => {
    if (settings) setCompanyForm({ ...settings.company })
  }, [settings?.company])

  async function handleSaveCompany() {
    await updateCompany(companyForm)
    toast.success("Company info updated")
  }

  const [taxDialogOpen, setTaxDialogOpen] = useState(false)
  const [taxEditTarget, setTaxEditTarget] = useState<TaxPreset | null>(null)
  const [taxForm, setTaxForm] = useState<TaxPreset>({
    id: "", name: "", type: "gst", rate: 0, isDefault: false,
  })

  function openAddTax() {
    setTaxEditTarget(null)
    setTaxForm({ id: generateId(), name: "", type: "gst", rate: 0, isDefault: false })
    setTaxDialogOpen(true)
  }

  function openEditTax(tax: TaxPreset) {
    setTaxEditTarget(tax)
    setTaxForm({ ...tax })
    setTaxDialogOpen(true)
  }

  async function handleSaveTax() {
    if (!settings) return
    let updated = [...settings.taxPresets]
    if (taxEditTarget) {
      updated = updated.map((t) => (t.id === taxEditTarget.id ? taxForm : t))
    } else {
      updated.push(taxForm)
    }
    if (taxForm.isDefault) {
      updated = updated.map((t) => ({ ...t, isDefault: t.id === taxForm.id }))
    }
    await updateTaxPresets(updated)
    setTaxDialogOpen(false)
    toast.success(`Tax ${taxEditTarget ? "updated" : "added"}`)
  }

  async function handleDeleteTax(id: string) {
    if (!settings) return
    await updateTaxPresets(settings.taxPresets.filter((t) => t.id !== id))
    toast.success("Tax deleted")
  }

  const [newCurrencyCode, setNewCurrencyCode] = useState("")
  const [newCurrencySymbol, setNewCurrencySymbol] = useState("")
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false)

  function openAddCurrency() {
    setNewCurrencyCode("")
    setNewCurrencySymbol("")
    setCurrencyDialogOpen(true)
  }

  async function handleAddCurrency() {
    if (!settings) return
    const code = newCurrencyCode.trim().toUpperCase()
    if (!code) {
      toast.error("Currency code is required")
      return
    }
    if (settings.currencies.some((c) => c.code === code)) {
      toast.error("Currency already exists")
      return
    }
    const updated = [
      ...settings.currencies,
      { code, symbol: newCurrencySymbol.trim() || CurrencySymbols[code] || code, isDefault: false },
    ]
    await updateCurrencies(updated)
    setNewCurrencyCode("")
    setNewCurrencySymbol("")
    setCurrencyDialogOpen(false)
    toast.success("Currency added")
  }

  async function handleSetDefaultCurrency(code: string) {
    if (!settings) return
    const updated = settings.currencies.map((c) => ({ ...c, isDefault: c.code === code }))
    await updateCurrencies(updated)
    toast.success("Default currency updated")
  }

  async function handleRemoveCurrency(code: string) {
    if (!settings) return
    const updated = settings.currencies.filter((c) => c.code !== code)
    await updateCurrencies(updated)
    toast.success("Currency removed")
  }

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentEditTarget, setPaymentEditTarget] = useState<{
    id: string; name: string; type: string; details: string
  } | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    id: "", name: "", type: "upi", details: "",
  })

  function openAddPayment() {
    setPaymentEditTarget(null)
    setPaymentForm({ id: generateId(), name: "", type: "upi", details: "" })
    setPaymentDialogOpen(true)
  }

  function openEditPayment(method: typeof paymentForm) {
    setPaymentEditTarget(method)
    setPaymentForm({ ...method })
    setPaymentDialogOpen(true)
  }

  async function handleSavePayment() {
    if (!settings) return
    let updated = [...settings.paymentMethods]
    if (paymentEditTarget) {
      updated = updated.map((m) => (m.id === paymentEditTarget.id ? paymentForm : m))
    } else {
      updated.push(paymentForm)
    }
    await updatePaymentMethods(updated)
    setPaymentDialogOpen(false)
    toast.success(`Payment method ${paymentEditTarget ? "updated" : "added"}`)
  }

  async function handleDeletePayment(id: string) {
    if (!settings) return
    await updatePaymentMethods(settings.paymentMethods.filter((m) => m.id !== id))
    toast.success("Payment method deleted")
  }

  const [numberingMap, setNumberingMap] = useState<Record<string, NumberingConfig>>({})

  useEffect(() => {
    if (settings) setNumberingMap({ ...settings.numbering })
  }, [settings?.numbering])

  function updateNumberingEntry(type: string, field: keyof NumberingConfig, value: string | number) {
    setNumberingMap((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }))
  }

  async function handleSaveNumbering() {
    for (const type of DOCUMENT_TYPES) {
      const config = numberingMap[type]
      if (config) {
        await updateNumbering(type, config)
      }
    }
    toast.success("Numbering updated")
  }

  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteEditTarget, setNoteEditTarget] = useState<NoteTemplate | null>(null)
  const [noteForm, setNoteForm] = useState<NoteTemplate>({ id: "", name: "", content: "" })

  function openAddNote() {
    setNoteEditTarget(null)
    setNoteForm({ id: generateId(), name: "", content: "" })
    setNoteDialogOpen(true)
  }

  function openEditNote(note: NoteTemplate) {
    setNoteEditTarget(note)
    setNoteForm({ ...note })
    setNoteDialogOpen(true)
  }

  async function handleSaveNote() {
    if (!settings) return
    let updated = [...settings.noteTemplates]
    if (noteEditTarget) {
      updated = updated.map((n) => (n.id === noteEditTarget.id ? noteForm : n))
    } else {
      updated.push(noteForm)
    }
    await updateNoteTemplates(updated)
    setNoteDialogOpen(false)
    toast.success(`Note template ${noteEditTarget ? "updated" : "added"}`)
  }

  async function handleDeleteNote(id: string) {
    if (!settings) return
    await updateNoteTemplates(settings.noteTemplates.filter((n) => n.id !== id))
    toast.success("Note template deleted")
  }

  const [termsDialogOpen, setTermsDialogOpen] = useState(false)
  const [termsEditTarget, setTermsEditTarget] = useState<TermsTemplate | null>(null)
  const [termsForm, setTermsForm] = useState<TermsTemplate>({ id: "", name: "", content: "" })

  function openAddTerms() {
    setTermsEditTarget(null)
    setTermsForm({ id: generateId(), name: "", content: "" })
    setTermsDialogOpen(true)
  }

  function openEditTerms(terms: TermsTemplate) {
    setTermsEditTarget(terms)
    setTermsForm({ ...terms })
    setTermsDialogOpen(true)
  }

  async function handleSaveTerms() {
    if (!settings) return
    let updated = [...settings.termsTemplates]
    if (termsEditTarget) {
      updated = updated.map((t) => (t.id === termsEditTarget.id ? termsForm : t))
    } else {
      updated.push(termsForm)
    }
    await updateTermsTemplates(updated)
    setTermsDialogOpen(false)
    toast.success(`Terms template ${termsEditTarget ? "updated" : "added"}`)
  }

  async function handleDeleteTerms(id: string) {
    if (!settings) return
    await updateTermsTemplates(settings.termsTemplates.filter((t) => t.id !== id))
    toast.success("Terms template deleted")
  }

  const { setTheme } = useTheme()

  async function handleThemeChange(theme: "light" | "dark" | "system") {
    await updateTheme(theme)
    setTheme(theme)
    toast.success("Theme updated")
  }

  async function handleNumberFormatChange(format: "indian" | "international") {
    await updateNumberFormat(format)
    toast.success("Number format updated")
  }

  function handleDownload() {
    if (!settings) return
    const json = JSON.stringify(settings, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "business-kit-settings.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Settings exported")
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Settings
      if (!data.company || !data.numbering) {
        toast.error("Invalid settings file")
        return
      }
      await updateCompany(data.company)
      await updateTaxPresets(data.taxPresets || [])
      await updateCurrencies(data.currencies || [])
      await updatePaymentMethods(data.paymentMethods || [])
      const validNumbering: Partial<Record<DocumentType, NumberingConfig>> = {}
      for (const type of DOCUMENT_TYPES) {
        const cfg = data.numbering[type]
        if (cfg) {
          try {
            const parsed = NumberingConfigSchema.parse(cfg)
            validNumbering[type] = parsed
          } catch {
            // skip invalid numbering entries
          }
        }
      }
      for (const type of DOCUMENT_TYPES) {
        const cfg = validNumbering[type]
        if (cfg) await updateNumbering(type, cfg)
      }
      await updateNoteTemplates(data.noteTemplates || [])
      await updateTermsTemplates(data.termsTemplates || [])
      if (data.selectedTemplate) await updateSelectedTemplate(data.selectedTemplate)
      if (data.theme) await updateTheme(data.theme)
      if (data.numberFormat) await updateNumberFormat(data.numberFormat)
      toast.success("Settings imported")
    } catch {
      toast.error("Invalid JSON file")
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (!loaded || !settings) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your business settings" />

      <Tabs defaultValue="company">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="numbering">Numbering</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Company Logo" className="sm:col-span-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = () =>
                          setCompanyForm((p) => ({ ...p, logo: reader.result as string }))
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  {companyForm.logo ? (
                    <div className="relative inline-block">
                      <img
                        src={companyForm.logo}
                        alt="Company logo"
                        className="h-24 w-24 rounded-xl border bg-white object-contain shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setCompanyForm((p) => ({ ...p, logo: "" }))}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                        title="Remove logo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs font-medium">Upload logo</span>
                    </button>
                  )}
                </FormField>
                <FormField label="Company Name" htmlFor="co-name" icon={<Building2 className="h-3.5 w-3.5" />}>
                  <Input
                    id="co-name"
                    placeholder="Acme Corporation"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, companyName: e.target.value }))}
                  />
                </FormField>
                <FormField label="Email" htmlFor="co-email" icon={<Mail className="h-3.5 w-3.5" />}>
                  <Input
                    id="co-email"
                    type="email"
                    placeholder="contact@company.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </FormField>
                <FormField label="Website" htmlFor="co-website" icon={<Globe className="h-3.5 w-3.5" />}>
                  <Input
                    id="co-website"
                    placeholder="www.company.com"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, website: e.target.value }))}
                  />
                </FormField>
                <FormField label="Address" htmlFor="co-address" className="sm:col-span-2" icon={<MapPin className="h-3.5 w-3.5" />}>
                  <Input
                    id="co-address"
                    placeholder="123 Business Street, City"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </FormField>
                <FormField label="Tax Number" htmlFor="co-tax" icon={<Hash className="h-3.5 w-3.5" />}>
                  <Input
                    id="co-tax"
                    placeholder="GST123456789"
                    value={companyForm.taxNumber}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, taxNumber: e.target.value }))}
                  />
                </FormField>
                <FormField label="Phone" htmlFor="co-phone" icon={<Phone className="h-3.5 w-3.5" />}>
                  <Input
                    id="co-phone"
                    placeholder="+1 (555) 123-4567"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </FormField>
              </div>
              <Button className="mt-6" onClick={handleSaveCompany}>
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tax Presets</CardTitle>
              <Button size="sm" onClick={openAddTax}>
                <Plus className="mr-1 h-4 w-4" /> Add Tax
              </Button>
            </CardHeader>
            <CardContent>
              {settings.taxPresets.length === 0 ? (
                <EmptyState icon={Percent} title="No tax presets yet" description="Add GST, VAT, or custom tax rates to use in your documents." action={<Button size="sm" onClick={openAddTax}>Add Tax</Button>} />
              ) : (
                <div className="space-y-3">
                  {settings.taxPresets.map((tax) => (
                    <div key={tax.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{tax.name}</span>
                        <span className="text-xs text-muted-foreground">{taxTypeLabels[tax.type] || tax.type}</span>
                        <span className="text-sm">{tax.rate}%</span>
                        {tax.isDefault && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditTax(tax)}>
                          <span className="sr-only">Edit</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTax(tax.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{taxEditTarget ? "Edit Tax" : "Add Tax"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="Name" htmlFor="tax-name" icon={<Type className="h-3.5 w-3.5" />}>
                  <Input
                    id="tax-name"
                    placeholder="GST 18%"
                    value={taxForm.name}
                    onChange={(e) => setTaxForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </FormField>
                <FormField label="Type" htmlFor="tax-type">
                  <Select
                    value={taxForm.type}
                    onValueChange={(v) => setTaxForm((p) => ({ ...p, type: v as TaxPreset["type"] }))}
                  >
                    <SelectTrigger id="tax-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {taxTypeLabels[t] || t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Rate (%)" htmlFor="tax-rate" icon={<Percent className="h-3.5 w-3.5" />}>
                  <Input
                    id="tax-rate"
                    type="number"
                    placeholder="18"
                    min="0"
                    step="0.01"
                    value={taxForm.rate}
                    onChange={(e) => setTaxForm((p) => ({ ...p, rate: parseFloat(e.target.value) || 0 }))}
                  />
                </FormField>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tax-default"
                    checked={taxForm.isDefault}
                    onCheckedChange={(v) => setTaxForm((p) => ({ ...p, isDefault: v === true }))}
                  />
                  <Label htmlFor="tax-default" className="cursor-pointer">
                    Set as default tax
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTax}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="currencies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-medium">Currencies</CardTitle>
              <Button size="sm" onClick={openAddCurrency}>
                <Plus className="mr-1 h-4 w-4" /> Add Currency
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y rounded-md border text-sm">
                {settings.currencies.map((cur) => (
                  <div key={cur.code} className="flex items-center justify-between px-4 py-2 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-semibold w-8">{cur.symbol}</span>
                      <span className="font-medium text-muted-foreground">{cur.code}</span>
                      {cur.isDefault && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!cur.isDefault && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSetDefaultCurrency(cur.code)}>
                          Set Default
                        </Button>
                      )}
                      {!defaultCurrencyCodes.has(cur.code) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveCurrency(cur.code)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Currency</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <FormField label="Currency Code" htmlFor="new-curr-code">
                  <Input
                    id="new-curr-code"
                    placeholder="USD"
                    className="uppercase"
                    value={newCurrencyCode}
                    onChange={(e) => setNewCurrencyCode(e.target.value)}
                  />
                </FormField>
                <FormField label="Symbol" htmlFor="new-curr-symbol">
                  <Input
                    id="new-curr-symbol"
                    placeholder="$"
                    value={newCurrencySymbol}
                    onChange={(e) => setNewCurrencySymbol(e.target.value)}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCurrencyDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCurrency}>Add Currency</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-medium">Payment Methods</CardTitle>
              <Button size="sm" onClick={openAddPayment}>
                <Plus className="mr-1 h-4 w-4" /> Add Method
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {settings.paymentMethods.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payment methods yet" description="Add UPI, bank transfer, PayPal, or other payment options." action={<Button size="sm" onClick={openAddPayment}>Add Method</Button>} />
              ) : (
                <div className="divide-y rounded-md border text-sm">
                  {settings.paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between px-4 py-2 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{method.name}</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {paymentTypeLabels[method.type] || method.type}
                        </span>
                        {method.details && (
                          <span className="text-xs text-muted-foreground truncate max-w-xs">— {method.details}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPayment(method)}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePayment(method.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{paymentEditTarget ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="Name" htmlFor="pay-name" icon={<CreditCard className="h-3.5 w-3.5" />}>
                  <Input
                    id="pay-name"
                    placeholder="Bank Transfer"
                    value={paymentForm.name}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </FormField>
                <FormField label="Type" htmlFor="pay-type">
                  <Select
                    value={paymentForm.type}
                    onValueChange={(v) => setPaymentForm((p) => ({ ...p, type: v }))}
                  >
                    <SelectTrigger id="pay-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {paymentTypeLabels[t] || t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Details" htmlFor="pay-details">
                  <Input
                    id="pay-details"
                    placeholder="Account: 1234567890"
                    value={paymentForm.details}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, details: e.target.value }))}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSavePayment}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="numbering">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-medium">Document Numbering</CardTitle>
              <Button size="sm" onClick={handleSaveNumbering}>
                Save All
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-md border text-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-3 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                  <div className="col-span-3 flex items-center">Document Type</div>
                  <div className="col-span-3">Prefix</div>
                  <div className="col-span-3">Next Number</div>
                  <div className="col-span-3">Padding</div>
                </div>
                <div className="divide-y">
                  {DOCUMENT_TYPES.map((type) => {
                    const config = numberingMap[type]
                    if (!config) return null
                    return (
                      <div key={type} className="grid grid-cols-12 gap-3 px-4 py-2 hover:bg-muted/30 items-center">
                        <div className="col-span-3 font-medium text-foreground">
                          {DocTypeLabel[type]}
                        </div>
                        <div className="col-span-3">
                          <Input
                            id={`num-prefix-${type}`}
                            placeholder="INV-"
                            className="h-8 text-xs py-1"
                            value={config.prefix || ""}
                            onChange={(e) => updateNumberingEntry(type, "prefix", e.target.value)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            id={`num-next-${type}`}
                            type="number"
                            placeholder="1"
                            min="1"
                            className="h-8 text-xs py-1"
                            value={config.nextNumber || 1}
                            onChange={(e) => updateNumberingEntry(type, "nextNumber", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            id={`num-pad-${type}`}
                            type="number"
                            placeholder="4"
                            min="1"
                            max="10"
                            className="h-8 text-xs py-1"
                            value={config.padding || 1}
                            onChange={(e) => updateNumberingEntry(type, "padding", parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Note Templates</CardTitle>
              <Button size="sm" onClick={openAddNote}>
                <Plus className="mr-1 h-4 w-4" /> Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {settings.noteTemplates.length === 0 ? (
                <EmptyState icon={FileText} title="No note templates yet" description="Create reusable notes like payment terms or thank-you messages." action={<Button size="sm" onClick={openAddNote}>Add Note</Button>} />
              ) : (
                <div className="space-y-3">
                  {settings.noteTemplates.map((note) => (
                    <div key={note.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{note.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{note.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <Button variant="ghost" size="icon" onClick={() => openEditNote(note)}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{noteEditTarget ? "Edit Note" : "Add Note"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="Name" htmlFor="note-name" icon={<FileText className="h-3.5 w-3.5" />}>
                  <Input
                    id="note-name"
                    placeholder="Thank you note"
                    value={noteForm.name}
                    onChange={(e) => setNoteForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </FormField>
                <FormField label="Content" htmlFor="note-content">
                  <Textarea
                    id="note-content"
                    className="min-h-[80px]"
                    placeholder="Enter note content..."
                    value={noteForm.content}
                    onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNote}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Terms &amp; Conditions Templates</CardTitle>
              <Button size="sm" onClick={openAddTerms}>
                <Plus className="mr-1 h-4 w-4" /> Add Terms
              </Button>
            </CardHeader>
            <CardContent>
              {settings.termsTemplates.length === 0 ? (
                <EmptyState icon={FileSignature} title="No terms templates yet" description="Create reusable terms and conditions for your documents." action={<Button size="sm" onClick={openAddTerms}>Add Terms</Button>} />
              ) : (
                <div className="space-y-3">
                  {settings.termsTemplates.map((terms) => (
                    <div key={terms.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{terms.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{terms.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <Button variant="ghost" size="icon" onClick={() => openEditTerms(terms)}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTerms(terms.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{termsEditTarget ? "Edit Terms" : "Add Terms"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="Name" htmlFor="terms-name" icon={<FileSignature className="h-3.5 w-3.5" />}>
                  <Input
                    id="terms-name"
                    placeholder="Net 30 Terms"
                    value={termsForm.name}
                    onChange={(e) => setTermsForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </FormField>
                <FormField label="Content" htmlFor="terms-content">
                  <Textarea
                    id="terms-content"
                    className="min-h-[80px]"
                    placeholder="Enter terms content..."
                    value={termsForm.content}
                    onChange={(e) => setTermsForm((p) => ({ ...p, content: e.target.value }))}
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTermsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTerms}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Document Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {TEMPLATES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => {
                      updateSelectedTemplate(template)
                      toast.success(`Template set to ${templateLabels[template]}`)
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-6 transition-all hover:bg-accent",
                      settings.selectedTemplate === template
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-16 w-full rounded border",
                        template === "minimal" && "bg-white border-gray-200",
                        template === "modern" && "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
                        template === "corporate" && "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200",
                        template === "elegant" && "bg-gradient-to-br from-stone-50 to-stone-100 border-stone-200",
                        template === "dark" && "bg-gray-900 border-gray-700",
                      )}
                    />
                    <span className="text-sm font-medium">{templateLabels[template]}</span>
                    {settings.selectedTemplate === template && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {(["light", "dark", "system"] as const).map((theme) => (
                    <Button
                      key={theme}
                      variant={settings.theme === theme ? "default" : "outline"}
                      onClick={() => handleThemeChange(theme)}
                      className="capitalize"
                    >
                      {theme}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Number Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {(["indian", "international"] as const).map((fmt) => (
                    <Button
                      key={fmt}
                      variant={settings.numberFormat === fmt ? "default" : "outline"}
                      onClick={() => handleNumberFormatChange(fmt)}
                      className="capitalize"
                    >
                      {fmt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download all your settings as a JSON file. You can use this file to restore your settings later.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a previously exported settings JSON file to restore your configuration.
                </p>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
