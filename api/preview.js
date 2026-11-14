// A song's 30-second preview, played on the speaker.
// GET /api/preview?id=<Spotify track id>  → the preview MP3 (same origin, so the page can read its levels)
// The preview link is read from Spotify's public embed page for the track.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

async function previewUrl(id) {
  const html = await fetch(`https://open.spotify.com/embed/track/${id}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } }).then((r) => {
    if (!r.ok) throw new Error(`embed page: ${r.status}`); return r.text()
  })
  const m = html.match(/"audioPreview"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/) || html.match(/(https:\/\/p\.scdn\.co\/mp3-preview\/[A-Za-z0-9]+[^"\\]*)/)
  if (!m) throw new Error('no preview for this track')
  return m[1].replace(/\\u002F/g, '/')
}

export default async function handler(req, res) {
  try {
    const id = new URL(req.url, 'http://localhost').searchParams.get('id') || ''
    if (!/^[A-Za-z0-9]{22}$/.test(id)) throw Object.assign(new Error('bad track id'), { status: 400 })
    const mp3 = await fetch(await previewUrl(id), { headers: { 'User-Agent': UA } })
    if (!mp3.ok) throw new Error(`preview: ${mp3.status}`)
    const body = Buffer.from(await mp3.arrayBuffer())
    res.statusCode = 200
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', body.length)
    res.setHeader('Accept-Ranges', 'none')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
    res.end(body)
  } catch (err) {
    res.statusCode = err.status || 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(`Preview unavailable: ${err.message}`)
  }
}
