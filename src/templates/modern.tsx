"use client"

import type { Document } from "./shared"
import { DocTypeLabel, formatDate, ItemRow, TotalsSection, PaymentSection, NotesSection, TermsSection, SignatureStamp } from "./shared"

function ModernTemplate({ document: doc }: { document: Document }) {
  const fmt = doc.numberFormat || "indian"
  const s = doc.currencySymbol || "₹"

  return (
    <div id="document-preview" className="bg-white max-w-4xl mx-auto shadow-sm print:shadow-none print:block font-sans">
      <div className="bg-gray-900 text-white px-10 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {doc.company?.logo && (
              <img src={doc.company.logo} alt="Logo" className="h-10 w-10 rounded object-contain bg-white" />
            )}
            <div>
              <h1 className="text-xl font-semibold break-words max-w-sm">{doc.company?.companyName || ""}</h1>
              <p className="text-sm text-gray-400">{DocTypeLabel[doc.docType]}</p>
              <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                {doc.company?.address && <p>{doc.company.address}</p>}
                {doc.company?.phone && <p>Phone: {doc.company.phone}</p>}
                {doc.company?.email && <p>Email: {doc.company.email}</p>}
                {doc.company?.website && <p>Website: {doc.company.website}</p>}
                {doc.company?.taxNumber && <p>Tax ID: {doc.company.taxNumber}</p>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-tight">{doc.docNumber}</p>
            <p className="text-sm text-gray-400">Issued: {formatDate(doc.issueDate)}</p>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

      <div className="px-10 py-6">
        <div className="grid grid-cols-2 gap-10 mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-gray-900 font-medium">{doc.billTo || doc.customer?.customerName || ""}</p>
            {doc.customer?.companyName && <p className="text-gray-600 text-sm">{doc.customer.companyName}</p>}
            {doc.customer?.email && <p className="text-gray-500 text-sm">{doc.customer.email}</p>}
            {doc.customer?.phone && <p className="text-gray-500 text-sm">{doc.customer.phone}</p>}
          </div>
          <div className="text-right space-y-1">
            {doc.dueDate && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</p>
                <p className="text-gray-900">{formatDate(doc.dueDate)}</p>
              </div>
            )}
            {doc.referenceNumber && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</p>
                <p className="text-gray-900">{doc.referenceNumber}</p>
              </div>
            )}
            {doc.poNumber && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</p>
                <p className="text-gray-900">{doc.poNumber}</p>
              </div>
            )}
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
              <th className="px-3 py-2.5 text-left font-semibold">Description</th>
              <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
              <th className="px-3 py-2.5 text-left font-semibold">Unit</th>
              <th className="px-3 py-2.5 text-right font-semibold">Price</th>
              <th className="px-3 py-2.5 text-right font-semibold">Disc</th>
              <th className="px-3 py-2.5 text-right font-semibold">Tax</th>
              <th className="px-3 py-2.5 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <ItemRow key={item.id} item={item} index={i} format={fmt} currencySymbol={s} />
            ))}
          </tbody>
        </table>

        <TotalsSection doc={doc} format={fmt} />

        <div className="grid grid-cols-2 gap-8 mt-8">
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

export { ModernTemplate }
export default ModernTemplate
