"use client"

import type { Document } from "./shared"
import { DocTypeLabel, formatCurrency, formatDate, TotalsSection, PaymentSection, PaymentsSection, NotesSection, TermsSection, SignatureStamp } from "./shared"

function CorporateTemplate({ document: doc }: { document: Document }) {
  const fmt = doc.numberFormat || "indian"
  const s = doc.currencySymbol || "₹"

  return (
    <div id="document-preview" className="bg-white max-w-4xl mx-auto shadow-sm print:shadow-none print:block font-serif">
      <div className="border-b-4 border-t-2 border-gray-900 px-10 py-8">
        <div className="flex justify-between items-start">
          <div>
            {doc.company?.logo && (
              <img src={doc.company.logo} alt="Logo" className="h-14 mb-3 object-contain" />
            )}
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight break-words max-w-sm">{doc.company?.companyName || ""}</h1>
            {doc.company?.address && <p className="text-sm text-gray-600 mt-1">{doc.company.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold border-b-2 border-gray-900 pb-1 mb-2">{DocTypeLabel[doc.docType]}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Doc #:</span> {doc.docNumber}</p>
            <p className="text-sm text-gray-700"><span className="font-semibold">Date:</span> {formatDate(doc.issueDate)}</p>
            {doc.dueDate && <p className="text-sm text-gray-700"><span className="font-semibold">Due:</span> {formatDate(doc.dueDate)}</p>}
          </div>
        </div>
      </div>

      <div className="px-10 py-6">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border p-4 bg-gray-50">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-gray-900 font-semibold">{doc.billTo || doc.customer?.customerName || ""}</p>
            {doc.customer?.companyName && <p className="text-gray-700">{doc.customer.companyName}</p>}
            {doc.customer?.email && <p className="text-gray-600 text-sm">{doc.customer.email}</p>}
            {doc.customer?.phone && <p className="text-gray-600 text-sm">{doc.customer.phone}</p>}
          </div>
          <div className="border p-4 bg-gray-50">
            {doc.referenceNumber && (
              <p className="text-sm text-gray-700"><span className="font-semibold">Reference:</span> {doc.referenceNumber}</p>
            )}
            {doc.poNumber && (
              <p className="text-sm text-gray-700"><span className="font-semibold">PO Number:</span> {doc.poNumber}</p>
            )}
            {doc.shipTo && (
              <>
                {!doc.referenceNumber && !doc.poNumber && <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Ship To</p>}
                {doc.referenceNumber && <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-2 mb-1">Ship To</p>}
                <p className="text-sm text-gray-700">{doc.shipTo}</p>
              </>
            )}
          </div>
        </div>

        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-3 py-2.5 text-left font-semibold border border-gray-700">Description</th>
              <th className="px-3 py-2.5 text-right font-semibold border border-gray-700">Qty</th>
              <th className="px-3 py-2.5 text-left font-semibold border border-gray-700">Unit</th>
              <th className="px-3 py-2.5 text-right font-semibold border border-gray-700">Price</th>
              <th className="px-3 py-2.5 text-right font-semibold border border-gray-700">Disc</th>
              <th className="px-3 py-2.5 text-right font-semibold border border-gray-700">Tax</th>
              <th className="px-3 py-2.5 text-right font-semibold border border-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2 text-sm border border-gray-300">{item.description}</td>
                <td className="px-3 py-2 text-sm text-right border border-gray-300">{item.quantity}</td>
                <td className="px-3 py-2 text-sm border border-gray-300">{item.unit}</td>
                <td className="px-3 py-2 text-sm text-right border border-gray-300">{formatCurrency(item.price, s, fmt)}</td>
                <td className="px-3 py-2 text-sm text-right border border-gray-300">{item.discount > 0 ? `${item.discount}${item.discountType === "percentage" ? "%" : ""}` : "—"}</td>
                <td className="px-3 py-2 text-sm text-right border border-gray-300">{item.tax > 0 ? `${item.tax}%` : "—"}</td>
                <td className="px-3 py-2 text-sm text-right font-medium border border-gray-300">{formatCurrency(item.total, s, fmt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <TotalsSection doc={doc} format={fmt} />

        <div className="grid grid-cols-2 gap-8 mt-8">
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

      <div className="border-t-2 border-b-4 border-gray-900 px-10 py-4 text-center text-sm text-gray-600">
        <p>
          {[doc.company?.companyName, doc.company?.email, doc.company?.phone, doc.company?.website, doc.company?.taxNumber ? `Tax ID: ${doc.company.taxNumber}` : ""].filter(Boolean).join(" | ")}
        </p>
      </div>
    </div>
  )
}

export { CorporateTemplate }
export default CorporateTemplate
