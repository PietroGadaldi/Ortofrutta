import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * Generate an order receipt PDF using jsPDF
 * @param {Object} order - Order object with client info and details
 * @param {string} order.id - Order ID
 * @param {string} order.data_creazione - Order creation date
 * @param {string} order.data_ordine - Order date (for which date it's ordered)
 * @param {string} order.profili.nome - Client name
 * @param {Array} order.dettagli_ordine - Array of order items
 * @returns {Blob} PDF as Blob
 */
export function generateOrderPDF(order) {
  try {
    if (!order || !order.dettagli_ordine) {
      throw new Error('Invalid order data')
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Font setup
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    // Header - Title with client name
    pdf.setFontSize(26)
    pdf.setFont(undefined, 'bold')
    const clientName = order.profili?.nome || 'Cliente'
    pdf.text(clientName, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 14

    // Divider
    pdf.setDrawColor(100)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Order date (data_ordine) on single line
    pdf.setFontSize(13)
    pdf.setFont(undefined, 'bold')
    pdf.text('Data ordine:', margin, yPosition)
    pdf.setFont(undefined, 'normal')
    const formattedOrderDate = format(new Date(order.data_ordine), 'dd/MM/yyyy', {
      locale: it,
    })
    pdf.text(formattedOrderDate, margin + 40, yPosition)
    yPosition += 14

    // Divider
    pdf.setDrawColor(100)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Products table header
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.setFillColor(220, 220, 220)
    pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F')
    pdf.text('Prodotto', margin + 3, yPosition)
    pdf.text('Quantità', margin + 70, yPosition)
    pdf.text('Unità', margin + 105, yPosition)
    pdf.text('Peso Eff.', margin + 155, yPosition)
    yPosition += 10

    // Products list
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(12)
    let productYPosition = yPosition

    order.dettagli_ordine.forEach((item, index) => {
      const productName = item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto'
      const quantity = item.quantita
      const tipologia = item.tipologia || 'N/A'

      // Check if we need a new page
      if (productYPosition > pageHeight - 35) {
        pdf.addPage()
        productYPosition = margin + 10
      }

      // Product row with better spacing
      pdf.text(productName, margin + 3, productYPosition)
      pdf.text(quantity.toString(), margin + 80, productYPosition, { align: 'right' })
      pdf.text(tipologia, margin + 105, productYPosition)
      // Peso Effettivo column is left blank for manual entry
      productYPosition += 8
    })

    yPosition = productYPosition + 5

    // Divider before footer
    pdf.setDrawColor(100)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Footer
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'italic')
    pdf.setTextColor(120)
    const footerText = 'Ricevuta generata automaticamente da OrtoFrutta Brescia'
    pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })

    // Reset text color
    pdf.setTextColor(0)

    // Return as Blob
    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Generate a combined PDF with all orders for a day, one order per page
 * @param {Array} ordini - Array of orders with client info and details
 * @param {Date} date - The day date (for display)
 * @returns {Blob} PDF as Blob
 */
export function generateDayOrdersPDF(ordini, date) {
  try {
    if (!ordini || ordini.length === 0) {
      throw new Error('Nessun ordine da stampare')
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2

    ordini.forEach((order, orderIndex) => {
      if (orderIndex > 0) pdf.addPage()

      let yPosition = margin

      // Client name header
      pdf.setFontSize(26)
      pdf.setFont(undefined, 'bold')
      const clientName = order.profili?.nome || 'Cliente'
      pdf.text(clientName, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 14

      // Divider
      pdf.setDrawColor(100)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Order date
      pdf.setFontSize(13)
      pdf.setFont(undefined, 'bold')
      pdf.text('Data ordine:', margin, yPosition)
      pdf.setFont(undefined, 'normal')
      const formattedOrderDate = format(new Date(order.data_ordine), 'dd/MM/yyyy', { locale: it })
      pdf.text(formattedOrderDate, margin + 40, yPosition)
      yPosition += 14

      // Divider
      pdf.setDrawColor(100)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Products table header
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.setFillColor(220, 220, 220)
      pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F')
      pdf.text('Prodotto', margin + 3, yPosition)
      pdf.text('Quantità', margin + 70, yPosition)
      pdf.text('Unità', margin + 105, yPosition)
      pdf.text('Peso Eff.', margin + 155, yPosition)
      yPosition += 10

      // Products list
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(12)

      ;(order.dettagli_ordine || []).forEach((item) => {
        const productName = item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto'
        const quantity = item.quantita
        const tipologia = item.tipologia || 'N/A'

        if (yPosition > pageHeight - 35) {
          pdf.addPage()
          yPosition = margin + 10
        }

        pdf.text(productName, margin + 3, yPosition)
        pdf.text(quantity.toString(), margin + 80, yPosition, { align: 'right' })
        pdf.text(tipologia, margin + 105, yPosition)
        yPosition += 8
      })

      // Footer
      pdf.setFontSize(9)
      pdf.setFont(undefined, 'italic')
      pdf.setTextColor(120)
      pdf.text('Ricevuta generata automaticamente da OrtoFrutta Brescia', pageWidth / 2, pageHeight - 10, { align: 'center' })
      pdf.setTextColor(0)
    })

    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating day orders PDF:', error)
    throw error
  }
}

/**
 * Generate a daily product summary PDF
 * @param {Date} date - The day date
 * @param {Array} items - Array of { nome, tipologia, totale }
 * @returns {Blob} PDF as Blob
 */
export function generateDaySummaryPDF(date, items) {
  try {
    if (!items || items.length === 0) {
      throw new Error('Nessun prodotto nel riepilogo')
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    // Title
    pdf.setFontSize(22)
    pdf.setFont(undefined, 'bold')
    pdf.text('Riepilogo Prodotti', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Date subtitle
    const formattedDate = format(new Date(date), "EEEE d MMMM yyyy", { locale: it })
    pdf.setFontSize(13)
    pdf.setFont(undefined, 'normal')
    pdf.text(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Divider
    pdf.setDrawColor(100)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Table header
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.setFillColor(220, 220, 220)
    pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F')
    pdf.text('Prodotto', margin + 3, yPosition)
    pdf.text('Totale', margin + 115, yPosition)
    pdf.text('Unità', margin + 150, yPosition)
    yPosition += 10

    // Rows
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(12)

    items.forEach((item) => {
      if (yPosition > pageHeight - 35) {
        pdf.addPage()
        yPosition = margin + 10
      }

      pdf.text(item.nome, margin + 3, yPosition)
      pdf.text(item.totale.toString(), margin + 125, yPosition, { align: 'right' })
      pdf.text(item.tipologia, margin + 150, yPosition)
      yPosition += 8
    })

    yPosition += 5

    // Divider before footer
    pdf.setDrawColor(100)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)

    // Footer
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'italic')
    pdf.setTextColor(120)
    pdf.text('Riepilogo generato automaticamente da OrtoFrutta Brescia', pageWidth / 2, pageHeight - 10, { align: 'center' })
    pdf.setTextColor(0)

    return pdf.output('blob')
  } catch (error) {
    console.error('Error generating summary PDF:', error)
    throw error
  }
}

/**
 * Download a PDF blob to user's device
 * @param {Blob} pdfBlob - PDF blob to download
 * @param {string} fileName - Name of the file to save
 */
export function downloadPDFBlob(pdfBlob, fileName = 'ricevuta.pdf') {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
