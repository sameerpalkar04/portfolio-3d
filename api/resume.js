// The résumé, always the latest PDF in the public Google Drive folder below.
// GET /api/resume          → the PDF, shown inline
// GET /api/resume?dl=1     → the same PDF as a download
// GET /api/resume?view=1   → Google Drive's viewer for it (phones without a built-in PDF viewer)
// Replace the file in the folder (or upload a newer PDF) and the site picks it up within ~10 minutes.
const FOLDER_ID = '1sgq8lfSGFAmdZKAaU9Vs4himyTGpabjX'
const FILE_NAME = 'Sameer-Palkar-Resume.pdf'

const MONTHS = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ')
// Drive shows "10:42 AM" for today, "Nov 9" for this year, "Nov 9, 2025" (or 11/9/25) otherwise
function modifiedAt(text) {
  const t = text.trim(), now = new Date()
  if (/^\d{1,2}:\d{2}\s*(am|pm)?$/i.test(t)) return now.getTime()
  const m = t.match(/^([a-z]{3})[a-z]*\s+(\d{1,2})(?:,\s*(\d{4}))?$/i)
  if (m) return new Date(Number(m[3] || now.getFullYear()), MONTHS.indexOf(m[1].toLowerCase()), Number(m[2])).getTime()
  const d = Date.parse(t); return Number.isNaN(d) ? 0 : d
}

async function latestPdf() {
  const html = await fetch(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`).then((r) => {
    if (!r.ok) throw new Error(`folder listing: ${r.status}`); return r.text()
  })
  const files = []
  for (const part of html.split('class="flip-entry"').slice(1)) {
    const id = part.match(/id="entry-([\w-]+)"/)?.[1] || part.match(/\/file\/d\/([\w-]+)/)?.[1]
    const title = (part.match(/class="flip-entry-title"[^>]*>([^<]*)</)?.[1] || '').trim()
    const when = part.match(/class="flip-entry-last-modified"[^>]*>(?:<div[^>]*>)?([^<]*)</)?.[1] || ''
    if (id && /\.pdf$/i.test(title)) files.push({ id, title, at: modifiedAt(when) })
  }
  if (!files.length) throw new Error('no PDF in the folder')
  return files.reduce((a, b) => (b.at > a.at ? b : a))
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost')
    const file = await latestPdf()
    if (url.searchParams.has('view')) {
      res.statusCode = 302
      res.setHeader('Location', `https://drive.google.com/file/d/${file.id}/view`)
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600')
      return res.end()
    }
    const pdf = await fetch(`https://drive.google.com/uc?export=download&id=${file.id}`)
    if (!pdf.ok) throw new Error(`download: ${pdf.status}`)
    const body = Buffer.from(await pdf.arrayBuffer())
    // Drive sends PDFs as octet-stream, and an HTML page when something is off: check the bytes
    if (body.subarray(0, 5).toString() !== '%PDF-') throw new Error('download did not return a PDF')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', body.length)
    res.setHeader('Content-Disposition', `${url.searchParams.has('dl') ? 'attachment' : 'inline'}; filename="${FILE_NAME}"`)
    // cache at the edge for 10 minutes, then refresh in the background
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400')
    res.end(body)
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(`Résumé unavailable: ${err.message}`)
  }
}
