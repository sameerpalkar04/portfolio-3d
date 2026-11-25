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
// 3D modelling is a hobby: a plain folder at the end of the desktop, one sub-folder of renders per model
const cubeGlyph = <><path d="M12 2 4 6.5v9L12 20l8-4.5v-9z"/><path d="M4 6.5 12 11l8-4.5M12 11v9"/></>
// the box says why; the timeline beside it says what happened, so the two don't repeat each other
const SKETCH_STORY = [
  'SketchUp is where I first started making things. Most of what I built back then was pretty rough, but I loved working out how the pieces fit together.',
  'I still model for fun, mostly buildings like the one below. It’s a nice break from code, and it’s a big part of why I wanted this portfolio to be a room you can walk around in.',
]
const MODELS = [
  { id: 'skyon', name: 'Residential Society I', about: 'A residential township courtyard: palms, a stepped plaza and a pool between the towers.',
    shots: [['1', 'Central courtyard'], ['2', 'Over the palms'], ['3', 'Aerial view'], ['4', 'Pool steps']] },
  { id: 'flat-interior-1', name: 'Flat Interior 1', kind: 'Interior', about: 'A compact apartment: a living room and open kitchen behind a geometric screen, and a bedroom with a built-in TV unit.',
    shots: [['1', 'Living room & kitchen'], ['2', 'Bedroom TV unit'], ['3', 'Bedroom'], ['4', 'Sofa corner']] },
  { id: 'flat-interior-2', name: 'Flat Interior II', kind: 'Interior', about: 'A four-bedroom apartment, furnished room by room: two living areas, a dining space, bedrooms with en-suites and a U-shaped kitchen.',
    shots: [['1', 'Living room'], ['2', 'Floor plan'], ['3', 'Bedrooms'], ['4', 'Kitchen']] },
  { id: 'mansion', name: 'Mansion', about: 'A multi-level house stepped into a hillside, with terraces, an infinity pool and a sports court in the gardens below.',
    shots: [['1', 'Front elevation'], ['2', 'Aerial view'], ['3', 'From the garden'], ['4', 'Terrace & stairs']] },
  { id: 'airport', v: 'c', name: 'Airport', about: 'An airport terminal with two piers of gates, a landscaped forecourt, a check-in and immigration hall, and planes at the jet bridges.',
    shots: [['1', 'Terminal 5 forecourt'], ['2', 'Gates & jet bridges'], ['3', 'Immigration hall'], ['4', 'Site plan']] },
  { id: 'residential-2', name: 'Residential Society II', about: 'A gated township of high-rise towers around a central park, with fountains, a clubhouse, play areas and sports courts.',
    shots: [['1', 'Aerial view'], ['2', 'Fountain walk'], ['3', 'Clubhouse & courts'], ['4', 'Central park']] },
  { id: 'residential-3', name: 'Residential Society III', about: 'Mid-rise towers wrapped around a large central lawn, with a clubhouse and pool, a sports court, an open-air gym and parking along the edges.',
    shots: [['1', 'Central lawn'], ['2', 'Tree-lined avenue'], ['3', 'Open-air gym'], ['4', 'Site plan']] },
]
// The Sketchbook's own icon: a squircle of drafting paper with a wireframe cube being drawn by a pencil
export const SketchbookIcon = ({ size = 64 }) => <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
  <defs><clipPath id="sbi"><rect x="4" y="4" width="56" height="56" rx="14"/></clipPath>
    <linearGradient id="sbig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffaf0"/><stop offset="1" stopColor="#efe6d2"/></linearGradient>
    <pattern id="sbip" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M7 0H0v7" fill="none" stroke="#d9cdb4" strokeWidth=".6"/></pattern></defs>
  <g clipPath="url(#sbi)">
    <rect x="4" y="4" width="56" height="56" fill="url(#sbig)"/><rect x="4" y="4" width="56" height="56" fill="url(#sbip)"/>
    <path d="M30 17 17 24.5v15L30 47l13-7.5v-15z" fill="#e2673f" opacity=".14"/>
    <path d="M30 17 17 24.5v15L30 47l13-7.5v-15zM17 24.5 30 32l13-7.5M30 32v15" fill="none" stroke="#2b2622" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>
    <path d="M17 39.5 30 32M43 39.5 30 32" stroke="#2b2622" strokeWidth="1.2" strokeDasharray="2 2.2" opacity=".45"/>
    <g transform="rotate(42 46 40)"><rect x="43" y="22" width="6" height="22" rx="1" fill="#f5b83d"/><rect x="43" y="22" width="6" height="4" fill="#e2673f"/><path d="M43 44h6l-3 6z" fill="#f3d7b0"/><path d="M45.2 48.4h1.6L46 50z" fill="#2b2622"/></g>
  </g>
  <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" fill="none" stroke="rgba(0,0,0,.14)"/>
</svg>
const MODELS_ITEM = { id: '3d', name: '3D stuff', kind: 'Application', app: 'photos', date: 'Side quest', icon: (s) => <SketchbookIcon size={s}/> }
const DESKTOP = [
  { id: 'projects', name: 'Projects', kind: 'Application', app: 'projects', date: 'Today, 6:00 PM', icon: (s) => <ProjectsAppIcon size={s}/> },
  { id: 'certs', name: 'Certifications', kind: 'Note', date: 'Today, 5:58 PM', icon: (s) => <NoteIcon size={s}/> },
  { id: 'skills', name: 'Skills', kind: 'Note', date: 'Today, 5:55 PM', icon: (s) => <NoteIcon size={s}/> },
  RESUME_ITEM,
  MODELS_ITEM,
]
// The dock: Finder, then the same five things that are on the desktop, as apps
const Squircle = ({ size, bg, children }) => <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="14" fill={bg}/>{children}<rect x="4.5" y="4.5" width="55" height="55" rx="13.5" fill="none" stroke="rgba(0,0,0,.14)"/></svg>
export const MAC_DOCK = [
  { id: 'finder', name: 'Finder', icon: (s) => <Squircle size={s} bg="url(#dkf)"><defs><linearGradient id="dkf" x1="0" y1="0" x2="1" y2="0"><stop offset=".5" stopColor="#1e90ff"/><stop offset=".5" stopColor="#e9f3ff"/></linearGradient></defs>
    <path d="M32 12v40" stroke="#0a5bd8" strokeWidth="2.4"/><circle cx="23" cy="27" r="2.6" fill="#fff"/><circle cx="41" cy="27" r="2.6" fill="#0a5bd8"/><path d="M21 40q11 7 22 0" fill="none" stroke="#0a5bd8" strokeWidth="2.6" strokeLinecap="round"/></Squircle> },
  { id: 'projects', name: 'Projects', icon: (s) => <ProjectsAppIcon size={s}/> },
  { id: 'skills', name: 'Skills', icon: (s) => <Squircle size={s} bg="#fffdf6"><path d="M4 18a14 14 0 0 1 14-14h28a14 14 0 0 1 14 14v2H4z" fill="#f6c84c"/>{[30, 37, 44].map((y, i) => <path key={y} d={`M14 ${y}h${i === 2 ? 22 : 36}`} stroke="#cfc7b4" strokeWidth="2.4" strokeLinecap="round"/>)}<path d="m40 41 4 4 8-9" fill="none" stroke="#e2673f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></Squircle> },
  { id: 'certs', name: 'Certifications', icon: (s) => <Squircle size={s} bg="#fffdf6"><path d="M4 18a14 14 0 0 1 14-14h28a14 14 0 0 1 14 14v2H4z" fill="#f6c84c"/><circle cx="32" cy="36" r="9" fill="#f80000"/><rect x="27" y="33.5" width="10" height="5" rx="2.5" fill="none" stroke="#fff" strokeWidth="1.8"/><path d="m26.5 43-2 9 7.5-3 7.5 3-2-9" fill="#c40000"/></Squircle> },
  { id: 'resume', name: 'Résumé', icon: (s) => <Squircle size={s} bg="url(#dkr)"><defs><linearGradient id="dkr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fd0ff"/><stop offset="1" stopColor="#3a9bf0"/></linearGradient></defs>
    <path d="M20 13h17l9 9v29H20z" fill="#fff"/><path d="M37 13v9h9" fill="#dfe6ee"/>{[28, 33].map((y) => <path key={y} d={`M25 ${y}h16`} stroke="#c9d2dc" strokeWidth="2" strokeLinecap="round"/>)}<rect x="24" y="38" width="15" height="8" rx="2" fill="#e5483b"/><text x="31.5" y="44.2" textAnchor="middle" fontSize="5.6" fontWeight="700" fill="#fff" fontFamily="-apple-system,Helvetica,Arial">PDF</text></Squircle> },
  { id: '3d', name: '3D stuff', icon: (s) => <SketchbookIcon size={s}/> },
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
const LinkIcon = { play: ico(<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>, 14, 1.6), github: ico(<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>, 15), ieee: ico(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></>, 15), view: ico(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>, 15), down: ico(<><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>, 15) }
// A project's card in the Projects app: its illustration, then the name, a one-line description and
// its tools, so you know what a project is before opening it. Styled like the rest of the portfolio:
// warm paper, the book's serif, small mono labels and the orange accent.
function ProjectCover({ p, sel, onSel, onOpen }) {
  return <button className={`pcard${sel ? ' sel' : ''}`} onClick={onSel} onDoubleClick={onOpen} style={{ '--pc': p.color, '--pt': p.tint }}>
    <span className="pcard-art"><ProjectVisual id={p.id}/></span>
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
      <h1>Things I’ve built</h1>
      <p>From deep-learning research to full-stack apps. Open one to see how it came together.</p>
    </header>
    <div className="papp-grid">
      {PROJECTS.map((p) => <ProjectCover key={p.id} p={p} sel={sel === p.id} onSel={() => { setSel(p.id); if (touch()) onOpen(p) }} onOpen={() => onOpen(p)}/>)}
    </div>
  </div>
}

const SecHead = ({ title }) => <div className="cs-head"><h2>{title}</h2></div>

// A project's demo video, in a QuickTime-style window: traffic lights and title on top, a floating
// translucent control bar (volume · back 15 / play / forward 15 · full screen, then the scrubber).
// The bars fade out while it plays and the pointer is still; a spinner shows until it can play.
const qtTime = (t) => { t = Math.max(0, Math.floor(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
const QT = {
  play: <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M7 4.8v14.4c0 .8.9 1.3 1.6.8l11-7.2a1 1 0 0 0 0-1.6l-11-7.2C7.9 3.5 7 4 7 4.8z"/></svg>,
  pause: <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>,
  // like SF Symbols' gobackward.15 / goforward.15: an open ring, a solid arrowhead at the top, 15 centred inside
  back: <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 5.2A7.8 7.8 0 1 1 5.25 9.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M8.6 5.2 12.6 2.6v5.2z" fill="currentColor"/><text x="12" y="15.7" fontSize="7.4" fontWeight="600" textAnchor="middle" fill="currentColor" fontFamily="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif">15</text></svg>,
  fwd: <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 5.2A7.8 7.8 0 1 0 18.75 9.1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M15.4 5.2 11.4 2.6v5.2z" fill="currentColor"/><text x="12" y="15.7" fontSize="7.4" fontWeight="600" textAnchor="middle" fill="currentColor" fontFamily="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif">15</text></svg>,
  vol: <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  mute: <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  full: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/></svg>,
}
function QtSlider({ value, onChange, className = '' }) {
  const ref = useRef(null)
  const set = (x) => { const r = ref.current.getBoundingClientRect(); onChange(Math.min(1, Math.max(0, (x - r.left) / r.width))) }
  return <div ref={ref} className={`qt-slider ${className}`} role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} tabIndex={-1}
    onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX) }}
    onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e.clientX) }}>
    <span className="qt-track"><i style={{ width: `${value * 100}%` }}/></span>
  </div>
}
function DemoPlayer({ src, title, onClose }) {
  const vid = useRef(null), box = useRef(null), idle = useRef(0)
  const [ready, setReady] = useState(false), [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0), [dur, setDur] = useState(0), [vol, setVol] = useState(1), [muted, setMuted] = useState(false), [shown, setShown] = useState(true)
  // laptop: the bar stays put. Phones: tapping the video shows / hides it (no play-pause on tap there).
  const onPhone = touch()
  const poke = () => {}
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') { e.stopImmediatePropagation(); onClose() }
      else if (e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); toggle() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); skip(e.key === 'ArrowLeft' ? -5 : 5) }
    }
    window.addEventListener('keydown', k, true); poke()
    return () => { window.removeEventListener('keydown', k, true); window.clearTimeout(idle.current) }
  }, [onClose])
  const toggle = () => { const v = vid.current; if (!v) return; v.paused ? v.play() : v.pause() }
  const skip = (d) => { const v = vid.current; if (v) v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + d)); poke() }
  const seek = (f) => { const v = vid.current; if (v && v.duration) { v.currentTime = f * v.duration; setT(v.currentTime) } }
  const setVolume = (f) => { const v = vid.current; if (v) { v.volume = f; v.muted = f === 0 }; setVol(f); setMuted(f === 0) }
  const full = () => { const el = box.current?.querySelector('.qt-stage'); if (!el) return; document.fullscreenElement ? document.exitFullscreen?.() : (el.requestFullscreen?.() || vid.current?.webkitEnterFullscreen?.()) }
  const bars = !onPhone || shown || !ready
  return <motion.div className="cs-demo" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <motion.div ref={box} className={`qt-win${bars ? "" : " qt-idle"}`} onClick={(e) => e.stopPropagation()}
      initial={{ scale: .96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .97, y: 4 }} transition={{ duration: .25, ease: [.2, .8, .2, 1] }}>
      <div className="qt-title">
        <span className="qt-lights">
          <button type="button" className="r" onClick={onClose} aria-label="Close">{ico(<path d="M7 7l10 10M17 7 7 17"/>, 8, 3)}</button>
          <i className="y"/><i className="g"/>
        </span>
        <span className="qt-name">{title}</span>
      </div>
      <div className="qt-stage">
        <video ref={vid} src={src} autoPlay playsInline preload="auto" aria-label={title} onClick={onPhone ? () => setShown((v) => !v) : toggle}
          onCanPlay={() => setReady(true)} onPlay={() => { setPlaying(true); poke() }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}/>
        {!ready && <span className="qt-wait"><i className="spin" aria-hidden="true"/>Loading…</span>}
      <div className="qt-hud" onClick={(e) => e.stopPropagation()}>
        <div className="qt-row">
          <span className="qt-vol">
            <button type="button" onClick={() => setVolume(muted || vol === 0 ? 1 : 0)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted || vol === 0 ? QT.mute : QT.vol}</button>
            <QtSlider value={muted ? 0 : vol} onChange={setVolume} className="is-vol"/>
          </span>
          <span className="qt-main">
            <button type="button" onClick={() => skip(-15)} aria-label="Back 15 seconds">{QT.back}</button>
            <button type="button" className="qt-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? QT.pause : QT.play}</button>
            <button type="button" onClick={() => skip(15)} aria-label="Forward 15 seconds">{QT.fwd}</button>
          </span>
          <span className="qt-end"><button type="button" onClick={full} aria-label="Full screen">{QT.full}</button></span>
        </div>
        <div className="qt-row qt-scrub">
          <small>{qtTime(t)}</small>
          <QtSlider value={dur ? t / dur : 0} onChange={seek}/>
          <small>-{qtTime(dur - t)}</small>
        </div>
      </div>
      </div>
    </motion.div>
  </motion.div>
}

// The page a project opens: intro, numbers, overview, tools, goals, how it works and the full write-up.
function Reader({ project: p, onBack }) {
  const [hasPdf, setHasPdf] = useState(null), [feat, setFeat] = useState(0), [demo, setDemo] = useState(false)
  useEffect(() => { if (!p.links.pdf) return; fetch(p.links.pdf, { method: 'HEAD' }).then((r) => setHasPdf(r.ok && !/text\/html/.test(r.headers.get('content-type') || ''))).catch(() => setHasPdf(false)) }, [p])
  const pdfOff = hasPdf === false
  const f = p.features?.[feat]
  return <div className="reader cs" style={{ '--pc': p.color, '--pt': p.tint }}>
    <AnimatePresence>{demo && <DemoPlayer src={p.links.demo} title={`${p.name} Demo.mp4`} onClose={() => setDemo(false)}/>}</AnimatePresence>
    {onBack && <button className="cs-back" onClick={onBack}>{ico(<path d="M19 12H5M11 6l-6 6 6 6"/>, 15, 2)}All projects</button>}
    <header className="cs-hero">
      <div className="cs-hero-text">
        <small className="cs-kicker">{p.category}</small>
        <h1>{p.name}</h1>
        {p.status && <span className="cs-status"><i/>{p.status}</span>}
        <p className="cs-tagline">{p.tagline}</p>
        <div className="cs-links">
          {p.links.github && <a className="cs-btn dark" href={p.links.github} target="_blank" rel="noreferrer">{LinkIcon.github}GitHub</a>}
          {p.links.demo && <button type="button" className="cs-btn" onClick={() => setDemo(true)}>{LinkIcon.play}Demo</button>}
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
        <SecHead n="01" label="Overview" title="Description"/>
        {p.summary && <p className="cs-lede">{p.summary}</p>}
        {p.points?.length > 0 && <ul className="cs-points">{p.points.map((t) => <li key={t}>{t}</li>)}</ul>}
      </section>
      <section className="cs-sec">
        <SecHead n="02" label="Tools" title="Tools"/>
        <div className="nd-chips">{p.tools.map((n) => <span key={n} className="nd-chip"><i><SkillLogo name={n}/></i>{n}</span>)}</div>
      </section>
      {p.objectives && <section className="cs-sec">
        <SecHead n="03" label="Goals" title="Problem statement"/>
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

// Sketchbook: the SketchUp side quest, dressed like the Projects app (cream paper, serif heads, the same
// cards). The front page tells how it started and lists the models; a model shows its renders, and any
// render opens in the viewer.
const SKETCH_STEPS = [
  ['SketchUp at nine', 'My dad, a mechanical engineer, introduced me to SketchUp. I started with simple boxes and shapes.'],
  ['Learning from his drawings', 'Watching him work on CAD drawings showed me how things get planned before they’re built.'],
  ['Into software', 'That curiosity about how things work is what led me to software development.'],
]
function Sketchbook({ onShot, album = null, setAlbum }) {
  const m = MODELS.find((x) => x.id === album)
  const img = (mm, f, thumb) => `/3d/${mm.id}/${f}${thumb ? '-thumb' : ''}.webp?v=2${mm.v || ''}`
  const top = useRef(null)
  useEffect(() => { top.current?.scrollTo({ top: 0 }) }, [album])
  const card = (x, i) => <button key={x.id} className="pcard sb-card" style={{ order: 2 + i }} onClick={() => setAlbum(x.id)}>
            <span className="pcard-art"><img src={img(x, x.shots[0][0], true)} alt="" loading="lazy" draggable="false"/></span>
            <span className="pcard-body">
              <span className="pcard-kicker">{x.kind || 'Architecture'} · {x.shots.length} renders</span>
              <b className="pcard-name">{x.name}</b>
              <span className="pcard-line">{x.about}</span>
              <span className="pcard-foot">
                <span className="pcard-tools"><i title="SketchUp"><SkillLogo name="SketchUp"/></i><small>SketchUp</small></span>
                <span className="pcard-open">View {ico(<path d="M5 12h14M13 6l6 6-6 6"/>, 14, 2)}</span>
              </span>
            </span>
          </button>
  return <div className="papp sb" ref={top}>
    <AnimatePresence mode="wait">
      {!m ? <motion.div key="all" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .2 }}>
        <header className="papp-head">
          <h1>Sketchbook</h1>
          <p>Architectural models I build in SketchUp, for fun.</p>
        </header>
        {/* two columns: the story and the timeline on top, then the models alternate left, right, left… */}
        <section className="sb-origin">
          <div className="sb-col">
            <div className="sb-story">{SKETCH_STORY.map((t) => <p key={t}>{t}</p>)}</div>
            {MODELS.map((x, i) => i % 2 === 0 && card(x, i))}
          </div>
          <div className="sb-col">
            <ol className="sb-steps">{SKETCH_STEPS.map(([k, t]) => <li key={k}><b>{k}</b><span>{t}</span></li>)}</ol>
            {MODELS.map((x, i) => i % 2 === 1 && card(x, i))}
            {MODELS.length % 2 === 1 && <span className="sb-fin"><span className="end-mark">— fin —</span><button type="button" className="sb-top" onClick={() => top.current?.scrollTo({ top: 0, behavior: 'smooth' })}>{ico(<path d="M12 19V5M6 11l6-6 6 6"/>, 14, 2)}Back to top</button></span>}
          </div>
          {MODELS.length % 2 === 0 && <span className="sb-fin sb-fin-full"><span className="end-mark">— fin —</span><button type="button" className="sb-top" onClick={() => top.current?.scrollTo({ top: 0, behavior: 'smooth' })}>{ico(<path d="M12 19V5M6 11l6-6 6 6"/>, 14, 2)}Back to top</button></span>}
        </section>
      </motion.div> : <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .2 }}>
        <button className="cs-back" onClick={() => setAlbum(null)}>{ico(<path d="M19 12H5M11 6l-6 6 6 6"/>, 15, 2)}Sketchbook</button>
        <header className="papp-head sb-album-head">
          <small>{m.kind || 'Architecture'} · SketchUp</small>
          <h1>{m.name}</h1>
          <p>{m.about}</p>
        </header>
        <div className="sb-shots">
          {m.shots.map(([f, cap], j) => <button key={f} className={`sb-shot${j === 0 ? ' hero' : ''}`} onClick={() => onShot(m, j)}>
            <span className="sb-shot-art"><img src={img(m, f, j !== 0)} alt={`${m.name}: ${cap}`} loading={j ? 'lazy' : undefined} draggable="false"/></span>
            <span className="sb-shot-cap"><b>{cap}</b></span>
          </button>)}
        </div>
      </motion.div>}
    </AnimatePresence>
  </div>
}

// Preview for the 3D renders: one image at a time, arrows (and arrow keys / swipe) to flip through
function ShotViewer({ shot, onShot, onBack }) {
  const { model: m, i } = shot, n = m.shots.length
  const go = (d) => onShot((i + d + n) % n)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(false) }, [i])
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowRight') { e.stopPropagation(); go(1) } else if (e.key === 'ArrowLeft') { e.stopPropagation(); go(-1) } }
    window.addEventListener('keydown', k, true); return () => window.removeEventListener('keydown', k, true)
  })
  const sx = useRef(null)
  const src = `/3d/${m.id}/${m.shots[i][0]}.webp`
  // on a phone held upright the desktop is turned sideways, so its left-right runs down the screen
  const along = (e) => { const d = e.currentTarget.closest('.mac-desktop'), r = d?.getBoundingClientRect(); return r && d.offsetWidth > d.offsetHeight && r.height > r.width ? e.clientY : e.clientX }
  return <div className="shot-view" onPointerDown={(e) => { if (!e.target.closest('button')) sx.current = along(e) }} onPointerUp={(e) => { const p = along(e); if (sx.current != null && Math.abs(p - sx.current) > 40) go(p < sx.current ? 1 : -1); sx.current = null }}>
    <img key={src} className={`shot-img${loaded ? ' in' : ''}`} src={src} alt={`${m.name}: ${m.shots[i][1]}`} onLoad={() => setLoaded(true)} draggable="false"/>
    {!loaded && <i className="spin shot-spin" aria-hidden="true"/>}
    <button className="shot-back" onClick={onBack}>{ico(<path d="M19 12H5M11 6l-6 6 6 6"/>, 15, 2)}{m.name}</button>
    <button className="shot-nav prev" onClick={() => go(-1)} aria-label="Previous render">{ico(<path d="m15 5-7 7 7 7"/>, 20, 2.2)}</button>
    <button className="shot-nav next" onClick={() => go(1)} aria-label="Next render">{ico(<path d="m9 5 7 7-7 7"/>, 20, 2.2)}</button>
    <div className="shot-foot">
      <p className="shot-bar"><b>{m.shots[i][1]}</b><span>{i + 1} of {n}</span></p>
      <div className="shot-strip">{m.shots.map(([f, cap], j) => <button key={f} className={j === i ? 'on' : ''} onClick={() => onShot(j)} aria-label={cap}><img src={`/3d/${m.id}/${f}-thumb.webp?v=2${m.v || ''}`} alt="" draggable="false"/></button>)}</div>
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
    </div> : <p className="pdf-wait">{failed ? 'Couldn’t load the résumé. Use the download button above.' : <><i className="spin" aria-hidden="true"/>Opening…</>}</p>}
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
    if (it.app === 'photos') return openWin('photos', { init: { app: 'photos', x: 0, y: 28, w: 1180, h: stageH - 28 }, patch: { album: it.album } })
    if (it.shot) return openWin('viewer', { init: { app: 'viewer', x: 0, y: 28, w: 1180, h: stageH - 28 }, patch: { shot: it.shot } })
    if (it.kind === 'PDF document') return openWin('pdf', { init: { app: 'pdf', x: 0, y: 28, w: 1180, h: stageH - 28 }, patch: {} })
    // projects open full screen (below the menu bar), on laptop and phone
    if (it.project) return openWin('reader', { init: { app: 'reader', x: 0, y: 28, w: 1180, h: stageH - 28 }, patch: { project: it.project } })
  }
  return <>
    {T && <TouchFlag/>}
    <DeskIcons T={T} stageH={stageH} sel={sel} setSel={setSel} open={open}/>
    <AnimatePresence>{wins.map((w) => {
      const common = { key: w.key, w: { ...w, move: (x, y) => upd(w.key, { x, y }) }, onFocus: () => focus(w.key), onClose: () => close(w.key) }
      if (w.app === 'finder') return <Win {...common} className="win-finder" toolbar={<span className="mac-win-title"/>}>
        <Finder place={w.hist[w.hi]} onPlace={(p) => finderAt(p)} onOpen={open}
          onBack={() => w.hi > 0 && upd(w.key, { hi: w.hi - 1 })} onFwd={() => w.hi < w.hist.length - 1 && upd(w.key, { hi: w.hi + 1 })}/></Win>
      if (w.app === 'pdf') return <Win {...common} className="win-preview win-full win-pdf" toolbar={<><span className="mac-win-title">{RESUME_NAME}</span>
        <a className="pdf-dl" href={RESUME_DOWNLOAD} download={RESUME_NAME} title="Download PDF" aria-label="Download PDF">{ico(<><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/></>, 17, 2)}</a></>}><PdfPreview/></Win>
      if (w.app === 'projects') return <Win {...common} className="win-projects win-full" title="Projects"><ProjectsApp onOpen={(p) => open({ project: p })}/></Win>
      if (w.app === 'reader') return <Win {...common} className="win-reader win-full" title={w.project?.file}><Reader project={w.project} onBack={() => { close(w.key); open({ app: 'projects' }) }}/></Win>
      if (w.app === 'photos') return <Win {...common} className="win-photos win-full" title="Sketchbook"><Sketchbook album={w.album} setAlbum={(a) => upd(w.key, { album: a })} onShot={(model, i) => open({ shot: { model, i } })}/></Win>
      if (w.app === 'viewer') return <Win {...common} className="win-preview win-full win-viewer" title={`${w.shot.model.name} — ${w.shot.model.shots[w.shot.i][1]}`}>
        <ShotViewer shot={w.shot} onShot={(i) => upd(w.key, { shot: { ...w.shot, i } })} onBack={() => { const id = w.shot.model.id; close(w.key); open({ app: 'photos', album: id }) }}/></Win>
      if (w.app === 'notes') return <Win {...common} className="win-notes win-full" title=""><Notes note={w.note || 'skills'} onNote={(n) => upd(w.key, { note: n })}/></Win>
      return null
    })}</AnimatePresence>
    {/* the dock's Finder and Notes open their apps */}
    <NateHooks onOpen={(x) => x.note ? open({ kind: 'Note', id: x.note }) : x.project && open({ project: PROJECTS.find((p) => p.id === x.project) })}/>
    <DockHooks onOpen={(id) => { if (id === 'finder') return finderAt('desktop'); const it = DESKTOP.find((x) => x.id === id); if (it) open(it) }}/>
  </>
}
// The desktop icons sit on a grid, right-aligned like macOS. Drag one (on a phone: press and hold, then
// drag) and it snaps to the nearest cell when let go, swapping places with an icon already there.
const STAGE_W = 1180
function DeskIcons({ T, stageH, sel, setSel, open }) {
  const cw = T ? 140 : 104, ch = T ? 168 : 120, top = T ? 300 : 320, right = 16
  // the grid is laid so a row lands exactly where the icons start (below the widgets)
  const r0 = Math.floor((top - 34) / ch), y0 = top - r0 * ch
  const cols = Math.max(1, Math.floor((STAGE_W - 2 * right) / cw)), rows = Math.max(r0 + 2, Math.floor((stageH - 96 - y0) / ch))
  // starting layout, [column from the right, row]: Projects · Skills · 3D projects along the top,
  // Certifications under Skills and the résumé under 3D projects
  const START = { '3d': [0, 0], resume: [0, 1], skills: [1, 0], certs: [1, 1], projects: [2, 0] }
  const defaults = () => Object.fromEntries(DESKTOP.map((it, i) => [it.id, START[it.id] ? [START[it.id][0], r0 + START[it.id][1]] : [3 + Math.floor(i / 2), r0 + (i % 2)]]))
  const [cells, setCells] = useState(defaults)
  useEffect(() => { setCells(defaults()) }, [T, rows]) // eslint-disable-line react-hooks/exhaustive-deps
  const [drag, setDrag] = useState(null) // { id, x, y, cell }
  const box = useRef(null), st = useRef(null), justDragged = useRef(0)
  const cellXY = ([c, r]) => [STAGE_W - right - (c + 1) * cw, y0 + r * ch]
  const nearest = (x, y) => [Math.min(cols - 1, Math.max(0, Math.round((STAGE_W - right - x) / cw - 1))), Math.min(rows - 1, Math.max(0, Math.round((y - y0) / ch)))]
  // screen point → the desktop's own coordinates (it may be scaled, or turned sideways on a phone)
  const mapper = () => {
    const el = box.current, probe = (x, y) => { const d = document.createElement('i'); d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`; el.appendChild(d); const r = d.getBoundingClientRect(); d.remove(); return [r.left, r.top] }
    const o = probe(0, 0), a = probe(1000, 0), b = probe(0, 1000)
    const ax = (a[0] - o[0]) / 1000, ay = (a[1] - o[1]) / 1000, bx = (b[0] - o[0]) / 1000, by = (b[1] - o[1]) / 1000, det = ax * by - bx * ay
    return (X, Y) => { const dx = X - o[0], dy = Y - o[1]; return [(dx * by - bx * dy) / det, (ax * dy - dx * ay) / det] }
  }
  const down = (e, id) => {
    if (e.button !== undefined && e.button !== 0) return
    const map = mapper(), [lx, ly] = map(e.clientX, e.clientY), [ix, iy] = cellXY(cells[id])
    st.current = { id, map, ox: lx - ix, oy: ly - iy, sx: e.clientX, sy: e.clientY, on: false, pid: e.pointerId, el: e.currentTarget }
    // follow the pointer anywhere on the page until it's let go
    const mv = (ev) => move(ev), fin = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', fin); window.removeEventListener('pointercancel', fin); up() }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', fin); window.addEventListener('pointercancel', fin)
    if (T) st.current.timer = setTimeout(() => { const s = st.current; if (!s) return; s.on = true; navigator.vibrate?.(12); try { s.el.setPointerCapture(s.pid) } catch {} ; setDrag({ id, x: ix, y: iy, cell: cells[id] }) }, 380)
  }
  const move = (e) => {
    const s = st.current; if (!s) return
    const far = Math.hypot(e.clientX - s.sx, e.clientY - s.sy)
    if (!s.on) {
      if (T) { if (far > 10) { clearTimeout(s.timer); st.current = null } return }
      if (far < 5) return
      s.on = true; try { s.el.setPointerCapture(s.pid) } catch {}
    }
    const [lx, ly] = s.map(e.clientX, e.clientY), x = lx - s.ox, y = ly - s.oy
    setDrag({ id: s.id, x, y, cell: nearest(x, y) })
  }
  const up = () => {
    const s = st.current; st.current = null; if (!s) return
    clearTimeout(s.timer)
    if (!s.on) return
    justDragged.current = Date.now()
    setDrag((d) => {
      if (d) setCells((cs) => {
        const to = d.cell, from = cs[d.id], other = Object.keys(cs).find((k) => k !== d.id && cs[k][0] === to[0] && cs[k][1] === to[1])
        return { ...cs, [d.id]: to, ...(other ? { [other]: from } : {}) }
      })
      return null
    })
  }
  const recent = () => Date.now() - justDragged.current < 350
  return <div className="desk-icons" ref={box} onClick={(e) => { if (e.target === e.currentTarget) setSel(null) }}>
    {drag && (() => { const [gx, gy] = cellXY(drag.cell); return <span className="desk-slot" style={{ left: gx, top: gy, width: cw, height: ch - 8 }}/> })()}
    {DESKTOP.map((it) => {
      const dragging = drag?.id === it.id, [x, y] = dragging ? [drag.x, drag.y] : cellXY(cells[it.id] || [0, 0])
      return <button key={it.id} className={`desk-icon${sel === it.id ? ' sel' : ''}${dragging ? ' dragging' : ''}`} style={{ left: x, top: y, width: cw }}
        onPointerDown={(e) => down(e, it.id)} onContextMenu={(e) => e.preventDefault()}
        onClick={() => { if (recent()) return; setSel(it.id); if (touch()) open(it) }} onDoubleClick={() => { if (!recent()) open(it) }}>
        {it.icon(58)}<span>{it.name}</span></button>
    })}
  </div>
}

// Nate's "Take me to …" can ask for a note or a project: picked up when the computer opens
// (window.__macOpen, if recent) or straight away if it's already open (the mac-open event)
function NateHooks({ onOpen }) {
  const ref = useRef(onOpen); ref.current = onOpen
  useEffect(() => {
    const take = () => { const x = window.__macOpen; if (!x) return; window.__macOpen = null; if (Date.now() - (x.at || 0) < 30000) window.setTimeout(() => ref.current(x), 250) }
    take(); window.addEventListener('mac-open', take); return () => window.removeEventListener('mac-open', take)
  }, [])
  return null
}
// the dock lives in App; it calls these through a window event so the dock markup can stay there
function DockHooks({ onOpen }) {
  const ref = useRef(onOpen); ref.current = onOpen
  useEffect(() => {
    const h = (e) => ref.current(e.detail)
    window.addEventListener('mac-dock', h); return () => window.removeEventListener('mac-dock', h)
  }, [])
  return null
}

// marks the desktop as a touch one (bigger text in windows and labels)
function TouchFlag() {
  useEffect(() => { const el = document.querySelector('.mac-desktop'); el?.classList.add('is-touch'); return () => el?.classList.remove('is-touch') }, [])
  return null
}
