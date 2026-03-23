// js/result.js — renderiza el análisis JSON en la UI
import { t } from './i18n.js'

export function renderResult(analysis) {
  const container = document.getElementById('result-panel')

  const scoreConfig = {
    high:   { color: '#16A34A', bg: '#DCFCE7', label: t('score_seguro') },
    medium: { color: '#D97706', bg: '#FEF3C7', label: t('score_precaucion') },
    low:    { color: '#DC2626', bg: '#FEE2E2', label: t('score_alerta') },
    danger: { color: '#991B1B', bg: '#FEE2E2', label: t('score_peligroso') }
  }

  const level = analysis.puntuacion >= 80 ? 'high'
              : analysis.puntuacion >= 50 ? 'medium'
              : analysis.puntuacion >= 20 ? 'low'
              : 'danger'

  const cfg = scoreConfig[level]

  // Sanitizar texto para evitar XSS
  const esc = (str) => {
    const el = document.createElement('span')
    el.textContent = str
    return el.innerHTML
  }

  container.innerHTML = `
    <!-- Puntuación global -->
    <div class="score-block" style="background:${cfg.bg};border-left:4px solid ${cfg.color}">
      <div class="score-number" style="color:${cfg.color}">${Number(analysis.puntuacion)}</div>
      <div class="score-label" style="color:${cfg.color}">${esc(cfg.label)}</div>
      <div class="score-subtitle">${esc(t('score_subtitle'))}</div>
    </div>

    <!-- Resumen ejecutivo -->
    <div class="summary-block">
      <h3 class="result-section-title">${esc(t('summary_title'))}</h3>
      <ul class="summary-list">
        ${analysis.resumen.map(punto => `<li>${esc(punto)}</li>`).join('')}
      </ul>
    </div>

    <!-- Estadísticas semáforo -->
    <div class="semaforo-stats">
      ${renderSemaforoStats(analysis.clausulas)}
    </div>

    <!-- Cláusulas con semáforo -->
    <div class="clausulas-list">
      <h3 class="result-section-title">${esc(t('clausulas_title'))}</h3>
      ${analysis.clausulas.map(c => renderClausula(c, esc)).join('')}
    </div>

    <!-- Acciones -->
    <div class="result-actions">
      <button class="btn-export" onclick="exportToPDF()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
        ${esc(t('export_pdf'))}
      </button>
      <button class="btn-share" onclick="shareResult()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v13"/></svg>
        ${esc(t('share_link'))}
      </button>
    </div>

    <!-- Disclaimer -->
    <div class="result-disclaimer">
      ${esc(t('disclaimer'))}
    </div>
  `
}

function renderSemaforoStats(clausulas) {
  const verde    = clausulas.filter(c => c.semaforo === 'verde').length
  const amarillo = clausulas.filter(c => c.semaforo === 'amarillo').length
  const rojo     = clausulas.filter(c => c.semaforo === 'rojo').length

  return `
    <div class="sem-stat sem-stat--verde">
      <span class="sem-dot" style="background:#16A34A"></span>
      <span>${verde} ${t('sem_normal')}</span>
    </div>
    <div class="sem-stat sem-stat--amarillo">
      <span class="sem-dot" style="background:#D97706"></span>
      <span>${amarillo} ${t('sem_atencion')}</span>
    </div>
    <div class="sem-stat sem-stat--rojo">
      <span class="sem-dot" style="background:#DC2626"></span>
      <span>${rojo} ${t('sem_alerta')}</span>
    </div>
  `
}

function renderClausula(clausula, esc) {
  const colors = {
    verde:    { border: '#16A34A', bg: '#DCFCE7', dot: '#16A34A' },
    amarillo: { border: '#D97706', bg: '#FEF3C7', dot: '#D97706' },
    rojo:     { border: '#DC2626', bg: '#FEE2E2', dot: '#DC2626' }
  }
  const c = colors[clausula.semaforo] || colors.verde

  return `
    <div class="clausula-card" style="border-left:3px solid ${c.border}">
      <div class="clausula-header">
        <span class="clausula-dot" style="background:${c.dot}"></span>
        <span class="clausula-titulo">${esc(clausula.titulo)}</span>
      </div>
      ${clausula.original ? `<div class="clausula-original">${esc(clausula.original)}</div>` : ''}
      <div class="clausula-traduccion" style="background:${c.bg}">
        <strong>En cristiano:</strong> ${esc(clausula.traduccion)}
      </div>
      <div class="clausula-motivo">${esc(clausula.motivo)}</div>
    </div>
  `
}
