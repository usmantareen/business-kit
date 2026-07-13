import { db } from "@/src/lib/db"
import {
  DocumentSchema,
  CustomerSchema,
  ProductSchema,
  SettingsSchema,
  type Document,
  type Customer,
  type Product,
  type Settings,
} from "@/src/types"

interface BackupData {
  version: string
  exportedAt: string
  documents: unknown[]
  customers: unknown[]
  products: unknown[]
  settings: unknown[]
}

export async function exportBackup(): Promise<Blob> {
  const [documents, customers, products, settings] = await Promise.all([
    db.documents.getAll(),
    db.customers.getAll(),
    db.products.getAll(),
    db.settings.getAll(),
  ])

  const data: BackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    documents,
    customers,
    products,
    settings,
  }

  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
}

export async function importBackup(file: File): Promise<{ success: boolean; message: string }> {
  let data: BackupData
  try {
    data = JSON.parse(await file.text()) as BackupData
  } catch (err) {
    return { success: false, message: "Invalid JSON: " + (err instanceof Error ? err.message : "parse error") }
  }

  if (
    !data.version ||
    !Array.isArray(data.documents) ||
    !Array.isArray(data.customers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.settings)
  ) {
    return { success: false, message: "Invalid backup file format" }
  }

  let documents: Document[]
  let customers: Customer[]
  let products: Product[]
  let settings: Settings[]
  try {
    documents = data.documents.map((d) => DocumentSchema.parse(d))
    customers = data.customers.map((c) => CustomerSchema.parse(c))
    products = data.products.map((p) => ProductSchema.parse(p))
    settings = data.settings.map((s) => SettingsSchema.parse(s))
  } catch (err) {
    return {
      success: false,
      message: "Backup contains invalid data: " + (err instanceof Error ? err.message : "schema mismatch"),
    }
  }

  await db.settings.clear()
  await db.documents.clear()
  await db.customers.clear()
  await db.products.clear()

  for (const s of settings) await db.settings.put(s)
  for (const d of documents) await db.documents.put(d)
  for (const c of customers) await db.customers.put(c)
  for (const p of products) await db.products.put(p)

  return {
    success: true,
    message: `Restored ${documents.length} documents, ${customers.length} customers, ${products.length} products`,
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
