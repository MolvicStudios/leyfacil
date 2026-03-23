// js/pdf-reader.js — extrae texto de PDFs en el navegador con PDF.js
// PDF.js se carga via CDN en index.html

export async function extractTextFromPDF(file) {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js no está cargado. Recarga la página.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const typedArray = new Uint8Array(arrayBuffer)

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  // Limpiar texto: eliminar múltiples espacios y líneas vacías
  return fullText
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 15000)
}
