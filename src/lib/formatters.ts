import { format, parseISO } from "date-fns";

export function formatNumber(value: number, format: "indian" | "international" = "indian"): string {
  const num = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (format === "indian") {
    const numStr = num.toFixed(2);
    const [intPart, decPart] = numStr.split(".");
    if (intPart.length <= 3) return `${sign}${intPart}.${decPart}`;
    const lastThree = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    return `${sign}${formatted}.${decPart}`;
  }
  return `${sign}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrency(value: number, symbol: string, format: "indian" | "international" = "indian"): string {
  return `${symbol}${formatNumber(value, format)}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "dd/MM/yy");
  } catch {
    return dateStr;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function now(): number {
  return Date.now();
}

export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    paid: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    cancelled: "bg-destructive/15 text-destructive",
    overdue: "bg-destructive/15 text-destructive",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

export function getDocumentColor(docType: string): string {
  const map: Record<string, string> = {
    invoice: "text-foreground",
    quotation: "text-foreground",
    estimate: "text-foreground",
    receipt: "text-foreground",
    "purchase-order": "text-foreground",
    "credit-note": "text-foreground",
    proforma: "text-foreground",
    "delivery-challan": "text-foreground",
  };
  return map[docType] || "text-foreground";
}
