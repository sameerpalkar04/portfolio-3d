import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import OfficeScene from './OfficeScene'
import Loader from './Loader'

// Songs on the speaker: add your picks here as { title, artist, link? }.
const songs = []

function Playlist() {
  if (!songs.length) return <><p>A few songs I keep on repeat while I work.</p><p className="note">The playlist is being put together. Check back soon.</p></>
  return <><p>A few songs I keep on repeat while I work.</p><ol className="playlist">{songs.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.artist}</span>{s.link && <a href={s.link} target="_blank" rel="noreferrer">listen ↗</a>}</li>)}</ol></>
}

// Résumé download: shown only once a /resume.pdf is actually in the public folder.
function ResumeLink() {
  const [ok, setOk] = useState(false)
  useEffect(() => { fetch('/resume.pdf', { method: 'HEAD' }).then((r) => setOk(r.ok && (r.headers.get('content-type') || '').includes('pdf'))).catch(() => {}) }, [])
  return ok ? <a className="mail-link" href="/resume.pdf" download="Sameer-Palkar-Resume.pdf">Download résumé (PDF) <Arrow dir="down" size={13}/></a> : <p className="note">A complete resume can be shared on request.</p>
}

const apps = [
  { id: 'about', label: 'About Me', icon: '👤', title: 'A little about me', body: <><p className="lead">Hi, I’m Sameer Palkar.</p><p>I’m a computer science student and builder who enjoys turning thoughtful ideas into useful, polished software.</p><div className="info-grid"><span>Based in</span><b>Bengaluru, India</b><span>Education</span><b>B.Tech, Computer Science · VIT Vellore</b><span>Graduating</span><b>August 2026</b></div></> },
  { id: 'projects', label: 'Projects', icon: '🗂️', title: 'Selected projects', body: <div className="project-list"><article><b>Full‑stack products</b><p>Responsive web applications, thoughtfully designed from interface through backend.</p></article><article><b>Applied AI experiments</b><p>Practical explorations that connect modern ML capabilities to real workflows.</p></article><article><b>Systems & tools</b><p>Small utilities and developer tools built to make everyday work simpler.</p></article></div> },
  { id: 'resume', label: 'Resume', icon: '📄', title: 'Experience & education', body: <><div className="timeline"><span>2022 — 2026</span><div><b>B.Tech in Computer Science</b><p>Vellore Institute of Technology · Vellore, India</p></div></div><div className="timeline"><span>Now</span><div><b>Building, learning, and looking ahead</b><p>Interested in software engineering, backend systems, and applied AI.</p></div></div><ResumeLink/></> },
  { id: 'skills', label: 'Skills', icon: '🧰', title: 'Tools I work with', body: <><p>From shaping an idea to shipping it, these are some of the tools in my kit.</p><div className="skill-pills">{['Java','Python','C++','JavaScript','TypeScript','React','Node.js','Spring Boot','FastAPI','SQL','Docker','Kubernetes','Git','Figma','AI / ML'].map((x) => <span key={x}>{x}</span>)}</div></> },
  { id: 'photos', label: 'Photos', icon: '📷', title: 'Through my lens', body: <><p>Some of the places and moments I’ve photographed.</p><p className="note">The gallery is being put together. Check back soon.</p></> },
  { id: 'music', label: 'Music', icon: '🎧', title: 'On my speaker', body: <Playlist/> },
  { id: 'contact', label: 'Contact', icon: '✉️', title: 'Let’s make something', body: <><p className="lead">Have an interesting idea or opportunity?</p><p>I’d love to hear about it. The best way to reach me is by email.</p><a className="mail-link" href="mailto:palkarsameer04@gmail.com">palkarsameer04@gmail.com ↗</a><a className="mail-link" href="https://www.linkedin.com/in/sameer-palkar-9707b9286/" target="_blank" rel="noreferrer">LinkedIn · Sameer Palkar ↗</a><a className="mail-link" href="https://github.com/sameerpalkar04" target="_blank" rel="noreferrer">GitHub · sameerpalkar04 ↗</a><p className="note">Bengaluru · India</p></> },
]

function TrafficLights({ onClose }) { return <div className="traffic-lights" aria-label="Window controls"><button className="light red" onClick={onClose} aria-label="Close"/><button className="light yellow" aria-label="Minimize"/><button className="light green" aria-label="Zoom"/></div> }


// Name intro: pops up large in the middle, then settles into the bottom-left corner.
function NameTag({ phase }) {
  // The name is drawn at its big size (so it stays sharp) and scaled down into the corner.
  // A hidden copy at corner size holds the layout. The move to the corner is one eased transform.
  const holderRef = useRef(null), bigRef = useRef(null)
  const [geo, setGeo] = useState(null)
  useLayoutEffect(() => {
    const measure = () => {
      const holder = holderRef.current, big = bigRef.current; if (!holder || !big) return
      const wrap = holder.parentElement
      const left = wrap.offsetLeft + holder.offsetLeft, top = wrap.offsetTop + holder.offsetTop
      const W = big.offsetWidth, H = big.offsetHeight
      const k = holder.offsetWidth / W
      setGeo({ k, x: window.innerWidth / 2 - W / 2 - left, y: window.innerHeight / 2 - H / 2 - top })
    }
    measure()
    document.fonts?.ready.then(measure) // the web font changes the width once it loads
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const inCenter = phase === 'center'
  const fontSize = Math.min(128, Math.max(46, window.innerWidth * .09))
  return <>
    <AnimatePresence>
      {inCenter && <motion.div key="scrim" className="name-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .9 } }} transition={{ duration: .6 }}/>}
    </AnimatePresence>
    <div className="name-tag is-corner">
      <h1 ref={holderRef} className="name-holder" aria-hidden="true">Sameer Palkar</h1>
      <motion.h1 ref={bigRef} className="name-big" style={{ fontSize, transformOrigin: '0 0' }}
        initial={geo ? { x: geo.x, y: geo.y, scale: 1, opacity: 0 } : { opacity: 0 }}
        animate={!geo ? { opacity: 0 } : inCenter ? { x: geo.x, y: geo.y, scale: 1, opacity: 1 } : { x: 0, y: 0, scale: geo.k, opacity: 1 }}
        transition={inCenter ? { opacity: { duration: .6 }, default: { duration: 0 } } : { duration: 1.15, ease: [.65, 0, .35, 1] }}>Sameer Palkar</motion.h1>
      <motion.p initial={{ opacity: 0, y: 4 }} animate={inCenter ? { opacity: 0, y: 4 } : { opacity: 1, y: 0 }} transition={{ delay: inCenter ? 0 : 1.1, duration: .45 }}>software engineer · bengaluru</motion.p>
    </div>
  </>
}

// Time of day: six named stops along one slider. The value 0…5 maps to an hour of the day.
const PHASES = [['Sunrise', 6], ['Morning', 9], ['Afternoon', 14], ['Sunset', 18], ['Evening', 20.5], ['Night', 23.5]]
const sliderToHour = (v) => { const i = Math.min(4, Math.floor(v)), t = v - i; return PHASES[i][1] + (PHASES[i + 1][1] - PHASES[i][1]) * t }
const hourToSlider = (h) => {
  if (h < 6) h += 24
  if (h >= 23.5) return 5
  for (let i = 0; i < 5; i++) if (h <= PHASES[i + 1][1]) return i + (h - PHASES[i][1]) / (PHASES[i + 1][1] - PHASES[i][1])
  return 5
}
const systemHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 }
const isDark = (h) => h < 6.3 || h >= 18.6
const clock = (h) => { const hh = Math.floor(((h % 24) + 24) % 24), mm = Math.round((h % 1) * 60 / 15) * 15; const d = new Date(); d.setHours(hh, mm % 60); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }

// Arrows drawn as SVG so phones never swap them for emoji.
const Arrow = ({ dir = 'right', size = 14 }) => <svg className="arrow-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${{ right: 0, down: 90, left: 180, up: 270 }[dir]}deg)` }} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
const SunIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>
const MoonIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>

// Explorable spots in the room and what each one opens.
export const SPOTS = [
  { id: 'about', object: 'Books', opens: 'About me' },
  { id: 'projects', object: 'Computer', opens: 'Projects' },
  { id: 'resume', object: 'Files', opens: 'Résumé' },
  { id: 'music', object: 'Speaker', opens: 'Song picks' },
  { id: 'contact', object: 'Phone', opens: 'Contact' },
]
// Explorable but without a shortcut in the bar.
const ALL_SPOTS = [...SPOTS, { id: 'photos', object: 'Camera', opens: 'Through my lens' }]

// A slider built from plain elements so dragging works the same with a mouse, a finger or a pen
// (the native range input fights with touch scrolling on phones). Arrow keys also work.
function TimeSlider({ value, onChange }) {
  const track = useRef(null)
  const set = (clientX) => { const r = track.current.getBoundingClientRect(); onChange(Math.min(5, Math.max(0, (clientX - r.left) / r.width * 5))) }
  return <div ref={track} className="tslider" role="slider" tabIndex={0} aria-label="Time of day" aria-valuemin={0} aria-valuemax={5} aria-valuenow={+value.toFixed(2)}
    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX) }}
    onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e.clientX) }}
    onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); onChange(Math.min(5, Math.max(0, value + (e.key === 'ArrowRight' ? .1 : -.1)))) } }}>
    <span className="tslider-rail"><i style={{ width: `calc(17px + (100% - 34px) * ${value / 5})` }}/></span>
    <span className="tslider-thumb" style={{ left: `calc(17px + (100% - 34px) * ${value / 5})` }}/>
  </div>
}

function TimePanel({ hour, auto, onHour, onAuto }) {
  const value = hourToSlider(hour)
  // in auto mode show the real system time, kept current
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 5000); return () => window.clearInterval(t) }, [])
  const systemTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const phase = PHASES[Math.min(5, Math.round(value))][0]
  return <div className="bar-panel time-panel" role="dialog" aria-label="Time of day">
    <div className="panel-head"><b>{phase}</b><span>{auto ? `auto · ${systemTime}` : clock(hour)}</span></div>
    <div className="time-row">
      <TimeSlider value={value} onChange={(v) => onHour(sliderToHour(v))}/>
      <button className={`auto-btn${auto ? ' on' : ''}`} onClick={onAuto} aria-pressed={auto} title="Follow your clock">Auto</button>
    </div>
    <div className="time-ticks">{PHASES.map(([name], i) => <button key={name} className={Math.round(value) === i ? 'on' : ''} onClick={() => onHour(PHASES[i][1])}>{name}</button>)}</div>
  </div>
}

function HelpPanel() {
  const touch = isTouch()
  return <div className="bar-panel help-panel" role="dialog" aria-label="Instructions">
    <h4>Moving around</h4>
    {touch
      ? <ul><li><span className="keys"><kbd><Arrow dir="up" size={12}/></kbd><kbd><Arrow dir="down" size={12}/></kbd></span>tap to walk forward / back</li><li><span className="keys"><kbd><Arrow dir="left" size={12}/></kbd><kbd><Arrow dir="right" size={12}/></kbd></span>tap to turn</li><li><span className="keys">drag</span>look around</li><li><span className="keys">pinch</span>zoom</li></ul>
      : <ul><li><span className="keys"><kbd><Arrow dir="up" size={12}/></kbd><kbd><Arrow dir="down" size={12}/></kbd></span>walk forward / back</li><li><span className="keys"><kbd><Arrow dir="left" size={12}/></kbd><kbd><Arrow dir="right" size={12}/></kbd></span>turn left / right</li><li><span className="keys">drag</span>look around</li><li><span className="keys">scroll</span>zoom in / out</li><li><span className="keys"><kbd>↵</kbd></span>open what you're facing</li><li><span className="keys"><kbd>⌫</kbd></span>close it again</li></ul>}
    <h4>Things to explore</h4>
    <ul className="explore">{ALL_SPOTS.map((s) => <li key={s.id}><b>{s.object}</b><span>{s.opens}</span></li>)}</ul>
    <p>Walk up to one of them, or use the shortcuts in the bar to go straight there.</p>
  </div>
}

// All controls live in one plain bar along the bottom: time of day, instructions, shortcuts.
function BottomBar({ hour, auto, onHour, onAuto, hotspot, onGo, onOpen, interacting, onBack }) {
  const [panel, setPanel] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    if (!panel) return undefined
    const close = (e) => { if (!(ref.current?.contains(e.target) || e.target.closest?.('.hud-dock'))) setPanel(null) }
    const esc = (e) => { if (e.key === 'Escape') setPanel(null) }
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', esc) }
  }, [panel])
  const toggle = (name) => setPanel((p) => (p === name ? null : name))
  const here = ALL_SPOTS.find((s) => s.id === hotspot)
  // Phones: the bar folds away into one menu button so the room gets the screen.
  // Only the action that matters right now (INTERACT / BACK TO ROOM) floats beside it.
  const compact = isTouch()
  const [open, setOpen] = useState(false)
  useEffect(() => { if (interacting) setOpen(false) }, [interacting])
  if (compact && !open) return <motion.div key="fabs" className="touch-fabs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
    <AnimatePresence>
      {interacting
        ? <motion.button key="back" className="fab-action" onClick={onBack} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }}><Arrow dir="left"/> BACK TO ROOM</motion.button>
        : here && <motion.button key="interact" className="fab-action" onClick={onOpen} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }}>INTERACT <Arrow/></motion.button>}
    </AnimatePresence>
    <button className="fab-menu" onClick={() => setOpen(true)} aria-label="Open menu">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </motion.div>
  return <motion.div key="dock" ref={ref} className={`hud-dock${compact ? ' is-sheet' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [.2, .8, .2, 1] }}>
    {panel === 'time' && <TimePanel hour={hour} auto={auto} onHour={onHour} onAuto={onAuto}/>}
    {panel === 'help' && <HelpPanel/>}
    <nav className="bottom-bar" aria-label="Controls">
      <div className="bar-section sec-time">
        <button className={`bar-icon ${isDark(hour) ? 'is-night' : 'is-day'}${panel === 'time' ? ' open' : ''}`} onClick={() => toggle('time')} aria-expanded={panel === 'time'} title="Time of day">{isDark(hour) ? <MoonIcon/> : <SunIcon/>}</button>
      </div>
      <div className="bar-section sec-help">
        <button className={`bar-btn${panel === 'help' ? ' on' : ''}`} onClick={() => toggle('help')} aria-expanded={panel === 'help'}>Instructions</button>
      </div>
      <div className="bar-section sec-spots" role="group" aria-label="Go to">
        <div className="bar-spots">
          {SPOTS.map((s) => <button key={s.id} className={hotspot === s.id ? 'here' : ''} onClick={() => { setPanel(null); setOpen(false); onGo(s.id) }} title={`Go to the ${s.object.toLowerCase()} · ${s.opens}`}>{s.object}</button>)}
        </div>
        {compact
          ? <button className="bar-open is-close" onClick={() => { setPanel(null); setOpen(false) }} aria-label="Close menu"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg> CLOSE</button>
          : interacting
          ? <button className="bar-open is-back" onClick={onBack} title="Back to the room"><Arrow dir="left"/> BACK TO ROOM</button>
          : <button className="bar-open" onClick={onOpen} disabled={!here} title={here ? `Open ${here.opens.toLowerCase()}` : 'Walk up to something first'}>INTERACT <Arrow/></button>}
      </div>
    </nav>
  </motion.div>
}

// First-time cue: "drag to look" on laptops (gone on hover), "use the arrows" on phones (gone on touch).
const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
// A cue for whatever the visitor is standing at: what it is and what it opens.
const SVG = (d) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const CUES = {
  about: { name: 'the books', does: 'read about me', icon: SVG(<><path d="M4 5.5c2.5-1 5-1 8 1 3-2 5.5-2 8-1V19c-2.5-1-5-1-8 1-3-2-5.5-2-8-1z"/><path d="M12 6.5V20"/></>) },
  projects: { name: 'the computer', does: 'see my projects', icon: SVG(<><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/></>) },
  resume: { name: 'the files', does: 'view my résumé', icon: SVG(<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>) },
  music: { name: 'the speaker', does: 'hear my song picks', icon: SVG(<><rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="7.5" r="1"/></>) },
  contact: { name: 'the phone', does: 'get in touch', icon: SVG(<><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></>) },
  photos: { name: 'the camera', does: 'see through my lens', icon: SVG(<><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.3" r="3.4"/></>) },
}
function SpotCue({ id }) {
  const touch = isTouch(), cue = CUES[id]
  if (!cue) return null
  return <motion.div className={`look-cue cam-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .35 }}>
    <span className="cue-cam">{cue.icon}</span>
    <span className="cue-text"><b>Interact with {cue.name}</b><small>{touch ? `Tap the Interact button to ${cue.does}` : `Press the Interact button or ↵ to ${cue.does}`}</small></span>
  </motion.div>
}

// Shown once at the start, after the look-around cue: what there is to find in the room.
function ExploreCue({ onDismiss }) {
  const touch = isTouch()
  useEffect(() => {
    const dismiss = () => onDismiss()
    const events = touch ? ['touchstart', 'pointerdown'] : ['pointermove']
    const t = window.setTimeout(() => events.forEach((e) => window.addEventListener(e, dismiss, { once: true, passive: true })), 1400)
    return () => { window.clearTimeout(t); events.forEach((e) => window.removeEventListener(e, dismiss)) }
  }, [onDismiss, touch])
  return <motion.div className={`look-cue explore-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
    <b>Things to explore</b>
    <ul>{ALL_SPOTS.map((s) => <li key={s.id}><span>{s.object}</span><small>{s.opens}</small></li>)}</ul>
    <small className="explore-foot">{touch ? 'Walk up to one, or use the menu to go straight there' : 'Walk up to one, or use the shortcuts in the bar'}</small>
  </motion.div>
}

function LookCue({ onDismiss }) {
  const touch = isTouch()
  useEffect(() => {
    const dismiss = () => onDismiss()
    const events = touch ? ['touchstart', 'pointerdown'] : ['pointermove']
    // give it a moment on screen before hovering can clear it
    const t = window.setTimeout(() => events.forEach((e) => window.addEventListener(e, dismiss, { once: true, passive: true })), 900)
    return () => { window.clearTimeout(t); events.forEach((e) => window.removeEventListener(e, dismiss)) }
  }, [onDismiss, touch])
  return <motion.div className={`look-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
    {touch
      ? <><span className="cue-arrows"><i><Arrow dir="up" size={12}/></i><i><Arrow dir="left" size={12}/></i><i><Arrow dir="down" size={12}/></i><i><Arrow dir="right" size={12}/></i></span><b>tap the arrows to move</b><small>drag to look around</small></>
      : <><span className="cue-mouse"><i/></span><b>drag to look around</b><small>arrow keys to walk</small></>}
  </motion.div>
}

// The iPhone on the desk: wakes up to a lock screen whose notifications are the ways to reach me.
const CONTACTS = [
  { app: 'Mail', href: 'mailto:palkarsameer04@gmail.com', title: 'Email me', body: 'palkarsameer04@gmail.com', tile: '#1a82fb',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg> },
  { app: 'LinkedIn', href: 'https://www.linkedin.com/in/sameer-palkar-9707b9286/', title: 'Sameer Palkar', body: 'Let’s connect on LinkedIn', tile: '#0a66c2',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M5.3 8.6h3v10h-3zM6.8 4.3a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10.2 8.6h2.9V10c.4-.8 1.4-1.6 3-1.6 3.1 0 3.7 2 3.7 4.7v5.5h-3v-4.9c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6v5h-3.1z"/></svg> },
  { app: 'GitHub', href: 'https://github.com/sameerpalkar04', title: 'sameerpalkar04', body: 'See what I’m building on GitHub', tile: '#1b1f24',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 2.5a9.6 9.6 0 0 0-3 18.7c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.2-1.2-3.2-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.8 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.6 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.4.2 2.3.1 2.6.6.7 1 1.6 1 2.6 0 3.7-2.3 4.6-4.4 4.8.3.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A9.6 9.6 0 0 0 12 2.5z"/></svg> },
]
function PhoneScreen({ onClose, getRect }) {
  const [now, setNow] = useState(new Date())
  const [rect, setRect] = useState(null)
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 15000); return () => window.clearInterval(t) }, [])
  // Follow the phone's screen in the 3D view (it appears once the camera has settled over it).
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = getRect()
      setRect((prev) => (!r ? null : prev && Math.abs(prev.left - r.left) + Math.abs(prev.top - r.top) + Math.abs(prev.width - r.width) < 1 ? prev : r))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M$/i, '')
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return <motion.div className="phone-overlay" onClick={onClose} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <div className="phone-live" onClick={(e) => e.stopPropagation()} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: rect.radius }}>
      <motion.div className="phone-wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1, duration: .6 }}/>
      <div className="phone-island"/>
      <motion.div className="phone-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3, duration: .4 }}>
        <div className="phone-status"><span>{time}</span><span className="phone-sys"><svg viewBox="0 0 18 12" width="17" height="11" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12" width="24" height="11" fill="none" stroke="currentColor"><rect x=".5" y=".5" width="22" height="11" rx="3.2"/><rect x="2.5" y="2.5" width="16" height="7" rx="1.6" fill="currentColor" stroke="none"/><path d="M24.5 4v4" strokeWidth="1.5" strokeLinecap="round"/></svg></span></div>
        <div className="phone-clock"><span>{date}</span><b>{time}</b></div>
      </motion.div>
      <div className="phone-notes">
        {CONTACTS.map((c, i) => <motion.a key={c.app} className="phone-note" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55 + i * .12, duration: .45, ease: [.2, .8, .2, 1] }}>
          <span className="note-icon" style={{ background: c.tile }}>{c.icon}</span>
          <span className="note-text"><span className="note-head"><b>{c.app}</b><small>{i === 0 ? 'now' : `${i * 3}m ago`}</small></span><strong>{c.title}</strong><span>{c.body}</span></span>
        </motion.a>)}
      </div>
      <div className="phone-home"/>
    </div>}
  </motion.div>
}

// Phone turning from upright to sideways: an upright phone, a dashed sideways outline and a curved arrow.
const RotateIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <rect x="3" y="7.5" width="8.5" height="13.5" rx="1.8"/><path d="M6.4 18.6h1.7"/>
  <rect x="13.2" y="12.5" width="8.5" height="6.5" rx="1.5" strokeDasharray="2 1.7" opacity=".5"/>
  <path d="M7.5 4.6a8.3 8.3 0 0 1 11.4 5.3"/><path d="m16.9 8.6 2.1 1.6 1.2-2.4"/>
</svg>
// The open book on the cabinet: once the camera settles over it, the pages about me appear on it.
// Two spreads (four pages): sketch + intro with an index, then work experience + education.
// ← → buttons (and arrow keys) turn pages. On an upright phone the book is shown sideways.
const BOOK_INDEX = [['About me', 2, 0], ['Work experience', 3, 1], ['Education', 4, 1]]
const bookSpread = (page, goTo) => page === 0 ? [
  <section className="book-page left sketch-page" key="l0">
    <img className="book-sketch" src="/about/sameer-sketch.png?v=3" alt="Pencil sketch of Sameer Palkar" draggable="false"/>
    <span className="folio">1</span>
  </section>,
  <section className="book-page right" key="r0">
    <small>chapter one</small>
    <h2>Hi, I’m Sameer.</h2>
    <p className="lede">I’m a software engineer working across backend development, full‑stack technologies, and artificial intelligence. I build scalable applications, solve complex problems, and explore new technologies to develop efficient and practical solutions for real‑world challenges.</p>
    <nav className="book-index" aria-label="Contents">
      <span className="book-index-title">Contents</span>
      {BOOK_INDEX.map(([label, n, spread]) => <button key={label} onClick={(e) => { e.stopPropagation(); goTo(spread) }}><span>{label}</span><i/><b>{n}</b></button>)}
    </nav>
    <span className="folio">2</span>
  </section>,
] : [
  <section className="book-page left edu-page" key="l1">
    <small>chapter two</small>
    <h3>Work experience</h3>
    <article className="edu exp">
      <img src="/about/oracle-tile.png" alt="Oracle logo" draggable="false"/>
      <div>
        <b>Application Software Engineer 1</b>
        <span>Oracle Financial Services Software Ltd.</span>
        <span className="edu-meta">August 2026 – Present</span>
        {/* description goes here */}
        <div className="exp-desc"/>
      </div>
    </article>
    <span className="folio">3</span>
  </section>,
  <section className="book-page right edu-page" key="r1">
    <small>chapter three</small>
    <h3>Education</h3>
    <article className="edu">
      <img src="/about/vit-crest.png" alt="Vellore Institute of Technology crest" draggable="false"/>
      <div>
        <b>Vellore Institute of Technology, Vellore</b>
        <span className="edu-meta">September 2022 – August 2026</span>
        <span className="degree">Bachelor of Technology · Computer Science &amp; Engineering <em className="cgpa">CGPA 9.27</em></span>
        <span className="edu-label">Relevant coursework</span>
        <span className="chips">{['Database Management Systems', 'Operating Systems', 'Computer Networks', 'Data Structures & Algorithms', 'Web Programming', 'Artificial Intelligence & Machine Learning'].map((c) => <i key={c}>{c}</i>)}</span>
      </div>
    </article>
    <article className="edu">
      <img src="/about/amity-crest.png" alt="Amity International School crest" draggable="false"/>
      <div>
        <b>Amity International School, Sector 46, Gurugram</b>
        <span className="edu-meta">March 2011 – August 2022</span>
        <span>Secondary and Senior Secondary education.</span>
        <span className="edu-note">Activities and societies: Selected among the top 300 teams across India in the Atal Tinkering Lab (ATL) Marathon 2020.</span>
      </div>
    </article>
    <span className="folio">4</span>
  </section>,
]
const BOOK_LAST = 1
function BookPages({ onClose, getRect }) {
  const [rect, setRect] = useState(null)
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  const touch = isTouch()
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = getRect()
      setRect((prev) => (!r ? null : prev && prev.rotated === r.rotated && Math.abs(prev.left - r.left) + Math.abs(prev.top - r.top) + Math.abs(prev.width - r.width) < 1 ? prev : r))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const goTo = (n) => setPage((p) => { n = Math.min(BOOK_LAST, Math.max(0, n)); if (n !== p) setDir(n > p ? 1 : -1); return n })
  const turn = (d) => setPage((p) => { const n = Math.min(BOOK_LAST, Math.max(0, p + d)); if (n !== p) setDir(d); return n })
  useEffect(() => {
    const key = (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); turn(e.key === 'ArrowRight' ? 1 : -1) } }
    window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true)
  })
  const turned = rect?.rotated
  const navBtn = (d) => {
    const label = d < 0 ? 'Previous page' : 'Next page'
    const disabled = d < 0 ? page === 0 : page === BOOK_LAST
    // sideways book: previous above it, next below it; the button is turned with the book
    // sideways book: both buttons stack bottom-left, beside the rotate cue and BACK TO ROOM
    const style = turned
      ? {}
      : { left: d < 0 ? Math.max(8, rect.left - 56 - 22) : Math.min(window.innerWidth - 64, rect.left + rect.width + 22), top: rect.top + rect.height / 2 - 28 }
    return <button className={`book-nav${touch ? ' show-tip' : ''}${turned ? ` stack-nav ${d < 0 ? 'up' : 'down'}` : ''}`} style={style} disabled={disabled} aria-label={label}
      onClick={(e) => { e.stopPropagation(); turn(d) }}>
      <Arrow dir={turned ? (d < 0 ? 'up' : 'down') : d < 0 ? 'left' : 'right'} size={20}/>
      {!turned && <span className="book-tip">{label}</span>}
    </button>
  }
  return <motion.div className="phone-overlay" onClick={onClose} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <motion.div key={turned ? 'turned' : 'flat'} className="book-live" onClick={(e) => e.stopPropagation()}
      style={turned
        ? { left: rect.left + rect.width / 2 - rect.height / 2, top: rect.top + rect.height / 2 - rect.width / 2, width: rect.height, height: rect.width, rotate: 90 }
        : { left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={page} className="book-spread"
          initial={{ opacity: 0, x: dir * 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -dir * 18 }} transition={{ duration: .22, ease: [.2, .8, .2, 1] }}>
          {bookSpread(page, goTo)}
        </motion.div>
      </AnimatePresence>
    </motion.div>}
    {rect && navBtn(-1)}{rect && navBtn(1)}
    {turned && <div className="rotate-hint"><RotateIcon/>Rotate your phone for a bigger view</div>}
  </motion.div>
}

// The iMac: a desktop with one window, my projects. Everything else lives around the room.
function PortfolioSystem({ onClose }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer) }, [])
  const selected = apps.find((app) => app.id === 'projects')
  return <motion.div className="system-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="mac-menu"><span className="apple-mark">●</span><b>Finder</b><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span><span className="menu-time">⌁ &nbsp; Wi‑Fi &nbsp; ▰ &nbsp; {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
    <div className="desktop-welcome"><span>WELCOME TO MY DIGITAL WORKSPACE</span><h2>Good to have you here.</h2><p>Here’s what I’ve been building.</p></div>
    <motion.section className="app-window single" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .22 }}>
      <header className="app-titlebar"><TrafficLights onClose={onClose}/><span>{selected.title}</span><span className="title-spacer"/></header><div className="app-body"><article className="app-copy"><span className="section-eyebrow">SAMEER PALKAR · PROJECTS</span><h3>{selected.title}</h3>{selected.body}</article></div>
    </motion.section>
  </motion.div>
}

// Files (résumé) and the speaker (song picks): a plain card over the room.
function SpotCard({ app, onClose }) {
  const a = apps.find((x) => x.id === app)
  return <motion.div className="phone-overlay spot-overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <motion.article className="spot-card" onClick={(e) => e.stopPropagation()} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: .3, ease: [.2, .8, .2, 1] }}>
      <span className="section-eyebrow">{a.label}</span><h3>{a.title}</h3>{a.body}
    </motion.article>
  </motion.div>
}

// Photos dropped into src/photos show up on the camera's screen, in name order.
const PHOTOS = Object.entries(import.meta.glob('./photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}', { eager: true, query: '?url', import: 'default' })).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url)

// The camera, picked up: photos appear on its rear screen, with buttons to step through them.
function CameraView({ onClose, getRect }) {
  const [rect, setRect] = useState(null)
  const [i, setI] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => { const r = getRect(); setRect((p) => (!r ? null : p && Math.abs(p.left - r.left) + Math.abs(p.top - r.top) + Math.abs(p.width - r.width) < 1 ? p : r)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const n = PHOTOS.length
  const step = (d) => n && setI((v) => (v + d + n) % n)
  useEffect(() => {
    const key = (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); step(-1) } if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(1) } }
    window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true)
  })
  return <motion.div className="phone-overlay" onClick={onClose} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <>
      {/* rear screen: on an upright phone the camera is turned sideways, so the picture is too */}
      <motion.div className="cam-screen" onClick={(e) => e.stopPropagation()}
        style={rect.rotated
          ? { left: rect.left + rect.width / 2 - rect.height / 2, top: rect.top + rect.height / 2 - rect.width / 2, width: rect.height, height: rect.width, rotate: 90 }
          : { left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}>
        {n ? <AnimatePresence initial={false} mode="popLayout"><motion.img key={i} src={PHOTOS[i]} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}/></AnimatePresence>
          : <div className="cam-empty"><b>No photos yet</b><span>more coming soon</span></div>}
        <span className="cam-hud">{n ? `${i + 1} / ${n}` : '0 / 0'}</span>
      </motion.div>
      {rect.rotated ? <>
        <button className="cam-nav stack-nav up" onClick={(e) => { e.stopPropagation(); step(-1) }} disabled={n < 2} aria-label="Previous photo"><Arrow dir="up" size={22}/></button>
        <button className="cam-nav stack-nav down" onClick={(e) => { e.stopPropagation(); step(1) }} disabled={n < 2} aria-label="Next photo"><Arrow dir="down" size={22}/></button>
        <div className="rotate-hint"><RotateIcon/>Rotate your phone for a bigger view</div>
      </> : <>
        <button className="cam-nav" style={{ left: Math.max(8, rect.bodyLeft - 56 - 22), top: rect.top + rect.height / 2 - 28 }} onClick={(e) => { e.stopPropagation(); step(-1) }} disabled={n < 2} aria-label="Previous photo"><Arrow dir="left" size={22}/></button>
        <button className="cam-nav" style={{ left: Math.min(window.innerWidth - 64, rect.bodyRight + 22), top: rect.top + rect.height / 2 - 28 }} onClick={(e) => { e.stopPropagation(); step(1) }} disabled={n < 2} aria-label="Next photo"><Arrow dir="right" size={22}/></button>
      </>}
    </>}
  </motion.div>
}

function MobileControls({ onKey }) {
  const control = (key) => ({
    onPointerDown: (event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); onKey(key, true) },
    onPointerUp: () => onKey(key, false),
    onPointerCancel: () => onKey(key, false),
    onLostPointerCapture: () => onKey(key, false),
  })
  return <div className="mobile-controls" aria-label="Movement controls"><div className="dpad">
    <button {...control('ArrowUp')} aria-label="Walk forward"><Arrow dir="up" size={26}/></button><button {...control('ArrowLeft')} aria-label="Turn left"><Arrow dir="left" size={26}/></button><button {...control('ArrowDown')} aria-label="Walk backward"><Arrow dir="down" size={26}/></button><button {...control('ArrowRight')} aria-label="Turn right"><Arrow dir="right" size={26}/></button>
  </div></div>
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [sceneReady, setSceneReady] = useState(false)
  const [clockHour, setClockHour] = useState(systemHour)
  const [manualHour, setManualHour] = useState(null) // null = follow the system clock
  const hour = manualHour ?? clockHour
  const [hotspot, setHotspot] = useState(null)
  const [systemOpen, setSystemOpen] = useState(false)
  const [systemApp, setSystemApp] = useState('about')
  const sceneRef = useRef(null)
  const updateHotspot = useCallback((v) => setHotspot(v), [])
  const updateSystem = useCallback((open, app) => { if (open && app) setSystemApp(app); setSystemOpen(open) }, [])
  const updateReady = useCallback(() => setSceneReady(true), [])
  const [load, setLoad] = useState({ progress: 0, loaded: 0, total: 0 })
  const updateProgress = useCallback((progress, loaded, total) => setLoad((prev) => (progress - prev.progress > .005 || progress >= 1 ? { progress, loaded, total } : prev)), [])
  const [introPhase, setIntroPhase] = useState('hidden') // hidden → center → corner
  const [showCue, setShowCue] = useState(false)
  const finishLoading = useCallback(() => {
    setLoading(false); setIntroPhase('center')
    window.setTimeout(() => setIntroPhase('corner'), 1500)
    window.setTimeout(() => setShowCue(true), 2600)
  }, [])
  // after the look-around cue goes, the list of things to explore shows once
  const [showExplore, setShowExplore] = useState(false)
  const dismissCue = useCallback(() => { setShowCue(false); window.setTimeout(() => setShowExplore(true), 450) }, [])
  const dismissExplore = useCallback(() => setShowExplore(false), [])
  const onKey = (key, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key, bubbles: true }))
  const closeSystem = () => sceneRef.current?.closeSystem()
  const getPhoneRect = useCallback(() => sceneRef.current?.phoneScreenRect() ?? null, [])
  const getCameraRect = useCallback(() => sceneRef.current?.cameraScreenRect() ?? null, [])
  const getBookRect = useCallback(() => sceneRef.current?.focusRect('about') ?? null, [])
  useEffect(() => { sceneRef.current?.setTimeOfDay(hour) }, [hour, sceneReady])
  useEffect(() => { const timer = window.setInterval(() => setClockHour(systemHour()), 60000); return () => window.clearInterval(timer) }, [])
  return <main className="app-shell"><OfficeScene sceneRef={sceneRef} onHotspot={updateHotspot} onSystem={updateSystem} onReady={updateReady} onProgress={updateProgress}/>
    <div className="ambient-vignette"/>
    <AnimatePresence>{loading && <Loader progress={load.progress} loaded={load.loaded} total={load.total} ready={sceneReady} onEnter={finishLoading}/>}</AnimatePresence>
    <AnimatePresence>{systemOpen && (systemApp === 'contact'
      ? <PhoneScreen key="phone" onClose={closeSystem} getRect={getPhoneRect}/>
      : systemApp === 'about'
      ? <BookPages key="book" onClose={closeSystem} getRect={getBookRect}/>
      : systemApp === 'photos'
      ? <CameraView key="camera" onClose={closeSystem} getRect={getCameraRect}/>
      : systemApp === 'projects'
      ? <PortfolioSystem key="system" onClose={closeSystem}/>
      : <SpotCard key={systemApp} app={systemApp} onClose={closeSystem}/>)}</AnimatePresence>
    {!loading && <div className={`office-hud${systemOpen ? ' is-interacting' : ''}`}>
      {introPhase !== 'hidden' && !systemOpen && <NameTag phase={introPhase}/>}
      {introPhase === 'corner' && <>
        <BottomBar hour={hour} auto={manualHour === null} onHour={setManualHour} onAuto={() => { setManualHour(null); setClockHour(systemHour()) }} hotspot={hotspot}
          onGo={(id) => { if (systemOpen) closeSystem(); sceneRef.current?.goTo(id) }} onOpen={() => sceneRef.current?.openSpot()}
          interacting={systemOpen} onBack={closeSystem}/>
        {isTouch() && !systemOpen && <MobileControls onKey={onKey}/>}
      </>}
      <AnimatePresence>{showCue && introPhase === 'corner' && !systemOpen && <LookCue onDismiss={dismissCue}/>}</AnimatePresence>
      <AnimatePresence>{showExplore && introPhase === 'corner' && !systemOpen && <ExploreCue key="explore" onDismiss={dismissExplore}/>}</AnimatePresence>
      <AnimatePresence>{hotspot && !showCue && !showExplore && introPhase === 'corner' && !systemOpen && <SpotCue key={hotspot} id={hotspot}/>}</AnimatePresence>
    </div>}
  </main>
}
