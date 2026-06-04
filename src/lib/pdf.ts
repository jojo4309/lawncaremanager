import jsPDF from 'jspdf'
import type { Invoice, Profile } from '../types'
import { formatCurrency, formatDate } from './utils'

export function generateInvoicePDF(invoice: Invoice, profile: Profile): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Header
  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.business_name || 'Lawn Services', 15, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (profile.business_address) doc.text(profile.business_address, 15, 30)
  if (profile.phone) doc.text(profile.phone, 15, 36)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageWidth - 15, 20, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${invoice.invoice_number}`, pageWidth - 15, 30, { align: 'right' })

  y = 55
  doc.setTextColor(0, 0, 0)

  // Bill To
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', 15, y)
  doc.setFont('helvetica', 'normal')
  y += 5
  if (invoice.customer) {
    doc.text(invoice.customer.name, 15, y); y += 5
    doc.text(`${invoice.customer.address}, ${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.zip}`, 15, y); y += 5
    if (invoice.customer.email) { doc.text(invoice.customer.email, 15, y); y += 5 }
    if (invoice.customer.phone) { doc.text(invoice.customer.phone, 15, y); y += 5 }
  }

  // Dates
  doc.setFont('helvetica', 'bold')
  doc.text('Issue Date:', pageWidth - 70, 55)
  doc.text('Due Date:', pageWidth - 70, 62)
  doc.text('Status:', pageWidth - 70, 69)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(invoice.issue_date), pageWidth - 15, 55, { align: 'right' })
  doc.text(formatDate(invoice.due_date), pageWidth - 15, 62, { align: 'right' })
  doc.text(invoice.status.toUpperCase(), pageWidth - 15, 69, { align: 'right' })

  y = Math.max(y, 80) + 5

  // Table header
  doc.setFillColor(243, 244, 246)
  doc.rect(10, y, pageWidth - 20, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Description', 15, y + 5.5)
  doc.text('Qty', pageWidth - 90, y + 5.5, { align: 'right' })
  doc.text('Unit Price', pageWidth - 55, y + 5.5, { align: 'right' })
  doc.text('Total', pageWidth - 15, y + 5.5, { align: 'right' })
  y += 10

  // Line items
  doc.setFont('helvetica', 'normal')
  for (const item of invoice.line_items ?? []) {
    doc.text(item.description, 15, y)
    doc.text(String(item.quantity), pageWidth - 90, y, { align: 'right' })
    doc.text(formatCurrency(item.unit_price), pageWidth - 55, y, { align: 'right' })
    doc.text(formatCurrency(item.total), pageWidth - 15, y, { align: 'right' })
    y += 7
  }

  // Totals
  y += 5
  doc.setDrawColor(229, 231, 235)
  doc.line(10, y, pageWidth - 10, y)
  y += 8

  const totalsX = pageWidth - 80
  doc.text('Subtotal:', totalsX, y); doc.text(formatCurrency(invoice.subtotal), pageWidth - 15, y, { align: 'right' }); y += 7
  if (invoice.tax_rate > 0) {
    doc.text(`Tax (${invoice.tax_rate}%):`, totalsX, y); doc.text(formatCurrency(invoice.tax_amount), pageWidth - 15, y, { align: 'right' }); y += 7
  }
  if (invoice.paid_amount > 0) {
    doc.text('Amount Paid:', totalsX, y); doc.text(`-${formatCurrency(invoice.paid_amount)}`, pageWidth - 15, y, { align: 'right' }); y += 7
  }

  doc.setFillColor(22, 163, 74)
  doc.rect(totalsX - 5, y, pageWidth - 10 - totalsX + 5, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Balance Due:', totalsX, y + 7)
  doc.text(formatCurrency(invoice.total - invoice.paid_amount), pageWidth - 15, y + 7, { align: 'right' })

  // Notes
  if (invoice.notes) {
    y += 20
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Notes:', 15, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    const lines = doc.splitTextToSize(invoice.notes, pageWidth - 30)
    doc.text(lines, 15, y)
  }

  doc.save(`${invoice.invoice_number}.pdf`)
}
