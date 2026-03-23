// js/share.js — enlace compartible sin base de datos
// El resultado se codifica en base64 y se pone en el hash de la URL

export function generateShareLink(analysis) {
  const shareData = {
    p: analysis.puntuacion,
    e: analysis.etiqueta,
    r: analysis.resumen,
    c: analysis.clausulas.map(c => ({
      t: c.titulo,
      s: c.semaforo,
      tr: c.traduccion,
      m: c.motivo
    }))
  }

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))))
  const url = `${window.location.origin}/#r=${encoded}`

  navigator.clipboard.writeText(url).then(() => {
    showToast('¡Enlace copiado! Compártelo con quien necesite ver este análisis.')
  }).catch(() => {
    // Fallback: seleccionar texto
    showToast('Copia este enlace: ' + url)
  })

  return url
}

export function loadFromShareLink() {
  const hash = window.location.hash
  if (!hash.startsWith('#r=')) return null

  try {
    const encoded = hash.slice(3)
    const decoded = decodeURIComponent(escape(atob(encoded)))
    const shareData = JSON.parse(decoded)

    return {
      puntuacion: shareData.p,
      etiqueta: shareData.e,
      resumen: shareData.r,
      clausulas: shareData.c.map(c => ({
        titulo: c.t,
        semaforo: c.s,
        traduccion: c.tr,
        motivo: c.m,
        original: ''
      }))
    }
  } catch {
    return null
  }
}

function showToast(msg) {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = msg
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}
