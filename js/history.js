// js/history.js — últimos 10 análisis en localStorage
const KEY = 'leyfacil_history'
const MAX = 10

export function saveToHistory(analysis, textoOriginal, tipodoc) {
  const history = getHistory()
  const entry = {
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    tipodoc,
    puntuacion: analysis.puntuacion,
    etiqueta: analysis.etiqueta,
    resumen_0: analysis.resumen[0],
    clausulas_count: analysis.clausulas.length,
    rojas: analysis.clausulas.filter(c => c.semaforo === 'rojo').length,
    analysis: analysis
  }

  history.unshift(entry)
  if (history.length > MAX) history.splice(MAX)
  localStorage.setItem(KEY, JSON.stringify(history))
  return entry
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function deleteFromHistory(id) {
  const history = getHistory().filter(e => e.id !== id)
  localStorage.setItem(KEY, JSON.stringify(history))
}

export function clearHistory() {
  localStorage.removeItem(KEY)
}
