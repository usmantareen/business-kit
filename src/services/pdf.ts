import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { Document } from "@/src/types"
import { DocTypeLabel, CurrencySymbols } from "@/src/types"
import { formatNumber, formatCurrency } from "@/src/lib/formatters"

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
}

interface PDFOptions {
  pageSize?: "a4" | "letter"
  orientation?: "portrait" | "landscape"
}

const MARGIN = 50
const COLORS = {
  primary: rgb(0.1, 0.1, 0.1),
  secondary: rgb(0.3, 0.3, 0.3),
  muted: rgb(0.55, 0.55, 0.55),
  border: rgb(0.88, 0.88, 0.88),
  background: rgb(1, 1, 1),
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    if (!dataUrl || !dataUrl.includes(",")) return null;
    const parts = dataUrl.split(",");
    const base64 = parts[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Failed to convert data URL to Uint8Array", e);
    return null;
  }
}

function getAsciiCurrencySymbol(symbol: string, code: string): string {
  const cleanSymbol = (symbol || "").trim();
  if (cleanSymbol === "₹") return "INR ";
  if (cleanSymbol === "€") return "EUR ";
  if (cleanSymbol === "£") return "GBP ";
  if (cleanSymbol === "د.إ") return "AED ";
  if (cleanSymbol === "C$") return "CAD ";
  if (cleanSymbol === "A$") return "AUD ";
  if (cleanSymbol === "$") return "$";
  
  const isAscii = /^[\x00-\x7F]*$/.test(cleanSymbol);
  if (!isAscii) {
    return code ? `${code} ` : "";
  }
  return cleanSymbol;
}

function sanitizePdfText(text: string): string {
  if (!text) return "";
  return text.replace(/[^\x20-\x7E\n]/g, "?");
}

export async function generatePDF(doc: Document, template: string = "minimal", options: PDFOptions = {}) {
  try {
    const { pageSize = "a4", orientation = "portrait" } = options
    let [width, height] = PAGE_SIZES[pageSize]
    if (orientation === "landscape") [width, height] = [height, width]

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([width, height])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = height - MARGIN

    function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
      const cleanText = sanitizePdfText(text)
      const lines: string[] = []
      const words = cleanText.split(" ")
      let line = ""
      for (const word of words) {
        const testLine = line ? line + " " + word : word
        const testWidth = font.widthOfTextAtSize(testLine, fontSize)
        if (testWidth > maxWidth && line) {
          lines.push(line)
          line = word
        } else {
          line = testLine
        }
      }
      if (line) lines.push(line)
      return lines
    }

    function drawText(text: string, x: number, yPos: number, size: number, color = COLORS.primary, bold = false) {
      const f = bold ? boldFont : font
      const cleanText = sanitizePdfText(text)
      page.drawText(cleanText, { x, y: yPos, size, font: f, color })
    }

    function drawLine(yPos: number, x1 = MARGIN, x2 = width - MARGIN) {
      page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness: 1, color: COLORS.border })
    }

    // Safe field lookups
    const company = doc.company || { logo: "", companyName: "", email: "", website: "", address: "", taxNumber: "", phone: "" }
    const customer = doc.customer || null
    const numberFormat = doc.numberFormat || "indian"
    
    const rawSymbol = doc.currencySymbol || CurrencySymbols[doc.currency] || "₹"
    const currencySymbol = getAsciiCurrencySymbol(rawSymbol, doc.currency || "INR")
    
    const docTypeLabel = (DocTypeLabel[doc.docType] || doc.docType || "Document").toUpperCase()
    const statusText = doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : "Draft"

    // Company Header
    if (company.companyName) {
      drawText(company.companyName.toUpperCase(), MARGIN, y, 16, COLORS.primary, true)
      y -= 15
      if (company.email) { drawText(company.email, MARGIN, y, 9, COLORS.secondary); y -= 11 }
      if (company.phone) { drawText(company.phone, MARGIN, y, 9, COLORS.secondary); y -= 11 }
      if (company.address) {
        const addrLines = wrapText(company.address, width - 2 * MARGIN, 9)
        for (const line of addrLines) { drawText(line, MARGIN, y, 9, COLORS.secondary); y -= 11 }
      }
      if (company.taxNumber) { drawText(`Tax: ${company.taxNumber}`, MARGIN, y, 9, COLORS.secondary); y -= 11 }
      y -= 8
    }

    // Document Type
    drawText(docTypeLabel, width - MARGIN - font.widthOfTextAtSize(sanitizePdfText(docTypeLabel), 20), height - MARGIN, 20, COLORS.primary, true)

    // Document Number
    const docNumberStr = `#${doc.docNumber || "—"}`
    drawText(docNumberStr, width - MARGIN - font.widthOfTextAtSize(sanitizePdfText(docNumberStr), 12), height - MARGIN - 24, 12, COLORS.secondary)
    const statusTextStr = `Status: ${statusText}`
    page.drawText(sanitizePdfText(statusTextStr), { x: width - MARGIN - font.widthOfTextAtSize(sanitizePdfText(statusTextStr), 10), y: height - MARGIN - 40, size: 10, font, color: COLORS.secondary })

    drawLine(y)
    y -= 20

    // Bill To / Ship To / Dates on same horizontal band below the line
    const leftX = MARGIN
    const rightX = width / 2 + 20
    const colWidth = width / 2 - 60

    let leftY = y
    let rightY = y

    if (customer) {
      drawText("BILL TO", leftX, leftY, 10, COLORS.muted, true)
      leftY -= 14
      drawText(customer.customerName || "", leftX, leftY, 10, COLORS.primary, true)
      leftY -= 13
      if (customer.companyName) { drawText(customer.companyName, leftX, leftY, 9, COLORS.secondary); leftY -= 11 }
      if (customer.email) { drawText(customer.email, leftX, leftY, 9, COLORS.secondary); leftY -= 11 }
      if (customer.phone) { drawText(customer.phone, leftX, leftY, 9, COLORS.secondary); leftY -= 11 }
      if (doc.billTo) {
        const billLines = wrapText(doc.billTo, colWidth, 9)
        for (const line of billLines) { drawText(line, leftX, leftY, 9, COLORS.secondary); leftY -= 11 }
      }
    }

    drawText(`Issue Date: ${doc.issueDate || "—"}`, rightX, rightY, 10, COLORS.secondary)
    rightY -= 15
    drawText(`Due Date: ${doc.dueDate || "—"}`, rightX, rightY, 10, COLORS.secondary)
    rightY -= 15
    if (doc.poNumber) {
      drawText(`PO#: ${doc.poNumber}`, rightX, rightY, 10, COLORS.secondary)
      rightY -= 15
    }
    if (doc.referenceNumber) {
      drawText(`Ref#: ${doc.referenceNumber}`, rightX, rightY, 10, COLORS.secondary)
      rightY -= 15
    }

    y = Math.min(leftY, rightY) - 15

    // Ship To (if different)
    if (doc.shipTo && doc.shipTo !== doc.billTo) {
      drawText("SHIP TO", MARGIN, y, 10, COLORS.muted, true)
      y -= 14
      const shipLines = wrapText(doc.shipTo, colWidth, 9)
      for (const line of shipLines) { drawText(line, MARGIN, y, 9, COLORS.secondary); y -= 11 }
      y -= 15
    }

    let itemsY = y - 15

    // Items Table Header
    drawLine(itemsY)
    itemsY -= 12
    
    // Draw table headers with correct column alignments
    drawText("Description", 50, itemsY, 9, COLORS.muted, true)
    
    const drawHeaderRight = (text: string, rightEdge: number) => {
      drawText(text, rightEdge - boldFont.widthOfTextAtSize(text, 9), itemsY, 9, COLORS.muted, true)
    }
    
    drawHeaderRight("Qty", 260)
    drawText("Unit", 270, itemsY, 9, COLORS.muted, true)
    drawHeaderRight("Price", 360)
    drawHeaderRight("Disc", 415)
    drawHeaderRight("Tax", 465)
    drawHeaderRight("Total", 545)
    
    itemsY -= 8
    drawLine(itemsY)
    itemsY -= 15

    // Items List
    const itemsList = doc.items || []
    for (const item of itemsList) {
      const descLines = wrapText(item.description || "", 170, 9)
      const rowHeight = Math.max(descLines.length * 12 + 6, 20)

      let descY = itemsY
      for (const line of descLines) {
        drawText(line, 50, descY, 9, COLORS.primary)
        descY -= 12
      }

      const drawRowRight = (text: string, rightEdge: number, isBold = false) => {
        const f = isBold ? boldFont : font
        drawText(text, rightEdge - f.widthOfTextAtSize(text, 9), itemsY, 9, COLORS.primary, isBold)
      }

      drawRowRight(String(item.quantity || 0), 260)
      drawText(item.unit || "—", 270, itemsY, 9, COLORS.primary)
      drawRowRight(formatCurrency(item.price || 0, "", numberFormat), 360)
      
      const discText = item.discount > 0 ? `${item.discount}${item.discountType === "percentage" ? "%" : ""}` : "—"
      drawRowRight(discText, 415)
      
      const taxText = item.tax > 0 ? `${item.tax}%` : "—"
      drawRowRight(taxText, 465)
      
      drawRowRight(formatCurrency(item.total || 0, "", numberFormat), 545, true)

      itemsY -= rowHeight
      drawLine(itemsY)
      itemsY -= 12
    }

    itemsY -= 4

    // Totals
    const totalsX = width - MARGIN - 180

    function drawTotal(label: string, value: number, bold = false) {
      drawText(label, totalsX, itemsY, 10, bold ? COLORS.primary : COLORS.secondary, bold)
      const valText = formatCurrency(value, currencySymbol, numberFormat)
      drawText(valText, 545 - (bold ? boldFont : font).widthOfTextAtSize(sanitizePdfText(valText), 10), itemsY, 10, COLORS.primary, bold)
      itemsY -= 16
    }

    drawTotal("Subtotal", doc.subtotal || 0)
    if (doc.discountTotal > 0) drawTotal("Discount", -doc.discountTotal)
    if (doc.documentDiscount > 0) {
      const docDisc = doc.documentDiscountType === "percentage"
        ? (doc.subtotal || 0) * (doc.documentDiscount / 100)
        : doc.documentDiscount
      drawTotal("Doc Discount", -docDisc)
    }
    if (doc.taxTotal > 0) drawTotal("Tax", doc.taxTotal)
    if (doc.shipping > 0) drawTotal("Shipping", doc.shipping)
    if (doc.additionalCharges > 0) drawTotal("Additional Charges", doc.additionalCharges)
    
    drawLine(itemsY)
    itemsY -= 12
    drawTotal("Grand Total", doc.grandTotal || 0, true)
    
    drawLine(itemsY)
    drawLine(itemsY - 2)
    itemsY -= 20

    const payments = doc.payments || []
    if (payments.length > 0) {
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
      const balance = (doc.grandTotal || 0) - totalPaid
      drawText("PAYMENTS RECEIVED", MARGIN, itemsY, 10, COLORS.muted, true)
      itemsY -= 14
      for (const p of payments) {
        const pText = sanitizePdfText(`${p.date} ${p.method ? `· ${p.method}` : ""}`)
        const pAmt = formatCurrency(p.amount, currencySymbol, numberFormat)
        drawText(pText, MARGIN, itemsY, 9, COLORS.secondary)
        drawText(pAmt, 545 - font.widthOfTextAtSize(sanitizePdfText(pAmt), 9), itemsY, 9, COLORS.primary)
        itemsY -= 12
      }
      drawLine(itemsY, MARGIN, 545)
      itemsY -= 10
      drawText("Total Received", MARGIN, itemsY, 9, COLORS.primary, true)
      drawText(formatCurrency(totalPaid, currencySymbol, numberFormat), 545 - boldFont.widthOfTextAtSize(sanitizePdfText(formatCurrency(totalPaid, currencySymbol, numberFormat)), 9), itemsY, 9, COLORS.primary, true)
      itemsY -= 14
      if (balance > 0) {
        drawText("Balance Due", MARGIN, itemsY, 9, COLORS.primary, true)
        drawText(formatCurrency(balance, currencySymbol, numberFormat), 545 - boldFont.widthOfTextAtSize(sanitizePdfText(formatCurrency(balance, currencySymbol, numberFormat)), 9), itemsY, 9, COLORS.primary, true)
        itemsY -= 14
      }
      itemsY -= 12
    }

    // Payment Info
    if (doc.payment?.method) {
      drawText("PAYMENT DETAILS", MARGIN, itemsY, 10, COLORS.muted, true)
      itemsY -= 14
      drawText(`Method: ${doc.payment.method}`, MARGIN, itemsY, 9, COLORS.secondary); itemsY -= 12
      if (doc.payment.details) {
        const detLines = wrapText(doc.payment.details, width - 2 * MARGIN, 9)
        for (const line of detLines) { drawText(line, MARGIN, itemsY, 9, COLORS.secondary); itemsY -= 11 }
      }
      itemsY -= 12
    }

    // Notes
    if (doc.notes) {
      drawText("NOTES", MARGIN, itemsY, 10, COLORS.muted, true)
      itemsY -= 14
      const noteLines = wrapText(doc.notes, width - 2 * MARGIN, 9)
      for (const line of noteLines) { drawText(line, MARGIN, itemsY, 9, COLORS.secondary); itemsY -= 11 }
      itemsY -= 12
    }

    // Terms
    if (doc.terms) {
      drawText("TERMS & CONDITIONS", MARGIN, itemsY, 10, COLORS.muted, true)
      itemsY -= 14
      const termLines = wrapText(doc.terms, width - 2 * MARGIN, 9)
      for (const line of termLines) { drawText(line, MARGIN, itemsY, 9, COLORS.secondary); itemsY -= 11 }
      itemsY -= 12
    }

    // Signature & Stamp
    if (doc.signature || doc.stamp) {
      let sigImage = null
      let stampImage = null
      
      if (doc.signature) {
        const sigBytes = dataUrlToUint8Array(doc.signature)
        if (sigBytes) {
          sigImage = await pdfDoc.embedPng(sigBytes).catch(err => {
            console.error("Error embedding signature PNG", err)
            return null
          })
        }
      }
      
      if (doc.stamp) {
        const stampBytes = dataUrlToUint8Array(doc.stamp)
        if (stampBytes) {
          const isPng = doc.stamp.includes("image/png")
          if (isPng) {
            stampImage = await pdfDoc.embedPng(stampBytes).catch(err => {
              console.error("Error embedding stamp PNG", err)
              return null
            })
          } else {
            stampImage = await pdfDoc.embedJpg(stampBytes).catch(err => {
              console.error("Error embedding stamp JPG", err)
              return null
            })
          }
        }
      }
      
      if (sigImage || stampImage) {
        let currentX = MARGIN
        if (sigImage) {
          drawText("Authorized Signature", currentX, itemsY, 10, COLORS.muted, true)
          page.drawImage(sigImage, { x: currentX, y: itemsY - 50, width: 100, height: 40 })
          currentX += 130
        }
        if (stampImage) {
          drawText("Company Stamp", currentX, itemsY, 10, COLORS.muted, true)
          page.drawImage(stampImage, { x: currentX, y: itemsY - 60, width: 80, height: 50 })
        }
        itemsY -= 70
      }
    }

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${doc.docNumber || "document"}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Error generating PDF:", err)
    throw err
  }
}
