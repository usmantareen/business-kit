"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Star, Pencil, Trash2, Users, User, Building2, Mail, Phone, Hash, Globe, MapPin, Home, StickyNote } from "lucide-react"

import { ConfirmDialog } from "@/src/components/shared/confirm-dialog"
import { useCustomerStore } from "@/src/lib/stores/customer-store"
import { type Customer } from "@/src/types"

import { PageHeader } from "@/src/components/shared/page-header"
import { EmptyState } from "@/src/components/shared/empty-state"
import { FormField } from "@/src/components/shared/form-field"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/src/components/ui/dialog"

const editSchema = z.object({
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

type EditFormData = z.infer<typeof editSchema>

export default function CustomersPage() {
  const router = useRouter()
  const { customers, loaded, load, remove, update, toggleFavorite, search } = useCustomerStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
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

  const filtered = searchQuery ? search(searchQuery) : customers
  const display = showFavoritesOnly ? filtered.filter((c) => c.favorite) : filtered

  function handleEdit(customer: Customer) {
    setEditCustomer(customer)
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
    setEditOpen(true)
  }

  async function handleSave(data: EditFormData) {
    if (!editCustomer) return
    await update(editCustomer.id, data)
    setEditOpen(false)
    setEditCustomer(null)
  }

  async function handleDelete(id: string) {
    await remove(id)
  }

  if (!loaded) return null

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage your customers" actions={[{ label: "New Customer", href: "/customers/new" }]} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className="mr-1 h-4 w-4" />
          Favorites
        </Button>
      </div>

      {display.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={searchQuery || showFavoritesOnly ? "Try adjusting your search or filter" : "Get started by adding your first customer"}
          action={
            <Button onClick={() => router.push("/customers/new")}>Add Customer</Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-16">Fav</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {display.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.customerName}</TableCell>
                <TableCell>{customer.companyName || "-"}</TableCell>
                <TableCell>{customer.email || "-"}</TableCell>
                <TableCell>{customer.phone || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(customer.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${customer.favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(customer.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <FormField label="Customer Name" htmlFor="edit-customerName" icon={<User className="h-3.5 w-3.5" />} required>
                <Input id="edit-customerName" placeholder="John Doe" {...form.register("customerName")} />
                {form.formState.errors.customerName && (
                  <p className="text-xs text-destructive">{form.formState.errors.customerName.message}</p>
                )}
              </FormField>
              <FormField label="Company Name" htmlFor="edit-companyName" icon={<Building2 className="h-3.5 w-3.5" />}>
                <Input id="edit-companyName" placeholder="Acme Inc." {...form.register("companyName")} />
              </FormField>
              <FormField label="Email" htmlFor="edit-email" icon={<Mail className="h-3.5 w-3.5" />}>
                <Input id="edit-email" type="email" placeholder="john@example.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </FormField>
              <FormField label="Phone" htmlFor="edit-phone" icon={<Phone className="h-3.5 w-3.5" />}>
                <Input id="edit-phone" placeholder="+1 (555) 123-4567" {...form.register("phone")} />
              </FormField>
              <FormField label="Tax Number" htmlFor="edit-taxNumber" icon={<Hash className="h-3.5 w-3.5" />}>
                <Input id="edit-taxNumber" placeholder="GST123456789" {...form.register("taxNumber")} />
              </FormField>
              <FormField label="Country" htmlFor="edit-country" icon={<Globe className="h-3.5 w-3.5" />}>
                <Input id="edit-country" placeholder="United States" {...form.register("country")} />
              </FormField>
              <FormField label="State" htmlFor="edit-state" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Input id="edit-state" placeholder="California" {...form.register("state")} />
              </FormField>
              <FormField label="City" htmlFor="edit-city" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Input id="edit-city" placeholder="San Francisco" {...form.register("city")} />
              </FormField>
              <FormField label="Postal Code" htmlFor="edit-postalCode" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Input id="edit-postalCode" placeholder="94102" {...form.register("postalCode")} />
              </FormField>
            </div>
            <FormField label="Billing Address" htmlFor="edit-billingAddress" icon={<Home className="h-3.5 w-3.5" />}>
              <Textarea id="edit-billingAddress" placeholder="123 Business St, Suite 100" {...form.register("billingAddress")} />
            </FormField>
            <FormField label="Shipping Address" htmlFor="edit-shippingAddress" icon={<Home className="h-3.5 w-3.5" />}>
              <Textarea id="edit-shippingAddress" placeholder="Same as billing" {...form.register("shippingAddress")} />
            </FormField>
            <FormField label="Notes" htmlFor="edit-notes" icon={<StickyNote className="h-3.5 w-3.5" />}>
              <Textarea id="edit-notes" placeholder="Any additional information..." {...form.register("notes")} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete customer"
        description="This cannot be undone. The customer will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (deleteTarget) {
            await handleDelete(deleteTarget)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
