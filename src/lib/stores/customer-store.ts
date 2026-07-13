import { create } from "zustand";
import { db } from "@/src/lib/db";
import { type Customer } from "@/src/types";
import { generateId, now } from "@/src/lib/formatters";

interface CustomerState {
  customers: Customer[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (data: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<Customer>;
  update: (id: string, data: Partial<Customer>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getById: (id: string) => Customer | undefined;
  search: (query: string) => Customer[];
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loaded: false,
  load: async () => {
    const customers = await db.customers.getAll();
    set({ customers, loaded: true });
  },
  add: async (data) => {
    const t = now();
    const customer: Customer = { ...data, id: generateId(), createdAt: t, updatedAt: t };
    await db.customers.put(customer);
    set((s) => ({ customers: [...s.customers, customer] }));
    return customer;
  },
  update: async (id, data) => {
    const customer = get().customers.find((c) => c.id === id);
    if (!customer) return;
    const updated: Customer = { ...customer, ...data, updatedAt: now() };
    await db.customers.put(updated);
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? updated : c)) }));
  },
  remove: async (id) => {
    await db.customers.delete(id);
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
  },
  toggleFavorite: async (id) => {
    const customer = get().customers.find((c) => c.id === id);
    if (!customer) return;
    const updated: Customer = { ...customer, favorite: !customer.favorite, updatedAt: now() };
    await db.customers.put(updated);
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? updated : c)) }));
  },
  getById: (id) => get().customers.find((c) => c.id === id),
  search: (query) => {
    const q = query.toLowerCase();
    return get().customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  },
}));
