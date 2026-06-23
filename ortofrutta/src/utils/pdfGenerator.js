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

    // Header - Title with client name (font auto-ridotto se il nome è troppo lungo)
    pdf.setFont(undefined, 'bold')
    const clientName = (order.profili?.nome || 'Cliente').toUpperCase()
    let nameFontSize = 26
    pdf.setFontSize(nameFontSize)
    while (pdf.getTextWidth(clientName) > contentWidth && nameFontSize > 10) {
      nameFontSize -= 1
      pdf.setFontSize(nameFontSize)
    }
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

    // Column separator x positions
    const col2X = margin + 67
    const col3X = margin + 102
    const col4X = margin + 152
    const tableRight = margin + contentWidth
    const lineSpacing = 5

    const drawRowLines = (y, drawTopBorder = false, rowH = 8) => {
      const rowTop = y - 6
      const rowBottom = rowTop + rowH
      pdf.setDrawColor(150)
      pdf.setLineWidth(0.3)
      if (drawTopBorder) pdf.line(margin, rowTop, tableRight, rowTop)
      pdf.line(margin, rowBottom, tableRight, rowBottom)
      pdf.line(margin, rowTop, margin, rowBottom)
      pdf.line(tableRight, rowTop, tableRight, rowBottom)
      ;[col2X, col3X, col4X].forEach((x) => pdf.line(x, rowTop, x, rowBottom))
      pdf.setDrawColor(100)
    }

    // Products table header
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.setFillColor(220, 220, 220)
    pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F')
    pdf.text('Prodotto', margin + 3, yPosition)
    pdf.text('Quantità', margin + 70, yPosition)
    pdf.text('Unità', margin + 105, yPosition)
    pdf.text('Peso Eff.', margin + 155, yPosition)
    drawRowLines(yPosition, true, 8)
    yPosition += 10

    // Products list
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(12)
    let productYPosition = yPosition
    const maxProductWidth = col2X - margin - 5

    order.dettagli_ordine.forEach((item) => {
      const productName = (item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto').toUpperCase()
      const quantity = item.quantita
      const tipologia = item.tipologia || 'N/A'

      const lines = pdf.splitTextToSize(productName, maxProductWidth)
      const extraLines = lines.length - 1
      const currentRowH = 8 + extraLines * lineSpacing

      if (productYPosition - 6 + currentRowH > pageHeight - 35) {
        pdf.addPage()
        productYPosition = margin + 10
      }

      lines.forEach((line, i) => {
        pdf.text(line, margin + 3, productYPosition + i * lineSpacing)
      })
      const midY = productYPosition + (extraLines * lineSpacing) / 2
      pdf.text(quantity.toString(), margin + 80, midY, { align: 'right' })
      pdf.text(tipologia, margin + 105, midY)
      drawRowLines(productYPosition, false, currentRowH)
      productYPosition += currentRowH
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

      // Client name header (font auto-ridotto se il nome è troppo lungo)
      pdf.setFont(undefined, 'bold')
      const clientName = (order.profili?.nome || 'Cliente').toUpperCase()
      let nameFontSize = 26
      pdf.setFontSize(nameFontSize)
      while (pdf.getTextWidth(clientName) > contentWidth && nameFontSize > 10) {
        nameFontSize -= 1
        pdf.setFontSize(nameFontSize)
      }
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

      // Column separator x positions
      const col2X = margin + 67
      const col3X = margin + 102
      const col4X = margin + 152
      const tableRight = margin + contentWidth
      const lineSpacing = 5

      const drawRowLines = (y, drawTopBorder = false, rowH = 8) => {
        const rowTop = y - 6
        const rowBottom = rowTop + rowH
        pdf.setDrawColor(150)
        pdf.setLineWidth(0.3)
        if (drawTopBorder) pdf.line(margin, rowTop, tableRight, rowTop)
        pdf.line(margin, rowBottom, tableRight, rowBottom)
        pdf.line(margin, rowTop, margin, rowBottom)
        pdf.line(tableRight, rowTop, tableRight, rowBottom)
        ;[col2X, col3X, col4X].forEach((x) => pdf.line(x, rowTop, x, rowBottom))
        pdf.setDrawColor(100)
      }

      // Products table header
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.setFillColor(220, 220, 220)
      pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F')
      pdf.text('Prodotto', margin + 3, yPosition)
      pdf.text('Quantità', margin + 70, yPosition)
      pdf.text('Unità', margin + 105, yPosition)
      pdf.text('Peso Eff.', margin + 155, yPosition)
      drawRowLines(yPosition, true, 8)
      yPosition += 10

      // Products list
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(12)
      const maxProductWidth = col2X - margin - 5

      ;(order.dettagli_ordine || []).forEach((item) => {
        const productName = (item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto').toUpperCase()
        const quantity = item.quantita
        const tipologia = item.tipologia || 'N/A'

        const lines = pdf.splitTextToSize(productName, maxProductWidth)
        const extraLines = lines.length - 1
        const currentRowH = 8 + extraLines * lineSpacing

        if (yPosition - 6 + currentRowH > pageHeight - 35) {
          pdf.addPage()
          yPosition = margin + 10
        }

        lines.forEach((line, i) => {
          pdf.text(line, margin + 3, yPosition + i * lineSpacing)
        })
        const midY = yPosition + (extraLines * lineSpacing) / 2
        pdf.text(quantity.toString(), margin + 80, midY, { align: 'right' })
        pdf.text(tipologia, margin + 105, midY)
        drawRowLines(yPosition, false, currentRowH)
        yPosition += currentRowH
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

    // Column separator x positions
    const col2X = margin + 112
    const col3X = margin + 147
    const tableRight = margin + contentWidth
    const lineSpacing = 5

    const drawRowLines = (y, drawTopBorder = false, rowH = 8) => {
      const rowTop = y - 6
      const rowBottom = rowTop + rowH
      pdf.setDrawColor(150)
      pdf.setLineWidth(0.3)
      if (drawTopBorder) pdf.line(margin, rowTop, tableRight, rowTop)
      pdf.line(margin, rowBottom, tableRight, rowBottom)
      pdf.line(margin, rowTop, margin, rowBottom)
      pdf.line(tableRight, rowTop, tableRight, rowBottom)
      ;[col2X, col3X].forEach((x) => pdf.line(x, rowTop, x, rowBottom))
      pdf.setDrawColor(100)
    }

    // Table header
    pdf.setFontSize(12)
    pdf.setFont(undefined, 'bold')
    pdf.setFillColor(220, 220, 220)
    pdf.rect(margin, yPosition - 6, contentWidth, 8, 'F')
    pdf.text('Prodotto', margin + 3, yPosition)
    pdf.text('Totale', margin + 115, yPosition)
    pdf.text('Unità', margin + 150, yPosition)
    drawRowLines(yPosition, true, 8)
    yPosition += 10

    // Rows
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(12)
    const maxProductWidth = col2X - margin - 5

    items.forEach((item) => {
      const lines = pdf.splitTextToSize(item.nome, maxProductWidth)
      const extraLines = lines.length - 1
      const currentRowH = 8 + extraLines * lineSpacing

      if (yPosition - 6 + currentRowH > pageHeight - 35) {
        pdf.addPage()
        yPosition = margin + 10
      }

      lines.forEach((line, i) => {
        pdf.text(line, margin + 3, yPosition + i * lineSpacing)
      })
      const midY = yPosition + (extraLines * lineSpacing) / 2
      pdf.text(item.totale.toString(), margin + 125, midY, { align: 'right' })
      pdf.text(item.tipologia, margin + 150, midY)
      drawRowLines(yPosition, false, currentRowH)
      yPosition += currentRowH
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
