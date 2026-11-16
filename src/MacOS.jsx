// The iMac's desktop "OS": three things on the desktop (Projects and Certifications folders, a Skills note),
// a Finder to browse them, Notes for the skills and certifications. Windows drag by their title bar
// (laptop), focus on click and close with the red light. Lives on the 1180-px stage in App's PortfolioSystem.
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SKILL_ICONS, SKILL_GROUPS } from './skillIcons'
import { PROJECTS } from './projects'
import { ProjectVisual } from './projectVisuals'
import { RESUME_DOWNLOAD, RESUME_NAME, loadResume } from './resume'

const touch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
const ico = (d, s = 14, sw = 1.8) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>

// ── icons ──
const FOLDER_TONES = { blue: ['#1a7cf0', '#3d9bff', '#71b6ff'], yellow: ['#d9a800', '#f5c400', '#ffd84a'] }
export function FolderIcon({ tone = 'blue', glyph, size = 64 }) {
  const [b, m, l] = FOLDER_TONES[tone], id = `fg-${tone}`
  return <svg viewBox="0 0 64 52" width={size} height={size * 52 / 64} aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={l}/><stop offset="1" stopColor={m}/></linearGradient></defs>
    <path d="M4 6a4 4 0 0 1 4-4h14l5 5h29a4 4 0 0 1 4 4v6H4z" fill={b}/>
    <rect x="2" y="11" width="60" height="39" rx="5" fill={`url(#${id})`}/>
    <rect x="2" y="11" width="60" height="3" rx="1.5" fill="#fff" opacity=".25"/>
    {glyph && <g transform="translate(20 19) scale(1)" fill="none" stroke={b} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity=".75">{glyph}</g>}
  </svg>
}
// a Markdown document: a white page with a folded corner and an "MD" label
export const MdIcon = ({ size = 64, label = 'MD', tone = '#e2673f' }) => <svg viewBox="0 0 52 64" width={size * 52 / 64} height={size} aria-hidden="true">
  <path d="M6 2h28l14 14v42a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#fff" stroke="#d1d1d6"/>
  <path d="M34 2v10a4 4 0 0 0 4 4h10" fill="#ececf0" stroke="#d1d1d6"/>
  {[26, 32].map((y) => <path key={y} d={`M10 ${y}h30`} stroke="#d1d1d6" strokeWidth="2" strokeLinecap="round"/>)}
  <rect x="8" y="42" width="26" height="13" rx="3" fill={tone}/><text x="21" y="51.6" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff" fontFamily="-apple-system,Helvetica,Arial">{label}</text>
</svg>
// The Projects app icon: a squircle of four tiles in the projects' own colours
export const ProjectsAppIcon = ({ size = 64 }) => <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
  <defs><clipPath id="pai"><rect x="4" y="4" width="56" height="56" rx="14"/></clipPath><linearGradient id="paig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".28"/><stop offset=".5" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
  <g clipPath="url(#pai)">
    <rect x="4" y="4" width="28" height="28" fill="#1f5a46"/><rect x="32" y="4" width="28" height="28" fill="#c8432f"/>
    <rect x="4" y="32" width="28" height="28" fill="#5b4bb7"/><rect x="32" y="32" width="28" height="28" fill="#24283b"/>
    <rect x="15" y="15" width="34" height="34" rx="8" fill="#fffdf7"/>
    <path d="M25 27l-5 5 5 5M39 27l5 5-5 5M34.5 24l-5 16" stroke="#1d1f22" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="4" y="4" width="56" height="56" fill="url(#paig)"/>
  </g>
  <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" fill="none" stroke="rgba(0,0,0,.15)"/>
</svg>
export const NoteIcon = ({ size = 64 }) => <svg viewBox="0 0 52 64" width={size * 52 / 64} height={size} aria-hidden="true">
  <rect x="2" y="2" width="48" height="60" rx="5" fill="#fff" stroke="#d9d9de"/>
  <path d="M2 7a5 5 0 0 1 5-5h38a5 5 0 0 1 5 5v8H2z" fill="#f6c84c"/>
  {[24, 31, 38, 45, 52].map((y, i) => <path key={y} d={`M9 ${y}h${i === 4 ? 20 : 34}`} stroke="#c7c7cc" strokeWidth="2" strokeLinecap="round"/>)}
</svg>
const codeGlyph = <path d="M8 4 2 12l6 8M16 4l6 8-6 8"/>
const trophyGlyph = <><path d="M7 2h10v6a5 5 0 0 1-10 0z"/><path d="M7 4H3v2a4 4 0 0 0 4 4M17 4h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8"/></>
const ImgIcon = ({ size = 16 }) => <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2.5" fill="#e9eef7" stroke="#9aa6b8"/><path d="m4 18 5-6 4 4 3-3 4 5z" fill="#6ca0dc"/><circle cx="16" cy="9" r="2" fill="#f5b83d"/></svg>
const BadgeIcon = ({ size = 16 }) => <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><circle cx="12" cy="10" r="7" fill="#f80000"/><path d="M8 16l-1.5 6L12 20l5.5 2L16 16" fill="#c40000"/><rect x="8" y="8" width="8" height="4" rx="2" fill="none" stroke="#fff" strokeWidth="1.6"/></svg>

// ── content ──
const OCI = {
  title: 'Oracle Cloud Infrastructure 2023 AI Certified Foundations Associate', issuer: 'Oracle University', issued: 'July 29, 2024', id: '100756114OCI23AIFCA',
  tags: ['Machine Learning', 'Transformers', 'RAG', 'Large Language Models'], image: '/certs/oci-ai-foundations.jpg', pdf: '/certs/oci-ai-foundations.pdf',
  link: 'https://catalog-education.oracle.com/ords/certview/sharebadge?id=7824262FBF3F3E095BB71DF852E083CA468D553B477E117F84ECCD06AE90EE76',
}
// the résumé PDF (the same file as in the room's Files), opens in Preview
const RESUME_ITEM = { id: 'resume', name: RESUME_NAME, kind: 'PDF document', date: 'Today, 9:00 AM', size: '120 KB', icon: (s) => <MdIcon size={s} label="PDF" tone="#e5483b"/> }
const DESKTOP = [
  { id: 'projects', name: 'Projects', kind: 'Application', app: 'projects', date: 'Today, 6:00 PM', icon: (s) => <ProjectsAppIcon size={s}/> },
  { id: 'certs', name: 'Certifications', kind: 'Note', date: 'Today, 5:58 PM', icon: (s) => <NoteIcon size={s}/> },
  { id: 'skills', name: 'Skills', kind: 'Note', date: 'Today, 5:55 PM', icon: (s) => <NoteIcon size={s}/> },
  RESUME_ITEM,
]
const PLACES = {
  desktop: { title: 'Desktop', items: DESKTOP },
  documents: { title: 'Documents', items: DESKTOP },
  recents: { title: 'Recents', items: DESKTOP },
  projects: { title: 'Projects', items: PROJECTS.map((p) => ({ id: p.id, name: p.file, kind: 'Markdown document', date: p.date, size: p.size, project: p, icon: (sz) => <MdIcon size={sz}/> })) },
  downloads: { title: 'Downloads', items: [RESUME_ITEM] },
  applications: { title: 'Applications', items: [], apps: true },
}
const SIDEBAR = [['Favorites', [['airdrop', 'AirDrop', ico(<><circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 1 1 7 0M5.6 18.4a9 9 0 1 1 12.8 0"/></>)], ['recents', 'Recents', ico(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>)], ['applications', 'Applications', ico(<path d="M12 3 4 21M12 3l8 18M7 15h10"/>)], ['desktop', 'Desktop', ico(<><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/></>)], ['documents', 'Documents', ico(<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></>)], ['downloads', 'Downloads', ico(<><circle cx="12" cy="12" r="9"/><path d="M12 7v9M8 12l4 4 4-4"/></>)]]],
  ['Locations', [['icloud', 'iCloud Drive', ico(<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4-1.5A4.5 4.5 0 0 0 7 18z"/>)], ['network', 'Network', ico(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>)]]]]
const TAGS = [['Red', '#ff453a'], ['Orange', '#ff9f0a'], ['Yellow', '#ffd60a'], ['Green', '#30d158'], ['Blue', '#0a84ff']]

// ── window chrome ──
function Win({ w, onFocus, onClose, title, children, className = '', toolbar }) {
  const drag = useRef(null)
  // phones: press and hold the traffic lights and they grow (with their ×  –  + glyphs) so the close
  // button is easy to hit; they shrink back after a few seconds
  const [big, setBig] = useState(false), hold = useRef(0), shrink = useRef(0)
  useEffect(() => () => { clearTimeout(hold.current); clearTimeout(shrink.current) }, [])
  const grow = () => { setBig(true); clearTimeout(shrink.current); shrink.current = setTimeout(() => setBig(false), 3500) }
  const lightsDown = (e) => { if (!touch()) return; e.stopPropagation(); clearTimeout(hold.current); hold.current = setTimeout(grow, 320) }
  const lightsUp = () => clearTimeout(hold.current)
  const down = (e) => {
    onFocus(); if (touch() || e.button !== 0 || e.target.closest('button,a,input')) return
    const stage = e.currentTarget.closest('.mac-desktop'), k = stage.getBoundingClientRect().width / stage.offsetWidth
    drag.current = { x: e.clientX, y: e.clientY, ox: w.x, oy: w.y, k }
    const move = (ev) => { const d = drag.current; if (!d) return; w.move(Math.max(-w.w + 80, d.ox + (ev.clientX - d.x) / d.k), Math.max(28, d.oy + (ev.clientY - d.y) / d.k)) }
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }
  return <motion.section className={`mac-win ${className}`} style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: className.includes('win-full') ? 600 + w.z : w.z }} onPointerDown={onFocus}
    initial={{ opacity: 0, scale: .94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94 }} transition={{ duration: .22, ease: [.2, .8, .2, 1] }}>
    <header className="mac-win-bar" onPointerDown={down}>
      {/* phones: the three dots are tiny, so a tap anywhere on them closes the window */}
      <span className={`lights${big ? ' big' : ''}`} onClick={(e) => { if (touch()) { e.stopPropagation(); onClose() } }} onPointerDown={lightsDown} onPointerUp={lightsUp} onPointerLeave={lightsUp} onPointerCancel={lightsUp} onContextMenu={(e) => e.preventDefault()}>
        <button className="l-red" onClick={onClose} aria-label="Close">{ico(<path d="M7 7l10 10M17 7 7 17"/>, 12, 3)}</button>
        <button className="l-yel" aria-label="Minimise">{ico(<path d="M6 12h12"/>, 12, 3)}</button>
        <button className="l-grn" aria-label="Zoom">{ico(<path d="M12 6v12M6 12h12"/>, 12, 3)}</button>
      </span>
      {toolbar || <span className="mac-win-title">{title}</span>}
    </header>
    <div className="mac-win-body">{children}</div>
  </motion.section>
}

// ── Finder ──
function Finder({ place, onPlace, onOpen, onBack, onFwd }) {
  const [sel, setSel] = useState(null)
  const P = PLACES[place] || PLACES.desktop
  const [view, setView] = useState('grid')
  // one row model for both views: the list (details) and the grid (big icons, easy to tap)
  const rows = P.apps ? [['Finder', 'finder'], ['Notes', 'notes'], ['Projects', 'projects']].map(([n, a]) => ({ key: a, name: n, date: '—', size: '—', kind: 'Application', go: () => onOpen({ app: a }), small: () => <AppGlyph app={a}/>, big: () => <AppGlyph app={a} s={64}/> }))
    : P.items.map((it) => ({ key: it.id, name: it.name, date: it.date, size: it.size || '--', kind: it.kind, folder: it.kind === 'Folder', go: () => onOpen(it), small: () => it.icon(it.kind === 'Folder' ? 18 : 16), big: () => it.icon(64) }))
  return <div className="finder">
    <aside className="finder-side">
      {SIDEBAR.map(([h, rows]) => <div key={h}><small>{h}</small>{rows.map(([id, label, icon]) => <button key={id} className={place === id ? 'on' : ''} onClick={() => PLACES[id] && onPlace(id)}>{icon}<span>{label}</span></button>)}</div>)}
      <div><small>Tags</small>{TAGS.map(([t, c]) => <button key={t}><i style={{ background: c }}/><span>{t}</span></button>)}</div>
    </aside>
    <div className="finder-main">
      <div className="finder-tools">
        <button onClick={onBack} aria-label="Back">{ico(<path d="m15 5-7 7 7 7"/>, 16, 2)}</button>
        <button onClick={onFwd} aria-label="Forward">{ico(<path d="m9 5 7 7-7 7"/>, 16, 2)}</button>
        <b>{P.title}</b>
        <span className="ft-right">
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List view">{ico(<path d="M4 6h16M4 12h16M4 18h16"/>, 16)}</button>
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Icon view">{ico(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>, 15)}</button>
          {ico(<><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/></>, 15)}{ico(<><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>, 15)}</span>
      </div>
      {view === 'grid' && P.covers ? <div className="finder-covers">
        {P.items.map((it) => <ProjectCover key={it.id} p={it.project} sel={sel === it.id} onSel={() => { setSel(it.id); if (touch()) onOpen(it) }} onOpen={() => onOpen(it)}/>)}
      </div> : view === 'grid' ? <div className="finder-grid">
        {rows.length ? rows.map((r) => <button key={r.key} className={`fcell${sel === r.key ? ' sel' : ''}`} onClick={() => { setSel(r.key); if (touch()) r.go() }} onDoubleClick={r.go}>
          <span className="fcell-ico">{r.big()}</span><span className="fcell-name">{r.name}</span></button>)
          : <p className="finder-empty">{P.empty}</p>}
      </div> : <>
      <div className="finder-head"><span>Name</span><span>Date Modified</span><span>Size</span><span>Kind</span></div>
      <div className="finder-rows">
        {rows.length ? rows.map((r) => <div key={r.key} className={`frow${sel === r.key ? ' sel' : ''}`} onClick={() => { setSel(r.key); if (touch()) r.go() }} onDoubleClick={r.go}>
          <span>{r.folder && ico(<path d="m9 6 6 6-6 6"/>, 10, 2.4)}{r.small()}{r.name}</span><span>{r.date}</span><span>{r.size}</span><span>{r.kind}</span></div>)
          : <p className="finder-empty">{P.empty}</p>}
      </div></>}
    </div>
  </div>
}
const AppGlyph = ({ app, s = 16 }) => app === 'projects' ? <ProjectsAppIcon size={s * 1.15}/> : <span className={`app-glyph ag-${app}`} style={{ width: s, height: s, borderRadius: Math.max(4, s * .23) }}/>

// ── Notes (Skills) ──
const LetterTile = ({ bg, fg, children, round }) => <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx={round ? 11 : 5} fill={bg}/><text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill={fg} fontFamily="-apple-system,Helvetica,Arial">{children}</text></svg>
const OracleMark = () => <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="5" fill="none" stroke="#f80000" strokeWidth="3"/></svg>
function SkillLogo({ name }) {
  if (name === 'Java') return <img src="/skills/java.png" alt="" width="100%" height="100%" style={{ objectFit: 'contain' }} draggable="false"/>
  const i = SKILL_ICONS[name]
  if (i) return <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path d={i.path} fill={`#${i.hex === '000000' || i.hex === '181717' || i.hex === 'FFFFFF' ? '1d1d1f' : i.hex}`}/></svg>
  if (name === 'PL/SQL' || name === 'Oracle SQL' || name.startsWith('Oracle Cloud')) return <OracleMark/>
  if (name === 'Canva') return <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="canva" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#00c4cc"/><stop offset="1" stopColor="#7d2ae8"/></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#canva)"/><text x="12" y="16.5" textAnchor="middle" fontSize="12" fontStyle="italic" fontWeight="700" fill="#fff" fontFamily="Georgia,serif">C</text></svg>
  // U-Net: the encoder → bottleneck → decoder "U" with skip connections
  if (name === 'U-Net') return <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="#ede9fe"/><path d="M6 5v8.5a6 6 0 0 0 12 0V5" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round"/><path d="M8.5 8h7M9 12h6" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="1.6 1.4"/></svg>
  if (name === 'torchvision') return <SkillLogo name="PyTorch"/>
  if (name === 'Matplotlib') return <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#11557c" strokeWidth="1.6"/><path d="M12 12 12 2.5A9.5 9.5 0 0 1 20.8 8.4z" fill="#11557c"/><path d="M12 12l8.8-3.6a9.5 9.5 0 0 1-2.2 10.4z" fill="#3d8fc6" opacity=".85"/><path d="M12 12l-6.6 6.8A9.5 9.5 0 0 1 3 9.6z" fill="#f89939" opacity=".9"/></svg>
  if (name === 'Pillow') return <LetterTile bg="#fff1e6" fg="#c2410c">Pi</LetterTile>
  // React Flow: connected nodes
  if (name === 'React Flow') return <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="#fde7ee"/><path d="M7 7.5 17 12 7 16.5" fill="none" stroke="#ff0072" strokeWidth="1.6"/><rect x="3.8" y="5" width="6" height="5" rx="1.4" fill="#ff0072"/><rect x="14" y="9.5" width="6" height="5" rx="1.4" fill="#1a192b"/><rect x="3.8" y="14" width="6" height="5" rx="1.4" fill="#ff0072"/></svg>
  if (name === 'EasyOCR') return <LetterTile bg="#e8f5e9" fg="#2e7d32">Aa</LetterTile>
  // threading: parallel lanes
  if (name === 'Threading') return <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="#fef3c7"/>{[7, 12, 17].map((y, k) => <g key={y}><path d={`M5 ${y}h14`} stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/><circle cx={8 + k * 4} cy={y} r="1.9" fill="#b45309"/></g>)}</svg>
  if (name === 'DeepLabV3+') return <LetterTile bg="#e0f2fe" fg="#0369a1">DL</LetterTile>
  if (name === 'Premiere Pro') return <LetterTile bg="#00005b" fg="#9999ff">Pr</LetterTile>
  return <LetterTile bg="#e5e5ea" fg="#1d1d1f">{name[0]}</LetterTile>
}
const NOTE_LIST = [
  { id: 'skills', title: 'Skills', time: '6:00 PM', blurb: () => `${SKILL_GROUPS.reduce((a, [, l]) => a + l.length, 0)} tools across ${SKILL_GROUPS.length} areas` },
  { id: 'certs', title: 'Certifications', time: '5:58 PM', blurb: () => 'Oracle Cloud Infrastructure 2023 AI Foundations' },
]
function SkillsNote() {
  return <>
    <p className="nd-date">14 November 2026 at 6:00 PM</p>
    <h1>Skills</h1>
    <p className="nd-lede">The languages, frameworks and tools I build with.</p>
    {SKILL_GROUPS.map(([g, list]) => <section key={g}><h2>{g}</h2>
      <div className="nd-chips">{list.map((n) => <span key={n} className="nd-chip"><i><SkillLogo name={n}/></i>{n}</span>)}</div>
    </section>)}
  </>
}
function CertsNote() {
  return <>
    <p className="nd-date">14 November 2026 at 5:58 PM</p>
    <h1>Certifications</h1>
    <section className="nd-cert">
      <h2>{OCI.title}</h2>
      <p className="nd-meta">{OCI.issuer} · Issued {OCI.issued} · Credential ID {OCI.id}</p>
      <a className="nd-cert-img" href={OCI.pdf} target="_blank" rel="noreferrer" title="Open the certificate (PDF)"><img src={OCI.image} alt="Oracle Certified Foundations Associate certificate" draggable="false"/><span>PDF</span></a>
      <div className="nd-chips">{OCI.tags.map((t) => <span key={t} className="nd-chip plain">{t}</span>)}</div>
      <div className="nd-actions">
        <a className="nd-btn primary" href={OCI.link} target="_blank" rel="noreferrer">View credential ↗</a>
        <a className="nd-btn" href={OCI.pdf} target="_blank" rel="noreferrer">Open PDF ↗</a>
      </div>
    </section>
  </>
}
function Notes({ note, onNote }) {
  return <div className="notes">
    <aside className="notes-side"><small>iCloud</small><button className="on">{ico(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, 14)}<span>Notes</span><em>{NOTE_LIST.length}</em></button></aside>
    <div className="notes-list"><small>Today</small>{NOTE_LIST.map((n) => <div key={n.id} className={`nl-item${note === n.id ? ' on' : ''}`} onClick={() => onNote(n.id)}><b>{n.title}</b><span><time>{n.time}</time> {n.blurb()}</span></div>)}</div>
    <article className="notes-doc" key={note}>{note === 'certs' ? <CertsNote/> : <SkillsNote/>}</article>
  </div>
}

// ── Markdown reader (projects) ──
// A small Markdown renderer for the project files: headings, paragraphs, lists, tables, fenced code,
// inline code, bold, italics and links.
function inline(t, key = 0) {
  const out = []; let rest = t, k = 0
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/
  while (rest) {
    const m = rest.match(re); if (!m) { out.push(rest); break }
    if (m.index) out.push(rest.slice(0, m.index))
    const tok = m[0], id = `${key}-${k++}`
    if (m[1]) out.push(<code key={id}>{tok.slice(1, -1)}</code>)
    else if (m[2]) out.push(<b key={id}>{inline(tok.slice(2, -2), id)}</b>)
    else if (m[3]) out.push(<i key={id}>{inline(tok.slice(1, -1), id)}</i>)
    else { const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/); out.push(<a key={id} href={href} target="_blank" rel="noreferrer">{label}</a>) }
    rest = rest.slice(m.index + tok.length)
  }
  return out
}
function Markdown({ text, skipTitle }) {
  const lines = text.replace(/\r/g, '').split('\n'), blocks = []; let i = 0
  const isTable = (l) => /^\s*\|.*\|\s*$/.test(l)
  while (i < lines.length) {
    const l = lines[i]
    if (!l.trim()) { i++; continue }
    if (l.startsWith('```')) { const lang = l.slice(3).trim(), code = []; i++; while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]); i++; blocks.push(<pre key={i} data-lang={lang}><code>{code.join('\n')}</code></pre>); continue }
    const h = l.match(/^(#{1,4})\s+(.*)$/)
    if (h) { if (!(skipTitle && h[1].length === 1)) { const T = `h${h[1].length}`; blocks.push(<T key={i}>{inline(h[2], i)}</T>) } i++; continue }
    if (isTable(l)) {
      const rows = []; while (i < lines.length && isTable(lines[i])) rows.push(lines[i++])
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const head = cells(rows[0]), body = rows.slice(/^[\s|:-]+$/.test(rows[1] || '') ? 2 : 1).map(cells)
      const blankHead = head.every((c) => !c)
      blocks.push(<div key={i} className="md-table"><table>{!blankHead && <thead><tr>{head.map((c, j) => <th key={j}>{inline(c, `${i}h${j}`)}</th>)}</tr></thead>}
        <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `${i}-${ri}-${j}`)}</td>)}</tr>)}</tbody></table></div>)
      continue
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l), items = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''))
      const L = ordered ? 'ol' : 'ul'
      blocks.push(<L key={i}>{items.map((t, j) => <li key={j}>{inline(t, `${i}l${j}`)}</li>)}</L>); continue
    }
    const para = []; while (i < lines.length && lines[i].trim() && !/^(#|```|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++])
    blocks.push(<p key={i}>{inline(para.join(' '), i)}</p>)
  }
  return <>{blocks}</>
}
const LinkIcon = { github: ico(<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>, 15), ieee: ico(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></>, 15), view: ico(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>, 15), down: ico(<><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>, 15) }
// A project's card in the Projects app: its illustration, then the name, a one-line description and
// its tools, so you know what a project is before opening it. Styled like the rest of the portfolio:
// warm paper, the book's serif, small mono labels and the orange accent.
function ProjectCover({ p, sel, onSel, onOpen }) {
  return <button className={`pcard${sel ? ' sel' : ''}`} onClick={onSel} onDoubleClick={onOpen} style={{ '--pc': p.color, '--pt': p.tint }}>
    <span className="pcard-art"><ProjectVisual id={p.id}/><i className="pcard-no">{p.fig}</i></span>
    <span className="pcard-body">
      <span className="pcard-kicker">{p.category}</span>
      <b className="pcard-name">{p.name}</b>
      <span className="pcard-line">{p.tagline}</span>
      <span className="pcard-foot">
        <span className="pcard-tools">{p.tools.slice(0, 6).map((n) => <i key={n} title={n}><SkillLogo name={n}/></i>)}{p.tools.length > 6 && <small>+{p.tools.length - 6}</small>}</span>
        <span className="pcard-open">Open {ico(<path d="M5 12h14M13 6l6 6-6 6"/>, 14, 2)}</span>
      </span>
    </span>
  </button>
}

// The Projects app: a short intro and the project cards.
function ProjectsApp({ onOpen }) {
  const [sel, setSel] = useState(null)
  return <div className="papp">
    <header className="papp-head">
      <small>Projects · {PROJECTS.length}</small>
      <h1>Things I’ve built</h1>
      <p>From deep-learning research to full-stack apps. Open one to see how it came together.</p>
    </header>
    <div className="papp-grid">
      {PROJECTS.map((p) => <ProjectCover key={p.id} p={p} sel={sel === p.id} onSel={() => { setSel(p.id); if (touch()) onOpen(p) }} onOpen={() => onOpen(p)}/>)}
    </div>
  </div>
}

const SecHead = ({ n, label, title }) => <div className="cs-head"><small>{n} — {label}</small><h2>{title}</h2></div>

// The page a project opens: intro, numbers, overview, tools, goals, how it works and the full write-up.
function Reader({ project: p, onBack }) {
  const [hasPdf, setHasPdf] = useState(null), [feat, setFeat] = useState(0)
  useEffect(() => { if (!p.links.pdf) return; fetch(p.links.pdf, { method: 'HEAD' }).then((r) => setHasPdf(r.ok && !/text\/html/.test(r.headers.get('content-type') || ''))).catch(() => setHasPdf(false)) }, [p])
  const pdfOff = hasPdf === false
  const f = p.features?.[feat]
  return <div className="reader cs" style={{ '--pc': p.color, '--pt': p.tint }}>
    {onBack && <button className="cs-back" onClick={onBack}>{ico(<path d="M19 12H5M11 6l-6 6 6 6"/>, 15, 2)}All projects</button>}
    <header className="cs-hero">
      <div className="cs-hero-text">
        <small className="cs-kicker">{p.category}</small>
        <h1>{p.name}</h1>
        {p.status && <span className="cs-status"><i/>{p.status}</span>}
        <p className="cs-tagline">{p.tagline}</p>
        <div className="cs-links">
          {p.links.github && <a className="cs-btn dark" href={p.links.github} target="_blank" rel="noreferrer">{LinkIcon.github}GitHub</a>}
          {p.links.ieee && <a className="cs-btn" href={p.links.ieee} target="_blank" rel="noreferrer">{LinkIcon.ieee}IEEE Xplore</a>}
          {p.links.pdf && <a className={`cs-btn${pdfOff ? ' off' : ''}`} href={pdfOff ? undefined : p.links.pdf} target="_blank" rel="noreferrer">{LinkIcon.view}View PDF</a>}
          {p.links.pdf && <a className={`cs-btn${pdfOff ? ' off' : ''}`} href={pdfOff ? undefined : p.links.pdf} download={pdfOff ? undefined : (p.links.pdfName || `${p.id}.pdf`)}>{LinkIcon.down}Download PDF</a>}
        </div>
      </div>
      <div className="cs-hero-art"><ProjectVisual id={p.id}/></div>
    </header>
    {p.stats?.length > 0 && <div className="cs-stats">{p.stats.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}</div>}
    <div className="cs-body">
      <section className="cs-sec">
        <SecHead n="01" label="Overview" title="The short version"/>
        {p.summary && <p className="cs-lede">{p.summary}</p>}
        {p.points?.length > 0 && <ul className="cs-points">{p.points.map((t) => <li key={t}>{t}</li>)}</ul>}
      </section>
      <section className="cs-sec">
        <SecHead n="02" label="Tools" title="What it’s built with"/>
        <div className="nd-chips">{p.tools.map((n) => <span key={n} className="nd-chip"><i><SkillLogo name={n}/></i>{n}</span>)}</div>
      </section>
      {p.objectives && <section className="cs-sec">
        <SecHead n="03" label="Goals" title={`What ${p.team ? 'we' : 'I'} set out to solve`}/>
        <ol className="cs-goals">{p.objectives.map(([t, q], i) => <li key={t}><span>{String(i + 1).padStart(2, '0')}</span><div><b>{t}</b><p>{q}</p></div></li>)}</ol>
      </section>}
      {f && <section className="cs-sec">
        <SecHead n="04" label="How it works" title="How it came together"/>
        <div className="cs-seg" role="tablist">{p.features.map((x, i) => <button key={x.name} role="tab" aria-selected={i === feat} className={i === feat ? 'on' : ''} onClick={() => setFeat(i)}>{x.name}</button>)}</div>
        <AnimatePresence mode="wait">
          <motion.div key={feat} className="cs-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .2 }}>
            <div className="cs-why"><small>The problem</small><p>{f.why}</p></div>
            <div className="cs-dec"><small>What {p.team ? 'we' : 'I'} did</small><ul>{f.decisions.map((d) => <li key={d}>{d}</li>)}</ul></div>
            <div className="cs-trade"><small>The catch</small><p>{f.tradeoff}</p></div>
          </motion.div>
        </AnimatePresence>
      </section>}
    </div>
  </div>
}

// Preview: the résumé's page (rendered with pdf.js), its links still clickable
function PdfPreview() {
  const [doc, setDoc] = useState(null), [failed, setFailed] = useState(false)
  useEffect(() => { loadResume().then(setDoc, () => setFailed(true)) }, [])
  return <div className="pdf-view">
    {doc ? <div className="pdf-page" style={{ aspectRatio: `1 / ${doc.aspect}` }}>
      <img src={doc.url} alt="Sameer Palkar's résumé" draggable="false"/>
      {doc.links.map((l, i) => <a key={i} href={l.href} target="_blank" rel="noreferrer" style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }} aria-label={l.href}/>)}
    </div> : <p className="pdf-wait">{failed ? 'Couldn’t load the résumé. Use the download button above.' : 'Opening…'}</p>}
  </div>
}

// ── the desktop: icons + windows ──
export function DesktopOS({ stageH }) {
  const [wins, setWins] = useState([]), [sel, setSel] = useState(null)
  const zTop = useRef(10)
  const place = (w) => ({ ...w, y: Math.min(w.y, Math.max(34, stageH - w.h - 76)), h: Math.min(w.h, stageH - 104) })
  const upd = (key, patch) => setWins((ws) => ws.map((w) => w.key === key ? { ...w, ...patch } : w))
  const focus = (key) => setWins((ws) => ws.map((w) => w.key === key ? { ...w, z: ++zTop.current } : w))
  const close = (key) => setWins((ws) => ws.filter((w) => w.key !== key))
  const openWin = (key, base) => setWins((ws) => ws.some((w) => w.key === key)
    ? ws.map((w) => w.key === key ? { ...w, ...Object.fromEntries(Object.entries(base.patch).filter(([, v]) => v !== undefined)), z: ++zTop.current } : w)
    : [...ws, place({ key, ...base.init, ...base.patch, z: ++zTop.current })])
  const finderAt = (p) => openWin('finder', { init: sized({ app: 'finder', x: 120, y: 44, w: 940, h: 560, hist: [p], hi: 0 }), patch: {} }) || setWins((ws) => ws.map((w) => w.key !== 'finder' ? w : (w.hist[w.hi] === p ? w : { ...w, hist: [...w.hist.slice(0, w.hi + 1), p], hi: w.hi + 1 })))
  const T = touch()
  // phones: windows open filling the screen so their text is big enough to read
  const sized = (init) => T ? { ...init, x: 8, y: 34, w: 1164, h: stageH - 34 - 70 } : init
  const open = (it) => {
    if (it.app === 'finder') return finderAt('desktop')
    if (it.app === 'projects') return openWin('projects', { init: sized({ app: 'projects', x: 110, y: 40, w: 960, h: 570 }), patch: {} })
    if (it.app === 'notes' || it.kind === 'Note') return openWin('notes', { init: sized({ app: 'notes', x: 150, y: 46, w: 860, h: 500 }), patch: { note: it.kind === 'Note' ? it.id : undefined } })
    if (it.kind === 'Folder') return finderAt(it.id)
    if (it.kind === 'PDF document') return openWin('pdf', { init: { app: 'pdf', x: 0, y: 28, w: 1180, h: stageH - 28 }, patch: {} })
    // projects open full screen (below the menu bar), on laptop and phone
    if (it.project) return openWin('reader', { init: { app: 'reader', x: 0, y: 28, w: 1180, h: stageH - 28 }, patch: { project: it.project } })
  }
  return <>
    {T && <TouchFlag/>}
    <div className="desk-icons" onClick={(e) => { if (e.target === e.currentTarget) setSel(null) }}>
      {DESKTOP.map((it) => <button key={it.id} className={`desk-icon${sel === it.id ? ' sel' : ''}`} onClick={() => { setSel(it.id); if (touch()) open(it) }} onDoubleClick={() => open(it)}>
        {it.icon(58)}<span>{it.name}</span></button>)}
    </div>
    <AnimatePresence>{wins.map((w) => {
      const common = { key: w.key, w: { ...w, move: (x, y) => upd(w.key, { x, y }) }, onFocus: () => focus(w.key), onClose: () => close(w.key) }
      if (w.app === 'finder') return <Win {...common} className="win-finder" toolbar={<span className="mac-win-title"/>}>
        <Finder place={w.hist[w.hi]} onPlace={(p) => finderAt(p)} onOpen={open}
          onBack={() => w.hi > 0 && upd(w.key, { hi: w.hi - 1 })} onFwd={() => w.hi < w.hist.length - 1 && upd(w.key, { hi: w.hi + 1 })}/></Win>
      if (w.app === 'pdf') return <Win {...common} className="win-preview win-full win-pdf" toolbar={<><span className="mac-win-title">{RESUME_NAME}</span>
        <a className="pdf-dl" href={RESUME_DOWNLOAD} download={RESUME_NAME} title="Download PDF" aria-label="Download PDF">{ico(<><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></>, 17, 2)}</a></>}><PdfPreview/></Win>
      if (w.app === 'projects') return <Win {...common} className="win-projects win-full" title="Projects"><ProjectsApp onOpen={(p) => open({ project: p })}/></Win>
      if (w.app === 'reader') return <Win {...common} className="win-reader win-full" title={w.project?.file}><Reader project={w.project} onBack={() => { close(w.key); open({ app: 'projects' }) }}/></Win>
      if (w.app === 'notes') return <Win {...common} className="win-notes win-full" title=""><Notes note={w.note || 'skills'} onNote={(n) => upd(w.key, { note: n })}/></Win>
      return null
    })}</AnimatePresence>
    {/* the dock's Finder and Notes open their apps */}
    <DockHooks onFinder={() => finderAt('desktop')} onNotes={() => open({ app: 'notes' })} onPreview={() => {}} onProjects={() => open({ app: 'projects' })}/>
  </>
}
// the dock lives in App; it calls these through a window event so the dock markup can stay there
function DockHooks({ onFinder, onNotes, onPreview, onProjects }) {
  const ref = useRef({}); ref.current = { onFinder, onNotes, onPreview, onProjects }
  useEffect(() => {
    const h = (e) => { const f = { finder: 'onFinder', notes: 'onNotes', photos: 'onPreview', code: 'onProjects' }[e.detail]; f && ref.current[f]() }
    window.addEventListener('mac-dock', h); return () => window.removeEventListener('mac-dock', h)
  }, [])
  return null
}

// marks the desktop as a touch one (bigger text in windows and labels)
function TouchFlag() {
  useEffect(() => { const el = document.querySelector('.mac-desktop'); el?.classList.add('is-touch'); return () => el?.classList.remove('is-touch') }, [])
  return null
}
