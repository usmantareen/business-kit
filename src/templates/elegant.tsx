"use client"

import type { Document } from "./shared"
import { DocTypeLabel, formatDate, ItemRow, TotalsSection, PaymentSection, NotesSection, TermsSection, SignatureStamp } from "./shared"

function ElegantTemplate({ document: doc }: { document: Document }) {
  const fmt = doc.numberFormat || "indian"
  const s = doc.currencySymbol || "₹"

  return (
    <div id="document-preview" className="bg-white max-w-4xl mx-auto shadow-sm print:shadow-none print:block font-sans">
      <div className="border-t-4 border-t-amber-700 border-b border-b-amber-200 mx-10 pt-6 pb-4" />

      <div className="mx-10">
        <div className="bg-amber-50/60 rounded-bl-3xl rounded-tr-3xl px-8 py-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              {doc.company?.logo && (
                <img src={doc.company.logo} alt="Logo" className="h-14 mb-3 object-contain" />
              )}
              <h1 className="text-2xl font-light text-gray-900 tracking-wide break-words max-w-sm">{doc.company?.companyName || ""}</h1>
              {doc.company?.address && <p className="text-xs text-gray-500 mt-1 max-w-sm">{doc.company.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg italic text-amber-700 font-serif">{DocTypeLabel[doc.docType]}</p>
              <p className="text-sm text-gray-500 mt-1">{doc.docNumber}</p>
              <p className="text-xs text-gray-400">{formatDate(doc.issueDate)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="border-l-2 border-amber-300 pl-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
            <p className="text-gray-900 font-medium">{doc.billTo || doc.customer?.customerName || ""}</p>
            {doc.customer?.companyName && <p className="text-gray-600 text-sm">{doc.customer.companyName}</p>}
            {doc.customer?.email && <p className="text-gray-500 text-sm">{doc.customer.email}</p>}
          </div>
          <div className="text-right">
            {doc.referenceNumber && (
              <p className="text-sm text-gray-600"><span className="text-xs text-gray-400 uppercase tracking-widest">Ref:</span> {doc.referenceNumber}</p>
            )}
            {doc.poNumber && (
              <p className="text-sm text-gray-600"><span className="text-xs text-gray-400 uppercase tracking-widest">PO:</span> {doc.poNumber}</p>
            )}
            {doc.dueDate && (
              <p className="text-sm text-gray-600 mt-2"><span className="text-xs text-gray-400 uppercase tracking-widest">Due:</span> {formatDate(doc.dueDate)}</p>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs text-amber-500 uppercase tracking-widest">Items</span>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-amber-200">
              <th className="px-3 pb-3 text-left font-normal">Description</th>
              <th className="px-3 pb-3 text-right font-normal">Qty</th>
              <th className="px-3 pb-3 text-left font-normal">Unit</th>
              <th className="px-3 pb-3 text-right font-normal">Price</th>
              <th className="px-3 pb-3 text-right font-normal">Disc</th>
              <th className="px-3 pb-3 text-right font-normal">Tax</th>
              <th className="px-3 pb-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <ItemRow key={item.id} item={item} index={i} format={fmt} currencySymbol={s} />
            ))}
          </tbody>
        </table>

        <TotalsSection doc={doc} format={fmt} />

        <div className="mt-8 rounded-2xl bg-amber-50/40 px-6 py-4">
          <div className="grid grid-cols-2 gap-8">
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

      <div className="border-t border-amber-200 mx-10 mt-6 pt-4 pb-6 text-center text-xs text-gray-400">
        <p>
          {[doc.company?.companyName, doc.company?.email, doc.company?.phone, doc.company?.website, doc.company?.taxNumber ? `Tax: ${doc.company.taxNumber}` : ""].filter(Boolean).join(" — ")}
        </p>
      </div>

      <div className="border-b-4 border-b-amber-700 border-t border-t-amber-200 mx-10" />
    </div>
  )
}

export { ElegantTemplate }
export default ElegantTemplate
