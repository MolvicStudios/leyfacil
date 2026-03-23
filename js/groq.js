// js/groq.js — llama al Worker proxy, nunca directamente a Groq
const WORKER_URL = 'https://api.leyfacil.pro'

export async function callGroq(messages, systemPrompt) {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      system: systemPrompt
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error API: ${response.status} — ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
