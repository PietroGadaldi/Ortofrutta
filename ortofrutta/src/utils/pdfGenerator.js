import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

// Un dettaglio è "fuori catalogo" se non è collegato a un prodotto del catalogo
const isCustomItem = (item) => !item.prodotti?.nome && !!item.nome_custom

// Prodotti fuori catalogo sempre in cima alla tabella del PDF
const sortCustomFirst = (dettagli) =>
  [...(dettagli || [])].sort((a, b) => (isCustomItem(a) ? 0 : 1) - (isCustomItem(b) ? 0 : 1))

// Giallo evidenziatore per le righe dei prodotti fuori catalogo
const HIGHLIGHT_COLOR = [255, 240, 120]

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

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2

    const col2X = margin + 62
    const col3X = margin + 87
    const col4X = margin + 112
    const col5X = margin + 146
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
      ;[col2X, col3X, col4X, col5X].forEach((x) => pdf.line(x, rowTop, x, rowBottom))
      pdf.setDrawColor(100)
    }

    const clientName = (order.profili?.nome || 'Cliente').toUpperCase()
    const provenienza = (order.profili?.provenienza || '').toUpperCase()
    const formattedOrderDate = format(new Date(order.data_ordine), 'EEEE dd/MM/yyyy', { locale: it }).toUpperCase()

    const drawPageHeader = (nameSuffix) => {
      let y = margin
      pdf.setFont(undefined, 'bold')
      const displayName = nameSuffix ? `${clientName} ${nameSuffix}` : clientName
      let nameFontSize = 26
      pdf.setFontSize(nameFontSize)
      while (pdf.getTextWidth(displayName) > contentWidth && nameFontSize > 10) {
        nameFontSize--
        pdf.setFontSize(nameFontSize)
      }
      pdf.text(displayName, pageWidth / 2, y, { align: 'center' })
      y += 14

      pdf.setDrawColor(100)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, pageWidth - margin, y)
      y += 10

      pdf.setFontSize(13)
      pdf.setFont(undefined, 'bold')
      pdf.text('Data ordine:', margin, y)
      pdf.setFont(undefined, 'normal')
      pdf.text(formattedOrderDate, margin + 40, y)
      y += 8

      pdf.setFont(undefined, 'bold')
      pdf.text('Provenienza:', margin, y)
      pdf.setFont(undefined, 'normal')
      if (provenienza) pdf.text(provenienza, margin + 40, y)
      y += 14

      pdf.setDrawColor(100)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, pageWidth - margin, y)
      y += 10

      pdf.setFontSize(12)
      pdf.setFont(undefined, 'bold')
      pdf.setFillColor(220, 220, 220)
      pdf.rect(margin, y - 6, contentWidth, 8, 'F')
      pdf.text('Prodotto', margin + 3, y)
      pdf.text('Quantità', margin + 64, y)
      pdf.text('Unità', margin + 89, y)
      pdf.text('Peso Eff.', margin + 114, y)
      pdf.text('Prezzo', margin + 148, y)
      drawRowLines(y, true, 8)
      y += 10
      return y
    }

    let yPosition = drawPageHeader(null)
    let orderPageCount = 1

    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(12)
    const maxProductWidth = col2X - margin - 5

    sortCustomFirst(order.dettagli_ordine).forEach((item) => {
      const isCustom = isCustomItem(item)
      const productName = (item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto').toUpperCase()
      const quantity = item.quantita
      const tipologia = item.tipologia || 'N/A'

      const lines = pdf.splitTextToSize(productName, maxProductWidth)
      const extraLines = lines.length - 1
      const currentRowH = 8 + extraLines * lineSpacing

      if (yPosition - 6 + currentRowH > pageHeight - 35) {
        pdf.addPage()
        orderPageCount++
        yPosition = drawPageHeader(`(${orderPageCount})`)
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(12)
      }

      if (isCustom) {
        pdf.setFillColor(...HIGHLIGHT_COLOR)
        pdf.rect(margin, yPosition - 6, contentWidth, currentRowH, 'F')
        pdf.setFont(undefined, 'bold')
      }

      lines.forEach((line, i) => {
        pdf.text(line, margin + 3, yPosition + i * lineSpacing)
      })
      const midY = yPosition + (extraLines * lineSpacing) / 2
      pdf.text(quantity.toString(), margin + 84, midY, { align: 'right' })
      pdf.text(tipologia, margin + 89, midY)
      if (isCustom) pdf.setFont(undefined, 'normal')
      drawRowLines(yPosition, false, currentRowH)
      yPosition += currentRowH
    })

    // Se multi-pagina: torna a pagina 1 e aggiungi (1) al nome
    if (orderPageCount > 1) {
      const lastPage = pdf.internal.getNumberOfPages()
      pdf.setPage(1)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pageWidth, margin + 5, 'F')
      pdf.setFont(undefined, 'bold')
      const displayName = `${clientName} (1)`
      let nameFontSize = 26
      pdf.setFontSize(nameFontSize)
      while (pdf.getTextWidth(displayName) > contentWidth && nameFontSize > 10) {
        nameFontSize--
        pdf.setFontSize(nameFontSize)
      }
      pdf.text(displayName, pageWidth / 2, margin, { align: 'center' })
      pdf.setPage(lastPage)
    }

    yPosition += 5
    pdf.setDrawColor(100)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    pdf.setFontSize(9)
    pdf.setFont(undefined, 'italic')
    pdf.setTextColor(120)
    pdf.text('Ricevuta generata automaticamente da OrtoFrutta Brescia', pageWidth / 2, pageHeight - 10, { align: 'center' })
    pdf.setTextColor(0)

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

    const col2X = margin + 62
    const col3X = margin + 87
    const col4X = margin + 112
    const col5X = margin + 146
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
      ;[col2X, col3X, col4X, col5X].forEach((x) => pdf.line(x, rowTop, x, rowBottom))
      pdf.setDrawColor(100)
    }

    ordini.forEach((order, orderIndex) => {
      if (orderIndex > 0) pdf.addPage()

      const orderStartPage = pdf.internal.getNumberOfPages()
      let orderPageCount = 1
      let yPosition = margin

      const clientName = (order.profili?.nome || 'Cliente').toUpperCase()
      const provenienza = (order.profili?.provenienza || '').toUpperCase()
      const formattedOrderDate = format(new Date(order.data_ordine), 'EEEE dd/MM/yyyy', { locale: it }).toUpperCase()

      const drawPageHeader = (nameSuffix) => {
        let y = margin
        pdf.setFont(undefined, 'bold')
        const displayName = nameSuffix ? `${clientName} ${nameSuffix}` : clientName
        let nameFontSize = 26
        pdf.setFontSize(nameFontSize)
        while (pdf.getTextWidth(displayName) > contentWidth && nameFontSize > 10) {
          nameFontSize--
          pdf.setFontSize(nameFontSize)
        }
        pdf.text(displayName, pageWidth / 2, y, { align: 'center' })
        y += 14

        pdf.setDrawColor(100)
        pdf.setLineWidth(0.5)
        pdf.line(margin, y, pageWidth - margin, y)
        y += 10

        pdf.setFontSize(13)
        pdf.setFont(undefined, 'bold')
        pdf.text('Data ordine:', margin, y)
        pdf.setFont(undefined, 'normal')
        pdf.text(formattedOrderDate, margin + 40, y)
        y += 8

        pdf.setFont(undefined, 'bold')
        pdf.text('Provenienza:', margin, y)
        pdf.setFont(undefined, 'normal')
        if (provenienza) pdf.text(provenienza, margin + 40, y)
        y += 14

        pdf.setDrawColor(100)
        pdf.setLineWidth(0.5)
        pdf.line(margin, y, pageWidth - margin, y)
        y += 10

        pdf.setFontSize(12)
        pdf.setFont(undefined, 'bold')
        pdf.setFillColor(220, 220, 220)
        pdf.rect(margin, y - 6, contentWidth, 8, 'F')
        pdf.text('Prodotto', margin + 3, y)
        pdf.text('Quantità', margin + 64, y)
        pdf.text('Unità', margin + 89, y)
        pdf.text('Peso Eff.', margin + 114, y)
        pdf.text('Prezzo', margin + 148, y)
        drawRowLines(y, true, 8)
        y += 10
        return y
      }

      yPosition = drawPageHeader(null)

      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(12)
      const maxProductWidth = col2X - margin - 5

      sortCustomFirst(order.dettagli_ordine).forEach((item) => {
        const isCustom = isCustomItem(item)
        const productName = (item.prodotti?.nome || item.nome_custom || 'Prodotto sconosciuto').toUpperCase()
        const quantity = item.quantita
        const tipologia = item.tipologia || 'N/A'

        const lines = pdf.splitTextToSize(productName, maxProductWidth)
        const extraLines = lines.length - 1
        const currentRowH = 8 + extraLines * lineSpacing

        if (yPosition - 6 + currentRowH > pageHeight - 35) {
          pdf.addPage()
          orderPageCount++
          yPosition = drawPageHeader(`(${orderPageCount})`)
          pdf.setFont(undefined, 'normal')
          pdf.setFontSize(12)
        }

        if (isCustom) {
          pdf.setFillColor(...HIGHLIGHT_COLOR)
          pdf.rect(margin, yPosition - 6, contentWidth, currentRowH, 'F')
          pdf.setFont(undefined, 'bold')
        }

        lines.forEach((line, i) => {
          pdf.text(line, margin + 3, yPosition + i * lineSpacing)
        })
        const midY = yPosition + (extraLines * lineSpacing) / 2
        pdf.text(quantity.toString(), margin + 84, midY, { align: 'right' })
        pdf.text(tipologia, margin + 89, midY)
        if (isCustom) pdf.setFont(undefined, 'normal')
        drawRowLines(yPosition, false, currentRowH)
        yPosition += currentRowH
      })

      // Se multi-pagina: torna alla prima pagina di questo ordine e aggiungi (1)
      if (orderPageCount > 1) {
        const lastPage = pdf.internal.getNumberOfPages()
        pdf.setPage(orderStartPage)
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, pageWidth, margin + 5, 'F')
        pdf.setFont(undefined, 'bold')
        const displayName = `${clientName} (1)`
        let nameFontSize = 26
        pdf.setFontSize(nameFontSize)
        while (pdf.getTextWidth(displayName) > contentWidth && nameFontSize > 10) {
          nameFontSize--
          pdf.setFontSize(nameFontSize)
        }
        pdf.text(displayName, pageWidth / 2, margin, { align: 'center' })
        pdf.setPage(lastPage)
      }

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

      if (item.custom) {
        pdf.setFillColor(...HIGHLIGHT_COLOR)
        pdf.rect(margin, yPosition - 6, contentWidth, currentRowH, 'F')
        pdf.setFont(undefined, 'bold')
      }

      lines.forEach((line, i) => {
        pdf.text(line, margin + 3, yPosition + i * lineSpacing)
      })
      const midY = yPosition + (extraLines * lineSpacing) / 2
      pdf.text(item.totale.toString(), margin + 125, midY, { align: 'right' })
      pdf.text(item.tipologia, margin + 150, midY)
      if (item.custom) pdf.setFont(undefined, 'normal')
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
