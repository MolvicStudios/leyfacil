// js/export.js — genera PDF del resultado con jsPDF
// jsPDF se carga via CDN en index.html

export function exportToPDF(analysis, textoOriginal) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210, margin = 20, contentW = W - margin * 2
  let y = 20

  // Header
  doc.setFillColor(30, 58, 95)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('LeyFácil.pro — Análisis de documento legal', margin, 12)

  y = 28

  // Puntuación
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Puntuación: ${analysis.puntuacion}/100 — ${analysis.etiqueta}`, margin, y)
  y += 10

  // Fecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} · leyfacil.pro`, margin, y)
  y += 10

  // Línea separadora
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, W - margin, y)
  y += 8

  // Resumen
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen ejecutivo:', margin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  analysis.resumen.forEach((punto, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${punto}`, contentW)
    if (y + lines.length * 6 > 280) { doc.addPage(); y = 20 }
    doc.text(lines, margin, y)
    y += lines.length * 6
  })
  y += 5

  // Cláusulas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Análisis por cláusula:', margin, y)
  y += 8

  const semaforoColors = {
    verde:    [22, 163, 74],
    amarillo: [217, 119, 6],
    rojo:     [220, 38, 38]
  }

  analysis.clausulas.forEach(clausula => {
    if (y > 270) { doc.addPage(); y = 20 }

    const color = semaforoColors[clausula.semaforo] || semaforoColors.verde

    // Punto de color
    doc.setFillColor(...color)
    doc.circle(margin + 2, y - 1, 2, 'F')

    // Título cláusula
    doc.setTextColor(...color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(clausula.titulo, margin + 6, y)
    y += 6

    // Traducción
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const tradLines = doc.splitTextToSize(clausula.traduccion, contentW - 6)
    if (y + tradLines.length * 5 > 280) { doc.addPage(); y = 20 }
    doc.text(tradLines, margin + 6, y)
    y += tradLines.length * 5 + 2

    // Motivo
    doc.setTextColor(100, 116, 139)
    const motivoLines = doc.splitTextToSize(clausula.motivo, contentW - 6)
    if (y + motivoLines.length * 5 > 280) { doc.addPage(); y = 20 }
    doc.text(motivoLines, margin + 6, y)
    y += motivoLines.length * 5 + 4
  })

  // Footer
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, 285, W - margin, 285)
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.text('LeyFácil.pro — Herramienta de asistencia. No sustituye al asesoramiento de un abogado.', margin, 290)

  doc.save(`leyfacil-analisis-${Date.now()}.pdf`)
}
