import { z } from "zod";

export const DOCUMENT_TYPES = [
  "invoice", "quotation", "estimate", "receipt",
  "purchase-order", "credit-note", "proforma", "delivery-challan"
] as const;

export const DOCUMENT_STATUSES = ["draft", "paid", "pending", "cancelled", "overdue"] as const;

export const TAX_TYPES = ["gst", "cgst", "sgst", "igst", "vat", "sales-tax", "custom"] as const;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "CAD", "AUD"] as const;

export const PAYMENT_METHODS = ["upi", "bank-transfer", "paypal", "stripe", "cash", "cheque", "custom"] as const;

export const TEMPLATES = ["minimal", "modern", "corporate", "elegant", "dark"] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];
export type DocumentStatus = typeof DOCUMENT_STATUSES[number];
export type TaxType = typeof TAX_TYPES[number];
export type CurrencyCode = typeof CURRENCIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type Template = typeof TEMPLATES[number];
export type NumberFormat = "indian" | "international";
export type Theme = "light" | "dark" | "system";

export const DocTypeLabel: Record<DocumentType, string> = {
  "invoice": "Invoice",
  "quotation": "Quotation",
  "estimate": "Estimate",
  "receipt": "Receipt",
  "purchase-order": "Purchase Order",
  "credit-note": "Credit Note",
  "proforma": "Proforma Invoice",
  "delivery-challan": "Delivery Challan",
};

export const CurrencySymbols: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", CAD: "C$", AUD: "A$",
};

export const CustomerSchema = z.object({
  id: z.string(),
  companyName: z.string().default(""),
  customerName: z.string().min(1, "Customer name is required"),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  taxNumber: z.string().default(""),
  billingAddress: z.string().default(""),
  shippingAddress: z.string().default(""),
  country: z.string().default(""),
  state: z.string().default(""),
  city: z.string().default(""),
  postalCode: z.string().default(""),
  notes: z.string().default(""),
  favorite: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().default(""),
  sku: z.string().default(""),
  unit: z.string().default(""),
  price: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  category: z.string().default(""),
  favorite: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Product = z.infer<typeof ProductSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().default(""),
  price: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  tax: z.number().min(0).default(0),
  taxType: z.enum(["inclusive", "exclusive"]).default("exclusive"),
  total: z.number().default(0),
});

export type Item = z.infer<typeof ItemSchema>;

export const PaymentRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.string().default(""),
  notes: z.string().default(""),
});

export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

export const CompanyInfoSchema = z.object({
  logo: z.string().default(""),
  companyName: z.string().default(""),
  email: z.string().default(""),
  website: z.string().default(""),
  address: z.string().default(""),
  taxNumber: z.string().default(""),
  phone: z.string().default(""),
});

export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;

export const PaymentInfoSchema = z.object({
  method: z.string().default(""),
  details: z.string().default(""),
  upiId: z.string().default(""),
});

export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  docType: z.enum(DOCUMENT_TYPES),
  status: z.enum(DOCUMENT_STATUSES).default("draft"),
  docNumber: z.string().default(""),
  referenceNumber: z.string().default(""),
  poNumber: z.string().default(""),
  issueDate: z.string(),
  dueDate: z.string(),
  company: CompanyInfoSchema.default({ logo: "", companyName: "", email: "", website: "", address: "", taxNumber: "", phone: "" }),
  customer: CustomerSchema.nullable().default(null),
  billTo: z.string().default(""),
  shipTo: z.string().default(""),
  items: z.array(ItemSchema).default([]),
  subtotal: z.number().default(0),
  discountTotal: z.number().default(0),
  taxTotal: z.number().default(0),
  shipping: z.number().default(0),
  additionalCharges: z.number().default(0),
  grandTotal: z.number().default(0),
  documentDiscount: z.number().default(0),
  documentDiscountType: z.enum(["percentage", "fixed"]).default("percentage"),
  currency: z.string().default("INR"),
  currencySymbol: z.string().default("₹"),
  numberFormat: z.enum(["indian", "international"]).default("indian"),
  payment: PaymentInfoSchema.default({ method: "", details: "", upiId: "" }),
  payments: z.array(PaymentRecordSchema).default([]),
  notes: z.string().default(""),
  terms: z.string().default(""),
  signature: z.string().default(""),
  stamp: z.string().default(""),
  template: z.enum(TEMPLATES).default("minimal"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const TaxPresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(TAX_TYPES),
  rate: z.number().min(0),
  isDefault: z.boolean().default(false),
});

export type TaxPreset = z.infer<typeof TaxPresetSchema>;

export const NumberingConfigSchema = z.object({
  prefix: z.string().default(""),
  nextNumber: z.number().default(1),
  padding: z.number().default(4),
});

export type NumberingConfig = z.infer<typeof NumberingConfigSchema>;

export const NoteTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  content: z.string().default(""),
});

export type NoteTemplate = z.infer<typeof NoteTemplateSchema>;

export const TermsTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  content: z.string().default(""),
});

export type TermsTemplate = z.infer<typeof TermsTemplateSchema>;

export const SettingsSchema = z.object({
  id: z.string().default("default"),
  company: CompanyInfoSchema.default({ logo: "", companyName: "", email: "", website: "", address: "", taxNumber: "", phone: "" }),
  taxPresets: z.array(TaxPresetSchema).default([]),
  currencies: z.array(z.object({
    code: z.string(),
    symbol: z.string(),
    isDefault: z.boolean().default(false),
  })).default([]),
  paymentMethods: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    details: z.string().default(""),
  })).default([]),
  numbering: z.record(z.string(), NumberingConfigSchema).default({}),
  noteTemplates: z.array(NoteTemplateSchema).default([]),
  termsTemplates: z.array(TermsTemplateSchema).default([]),
  selectedTemplate: z.enum(TEMPLATES).default("minimal"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  numberFormat: z.enum(["indian", "international"]).default("indian"),
  onboardingComplete: z.boolean().default(false),
  updatedAt: z.number(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export function getDefaultNumberingConfig(type: DocumentType): NumberingConfig {
  const prefixes: Record<DocumentType, string> = {
    "invoice": "INV",
    "quotation": "QUO",
    "estimate": "EST",
    "receipt": "RCT",
    "purchase-order": "PO",
    "credit-note": "CN",
    "proforma": "PRO",
    "delivery-challan": "DC",
  };
  return { prefix: prefixes[type], nextNumber: 1, padding: 4 };
}

export function generateDocNumber(config: NumberingConfig): string {
  const padded = String(config.nextNumber).padStart(config.padding, "0");
  return `${config.prefix}-${padded}`;
}

export const defaultCurrencies = [
  { code: "INR", symbol: "₹", isDefault: true },
  { code: "USD", symbol: "$", isDefault: false },
  { code: "EUR", symbol: "€", isDefault: false },
  { code: "GBP", symbol: "£", isDefault: false },
  { code: "AED", symbol: "د.إ", isDefault: false },
  { code: "CAD", symbol: "C$", isDefault: false },
  { code: "AUD", symbol: "A$", isDefault: false },
];

export const defaultPaymentMethods = [
  { id: "upi", name: "UPI", type: "upi", details: "" },
  { id: "bank-transfer", name: "Bank Transfer", type: "bank-transfer", details: "" },
  { id: "paypal", name: "PayPal", type: "paypal", details: "" },
  { id: "stripe", name: "Stripe", type: "stripe", details: "" },
  { id: "cash", name: "Cash", type: "cash", details: "" },
  { id: "cheque", name: "Cheque", type: "cheque", details: "" },
  { id: "custom", name: "Custom", type: "custom", details: "" },
];
