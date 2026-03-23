// js/i18n.js — cadenas de texto en español

export const strings = {
  es: {
    app_title:         'LeyFácil.pro',
    app_subtitle:      'Entiende cualquier documento legal en segundos',
    input_paste:       'Pegar texto',
    input_pdf:         'Subir PDF',
    input_url:         'URL de página web',
    input_placeholder: 'Pega aquí tu contrato, términos y condiciones, ley o cualquier texto legal...',
    country_label:     'País / marco legal',
    doctype_label:     'Tipo de documento',
    btn_analyze:       'Analizar documento →',
    analyzing:         'Analizando con IA...',
    score_seguro:      'Seguro',
    score_precaucion:  'Precaución',
    score_alerta:      'Alerta',
    score_peligroso:   'Peligroso',
    score_subtitle:    'sobre 100',
    summary_title:     'Lo más importante',
    clausulas_title:   'Análisis por cláusula',
    sem_normal:        'cláusulas normales',
    sem_atencion:      'requieren atención',
    sem_alerta:        'alertas',
    export_pdf:        'Exportar PDF',
    share_link:        'Compartir enlace',
    history_title:     'Mi historial',
    history_empty:     'Aún no has analizado ningún documento',
    history_clear:     'Borrar historial',
    disclaimer:        'LeyFácil es una herramienta de asistencia. No sustituye al asesoramiento de un abogado colegiado.',
    error_not_legal:   'El texto no parece ser un documento legal. Por favor introduce un contrato, ley o texto jurídico.',
    error_api:         'Error al conectar con la IA. Inténtalo de nuevo en unos segundos.',
    error_pdf:         'No se pudo leer el PDF. Asegúrate de que no está protegido con contraseña.',
    error_url:         'No se pudo acceder a la URL. Prueba a copiar el texto directamente.',
  }
}

export function t(key) {
  const lang = 'es'
  return strings[lang][key] || key
}
