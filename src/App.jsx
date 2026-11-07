import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import OfficeScene from './OfficeScene'

const apps = [
  { id: 'about', label: 'About Me', icon: '👤', title: 'A little about me', body: <><p className="lead">Hi, I’m Sameer Palkar.</p><p>I’m a computer science student and builder who enjoys turning thoughtful ideas into useful, polished software.</p><div className="info-grid"><span>Based in</span><b>Bengaluru, India</b><span>Education</span><b>B.Tech, Computer Science · VIT Vellore</b><span>Graduating</span><b>August 2026</b></div></> },
  { id: 'projects', label: 'Projects', icon: '🗂️', title: 'Selected projects', body: <div className="project-list"><article><b>Full‑stack products</b><p>Responsive web applications, thoughtfully designed from interface through backend.</p></article><article><b>Applied AI experiments</b><p>Practical explorations that connect modern ML capabilities to real workflows.</p></article><article><b>Systems & tools</b><p>Small utilities and developer tools built to make everyday work simpler.</p></article></div> },
  { id: 'resume', label: 'Resume', icon: '📄', title: 'Experience & education', body: <><div className="timeline"><span>2022 — 2026</span><div><b>B.Tech in Computer Science</b><p>Vellore Institute of Technology · Vellore, India</p></div></div><div className="timeline"><span>Now</span><div><b>Building, learning, and looking ahead</b><p>Interested in software engineering, backend systems, and applied AI.</p></div></div><p className="note">A complete resume can be shared on request.</p></> },
  { id: 'skills', label: 'Skills', icon: '🧰', title: 'Tools I work with', body: <><p>From shaping an idea to shipping it, these are some of the tools in my kit.</p><div className="skill-pills">{['Java','Python','C++','JavaScript','TypeScript','React','Node.js','Spring Boot','FastAPI','SQL','Docker','Kubernetes','Git','Figma','AI / ML'].map((x) => <span key={x}>{x}</span>)}</div></> },
  { id: 'contact', label: 'Contact', icon: '✉️', title: 'Let’s make something', body: <><p className="lead">Have an interesting idea or opportunity?</p><p>I’d love to hear about it. The best way to reach me is by email.</p><a className="mail-link" href="mailto:palkarsameer04@gmail.com">palkarsameer04@gmail.com ↗</a><p className="note">Bengaluru · India</p></> },
]

function TrafficLights({ onClose }) { return <div className="traffic-lights" aria-label="Window controls"><button className="light red" onClick={onClose} aria-label="Close"/><button className="light yellow" aria-label="Minimize"/><button className="light green" aria-label="Zoom"/></div> }

const isNightByLocalTime = () => { const hour=new Date().getHours(); return hour<6 || hour>=18 }

function LightingPanel({ night, autoMode, onToggleMode, onUseSystemTime }) {
  return <div className="lighting-card"><span className="lighting-label">WINDOW LIGHT</span><button className="mode-switch" onClick={onToggleMode} aria-label={`Switch to ${night ? 'day' : 'night'} mode`}><span>{night ? '☾' : '☀'}</span>{night ? 'NIGHT' : 'DAY'}</button>{autoMode ? <span className="live-dot">● AUTO</span> : <button className="mode-switch" onClick={onUseSystemTime} title="Follow local system time">AUTO</button>}</div>
}

function LoadingScreen({ onDone, ready }) {
  useEffect(() => { if (!ready) return undefined; const timer = window.setTimeout(onDone, 450); return () => window.clearTimeout(timer) }, [onDone, ready])
  return <motion.div className="boot-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.015 }} transition={{ duration: .22 }}>
    <div className="boot-window"><div className="boot-titlebar"><TrafficLights/><span>WELCOME</span><span className="title-spacer"/></div>
      <div className="boot-content"><div className="boot-mark">sp<span>.</span></div><p className="boot-kicker">A PORTFOLIO BY</p><h1>Sameer Palkar</h1><p className="boot-subtitle">A little space to explore the work.</p><div className="boot-progress"><i/></div><span className="boot-status">Preparing your visit…</span></div>
    </div><span className="boot-foot">PERSONAL PORTFOLIO · EST. 2026</span>
  </motion.div>
}

function PortfolioSystem({ onClose }) {
  const [active, setActive] = useState('about')
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer) }, [])
  const selected = apps.find((app) => app.id === active)
  return <motion.div className="system-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="mac-menu"><span className="apple-mark">●</span><b>Finder</b><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span><span className="menu-time">⌁ &nbsp; Wi‑Fi &nbsp; ▰ &nbsp; {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
    <div className="desktop-welcome"><span>WELCOME TO MY DIGITAL WORKSPACE</span><h2>Good to have you here.</h2><p>Pick an app to explore my corner of the internet.</p></div>
    <div className="desktop-icons">{apps.map((app) => <button key={app.id} className={`desktop-icon ${active === app.id ? 'selected' : ''}`} onClick={() => setActive(app.id)}><span>{app.icon}</span><b>{app.label}</b></button>)}</div>
    <motion.section key={selected.id} className="app-window" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .22 }}>
      <header className="app-titlebar"><TrafficLights onClose={onClose}/><span>{selected.title}</span><span className="title-spacer"/></header><div className="app-body"><div className="app-sidebar">{apps.map((app) => <button className={active === app.id ? 'current' : ''} onClick={() => setActive(app.id)} key={app.id}><span>{app.icon}</span>{app.label}</button>)}</div><article className="app-copy"><span className="section-eyebrow">SAMEER PALKAR · PORTFOLIO</span><h3>{selected.title}</h3>{selected.body}</article></div>
    </motion.section>
    <nav className="dock">{apps.map((app) => <button key={app.id} onClick={() => setActive(app.id)} title={app.label} className={active === app.id ? 'dock-active' : ''}><span>{app.icon}</span></button>)}<i/><button onClick={onClose} title="Close system"><span>⏻</span></button></nav>
    <button className="close-system" onClick={onClose}>↩ &nbsp; Close system <kbd>⌫</kbd></button>
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
    <button {...control('ArrowUp')} aria-label="Walk forward">↑</button><button {...control('ArrowLeft')} aria-label="Turn left">←</button><button {...control('ArrowDown')} aria-label="Walk backward">↓</button><button {...control('ArrowRight')} aria-label="Turn right">→</button>
  </div></div>
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [sceneReady, setSceneReady] = useState(false)
  const [systemNight, setSystemNight] = useState(isNightByLocalTime)
  const [manualNight, setManualNight] = useState(null)
  const night = manualNight ?? systemNight
  const [nearby, setNearby] = useState(false)
  const [systemOpen, setSystemOpen] = useState(false)
  const sceneRef = useRef(null)
  const updateNearby = useCallback((v) => setNearby(v), [])
  const updateSystem = useCallback((v) => setSystemOpen(v), [])
  const updateReady = useCallback(() => setSceneReady(true), [])
  const finishLoading = useCallback(() => setLoading(false), [])
  const onKey = (key, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key, bubbles: true }))
  const toggleMode = () => setManualNight(!night)
  const autoMode = manualNight === null
  useEffect(() => { sceneRef.current?.setMode(night ? 'night' : 'day') }, [night])
  useEffect(() => { const timer=window.setInterval(()=>setSystemNight(isNightByLocalTime()),60000); return ()=>window.clearInterval(timer) }, [])
  return <main className="app-shell"><OfficeScene sceneRef={sceneRef} onNearby={updateNearby} onSystem={updateSystem} onReady={updateReady}/>
    <div className="ambient-vignette"/>
    <AnimatePresence>{loading && <LoadingScreen onDone={finishLoading} ready={sceneReady}/>}</AnimatePresence>
    {!loading && !systemOpen && <motion.div className="office-hud" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="hud-brand"><span className="brand-monogram">sp.</span><div><b>SAMEER PALKAR</b><span>INTERACTIVE PORTFOLIO</span></div></div>
      <LightingPanel night={night} autoMode={autoMode} onToggleMode={toggleMode} onUseSystemTime={()=>setManualNight(null)}/>
      <div className="walk-card"><span className="walk-label"><i/> EXPLORE THE HOME OFFICE</span><p>Look around the home office, then head to the work desk to open my portfolio.</p><div className="key-hint"><span>↑ WALK</span><span>← TURN</span><span>↓ BACK</span><span>→ TURN</span></div><span className="walk-foot">DRAG TO LOOK · SCROLL TO ZOOM · ENTER AT DESK</span></div>
      {nearby && <motion.button className="enter-prompt" onClick={() => onKey('Enter', true)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><kbd>ENTER ↵</kbd><span>Open my portfolio</span></motion.button>}
      <MobileControls onKey={onKey}/>
      <div className="scene-corner">FIRST PERSON <span>·</span> HOME OFFICE <span>·</span> WORK DESK</div>
    </motion.div>}
    <AnimatePresence>{systemOpen && <PortfolioSystem onClose={() => onKey('Backspace', true)}/>}</AnimatePresence>
    {systemOpen && <button className="system-backspace" onClick={() => onKey('Backspace', true)}>Close system <kbd>⌫</kbd></button>}
  </main>
}
