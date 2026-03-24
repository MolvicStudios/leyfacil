// js/app.js — entry point, inicialización y router

import { t } from './i18n.js'
import { analyzeDocument } from './analyzer.js'
import { extractTextFromPDF } from './pdf-reader.js'
import { extractTextFromURL } from './url-reader.js'
import { renderResult } from './result.js'
import { exportToPDF } from './export.js'
import { generateShareLink, loadFromShareLink } from './share.js'
import { getHistory, saveToHistory, deleteFromHistory, clearHistory } from './history.js'

export const TIPOS_DOCUMENTO = [
  { id: 'alquiler',    label: 'Contrato de alquiler' },
  { id: 'trabajo',     label: 'Contrato de trabajo' },
  { id: 'tyc',         label: 'Términos y condiciones web' },
  { id: 'mercantil',   label: 'Contrato mercantil' },
  { id: 'hipoteca',    label: 'Documento hipotecario' },
  { id: 'ley',         label: 'Ley o artículo legal' },
  { id: 'otro',        label: 'Otro documento legal' }
]

export const PAISES = [
  { id: 'es',    label: '🇪🇸 España' },
  { id: 'mx',    label: '🇲🇽 México' },
  { id: 'ar',    label: '🇦🇷 Argentina' },
  { id: 'co',    label: '🇨🇴 Colombia' },
  { id: 'cl',    label: '🇨🇱 Chile' },
  { id: 'latam', label: '🌎 LATAM (genérico)' }
]

// Estado de la app
let currentAnalysis = null
let currentText = ''
let inputMode = 'text' // 'text' | 'pdf' | 'url'

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  initSelects()
  initTabs()
  initAnalyzeButton()
  initFileUpload()
  initCharCounter()
  initHistoryPanel()
  checkShareLink()
})

function initSelects() {
  const paisSelect = document.getElementById('select-pais')
  const tipoSelect = document.getElementById('select-tipo')

  PAISES.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = p.label
    paisSelect.appendChild(opt)
  })

  TIPOS_DOCUMENTO.forEach(td => {
    const opt = document.createElement('option')
    opt.value = td.id
    opt.textContent = td.label
    tipoSelect.appendChild(opt)
  })
}

function initTabs() {
  const tabs = document.querySelectorAll('.input-tab')
  const textSection = document.getElementById('input-text-section')
  const pdfSection = document.getElementById('input-pdf-section')
  const urlSection = document.getElementById('input-url-section')

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      inputMode = tab.dataset.mode

      textSection.classList.toggle('active', inputMode === 'text')
      pdfSection.classList.toggle('active', inputMode === 'pdf')
      urlSection.classList.toggle('active', inputMode === 'url')
    })
  })
}

function initAnalyzeButton() {
  const btn = document.getElementById('btn-analyze')
  btn.addEventListener('click', handleAnalyze)
}

function initFileUpload() {
  const fileArea = document.getElementById('file-drop-area')
  const fileInput = document.getElementById('file-input')

  fileArea.addEventListener('click', () => fileInput.click())

  fileArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    fileArea.classList.add('dragover')
  })

  fileArea.addEventListener('dragleave', () => {
    fileArea.classList.remove('dragover')
  })

  fileArea.addEventListener('drop', (e) => {
    e.preventDefault()
    fileArea.classList.remove('dragover')
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files
      showFileName(e.dataTransfer.files[0].name)
    }
  })

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      showFileName(fileInput.files[0].name)
    }
  })
}

function showFileName(name) {
  const display = document.getElementById('file-name-display')
  display.textContent = name
  display.style.display = 'block'
}

function initCharCounter() {
  const textarea = document.getElementById('input-textarea')
  const counter = document.getElementById('char-counter')
  const MAX = 15000

  textarea.addEventListener('input', () => {
    const len = textarea.value.length
    counter.textContent = `${len.toLocaleString()} / ${MAX.toLocaleString()}`
    counter.className = 'char-counter'
    if (len > MAX * 0.9) counter.classList.add('danger')
    else if (len > MAX * 0.7) counter.classList.add('warning')
  })
}

// ===== ANÁLISIS =====
async function handleAnalyze() {
  const btn = document.getElementById('btn-analyze')
  const errorEl = document.getElementById('error-alert')
  const loading = document.getElementById('loading-overlay')
  const resultPanel = document.getElementById('result-panel')
  const placeholder = document.getElementById('result-placeholder')

  errorEl.classList.remove('visible')

  try {
    // Obtener texto según modo
    let text = ''
    if (inputMode === 'text') {
      text = document.getElementById('input-textarea').value.trim()
    } else if (inputMode === 'pdf') {
      const fileInput = document.getElementById('file-input')
      if (!fileInput.files.length) throw new Error(t('error_pdf'))
      text = await extractTextFromPDF(fileInput.files[0])
    } else if (inputMode === 'url') {
      const url = document.getElementById('input-url').value.trim()
      if (!url) throw new Error(t('error_url'))
      text = await extractTextFromURL(url)
    }

    if (!text || text.length < 50) {
      throw new Error('Por favor introduce un texto legal con al menos 50 caracteres.')
    }

    // Truncar a 15000
    currentText = text.slice(0, 15000)

    const tipodoc = document.getElementById('select-tipo').value
    const pais = document.getElementById('select-pais').value

    // UI: loading
    btn.disabled = true
    btn.textContent = t('analyzing')
    if (placeholder) placeholder.style.display = 'none'
    loading.classList.add('active')
    resultPanel.innerHTML = ''

    // Llamar al analyzer
    const analysis = await analyzeDocument(currentText, tipodoc, pais)
    currentAnalysis = analysis

    // Renderizar
    loading.classList.remove('active')
    renderResult(analysis)
    window.molvicTrack && window.molvicTrack('analysis_completed')

    // Guardar en historial
    saveToHistory(analysis, currentText, tipodoc)
    refreshHistoryUI()

  } catch (err) {
    loading.classList.remove('active')
    errorEl.textContent = err.message || t('error_api')
    errorEl.classList.add('visible')
  } finally {
    btn.disabled = false
    btn.textContent = t('btn_analyze')
  }
}

// ===== EXPORTAR & COMPARTIR (globales para onclick) =====
window.exportToPDF = function () {
  if (currentAnalysis) {
    exportToPDF(currentAnalysis, currentText)
  }
}

window.shareResult = function () {
  if (currentAnalysis) {
    generateShareLink(currentAnalysis)
  }
}

// ===== HISTORIAL PANEL =====
function initHistoryPanel() {
  const toggleBtn = document.getElementById('btn-history')
  const wrapper = document.getElementById('history-wrapper')
  const clearBtn = document.getElementById('btn-clear-history')

  toggleBtn.addEventListener('click', () => {
    wrapper.classList.toggle('open')
    refreshHistoryUI()
  })

  clearBtn.addEventListener('click', () => {
    clearHistory()
    refreshHistoryUI()
  })
}

function refreshHistoryUI() {
  const list = document.getElementById('history-list')
  const history = getHistory()

  if (!history.length) {
    list.innerHTML = `<div class="history-empty">${t('history_empty')}</div>`
    return
  }

  list.innerHTML = history.map(entry => {
    const scoreClass = entry.puntuacion >= 80 ? 'high' : entry.puntuacion >= 50 ? 'medium' : 'low'
    const fecha = new Date(entry.fecha).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

    return `
      <div class="history-card" data-id="${entry.id}">
        <div class="history-card-top">
          <span class="history-score ${scoreClass}">${entry.puntuacion}/100</span>
          <span class="history-date">${fecha}</span>
        </div>
        <div class="history-summary">${entry.resumen_0 || ''}</div>
        <div class="history-meta">
          <span>${entry.clausulas_count} cláusulas · ${entry.rojas} alertas</span>
          <button class="history-delete" data-delete="${entry.id}">✕</button>
        </div>
      </div>
    `
  }).join('')

  // Eventos
  list.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.history-delete')) return
      const id = card.dataset.id
      const entry = history.find(h => h.id === id)
      if (entry?.analysis) {
        currentAnalysis = entry.analysis
        renderResult(entry.analysis)
      }
    })
  })

  list.querySelectorAll('.history-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      deleteFromHistory(btn.dataset.delete)
      refreshHistoryUI()
    })
  })
}

// ===== SHARE LINK CHECK =====
function checkShareLink() {
  const shared = loadFromShareLink()
  if (shared) {
    currentAnalysis = shared
    renderResult(shared)
    const placeholder = document.getElementById('result-placeholder')
    if (placeholder) placeholder.style.display = 'none'
  }
}
