import { supabase } from './supabaseClient'

/**
 * Upload order PDF to Supabase Storage
 * @param {string} clienteId - Client ID
 * @param {string} ordineId - Order ID
 * @param {Blob} pdfBlob - PDF blob to upload
 * @returns {Promise<Object>} Upload result {success, url, error}
 */
export async function uploadOrderPDF(clienteId, ordineId, pdfBlob) {
  try {
    if (!clienteId || !ordineId || !pdfBlob) {
      throw new Error('Missing required parameters')
    }

    // Create bucket if it doesn't exist (optional - usually done via dashboard)
    // Path: ordini/cliente_id/ordine_id.pdf
    const filePath = `ordini/${clienteId}/${ordineId}.pdf`

    // Upload file
    const { data, error } = await supabase.storage
      .from('ordini')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      })

    if (error) {
      console.error('Error uploading PDF to Storage:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('ordini').getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      filePath,
    }
  } catch (error) {
    console.error('Error in uploadOrderPDF:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get public URL for order PDF from Supabase Storage
 * @param {string} clienteId - Client ID
 * @param {string} ordineId - Order ID
 * @returns {Object} {url, exists}
 */
export async function getOrderPDFUrl(clienteId, ordineId) {
  try {
    const filePath = `ordini/${clienteId}/${ordineId}.pdf`

    // Try to get file metadata to check if it exists
    const { data, error } = await supabase.storage
      .from('ordini')
      .list(`ordini/${clienteId}`, {
        limit: 100,
        offset: 0,
      })

    if (error) {
      console.warn('Error checking PDF existence:', error)
      return { exists: false, url: null }
    }

    // Check if file exists in list
    const fileExists = data && data.some((file) => file.name === `${ordineId}.pdf`)

    if (fileExists) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('ordini').getPublicUrl(filePath)

      return { exists: true, url: publicUrl }
    }

    return { exists: false, url: null }
  } catch (error) {
    console.error('Error in getOrderPDFUrl:', error)
    return { exists: false, url: null, error: error.message }
  }
}

/**
 * Download PDF from URL to user's device
 * @param {string} url - URL of the PDF
 * @param {string} fileName - Name for the downloaded file
 */
export async function downloadOrderPDF(url, fileName = 'ricevuta.pdf') {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw error
  }
}

/**
 * Delete order PDF from Supabase Storage
 * @param {string} clienteId - Client ID
 * @param {string} ordineId - Order ID
 * @returns {Promise<Object>} Delete result {success, error}
 */
export async function deleteOrderPDF(clienteId, ordineId) {
  try {
    const filePath = `ordini/${clienteId}/${ordineId}.pdf`

    const { error } = await supabase.storage.from('ordini').remove([filePath])

    if (error) {
      console.error('Error deleting PDF:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteOrderPDF:', error)
    return { success: false, error: error.message }
  }
}
