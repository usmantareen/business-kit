import { openDB, type IDBPDatabase } from "idb";
import type { Customer, Document, Product, Settings } from "@/src/types";

const DB_NAME = "business-kit";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    },
  });
  return dbInstance;
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(storeName);
}

async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName, key);
}

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(storeName, value);
}

async function del(storeName: string, key: string): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, key);
}

async function clear(storeName: string): Promise<void> {
  const db = await getDB();
  await db.clear(storeName);
}

async function getAllKeys(storeName: string): Promise<IDBValidKey[]> {
  const db = await getDB();
  return db.getAllKeys(storeName);
}

export const db = {
  documents: {
    getAll: () => getAll<Document>("documents"),
    get: (id: string) => get<Document>("documents", id),
    put: (doc: Document) => put<Document>("documents", doc),
    delete: (id: string) => del("documents", id),
    clear: () => clear("documents"),
    getAllKeys: () => getAllKeys("documents"),
  },
  customers: {
    getAll: () => getAll<Customer>("customers"),
    get: (id: string) => get<Customer>("customers", id),
    put: (customer: Customer) => put<Customer>("customers", customer),
    delete: (id: string) => del("customers", id),
    clear: () => clear("customers"),
  },
  products: {
    getAll: () => getAll<Product>("products"),
    get: (id: string) => get<Product>("products", id),
    put: (product: Product) => put<Product>("products", product),
    delete: (id: string) => del("products", id),
    clear: () => clear("products"),
  },
  settings: {
    getAll: () => getAll<Settings>("settings"),
    get: (id: string) => get<Settings>("settings", id),
    put: (settings: Settings) => put<Settings>("settings", settings),
    delete: (id: string) => del("settings", id),
    clear: () => clear("settings"),
  },
};
