// Cloudflare Worker — Groq API Proxy
// Deploy: wrangler deploy
// Secret: wrangler secret put GROQ_API_KEY

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const ALLOWED_ORIGINS = ['https://leyfacil.pro', 'https://www.leyfacil.pro', 'https://leyfacil.pages.dev']

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Solo POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    // Verificar origen
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403 })
    }

    const url = new URL(request.url)

    // Endpoint: /fetch-url — extrae texto de una URL
    if (url.pathname === '/fetch-url') {
      return handleFetchURL(request, corsHeaders)
    }

    // Endpoint principal: análisis con Groq
    try {
      const body = await request.json()
      const { messages, system } = body

      if (!messages || !Array.isArray(messages)) {
        return new Response('Invalid request', { status: 400, headers: corsHeaders })
      }

      const groqResponse = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: system || 'Eres un asistente legal.' },
            ...messages
          ],
          temperature: 0.3,
          max_tokens: 4096,
          stream: false
        })
      })

      if (!groqResponse.ok) {
        const error = await groqResponse.text()
        return new Response(error, { status: groqResponse.status, headers: corsHeaders })
      }

      const data = await groqResponse.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}

async function handleFetchURL(request, corsHeaders) {
  try {
    const { url } = await request.json()

    // Validar URL
    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch {
      return new Response(JSON.stringify({ error: 'URL no válida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Solo permitir HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Protocolo no permitido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const pageResponse = await fetch(parsedUrl.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeyFacilBot/1.0)' }
    })
    const html = await pageResponse.text()

    // Extraer texto limpio del HTML
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim()

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'No se pudo acceder a la URL' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
