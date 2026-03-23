// js/analyzer.js — lógica principal de análisis
import { callGroq } from './groq.js'

export function buildSystemPrompt(tipodoc, pais) {
  const marcoLegal = {
    es: `Ley General para la Defensa de los Consumidores y Usuarios (LGDCU),
         Ley de Arrendamientos Urbanos (LAU), Estatuto de los Trabajadores (ET),
         Ley de Crédito Inmobiliario (LCCI), RGPD y normativa española 2025.`,
    mx: `Código Civil Federal, Ley Federal del Trabajo, Ley Federal de Protección al Consumidor (PROFECO), normativa mexicana 2025.`,
    ar: `Código Civil y Comercial de la Nación, Ley de Defensa del Consumidor 24.240, normativa argentina 2025.`,
    co: `Código Civil colombiano, Código Sustantivo del Trabajo, Estatuto del Consumidor (Ley 1480), normativa colombiana 2025.`,
    cl: `Código Civil chileno, Código del Trabajo, Ley del Consumidor (19.496), normativa chilena 2025.`,
    latam: `Principios generales del derecho civil y laboral en Latinoamérica. Marco internacional de protección al consumidor.`
  }

  return `Eres LeyFácil, un experto legal que traduce documentos jurídicos a lenguaje humano claro y comprensible.

MARCO LEGAL APLICABLE: ${marcoLegal[pais] || marcoLegal.latam}
TIPO DE DOCUMENTO: ${tipodoc}

Tu tarea es analizar el documento proporcionado y responder ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "puntuacion": 75,
  "etiqueta": "Precaución",
  "resumen": [
    "Primer punto clave del documento en lenguaje simple",
    "Segundo punto clave",
    "Tercer punto clave"
  ],
  "clausulas": [
    {
      "id": "c1",
      "titulo": "Título corto de la cláusula (máx 6 palabras)",
      "original": "Texto original de la cláusula tal como aparece",
      "traduccion": "Explicación en lenguaje humano simple de qué significa",
      "semaforo": "verde",
      "motivo": "Por qué este color: qué es normal o qué es problemático"
    }
  ]
}

REGLAS PARA LA PUNTUACIÓN (0-100):
- 90-100: Documento completamente estándar y favorable para el usuario
- 70-89: Documento normal con algún punto a revisar → etiqueta "Precaución"  
- 40-69: Documento con varias cláusulas problemáticas → etiqueta "Alerta"
- 0-39: Documento muy abusivo o peligroso → etiqueta "Peligroso"

REGLAS DEL SEMÁFORO:
- "verde": Cláusula estándar, normal en este tipo de contrato, sin riesgo para el usuario
- "amarillo": Cláusula inusual, restrictiva o que el usuario debe leer con atención antes de firmar
- "rojo": Cláusula potencialmente abusiva, contraria a la ley, o muy desfavorable para el usuario

REGLAS GENERALES:
- Divide el documento en todas las cláusulas o secciones identificables
- El campo "traduccion" debe ser comprensible para alguien sin estudios jurídicos
- El campo "motivo" debe explicar claramente por qué esa cláusula es verde/amarilla/roja
- Si el texto no es un documento legal, responde con: {"error": "No es un documento legal"}
- No escribas nada fuera del JSON. Sin markdown, sin explicaciones, sin backticks.`
}

export async function analyzeDocument(text, tipodoc, pais) {
  const systemPrompt = buildSystemPrompt(tipodoc, pais)

  const messages = [
    { role: 'user', content: text }
  ]

  const raw = await callGroq(messages, systemPrompt)

  // Limpiar posibles backticks o texto extra
  const clean = raw.replace(/```json|```/g, '').trim()

  let analysis
  try {
    analysis = JSON.parse(clean)
  } catch {
    // Intentar extraer JSON del texto
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) {
      analysis = JSON.parse(match[0])
    } else {
      throw new Error('La IA no devolvió un análisis válido. Inténtalo de nuevo.')
    }
  }

  // Verificar si es error
  if (analysis.error) {
    throw new Error(analysis.error)
  }

  // Validar estructura mínima
  if (typeof analysis.puntuacion !== 'number' || !Array.isArray(analysis.clausulas)) {
    throw new Error('Respuesta incompleta de la IA. Inténtalo de nuevo.')
  }

  return analysis
}
