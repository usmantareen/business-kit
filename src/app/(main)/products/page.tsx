"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Star, Pencil, Trash2, Package, Tag, DollarSign, Percent, Hash, List, AlignLeft } from "lucide-react"

import { ConfirmDialog } from "@/src/components/shared/confirm-dialog"
import { useProductStore } from "@/src/lib/stores/product-store"
import { type Product } from "@/src/types"

import { PageHeader } from "@/src/components/shared/page-header"
import { EmptyState } from "@/src/components/shared/empty-state"
import { FormField } from "@/src/components/shared/form-field"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
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
} from "@/src/components/ui/dialog"

const editSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string(),
  sku: z.string(),
  unit: z.string(),
  price: z.number().min(0, "Price must be 0 or greater"),
  tax: z.number().min(0, "Tax must be 0 or greater"),
  category: z.string(),
})

type EditFormData = z.infer<typeof editSchema>

export default function ProductsPage() {
  const router = useRouter()
  const { products, loaded, load, remove, update, toggleFavorite, search, categories } = useProductStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const allCategories = categories()

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
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

  useEffect(() => {
    load()
  }, [load])

  let filtered = searchQuery ? search(searchQuery) : products
  if (categoryFilter !== "all") {
    filtered = filtered.filter((p) => p.category === categoryFilter)
  }
  const display = showFavoritesOnly ? filtered.filter((p) => p.favorite) : filtered

  function handleEdit(product: Product) {
    setEditProduct(product)
    form.reset({
      name: product.name,
      description: product.description,
      sku: product.sku,
      unit: product.unit,
      price: product.price,
      tax: product.tax,
      category: product.category,
    })
    setEditOpen(true)
  }

  async function handleSave(data: EditFormData) {
    if (!editProduct) return
    await update(editProduct.id, data)
    setEditOpen(false)
    setEditProduct(null)
  }

  async function handleDelete(id: string) {
    await remove(id)
  }

  if (!loaded) return null

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Manage your products" actions={[{ label: "New Product", href: "/products/new" }]} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          icon={Package}
          title="No products found"
          description={searchQuery || categoryFilter !== "all" || showFavoritesOnly ? "Try adjusting your search or filter" : "Get started by adding your first product"}
          action={
            <Button onClick={() => router.push("/products/new")}>Add Product</Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tax (%)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-16">Fav</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {display.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku || "-"}</TableCell>
                <TableCell>{product.unit || "-"}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.tax}%</TableCell>
                <TableCell>{product.category || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${product.favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">
            <FormField label="Product Name" htmlFor="edit-name" icon={<Package className="h-3.5 w-3.5" />} required>
              <Input id="edit-name" placeholder="Premium Widget" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </FormField>

            <FormField label="Description" htmlFor="edit-description" icon={<AlignLeft className="h-3.5 w-3.5" />}>
              <Textarea id="edit-description" placeholder="High-quality widget for professional use..." {...form.register("description")} />
            </FormField>

            <div className="grid grid-cols-2 gap-5">
              <FormField label="SKU" htmlFor="edit-sku" icon={<Hash className="h-3.5 w-3.5" />}>
                <Input id="edit-sku" placeholder="SKU-001" {...form.register("sku")} />
              </FormField>
              <FormField label="Unit" htmlFor="edit-unit" icon={<List className="h-3.5 w-3.5" />}>
                <Input id="edit-unit" placeholder="pcs / kg / hrs" {...form.register("unit")} />
              </FormField>
              <FormField label="Price" htmlFor="edit-price" icon={<DollarSign className="h-3.5 w-3.5" />}>
                <Input id="edit-price" type="number" step="0.01" placeholder="0.00" {...form.register("price", { valueAsNumber: true })} />
                {form.formState.errors.price && (
                  <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                )}
              </FormField>
              <FormField label="Tax (%)" htmlFor="edit-tax" icon={<Percent className="h-3.5 w-3.5" />}>
                <Input id="edit-tax" type="number" step="0.01" placeholder="0" {...form.register("tax", { valueAsNumber: true })} />
                {form.formState.errors.tax && (
                  <p className="text-xs text-destructive">{form.formState.errors.tax.message}</p>
                )}
              </FormField>
              <FormField label="Category" htmlFor="edit-category" icon={<Tag className="h-3.5 w-3.5" />}>
                <Input id="edit-category" placeholder="Electronics" {...form.register("category")} />
              </FormField>
            </div>

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
        title="Delete product"
        description="This cannot be undone. The product will be permanently removed."
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
