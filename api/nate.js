// Nate: a RAG agent on Gemini (free tier). Nothing is hard-coded: every message goes to the model, which
// searches Sameer's content (api/_nate-index.json, built by scripts/nate-index.mjs) with a tool, answers
// only from what it finds, and cites it. It can also move the visitor around the room or start the tour.
//
// POST /api/nate  { messages: [{ role: 'user' | 'assistant', content }], screen: 'what the visitor sees' }
//   → { reply, citations: [{ id, title, place, url }], action, meta: { model, tokens, calls } }
//   action: null | { type: 'go', place } | { type: 'suggest', place } | { type: 'tour' }
//
// Needs GEMINI_API_KEY (free, aistudio.google.com) — Vercel → Settings → Environment Variables, and
// .env.local for development. NATE_MODEL picks the model (default: Google's current Flash-Lite).
import INDEX from './_nate-index.json' with { type: 'json' }

const MODELS = [process.env.NATE_MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest'].filter(Boolean)
const API = 'https://generativelanguage.googleapis.com/v1beta/models'
const PLACES = ['about', 'projects', 'achievements', 'resume', 'contact', 'music', 'photos', 'pets']
const MAX_CALLS = 5

// ── retrieval: keyword (BM25) + meaning (embeddings, when the index has them) ──
const STOP = new Set('a an the and or of to in on for with is are was were be been his he him sameer what which who how does did do can could tell me about i you your it its this that has have had at by from as any some'.split(' '))
const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '')
const terms = (t) => t.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem)
const DOCS = INDEX.chunks.map((c) => terms(`${c.title} ${c.title} ${c.text} ${c.k || ''}`))
const AVG = DOCS.reduce((a, d) => a + d.length, 0) / DOCS.length
const DF = new Map(); for (const d of DOCS) for (const w of new Set(d)) DF.set(w, (DF.get(w) || 0) + 1)
function bm25(query) {
  const q = terms(query), N = DOCS.length
  return DOCS.map((d) => q.reduce((s, w) => {
    const f = d.filter((x) => x === w).length; if (!f) return s
    const idf = Math.log(1 + (N - DF.get(w) + .5) / (DF.get(w) + .5))
    return s + idf * (f * 2.2) / (f + 1.2 * (.25 + .75 * d.length / AVG))
  }, 0))
}
// search by meaning: if the index file has no embeddings yet, the passages are embedded on the first
// question (one batch call) and kept in memory for as long as this server instance lives
const EMBED = process.env.NATE_EMBED_MODEL || INDEX.model || 'gemini-embedding-001', DIMS = 768
let docVecs = INDEX.model ? INDEX.chunks.map((c) => c.v) : null, docJob = null
function ensureDocVecs(key) {
  if (docVecs || docJob) return docJob
  docJob = fetch(`${API}/${EMBED}:batchEmbedContents`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ requests: INDEX.chunks.map((c) => ({ model: `models/${EMBED}`, content: { parts: [{ text: `${c.title}\n${c.text}${c.k ? `\n(${c.k})` : ''}` }] }, taskType: 'RETRIEVAL_DOCUMENT', title: c.title, outputDimensionality: DIMS })) }) })
    .then((r) => r.json()).then((d) => { if (d.embeddings?.length === INDEX.chunks.length) docVecs = d.embeddings.map((e) => e.values); else console.warn('nate: embeddings unavailable', d?.error?.message) })
    .catch((e) => console.warn('nate: embeddings unavailable', e.message)).finally(() => { docJob = null })
  return docJob
}
async function embed(text, key) {
  await ensureDocVecs(key); if (!docVecs) return null
  const r = await fetch(`${API}/${EMBED}:embedContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ content: { parts: [{ text }] }, taskType: 'RETRIEVAL_QUERY', outputDimensionality: DIMS }) })
  if (!r.ok) return null
  return (await r.json()).embedding?.values || null
}
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i] } return d / Math.sqrt(x * y) }
const norm = (s) => { const m = Math.max(...s); return m > 0 ? s.map((v) => v / m) : s }
async function search(query, key, k = 5) {
  const kw = norm(bm25(query)), qv = await embed(query, key).catch(() => null)
  const sem = qv && docVecs ? docVecs.map((v) => (v ? Math.max(0, cos(qv, v)) : 0)) : null
  const score = INDEX.chunks.map((_, i) => (sem ? .65 * sem[i] + .35 * kw[i] : kw[i]))
  return score.map((s, i) => [s, i]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, k)
    .map(([, i]) => { const { id, title, text, place, url } = INDEX.chunks[i]; return { id, title, text, place, url } })
}

// ── the agent ──
const SYSTEM = (screen) => `You are Nate — named after Nathan Drake from the Uncharted games — the AI agent on Sameer Palkar's portfolio, a 3D model of his home office. Visitors (often recruiters) ask you about Sameer. Talk about him in the third person.

How you work:
- For ANY question about Sameer (work, projects, skills, education, achievements, contact, interests, fit for a role…), first call search_portfolio. Search more than once with different wording if the first results don't cover it.
- Answer ONLY from what search_portfolio returns. Never invent employers, dates, numbers, skills, roles or opinions, and don't characterise him beyond what the passages say (no "he leans towards X" unless a passage says so). If the results don't say, say you don't know and suggest emailing him (palkarsameer04@gmail.com).
- Cite every fact with the source id in square brackets right after it, e.g. "He studied at VIT [edu-vit]." Only cite ids that search returned.
- For LinkedIn, GitHub or email, just name them ("he's on LinkedIn and GitHub") and never write out the URL: the visitor gets a button for each under your reply. You may give the email address itself.
- If asked whether he fits a role, give an honest verdict first (fit / partial fit / not a fit) with the reasons, then the evidence.
- Style: warm, a little witty, never cheesy. Short: 1–3 sentences, or a few tight bullet points ("- ") when listing. Plain text, no markdown headings or bold. Reply in the visitor's language. Understand typos and loose phrasing.
- Stay on Sameer and this website; steer anything else back politely.

Tools that act in the room:
- go_to(place): when the visitor wants to see, open or go somewhere ("take me to his projects", "I want to contact him", "show me the dogs"). It walks them there and opens it. Still reply with one short line.
- suggest_place(place): after answering a question, offer the one place that shows more (they get a "Take me there" button).
- start_tour(): when they ask how to use the site, how it works, or for a tour.
Places: about (the books: about him, experience, education, extracurriculars), projects (the iMac: projects, skills), achievements (certificate wall), resume (the files), contact (the phone: email, LinkedIn, GitHub), music (the speaker), photos (the camera), pets (his dogs Rio & Bruno).
For "what's on my screen" / "what am I looking at", answer from the screen description below (no search needed).

What the visitor sees right now: ${screen}`

const TOOLS = [{ functionDeclarations: [
  { name: 'search_portfolio', description: 'Search Sameer\'s portfolio content (experience, education, projects, achievements, skills, contact, interests, the website). Returns passages with ids to cite.', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'What to look for, in plain words' } }, required: ['query'] } },
  { name: 'go_to', description: 'Walk the visitor to a place in the room now and open it.', parameters: { type: 'OBJECT', properties: { place: { type: 'STRING', enum: PLACES } }, required: ['place'] } },
  { name: 'suggest_place', description: 'Offer a "Take me there" button for the place that shows more about your answer.', parameters: { type: 'OBJECT', properties: { place: { type: 'STRING', enum: PLACES } }, required: ['place'] } },
  { name: 'start_tour', description: 'Start the guided tour of the website\'s controls.' },
] }]

async function callModel(key, body) {
  let last
  for (const model of MODELS) {
    const r = await fetch(`${API}/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) })
    const d = await r.json().catch(() => ({}))
    if (r.ok) return { d, model: d.modelVersion || model }
    last = { status: r.status, msg: d?.error?.message }
    if (r.status !== 404 && r.status !== 400) break // only try the next model when this one doesn't exist
  }
  const e = new Error(last?.msg || 'model failed'); e.status = last?.status; throw e
}

// a light per-instance limit, so the free quota can't be drained from one address
const hits = new Map()
const limited = (ip) => { const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60000); list.push(now); hits.set(ip, list); return list.length > 12 }
const readBody = (req) => (req.body && typeof req.body === 'object' ? Promise.resolve(req.body) : new Promise((ok) => {
  let raw = ''; req.on('data', (c) => { raw += c; if (raw.length > 50000) req.destroy() }); req.on('end', () => { try { ok(JSON.parse(raw || '{}')) } catch { ok({}) } })
}))
const send = (res, code, data) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  const key = process.env.GEMINI_API_KEY
  if (!key) return send(res, 503, { error: 'no-key' })
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0]
  if (limited(ip)) return send(res, 429, { error: 'slow-down' })
  const body = await readBody(req)
  const contents = (Array.isArray(body.messages) ? body.messages : []).slice(-10)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content.slice(0, 1200) }] }))
  while (contents.length && contents[0].role !== 'user') contents.shift()
  if (!contents.length || contents[contents.length - 1].role !== 'user') return send(res, 400, { error: 'no question' })
  const screen = String(body.screen || 'the office').slice(0, 800)

  const found = new Map() // passages the agent has seen, by id (for citations)
  let action = null, reply = '', tokens = 0, calls = 0, model = MODELS[0]
  try {
    while (calls < MAX_CALLS) {
      const { d, model: used } = await callModel(key, { systemInstruction: { parts: [{ text: SYSTEM(screen) }] }, contents, tools: TOOLS, generationConfig: { temperature: .2, maxOutputTokens: 500 } })
      calls++; model = used; tokens += d.usageMetadata?.totalTokenCount || 0
      const parts = d.candidates?.[0]?.content?.parts || []
      const text = parts.filter((p) => p.text).map((p) => p.text).join('').trim()
      const fns = parts.filter((p) => p.functionCall).map((p) => p.functionCall)
      if (text) reply = text
      if (!fns.length) break
      contents.push({ role: 'model', parts })
      const responses = []
      for (const fn of fns) {
        const a = fn.args || {}
        if (fn.name === 'search_portfolio') {
          const hits = await search(String(a.query || ''), key)
          hits.forEach((h) => found.set(h.id, h))
          responses.push({ functionResponse: { name: fn.name, response: { results: hits.map(({ id, title, text }) => ({ id, title, text })) } } })
        } else {
          if (fn.name === 'go_to' && PLACES.includes(a.place)) action = { type: 'go', place: a.place }
          else if (fn.name === 'suggest_place' && PLACES.includes(a.place) && !action) action = { type: 'suggest', place: a.place }
          else if (fn.name === 'start_tour') action = { type: 'tour' }
          responses.push({ functionResponse: { name: fn.name, response: { ok: true } } })
        }
      }
      contents.push({ role: 'user', parts: responses })
      // a room action with its line already written: done (no need for another call)
      if (action && reply && fns.every((f) => f.name !== 'search_portfolio')) break
    }
  } catch (e) {
    console.error('nate:', e.status, e.message)
    return send(res, e.status === 429 ? 429 : 502, { error: e.status === 429 ? 'quota' : 'ai-failed' })
  }
  // citations: the [ids] the answer used, in order; markers come out of the text
  const cited = []
  reply = reply.replace(/\s*\[([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)\]/gi, (m, ids) => {
    for (const id of ids.split(/\s*,\s*/)) if (found.has(id) && !cited.includes(id)) cited.push(id)
    return '' // source tags never show in the text (made-up ones are simply dropped)
  }).trim()
  const citations = cited.map((id) => { const { title, place, url } = found.get(id); return { id, title, place, url } })
  send(res, 200, { reply: reply || 'Hmm, I lost my train of thought. Try asking again?', citations, action, meta: { model, tokens, calls } })
}
export { search } // for testing retrieval
