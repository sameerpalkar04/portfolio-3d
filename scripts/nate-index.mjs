// Builds Nate's knowledge index (api/_nate-index.json): Sameer's content, split into small passages, each
// with where it comes from — a place in the room, and a link where there is one — so Nate can cite it.
// Projects, achievements and skills are read from the site's own files; the book's pages (about,
// experience, education, extracurriculars) are written out below — edit them here when the book changes.
// With GEMINI_API_KEY set (in .env.local or the shell) every passage also gets an embedding, for
// search by meaning; without one Nate searches by keywords only.
// Run after changing any of the content:  npm run nate:index
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { CASE } from '../src/projects/caseStudies.js'
import { ACHIEVEMENTS } from '../src/achievements.js'
import { SKILL_GROUPS } from '../src/skillIcons.js'

const root = new URL('..', import.meta.url)
const LINKEDIN = 'https://www.linkedin.com/in/sameer-palkar-9707b9286/', GITHUB = 'https://github.com/sameerpalkar04'
const chunks = []
const add = (id, title, text, place, url) => chunks.push({ id, title, text: text.replace(/\s+/g, ' ').trim(), place, ...(url ? { url } : {}) })
// extra search words for a passage (how people ask about it), used by keyword search and embeddings only
const TAGS = {
  about: 'who is he introduction summary bio background profile languages location based city',
  'job-oracle': 'job work works working employer company career current role position experience professional industry',
  'edu-vit': 'education studied study studies university college degree graduation graduate academics grades gpa cgpa marks major',
  'edu-amity': 'education school schooling studied study academics childhood',
  'xc-iste': 'leadership leader lead team management extracurricular club society volunteering events outreach marketing publicity',
  'xc-riviera': 'leadership leader lead team design graphic designer extracurricular festival organiser events creative',
  'xc-gravitas': 'design graphic designer extracurricular festival events creative',
  contact: 'reach email hire hiring connect linkedin github social get in touch message',
  personal: 'hobbies hobby fun interests free time dogs pets photography music travel personality',
  site: 'how to use navigate controls help website tour move walk',
  resume: 'resume cv pdf download',
}
const tagFor = (id) => TAGS[id] || (id.startsWith('award-') ? 'competition competitions contest hackathon prize won winner award achievement' : id.startsWith('skills-') ? 'tech stack technologies tools skills programming expertise know' : id.startsWith('proj-') ? 'project projects built build made work portfolio' : '')

// ── the book ──
add('about', 'About Sameer', `Sameer Palkar is a software engineer based between Bengaluru and Gurugram, India. In his words: "I'm a software engineer working across backend development, full-stack technologies, and artificial intelligence. I build scalable applications, solve complex problems, and explore new technologies to develop efficient and practical solutions for real-world challenges." Spoken languages: English (professional), Hindi (native), Marathi (native).`, 'about')
add('job-oracle', 'Work experience: Oracle Financial Services Software', 'Application Software Engineer 1 at Oracle Financial Services Software Ltd., from August 2026 to the present. This is his current job.', 'about', LINKEDIN)
add('edu-vit', 'Education: VIT Vellore', 'Bachelor of Technology in Computer Science & Engineering at Vellore Institute of Technology (VIT), Vellore, September 2022 to August 2026, CGPA 9.27. Graduated at VIT\'s 41st Annual Convocation in August 2026. Relevant coursework: Database Management Systems, Operating Systems, Computer Networks, Data Structures & Algorithms, Web Programming, Artificial Intelligence & Machine Learning.', 'about')
add('edu-amity', 'Education: Amity International School', 'Secondary and senior secondary education at Amity International School, Sector 46, Gurugram, March 2011 to August 2022. Selected among the top 300 teams across India in the Atal Tinkering Lab (ATL) Marathon 2020.', 'about')
add('xc-iste', 'Extracurricular: ISTE, VIT chapter', 'Indian Society for Technical Education (ISTE), VIT Vellore chapter. Publicity Head, April 2024 to March 2025: directed publicity campaigns across platforms, driving 5,000+ student engagements; led outreach for the Technica hackathon, coordinating a 40+ member team for an event with 2,100+ participants. Core Committee Member, February 2023 to April 2024: design and publicity, campaign visuals, and planning, executing and marketing chapter events.', 'about')
add('xc-riviera', 'Extracurricular: Riviera (VIT\'s festival)', 'Riviera is VIT Vellore\'s annual international sports and cultural festival, with 40,000+ footfall. Riviera 2026: Organizer, Design & Print — led the digital design team; oversaw visual content strategy, promotions and multimedia coordination. Riviera 2025: Manager, Design & Media — designed social media posts, brochures and promotional material; kept communication smooth between the design, media and organising teams. Riviera 2024: Volunteer, Design & Media — designed social posts and creatives for Aikya, the cultural parade.', 'about')
add('xc-gravitas', 'Extracurricular: graVITas 2024', 'graVITas is VIT Vellore\'s annual techno-management fest. graVITas 2024 (August to September 2024): Coordinator, Design & Print — designed the social media posts that publicised the fest and helped keep the design team running smoothly.', 'about')

// ── projects: an overview each, then one passage per section of the write-up ──
const MD = { 'geospatial-segmentation': 'geospatial-segmentation', scriptsync: 'scriptsync', mindgarden: 'mindgarden', afterword: 'afterword' }
const REPO = { 'geospatial-segmentation': 'https://github.com/sameerpalkar04/Geospatial-Image-Segmentation', scriptsync: 'https://github.com/sameerpalkar04/scriptsync', mindgarden: 'https://github.com/sameerpalkar04/mindgarden-personal-knowledge-graph', afterword: 'https://github.com/sameerpalkar04/recap-website' }
const stripMd = (t) => t.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').replace(/[*_`#>|]/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
for (const [id, c] of Object.entries(CASE)) {
  const goals = (c.objectives || []).map(([t, q]) => `${t}: ${q}`).join(' ')
  const feats = (c.features || []).map((f) => `${f.name}: ${f.why} ${f.decisions.join(' ')} Trade-off: ${f.tradeoff}`).join(' ')
  add(`proj-${id}`, `Project: ${c.name}`, `${c.name} (${c.category}${c.status ? ', ' + c.status : ''}). ${c.tagline} ${(c.stats || []).map(([n, l]) => `${n} ${l}`).join(', ')}. Goals: ${goals}`, 'projects', REPO[id])
  if (feats) add(`proj-${id}-how`, `${c.name}: how it works`, feats, 'projects', REPO[id])
  const md = existsSync(new URL(`src/projects/${MD[id]}.md`, root)) ? readFileSync(new URL(`src/projects/${MD[id]}.md`, root), 'utf8') : ''
  md.split(/\n(?=## )/).slice(1).forEach((sec, i) => {
    const head = sec.match(/^## (.+)/)?.[1]?.trim() || `part ${i + 1}`
    if (/running|layout|environment|requirements|deployment|containers|options|presets/i.test(head)) return // setup details, not about Sameer
    const body = stripMd(sec.replace(/^## .+\n/, '')).slice(0, 1400)
    if (body.trim().length > 60) add(`proj-${id}-${i}`, `${c.name}: ${head}`, body, 'projects', REPO[id])
  })
}
add('proj-ieee', 'Publication: IEEE Xplore paper', 'His geospatial segmentation research (land cover change detection using DeepLabv3 with a ResNet-50 backbone) is published on IEEE Xplore.', 'projects', 'https://ieeexplore.ieee.org/document/11455786')

// ── achievements ──
for (const a of ACHIEVEMENTS) add(`award-${a.id}`, `Achievement: ${a.place}, ${a.title}`, `${a.place} at ${a.title} (${a.event}, ${a.date}). ${a.summary} ${a.points.join(' ')}`, 'achievements', a.project)

// ── skills ──
for (const [g, list] of SKILL_GROUPS) add(`skills-${g.toLowerCase().replace(/[^a-z]+/g, '-')}`, `Skills: ${g}`, `${g}: ${list.join(', ')}.`, 'projects')

// ── contact, personal, the site ──
add('contact', 'Contacting Sameer', `The best way to reach Sameer is by email: palkarsameer04@gmail.com. LinkedIn: ${LINKEDIN}. GitHub: ${GITHUB} (username sameerpalkar04). The phone in the room has all three.`, 'contact', 'mailto:palkarsameer04@gmail.com')
add('resume', 'Résumé', 'His latest résumé is in the files on the shelf; it can be opened in a new tab or downloaded as a PDF.', 'resume', '/api/resume')
add('personal', 'Outside work', 'He has two dogs, Rio and Bruno (visitors can pet them in the room). He is into photography and travel — his photos are on the camera on the desk, e.g. a hot air balloon over the hills and last light on snow peaks — and music: his songs on repeat are on the speaker, which has a disco mode.', 'pets')
add('site', 'This website', 'The site is a 3D model of Sameer\'s home office. Places: the books (about, experience, education, extracurriculars), the computer (an iMac with his projects, certifications and skills), the certificate wall (achievements), the files (résumé), the phone (contact), the speaker (song picks), the camera (photos) and Rio & Bruno (his dogs). On phones you move with a joystick or with buttons (Work = main places, Life = camera, speaker and dogs, Settings = time of day and controls, Help). On laptops: arrow keys or WASD to walk, drag to look, and a bottom bar with shortcuts. Nate, the assistant, can answer questions, take you to places and give a guided tour.', null)

// ── embeddings (optional) ──
const envFile = new URL('.env.local', root)
const env = existsSync(envFile) ? Object.fromEntries(readFileSync(envFile, 'utf8').split('\n').map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^['"]|['"]$/g, '')])) : {}
const KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY
const EMBED = process.env.NATE_EMBED_MODEL || env.NATE_EMBED_MODEL || 'gemini-embedding-001'
let embedded = false
if (KEY) try {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBED}:batchEmbedContents`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ requests: chunks.map((c) => ({ model: `models/${EMBED}`, content: { parts: [{ text: `${c.title}\n${c.text}${c.k ? `\n(${c.k})` : ''}` }] }, taskType: 'RETRIEVAL_DOCUMENT', title: c.title, outputDimensionality: 768 })) }),
  })
  const d = await r.json()
  if (r.ok && d.embeddings?.length === chunks.length) { d.embeddings.forEach((e, i) => { chunks[i].v = e.values.map((x) => +x.toFixed(5)) }); embedded = true }
  else console.warn('embeddings skipped:', r.status, d?.error?.message)
} catch (e) { console.warn('embeddings skipped (no network?):', e.message, '— Nate will embed the passages himself on his first question') }
for (const c of chunks) { const t = tagFor(c.id); if (t) c.k = t }
writeFileSync(new URL('api/_nate-index.json', root), JSON.stringify({ model: embedded ? EMBED : null, dims: embedded ? 768 : 0, chunks }))
console.log(`api/_nate-index.json: ${chunks.length} passages${embedded ? `, embedded with ${EMBED}` : ' (no embeddings in the file — Nate adds them on his first question when GEMINI_API_KEY is set)'}`)
