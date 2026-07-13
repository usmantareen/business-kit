import QRCode from "qrcode"

export async function generateUPIQR(upiId: string, amount?: number, name?: string): Promise<string | null> {
  if (!upiId) return null
  try {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}${amount ? `&am=${amount}` : ""}${name ? `&pn=${encodeURIComponent(name)}` : ""}&cu=INR`
    return await QRCode.toDataURL(upiUrl, { width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
  } catch {
    return null
  }
}
