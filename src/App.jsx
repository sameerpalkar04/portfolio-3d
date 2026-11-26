import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import OfficeScene from './OfficeScene'
import Loader from './Loader'
import { viewW, viewH, fracAlong, phoneLandscape, setPortraitLock, isLocked } from './orientation'
import { ACHIEVEMENTS } from './achievements'
import { DesktopOS, MAC_DOCK } from './MacOS'
import { RESUME_URL, RESUME_VIEW, RESUME_DOWNLOAD, RESUME_NAME, loadResume } from './resume'
import { PLACES as NATE_PLACES } from './nate/places'
import { describeScreen } from './nate/screen'
import NateTour from './nate/NateTour'
import { ClassicSite, SwitchLoader } from './Classic'

// Songs on the speaker: add your picks here as { title, artist, link? }.
const songs = []

function Playlist() {
  if (!songs.length) return <><p>A few songs I keep on repeat while I work.</p><p className="note">The playlist is being put together. Check back soon.</p></>
  return <><p>A few songs I keep on repeat while I work.</p><ol className="playlist">{songs.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.artist}</span>{s.link && <a href={s.link} target="_blank" rel="noreferrer">listen ↗</a>}</li>)}</ol></>
}

function ResumeLink() {
  return <a className="mail-link" href={RESUME_DOWNLOAD} download={RESUME_NAME}>Download résumé (PDF) <Arrow dir="down" size={13}/></a>
}

const apps = [
  { id: 'about', label: 'About Me', icon: '👤', title: 'A little about me', body: <><p className="lead">Hi, I’m Sameer Palkar.</p><p>I’m a computer science student and builder who enjoys turning thoughtful ideas into useful, polished software.</p><div className="info-grid"><span>Based in</span><b>Bengaluru, India</b><span>Education</span><b>B.Tech, Computer Science · VIT Vellore</b><span>Graduating</span><b>August 2026</b></div></> },
  { id: 'projects', label: 'Projects', icon: '🗂️', title: 'Selected projects', body: <div className="project-list"><article><b>Full‑stack products</b><p>Responsive web applications, thoughtfully designed from interface through backend.</p></article><article><b>Applied AI experiments</b><p>Practical explorations that connect modern ML capabilities to real workflows.</p></article><article><b>Systems & tools</b><p>Small utilities and developer tools built to make everyday work simpler.</p></article></div> },
  { id: 'resume', label: 'Resume', icon: '📄', title: 'Experience & education', body: <><div className="timeline"><span>2022 — 2026</span><div><b>B.Tech in Computer Science</b><p>Vellore Institute of Technology · Vellore, India</p></div></div><div className="timeline"><span>Now</span><div><b>Building, learning, and looking ahead</b><p>Interested in software engineering, backend systems, and applied AI.</p></div></div><ResumeLink/></> },
  { id: 'skills', label: 'Skills', icon: '🧰', title: 'Tools I work with', body: <><p>From shaping an idea to shipping it, these are some of the tools in my kit.</p><div className="skill-pills">{['Java','Python','C++','JavaScript','TypeScript','React.js','Node.js','Spring Boot','FastAPI','SQL','Docker','Kubernetes','Git','Figma','AI / ML'].map((x) => <span key={x}>{x}</span>)}</div></> },
  { id: 'photos', label: 'Photos', icon: '📷', title: 'Through my lens', body: <><p>Some of the places and moments I’ve photographed.</p><p className="note">The gallery is being put together. Check back soon.</p></> },
  { id: 'music', label: 'Music', icon: '🎧', title: 'On my speaker', body: <Playlist/> },
  { id: 'contact', label: 'Contact', icon: '✉️', title: 'Let’s make something', body: <><p className="lead">Have an interesting idea or opportunity?</p><p>I’d love to hear about it. The best way to reach me is by email.</p><a className="mail-link" href="mailto:palkarsameer04@gmail.com">palkarsameer04@gmail.com ↗</a><a className="mail-link" href="https://www.linkedin.com/in/sameer-palkar-9707b9286/" target="_blank" rel="noreferrer">LinkedIn · Sameer Palkar ↗</a><a className="mail-link" href="https://github.com/sameerpalkar04" target="_blank" rel="noreferrer">GitHub · sameerpalkar04 ↗</a><p className="note">Bengaluru · India</p></> },
]

function TrafficLights({ onClose }) { return <div className="traffic-lights" aria-label="Window controls"><button className="light red" onClick={onClose} aria-label="Close"/><button className="light yellow" aria-label="Minimize"/><button className="light green" aria-label="Zoom"/></div> }


// Name intro: pops up large in the middle, then settles into the bottom-left corner.
const CITIES = ['bengaluru', 'gurugram']
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
      // scale from the two font sizes, not the measured widths: widths measured while the web font was
      // still loading (one copy in the fallback font, one in Manrope) gave a wrong, too-small scale
      const k = parseFloat(getComputedStyle(holder).fontSize) / parseFloat(getComputedStyle(big).fontSize)
      setGeo({ k, x: viewW() / 2 - W / 2 - left, y: viewH() / 2 - H / 2 - top })
    }
    measure()
    document.fonts?.ready.then(measure) // the web font changes the width once it loads
    document.fonts?.load?.("800 18px Manrope").then(measure).catch(() => {})
    const ro = new ResizeObserver(measure); if (holderRef.current) ro.observe(holderRef.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  const inCenter = phase === 'center'
  // where I'm based: Bengaluru and Gurugram take turns every 10 seconds
  const [city, setCity] = useState(0)
  useEffect(() => { const t = window.setInterval(() => setCity((c) => (c + 1) % CITIES.length), 10000); return () => window.clearInterval(t) }, [])
  const fontSize = Math.min(128, Math.max(46, viewW() * .09))
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
      <motion.p initial={{ opacity: 0, y: 4 }} animate={inCenter ? { opacity: 0, y: 4 } : { opacity: 1, y: 0 }} transition={{ delay: inCenter ? 0 : 1.1, duration: .45 }}>software engineer · <span className="nt-city"><AnimatePresence mode="wait" initial={false}><motion.span key={CITIES[city]} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .35 }}>{CITIES[city]}</motion.span></AnimatePresence></span></motion.p>
    </div>
  </>
}

// Time of day: six named stops along one slider. The value 0…5 maps to an hour of the day.
const PHASES = [['Sunrise', 6], ['Morning', 9], ['Afternoon', 14], ['Sunset', 18], ['Evening', 20.5], ['Night', 23.5]]
// one small picture per time of day, in place of its name under the slider
const PI = (d) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const PHASE_ICONS = [
  PI(<><path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M9.5 6.5 12 4l2.5 2.5M4.6 13.6l1.4 1M19.4 13.6l-1.4 1"/></>), // sunrise
  PI(<><circle cx="12" cy="12" r="3.5"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/></>), // morning
  PI(<><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></>), // afternoon
  PI(<><path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 9V4M9.5 6.5 12 9l2.5-2.5M4.6 13.6l1.4 1M19.4 13.6l-1.4 1"/></>), // sunset
  PI(<><path d="M3 19h18M16.5 15.5A5.5 5.5 0 0 1 9 8a5.5 5.5 0 1 0 7.5 7.5z"/></>), // evening
  PI(<><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/><path d="M17 3.5v3M15.5 5h3M20.5 8.5v2M19.5 9.5h2"/></>), // night
]
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
  { id: 'projects', object: 'Computer', opens: 'Projects & Certifications' },
  { id: 'achievements', object: 'Achievements', opens: 'Awards & hackathons' },
  { id: 'resume', object: 'Files', opens: 'Résumé' },
  { id: 'contact', object: 'Phone', opens: 'Contact' },
]
// Explorable but without a shortcut in the bar (the bar keeps to the professional things).
const ALL_SPOTS = [...SPOTS, { id: 'music', object: 'Speaker', opens: 'Song picks' }, { id: 'photos', object: 'Camera', opens: 'Through my lens' }, { id: 'pets', object: 'Rio & Bruno', opens: 'Pet them' }]

// A slider built from plain elements so dragging works the same with a mouse, a finger or a pen
// (the native range input fights with touch scrolling on phones). Arrow keys also work.
function TimeSlider({ value, onChange, onInput, label = 'Time of day', vertical = false }) {
  const track = useRef(null), dragging = useRef(false), raf = useRef(0), pending = useRef(null), last = useRef(null)
  // while dragging, the thumb follows the finger from local state at once; the room (an App-wide re-render and
  // the lighting) is updated at most once a frame, so a burst of pointer moves can't pile up and stall the drag
  const [drag, setDrag] = useState(null)
  const shown = drag ?? value
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const at = (clientX, clientY) => { const r = track.current.getBoundingClientRect(); return Math.min(5, Math.max(0, (vertical ? (clientY - r.top) / r.height : fracAlong(r, clientX, clientY)) * 5)) }
  const push = (v) => {
    pending.current = v
    if (!raf.current) raf.current = requestAnimationFrame(() => { raf.current = 0; if (pending.current != null) { const p = pending.current; pending.current = null; onChange(p) } })
  }
  // with onInput, a drag only reports live values (cheap) and commits once on release
  const move = (e) => { const v = at(e.clientX, e.clientY); last.current = v; setDrag(v); if (onInput) onInput(v); else push(v) }
  const end = () => {
    if (!dragging.current) return
    dragging.current = false
    if (onInput) { if (last.current != null) onChange(last.current); last.current = null; setDrag(null); return }
    if (pending.current != null) { cancelAnimationFrame(raf.current); raf.current = 0; const p = pending.current; pending.current = null; onChange(p) }
    setDrag(null)
  }
  return <div ref={track} className={`tslider${drag != null ? ' dragging' : ''}`} role="slider" tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={5} aria-valuenow={+shown.toFixed(2)}
    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* the pointer is already gone */ } dragging.current = true; move(e) }}
    onPointerMove={(e) => { if (dragging.current) move(e) }}
    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
    onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); onChange(Math.min(5, Math.max(0, value + (e.key === 'ArrowRight' ? .1 : -.1)))) } }}>
    <span className="tslider-rail"><i style={{ width: `calc(17px + (100% - 34px) * ${shown / 5})` }}/></span>
    <span className="tslider-thumb" style={{ left: `calc(17px + (100% - 34px) * ${shown / 5})` }}/>
  </div>
}

function TimePanel({ hour, auto, onHour, onAuto, children, label = 'Time of day' }) {
  // while dragging: this panel and the room's lighting follow (cheap); the rest of the site updates once, on release
  const [live, setLive] = useState(null)
  const shownHour = live ?? hour
  const value = hourToSlider(shownHour)
  // in auto mode show the real system time, kept current
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 5000); return () => window.clearInterval(t) }, [])
  const systemTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const phase = PHASES[Math.min(5, Math.round(value))][0]
  return <div className={`bar-panel time-panel${children ? ' settings-panel' : ''}`} role="dialog" aria-label={label}>
    {children && <h4>Time of day</h4>}
    <div className="panel-head"><b>{phase}</b><span>{auto && live == null ? systemTime : clock(shownHour)}</span></div>
    <div className="time-row">
      <div className="time-col">
        <TimeSlider value={value}
          onInput={(v) => { const h = sliderToHour(v); setLive(h); window.dispatchEvent(new CustomEvent('time-live', { detail: h })) }}
          onChange={(v) => { setLive(null); onHour(sliderToHour(v)) }}/>
        {/* the times of day, as plain pictures under the slider (not buttons) */}
        <div className="time-ticks" aria-hidden="true">{PHASES.map(([name], i) => <span key={name} className={`time-tick${Math.round(value) === i ? ' on' : ''}`} style={{ left: `calc(17px + (100% - 34px) * ${i / 5})` }}>{PHASE_ICONS[i]}</span>)}</div>
      </div>
      <button className={`auto-btn${auto ? ' on' : ''}`} onClick={onAuto} aria-pressed={auto} title="Follow your clock">Auto</button>
    </div>
    
    {children}
  </div>
}

function SettingsPanel({ moveMode, onMoveMode, onView, controls = true, ...time }) {
  return <TimePanel {...time} label="Settings">
    {controls && <div className="mode-switch"><h4>Controls</h4><div className="mood-seg">
      <button className={moveMode === 'joystick' ? 'on' : ''} onClick={() => onMoveMode('joystick')}>Joystick</button>
      <button className={moveMode === 'buttons' ? 'on' : ''} onClick={() => onMoveMode('buttons')}>Buttons</button>
    </div></div>}
    {/* the two ways to see the portfolio: this room, or the classic one-page version */}
    <button className="view-classic-btn" onClick={() => onView?.('classic')}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/></svg>
      View in classic 2D
    </button>
  </TimePanel>
}
function HelpPanel({ moveMode }) {
  const touch = isTouch()
  return <div className="bar-panel help-panel" role="dialog" aria-label="Instructions">
    <h4>Moving around</h4>
    {touch
      ? moveMode === 'buttons'
        ? <ul><li><span className="keys">Work</span>books, computer, files and more</li><li><span className="keys">Life</span>camera, speaker and the dogs</li><li><span className="keys">drag</span>look around</li><li><span className="keys">pinch</span>zoom</li></ul>
        : <ul><li><span className="keys">joystick</span>push up / down to walk</li><li><span className="keys">joystick</span>push left / right to turn</li><li><span className="keys">drag</span>look around</li><li><span className="keys">pinch</span>zoom</li></ul>
      : <ul><li><span className="keys"><kbd><Arrow dir="up" size={12}/></kbd><kbd><Arrow dir="down" size={12}/></kbd><em>or</em><kbd>W</kbd><kbd>S</kbd></span>walk forward / back</li><li><span className="keys"><kbd><Arrow dir="left" size={12}/></kbd><kbd><Arrow dir="right" size={12}/></kbd><em>or</em><kbd>A</kbd><kbd>D</kbd></span>turn left / right</li><li><span className="keys is-word">Drag</span>look around</li><li><span className="keys is-word">Scroll</span>zoom in / out</li><li><span className="keys"><kbd>↵</kbd></span>open what you're facing</li><li><span className="keys"><kbd>⌫</kbd></span>close it again</li></ul>}
    <h4>Things to explore</h4>
    <ul className="explore">{ALL_SPOTS.map((s) => <li key={s.id}><b>{s.object}</b><span>{s.opens}</span></li>)}</ul>
    <p>{touch && moveMode === 'buttons' ? 'Open Work or Life and pick one to go straight there.' : 'Walk up to one of them, or use the shortcuts in the bar to go straight there.'}</p>
  </div>
}

// All controls live in one plain bar along the bottom: time of day, instructions, shortcuts.
// The AI assistant button: beside the bar on a laptop, beside the menu button on a phone. The assistant
// itself isn't built yet, so for now it says so.
// Nate's mark — Sameer's exact vector (AI_Vector.svg), background dropped, drawn in white (currentColor)
const AiIcon = ({ size = 24 }) => <svg className="ai-mark" viewBox="71 65 620 620" width={size} height={size} fill="currentColor" aria-hidden="true">
  <path d="M486.123 215.332C521.833 212.842 562.937 217.38 597.654 225.704C617.628 230.492 652.297 241.686 662.712 260.127C678.24 287.634 639.579 315.391 619.6 326.488L616.814 318.535C630.321 310.345 656.436 292.143 656.277 274.63C656.123 257.413 617.793 253.353 606.012 252.647C551.781 249.401 497.928 263.42 445.736 276.367C420.172 282.825 394.516 288.935 368.787 294.697C329.548 303.48 289.887 310.253 249.958 314.991C208.984 321.555 156.614 320.284 119.749 340.707C75.7211 365.099 133.31 385.289 153.921 390.457L154.373 399.507C136.599 395.606 116.788 389.734 102.776 377.825C84.6528 362.421 91.3789 340.619 105.618 325.716C123.271 307.24 147.093 295.269 170.394 285.507C208.065 270.242 248.218 259.431 287.752 249.945C352.009 234.526 420.055 218.247 486.123 215.332Z"/>
  <path d="M444.762 88.4944C461.827 88.9444 470.007 100.363 478.843 113.252C485.382 122.79 491.181 132.836 496.992 142.829C507.033 160.09 516.824 177.492 526.37 195.031C524.968 194.35 523.547 193.703 522.114 193.092C510.077 187.93 491.977 185.311 478.616 184.353C402.697 178.912 321.243 197.876 251.26 225.781C233.278 233.278 208.357 244.305 194.051 257.094C199.661 231.964 213.197 180.974 223.527 158.813C227.581 149.888 232.813 141.546 239.083 134.011C267.365 100.427 305.424 95.9902 346.399 100.538C361.319 102.195 376.683 104.123 391.657 103.097C411.477 101.739 425.56 90.0827 444.762 88.4944Z"/>
  <path d="M223.809 331.624L224.217 331.699C224.302 332.949 219.858 338.335 218.686 340.071C190.845 381.309 196.524 435.057 227.318 473.014C230.663 477.141 238.602 483.882 237.33 489.92C233.869 506.336 228.456 522.813 223.689 538.977C241.792 532.383 260.606 522.445 278.914 517.149C281.141 516.5 302.955 525.954 307.647 527.576C314.282 529.848 321.016 531.82 327.831 533.479C354.025 539.761 380.017 539.749 406.615 536.816C395.876 545.915 382.466 559.459 373.247 570.162C368.68 570.236 364.112 570.138 359.552 569.862C329.036 567.829 306.492 561.847 278.524 549.907L227.429 571.234C220.008 574.363 206.587 580.528 199.456 582.886C197.293 583.602 194.982 583.749 192.748 583.302C189.306 582.653 186.162 580.73 184.352 577.681C183.213 575.777 182.713 573.56 182.926 571.35C183.412 566.409 188.429 550.091 190.113 544.225L204.356 494.089C186.373 471.122 175.365 448.883 170.805 419.639C166.284 390.641 170.192 359.873 187.991 335.796C199.885 334.04 211.83 332.649 223.809 331.624Z"/>
  <path d="M553.342 267.873C554.707 267.607 559.71 267.397 561.357 267.288C580.951 281.406 598.457 307.707 606.625 330.206C623.126 375.664 620.812 419.376 601.5 463.002C594.801 459.359 588.452 457.345 581.043 455.814C577.706 455.208 575.036 455.079 571.674 454.847C575.716 445.619 579.371 436.973 581.931 427.158C597.948 365.799 573.046 307.393 521.576 272.769C532.095 270.73 542.694 269.096 553.342 267.873Z"/>
  <path d="M439.931 525.28C441.86 526.15 459.917 554.554 463.352 559.049C433.453 583.847 412.353 608.309 391.81 641.465C381.56 641.306 371.129 641.379 360.864 641.355L335.25 641.287C359.182 596.485 398.588 554.432 439.931 525.28Z"/>
  <path fillRule="evenodd" d="M488.946 481.384C494.451 481.298 497.861 482.474 500.745 487.195C504.449 493.257 523.988 519.775 520.675 525.727C516.922 532.475 485.321 550.14 478.096 553.305C472.316 552.95 468.562 551.854 465.831 546.631C462.654 540.545 442.386 515.771 445.913 509.225C449.967 501.7 480.919 484.403 488.946 481.384Z M489.019 492.289C493.434 492.797 496.869 500.182 499.012 503.721C497.083 505.65 495.681 506.586 495.21 509.158C495.681 511.375 495.106 510.554 496.869 511.773C499.386 512.22 500.494 511.264 502.937 510.028C505.154 513.156 509.642 518.637 509.042 522.188C505.607 526.609 488.732 535.591 482.835 539.081C480.931 540.153 478.561 541.261 476.577 542.265C472.769 538.414 457.724 516.469 457.755 511.73C460.363 507.113 483.313 495.063 489.019 492.289Z"/>
  <path d="M519.806 576.958C519.849 580.443 517.694 585.347 519.586 589.266C520.204 590.552 512.905 595.162 510.983 596.956C493.887 612.907 504.449 642.72 528.433 642.598C535.72 642.61 542.706 639.683 547.807 634.484C552.938 629.353 555.699 622.312 555.43 615.056C555.167 607.647 551.321 599.02 545.468 594.354C542.473 591.966 540.257 591.354 536.908 588.243C535.867 585.286 536.106 580.418 538.659 578.208C539.761 577.92 540.753 577.663 541.855 578.036C552.975 581.783 559.055 587.282 565.049 596.509C566.464 598.959 568.013 602.443 568.876 605.131C572.397 615.987 571.429 627.798 566.176 637.932C560.922 647.986 551.303 656.227 540.428 659.589C529.86 662.865 518.41 661.732 508.68 656.454C499.128 651.194 492.062 642.353 489.038 631.876C481.702 606.655 494.946 584.251 519.806 576.958Z"/>
  <path d="M560.23 465.06C574.258 463.909 586.088 466.223 598.42 472.861C594.042 482.884 588.77 493.018 583.602 502.655C568.252 498.369 555.571 502 540.961 507.633C536.387 509.366 531.642 511.785 527.203 513.922C521.686 503.972 513.371 491.732 507.089 482.008C524.87 472.94 540.055 466.884 560.23 465.06Z"/>
  <path d="M466.15 355.991C489.497 354.329 491.677 372.092 491.04 390.512C490.501 405.979 492.473 418.947 473.693 424.354C449.967 425.97 448.307 408.526 448.944 389.838C449.495 373.73 447.015 362.125 466.15 355.991Z"/>
  <path d="M340.345 355.875C363.25 354.231 365.064 372.953 364.381 390.163C363.749 406.089 366.452 418.47 347.551 424.299C323.492 426.05 322.651 407.203 323.141 389.373C323.582 373.273 321.115 361.448 340.345 355.875Z"/>
  <path d="M560.659 511.901C562.208 511.95 561.553 511.681 562.661 512.599C564.529 524.931 550.801 554.401 544.347 565.956C545.235 568.668 546.35 572.373 543.564 574.185C541.304 573.603 541.818 573.548 539.884 571.668C538.102 570.548 534.832 569.201 532.867 568.362C532.383 563.978 540.147 554.744 542.474 549.993C547.911 538.904 551.291 526.548 553.165 514.461L560.659 511.901Z"/>
  <path d="M511.632 541.825C513.493 542.596 515.551 547.819 517.467 550.458C520.81 555.057 522.084 557.145 526.278 561.125C527.619 561.639 528.109 561.504 529.523 561.302C530.625 563.066 530.228 566.801 530.264 569.28C528.152 569.887 525.794 570.879 523.725 571.687C522.929 572.079 523.235 571.889 522.029 571.675C514.442 561.798 510.591 557.555 504.247 546.46L511.632 541.825Z"/>
  <path d="M529.346 571.521C532.15 571.736 533.834 571.65 536.4 572.862C538.059 575.997 533.087 578.447 533.044 584.276C533.001 590.387 537.649 591.348 537.808 594.875L535.652 595.842C517.228 598.396 517.853 576.248 529.346 571.521Z"/>
</svg>
// Nate's chat panel (UI only for now): opens above his button on the right, styled like the room's cues.
// Nate: Sameer's assistant. The App holds the conversation (it survives closing the panel) and what Nate
// can do (describe the screen, walk you somewhere, the tour); the panel just shows it.
const NateCtx = createContext(null)
// Where an answer's sources live: skills → the Skills note on the computer, a project → its page,
// an award → its certificate, anything else → its place in the room.
const PROJECT_NAMES = { 'geospatial-segmentation': 'Geospatial Segmentation', scriptsync: 'ScriptSync', mindgarden: 'Mindgarden', afterword: 'Afterword' }
function nateTarget(cites = []) {
  for (const c of cites || []) {
    const id = c.id || ''
    if (id.startsWith('skills-')) return { place: 'projects', open: { note: 'skills' }, label: 'Skills' }
    const pm = id.match(/^proj-(.+?)(?:-how|-\d+)?$/)
    if (pm) { const pid = pm[1] === 'ieee' ? 'geospatial-segmentation' : pm[1]; return PROJECT_NAMES[pid] ? { place: 'projects', open: { project: pid }, label: PROJECT_NAMES[pid] } : { place: 'projects' } }
    if (id.startsWith('award-')) { const cert = id.slice(6); return { place: 'achievements', open: { cert }, label: ACHIEVEMENTS.find((x) => x.id === cert)?.title || 'Achievements' } }
    if (c.place && NATE_PLACES[c.place]) return { place: c.place }
  }
  return null
}
// while Nate's chat is open (or a text field has focus) the keyboard is his: close-ups ignore it
const natesKeys = (e) => document.body.classList.contains('nate-open') || !!e.target?.closest?.('input,textarea,[contenteditable="true"]')
const NATE_ASKS = ['What projects has he built?', 'What’s his tech stack?', 'Where has he worked and studied?']
function NatePanel({ onClose, compact }) {
  const nate = useContext(NateCtx)
  const [text, setText] = useState('')
  const body = useRef(null), input = useRef(null)
  // Esc closes; Enter anywhere goes to Nate too (focus the box and send what's typed there), never to the room
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && e.target !== input.current && !e.target?.closest?.('button,a')) { e.preventDefault(); input.current?.focus(); input.current?.form?.requestSubmit() }
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  useEffect(() => { if (!compact) input.current?.focus() }, [compact])
  useEffect(() => { const b = body.current; if (b) b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' }) }, [nate?.messages.length, nate?.busy])
  const submit = (t) => { const v = (t ?? text).trim(); if (!v || nate?.busy) return; setText(''); nate?.send(v) }
  const empty = !nate?.messages.length
  return <motion.section className={`nate-panel${compact ? ' is-touch' : ''}`} role="dialog" aria-label="Nate, Sameer’s assistant"
    initial={{ opacity: 0, y: 14, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .97 }} transition={{ duration: .26, ease: [.2, .8, .2, 1] }}>
    <header className="nate-head">
      <span className="nate-avatar"><AiIcon size={26}/></span>
      <span className="nate-id"><b className="nate-title">Meet Nate</b><small>Yeah, the one from the Uncharted games.</small></span>
      <button className="nate-close" onClick={onClose} aria-label="Close Nate"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </header>
    <div className={`nate-body${empty ? '' : ' has-chat'}`} ref={body} aria-live="polite">
      {empty
        ? <><h3>Ask anything about <em>Sameer!</em></h3><p className="nate-hint">Or tell me where to go, like “take me to his projects”.</p></>
        : nate.messages.map((m, i) => <div key={i} className={`nate-msg ${m.role}${m.error ? ' is-error' : ''}`}>
            <p>{m.content}</p>
            {m.role === 'assistant' && !m.error && (() => {
              const links = socialsFor(m.content, nate.messages[i - 1]?.content)
              return links.length > 0 && <div className="nate-socials">{links.map((c) =>
                <a key={c.app} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ '--tile': c.tile }}>
                  <span className="nate-social-ico">{c.icon}</span>{c.app === 'Mail' ? 'Email him' : `Open ${c.app}`}<span aria-hidden="true">↗</span></a>)}</div>
            })()}
            {m.place && <button className="nate-go" onClick={() => nate.go(m.place, m.open)}>Take me to {m.label || NATE_PLACES[m.place].short} <Arrow size={13}/></button>}
          </div>)}
      {nate?.busy && <div className="nate-msg assistant typing" aria-label="Nate is typing"><i/><i/><i/></div>}
      {empty && <div className="nate-chips">{NATE_ASKS.map((q) => <button key={q} type="button" onClick={() => submit(q)}>{q}</button>)}</div>}
    </div>
    <form className="nate-input" onSubmit={(e) => { e.preventDefault(); submit() }}>
      <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a question…" aria-label="Ask Nate" enterKeyHint="send" autoComplete="off"/>
      <button type="submit" disabled={!text.trim() || nate?.busy} aria-label="Send"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>
    </form>
  </motion.section>
}
function AiButton({ compact, locked }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { if (locked) setOpen(false) }, [locked])
  useEffect(() => { const c = () => setOpen(false); window.addEventListener('nate-close', c); return () => window.removeEventListener('nate-close', c) }, [])
  // marks Nate as open, so his panel is lifted above everything else on screen
  useEffect(() => { document.body.classList.toggle('nate-open', open); return () => document.body.classList.remove('nate-open') }, [open])
  const [hover, setHover] = useState(false) // laptop only: "Ask Nate" on hover
  const touch = isTouch()
  return <div className={`ai-wrap${compact ? ' is-fab' : ''}${open ? ' is-open' : ''}${locked ? ' is-locked' : ''}`}>
    <AnimatePresence>{open && <NatePanel key="nate" compact={compact} onClose={() => setOpen(false)}/>}</AnimatePresence>
    <button className="ai-btn" disabled={locked} title={locked ? 'Finish the walkthrough first' : undefined} onClick={() => { if (locked) return; if (!open) window.dispatchEvent(new CustomEvent('bar-demo', { detail: null })) /* opening Nate closes any bar menu under it */; setOpen((o) => !o); setHover(false) }} aria-label={open ? 'Close Nate' : 'Ask Nate, my AI assistant'} aria-expanded={open}
      onPointerEnter={(e) => { if (!touch && !locked && e.pointerType === 'mouse') setHover(true) }} onPointerLeave={() => setHover(false)}>
      <AiIcon size={compact ? 34 : 32}/>
    </button>
    <AnimatePresence>{hover && !open && !touch && <motion.div key="hint" className="ai-soon ai-hint" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 3 }} transition={{ duration: .16 }}><b>Ask Nate</b></motion.div>}</AnimatePresence>
  </div>
}

// a disco ball, for the speaker's party-lights button
const DiscoIcon = ({ s = 18 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17M5 7.5h14M5 16.5h14M8.4 4.3c-1.6 4.9-1.6 10.5 0 15.4M15.6 4.3c1.6 4.9 1.6 10.5 0 15.4"/></svg>
// Phones in "buttons" mode: a menu of the fun corners (camera, speaker, the dogs)
const FUN_SPOTS = [
  { id: 'photos', label: 'Camera', sub: 'Through my lens' },
  { id: 'music', label: 'Speaker', sub: 'Songs on repeat' },
  { id: 'pets', label: 'Rio & Bruno', sub: 'Pet them' },
]
const OB = (d) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const OB_ICONS = {
  settings: OB(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
  work: OB(<><rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/></>),
  play: OB(<><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></>),
  help: OB(<><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17.2h.01"/></>),
}
// phones, buttons mode: every work spot in one list, opened from Places
function PlacesPanel({ hotspot, onGo, preview = false }) {
  return <div className="bar-panel fun-panel" role="dialog" aria-label="Places">
    <h4>Work</h4>
    {SPOTS.map((s) => <button key={s.id} className={`fun-row${hotspot === s.id ? ' here' : ''}${preview ? ' is-preview' : ''}`} disabled={preview} onClick={() => onGo(s.id)}><span className="fun-ico">{CUES[s.id]?.icon}</span><span className="fun-text"><b>{s.object}</b><small>{s.opens}</small></span>{hotspot === s.id && <small className="fun-here">You’re here</small>}</button>)}
  </div>
}
function FunPanel({ onGo, hotspot, preview = false }) {
  return <div className="bar-panel fun-panel" role="dialog" aria-label="Fun stuff">
    <h4>Off the clock</h4>
    {FUN_SPOTS.map((f) => <button key={f.id} className={`fun-row${hotspot === f.id ? ' here' : ''}${preview ? ' is-preview' : ''}`} disabled={preview} onClick={() => onGo(f.id)}><span className="fun-ico">{CUES[f.id]?.icon}</span><span className="fun-text"><b>{f.label}</b><small>{f.sub}</small></span>{hotspot === f.id && <small className="fun-here">You’re here</small>}</button>)}
  </div>
}
const BAR_FOLD = 900 // px: below this the laptop bar folds the five shortcuts into Work (keeps clear of Nate)
function BottomBar({ hour, auto, onHour, onAuto, hotspot: hotspotNow, onGo: goNow, onOpen, interacting, onBack, locked, spotsLocked = locked, workLocked = spotsLocked, playLocked = spotsLocked, teach, showDisco, disco, onDisco, buttonsMode, moveMode, onMoveMode, onView }) {
  // picking a place from the bar: until the camera gets there, the bar shows that place (not whatever
  // the camera sweeps past on the way), so only the button you chose turns black
  const [goingTo, setGoingTo] = useState(null)
  useEffect(() => { if (!goingTo) return undefined; const t = window.setTimeout(() => setGoingTo(null), 2200); return () => window.clearTimeout(t) }, [goingTo])
  // the moment the camera settles on the chosen place, hand back to the live spot (INTERACT shows straight away)
  useEffect(() => { if (goingTo && hotspotNow === goingTo) setGoingTo(null) }, [goingTo, hotspotNow])
  const onGo = (id) => { setGoingTo(id); goNow(id) }
  const hotspot = goingTo || hotspotNow
  const [panel, setPanel] = useState(null)
  const ref = useRef(null)
  // laptop: on narrower windows the five shortcuts fold into one Work button so the bar stays on one row
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < BAR_FOLD)
  useEffect(() => { const on = () => setNarrow(window.innerWidth < BAR_FOLD); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on) }, [])
  useEffect(() => { if (!narrow && panel === 'work') setPanel(null) }, [narrow, panel])
  useEffect(() => {
    if (!panel) return undefined
    const close = (e) => { if (!(ref.current?.contains(e.target) || e.target.closest?.('.hud-dock'))) setPanel(null) }
    const esc = (e) => { if (e.key === 'Escape') setPanel(null) }
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', esc) }
  }, [panel])
  const toggle = (name) => setPanel((p) => (p === name ? null : name))
  useEffect(() => { window.dispatchEvent(new CustomEvent('bar-panel', { detail: panel })) }, [panel])
  // the walkthrough's shortcut demo opens and closes panels itself
  useEffect(() => { const on = (e) => setPanel(e.detail); window.addEventListener('bar-demo', on); return () => window.removeEventListener('bar-demo', on) }, [])
  useEffect(() => { const on = (e) => setOpen(e.detail); window.addEventListener('menu-demo', on); return () => window.removeEventListener('menu-demo', on) }, [])
  // during the first-visit walkthrough only Instructions and the appearance slider work
  const here = locked || goingTo ? null : ALL_SPOTS.find((s) => s.id === hotspot)
  // Phones: the bar folds away into one menu button so the room gets the screen.
  // Only the action that matters right now (INTERACT / BACK TO ROOM) floats beside it.
  const compact = isTouch()
  const [open, setOpen] = useState(false)
  // phone: while the menu is open, the close-up controls (page / photo buttons, rotate cue) step aside
  useEffect(() => { if (buttonsMode) setOpen(false) }, [buttonsMode]) // the buttons bar has no menu to stay open
  useEffect(() => { document.body.classList.toggle('menu-open', open && !buttonsMode); return () => document.body.classList.remove('menu-open') }, [open, buttonsMode])
  useEffect(() => { if (interacting) setOpen(false) }, [interacting])
  // phones in buttons mode: the full bar stays open in the room (close-ups keep the floating buttons)
  const sheet = compact && (open || (buttonsMode && !interacting))
  if (compact && !sheet) return <motion.div key="fabs" className="touch-fabs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
    {/* one at a time: BACK TO ROOM leaves before INTERACT comes in, so the two never stack and push the column up */}
    <AnimatePresence mode="wait">
      {interacting
        ? <motion.div key="back" className="fab-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .1 } }} transition={{ duration: .18 }}>
            {showDisco && <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: .8, duration: .35 } }} exit={{ opacity: 0, transition: { duration: .15 } }} className={`fab-disco${disco ? ' on' : ''}`} onClick={onDisco} aria-pressed={disco} aria-label={disco ? 'Turn off disco lights' : 'Turn on disco lights'}><DiscoIcon s={20}/>DISCO</motion.button>}
            <button className="fab-action" onClick={onBack}><Arrow dir="left"/> BACK TO ROOM</button>
          </motion.div>
        : here && <motion.button key="interact" className="fab-action" onClick={onOpen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>INTERACT <Arrow/></motion.button>}
    </AnimatePresence>
    <AiButton compact locked={locked}/>
    {!buttonsMode && <button className={`fab-menu${spotsLocked ? ' is-locked' : ''}`} disabled={spotsLocked} onClick={() => setOpen(true)} aria-label={locked ? 'Menu (available after the walkthrough)' : 'Open menu'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>}
  </motion.div>
  const keepOpen = compact && buttonsMode && !interacting
  // phones in buttons mode: one tall row (icon over label) — time, places, personal, help — with Nate beside it
  // which tab the place you're at belongs to (it stays black while you're there)
  const atGroup = locked ? null : SPOTS.some((x) => x.id === hotspot) ? 'work' : FUN_SPOTS.some((x) => x.id === hotspot) ? 'play' : null
  if (keepOpen) return <motion.div key="onebar" ref={ref} className="hud-dock is-sheet is-buttons is-onebar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [.2, .8, .2, 1] }}>
    {panel === 'settings' && <SettingsPanel hour={hour} auto={auto} onHour={onHour} onAuto={onAuto} moveMode={moveMode} onMoveMode={(m) => { onMoveMode?.(m); setPanel(null) }} onView={(v) => { setPanel(null); onView?.(v) }}/>}
    {panel === 'help' && <HelpPanel moveMode={moveMode}/>}
    {panel === 'work' && <PlacesPanel preview={!!teach} hotspot={locked ? null : hotspot} onGo={(id) => { setPanel(null); onGo(id) }}/>}
    {panel === 'play' && <FunPanel preview={!!teach} hotspot={locked ? null : hotspot} onGo={(id) => { setPanel(null); onGo(id) }}/>}
    <div className="onebar">
      {/* INTERACT sits just above the bar and stays put; an open Work / Life / Settings card simply covers it */}
      <AnimatePresence>{here && <motion.button key="sheet-interact" className="fab-action sheet-interact" onClick={onOpen} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .2 }}>INTERACT <Arrow/></motion.button>}</AnimatePresence>
      <nav className="onebar-nav" aria-label="Controls">
        {[['work', 'Work', workLocked], ['play', 'Life', playLocked], ['settings', 'Settings', locked && teach !== 'settings'], ['help', 'Help', false]].map(([id, label, off]) =>
          <button key={id} className={`ob-btn${panel === id || (!panel && atGroup === id) ? ' on' : ''}${teach === id ? ' teach' : ''}`} onClick={() => toggle(id)} disabled={off} aria-expanded={panel === id}><span className="ob-ico">{OB_ICONS[id]}</span>{label}</button>)}
      </nav>
      <div className="ob-nate"><AiButton compact locked={locked}/></div>
    </div>
  </motion.div>
  return <motion.div key="dock" ref={ref} className={`hud-dock${compact ? ' is-sheet' : ''}${keepOpen ? ' is-buttons' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [.2, .8, .2, 1] }}>
    {panel === 'time' && <SettingsPanel hour={hour} auto={auto} onHour={onHour} onAuto={onAuto} controls={compact} moveMode={moveMode} onMoveMode={(m) => { onMoveMode?.(m); setPanel(null) }} onView={(v) => { setPanel(null); setOpen(false); onView?.(v) }}/>}
    {panel === 'help' && <HelpPanel moveMode={moveMode}/>}
    {panel === 'fun' && <FunPanel hotspot={locked ? null : hotspot} onGo={(id) => { setPanel(null); setOpen(false); onGo(id) }}/>}
    {panel === 'work' && <PlacesPanel hotspot={locked ? null : hotspot} onGo={(id) => { setPanel(null); setOpen(false); onGo(id) }}/>}
    {/* buttons mode: INTERACT only appears above the bar when you're at something */}
    <AnimatePresence>{keepOpen && here && <motion.button key="sheet-interact" className="fab-action sheet-interact" onClick={onOpen} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .2 }}>INTERACT <Arrow/></motion.button>}</AnimatePresence>
    <nav className={`bottom-bar${keepOpen ? ' has-fun' : ''}`} aria-label="Controls">
      <div className="bar-section sec-time">
        {compact
          ? <button className={`bar-btn settings-btn${panel === 'time' ? ' on' : ''}`} onClick={() => toggle('time')} disabled={locked} aria-expanded={panel === 'time'} aria-label="Settings" title="Settings">{OB_ICONS.settings}</button>
          : <button className={`bar-icon is-gear${panel === 'time' ? ' open' : ''}`} onClick={() => toggle('time')} disabled={locked} aria-expanded={panel === 'time'} aria-label="Settings" title={locked ? 'Finish the walkthrough first' : 'Settings'}>{OB_ICONS.settings}</button>}
      </div>
      <div className="bar-section sec-help">
        <button className={`bar-btn${panel === 'help' ? ' on' : ''}`} onClick={() => toggle('help')} aria-expanded={panel === 'help'}>Instructions</button>
      </div>
      {(!compact || !buttonsMode) && <div className="bar-section sec-fun">
        <button className={`bar-btn fun-btn${panel === 'fun' ? ' on' : ''}`} onClick={() => toggle('fun')} disabled={spotsLocked} aria-expanded={panel === 'fun'} title={spotsLocked ? 'Finish the walkthrough first' : 'Camera, speaker and the dogs'}>Life</button>
      </div>}
      {!compact && narrow && <div className="bar-section sec-work">
        <button className={`bar-btn fun-btn${panel === 'work' ? ' on' : ''}`} onClick={() => toggle('work')} disabled={spotsLocked} aria-expanded={panel === 'work'} title={spotsLocked ? 'Finish the walkthrough first' : 'Books, computer, achievements, files and phone'}>Work</button>
      </div>}
      <div className="bar-section sec-spots" role="group" aria-label="Go to">
        {!(narrow && !compact) && <div className="bar-spots">
          {SPOTS.map((s) => <button key={s.id} className={hotspot === s.id && !locked ? 'here' : ''} disabled={spotsLocked} onClick={() => { setPanel(null); setOpen(false); onGo(s.id) }} title={spotsLocked ? 'Finish the walkthrough first' : `Go to the ${s.object.toLowerCase()} · ${s.opens}`}>{s.object}</button>)}
        </div>}
        {keepOpen
          ? <div className="sheet-ai"><AiButton compact locked={locked}/></div>
          : compact
          ? <button className="bar-open is-close" onClick={() => { setPanel(null); setOpen(false) }} aria-label="Close menu"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg> CLOSE</button>
          : interacting
          ? <>{showDisco && <button className={`bar-open is-disco${disco ? ' on' : ''}`} onClick={onDisco} aria-pressed={disco} title={disco ? 'Turn off the disco lights' : 'Turn on the disco lights'}><DiscoIcon/> DISCO</button>}
            <button className="bar-open is-back" onClick={onBack} title="Back to the room"><Arrow dir="left"/> BACK TO ROOM</button></>
          : <button className="bar-open" onClick={onOpen} disabled={!here} title={here ? (here.id === 'pets' ? 'Pet Rio & Bruno' : `Open ${here.opens.toLowerCase()}`) : locked ? 'Finish the walkthrough first' : 'Walk up to something first'}>INTERACT <Arrow/></button>}
      </div>
    </nav>
  </motion.div>
}

// Close-ups: a click on the empty space around them goes back to the room on a laptop; on a phone stray touches
// are ignored, only the BACK TO ROOM button does that.
const backdropClose = (onClose) => (e) => { if (!isTouch()) onClose(e) }
// First-time cue: "drag to look" on laptops (gone on hover), "use the arrows" on phones (gone on touch).
const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
// A cue for whatever the visitor is standing at: what it is and what it opens.
// certificate close-up: skip ahead to the next one, or back to the whole wall (no more arrows)
const CERT_ICONS = {
  next: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"/></svg>,
  prev: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19.5 12h-14M11 6.5 5.5 12l5.5 5.5"/></svg>,
  all: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>,
}
const SVG = (d) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const CUES = {
  about: { name: 'the books', does: 'read about me', icon: SVG(<><path d="M4 5.5c2.5-1 5-1 8 1 3-2 5.5-2 8-1V19c-2.5-1-5-1-8 1-3-2-5.5-2-8-1z"/><path d="M12 6.5V20"/></>) },
  projects: { name: 'the computer', does: 'see my projects', icon: SVG(<><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/></>) },
  resume: { name: 'the files', does: 'view my résumé', icon: SVG(<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>) },
  music: { name: 'the speaker', does: 'hear my song picks', icon: SVG(<><rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="7.5" r="1"/></>) },
  achievements: { name: 'my achievements', tap: 'the certificates', does: 'view my achievements and recognitions', icon: SVG(<><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21l4.5-2.5 4.5 2.5L15 13.5"/></>) },
  contact: { name: 'the phone', does: 'get in touch', icon: SVG(<><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></>) },
  pets: { name: 'Rio & Bruno', tap: 'the dogs', does: 'pet them', icon: SVG(<><ellipse cx="12" cy="16" rx="4.2" ry="3.4"/><circle cx="6.2" cy="10.6" r="1.7"/><circle cx="9.6" cy="6.8" r="1.7"/><circle cx="14.4" cy="6.8" r="1.7"/><circle cx="17.8" cy="10.6" r="1.7"/></>) },
  photos: { name: 'the camera', does: 'see through my lens', icon: SVG(<><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.3" r="3.4"/></>) },
}
// Near the desk corner the computer and the certificates above it share a spot. Both are listed, styled
// like the other cues; the one being looked at is dark, the other grey.
function DeskCue({ hotspot }) {
  const active = hotspot === 'achievements' ? 'achievements' : hotspot === 'projects' ? 'projects' : null
  return <motion.div className={`look-cue cam-cue desk-cue${isTouch() ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .35 }}>
    {[['projects', 'Interact with the computer', 'Look towards the computer to interact with it'], ['achievements', 'Interact with the certificates', 'Look towards the wall to view achievements']].map(([id, title, hint]) =>
      <span key={id} className={`dc-row${active === id ? ' on' : ''}`}><span className="cue-cam">{CUES[id].icon}</span><span className="cue-text"><b>{title}</b><small>{hint}</small></span></span>)}
  </motion.div>
}
// Phone held sideways outside the close-ups that are meant for it: ask to turn it upright.
// Rendered outside the (possibly turned) app so it reads the right way up.
function RotateBack() {
  return createPortal(<motion.div className="rotate-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
    <div className="rotate-back-card">
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="26" width="24" height="15" rx="2.5" strokeDasharray="3 3" opacity=".5"/><rect x="27" y="5" width="15" height="25" rx="2.5"/><path d="M32.5 25.5h4"/><path d="M8 20a14 14 0 0 1 13-13"/><path d="m17.5 4.5 3.5 2.5-2.5 3.5"/></svg>
      <b>Turn your phone upright</b>
      <small>This room is best explored in portrait</small>
    </div>
  </motion.div>, document.body)
}
function SpotCue({ id }) {
  const touch = isTouch(), cue = CUES[id]
  if (!cue) return null
  return <motion.div className={`look-cue cam-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .35 }}>
    <span className="cue-cam">{cue.icon}</span>
    <span className="cue-text"><b>Interact with {cue.name}</b><small>{touch ? `Tap ${cue.tap || cue.name} or the Interact button to ${cue.does}` : `Press the Interact button or ↵ to ${cue.does}`}</small></span>
  </motion.div>
}

// Laptop walkthrough, step 3: a pointer shows the bar at work (~9 s) — Life opens its menu, a place
// shortcut walks you there — then the camera glides back to where the walkthrough started.
const DemoPointer = () => <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 3l14 8.5-6.2 1.4L9.6 19z" fill="#1d1f22" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/></svg>
function BarDemo({ sceneRef, startPose, onDone }) {
  const [ptr, setPtr] = useState(null) // {x, y, click}
  const startOpen = useRef(typeof document !== 'undefined' && !!document.querySelector('.bar-spots button')) // phones: the menu is still open from the settings step
  const touch = isTouch()
  useEffect(() => {
    let alive = true; const timers = []
    // times are real milliseconds: a quick, continuous sweep across the shortcuts, no stops on any of them
    const at = (ms, fn) => timers.push(window.setTimeout(() => { if (alive) fn() }, ms))
    const centre = (sel, nth) => { const all = document.querySelectorAll(sel), el = nth === 'last' ? all[all.length - 1] : all[0]; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width * .55, y: r.top + r.height * .6 } }
    // d: glide time in s; lin: constant speed (the sweep), else eased; jump: appear there without gliding
    const moveTo = (sel, { nth, d = .35, lin = false, jump = false } = {}) => { const c = centre(sel, nth); if (c) setPtr({ ...c, click: false, d: jump ? 0 : d, lin }) }
    const click = () => setPtr((p) => p && { ...p, click: true, d: 0 })
    const panel = (name) => window.dispatchEvent(new CustomEvent('bar-demo', { detail: name }))
    if (touch) { // phones (joystick): tap ☰, sweep across the shortcuts it shows, tap CLOSE (~3 s)
      const menu = (v) => window.dispatchEvent(new CustomEvent('menu-demo', { detail: v }))
      const open = startOpen.current, o = open ? -650 : 0 // already open after the settings step
      if (open) { menu(true); at(60, () => moveTo('.bar-spots button', { jump: true })) }
      else { moveTo('.fab-menu', { jump: true }); at(300, click); at(420, () => menu(true)); at(650, () => moveTo('.bar-spots button', { d: .3 })) }
      at(1000 + o, () => moveTo('.bar-spots button', { nth: 'last', d: .9, lin: true }))
      at(1950 + o, () => moveTo('.bar-open.is-close', { d: .3 }))
      at(2300 + o, click); at(2420 + o, () => menu(false))
      at(2600 + o, () => setPtr(null))
      at(2900 + o, onDone)
      return () => { alive = false; timers.forEach(window.clearTimeout); menu(false) }
    }
    const folded = !document.querySelector('.bar-spots button')
    if (folded) { // narrow window: the places live under Work, so open it and sweep down the list (~2.2 s)
      moveTo('.sec-work .bar-btn', { jump: true })
      at(300, click); at(400, () => panel('work'))
      at(550, () => moveTo('.fun-row', { d: .3 }))
      at(900, () => moveTo('.fun-row', { nth: 'last', d: .9, lin: true }))
      at(1900, () => { panel(null); setPtr(null) })
      at(2200, onDone)
    } else { // wide window: one sweep along the bar, Books to Phone (~1.8 s)
      moveTo('.bar-spots button', { jump: true })
      at(250, () => moveTo('.bar-spots button', { nth: 'last', d: 1.1, lin: true }))
      at(1500, () => setPtr(null))
      at(1800, onDone)
    }
    return () => { alive = false; timers.forEach(window.clearTimeout); panel(null) }
  }, [sceneRef, startPose, onDone, touch])
  return <>
    <motion.div className={`look-cue tour-cue demo-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
      <span className="tour-step">Step 4 of 5</span>
      {touch
        ? <><b>Quick access is in the menu</b><small>Tap ☰ for every spot, Life, settings and help</small></>
        : <><b>The bar takes you anywhere</b><small>Life opens the camera, speaker and dogs · the others walk you straight there</small></>}
    </motion.div>
    <AnimatePresence>{ptr && <motion.div key="ptr" className="demo-pointer" initial={{ opacity: 0, x: ptr.x, y: ptr.y }} animate={{ opacity: 1, x: ptr.x, y: ptr.y, scale: ptr.click ? .82 : 1 }} exit={{ opacity: 0 }} transition={{ x: { duration: ptr.d ?? .35, ease: ptr.lin ? 'linear' : [.45, 0, .2, 1] }, y: { duration: ptr.d ?? .35, ease: ptr.lin ? 'linear' : [.45, 0, .2, 1] }, scale: { duration: .22, ease: 'easeOut' }, opacity: { duration: .35 } }}>{touch ? <span className="demo-tap"/> : <DemoPointer/>}</motion.div>}</AnimatePresence>
  </>
}

// Walkthrough: where the settings are. The pointer opens them, they stay open for a moment, then close.
function SettingsDemo({ onDone, moveMode, n }) {
  const [ptr, setPtr] = useState(null)
  const touch = isTouch(), buttons = touch && moveMode === 'buttons'
  useEffect(() => {
    let alive = true; const timers = []
    const at = (ms, fn) => timers.push(window.setTimeout(() => { if (alive) fn() }, ms))
    const find = () => buttons ? [...document.querySelectorAll('.ob-btn')].find((b) => /settings/i.test(b.textContent)) : document.querySelector(touch ? '.settings-btn' : '.bar-icon.is-gear')
    const moveTo = (jump) => { const el = find(); if (!el) return; const r = el.getBoundingClientRect(); setPtr({ x: r.left + r.width * .55, y: r.top + r.height * .6, click: false, d: jump ? 0 : .35 }) }
    const click = () => setPtr((p) => p && { ...p, click: true, d: 0 })
    const panel = (name) => window.dispatchEvent(new CustomEvent('bar-demo', { detail: name }))
    const menu = (v) => window.dispatchEvent(new CustomEvent('menu-demo', { detail: v }))
    const sheet = touch && !buttons // phones (joystick): the settings button lives in the ☰ menu
    if (sheet) menu(true)
    at(sheet ? 450 : 150, () => moveTo(true))
    at(sheet ? 800 : 500, click)
    at(sheet ? 920 : 620, () => { panel(buttons ? 'settings' : 'time'); setPtr((p) => p && { ...p, click: false }) })
    at(sheet ? 1300 : 1000, () => setPtr(null))
    let finished = false
    at(sheet ? 2420 : 2120, () => panel(null)) // open for 1.5 s; phones: the menu stays open, the shortcuts step carries on from here
    at(sheet ? 2770 : 2470, () => { finished = true; onDone() })
    return () => { alive = false; timers.forEach(window.clearTimeout); panel(null); if (sheet && !finished) menu(false) }
  }, [onDone, touch, buttons])
  return <>
    <motion.div className={`look-cue tour-cue demo-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
      <span className="tour-step">Step {n} of 5</span>
      <b>Settings</b><small>Change the time of day, or switch between this 3D room and the classic 2D site</small>
    </motion.div>
    <AnimatePresence>{ptr && <motion.div key="ptr" className="demo-pointer" initial={{ opacity: 0, x: ptr.x, y: ptr.y }} animate={{ opacity: 1, x: ptr.x, y: ptr.y, scale: ptr.click ? .82 : 1 }} exit={{ opacity: 0 }} transition={{ x: { duration: ptr.d ?? .35, ease: [.45, 0, .2, 1] }, y: { duration: ptr.d ?? .35, ease: [.45, 0, .2, 1] }, scale: { duration: .22, ease: 'easeOut' }, opacity: { duration: .35 } }}>{touch ? <span className="demo-tap"/> : <DemoPointer/>}</motion.div>}</AnimatePresence>
  </>
}

// Shown once at the start, after the look-around cue: what there is to find in the room.
function ExploreCue({ onDismiss, total = 3 }) {
  const touch = isTouch()
  return <motion.div className={`look-cue explore-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
    <span className="tour-step">Step {total} of {total}</span>
    <b>Things to explore</b>
    <ul className="explore-rows">{ALL_SPOTS.map((s) => <li key={s.id}><span className="cue-cam">{CUES[s.id]?.icon}</span><span className="ex-name">{s.object}</span><small>{s.opens}</small></li>)}
      <li key="ai"><span className="cue-cam ex-ai"><AiIcon size={18}/></span><span className="ex-name">Ask Nate</span><small>AI assistant</small></li>
    </ul>
    <small className="explore-foot">{touch ? 'Walk up to one, or use the menu to go straight there' : 'Walk up to one, or use the shortcuts in the bar'}</small>
    <button className="tour-start" onClick={onDismiss}>Start exploring <Arrow dir="right" size={16}/></button>
  </motion.div>
}

// First-visit walkthrough: walk → look around → see what's in the room → start exploring.
// Each step waits for the visitor to actually do it.
function TourCue({ step, onDone, moveMode, mini = false }) {
  const touch = isTouch(), buttons = touch && moveMode === 'buttons'
  // phones, buttons mode, once the menu being taught opens: 'ask' (tap Work) fades 'out', then ~1 s later
  // 'close' (tap again to close it) fades in
  const [phase, setPhase] = useState('ask'), menuOpen = phase === 'close'
  useEffect(() => {
    if (buttons && (step === 'walk' || step === 'play' || step === 'settings')) {
      const want = step === 'walk' ? 'work' : step === 'play' ? 'play' : 'settings'; let seen = false, t = 0
      let swap = 0
      const onPanel = (e) => {
        if (e.detail === want) { seen = true; setPhase('out'); window.clearTimeout(swap); swap = window.setTimeout(() => setPhase((p) => (p === 'out' ? 'close' : p)), 1000) }
        else if (!e.detail && seen && !t) { window.clearTimeout(swap); setPhase('out'); t = window.setTimeout(onDone, 300) }
      }
      window.addEventListener('bar-panel', onPanel)
      return () => { window.removeEventListener('bar-panel', onPanel); window.clearTimeout(t); window.clearTimeout(swap) }
    }
    if (step === 'walk') {
      let t = 0
      const onKey = (e) => { if ((e.key.startsWith('Arrow') || (/^[wasd]$/i.test(e.key) && !e.target?.closest?.('input,textarea'))) && !t) t = window.setTimeout(onDone, 700) }
      const onJoy = () => { if (!t) t = window.setTimeout(onDone, 900) }
      const onSpot = () => { if (!t) t = window.setTimeout(onDone, 1600) }
      window.addEventListener('keydown', onKey); window.addEventListener('joystick-move', onJoy); window.addEventListener('spot-go', onSpot)
      return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('joystick-move', onJoy); window.removeEventListener('spot-go', onSpot); window.clearTimeout(t) }
    }
    if (step === 'look') {
      let down = null, moved = 0, done = false
      const onDown = (e) => { if (!e.target.closest?.('button,a,input,.bar-panel,.hud-dock')) { down = { x: e.clientX, y: e.clientY }; moved = 0 } }
      const onMove = (e) => { if (!down || done) return; moved += Math.hypot(e.clientX - down.x, e.clientY - down.y); down = { x: e.clientX, y: e.clientY }; if (moved > 18) { done = true; window.setTimeout(onDone, 300) } }
      const onUp = () => { down = null }
      window.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
      return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    }
    return undefined
  }, [step, onDone, buttons])
  const n = step === 'walk' ? 1 : step === 'play' ? 2 : step === 'settings' ? 3 : buttons ? 4 : 2
  return <motion.div className={`look-cue tour-cue${touch ? ' is-touch' : ''}${phase !== 'ask' ? ' is-open' : ''}`} initial={{ opacity: 0, y: 10 }} animate={phase === 'out' ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4, ease: 'easeOut' }}>
    <span className="tour-step">{mini ? (buttons ? `Buttons · ${n} of 2` : 'Joystick') : `Step ${n} of 5`}</span>
    {menuOpen
      ? step === 'settings'
        ? <><span className="cue-tap">{OB_ICONS.settings}</span><b>Tap Settings again to close it</b><small>Time of day, controls, and the classic 2D site</small></>
        : <><span className="cue-tap">{OB_ICONS[step === 'walk' ? 'work' : 'play']}</span><b>Tap {step === 'walk' ? 'Work' : 'Life'} again to close it</b><small>{step === 'walk' ? 'These are the places you can visit' : 'A few things from outside work'}</small></>
      : step === 'settings'
      ? <><span className="cue-tap">{OB_ICONS.settings}</span><b>Now tap Settings</b><small>Change the time of day, or switch to the classic 2D site</small></>
      : step === 'play'
      ? <><span className="cue-tap">{OB_ICONS.play}</span><b>Now tap Life</b><small>The camera, the speaker and my dogs</small></>
      : step === 'walk'
      ? buttons
        ? <><span className="cue-tap">{OB_ICONS.work}</span><b>Tap Work below</b><small>See the places you can visit</small></>
        : touch
        ? <><span className="cue-joy"><i/></span><b>Use the joystick to walk</b><small>Try it now: drag the joystick</small></>
        : <><span className="cue-keys"><span className="cue-arrows"><i><Arrow dir="up" size={12}/></i><i><Arrow dir="left" size={12}/></i><i><Arrow dir="down" size={12}/></i><i><Arrow dir="right" size={12}/></i></span><span className="cue-or">or</span><span className="cue-arrows cue-wasd"><i>W</i><i>A</i><i>S</i><i>D</i></span></span><b>Use the arrow keys or WASD to walk</b><small>Try it now: press any of them</small></>
      : <>{touch ? <span className="cue-swipe"><svg viewBox="0 0 48 24" width="48" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h36M11 7l-5 5 5 5M37 7l5 5-5 5"/><circle cx="24" cy="12" r="4.5" fill="currentColor" stroke="none"/></svg></span> : <span className="cue-mouse"><i/></span>}<b>{touch ? 'Drag on the screen to look around' : 'Click and drag to look around'}</b><small>Try it now</small></>}
  </motion.div>
}

// Phones, first thing: how do you want to get around — a joystick, or buttons that take you to each spot?
function ModeChoice({ onPick }) {
  return <motion.div className="look-cue mode-cue is-touch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
    <b>How would you like to move around?</b>
    <div className="mode-opts">
      <button onClick={() => onPick('joystick')}><span className="mode-ico joy"><i/></span><b>Joystick</b><small>Walk around freely</small></button>
      <button onClick={() => onPick('buttons')}><span className="mode-ico btns"><i/><i/><i/><i/></span><b>Buttons</b><small>Tap to go to each spot</small></button>
    </div>
  </motion.div>
}

// The iPhone on the desk: wakes up to a lock screen whose notifications are the ways to reach me.
const CONTACTS = [
  { app: 'Mail', line: 'palkarsameer04@gmail.com', href: 'mailto:palkarsameer04@gmail.com', title: 'Email me', body: 'palkarsameer04@gmail.com', tile: '#1a82fb',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg> },
  { app: 'LinkedIn', line: 'Sameer Palkar', href: 'https://www.linkedin.com/in/sameer-palkar-9707b9286/', title: 'Sameer Palkar', body: 'Let’s connect on LinkedIn', tile: '#0a66c2',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M5.3 8.6h3v10h-3zM6.8 4.3a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10.2 8.6h2.9V10c.4-.8 1.4-1.6 3-1.6 3.1 0 3.7 2 3.7 4.7v5.5h-3v-4.9c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6v5h-3.1z"/></svg> },
  { app: 'GitHub', line: 'sameerpalkar04', href: 'https://github.com/sameerpalkar04', title: 'sameerpalkar04', body: 'See what I’m building on GitHub', tile: '#1b1f24',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 2.5a9.6 9.6 0 0 0-3 18.7c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.2-1.2-3.2-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.8 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.6 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.4.2 2.3.1 2.6.6.7 1 1.6 1 2.6 0 3.7-2.3 4.6-4.4 4.8.3.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A9.6 9.6 0 0 0 12 2.5z"/></svg> },
]
// Socials Nate mentions (or the visitor asks for) become tappable buttons under his reply.
const SOCIAL_WORDS = { Mail: /\b(e-?mail|gmail|mail)\b/i, LinkedIn: /linked\s?in/i, GitHub: /git\s?hub/i }
function socialsFor(reply = '', question = '') {
  const picked = CONTACTS.filter((c) => SOCIAL_WORDS[c.app].test(reply) || SOCIAL_WORDS[c.app].test(question))
  if (picked.length) return picked
  return /\b(socials?|contact|reach|connect|get in touch|handles?)\b/i.test(question) ? CONTACTS : []
}
// Phones: a cue box sitting in the bottom bar, from the left edge to just before Nate's button, exactly as tall
// as the button (null on a laptop, or when the screen is turned sideways)
function useFabCueBox() {
  const [cueBox, setCueBox] = useState(null)
  useEffect(() => {
    if (!isTouch()) return undefined
    let raf = 0
    const place = () => {
      const nate = document.querySelector('.touch-fabs .ai-wrap'), r = nate?.getBoundingClientRect()
      if (r && r.width && !isLocked()) {
        const box = { left: 14, right: Math.round(window.innerWidth - r.left + 10), bottom: Math.round(window.innerHeight - r.bottom), height: Math.round(r.height) }
        setCueBox((b) => (b && b.right === box.right && b.bottom === box.bottom && b.height === box.height ? b : box))
      } else setCueBox(null)
      raf = requestAnimationFrame(place)
    }
    raf = requestAnimationFrame(place)
    return () => cancelAnimationFrame(raf)
  }, [])
  return cueBox
}

function PhoneScreen({ onClose, getRect }) {
  const [now, setNow] = useState(new Date()), [tapped, setTapped] = useState(false)
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
  // the cue only needs a moment: it fades out ~3.5 s after the screen appears (or on the first tap)
  // phones: the cue sits beside Nate's button in the bottom corner instead of over the phone
  const cueBox = useFabCueBox()
  const shown = !!rect
  useEffect(() => { if (!shown) return undefined; const t = window.setTimeout(() => setTapped(true), 4500); return () => window.clearTimeout(t) }, [shown])
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[AP]M$/i, '')
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  return <motion.div className="phone-overlay" onClick={backdropClose(onClose)} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <div className="phone-live" onClick={(e) => e.stopPropagation()} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: rect.radius }}>
      <motion.div className="phone-wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1, duration: .6 }}/>
      <div className="phone-island"/>
      <motion.div className="phone-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3, duration: .4 }}>
        <div className="phone-status"><span>{time}</span><span className="phone-sys"><svg viewBox="0 0 18 12" width="17" height="11" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12" width="24" height="11" fill="none" stroke="currentColor"><rect x=".5" y=".5" width="22" height="11" rx="3.2"/><rect x="2.5" y="2.5" width="16" height="7" rx="1.6" fill="currentColor" stroke="none"/><path d="M24.5 4v4" strokeWidth="1.5" strokeLinecap="round"/></svg></span></div>
        <div className="phone-clock"><span>{date}</span><b>{time}</b></div>
      </motion.div>
      <div className="phone-notes">
        {CONTACTS.map((c, i) => <motion.a key={c.app} className="phone-note" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55 + i * .12, duration: .45, ease: [.2, .8, .2, 1] }}
          onClick={() => setTapped(true)} whileHover={{ y: -1, transition: { duration: .15 } }} whileTap={{ scale: .98, transition: { duration: .1 } }}>
          <span className="note-icon" style={{ background: c.tile }}>{c.icon}</span>
          <span className="note-text"><span className="note-head"><b>{c.app}</b><small>{i === 0 ? 'now' : `${i * 3}m ago`}</small></span><span>{c.line}</span></span>
        </motion.a>)}
      </div>
      <div className="phone-home"/>
    </div>}
    {/* the same cue box as the camera and résumé: what the notifications do */}
    <AnimatePresence>{rect && !tapped && <motion.div key="note-cue" className={`look-cue cam-cue phone-cue${isTouch() ? ' is-touch' : ''}${cueBox ? ' at-fab' : ''}`} onClick={(e) => e.stopPropagation()}
      style={cueBox ? { left: cueBox.left, right: cueBox.right, bottom: cueBox.bottom, height: cueBox.height } : undefined}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 1, duration: .35 } }} exit={{ opacity: 0, y: -6, transition: { duration: .25 } }}>
      <span className="cue-cam"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="12" width="18" height="6" rx="2" opacity=".45"/><path d="M14.5 15.5v4.2l1.3-1.1 1 2.1 1-.5-1-2.1h1.7z" fill="currentColor"/></svg></span>
      <span className="cue-text"><b>{isTouch() ? 'Tap a notification to open it' : 'Click a notification to open it'}</b><small>{cueBox ? 'Email, LinkedIn or GitHub' : 'Email me, or find me on LinkedIn and GitHub'}</small></span>
    </motion.div>}</AnimatePresence>
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
const BOOK_INDEX = [['About me', 2, 0], ['Work experience', 3, 1], ['Education', 4, 1], ['Extracurriculars', 5, 2]]
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
      {BOOK_INDEX.map(([label, n, spread]) => <button key={label} onClick={(e) => { e.stopPropagation(); goTo(spread, n) }}><span>{label}</span><i/><b>{n}</b></button>)}
    </nav>
    <div className="book-langs">
      <span className="book-index-title">Spoken languages</span>
      <p>{[['English', 'Professional'], ['Hindi', 'Native'], ['Marathi', 'Native']].map(([l, lvl]) => <span key={l}>{l} <em>({lvl})</em></span>)}</p>
    </div>
    <span className="folio">2</span>
  </section>,
] : page === 1 ? [
  <section className="book-page left edu-page" key="l1">
    <small>chapter two</small>
    <h3>Work experience</h3>
    <article className="edu exp">
      <img src="/about/oracle-tile.png" alt="Oracle logo" draggable="false"/>
      <div>
        <b>Application Software Engineer 1</b>
        <span>Oracle Financial Services Software Ltd.</span>
        <span className="edu-meta">August 2026 – Present</span>
        <ul className="xc-points exp-points">
          <li>Working on Oracle’s Accounting Foundation Cloud Service (AFCS).</li>
          <li>Developing across the Data Integration Hub (DIH) and Sub Ledger Applications (SLA) modules.</li>
          <li>Implemented API test automation, making API testing faster and more reliable.</li>
        </ul>
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
] : page === 2 ? [
  <section className="book-page left edu-page xc-page" key="l2">
    <small>chapter four</small>
    <h3>Extracurriculars</h3>
    <article className="edu xc">
      <img src="/about/iste-logo.png?v=2" alt="ISTE logo" draggable="false"/>
      <div>
        <b>Indian Society for Technical Education</b>
        <span>ISTE · VIT Chapter, Vellore</span>
        <span className="xc-role"><strong>Publicity Head</strong><em>April 2024 – March 2025</em></span>
        <ul className="xc-points">
          <li>Directed publicity campaigns across platforms, driving 5,000+ student engagements.</li>
          <li>Led outreach for the Technica hackathon, coordinating a 40+ member team for seamless execution with 2,100+ participants.</li>
        </ul>
      </div>
    </article>
    <article className="edu xc xc-more">
      <div>
        <span className="xc-role"><strong>Core Committee Member</strong><em>February 2023 – April 2024</em></span>
        <ul className="xc-points">
          <li>Worked in the design and publicity domain, creating campaign visuals for the chapter&rsquo;s events.</li>
          <li>Coordinated the planning, execution and marketing of several successful chapter events.</li>
        </ul>
      </div>
    </article>
    <span className="folio">5</span>
  </section>,
  <section className="book-page right edu-page xc-page" key="r2">
    <article className="edu xc">
      <img src="/about/riviera-mark.png" alt="Riviera logo" draggable="false"/>
      <div>
        <b>Riviera 2026</b>
        <span className="xc-role"><strong>Organizer, Design &amp; Print</strong><em>February 2026</em></span>
        <span className="edu-note">The annual international sports and cultural festival of VIT Vellore, with a footfall of 40,000+.</span>
        <ul className="xc-points">
          <li>Led the digital design team for VIT&rsquo;s flagship festival of 40,000+ people.</li>
          <li>Oversaw visual content strategy, promotions and multimedia coordination.</li>
        </ul>
      </div>
    </article>
    <article className="edu xc">
      <img src="/about/riviera-mark.png" alt="Riviera logo" draggable="false"/>
      <div>
        <b>Riviera 2025</b>
        <span className="xc-role"><strong>Manager, Design &amp; Media</strong><em>February 2025</em></span>
        <span className="edu-note">The annual international sports and cultural festival of VIT Vellore, with a footfall of 40,000+.</span>
        <ul className="xc-points">
          <li>Designed social media posts, brochures and promotional material for the festival.</li>
          <li>Kept communication smooth between the design, media and organising teams.</li>
        </ul>
      </div>
    </article>
    <span className="folio">6</span>
  </section>,
] : [
  <section className="book-page left edu-page xc-page" key="l3">
    <article className="edu xc">
      <img src="/about/gravitas-logo.png?v=2" alt="graVITas logo" draggable="false"/>
      <div>
        <b>graVITas 2024</b>
        <span className="xc-role"><strong>Coordinator, Design &amp; Print</strong><em>August – September 2024</em></span>
        <span className="edu-note">The annual techno-management fest of VIT Vellore.</span>
        <ul className="xc-points">
          <li>Designed the social media posts that publicised graVITas&rsquo;24.</li>
          <li>Helped keep operations running smoothly within the design team.</li>
        </ul>
      </div>
    </article>
    <article className="edu xc">
      <img src="/about/riviera-mark.png" alt="Riviera logo" draggable="false"/>
      <div>
        <b>Riviera 2024</b>
        <span className="xc-role"><strong>Volunteer, Design &amp; Media</strong><em>February 2024</em></span>
        <span className="edu-note">The annual international sports and cultural festival of VIT Vellore, with a footfall of 40,000+.</span>
        <ul className="xc-points">
          <li>Designed social media posts and promotional creatives for Aikya, the cultural parade of Riviera.</li>
          <li>Supported the design and media team in the smooth, on-schedule execution of the parade.</li>
        </ul>
      </div>
    </article>
    <span className="folio">7</span>
  </section>,
  <section className="book-page right edu-page end-page" key="r3">
    <span className="end-mark">— fin —</span>
    <span className="end-note">Thanks for reading. Find me on the phone to say hello.</span>
    <span className="folio">8</span>
  </section>,
]
const BOOK_LAST = 3
// ← → keys, for the "use the arrows" cues
const ArrowsIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="8.5" height="10" rx="2"/><rect x="13" y="7" width="8.5" height="10" rx="2"/><path d="m7.8 10-2 2 2 2M16.2 10l2 2-2 2"/></svg>
// laptop: a cue above the bar (like the "Interact with …" ones) until the arrows are first used
const ArrowCue = ({ title, hint }) => <motion.div className="look-cue cam-cue arrow-cue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ delay: .4, duration: .35 }}>
  <span className="cue-cam"><ArrowsIcon/></span><span className="cue-text"><b>{title}</b><small>{hint}</small></span>
</motion.div>

const BOOK_PAGES = BOOK_LAST * 2 + 2
function BookPages({ onClose, getRect, setSide }) {
  const [rect, setRect] = useState(null)
  const [idx, setIdx] = useState(0) // the page (0 … 7); the spread is idx >> 1
  const [flip, setFlip] = useState(null) // a page turning over: { from (spread), dir, key }
  const touch = isTouch()
  // upright phone: one page at a time (the camera pans across the real book); laptop: the whole spread
  const solo = touch && viewH() > viewW()
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = getRect()
      setRect((prev) => (!r ? null : prev && Math.abs(prev.left - r.left) + Math.abs(prev.top - r.top) + Math.abs(prev.width - r.width) < .5 ? prev : r))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const spread = idx >> 1
  // move to page n; crossing into another spread turns a page over
  const show = (n) => setIdx((i) => {
    n = Math.min(BOOK_PAGES - 1, Math.max(0, n)); if (n === i) return i
    if (n >> 1 !== i >> 1) setFlip({ from: i >> 1, dir: n > i ? 1 : -1, key: Date.now() })
    return n
  })
  const [hint, setHint] = useState(true) // the cue goes once the pages have been turned
  const step = (d) => { setHint(false); show(solo ? idx + d : ((idx >> 1) + d) * 2) }
  const goTo = (sp, n) => show(solo && n ? n - 1 : sp * 2)
  useEffect(() => { if (solo) setSide?.(idx % 2 ? 1 : -1) }, [idx, solo, setSide])
  useEffect(() => {
    const key = (e) => { if (natesKeys(e)) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowRight' ? 1 : -1) } }
    window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true)
  })
  // phones: swipe left for the next page, right for the previous one
  const sw = useRef(null)
  const swipe = solo ? {
    onPointerDown: (e) => { sw.current = { x: e.clientX, y: e.clientY } },
    onPointerUp: (e) => { const s0 = sw.current; sw.current = null; if (!s0) return; const dx = e.clientX - s0.x, dy = e.clientY - s0.y; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1) },
    onPointerCancel: () => { sw.current = null },
  } : {}
  const first = idx === 0, last = solo ? idx === BOOK_PAGES - 1 : spread === BOOK_LAST
  const stop = (e) => e.stopPropagation()
  const navBtn = (d) => {
    const label = d < 0 ? 'Previous page' : 'Next page'
    const style = solo ? undefined : { left: d < 0 ? Math.max(8, rect.left - 56 - 22) : Math.min(viewW() - 64, rect.left + rect.width + 22), top: rect.top + rect.height / 2 - 28 }
    return <button className={`book-nav${touch && !solo ? ' show-tip' : ''}${solo ? ` solo-nav ${d < 0 ? 'prev' : 'next'}` : ''}`} style={style} disabled={d < 0 ? first : last} aria-label={label}
      onClick={(e) => { stop(e); step(d) }}>
      <Arrow dir={d < 0 ? 'left' : 'right'} size={20}/>
      {!solo && <span className="book-tip">{label}</span>}
    </button>
  }
  // the page turning over: forward, the old right page swings over to become the new left one; back, the reverse
  const leaf = flip && (() => {
    const old = bookSpread(flip.from, goTo), now = bookSpread(spread, goTo)
    const fwd = flip.dir > 0
    return <motion.div key={flip.key} className={`book-leaf ${fwd ? 'fwd' : 'back'}`} initial={{ rotateY: 0 }} animate={{ rotateY: fwd ? -180 : 180 }}
      transition={{ duration: .8, ease: [.4, .1, .25, 1] }} onAnimationComplete={() => setFlip((f) => (f && f.key === flip.key ? null : f))}>
      <div className="leaf-face front">{fwd ? old[1] : old[0]}</div>
      <div className="leaf-face back">{fwd ? now[0] : now[1]}</div>
    </motion.div>
  })()
  // under a turning page, the half it's leaving still shows the old spread until it has gone over
  const base = bookSpread(spread, goTo)
  const under = flip ? (() => { const old = bookSpread(flip.from, goTo); return flip.dir > 0 ? [old[0], base[1]] : [base[0], old[1]] })() : base
  return <motion.div className="phone-overlay" onClick={backdropClose(onClose)} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <AnimatePresence>{!solo && rect && hint && <ArrowCue key="arrows" title="Use the arrows to turn the pages" hint="Click ← → or press the arrow keys"/>}</AnimatePresence>
    <AnimatePresence>{solo && rect && hint && <motion.div key="book-cue" className="look-cue cam-cue is-touch book-cue" onClick={stop} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ delay: .3, duration: .35 }}>
      <span className="cue-cam"><SwipeIcon/></span>
      <span className="cue-text"><b>Turn the pages</b><small>Swipe or use the arrow keys</small></span>
    </motion.div>}</AnimatePresence>
    {rect && <motion.div className="book-live" onClick={stop} {...swipe}
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5 }}>
      <div className="book-spread">{under}</div>
      {leaf}
    </motion.div>}
    {rect && navBtn(-1)}{rect && navBtn(1)}
    {solo && rect && <div className="book-pageno" onClick={stop}>Page {idx + 1} of {BOOK_PAGES}</div>}
  </motion.div>
}

// The iMac: a macOS-style desktop (Sonoma wallpaper) with live widgets: a photo of Rio & Bruno,
// Bengaluru weather, world clocks, today's calendar, a note, reminders and shortcuts, plus the dock.
// Laid out on a 1180-px-wide stage and scaled to whatever size the screen is.
const STAGE_W = 1180
const WX = { ico: (d, s = 14) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg> }
const AppleLogo = ({ s = 14 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-1-2.4-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>
// weather glyphs (open-meteo weather codes)
const wxKind = (code, night) => code == null ? 'sun' : code === 0 ? (night ? 'moon' : 'sun') : code <= 2 ? (night ? 'moonc' : 'part') : code <= 3 || code === 45 || code === 48 ? 'cloud' : code >= 95 ? 'storm' : 'rain'
const WxIcon = ({ kind, s = 16 }) => {
  const sun = <><circle cx="12" cy="12" r="4.2" fill="#ffd54a" stroke="none"/>{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d="M12 2.8v2.4" stroke="#ffd54a" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${a} 12 12)`}/>)}</>
  const cloud = (x = 0, y = 0, c = '#fff') => <path d="M7.5 18.5h9.2a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1A4.3 4.3 0 0 0 7.5 18.5z" fill={c} transform={`translate(${x} ${y})`}/>
  return <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden="true">
    {kind === 'sun' && sun}
    {kind === 'moon' && <path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z" fill="#f4f0d8"/>}
    {kind === 'part' && <><g transform="translate(-3 -3) scale(.85)">{sun}</g>{cloud(1.5, 1.5)}</>}
    {kind === 'moonc' && <><path d="M11 2.5a6 6 0 1 0 3.6 9.6A5 5 0 0 1 11 2.5z" fill="#f4f0d8"/>{cloud(1.5, 1.5)}</>}
    {kind === 'cloud' && cloud()}
    {kind === 'rain' && <>{cloud(0, -3)}{[8, 12, 16].map((x) => <path key={x} d={`M${x} 18l-1.2 3`} stroke="#9fd0ff" strokeWidth="1.8" strokeLinecap="round"/>)}</>}
    {kind === 'storm' && <>{cloud(0, -3, '#dfe6ee')}<path d="M12.5 15l-2.5 4h2.5l-1.5 3.5" stroke="#ffd54a" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>}
  </svg>
}
const WX_LABEL = { sun: 'Sunny', moon: 'Clear', part: 'Partly Cloudy', moonc: 'Partly Cloudy', cloud: 'Cloudy', rain: 'Showers', storm: 'Thunderstorms' }
function useBengaluruWeather() {
  const [w, setW] = useState(null)
  useEffect(() => {
    let dead = false
    fetch('https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=2')
      .then((r) => r.json()).then((d) => {
        if (dead || !d.current) return
        const nowIdx = d.hourly.time.findIndex((t) => t >= d.current.time.slice(0, 13))
        const hours = Array.from({ length: 6 }, (_, k) => nowIdx + 1 + k).filter((i) => d.hourly.time[i]).map((i) => ({
          t: new Date(d.hourly.time[i]).toLocaleTimeString('en-US', { hour: 'numeric' }).replace(' ', ''), temp: Math.round(d.hourly.temperature_2m[i]), kind: wxKind(d.hourly.weather_code[i], !d.hourly.is_day[i]) }))
        setW({ temp: Math.round(d.current.temperature_2m), kind: wxKind(d.current.weather_code, !d.current.is_day), night: !d.current.is_day, hi: Math.round(d.daily.temperature_2m_max[0]), lo: Math.round(d.daily.temperature_2m_min[0]), hours })
      }).catch(() => {})
    return () => { dead = true }
  }, [])
  return w
}
const CLOCKS = [['Bengaluru', 'Asia/Kolkata'], ['London', 'Europe/London'], ['New York', 'America/New_York'], ['Tokyo', 'Asia/Tokyo']]
function zoneParts(now, tz) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', day: 'numeric', hourCycle: 'h23' }).formatToParts(now)
  const g = (t) => +f.find((p) => p.type === t).value
  return { h: g('hour'), m: g('minute'), s: g('second'), d: g('day') }
}
function AnalogClock({ h, m, s, night }) {
  const hand = (deg, len, w, c) => <line x1="20" y1="20" x2={20 + len * Math.sin(deg * Math.PI / 180)} y2={20 - len * Math.cos(deg * Math.PI / 180)} stroke={c} strokeWidth={w} strokeLinecap="round"/>
  return <svg viewBox="0 0 40 40" className="wd-clock-face" aria-hidden="true">
    <circle cx="20" cy="20" r="19" fill={night ? '#1c1c1e' : '#fff'}/>
    {Array.from({ length: 12 }, (_, i) => <text key={i} x={20 + 14.6 * Math.sin(i * Math.PI / 6)} y={20 - 14.6 * Math.cos(i * Math.PI / 6) + 1.9} fontSize="5.2" textAnchor="middle" fill={night ? '#fff' : '#111'} fontWeight="600">{i || 12}</text>)}
    {hand((h % 12 + m / 60) * 30, 8.5, 2.2, night ? '#fff' : '#111')}
    {hand((m + s / 60) * 6, 13, 1.5, night ? '#fff' : '#111')}
    {hand(s * 6, 14, .7, '#f19a37')}
    <circle cx="20" cy="20" r="1.4" fill="#f19a37"/>
  </svg>
}
const REMINDERS = ['Walk Rio & Bruno', 'Push portfolio update']
const SHORTCUTS = [
  { label: 'Play my song picks', bg: '#f6b73c', icon: WX.ico(<><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></>) },
  { label: 'Turn on desk lamp', bg: '#f29a4a', icon: WX.ico(<><path d="M9 21h6M12 17v4M8 3l8 4-3 6-8-4z"/></>) },
  { label: 'Take a break', bg: '#3cc7d6', icon: WX.ico(<><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></>) },
  { label: 'Pet Rio & Bruno', bg: '#ee6060', icon: WX.ico(<><ellipse cx="12" cy="16" rx="4" ry="3.2"/><circle cx="6.5" cy="11" r="1.6"/><circle cx="9.8" cy="7.4" r="1.6"/><circle cx="14.2" cy="7.4" r="1.6"/><circle cx="17.5" cy="11" r="1.6"/></>) },
]
// The dock: Finder plus the desktop's five things. On a laptop it magnifies under the pointer like
// macOS (the icons nearest grow, pushing their neighbours apart) and names the app above it.
function MacDock() {
  const ref = useRef(null), raf = useRef(0), last = useRef(null), [near, setNear] = useState(-1)
  const BASE = 44, GAP = 7, PAD = 8, MAX = .6, REACH = 2.6, n = MAC_DOCK.length
  const fine = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  const WIDTH = PAD * 2 + n * BASE + (n - 1) * GAP, center = (i) => PAD + i * (BASE + GAP) + BASE / 2
  // lay the icons out for a pointer at x (dock units from its left edge, as if unmagnified), straight on
  // the DOM, once a frame: no re-render, and measured from the dock's centre (which never moves), so the
  // dock growing can't feed back into where the pointer seems to be
  const paint = (x) => {
    const el = ref.current; if (!el) return
    const sc = MAC_DOCK.map((_, i) => x == null ? 1 : 1 + MAX * Math.max(0, Math.cos(Math.min(1, Math.abs(x - center(i)) / (BASE * REACH)) * Math.PI / 2)))
    const extra = sc.map((v) => (v - 1) * BASE), total = extra.reduce((a, b) => a + b, 0)
    let run = 0
    el.querySelectorAll('.dock-app').forEach((b, i) => { b.style.transform = `translateX(${run + extra[i] / 2 - total / 2}px) scale(${sc[i]})`; b.style.setProperty('--inv', 1 / sc[i]); run += extra[i] })
    el.style.setProperty('--grow', `${total / 2}px`)
    const best = x == null ? -1 : sc.indexOf(Math.max(...sc))
    setNear((v) => (v === best ? v : best))
  }
  const onMove = (e) => {
    if (!fine) return
    const el = ref.current, r = el.getBoundingClientRect(), k = r.width / el.offsetWidth
    last.current = (e.clientX - (r.left + r.width / 2)) / k + WIDTH / 2
    if (!el.classList.contains('is-mag')) { el.classList.add('is-in'); setTimeout(() => el.classList.remove('is-in'), 140) }
    el.classList.add('is-mag')
    if (!raf.current) raf.current = requestAnimationFrame(() => { raf.current = 0; paint(last.current) })
  }
  const onLeave = () => { cancelAnimationFrame(raf.current); raf.current = 0; last.current = null; ref.current?.classList.remove('is-mag'); paint(null) }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return <div ref={ref} className="mac-dock" onMouseMove={onMove} onMouseLeave={onLeave}>
    {MAC_DOCK.map((d, i) => <button key={d.id} className="dock-app" aria-label={d.name} onClick={() => window.dispatchEvent(new CustomEvent('mac-dock', { detail: d.id }))}>
      {d.icon(BASE)}{i === near && <span className="dock-label">{d.name}</span>}{d.id === 'finder' && <i className="dock-dot"/>}
    </button>)}
  </div>
}

// The lock screen the iMac rests on (the 3D screen shows the same): date and time up top, one user at the bottom.
// On Interact, once the camera has settled, the password fills in and it opens onto the desktop.
function LockScreen({ now, typed }) {
  return <motion.div className="mac-lock" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(6px)', scale: 1.04 }} transition={{ duration: .55, ease: [.4, 0, .2, 1] }}>
    <div className="lock-status"><span>IND</span>
      <svg viewBox="0 0 26 12" width="22" height="11" fill="none" stroke="currentColor" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none"/><path d="M24.5 4v4" strokeWidth="1.5" strokeLinecap="round"/></svg>
      {WX.ico(<><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19.2" r=".9" fill="currentColor"/></>, 15)}
    </div>
    <div className="lock-clock"><small>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</small>
      <strong>{now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')}</strong></div>
    <div className="lock-user">
      <span className="lock-avatar"><img src="/about/sameer-sketch.png?v=3" alt="" draggable="false"/></span>
      <b>Sameer</b>
      <span className={`lock-pass${typed ? ' typing' : ''}`}>{typed ? Array.from({ length: typed }, (_, i) => <i key={i}/>) : 'Enter Password'}</span>
    </div>
  </motion.div>
}
function PortfolioSystem({ stageH = 660, lockDelay = 0 }) {
  const [now, setNow] = useState(new Date())
  // lock → typing the password → desktop
  const [typed, setTyped] = useState(0), [home, setHome] = useState(false)
  useEffect(() => {
    const ts = []
    for (let i = 1; i <= 8; i++) ts.push(window.setTimeout(() => setTyped(i), lockDelay + 650 + i * 70))
    ts.push(window.setTimeout(() => setHome(true), lockDelay + 1450))
    return () => ts.forEach(window.clearTimeout)
  }, [])
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(t) }, [])
  const wx = useBengaluruWeather()
  const [done, setDone] = useState({})
  const here = zoneParts(now, 'Asia/Kolkata')
  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
  const menuDate = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '  ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const night = wx ? wx.night : (here.h < 6 || here.h >= 18)
  return <motion.div className={`system-screen mac-desktop${home ? ' is-home' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <AnimatePresence>{!home && <LockScreen key="lock" now={now} typed={typed}/>}</AnimatePresence>
    <div className="mac-menu">
      <span className="apple-mark"><AppleLogo s={14}/></span><b>Finder</b>{['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((m) => <span key={m}>{m}</span>)}
      <span className="menu-right">
        <svg viewBox="0 0 26 12" width="22" height="11" fill="none" stroke="currentColor" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none"/><path d="M24.5 4v4" strokeWidth="1.5" strokeLinecap="round"/></svg>
        {WX.ico(<><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19.2" r=".9" fill="currentColor"/></>, 15)}
        {WX.ico(<><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>, 14)}
        {WX.ico(<><rect x="3" y="5" width="18" height="5.5" rx="2.75"/><rect x="3" y="13.5" width="18" height="5.5" rx="2.75"/><circle cx="7.5" cy="7.75" r="1.6" fill="currentColor"/><circle cx="16.5" cy="16.25" r="1.6" fill="currentColor"/></>, 14)}
        <span>{menuDate}</span>
      </span>
    </div>
    <div className="desk-widgets">
      <figure className="wd wd-photo"><img src="/desktop/rio-bruno.jpg" alt="Rio and Bruno" draggable="false"/><figcaption>Rio &amp; Bruno</figcaption></figure>
      <section className={`wd wd-weather${night ? ' night' : ''}`}>
        <div className="wdw-top"><div><b>Bengaluru {WX.ico(<path d="m5 12 14-7-5 14-2-5z" fill="currentColor"/>, 9)}</b><strong>{wx ? wx.temp : 24}°</strong></div>
          <div className="wdw-now"><WxIcon kind={wx ? wx.kind : 'part'} s={18}/><span>{WX_LABEL[wx ? wx.kind : 'part']}</span><span>H:{wx ? wx.hi : 28}° L:{wx ? wx.lo : 19}°</span></div></div>
        <div className="wdw-hours">{(wx ? wx.hours : [['7PM', 23, 'moonc'], ['8PM', 22, 'moonc'], ['9PM', 22, 'cloud'], ['10PM', 21, 'cloud'], ['11PM', 21, 'moonc'], ['12AM', 20, 'moon']].map(([t, temp, kind]) => ({ t, temp, kind }))).map((h) =>
          <span key={h.t}><small>{h.t}</small><WxIcon kind={h.kind} s={15}/><b>{h.temp}°</b></span>)}</div>
      </section>
      <section className="wd wd-reminders">
        <header><b>Reminders</b><strong>{REMINDERS.filter((_, i) => !done[i]).length}</strong></header>
        <ul>{REMINDERS.map((r, i) => <li key={r} className={done[i] ? 'done' : ''} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}><i/>{r}</li>)}</ul>
      </section>
      <section className="wd wd-shortcuts">{SHORTCUTS.map((sc) => <span key={sc.label} style={{ background: sc.bg }}>{sc.icon}<b>{sc.label}</b></span>)}</section>
      <section className="wd wd-clocks">{CLOCKS.map(([city, tz]) => {
        const z = zoneParts(now, tz), diff = Math.round(((z.h + z.m / 60) - (here.h + here.m / 60) + (z.d !== here.d ? (z.d > here.d || (here.d > 27 && z.d === 1) ? 24 : -24) : 0)) * 2) / 2
        return <div key={city}><AnalogClock {...z} night={z.h < 6 || z.h >= 18}/><b>{city}</b><small>{z.d === here.d ? 'Today' : (diff > 0 ? 'Tomorrow' : 'Yesterday')}</small><small>{diff === 0 ? '+0HRS' : `${diff > 0 ? '+' : ''}${diff}HRS`}</small></div>
      })}</section>
      <section className="wd wd-calendar">
        <small>{dayName}</small><strong>{now.getDate()}</strong>
        <p className="ev" style={{ '--c': '#ff9f0a' }}><b>Walk Rio &amp; Bruno</b><span>7:00–7:30PM</span></p>
        <p className="ev" style={{ '--c': '#bf5af2' }}><b>Ship portfolio</b><span>9:00–10:00PM</span></p>
        <em>1 more event</em>
      </section>
      <section className="wd wd-notes">
        <header>{WX.ico(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor"/>, 12)}<b>Notes</b></header>
        <b>Portfolio ideas</b><span>Add a pet corner 🐾</span><small>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>
      </section>
    </div>
    {home && <DesktopOS stageH={stageH}/>}
    <MacDock/>
  </motion.div>
}

// The computer: the camera sits down in front of the iMac and the desktop appears on its screen.
// The desktop is laid out at a fixed size and scaled onto the screen (smaller layout on phones, so
// the text comes out bigger). On an upright phone the screen is shown sideways.
function ComputerView({ onClose, getRect }) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    let raf = 0
    const tick = () => { const r = getRect(); setRect((p) => (!r ? null : p && p.rotated === r.rotated && Math.abs(p.left - r.left) + Math.abs(p.top - r.top) + Math.abs(p.width - r.width) + Math.abs(p.height - r.height) < 1 ? p : r)); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const long = rect ? (rect.rotated ? rect.height : rect.width) : 0, short = rect ? (rect.rotated ? rect.width : rect.height) : 0
  const DW = isTouch() ? 680 : 1180, scale = long / DW, DH = short / scale
  // phones: zoom buttons enlarge the screen; when zoomed in it scrolls, so you can look around
  // phones: one Zoom button opens a slider, from the normal size up to 2.5×
  const ZMAX = 2.5
  const [zoom, setZoomV] = useState(1), zi = zoom > 1.001 ? 1 : 0
  const [zoomOpen, setZoomOpen] = useState(false)
  const disp = useRef(null), centre = useRef([.5, .5])
  // phones: a tip about the zoom buttons on the lock screen; the screen stays locked a little longer so
  // the tip is gone before the desktop appears
  const LOCK_DELAY = isTouch() ? 2400 : 0
  const [zoomTip, setZoomTip] = useState(false), hasRect = !!rect
  useEffect(() => { if (!hasRect || !isTouch()) return undefined; setZoomTip(true); const t = setTimeout(() => setZoomTip(false), LOCK_DELAY + 300); return () => clearTimeout(t) }, [hasRect])
  // a short "drag to look around" cue each time you zoom in from the normal size
  const [dragCue, setDragCue] = useState(false)
  useEffect(() => { if (zi === 0) { setDragCue(false); return undefined } const t = setTimeout(() => setDragCue(false), 5000); return () => clearTimeout(t) }, [zi, dragCue])
  const setZoom = (v) => {
    v = Math.min(ZMAX, Math.max(1, v)); if (v > 1.001 && zoom <= 1.001) setDragCue(true)
    const el = disp.current
    if (el && el.scrollWidth) centre.current = [(el.scrollLeft + el.clientWidth / 2) / el.scrollWidth, (el.scrollTop + el.clientHeight / 2) / el.scrollHeight]
    setZoomV(v)
  }
  // zoomed in: drag to move around the screen. A drag scrolls whatever it starts on (a window's page)
  // first, then the screen itself; a drag never counts as a tap.
  const panK = scale * zoom * DW / STAGE_W
  const pan = useRef(null)
  const panDown = (e) => {
    if (zoom === 1 || e.button > 0) return
    pan.current = { x: e.clientX, y: e.clientY, moved: false, target: e.target }
    const move = (ev) => {
      const p = pan.current; if (!p) return
      const dx = ev.clientX - p.x, dy = ev.clientY - p.y
      if (!p.moved && Math.hypot(dx, dy) < 6) return
      p.moved = true; p.x = ev.clientX; p.y = ev.clientY
      // finger movement on screen → scroll in the screen's own (possibly sideways) axes
      let sx = rect.rotated ? -dy : -dx, sy = rect.rotated ? dx : -dy
      for (let el = p.target; el && (sx || sy); el = el.parentElement) {
        const own = el === disp.current, k = own ? 1 : panK, cs = getComputedStyle(el)
        if (own || /(auto|scroll)/.test(cs.overflowY + cs.overflowX)) {
          const l = el.scrollLeft, t = el.scrollTop
          el.scrollLeft += sx / k; el.scrollTop += sy / k
          sx -= (el.scrollLeft - l) * k; sy -= (el.scrollTop - t) * k
        }
        if (own) break
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up)
      if (pan.current?.moved) { const stop = (ev) => { ev.stopPropagation(); ev.preventDefault() }; window.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 50) }
      pan.current = null
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
  }
  useLayoutEffect(() => {
    const el = disp.current; if (!el) return
    const [cx, cy] = centre.current
    el.scrollLeft = cx * el.scrollWidth - el.clientWidth / 2; el.scrollTop = cy * el.scrollHeight - el.clientHeight / 2
  }, [zoom])
  return <motion.div className="phone-overlay mac-overlay" onClick={backdropClose(onClose)} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <>
      <motion.div ref={disp} className={`mac-display${zoom > 1 ? ' is-zoomed' : ''}`} onClick={(e) => e.stopPropagation()} onPointerDownCapture={panDown}
        style={rect.rotated
          ? { left: rect.left + rect.width / 2 - long / 2, top: rect.top + rect.height / 2 - short / 2, width: long, height: short, rotate: 90 }
          : { left: rect.left, top: rect.top, width: long, height: short }}
        initial={false} animate={{ opacity: 1 }}>
        <div className="mac-zoom" style={{ width: long * zoom, height: short * zoom }}>
          <div className="mac-frame" style={{ width: STAGE_W, height: DH * STAGE_W / DW, transform: `scale(${scale * zoom * DW / STAGE_W})` }}><PortfolioSystem onClose={onClose} stageH={DH * STAGE_W / DW} lockDelay={LOCK_DELAY}/></div>
        </div>
      </motion.div>
      <AnimatePresence>{zoomTip && !dragCue && <motion.div key="zoom-tip" className="mac-drag-cue-wrap"
        style={rect.rotated
          ? { left: rect.left + rect.width / 2 - long / 2, top: rect.top + rect.height / 2 - short / 2, width: long, height: short, rotate: 90 }
          : { left: rect.left, top: rect.top, width: long, height: short }}
        initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .3 } }}>
        <span className="mac-drag-cue"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5M10.5 7.5v6M7.5 10.5h6"/></svg>Text too small? Tap Zoom and slide to enlarge</span>
      </motion.div>}</AnimatePresence>
      <AnimatePresence>{dragCue && <motion.div key="drag-cue" className="mac-drag-cue-wrap"
        style={rect.rotated
          ? { left: rect.left + rect.width / 2 - long / 2, top: rect.top + rect.height / 2 - short / 2, width: long, height: short, rotate: 90 }
          : { left: rect.left, top: rect.top, width: long, height: short }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}>
        <span className="mac-drag-cue"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>Drag to look around</span>
      </motion.div>}</AnimatePresence>
      {isTouch() && <>
        <button className={`cam-nav stack-nav down zoom-btn zoom-one${zoomOpen ? ' on' : ''}`} onClick={(e) => { e.stopPropagation(); setZoomOpen((o) => !o) }} aria-expanded={zoomOpen} aria-label="Zoom"><span className="zoom-face" style={rect.rotated ? { transform: 'rotate(90deg)' } : undefined}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5M10.5 7.5v6M7.5 10.5h6"/></svg><span>Zoom</span></span></button>
        <AnimatePresence>{zoomOpen && <motion.div key="zoom-pop" className="zoom-pop" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .18 }}>
          {/* the screen is shown sideways on an upright phone, so the zoom amount reads sideways with it */}
          <div className="zoom-pop-in">
            <TimeSlider label="Zoom" value={(zoom - 1) / (ZMAX - 1) * 5} onChange={(v) => setZoom(1 + v / 5 * (ZMAX - 1))}/>
            <b style={rect.rotated ? { transform: 'rotate(90deg)' } : undefined}>{zoom.toFixed(1)}×</b>
          </div>
        </motion.div>}</AnimatePresence>
      </>}
      {rect.rotated && <div className="rotate-hint"><RotateIcon/>Rotate your phone for a bigger view</div>}
    </>}
  </motion.div>
}

// Achievements: the camera faces the framed certificates above the iMac; a small caption sits on top.
// Add entries here ({ title, issuer, year }) as certificates come in.
// Where the bottom bar's row is on a laptop (null on phones, which have the BACK TO ROOM / menu buttons instead):
// buttons that belong to a close-up sit beside it, or above its right end when the window is narrow.
function useBarSpot() {
  const [dock, setDock] = useState(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const bar = !document.querySelector('.touch-fabs') && (document.querySelector('.hud-dock .bottom-bar') || document.querySelector('.hud-dock'))
      const d = bar && bar.getBoundingClientRect()
      const next = !d ? null : { mode: viewW() - d.right >= 300 ? 'beside' : 'above', right: d.right, mid: d.top + d.height / 2, top: d.top }
      setDock((p) => (!next ? null : p && p.mode === next.mode && Math.abs(p.right - next.right) + Math.abs(p.top - next.top) + Math.abs(p.mid - next.mid) < 1 ? p : next))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return dock
}

// The description of one achievement (laptop: the card on the right; phone: the box under the certificate).
// the place badge: gold for 1st, silver for 2nd, bronze for 3rd
const placeTone = (place) => (/^1/.test(place) ? 'gold' : /^2/.test(place) ? 'silver' : /^3/.test(place) ? 'bronze' : /recogn/i.test(place) ? 'recog' : 'gold')
const MedalIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3h8l-2.5 6h-3z"/><circle cx="12" cy="15" r="5.5"/><path d="m12 12.3.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z" fill="currentColor" stroke="none"/></svg>
function CertDetails({ a }) {
  return <>
    <div className="cert-head">
      <span className={`cert-place ${placeTone(a.place)}`}><MedalIcon/>{a.place}</span>
    </div>
    <h3>{a.title}</h3>
    <p className="cert-meta">{a.event} · {a.date}</p>
    <p className="cert-summary">{a.summary}</p>
    {a.points.length > 0 && <ul className="cert-points">{a.points.map((p) => <li key={p}>{p}</li>)}</ul>}
    <div className="cert-links">
      <a className="resume-btn" href={a.image} target="_blank" rel="noreferrer"><OpenIcon/>Open certificate</a>
      {a.project && <a className="resume-btn primary" href={a.project} target="_blank" rel="noreferrer"><CodeIcon/>View project</a>}
    </div>
  </>
}

// phone details box: everything fits in one box with no scrolling. The text starts at full size and
// steps down a little at a time until it fits the space between the certificate and the buttons.
function CertFit({ a }) {
  const ref = useRef(null)
  const [fs, setFs] = useState(1)
  useLayoutEffect(() => { setFs(1) }, [a])
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return
    if (el.scrollHeight > el.clientHeight + 1 && fs > .62) setFs((f) => Math.round((f - .04) * 100) / 100)
  })
  useEffect(() => { const on = () => setFs(1); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on) }, [])
  return <div className="cert-box-fit" ref={ref} style={{ '--fs': fs }}>
    <CertDetails a={a}/>
  </div>
}

// a hand swiping right
const SwipeIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M12 11.5v-1a1.5 1.5 0 0 1 3 0v1.5M15 11.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a5 5 0 0 1-4-2l-2.6-3.5a1.5 1.5 0 0 1 2.3-1.9L9 15"/><path d="M15 3.5h5M18 1.5l2 2-2 2"/></svg>

// Achievements: the camera faces the framed certificates above the iMac. Click (or tap) a certificate to
// see it up close with its description; Next pans out to the wall and in to the next one.
function AchievementsView({ certId, getRect, onNext, onPrev, onBack }) {
  const winRef = useRef(true)
  const phone = isTouch() // phones: the wall is shown sideways; a certificate opens upright with its details below
  const [rect, setRect] = useState(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = getRect(); setRect((p) => (!r ? null : p && p.id === r.id && Math.abs(p.left - r.left) + Math.abs(p.top - r.top) + Math.abs(p.width - r.width) < 1 ? p : r))
      // phones: where the buttons start (the details box stops the same distance above them as below the frame)
      // (and above BACK TO ROOM, which sits higher than a single button on its own)
      // (a hackathon win keeps a second row of buttons, level with the hidden BACK TO ROOM; a recognition has only
      // the bottom row, level with Nate)
      const tops = ['.cert-next', winRef.current ? '.touch-fabs .fab-action' : '.touch-fabs .ai-wrap'].map((q) => document.querySelector(q)?.getBoundingClientRect().top).filter((t) => t > 0)
      const b = tops.length ? Math.min(...tops) : null
      if (b) setBtnTop((p) => (Math.abs((p || 0) - b) < 1 ? p : b))
      const act = document.querySelector('.touch-fabs .fab-action')?.getBoundingClientRect()
      const ab = act && act.width ? { right: Math.round(viewW() - act.left + 10), bottom: Math.round(viewH() - act.bottom), height: Math.round(act.height) } : null
      setActBox((p) => (!ab ? null : p && p.right === ab.right && p.bottom === ab.bottom && p.height === ab.height ? p : ab))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const dock = useBarSpot()
  const [btnTop, setBtnTop] = useState(null)
  const [actBox, setActBox] = useState(null)
  // phones: the swipe cue goes away once they drag across the wall
  const [dragged, setDragged] = useState(false)
  useEffect(() => {
    if (!phone || dragged) return undefined
    let start = null
    const down = (e) => { start = [e.clientX, e.clientY] }
    const move = (e) => { if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 12) setDragged(true) }
    const up = () => { start = null }
    window.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [phone, dragged])
  const a = ACHIEVEMENTS.find((x) => x.id === certId)
  const shown = a && rect && rect.id === certId ? a : null
  // a certificate's buttons wait until it's on screen with the room blurred behind it (then stay put while you
  // flip between certificates); while one is open, BACK TO ROOM steps aside — the way out is the wall first
  const [certReady, setCertReady] = useState(false)
  useEffect(() => { if (!certId) setCertReady(false); else if (shown) setCertReady(true) }, [certId, shown])
  useEffect(() => { document.body.classList.toggle('cert-viewing', !!certId); return () => document.body.classList.remove('cert-viewing') }, [certId])
  const fabCue = useFabCueBox()
  // laptop: the keyboard's ← → do what the on-screen arrows do, on the two hackathon wins
  const certWin = !!certId && ACHIEVEMENTS.find((x) => x.id === certId)?.kind !== 'recognition'
  winRef.current = certWin
  const [usedArrows, setUsedArrows] = useState(false)
  const goNext = () => { setUsedArrows(true); onNext?.() }, goPrev = () => { setUsedArrows(true); onPrev?.() }
  useEffect(() => {
    if (phone || !certWin) return undefined
    const key = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target?.tagName || '') || e.target?.isContentEditable) return
      if (document.body.classList.contains('menu-open')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); setUsedArrows(true); onNext?.() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); setUsedArrows(true); onPrev?.() }
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [phone, certWin, onNext, onPrev])
  // phones: where the certificate's buttons start (the details box stops 16px above): the row above Nate's for the
  // wins (arrows below, Back to certificates above), Nate's own row for a recognition (just Back to certificates)
  const phoneTwoRows = shown ? shown.kind !== 'recognition' && ACHIEVEMENTS.filter((x) => x.kind !== 'recognition').length > 1 : false
  const phoneBtnTop = !phone || !shown ? null : phoneTwoRows ? (actBox ? viewH() - actBox.bottom - actBox.height : null) : (fabCue ? viewH() - fabCue.bottom - fabCue.height : null)
  const nextStyle = dock ? (dock.mode === 'beside' ? { left: dock.right + 8, bottom: viewH() - dock.mid - 22 } : { right: viewW() - dock.right, bottom: viewH() - dock.top + 8 }) : undefined
  return <motion.div className="phone-overlay achv-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <AnimatePresence>{!certId && <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      {/* the same cue boxes as "Pinch to zoom" on the résumé; phones also get one for swiping along the wall */}
      {phone
        // phones: one box with two rows, like the cue at the desk corner
        ? <AnimatePresence>{!dragged && <motion.div key="swipe-cue" className="look-cue cam-cue desk-cue is-touch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: .8, duration: .35 } }} exit={{ opacity: 0, y: -6, transition: { duration: .25 } }}>
            <span className="dc-row on"><span className="cue-cam"><SwipeIcon/></span><span className="cue-text"><b>Swipe left to see the whole wall</b><small>Drag across to move along it</small></span></span>
          </motion.div>}</AnimatePresence>
        : <motion.div className="look-cue cam-cue achv-cue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8, duration: .35 }}>
            <span className="cue-cam">{CUES.achievements.icon}</span>
            <span className="cue-text"><b>Start with the two hackathon wins at the top</b><small>Or click any certificate to see what it was for</small></span>
          </motion.div>}
    </motion.div>}</AnimatePresence>
    {/* phones: by Nate's button, for as long as the whole wall is on screen: the top two are the hackathon wins */}
    <AnimatePresence>{phone && !certId && fabCue && <motion.div key="wins-cue" className="look-cue cam-cue phone-cue is-touch at-fab wins-cue"
      style={{ left: fabCue.left, right: fabCue.right, bottom: fabCue.bottom, height: fabCue.height }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: .8, duration: .35 } }} exit={{ opacity: 0, transition: { duration: .2 } }}>
      <span className="cue-cam">{CUES.achievements.icon}</span>
      <span className="cue-text"><b>Top 2 are hackathon wins</b><small>Start there, or tap any one</small></span>
    </motion.div>}</AnimatePresence>
    <AnimatePresence>{shown && (phone
      // phone: the framed certificate on the wall up top (the room stays in view), its details below
      ? <motion.div key={shown.id} className="cert-sheet" onClick={(e) => { if (e.target === e.currentTarget) onBack() }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}>
          {/* a soft blur over the room below the certificate (the frame itself stays sharp) */}
          <i className="cert-scrim-phone" aria-hidden="true" style={{ top: rect.frameBottom + 4 }}/>
          {/* fixed in place, equal gaps above and below; the text sizes itself to fit */}
          <article className="cert-box fixed" style={{ top: rect.frameBottom + 16, bottom: viewH() - (phoneBtnTop ?? btnTop ?? viewH() - 130) + 16 }}>
            <CertFit a={shown}/>
          </article>
        </motion.div>
      // laptop: the certificate on the left, this card on the right
      : <div key={shown.id} className="cert-card-wrap" style={{ left: rect.left + rect.width * 1.11 + 24 }}>
          <motion.i className="cert-scrim" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .35 }}/>
          <motion.article className="cert-card" initial={false} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: .35, ease: [.2, .8, .2, 1] }}>
            <CertDetails a={shown}/>
          </motion.article>
        </div>)}</AnimatePresence>
    {/* beside the bar (laptop) or bottom-left (phone): back to the whole wall, and on to the next certificate */}
    {/* laptop: like the camera, the cue sits just above the bottom bar */}
    <AnimatePresence>{!phone && certReady && certWin && !usedArrows && ACHIEVEMENTS.filter((x) => x.kind !== 'recognition').length > 1 && <ArrowCue key="cert-arrows-cue" title="Use the arrows to switch between the hackathon wins" hint="Click ← → or press the arrow keys"/>}</AnimatePresence>
    {certId && certReady && !phone && <motion.div className={`resume-actions cert-next${dock ? (dock.mode === 'above' ? ' row' : '') : ' stacked'}`} style={nextStyle}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: .3 }}>
      {/* like the résumé: the dark button on top, the white one level with the bar */}
      {(() => {
        // the hackathon wins: next / previous go between the two of them only. A certificate of recognition has
        // just the way back to the whole wall (pick another there).
        const cur = ACHIEVEMENTS.find((x) => x.id === certId), win = cur?.kind !== 'recognition'
        const wins = ACHIEVEMENTS.filter((x) => x.kind !== 'recognition')
        if (win && wins.length > 1) return <>
          <span className="cert-arrows lap">
            <button className="cert-sq dark" aria-label="Previous certificate" title="Previous certificate" onClick={goPrev}>{CERT_ICONS.prev}</button>
            <button className="cert-sq dark" aria-label="Next certificate" title="Next certificate" onClick={goNext}>{CERT_ICONS.next}</button>
          </span>
          <button className="resume-btn" onClick={onBack}>{CERT_ICONS.all} Back to certificates</button>
        </>
        return <button className="resume-btn" onClick={onBack}>{CERT_ICONS.all} Back to certificates</button>
      })()}
    </motion.div>}
    {/* phones: no third row: small square arrows beside Nate (the two wins only), and the way back to the wall
        beside BACK TO ROOM, the same height as it */}
    {certId && certReady && phone && (() => {
      const win = ACHIEVEMENTS.find((x) => x.id === certId)?.kind !== 'recognition'
      const wins = ACHIEVEMENTS.filter((x) => x.kind !== 'recognition').length
      // the joystick layout has the menu button by Nate too, so less room for the cue
      const narrow = fabCue ? viewW() - fabCue.right - 14 - 2 * fabCue.height - 16 < 140 : false
      return <>
        {win && wins > 1 && fabCue && <motion.div key="cert-arrows" className="cert-arrows" style={{ left: 14, right: fabCue.right, bottom: fabCue.bottom, height: fabCue.height }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: .3 }}>
          <button className="cert-sq dark" aria-label="Previous certificate" onClick={onPrev}>{CERT_ICONS.prev}</button>
          <button className="cert-sq dark" aria-label="Next certificate" onClick={onNext}>{CERT_ICONS.next}</button>
          {/* a small cue between the arrows and Nate: what they flip through */}
          <span className={`cert-arrow-cue${narrow ? ' narrow' : ''}`}><b>{narrow ? 'Hack wins' : 'Hackathon wins'}</b><small>Tap arrows to switch</small></span>
        </motion.div>}
        {/* wins: a second row, full width (the bottom row has the arrows). Recognitions: the bottom row is empty
            but for Nate, so it sits there, filling the space up to Nate */}
        {(win && wins > 1 ? actBox : fabCue) && <motion.button key="cert-back" className="resume-btn cert-back-phone"
          style={win && wins > 1 ? { left: 14, right: 14, bottom: actBox.bottom, height: actBox.height } : { left: 14, right: fabCue.right, bottom: fabCue.bottom, height: fabCue.height }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: .3 }} onClick={onBack}>{CERT_ICONS.all} Back to certificates</motion.button>}
      </>
    })()}
  </motion.div>
}

// The speaker: the camera glides to it, its top lights up, and a card lists songs I keep on repeat.
const art = (id) => `https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02${id}`
const SONGS = [
  { title: 'Reflections', by: 'The Neighbourhood', id: '2xql0pid3EUwW38AsywxhV', art: art('9b6ac98a52f62d5cb473da40') },
  { title: 'What Makes You Beautiful', by: 'One Direction', id: '4cluDES4hQEUhmXj6TXkSo', art: art('4a5584795dc73860653a9a3e') },
  { title: 'Counting Stars', by: 'OneRepublic', id: '2tpWsVSb9UEmDRxAl1zhX1', art: art('9e2f95ae77cf436017ada9cb') },
  { title: 'Beautiful Now', by: 'Zedd, Jon Bellion', id: '6t9gboVdKdqsWcKnmN0Ku4', art: art('09de7ca54cd7e9a6a3210013') },
  { title: 'Zehnaseeb', by: 'Vishal-Shekhar, Chinmayi, Shekhar Ravjiani', id: '3xF15SqY32Mno3UUMBirhU', art: art('2025db071cd9dd7e8023e01e') },
  { title: 'Tum Hi Ho Bandhu', by: 'Neeraj Shridhar, Kavita Seth', id: '7H3mfOvtPNA8YDF3EdKy0L', art: art('ad204486839062991becfbc9') },
  { title: 'Bin Tere', by: 'Vishal-Shekhar, Shafqat Amanat Ali, Sunidhi Chauhan', id: '3bZPdEskcnMdepwCaDSJRl', art: art('1992dd7b33baf5887ea4a1ec') },
  { title: 'The Disco Song', by: 'Vishal-Shekhar, Benny Dayal, Sunidhi Chauhan', id: '3UaP2PQwhA31keZXt7oPLA', art: art('ad40f4e70b2f2a2a6052d49d') },
]
const PlayIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>
const PauseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>
const NextIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M5 6.2v11.6a1 1 0 0 0 1.55.83L15 13v4.8a1 1 0 0 0 2 0V6.2a1 1 0 0 0-2 0V11L6.55 5.37A1 1 0 0 0 5 6.2z"/></svg>
const OutIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
// a line of text that scrolls continuously (one direction, looping) when it's too long to fit
// (artist names). Every long name uses the same timing, so they all move together.
function ScrollText({ text }) {
  const box = useRef(null), probe = useRef(null), [long, setLong] = useState(false)
  useLayoutEffect(() => {
    const measure = () => { const b = box.current, p = probe.current; if (b && p) setLong(p.scrollWidth > b.clientWidth + 2) }
    measure(); const ro = new ResizeObserver(measure); if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [text])
  return <small ref={box} className={`scroll-text${long ? ' is-long' : ''}`}>
    <span ref={probe} className="st-probe" aria-hidden={long}>{text}</span>
    {long && <span className="st-track" aria-label={text}><span>{text}</span><span aria-hidden="true">{text}</span></span>}
  </small>
}
// little equaliser bars beside the song that's playing (heights follow the music: --l0 … --l2 on the card)
const Eq = () => <span className="eq" aria-hidden="true"><i/><i/><i/></span>

// The speaker: the camera glides to it and a card lists songs I keep on repeat. Each one plays its
// 30-second preview right here (api/preview.js); the speaker's top pulses with it and the room dims a little.
function MusicPanel({ onClose, onMusic }) {
  const audio = useRef(null), ctx = useRef(null), an = useRef(null), card = useRef(null)
  const [cur, setCur] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [noPreview, setNoPreview] = useState({})
  const [prog, setProg] = useState(0)
  const curRef = useRef(0); curRef.current = cur
  const playAt = (i) => {
    const a = audio.current, song = SONGS[i]; if (!a) return
    if (i === curRef.current && a.src && !a.ended && !noPreview[song.id]) { if (a.paused) a.play().catch(() => {}); else a.pause(); return }
    setCur(i); setProg(0); setLoading(true)
    a.src = `/api/preview?id=${song.id}`
    // the level meter (and the speaker's pulse) reads the audio through Web Audio
    if (!ctx.current) {
      const C = window.AudioContext || window.webkitAudioContext
      if (C) { try { const c = new C(), src = c.createMediaElementSource(a), x = c.createAnalyser(); x.fftSize = 64; src.connect(x); x.connect(c.destination); ctx.current = c; an.current = x } catch { /* plays without the meter */ } }
    }
    ctx.current?.resume?.()
    a.play().catch(() => {})
  }
  const next = () => playAt((curRef.current + 1) % SONGS.length)
  const playRef = useRef(playAt); playRef.current = playAt
  useEffect(() => {
    const a = new Audio(); a.preload = 'none'; audio.current = a
    const on = (e, f) => a.addEventListener(e, f)
    on('play', () => setPlaying(true)); on('pause', () => setPlaying(false)); on('playing', () => setLoading(false))
    on('timeupdate', () => setProg(a.duration ? a.currentTime / a.duration : 0))
    // the song plays on repeat until another one is picked
    on('ended', () => { a.currentTime = 0; a.play().catch(() => {}) })
    on('error', () => { setLoading(false); setPlaying(false); setNoPreview((m) => ({ ...m, [SONGS[curRef.current].id]: true })) })
    // levels → the equaliser bars and the speaker
    let raf = 0, lv = 0
    const data = new Uint8Array(32)
    const tick = () => {
      let target = 0, b = [0, 0, 0]
      if (an.current && !a.paused) {
        an.current.getByteFrequencyData(data)
        b = [data[2], data[6], data[12]].map((v) => v / 255)
        target = (b[0] + b[1] + b[2]) / 3
      } else if (!a.paused) { const t = performance.now() / 260; b = [.5 + .4 * Math.sin(t), .5 + .4 * Math.sin(t * 1.3 + 1), .5 + .4 * Math.sin(t * .8 + 2)]; target = .5 }
      lv += (target - lv) * .25
      const el = card.current; if (el) b.forEach((v, k) => el.style.setProperty(`--l${k}`, Math.max(.15, v).toFixed(3)))
      onMusic?.({ level: lv, playing: !a.paused })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); a.pause(); a.removeAttribute('src'); a.load(); ctx.current?.close?.(); onMusic?.({ level: 0, playing: false }) }
  }, [onMusic])
  const song = SONGS[cur], missing = noPreview[song.id]
  const stop = (e) => e.stopPropagation()
  const phone = isTouch()
  return <motion.div className="phone-overlay music-overlay" onClick={backdropClose(onClose)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <motion.article ref={card} className="music-card" onClick={stop} initial={false} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0, transition: { delay: 0, duration: .18 } }} transition={{ delay: .75, duration: .4, ease: [.2, .8, .2, 1] }}>
      <header><h3>On my speaker</h3></header>
      <p className="music-tag">The songs that keep me going.</p>
      {/* now playing (phones: it sits beside the buttons at the bottom instead) */}
      {!phone && <div className={`np${playing ? ' is-playing' : ''}`}>
        <img src={song.art} alt="" width="64" height="64"/>
        <div className="np-text">
          <small>{missing ? 'No preview for this one' : loading ? 'Loading…' : playing ? 'Now playing' : isTouch() ? 'Tap play to listen' : 'Click play to listen'}</small>
          <b>{song.title}</b><span>{song.by}</span>
          <div className="np-bar"><i style={{ width: `${prog * 100}%` }}/></div>
        </div>
        {missing
          ? <a className="np-btn" href={`https://open.spotify.com/track/${song.id}`} target="_blank" rel="noreferrer" aria-label="Open in Spotify"><OutIcon/></a>
          : <button className="np-btn primary" onClick={() => playAt(cur)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <PauseIcon/> : <PlayIcon/>}</button>}
        <button className="np-btn" onClick={next} aria-label="Next song"><NextIcon/></button>
      </div>}
      <ol className="music-list">{SONGS.map((s, i) => <li key={s.id}>
        <div className={`music-row${i === cur ? ' on' : ''}`} role="button" tabIndex={0} onClick={() => playAt(i)} onKeyDown={(e) => { if (e.key === 'Enter') playAt(i) }} aria-label={`Play ${s.title}`}>
          <span className="music-n">{i === cur && playing ? <Eq/> : i + 1}</span>
          <img src={s.art} alt={`${s.title} cover art`} loading="lazy" width="48" height="48"/>
          <span className="music-text"><b>{s.title}</b><ScrollText text={s.by}/></span>
          <a className="music-go" href={s.href || `https://open.spotify.com/track/${s.id}`} target="_blank" rel="noreferrer" onClick={stop}>Spotify <OutIcon/></a>
        </div>
      </li>)}</ol>
    </motion.article>
    {phone && <motion.div className={`np-dock${playing ? ' is-playing' : ''}`} onClick={stop} initial={false} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0, transition: { delay: 0, duration: .18 } }} transition={{ delay: .85, duration: .35 }}>
      <img src={song.art} alt="" width="38" height="38"/>
      <div className="np-dock-text">
        <small>{missing ? 'No preview' : loading ? 'Loading…' : playing ? 'Now playing' : 'Tap play'}</small>
        <b>{song.title}</b>
      </div>
      {missing
        ? <a className="np-btn" href={`https://open.spotify.com/track/${song.id}`} target="_blank" rel="noreferrer" aria-label="Open in Spotify"><OutIcon/></a>
        : <button className="np-btn primary" onClick={() => playAt(cur)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <PauseIcon/> : <PlayIcon/>}</button>}
      <button className="np-btn" onClick={next} aria-label="Next song"><NextIcon/></button>
      <i className="np-dock-bar" style={{ width: `${prog * 100}%` }}/>
    </motion.div>}
  </motion.div>
}

// Files (résumé) and the speaker (song picks): a plain card over the room.
function SpotCard({ app, onClose }) {
  const a = apps.find((x) => x.id === app)
  return <motion.div className="phone-overlay spot-overlay" onClick={backdropClose(onClose)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <motion.article className="spot-card" onClick={(e) => e.stopPropagation()} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: .3, ease: [.2, .8, .2, 1] }}>
      <span className="section-eyebrow">{a.label}</span><h3>{a.title}</h3>{a.body}
    </motion.article>
  </motion.div>
}

// The files: a box file comes off the shelf and opens; my résumé lies on top of the papers inside.
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>
const CodeIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>
const OpenIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>
function ResumeView({ onClose, getRect, setInsets }) {
  const [rect, setRect] = useState(null)
  const [doc, setDoc] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => { loadResume().then(setDoc, () => setFailed(true)) }, [])
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = getRect(); setRect((p) => (!r ? null : p && Math.abs(p.left - r.left) + Math.abs(p.top - r.top) + Math.abs(p.width - r.width) + Math.abs(p.height - r.height) < 1 ? p : r))
      // laptop: the buttons stack beside the bottom bar, or sit in a row above its right end when the
      // window is too narrow for that; phone: stacked bottom-left (CSS)
      // measure the bar row itself, not the whole dock: the appearance / instructions panels open above
      // the bar and should cover the résumé, not move it (as in the book and the other close-ups)
      const bar = !document.querySelector('.touch-fabs') && (document.querySelector('.hud-dock .bottom-bar') || document.querySelector('.hud-dock'))
      const d = bar && bar.getBoundingClientRect()
      const next = !d ? null : viewW() - d.right >= 300 ? { mode: 'beside', right: d.right, mid: d.top + d.height / 2, top: d.top } : { mode: 'above', right: d.right, mid: d.top + d.height / 2, top: d.top }
      setDock((p) => (!next ? null : p && p.mode === next.mode && Math.abs(p.right - next.right) + Math.abs(p.top - next.top) + Math.abs(p.mid - next.mid) < 1 ? p : next))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const [dock, setDock] = useState(null)
  // pinch to zoom (and drag to pan when zoomed) on the sheet; double-tap resets
  const zoomEl = useRef(null), sheetEl = useRef(null), z = useRef({ s: 1, x: 0, y: 0 }), pts = useRef(new Map()), g = useRef(null), moved = useRef(false), lastTap = useRef(0)
  const applyZoom = () => {
    const el = zoomEl.current, box = sheetEl.current; if (!el || !box) return
    const c = z.current, w = box.clientWidth, h = box.clientHeight
    c.s = Math.min(4, Math.max(1, c.s)); c.x = Math.min(0, Math.max(-(c.s - 1) * w, c.x)); c.y = Math.min(0, Math.max(-(c.s - 1) * h, c.y))
    el.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.s})`
  }
  const local = (e) => { const r = sheetEl.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  const startGesture = () => {
    const p = [...pts.current.values()], c = z.current
    if (p.length >= 2) g.current = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, mid: { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }, s: c.s, x: c.x, y: c.y }
    else if (p.length === 1) g.current = { px: p[0].x, py: p[0].y, x: c.x, y: c.y }
    else g.current = null
  }
  const zoomHandlers = {
    onPointerDown: (e) => { pts.current.set(e.pointerId, local(e)); if (pts.current.size === 1) moved.current = false; startGesture() },
    onPointerMove: (e) => {
      if (!pts.current.has(e.pointerId) || !g.current) return
      pts.current.set(e.pointerId, local(e))
      const p = [...pts.current.values()], c = z.current, s0 = g.current
      if (p.length >= 2 && s0.d) {
        const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), mid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }
        const ns = Math.min(4, Math.max(1, s0.s * d / s0.d)), cx = (s0.mid.x - s0.x) / s0.s, cy = (s0.mid.y - s0.y) / s0.s
        c.s = ns; c.x = mid.x - cx * ns; c.y = mid.y - cy * ns; moved.current = true; applyZoom(); setPinched(true)
      } else if (p.length === 1 && c.s > 1) {
        const dx = p[0].x - s0.px, dy = p[0].y - s0.py
        if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true
        c.x = s0.x + dx; c.y = s0.y + dy; applyZoom()
      }
    },
    onPointerUp: (e) => {
      pts.current.delete(e.pointerId); startGesture()
      if (!pts.current.size && !moved.current && e.pointerType === 'touch') {
        const now = performance.now()
        if (now - lastTap.current < 300) { z.current = { s: 1, x: 0, y: 0 }; applyZoom() }
        lastTap.current = now
      }
    },
    onPointerCancel: (e) => { pts.current.delete(e.pointerId); startGesture() },
    onClickCapture: (e) => { if (moved.current) { e.preventDefault(); e.stopPropagation() } }, // a drag isn't a tap on a link
  }
  const touch = isTouch()
  const [pinched, setPinched] = useState(false) // the pinch cue goes once they've pinched
  // keep the sheet clear of the bar (and of the buttons when they sit above it)
  useEffect(() => {
    setInsets(dock ? { bottom: viewH() - dock.top + (dock.mode === 'above' ? 44 + 22 : 14), full: dock.mode === 'above' } : {})
  }, [dock, setInsets])
  useEffect(() => () => setInsets({}), [setInsets])
  const stop = (e) => e.stopPropagation()
  return <motion.div className="phone-overlay resume-overlay" onClick={backdropClose(onClose)} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <>
      <motion.div ref={sheetEl} className="resume-sheet" onClick={stop} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .35 }} {...zoomHandlers}>
        {doc ? <div className="resume-zoom" ref={zoomEl}>
          <img src={doc.url} alt="Résumé of Sameer Palkar" draggable="false"/>
          {doc.links.map((l, i) => <a key={i} className="resume-link" href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={l.href.replace(/^(mailto:|tel:|https?:\/\/)/, '')}
            style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }}/>)}
        </div> : <div className="resume-wait">{failed ? <><b>Couldn’t load the résumé</b><span>Use the download button instead.</span></> : <><i className="resume-spin"/><span>Fetching the latest résumé…</span></>}</div>}
      </motion.div>
      <motion.div className={`resume-actions${dock ? (dock.mode === 'above' ? ' row' : '') : ' stacked'}`} onClick={stop}
        style={!dock ? undefined : dock.mode === 'beside' ? { left: dock.right + 8, bottom: viewH() - dock.mid - 22 } : { right: viewW() - dock.right, bottom: viewH() - dock.top + 8 }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15, duration: .35 }}>
        <a className="resume-btn primary" href={RESUME_DOWNLOAD} download={RESUME_NAME}><DownloadIcon/>Download résumé</a>
        {/* phones: Google Drive's viewer, since some (Android) have no built-in PDF viewer and would just download it */}
        <a className="resume-btn" href={touch ? RESUME_VIEW : RESUME_URL} target="_blank" rel="noreferrer"><OpenIcon/>Open in new tab</a>
      </motion.div>
      <AnimatePresence>{touch && !pinched && <motion.div key="pinch" className="look-cue cam-cue is-touch resume-cue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ delay: .3, duration: .35 }}>
        <span className="cue-cam"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.9-4.9M10.5 8v5M8 10.5h5"/></svg></span>
        <span className="cue-text"><b>Pinch to zoom or open it in a new tab</b><small>If the text is too small to read</small></span>
      </motion.div>}</AnimatePresence>
    </>}
  </motion.div>
}

// Photos dropped into src/photos show up on the camera's screen, in name order.
const PHOTOS = Object.entries(import.meta.glob('./photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}', { eager: true, query: '?url', import: 'default' })).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url)
// Captions, keyed by the file name (without the number): [caption, group, where to centre the crop, mirror it?]. Grouped as travel, convocation, Oracle, college.
const PHOTO_CAPTIONS = {
  'travel-balloon': ['A hot air balloon drifting over the hills', 'Travel · May 2024', '50% 60%', true],
  'travel-peaks': ['Last light on the snow peaks', 'Travel · June 2024', '50% 38%'],
  'travel-beach-sunset': ['A sky on fire over an empty beach', 'Travel · June 2025', '50% 48%'],
  'travel-beach-footprints': ['Footprints all the way to the cliffs', 'Travel · December 2025', '50% 55%'],
  'convocation-degree': ['Degree in hand: B.Tech, done', 'Convocation · August 2026', '50% 30%'],
  'convocation-stage': ['On stage at VIT’s 41st Annual Convocation', 'Convocation · August 2026'],
  'oracle-office': ['First days at Oracle', 'Oracle · August 2026', '50% 48%'],
  'oracle-volunteering': ['Painting walls with Oracle Volunteering', 'Oracle · September 2026'],
  'college-kurtas': ['Kurta day with the gang', 'College · January 2023', '50% 38%'],
  'college-outreach': ['Volunteering at a school for special kids', 'College · September 2023'],
  'college-friends': ['gitblameher: my DevJams and Yantra hack team', 'College · September 2024'],
  'college-team': ['ISTE board of 2024–25', 'College · March 2025'],
  'college-crew': ['The college crew', 'College · October 2025'],
  'college-riviera': ['With Ritviz at Riviera 2026', 'College · March 2026', '50% 47%'],
  'college-award': ['Riviera 2026 OC thanksgiving', 'College · March 2026'],
  'college-farewell': ['Farewell, Class of 2026', 'College · 2026'],
}
const PHOTO_INFO = Object.keys(import.meta.glob('./photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}')).sort((a, b) => a.localeCompare(b)).map((f) => PHOTO_CAPTIONS[f.replace(/^.*\/\d+-|\.\w+$/g, '')] || null)

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
  const [hint, setHint] = useState(true)
  const step = (d) => { setHint(false); n && setI((v) => (v + d + n) % n) }
  useEffect(() => {
    const key = (e) => { if (natesKeys(e)) return; if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); step(-1) } if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(1) } }
    window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true)
  })
  return <motion.div className="phone-overlay" onClick={backdropClose(onClose)} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <>
      {/* rear screen: on an upright phone the camera is turned sideways, so the picture is too */}
      <motion.div className="cam-screen" onClick={(e) => e.stopPropagation()}
        style={rect.rotated
          ? { left: rect.left + rect.width / 2 - rect.height / 2, top: rect.top + rect.height / 2 - rect.width / 2, width: rect.height, height: rect.width, rotate: 90 }
          : { left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}>
        {n ? <AnimatePresence initial={false} mode="popLayout"><motion.div key={i} className="cam-shot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
            {/* every shot fills the viewfinder; portrait ones are cropped around their subject */}
            <img className="cam-photo" src={PHOTOS[i]} alt={PHOTO_INFO[i]?.[0] || ''} style={{ objectPosition: PHOTO_INFO[i]?.[2] || '50% 50%', transform: PHOTO_INFO[i]?.[3] ? 'scaleX(-1)' : undefined }}/>
            {PHOTO_INFO[i] && <span className="cam-caption"><b>{PHOTO_INFO[i][0]}</b><small>{PHOTO_INFO[i][1]}</small></span>}
          </motion.div></AnimatePresence>
          : <div className="cam-empty"><b>No photos yet</b><span>more coming soon</span></div>}
        <span className="cam-hud">{n ? `${i + 1} / ${n}` : '0 / 0'}</span>
      </motion.div>
      {/* laptop only: a cue above the bar until the arrows are first used (phones stay as they are) */}
      <AnimatePresence>{!isTouch() && hint && <ArrowCue key="arrows" title="Use the arrows to browse the photos" hint="Click ← → or press the arrow keys"/>}</AnimatePresence>
      {rect.rotated ? <>
        <button className="cam-nav stack-nav up" onClick={(e) => { e.stopPropagation(); step(-1) }} disabled={n < 2} aria-label="Previous photo"><Arrow dir="up" size={22}/></button>
        <button className="cam-nav stack-nav down" onClick={(e) => { e.stopPropagation(); step(1) }} disabled={n < 2} aria-label="Next photo"><Arrow dir="down" size={22}/></button>
        <div className="rotate-hint"><RotateIcon/>Rotate your phone for a bigger view</div>
      </> : <>
        <button className="cam-nav side" style={{ left: Math.max(12, rect.bodyLeft - 68 - 48), top: rect.top + rect.height / 2 - 34 }} onClick={(e) => { e.stopPropagation(); step(-1) }} disabled={n < 2} aria-label="Previous photo"><Arrow dir="left" size={26}/></button>
        <button className="cam-nav side" style={{ left: Math.min(viewW() - 68 - 12, rect.bodyRight + 48), top: rect.top + rect.height / 2 - 34 }} onClick={(e) => { e.stopPropagation(); step(1) }} disabled={n < 2} aria-label="Next photo"><Arrow dir="right" size={26}/></button>
      </>}
    </>}
  </motion.div>
}

// Phones: an on-screen joystick. Push up/down to walk forward/back, left/right to turn; how far you push
// sets the speed. Letting go springs the knob back to the middle.
function Joystick({ onStick }) {
  const base = useRef(null), [knob, setKnob] = useState({ x: 0, y: 0, active: false })
  const R = 36 // how far the knob travels from the centre (px)
  const move = (e) => {
    const r = base.current.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy)
    if (d > R) { dx = dx / d * R; dy = dy / d * R }
    setKnob({ x: dx, y: dy, active: true })
    // a small dead zone in the middle, then a smooth ramp to full speed
    const ease = (v) => { const a = Math.abs(v); return a < .18 ? 0 : Math.sign(v) * ((a - .18) / .82) ** 1.3 }
    onStick(ease(dx / R), ease(-dy / R))
    window.dispatchEvent(new CustomEvent('joystick-move'))
  }
  const end = () => { setKnob({ x: 0, y: 0, active: false }); onStick(0, 0) }
  useEffect(() => () => onStick(0, 0), [onStick])
  return <div className="joystick" aria-label="Movement joystick: drag to walk and turn">
    <div ref={base} className={`joy-base${knob.active ? ' on' : ''}`}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={(e) => { if (knob.active) move(e) }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <i className="joy-tri up"/><i className="joy-tri down"/><i className="joy-tri left"/><i className="joy-tri right"/>
      <span className="joy-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)`, transition: knob.active ? 'none' : 'transform .25s cubic-bezier(.2,.8,.2,1.2)' }}/>
    </div>
  </div>
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [sceneReady, setSceneReady] = useState(false)
  const [clockHour, setClockHour] = useState(systemHour)
  const [manualHour, setManualHour] = useState(null) // null = follow the system clock
  const hour = manualHour ?? clockHour
  const [hotspot, setHotspot] = useState(null)
  const [systemOpen, setSystemOpen] = useState(false)
  // phone held sideways: keep the portrait layout (turned back) in the book, camera, achievements and
  // computer close-ups. Everywhere else, ask to turn the phone upright.
  const [land, setLand] = useState(phoneLandscape)
  useEffect(() => {
    const on = () => setLand(phoneLandscape())
    window.addEventListener('resize', on); window.addEventListener('orientationchange', on)
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on) }
  }, [])
  const [systemApp, setSystemApp] = useState('about')
  const [certId, setCertId] = useState(null) // the certificate open on the achievements wall
  const landOK = systemOpen && ['photos', 'projects'].includes(systemApp) // (the book and the achievements wall are portrait only on phones) // (the achievements wall is portrait only on phones)
  const [view, setView] = useState('interactive'), [switching, setSwitching] = useState(null)
  const lockOn = land && view !== 'classic' // the classic page works sideways; in the room, the computer too: same portrait layout, turned back, as the book and the camera
  useLayoutEffect(() => { setPortraitLock(lockOn); window.dispatchEvent(new Event('portrait-lock')) }, [lockOn, land])
  const sceneRef = useRef(null)
  const updateHotspot = useCallback((v) => setHotspot(v), [])
  const [deskNear, setDeskNear] = useState(false)
  const updateDeskNear = useCallback((v) => setDeskNear(v), [])
  const updateSystem = useCallback((open, app) => { if (open && app) setSystemApp(app); setSystemOpen(open) }, [])
  const updateReady = useCallback(() => setSceneReady(true), [])
  // slow or low-powered devices: if the room still hasn't loaded after 4 minutes, open the classic version
  // instead (the room keeps loading behind it, so the 3D version is there later)
  const [slowFallback, setSlowFallback] = useState(false)
  useEffect(() => {
    if (sceneReady) return undefined
    const t = window.setTimeout(() => { setSlowFallback(true); setView('classic'); window.__classicView = true }, 4 * 60 * 1000)
    return () => window.clearTimeout(t)
  }, [sceneReady])
  const updateCert = useCallback((id) => setCertId(id), [])
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
  const [tourStep, setTourStep] = useState('walk') // walk → look → (explore card) → done
  // phones: 'joystick' (walk freely) or 'buttons' (the full bar stays open; tap a place to go there), picked
  // at the start of the walkthrough (null until then)
  const [moveMode, setMoveMode] = useState(null)
  // which version is on screen: the 3D room ('interactive') or the one-page résumé ('classic'); a short
  // drafting animation covers the swap
  const requestView = useCallback((v) => { if (v !== view && !switching) setSwitching(v) }, [view, switching])
  const swapView = useCallback(() => { setView(switching); window.__classicView = switching === 'classic' }, [switching])
  const requestViewRef = useRef(requestView); requestViewRef.current = requestView
  const classicGo = useRef(null), nateGoRef = useRef(null)
  const switchDone = useCallback(() => { setSwitching(null); const go = classicGo.current; classicGo.current = null; if (go) window.setTimeout(go, 200) }, [])
  const touchUI = isTouch(), buttonsMode = touchUI && moveMode === 'buttons'
  // a close-up's camera move: until it lands, only BACK TO ROOM and Nate are on screen; the rest appears the moment it does
  const [camLanded, setCamLanded] = useState(false)
  // only the first move into a close-up hides the controls: once it has landed they stay put (page turns,
  // next certificate…) until you go back to the room
  const onCamSettled = useCallback((v) => { if (v) setCamLanded(true) }, [])
  useEffect(() => { if (!systemOpen) setCamLanded(false) }, [systemOpen])
  useEffect(() => { document.body.classList.toggle('cam-moving', systemOpen && !camLanded); return () => document.body.classList.remove('cam-moving') }, [systemOpen, camLanded])
  // first-time walkthrough, settings step: the panel is shown as it is, but nothing in it can be used yet
  useEffect(() => { document.body.classList.toggle('tour-settings', tourStep === 'settings'); return () => document.body.classList.remove('tour-settings') }, [tourStep])
  // phones: each control style is taught once per visit. The one picked at the start is taught by the
  // walkthrough; the first switch to the other one later shows just its own steps (never again after that)
  const taught = useRef(new Set())
  const [mini, setMini] = useState(null) // { mode, step } while a mini how-to is on screen
  const tourDone = tourStep === 'done'
  const changeMode = useCallback((m) => {
    setMoveMode(m); if (!m) return
    setMini(tourDone && !taught.current.has(m) ? { mode: m, step: 'walk' } : null)
    taught.current.add(m)
  }, [tourDone])
  // while that mini how-to runs, the menu is locked just like in the first walkthrough: in buttons mode only
  // the button being taught (Work, then Life) opens, as a preview; in joystick mode the menu waits
  const miniOn = !!(touchUI && mini && mini.mode === moveMode && tourDone)
  const miniDone = useCallback(() => setMini((x) => (!x ? null : x.mode === 'buttons' && x.step === 'walk' ? { ...x, step: 'swap' } : null)), [])
  // a short breath between the two buttons steps
  useEffect(() => { if (mini?.step !== 'swap') return undefined; const t = window.setTimeout(() => setMini((x) => (x?.step === 'swap' ? { ...x, step: 'play' } : x)), 350); return () => window.clearTimeout(t) }, [mini])
  const dismissCue = useCallback(() => {
    if (tourStep === 'walk' || tourStep === 'play') { const next = tourStep === 'walk' && buttonsMode ? 'play' : tourStep === 'play' ? 'settings' : 'look'; setShowCue(false); window.setTimeout(() => { setTourStep(next); setShowCue(true) }, 350); return }
    if (tourStep === 'look' && !buttonsMode) { setShowCue(false); window.setTimeout(() => { setTourStep('settings'); setShowCue(true) }, 350); return }
    // phones in buttons mode: Work → Life → Settings → look around → things to explore
    if (tourStep === 'settings' && buttonsMode) { setShowCue(false); window.setTimeout(() => { setTourStep('look'); setShowCue(true) }, 350); return }
    if (tourStep === 'settings') { setShowCue(false); window.setTimeout(() => { setTourStep('demo'); setShowCue(true) }, 350); return }
    setShowCue(false); window.setTimeout(() => setShowExplore(true), 350)
  }, [tourStep, buttonsMode, touchUI, moveMode])
  // where the walkthrough starts; the laptop demo glides back here
  const startPose = useRef(null)
  useEffect(() => { if (tourStep === 'walk' && showCue && introPhase === 'corner' && !startPose.current) startPose.current = sceneRef.current?.getPose?.() || null }, [tourStep, showCue, introPhase])
  const dismissExplore = useCallback(() => { setShowExplore(false); setTourStep('done') }, [])
  // only the control being taught is live; after "Start exploring" everything is
  useEffect(() => {
    const scene = sceneRef.current; if (!scene?.setControls) return
    // nothing works until the first cue is on screen (the name intro plays first)
    scene.setControls(tourStep === 'done' ? (miniOn ? { walk: true, look: true, open: false } : { walk: true, look: true, open: true })
      : tourStep === 'walk' ? { walk: showCue && introPhase === 'corner' && (!touchUI || !!moveMode), look: false, open: false }
      : tourStep === 'play' ? { walk: true, look: false, open: false }
      : tourStep === 'look' && !showExplore ? { walk: buttonsMode, look: true, open: false }
      : { walk: false, look: false, open: false })
  }, [tourStep, showExplore, introPhase, showCue, moveMode, touchUI, buttonsMode, miniOn])
  const setStick = useCallback((x, y) => sceneRef.current?.setStick?.(x, y), [])
  // disco lights (at the speaker): on Back, the room returns to normal first, then the camera pans out
  const [disco, setDisco] = useState(false)
  useEffect(() => { sceneRef.current?.setDisco?.(disco) }, [disco])
  useEffect(() => { if (!(systemOpen && systemApp === 'music')) setDisco(false) }, [systemOpen, systemApp])
  const closeSystem = () => {
    if (disco) { setDisco(false); window.setTimeout(() => sceneRef.current?.closeSystem(), 1300); return }
    sceneRef.current?.closeSystem()
  }
  // ── Nate ──
  const [nateMsgs, setNateMsgs] = useState([]), [nateBusy, setNateBusy] = useState(false), [tourOn, setTourOn] = useState(false)
  const nateNow = useRef({}); nateNow.current = { msgs: nateMsgs, systemOpen, systemApp, buttonsMode, closeSystem }
  const screenNow = useCallback(() => describeScreen({ scene: sceneRef.current, systemOpen: nateNow.current.systemOpen, systemApp: nateNow.current.systemApp, touch: touchUI, buttonsMode: nateNow.current.buttonsMode }), [touchUI])
  // walk to a place and open it (leaving any close-up first)
  // `inside` goes one step further once the close-up is open: a note or project on the computer,
  // or one certificate on the awards wall
  const nateInside = useCallback((inside) => {
    if (!inside) return
    if (inside.note || inside.project) { window.__macOpen = { ...inside, at: Date.now() }; window.dispatchEvent(new CustomEvent('mac-open', { detail: inside })); return }
    if (inside.cert) {
      const t0 = Date.now()
      const wait = () => { if (Date.now() - t0 > 20000) return; if (nateNow.current.systemOpen && !sceneRef.current?.busy()) { sceneRef.current?.openCert?.(inside.cert); return } window.setTimeout(wait, 150) }
      window.setTimeout(wait, 600)
    }
  }, [])
  const nateGo = useCallback((place, inside) => {
    window.dispatchEvent(new CustomEvent('nate-close'))
    // asked from the classic page: switch back to the room first, then walk there
    if (window.__classicView) { classicGo.current = () => nateGoRef.current?.(place, inside); requestViewRef.current?.('interactive'); return }
    const sc = sceneRef.current, { systemOpen: open, systemApp: app } = nateNow.current; if (!sc) return
    if (open && app === place) { nateInside(inside); return }
    if (open) sc.switchTo(place); else sc.goTo(place)
    const t0 = Date.now()
    const wait = () => {
      if (Date.now() - t0 > 20000) return
      if (!nateNow.current.systemOpen && !sc.busy() && sc.hotspotId() === place) { sc.openSpot(); nateInside(inside); return }
      window.setTimeout(wait, 120)
    }
    window.setTimeout(wait, 350)
  }, [nateInside])
  const startTour = useCallback(() => {
    window.dispatchEvent(new CustomEvent('nate-close'))
    if (nateNow.current.systemOpen) { nateNow.current.closeSystem(); window.setTimeout(() => setTourOn(true), 1100) } else setTourOn(true)
  }, [])
  // every message goes to the agent (api/nate.js): it searches his content, answers with citations, and may act
  const nateSend = useCallback(async (text) => {
    const history = [...nateNow.current.msgs, { role: 'user', content: text }]
    setNateMsgs(history)
    const say = (content, extra = {}) => setNateMsgs((m) => [...m, { role: 'assistant', content, ...extra }])
    setNateBusy(true)
    try {
      const r = await fetch('/api/nate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })), screen: screenNow() }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        const why = { 'no-key': 'I’m offline right now: my AI isn’t connected yet.', quota: 'I’ve hit my free limit for the moment. Give me a minute and ask again.', 'slow-down': 'Easy, one at a time! Give me a few seconds.' }[d.error]
        say(why || 'Something went wrong on my end. Try asking again?', { error: true }); return
      }
      const a = d.action
      // every grounded answer gets a "Take me to …" button: to what it cited (down to the note,
      // project or certificate), else to the place Nate suggested
      const t = nateTarget(d.citations) || (a?.type === 'suggest' || a?.type === 'go' ? { place: a.place } : null)
      const target = t && a?.type === 'go' && a.place !== t.place ? { place: a.place } : t
      say(d.reply, target ? { place: target.place, open: target.open, label: target.label } : {})
      if (a?.type === 'go') window.setTimeout(() => nateGo(target?.place || a.place, target?.open), 1100)
      if (a?.type === 'tour') window.setTimeout(startTour, 1100)
    } catch {
      say('I can’t reach my brain right now. Check your connection and try again?', { error: true })
    } finally { setNateBusy(false) }
  }, [nateGo, screenNow, startTour])
  nateGoRef.current = nateGo
  const nateCtx = { messages: nateMsgs, busy: nateBusy, send: nateSend, go: nateGo }
  const getTourSpot = useCallback(() => sceneRef.current?.inView?.()[0] || null, [])
  const getPhoneRect = useCallback(() => sceneRef.current?.phoneScreenRect() ?? null, [])
  const getCameraRect = useCallback(() => sceneRef.current?.cameraScreenRect() ?? null, [])
  const setMusic = useCallback((m) => sceneRef.current?.setMusic?.(m), [])
  const getCertRect = useCallback(() => sceneRef.current?.certRect?.() ?? null, [])
  const getComputerRect = useCallback(() => sceneRef.current?.computerScreenRect?.() ?? null, [])
  const setBookSide = useCallback((side) => sceneRef.current?.setBookSide?.(side), [])
  const getBookRect = useCallback(() => sceneRef.current?.focusRect('about') ?? null, [])
  const getResumeRect = useCallback(() => sceneRef.current?.resumeRect?.() ?? null, [])
  const setResumeInsets = useCallback((v) => sceneRef.current?.setResumeInsets?.(v), [])
  // fetch the résumé in the background once the room is up, so it's already on the sheet in the file
  // (after the loading screen has gone: rendering the PDF takes the browser a moment, which showed as a hitch in its animation)
  useEffect(() => {
    if (!sceneReady || loading) return
    const t = window.setTimeout(() => loadResume().then((r) => sceneRef.current?.setResumePage(r.canvas, r.aspect)).catch(() => {}), 2500)
    return () => window.clearTimeout(t)
  }, [sceneReady, loading])
  useEffect(() => { sceneRef.current?.setTimeOfDay(hour) }, [hour, sceneReady])
  // dragging the time slider lights the room directly, without re-rendering the whole app each move
  useEffect(() => { const on = (e) => sceneRef.current?.setTimeOfDay(e.detail); window.addEventListener('time-live', on); return () => window.removeEventListener('time-live', on) }, [])
  useEffect(() => { const timer = window.setInterval(() => setClockHour(systemHour()), 60000); return () => window.clearInterval(timer) }, [])
  return <NateCtx.Provider value={nateCtx}><main className="app-shell"><OfficeScene sceneRef={sceneRef} onHotspot={updateHotspot} onDeskNear={updateDeskNear} onSystem={updateSystem} onReady={updateReady} onProgress={updateProgress} onCert={updateCert} onSettled={onCamSettled}/>
    <div className="ambient-vignette"/>
    <AnimatePresence>{loading && <Loader progress={load.progress} loaded={load.loaded} total={load.total} ready={sceneReady} onEnter={finishLoading}/>}</AnimatePresence>
    <AnimatePresence>{land && !landOK && view !== 'classic' && <RotateBack key="rotate-back"/>}</AnimatePresence>
    <AnimatePresence>{systemOpen && (systemApp === 'contact'
      ? <PhoneScreen key="phone" onClose={closeSystem} getRect={getPhoneRect}/>
      : systemApp === 'about'
      ? <BookPages key="book" onClose={closeSystem} getRect={getBookRect} setSide={setBookSide}/>
      : systemApp === 'photos'
      ? <CameraView key="camera" onClose={closeSystem} getRect={getCameraRect}/>
      : systemApp === 'projects'
      ? <ComputerView key="system" onClose={closeSystem} getRect={getComputerRect}/>
      : systemApp === 'music'
      ? <MusicPanel key="music" onClose={closeSystem} onMusic={setMusic}/>
      : systemApp === 'achievements'
      ? <AchievementsView key="achievements" certId={certId} getRect={getCertRect} onNext={() => sceneRef.current?.nextCert(1)} onPrev={() => sceneRef.current?.nextCert(-1)} onBack={() => sceneRef.current?.backToWall()}/>
      : systemApp === 'resume'
      ? <ResumeView key="resume" onClose={closeSystem} getRect={getResumeRect} setInsets={setResumeInsets}/>
      : <SpotCard key={systemApp} app={systemApp} onClose={closeSystem}/>)}</AnimatePresence>
    {!loading && <div className={`office-hud${systemOpen ? ' is-interacting' : ''}${buttonsMode ? ' is-buttons' : ''}${(tourStep === 'demo' || (tourStep === 'settings' && !buttonsMode)) && !showExplore ? ' is-demo' : ''}`}>
      {introPhase !== 'hidden' && !systemOpen && <NameTag phase={introPhase}/>}
      {introPhase === 'corner' && <>
        {/* laptop: the AI assistant button sits at the far right, level with the bar (phones: beside the menu button) */}
        {!isTouch() && <div className="ai-dock"><AiButton locked={tourStep !== 'done'}/></div>}
        <BottomBar hour={hour} auto={manualHour === null} onHour={setManualHour} onAuto={() => { setManualHour(null); setClockHour(systemHour()) }} hotspot={hotspot}
          onGo={(id) => { window.dispatchEvent(new CustomEvent('spot-go')); if (systemOpen) sceneRef.current?.switchTo(id); else sceneRef.current?.goTo(id) }} onOpen={() => sceneRef.current?.openSpot()}
          interacting={systemOpen} onBack={closeSystem} locked={tourStep !== 'done' || miniOn}
          spotsLocked={(tourStep !== 'done' && !(tourStep === 'demo' && !showExplore)) || miniOn}
          workLocked={(tourStep !== 'done' && !(tourStep === 'demo' && !showExplore) && !(buttonsMode && tourStep === 'walk')) || (miniOn && !(buttonsMode && mini.step === 'walk'))}
          playLocked={(tourStep !== 'done' && !(buttonsMode && tourStep === 'play')) || (miniOn && !(buttonsMode && mini.step === 'play'))}
          teach={buttonsMode && showCue ? (tourStep === 'walk' ? 'work' : tourStep === 'play' ? 'play' : tourStep === 'settings' ? 'settings' : null)
            : miniOn && buttonsMode ? (mini.step === 'walk' ? 'work' : mini.step === 'play' ? 'play' : null) : null}
          buttonsMode={buttonsMode} moveMode={moveMode} onMoveMode={changeMode} onView={requestView}
          showDisco={systemOpen && systemApp === 'music'} disco={disco} onDisco={() => setDisco((d) => !d)}/>
        {touchUI && moveMode === 'joystick' && !systemOpen && <Joystick onStick={setStick}/>}
      </>}
      <AnimatePresence>{showCue && introPhase === 'corner' && !systemOpen && (touchUI && !moveMode && tourStep === 'walk'
        ? <ModeChoice key="mode" onPick={changeMode}/>
        : tourStep === 'demo' ? <BarDemo key="demo" sceneRef={sceneRef} startPose={startPose.current} onDone={dismissCue}/>
        : tourStep === 'settings' && !buttonsMode ? <SettingsDemo key="settings" moveMode={moveMode} n={3} onDone={dismissCue}/>
        : <TourCue key={tourStep + (moveMode || '')} step={tourStep} onDone={dismissCue} moveMode={moveMode}/>)}</AnimatePresence>
      <AnimatePresence>{touchUI && mini && mini.step !== 'swap' && mini.mode === moveMode && tourDone && introPhase === 'corner' && !systemOpen && <TourCue key={'mini-' + mini.mode + mini.step} step={mini.step} onDone={miniDone} moveMode={mini.mode} mini/>}</AnimatePresence>
      {tourOn && <NateTour mode={touchUI ? (buttonsMode ? 'buttons' : 'joystick') : 'laptop'} getSpot={getTourSpot} onEnd={() => setTourOn(false)}/>}
      <AnimatePresence>{showExplore && introPhase === 'corner' && !systemOpen && <ExploreCue key="explore" onDismiss={dismissExplore} total={5}/>}</AnimatePresence>
      <AnimatePresence>{!showCue && !showExplore && !mini && tourStep === 'done' && introPhase === 'corner' && !systemOpen && (deskNear && !buttonsMode && (!hotspot || hotspot === 'projects' || hotspot === 'achievements')
        ? <DeskCue key="desk" hotspot={hotspot}/>
        : hotspot && <SpotCue key={hotspot} id={hotspot}/>)}</AnimatePresence>
    </div>}
    {view === 'classic' && <ClassicSite contacts={CONTACTS} onView={requestView} slowNotice={slowFallback} nate={<AiButton compact={isTouch()}/>}/>}
    <AnimatePresence>{switching && <SwitchLoader key="switch" to={switching} onCover={swapView} onDone={switchDone}/>}</AnimatePresence>
  </main></NateCtx.Provider>
}
