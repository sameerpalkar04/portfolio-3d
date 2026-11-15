// The résumé (shared by the room's file view and the iMac's Preview window).
// The résumé is the latest PDF in my Google Drive folder, served by /api/resume (api/resume.js).
export const RESUME_URL = '/api/resume', RESUME_VIEW = '/api/resume?view=1', RESUME_DOWNLOAD = '/api/resume?dl=1', RESUME_NAME = 'Sameer-Palkar-Resume.pdf'

// Fetch the PDF once and render its first page with pdf.js (served from /public/pdfjs):
// { canvas, url (image), aspect (height / width), links: [{ href, left, top, width, height } in %] }
let resumeJob = null
export function loadResume() {
  if (resumeJob) return resumeJob
  resumeJob = (async () => {
    // a plain browser import: Vite would otherwise rewrite it and refuse a file from /public
    const pdfjs = await new Function('u', 'return import(u)')('/pdfjs/pdf.min.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
    const res = await fetch(RESUME_URL); if (!res.ok) throw new Error(await res.text())
    const doc = await pdfjs.getDocument({ data: await res.arrayBuffer() }).promise
    const page = await doc.getPage(1)
    const base = page.getViewport({ scale: 1 }), view = page.getViewport({ scale: 2200 / base.width })
    const canvas = document.createElement('canvas'); canvas.width = Math.round(view.width); canvas.height = Math.round(view.height)
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport: view }).promise
    const [x0, y0, x1, y1] = page.view, pw = x1 - x0, ph = y1 - y0
    const links = (await page.getAnnotations()).filter((a) => a.subtype === 'Link' && a.url).map((a) => ({
      href: a.url, left: (a.rect[0] - x0) / pw * 100, top: (y1 - a.rect[3]) / ph * 100, width: (a.rect[2] - a.rect[0]) / pw * 100, height: (a.rect[3] - a.rect[1]) / ph * 100,
    }))
    return { canvas, url: canvas.toDataURL('image/png'), aspect: canvas.height / canvas.width, links }
  })()
  resumeJob.catch(() => { resumeJob = null }) // try again next time
  return resumeJob
}
