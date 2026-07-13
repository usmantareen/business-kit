"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { useProductStore } from "@/src/lib/stores/product-store"

import { PageHeader } from "@/src/components/shared/page-header"
import { FormField } from "@/src/components/shared/form-field"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Card, CardContent } from "@/src/components/ui/card"
import { Package, Tag, DollarSign, Percent, Hash, List, AlignLeft } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string(),
  sku: z.string(),
  unit: z.string(),
  price: z.number().min(0, "Price must be 0 or greater"),
  tax: z.number().min(0, "Tax must be 0 or greater"),
  category: z.string(),
})

type FormData = z.infer<typeof formSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { add } = useProductStore()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      unit: "",
      price: 0,
      tax: 0,
      category: "",
    },
  })

  async function onSubmit(data: FormData) {
    await add({ ...data, favorite: false })
    router.push("/products")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Product" description="Add a new product to your inventory" />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField label="Product Name" htmlFor="name" icon={<Package className="h-3.5 w-3.5" />} required>
              <Input id="name" placeholder="Premium Widget" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </FormField>

            <FormField label="Description" htmlFor="description" icon={<AlignLeft className="h-3.5 w-3.5" />}>
              <Textarea id="description" placeholder="High-quality widget for professional use..." className="min-h-[80px]" {...form.register("description")} />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="SKU" htmlFor="sku" icon={<Hash className="h-3.5 w-3.5" />}>
                <Input id="sku" placeholder="SKU-001" {...form.register("sku")} />
              </FormField>

              <FormField label="Unit" htmlFor="unit" icon={<List className="h-3.5 w-3.5" />}>
                <Input id="unit" placeholder="pcs / kg / hrs" {...form.register("unit")} />
              </FormField>

              <FormField label="Price" htmlFor="price" icon={<DollarSign className="h-3.5 w-3.5" />}>
                <Input id="price" type="number" step="0.01" placeholder="0.00" {...form.register("price", { valueAsNumber: true })} />
                {form.formState.errors.price && (
                  <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                )}
              </FormField>

              <FormField label="Tax (%)" htmlFor="tax" icon={<Percent className="h-3.5 w-3.5" />}>
                <Input id="tax" type="number" step="0.01" placeholder="0" {...form.register("tax", { valueAsNumber: true })} />
                {form.formState.errors.tax && (
                  <p className="text-xs text-destructive">{form.formState.errors.tax.message}</p>
                )}
              </FormField>

              <FormField label="Category" htmlFor="category" icon={<Tag className="h-3.5 w-3.5" />}>
                <Input id="category" placeholder="Electronics" {...form.register("category")} />
              </FormField>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">Create Product</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
