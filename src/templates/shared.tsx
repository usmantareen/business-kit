"use client"

import type { Document, Item, PaymentRecord } from "@/src/types"
import { formatCurrency, formatDate, formatNumber } from "@/src/lib/formatters"
import { DocTypeLabel } from "@/src/types"
import { useDocumentStore } from "@/src/lib/stores/document-store"

export type { Document }
export { formatCurrency, formatDate, formatNumber, DocTypeLabel }

export function ItemRow({ item, index, format, currencySymbol }: { item: Item; index: number; format: "indian" | "international"; currencySymbol: string }) {
  return (
    <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
      <td className="px-3 py-2 text-sm">{item.description}</td>
      <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
      <td className="px-3 py-2 text-sm">{item.unit}</td>
      <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.price, currencySymbol, format)}</td>
      <td className="px-3 py-2 text-sm text-right">{item.discount > 0 ? `${item.discount}${item.discountType === "percentage" ? "%" : ""}` : "—"}</td>
      <td className="px-3 py-2 text-sm text-right">{item.tax > 0 ? `${item.tax}%` : "—"}</td>
      <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.total, currencySymbol, format)}</td>
    </tr>
  )
}

export function TotalsSection({ doc, format }: { doc: Document; format: "indian" | "international" }) {
  const s = doc.currencySymbol || "₹"
  const paidAmount = (doc.payments || []).reduce((sum, p) => sum + p.amount, 0)
  const balance = doc.grandTotal - paidAmount

  let docDisc = 0
  if (doc.documentDiscount && doc.documentDiscount > 0) {
    if (doc.documentDiscountType === "percentage") {
      docDisc = doc.subtotal * (doc.documentDiscount / 100)
    } else {
      docDisc = doc.documentDiscount
    }
  }

  return (
    <div className="mt-6 ml-auto w-72 space-y-1.5">
      <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(doc.subtotal, s, format)}</span></div>
      {doc.discountTotal > 0 && <div className="flex justify-between text-sm text-destructive"><span>Discount</span><span>-{formatCurrency(doc.discountTotal, s, format)}</span></div>}
      {docDisc > 0 && <div className="flex justify-between text-sm text-destructive"><span>Doc Discount</span><span>-{formatCurrency(docDisc, s, format)}</span></div>}
      {doc.taxTotal > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(doc.taxTotal, s, format)}</span></div>}
      {doc.shipping > 0 && <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatCurrency(doc.shipping, s, format)}</span></div>}
      {doc.additionalCharges > 0 && <div className="flex justify-between text-sm"><span>Additional Charges</span><span>{formatCurrency(doc.additionalCharges, s, format)}</span></div>}
      <div className="flex justify-between border-t pt-1.5 text-base font-semibold"><span>Grand Total</span><span>{formatCurrency(doc.grandTotal, s, format)}</span></div>
      {paidAmount > 0 && (
        <>
          <div className="flex justify-between text-sm text-green-600"><span>Paid</span><span>{formatCurrency(paidAmount, s, format)}</span></div>
          {balance > 0 && <div className="flex justify-between text-sm font-semibold text-destructive"><span>Balance Due</span><span>{formatCurrency(balance, s, format)}</span></div>}
        </>
      )}
    </div>
  )
}

export function PaymentSection({ doc }: { doc: Document }) {
  if (!doc.payment?.method) return null
  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">Payment Details</p>
      <p className="text-muted-foreground">Method: {doc.payment.method}</p>
      {doc.payment.details && <p className="text-muted-foreground">{doc.payment.details}</p>}
      {doc.payment.upiId && <p className="text-muted-foreground">UPI: {doc.payment.upiId}</p>}
    </div>
  )
}

export function PaymentsSection({ doc }: { doc: Document }) {
  const payments = doc.payments || []
  const s = doc.currencySymbol || "₹"
  if (payments.length === 0) return null
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">Payments Received</p>
      <div className="mt-1 space-y-1">
        {payments.map((p) => (
          <div key={p.id} className="flex justify-between text-muted-foreground">
            <span>{formatDate(p.date)} {p.method && `· ${p.method}`}</span>
            <span className="font-medium text-green-600">{formatCurrency(p.amount, s, doc.numberFormat || "indian")}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1 font-medium">
          <span>Total Received</span>
          <span className="text-green-600">{formatCurrency(totalPaid, s, doc.numberFormat || "indian")}</span>
        </div>
      </div>
    </div>
  )
}

export function NotesSection({ doc }: { doc: Document }) {
  if (!doc.notes) return null
  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">Notes</p>
      <p className="text-muted-foreground whitespace-pre-wrap">{doc.notes}</p>
    </div>
  )
}

export function TermsSection({ doc }: { doc: Document }) {
  if (!doc.terms) return null
  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">Terms & Conditions</p>
      <p className="text-muted-foreground whitespace-pre-wrap">{doc.terms}</p>
    </div>
  )
}

export function SignatureStamp({ doc }: { doc: Document }) {
  if (!doc.signature && !doc.stamp) return null
  return (
    <div className="mt-6 flex gap-8">
      {doc.signature && (
        <div>
          <p className="text-sm font-medium">Authorized Signature</p>
          <img src={doc.signature} alt="Signature" className="mt-1 h-12" />
        </div>
      )}
      {doc.stamp && (
        <div>
          <p className="text-sm font-medium">Company Stamp</p>
          <img src={doc.stamp} alt="Stamp" className="mt-1 h-16" />
        </div>
      )}
    </div>
  )
}
