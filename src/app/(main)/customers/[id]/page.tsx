"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Building2, Mail, Phone, Hash, Globe, MapPin, Home, StickyNote } from "lucide-react"

import { useCustomerStore } from "@/src/lib/stores/customer-store"

import { PageHeader } from "@/src/components/shared/page-header"
import { FormField } from "@/src/components/shared/form-field"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Card, CardContent } from "@/src/components/ui/card"

const formSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  companyName: z.string(),
  email: z.string().email().or(z.literal("")),
  phone: z.string(),
  taxNumber: z.string(),
  billingAddress: z.string(),
  shippingAddress: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  postalCode: z.string(),
  notes: z.string(),
})

type FormData = z.input<typeof formSchema>

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { customers, loaded, load, update, getById } = useCustomerStore()
  const [notFound, setNotFound] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      companyName: "",
      email: "",
      phone: "",
      taxNumber: "",
      billingAddress: "",
      shippingAddress: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      notes: "",
    },
  })

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!loaded) return
    const customer = getById(params.id)
    if (!customer) {
      setNotFound(true)
      return
    }
    form.reset({
      customerName: customer.customerName,
      companyName: customer.companyName,
      email: customer.email,
      phone: customer.phone,
      taxNumber: customer.taxNumber,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      country: customer.country,
      state: customer.state,
      city: customer.city,
      postalCode: customer.postalCode,
      notes: customer.notes,
    })
  }, [loaded, params.id, getById, form])

  async function onSubmit(data: FormData) {
    await update(params.id, data)
    router.push("/customers")
  }

  if (!loaded) return null
  if (notFound) return <div className="space-y-6"><p className="text-muted-foreground">Customer not found.</p></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Customer" description="Update customer details" />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Customer Name" htmlFor="customerName" icon={<User className="h-3.5 w-3.5" />} required>
                <Input id="customerName" placeholder="John Doe" {...form.register("customerName")} />
                {form.formState.errors.customerName && (
                  <p className="text-xs text-destructive">{form.formState.errors.customerName.message}</p>
                )}
              </FormField>

              <FormField label="Company Name" htmlFor="companyName" icon={<Building2 className="h-3.5 w-3.5" />}>
                <Input id="companyName" placeholder="Acme Inc." {...form.register("companyName")} />
              </FormField>

              <FormField label="Email" htmlFor="email" icon={<Mail className="h-3.5 w-3.5" />}>
                <Input id="email" type="email" placeholder="john@example.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </FormField>

              <FormField label="Phone" htmlFor="phone" icon={<Phone className="h-3.5 w-3.5" />}>
                <Input id="phone" placeholder="+1 (555) 123-4567" {...form.register("phone")} />
              </FormField>

              <FormField label="Tax Number" htmlFor="taxNumber" icon={<Hash className="h-3.5 w-3.5" />}>
                <Input id="taxNumber" placeholder="GST123456789" {...form.register("taxNumber")} />
              </FormField>

              <FormField label="Country" htmlFor="country" icon={<Globe className="h-3.5 w-3.5" />}>
                <Input id="country" placeholder="United States" {...form.register("country")} />
              </FormField>

              <FormField label="State" htmlFor="state" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Input id="state" placeholder="California" {...form.register("state")} />
              </FormField>

              <FormField label="City" htmlFor="city" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Input id="city" placeholder="San Francisco" {...form.register("city")} />
              </FormField>

              <FormField label="Postal Code" htmlFor="postalCode" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Input id="postalCode" placeholder="94102" {...form.register("postalCode")} />
              </FormField>
            </div>

            <FormField label="Billing Address" htmlFor="billingAddress" icon={<Home className="h-3.5 w-3.5" />}>
              <Textarea id="billingAddress" placeholder="123 Business St, Suite 100" {...form.register("billingAddress")} />
            </FormField>

            <FormField label="Shipping Address" htmlFor="shippingAddress" icon={<Home className="h-3.5 w-3.5" />}>
              <Textarea id="shippingAddress" placeholder="Same as billing" {...form.register("shippingAddress")} />
            </FormField>

            <FormField label="Notes" htmlFor="notes" icon={<StickyNote className="h-3.5 w-3.5" />}>
              <Textarea id="notes" placeholder="Any additional information..." {...form.register("notes")} />
            </FormField>

            <div className="flex items-center gap-3">
              <Button type="submit">Update Customer</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
