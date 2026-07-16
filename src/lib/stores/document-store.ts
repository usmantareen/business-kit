import { create } from "zustand";
import { db } from "@/src/lib/db";
import { type Document, type DocumentType, type DocumentStatus, type Item } from "@/src/types";
import { generateId, now } from "@/src/lib/formatters";

interface DocumentFilters {
  search: string;
  status: DocumentStatus | "all";
  docType: DocumentType | "all";
  dateFrom: string;
  dateTo: string;
}

interface DocumentState {
  documents: Document[];
  loaded: boolean;
  filters: DocumentFilters;
  load: () => Promise<void>;
  add: (data: Omit<Document, "id" | "createdAt" | "updatedAt">) => Promise<Document>;
  update: (id: string, data: Partial<Document>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Document | null>;
  convert: (id: string, targetType: DocumentType) => Promise<Document | null>;
  bulkUpdateStatus: (ids: string[], status: DocumentStatus) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  setFilters: (filters: Partial<DocumentFilters>) => void;
  filteredDocuments: () => Document[];
  getById: (id: string) => Document | undefined;
  getRecent: (limit?: number) => Document[];
  getForCustomer: (customerId: string) => Document[];
  getPaidAmount: (doc: Document) => number;
  computeTotals: (items: Item[]) => { subtotal: number; discountTotal: number; taxTotal: number; grandTotal: number };
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loaded: false,
  filters: { search: "", status: "all", docType: "all", dateFrom: "", dateTo: "" },
  load: async () => {
    const documents = await db.documents.getAll();
    set({ documents, loaded: true });
  },
  add: async (data) => {
    const t = now();
    const doc: Document = { ...data, id: generateId(), createdAt: t, updatedAt: t };
    await db.documents.put(doc);
    set((s) => ({ documents: [doc, ...s.documents] }));
    return doc;
  },
  update: async (id, data) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    const updated: Document = { ...doc, ...data, updatedAt: now() };
    await db.documents.put(updated);
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? updated : d)) }));
  },
  remove: async (id) => {
    await db.documents.delete(id);
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
  },
  duplicate: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return null;
    const t = now();
    const newDoc: Document = {
      ...doc,
      id: generateId(),
      docNumber: `${doc.docNumber}-copy`,
      status: "draft" as DocumentStatus,
      createdAt: t,
      updatedAt: t,
    };
    await db.documents.put(newDoc);
    set((s) => ({ documents: [newDoc, ...s.documents] }));
    return newDoc;
  },
  convert: async (id, targetType) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return null;
    const t = now();
    const newDoc: Document = {
      ...doc,
      id: generateId(),
      docType: targetType,
      status: "draft" as DocumentStatus,
      createdAt: t,
      updatedAt: t,
    };
    await db.documents.put(newDoc);
    set((s) => ({ documents: [newDoc, ...s.documents] }));
    return newDoc;
  },
  bulkUpdateStatus: async (ids, status) => {
    const t = now();
    const updatedDocs: Document[] = [];
    for (const id of ids) {
      const doc = get().documents.find((d) => d.id === id);
      if (doc) {
        const updated: Document = { ...doc, status, updatedAt: t };
        await db.documents.put(updated);
        updatedDocs.push(updated);
      }
    }
    set((s) => ({
      documents: s.documents.map((d) => {
        const updated = updatedDocs.find((u) => u.id === d.id);
        return updated || d;
      }),
    }));
  },
  bulkDelete: async (ids) => {
    for (const id of ids) {
      await db.documents.delete(id);
    }
    set((s) => ({ documents: s.documents.filter((d) => !ids.includes(d.id)) }));
  },
  setFilters: (partial) => {
    set((s) => ({ filters: { ...s.filters, ...partial } }));
  },
  filteredDocuments: () => {
    const { documents, filters } = get();
    return documents.filter((doc) => {
      if (filters.status !== "all" && doc.status !== filters.status) return false;
      if (filters.docType !== "all" && doc.docType !== filters.docType) return false;
      if (filters.dateFrom && doc.issueDate < filters.dateFrom) return false;
      if (filters.dateTo && doc.issueDate > filters.dateTo) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const customer = doc.customer;
        const customerName = customer ? customer.customerName.toLowerCase() : "";
        const companyName = customer ? customer.companyName.toLowerCase() : "";
        const email = customer ? customer.email.toLowerCase() : "";
        if (
          !doc.docNumber.toLowerCase().includes(q) &&
          !customerName.includes(q) &&
          !companyName.includes(q) &&
          !email.includes(q)
        )
          return false;
      }
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  },
  getById: (id) => get().documents.find((d) => d.id === id),
  getRecent: (limit = 5) =>
    [...get().documents].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit),
  getForCustomer: (customerId) =>
    get().documents.filter((d) => d.customer?.id === customerId).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()),
  getPaidAmount: (doc) => (doc.payments || []).reduce((sum, p) => sum + p.amount, 0),
  computeTotals: (items) => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    for (const item of items) {
      const lineTotal = item.quantity * item.price;
      subtotal += lineTotal;
      let discount = 0;
      if (item.discountType === "percentage") {
        discount = lineTotal * (item.discount / 100);
      } else {
        discount = item.discount;
      }
      discountTotal += discount;
      const afterDiscount = lineTotal - discount;
      if (item.taxType === "inclusive") {
        taxTotal += afterDiscount - afterDiscount / (1 + item.tax / 100);
      } else {
        taxTotal += afterDiscount * (item.tax / 100);
      }
    }
    const grandTotal = subtotal - discountTotal + taxTotal;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  },
}));
