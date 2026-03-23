// js/url-reader.js — extrae texto de una URL via proxy Cloudflare Worker

export async function extractTextFromURL(url) {
  // Validar URL
  try { new URL(url) } catch { throw new Error('URL no válida') }

  const response = await fetch('https://api.leyfacil.pro/fetch-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })

  if (!response.ok) throw new Error('No se pudo acceder a la URL')

  const { text } = await response.json()
  return text.slice(0, 15000)
}
