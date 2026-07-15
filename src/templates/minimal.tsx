"use client"

import type { Document } from "./shared"
import { DocTypeLabel, formatDate, ItemRow, TotalsSection, PaymentSection, PaymentsSection, NotesSection, TermsSection, SignatureStamp } from "./shared"

function MinimalTemplate({ document: doc }: { document: Document }) {
  const fmt = doc.numberFormat || "indian"
  const s = doc.currencySymbol || "₹"

  return (
    <div id="document-preview" className="bg-white max-w-4xl mx-auto shadow-sm print:shadow-none p-10 print:block font-sans">
      <div className="text-center mb-8">
        <span className="text-xs tracking-widest text-gray-400 uppercase">{DocTypeLabel[doc.docType]}</span>
      </div>

      <div className="border-t border-b border-gray-200 py-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            {doc.company?.logo && (
              <img src={doc.company.logo} alt="Logo" className="h-12 mb-3 object-contain" />
            )}
            <h1 className="text-2xl font-light text-gray-900 break-words max-w-sm">{doc.company?.companyName || ""}</h1>
            <div className="text-xs text-gray-500 mt-2 space-y-0.5">
              {doc.company?.address && <p>{doc.company.address}</p>}
              {doc.company?.phone && <p>Phone: {doc.company.phone}</p>}
              {doc.company?.email && <p>Email: {doc.company.email}</p>}
              {doc.company?.website && <p>Website: {doc.company.website}</p>}
              {doc.company?.taxNumber && <p>Tax ID: {doc.company.taxNumber}</p>}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-medium text-gray-900">{doc.docNumber}</p>
            <p>Date: {formatDate(doc.issueDate)}</p>
            {doc.dueDate && <p>Due: {formatDate(doc.dueDate)}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
          <p className="text-gray-900">{doc.billTo || doc.customer?.customerName || ""}</p>
          {doc.customer?.companyName && <p className="text-gray-600">{doc.customer.companyName}</p>}
        </div>
        <div className="text-right">
          {doc.referenceNumber && (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Reference</p>
              <p className="text-gray-900">{doc.referenceNumber}</p>
            </>
          )}
          {doc.poNumber && (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-2 mb-1">PO Number</p>
              <p className="text-gray-900">{doc.poNumber}</p>
            </>
          )}
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
            <th className="px-3 pb-2 text-left font-normal">Description</th>
            <th className="px-3 pb-2 text-right font-normal">Qty</th>
            <th className="px-3 pb-2 text-left font-normal">Unit</th>
            <th className="px-3 pb-2 text-right font-normal">Price</th>
            <th className="px-3 pb-2 text-right font-normal">Disc</th>
            <th className="px-3 pb-2 text-right font-normal">Tax</th>
            <th className="px-3 pb-2 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((item, i) => (
            <ItemRow key={item.id} item={item} index={i} format={fmt} currencySymbol={s} />
          ))}
        </tbody>
      </table>

      <TotalsSection doc={doc} format={fmt} />

      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <PaymentSection doc={doc} />
            <PaymentsSection doc={doc} />
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

export { MinimalTemplate }
export default MinimalTemplate
