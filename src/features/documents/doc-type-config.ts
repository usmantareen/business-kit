import type { DocumentType } from "@/src/types"

export interface DocTypeConfig {
  label: string
  labelPlural: string
  issueDateLabel: string
  dueDateLabel: string
  billToLabel: string
  shipToLabel: string
  numberPrefix: string
  icon: string
  description: string
}

export const docTypeConfig: Record<DocumentType, DocTypeConfig> = {
  invoice: {
    label: "Invoice",
    labelPlural: "Invoices",
    issueDateLabel: "Invoice Date",
    dueDateLabel: "Due Date",
    billToLabel: "Bill To",
    shipToLabel: "Ship To",
    numberPrefix: "INV",
    icon: "FileText",
    description: "Request payment for goods or services provided.",
  },
  quotation: {
    label: "Quotation",
    labelPlural: "Quotations",
    issueDateLabel: "Quotation Date",
    dueDateLabel: "Valid Until",
    billToLabel: "Bill To",
    shipToLabel: "Ship To",
    numberPrefix: "QUO",
    icon: "FileText",
    description: "Provide a price estimate for potential work.",
  },
  estimate: {
    label: "Estimate",
    labelPlural: "Estimates",
    issueDateLabel: "Estimate Date",
    dueDateLabel: "Valid Until",
    billToLabel: "Bill To",
    shipToLabel: "Ship To",
    numberPrefix: "EST",
    icon: "FileText",
    description: "Give an approximate cost for a project or service.",
  },
  receipt: {
    label: "Receipt",
    labelPlural: "Receipts",
    issueDateLabel: "Receipt Date",
    dueDateLabel: "Payment Date",
    billToLabel: "Received From",
    shipToLabel: "Ship To",
    numberPrefix: "RCT",
    icon: "FileText",
    description: "Acknowledge payment received from a customer.",
  },
  "purchase-order": {
    label: "Purchase Order",
    labelPlural: "Purchase Orders",
    issueDateLabel: "Order Date",
    dueDateLabel: "Delivery Date",
    billToLabel: "Vendor",
    shipToLabel: "Deliver To",
    numberPrefix: "PO",
    icon: "FileText",
    description: "Authorize a purchase from a vendor or supplier.",
  },
  "credit-note": {
    label: "Credit Note",
    labelPlural: "Credit Notes",
    issueDateLabel: "Credit Note Date",
    dueDateLabel: "Reference Date",
    billToLabel: "Credit To",
    shipToLabel: "Ship To",
    numberPrefix: "CN",
    icon: "FileText",
    description: "Issue a refund or credit adjustment to a customer.",
  },
  proforma: {
    label: "Proforma Invoice",
    labelPlural: "Proforma Invoices",
    issueDateLabel: "Issue Date",
    dueDateLabel: "Valid Until",
    billToLabel: "Bill To",
    shipToLabel: "Ship To",
    numberPrefix: "PRO",
    icon: "FileText",
    description: "Provide a preliminary invoice before final billing.",
  },
  "delivery-challan": {
    label: "Delivery Challan",
    labelPlural: "Delivery Challans",
    issueDateLabel: "Challan Date",
    dueDateLabel: "Delivery Date",
    billToLabel: "Deliver To",
    shipToLabel: "Ship To",
    numberPrefix: "DC",
    icon: "FileText",
    description: "Record goods delivered to a customer or location.",
  },
}

export const conversionMap: Record<DocumentType, DocumentType[]> = {
  invoice: ["receipt", "credit-note"],
  quotation: ["invoice", "estimate"],
  estimate: ["invoice", "quotation"],
  receipt: ["credit-note"],
  "purchase-order": ["invoice"],
  "credit-note": [],
  proforma: ["invoice"],
  "delivery-challan": [],
}
