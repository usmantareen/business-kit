import { create } from "zustand";
import { db } from "@/src/lib/db";
import { type Product } from "@/src/types";
import { generateId, now } from "@/src/lib/formatters";

interface ProductState {
  products: Product[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<Product>;
  update: (id: string, data: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getById: (id: string) => Product | undefined;
  search: (query: string) => Product[];
  categories: () => string[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loaded: false,
  load: async () => {
    const products = await db.products.getAll();
    set({ products, loaded: true });
  },
  add: async (data) => {
    const t = now();
    const product: Product = { ...data, id: generateId(), createdAt: t, updatedAt: t };
    await db.products.put(product);
    set((s) => ({ products: [...s.products, product] }));
    return product;
  },
  update: async (id, data) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;
    const updated: Product = { ...product, ...data, updatedAt: now() };
    await db.products.put(updated);
    set((s) => ({ products: s.products.map((p) => (p.id === id ? updated : p)) }));
  },
  remove: async (id) => {
    await db.products.delete(id);
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },
  toggleFavorite: async (id) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;
    const updated: Product = { ...product, favorite: !product.favorite, updatedAt: now() };
    await db.products.put(updated);
    set((s) => ({ products: s.products.map((p) => (p.id === id ? updated : p)) }));
  },
  getById: (id) => get().products.find((p) => p.id === id),
  search: (query) => {
    const q = query.toLowerCase();
    return get().products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  },
  categories: () => {
    const cats = get().products.map((p) => p.category).filter(Boolean);
    return [...new Set(cats)];
  },
}));
