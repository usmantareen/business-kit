"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSettingsStore } from "@/src/lib/stores/settings-store"
import { TEMPLATES, type Template } from "@/src/types"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Building2, Palette, FileText, CheckCircle2, ArrowLeft, X, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/src/lib/utils"

const steps = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "numbering", label: "Template", icon: FileText },
  { id: "done", label: "Done", icon: CheckCircle2 },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+\d][\d\s\-().]{6,}$/

type FieldErrors = Partial<Record<"companyName" | "email" | "phone" | "website" | "address" | "taxNumber", string>>

function validateCompany(company: { companyName: string; email: string; phone: string; website: string }): FieldErrors {
  const errs: FieldErrors = {}
  if (!company.companyName.trim()) errs.companyName = "Company name is required"
  if (!company.email.trim()) errs.email = "Email is required"
  else if (!EMAIL_RE.test(company.email.trim())) errs.email = "Enter a valid email address"
  if (!company.phone.trim()) errs.phone = "Phone is required"
  else if (!PHONE_RE.test(company.phone.trim())) errs.phone = "Enter a valid phone number"
  if (company.website.trim() && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/.test(company.website.trim())) {
    errs.website = "Enter a valid website (e.g. company.com)"
  }
  return errs
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon
          const isCurrent = i === current
          const isComplete = i < current
          return (
            <div key={s.id} className="flex flex-1 items-center gap-1.5 sm:gap-2 last:flex-none">
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <div
                  className={cn(
                    "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-300 ring-1",
                    isCurrent && "bg-primary text-primary-foreground ring-primary shadow-sm scale-105",
                    isComplete && "bg-primary/10 text-primary ring-primary/30",
                    !isCurrent && !isComplete && "bg-muted text-muted-foreground ring-border"
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-medium transition-colors duration-200",
                    isCurrent ? "text-foreground" : isComplete ? "text-foreground/70" : "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mb-4 sm:mb-4.5 transition-colors duration-300",
                    isComplete ? "bg-primary/40" : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1 text-[11px] text-destructive mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  )
}

interface OnboardingWizardProps {
  onClose?: () => void
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps = {}) {
  const { settings, updateCompany, updateNumberFormat, updateSelectedTemplate, updateOnboardingComplete } = useSettingsStore()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [company, setCompany] = useState(settings?.company || { logo: "", companyName: "", email: "", website: "", address: "", taxNumber: "", phone: "" })
  const [numberFormat, setNumberFormatState] = useState<"indian" | "international">(settings?.numberFormat || "indian")
  const [template, setTemplate] = useState(settings?.selectedTemplate || "minimal")
  const [errors, setErrors] = useState<FieldErrors>({})

  const companyErrors = useMemo(() => validateCompany(company), [company])
  const isCompanyStepValid = Object.keys(companyErrors).length === 0

  const handleNext = async () => {
    if (step === 0) {
      const errs = validateCompany(company)
      setErrors(errs)
      if (Object.keys(errs).length > 0) return
      await updateCompany(company)
    } else if (step === 1) {
      await updateNumberFormat(numberFormat)
    } else if (step === 2) {
      await updateSelectedTemplate(template)
    }
    if (step < steps.length - 1) {
      setErrors({})
      setStep((s) => s + 1)
    }
  }

  const handleSkip = async () => {
    await updateOnboardingComplete(true)
    onClose?.()
    router.refresh()
  }

  const handleClose = () => {
    void updateOnboardingComplete(true)
    onClose?.()
  }

  const handleFinish = async () => {
    await updateOnboardingComplete(true)
    onClose?.()
    router.refresh()
  }

  const currentStep = steps[step]
  const CurrentIcon = currentStep.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-[2px] p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <Card className="relative w-full sm:max-w-lg border-border/60 shadow-2xl shadow-foreground/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          aria-label="Close onboarding"
          className="absolute right-2.5 top-2.5 z-10 h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="pb-3 pr-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Step {step + 1} of {steps.length}
            </p>
          </div>
          <CardTitle id="onboarding-title" className="text-lg sm:text-xl tracking-tight">
            Welcome to Business Kit
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Set up your business in a few steps. You can change everything later in Settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <StepIndicator current={step} />

          {step === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-0.5">
                <CurrentIcon className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">Company Information</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="wiz-companyName" className="text-xs">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wiz-companyName"
                    value={company.companyName}
                    onChange={(e) => {
                      setCompany((p) => ({ ...p, companyName: e.target.value }))
                      if (errors.companyName) setErrors((p) => ({ ...p, companyName: undefined }))
                    }}
                    placeholder="Your Company Ltd."
                    aria-invalid={!!errors.companyName}
                    className={cn("h-9", errors.companyName && "border-destructive focus-visible:ring-destructive/30")}
                  />
                  <FieldError message={errors.companyName} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wiz-email" className="text-xs">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wiz-email"
                    type="email"
                    value={company.email}
                    onChange={(e) => {
                      setCompany((p) => ({ ...p, email: e.target.value }))
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                    }}
                    placeholder="hello@company.com"
                    aria-invalid={!!errors.email}
                    className={cn("h-9", errors.email && "border-destructive focus-visible:ring-destructive/30")}
                  />
                  <FieldError message={errors.email} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wiz-phone" className="text-xs">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wiz-phone"
                    type="tel"
                    value={company.phone}
                    onChange={(e) => {
                      setCompany((p) => ({ ...p, phone: e.target.value }))
                      if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }))
                    }}
                    placeholder="+1 234 567 890"
                    aria-invalid={!!errors.phone}
                    className={cn("h-9", errors.phone && "border-destructive focus-visible:ring-destructive/30")}
                  />
                  <FieldError message={errors.phone} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="wiz-address" className="text-xs">Address</Label>
                  <Input
                    id="wiz-address"
                    value={company.address}
                    onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))}
                    placeholder="123 Business Street"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wiz-tax" className="text-xs">Tax Number</Label>
                  <Input
                    id="wiz-tax"
                    value={company.taxNumber}
                    onChange={(e) => setCompany((p) => ({ ...p, taxNumber: e.target.value }))}
                    placeholder="GST/VAT Number"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wiz-website" className="text-xs">Website</Label>
                  <Input
                    id="wiz-website"
                    value={company.website}
                    onChange={(e) => {
                      setCompany((p) => ({ ...p, website: e.target.value }))
                      if (errors.website) setErrors((p) => ({ ...p, website: undefined }))
                    }}
                    placeholder="company.com"
                    aria-invalid={!!errors.website}
                    className={cn("h-9", errors.website && "border-destructive focus-visible:ring-destructive/30")}
                  />
                  <FieldError message={errors.website} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-0.5">
                <CurrentIcon className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">Preferences</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Number Format</Label>
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNumberFormatState("indian")}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all duration-200",
                      numberFormat === "indian"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "hover:bg-accent hover:border-foreground/20"
                    )}
                  >
                    <p className="text-sm font-medium">Indian Format</p>
                    <p className="text-xs text-muted-foreground mt-0.5">1,50,000</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumberFormatState("international")}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all duration-200",
                      numberFormat === "international"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "hover:bg-accent hover:border-foreground/20"
                    )}
                  >
                    <p className="text-sm font-medium">International</p>
                    <p className="text-xs text-muted-foreground mt-0.5">150,000</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-0.5">
                <CurrentIcon className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">Document Template</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed -mt-1">
                Choose a default look for your documents. You can change this per document later.
              </p>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2.5">
                {(TEMPLATES as unknown as Template[]).map((t) => {
                  const labels: Record<string, { label: string; desc: string }> = {
                    minimal: { label: "Minimal", desc: "Clean, borderless, whitespace-focused" },
                    modern: { label: "Modern", desc: "Dark header with a color accent stripe" },
                    corporate: { label: "Corporate", desc: "Serif font, bordered table, formal" },
                    elegant: { label: "Elegant", desc: "Amber accents, asymmetric panels" },
                    dark: { label: "Dark", desc: "Full dark theme, monospace numerals" },
                  }
                  const info = labels[t]
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all duration-200",
                        template === t
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "hover:bg-accent hover:border-foreground/20"
                      )}
                    >
                      <p className="text-sm font-medium">{info.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-center py-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold">You&apos;re all set!</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                  Your business kit is ready. Start creating invoices, quotations, and more.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between mt-5 pt-3 border-t gap-2.5 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="w-full sm:w-auto text-muted-foreground hover:text-foreground">
              Skip setup
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {step > 0 && step < steps.length - 1 && (
                <Button variant="outline" size="sm" onClick={() => { setErrors({}); setStep((s) => s - 1) }} className="flex-1 sm:flex-none">
                  <ArrowLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={step === 0 && !isCompanyStepValid}
                  className="flex-1 sm:flex-none px-5"
                >
                  Continue
                </Button>
              ) : (
                <Button size="sm" onClick={handleFinish} className="flex-1 sm:flex-none px-5">
                  Start Using Business Kit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
