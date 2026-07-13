"use client"

import type { Document } from "./shared"
import { DocTypeLabel, formatCurrency, formatDate, PaymentSection, NotesSection, TermsSection, SignatureStamp } from "./shared"

function DarkItemRow({ item, index, format, currencySymbol }: { item: import("@/src/types").Item; index: number; format: "indian" | "international"; currencySymbol: string }) {
  return (
    <tr key={item.id} className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"}>
      <td className="px-3 py-2.5 text-sm text-gray-200">{item.description}</td>
      <td className="px-3 py-2.5 text-sm text-gray-200 text-right">{item.quantity}</td>
      <td className="px-3 py-2.5 text-sm text-gray-200">{item.unit}</td>
      <td className="px-3 py-2.5 text-sm text-gray-200 text-right">{formatCurrency(item.price, currencySymbol, format)}</td>
      <td className="px-3 py-2.5 text-sm text-gray-200 text-right">{item.discount > 0 ? `${item.discount}${item.discountType === "percentage" ? "%" : ""}` : "—"}</td>
      <td className="px-3 py-2.5 text-sm text-gray-200 text-right">{item.tax > 0 ? `${item.tax}%` : "—"}</td>
      <td className="px-3 py-2.5 text-sm text-gray-200 text-right font-medium">{formatCurrency(item.total, currencySymbol, format)}</td>
    </tr>
  )
}

function DarkTotals({ doc, format }: { doc: Document; format: "indian" | "international" }) {
  const s = doc.currencySymbol || "₹"
  return (
    <div className="mt-6 ml-auto w-72 space-y-1.5">
      <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>{formatCurrency(doc.subtotal, s, format)}</span></div>
      {doc.discountTotal > 0 && <div className="flex justify-between text-sm text-gray-400"><span>Discount</span><span>-{formatCurrency(doc.discountTotal, s, format)}</span></div>}
      {doc.taxTotal > 0 && <div className="flex justify-between text-sm text-gray-400"><span>Tax</span><span>{formatCurrency(doc.taxTotal, s, format)}</span></div>}
      {doc.shipping > 0 && <div className="flex justify-between text-sm text-gray-400"><span>Shipping</span><span>{formatCurrency(doc.shipping, s, format)}</span></div>}
      {doc.additionalCharges > 0 && <div className="flex justify-between text-sm text-gray-400"><span>Additional Charges</span><span>{formatCurrency(doc.additionalCharges, s, format)}</span></div>}
      <div className="flex justify-between border-t border-gray-600 pt-1.5 text-base font-semibold text-white"><span>Grand Total</span><span>{formatCurrency(doc.grandTotal, s, format)}</span></div>
    </div>
  )
}

function DarkTemplate({ document: doc }: { document: Document }) {
  const fmt = doc.numberFormat || "indian"
  const s = doc.currencySymbol || "₹"

  return (
    <div id="document-preview" className="bg-gray-900 max-w-4xl mx-auto shadow-sm print:shadow-none print:block font-sans text-gray-100">
      <div className="border-b border-gray-700 px-10 py-8">
        <div className="flex justify-between items-start">
          <div>
            {doc.company?.logo && (
              <img src={doc.company.logo} alt="Logo" className="h-12 mb-3 object-contain brightness-[2] invert-0" />
            )}
            <h1 className="text-2xl font-bold text-white break-words max-w-sm">{doc.company?.companyName || ""}</h1>
            <div className="text-xs text-gray-400 mt-2 space-y-0.5">
              {doc.company?.address && <p>{doc.company.address}</p>}
              {doc.company?.phone && <p>Phone: {doc.company.phone}</p>}
              {doc.company?.email && <p>Email: {doc.company.email}</p>}
              {doc.company?.website && <p>Website: {doc.company.website}</p>}
              {doc.company?.taxNumber && <p>Tax ID: {doc.company.taxNumber}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{DocTypeLabel[doc.docType]}</p>
            <p className="text-xl font-mono font-bold text-white tracking-tight">{doc.docNumber}</p>
            <p className="text-sm text-gray-400 mt-1">{formatDate(doc.issueDate)}</p>
          </div>
        </div>
      </div>

      <div className="px-10 py-6">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-white font-medium">{doc.billTo || doc.customer?.customerName || ""}</p>
            {doc.customer?.companyName && <p className="text-gray-400 text-sm">{doc.customer.companyName}</p>}
            {doc.customer?.email && <p className="text-gray-500 text-sm">{doc.customer.email}</p>}
          </div>
          <div className="text-right space-y-1">
            {doc.dueDate && (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 inline-block text-left">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</p>
                <p className="text-white">{formatDate(doc.dueDate)}</p>
              </div>
            )}
            {doc.referenceNumber && (
              <p className="text-sm text-gray-400 mt-2"><span className="text-xs text-gray-500 uppercase tracking-wider">Ref:</span> {doc.referenceNumber}</p>
            )}
            {doc.poNumber && (
              <p className="text-sm text-gray-400"><span className="text-xs text-gray-500 uppercase tracking-wider">PO:</span> {doc.poNumber}</p>
            )}
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700 text-gray-300 text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left font-semibold border-b border-gray-600">Description</th>
              <th className="px-3 py-3 text-right font-semibold border-b border-gray-600">Qty</th>
              <th className="px-3 py-3 text-left font-semibold border-b border-gray-600">Unit</th>
              <th className="px-3 py-3 text-right font-semibold border-b border-gray-600">Price</th>
              <th className="px-3 py-3 text-right font-semibold border-b border-gray-600">Disc</th>
              <th className="px-3 py-3 text-right font-semibold border-b border-gray-600">Tax</th>
              <th className="px-3 py-3 text-right font-semibold border-b border-gray-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <DarkItemRow key={item.id} item={item} index={i} format={fmt} currencySymbol={s} />
            ))}
          </tbody>
        </table>

        <DarkTotals doc={doc} format={fmt} />

        <div className="grid grid-cols-2 gap-8 mt-8 border-t border-gray-700 pt-6">
          <div>
            <PaymentSection doc={doc} />
            <NotesSection doc={doc} />
            <TermsSection doc={doc} />
          </div>
          <div className="text-right">
            <SignatureStamp doc={doc} />
          </div>
        </div>
      </div>
    </div>
  )
}

export { DarkTemplate }
export default DarkTemplate
