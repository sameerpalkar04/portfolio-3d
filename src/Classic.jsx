import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PROJECTS } from './projects'
import { ACHIEVEMENTS } from './achievements'
import { SKILL_GROUPS } from './skillIcons'
import { OCI, SkillLogo } from './MacOS'
import { RESUME_DOWNLOAD, RESUME_VIEW } from './resume'
import { FloorPlan, STROKES } from './Loader'
import './classic.css'

// The classic version: the whole portfolio as one plain, full-width scrolling page over the room.
// Type and colours come from the room's own UI (DM Sans, Manrope, JetBrains Mono; the menu button's green).

const store = { get: (k) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } } }

const WORK = [{
  logo: '/about/oracle-tile.png', role: 'Application Software Engineer 1', org: 'Oracle Financial Services Software Ltd.', when: 'Aug 2026 – Present',
  points: [
    'Working on Oracle’s Accounting Foundation Cloud Service (AFCS).',
    'Developing across the Data Integration Hub (DIH) and Sub Ledger Applications (SLA) modules.',
    'Implemented API test automation, making API testing faster and more reliable.',
  ],
}]
const EXTRA = [
  { logo: '/about/riviera-mark.png', role: 'Organizer, Design & Print', org: 'Riviera 2026 · VIT Vellore', when: 'Feb 2026',
    points: ['Led the digital design team for VIT’s flagship festival of 40,000+ people.', 'Oversaw visual content strategy, promotions and multimedia coordination.'] },
  { logo: '/about/iste-logo.png?v=2', role: 'Publicity Head', org: 'ISTE · VIT Chapter, Vellore', when: 'Apr 2024 – Mar 2025',
    points: ['Directed publicity campaigns across platforms, driving 5,000+ student engagements.', 'Led outreach for the Technica hackathon, coordinating a 40+ member team for seamless execution with 2,100+ participants.'] },
]
const CITIES = ['bengaluru', 'gurugram'] // where I'm based, in turns (as in the room's corner)
const LINK_LABEL = { github: 'Source code', ieee: 'IEEE paper', website: 'Website', live: 'Live site' }
const LINK_ICON = { github: 'code', ieee: 'doc', website: 'out', live: 'out' }

// one icon set: 24px grid, 1.8 stroke, round caps
const I = (d, s = 19) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const Icon = {
  sun: I(<><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></>),
  moon: I(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>),
  out: I(<path d="M7 17 17 7M9 7h8v8"/>, 15),
  down: I(<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>),
  eye: I(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></>),
  cube: I(<><path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9.2"/></>, 16),
  up: I(<path d="M12 19V5M6 11l6-6 6 6"/>),
  code: I(<path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5"/>),
  doc: I(<><path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/></>),
  award: I(<><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.3 7 21l5-2.5 5 2.5-1.5-7.7"/></>),
  shield: I(<><path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z"/><path d="m9 12 2 2 4-4"/></>),
  close: I(<path d="M6 6l12 12M18 6 6 18"/>),
  gear: I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
  check: I(<path d="m5 12.5 4.5 4.5L19 7.5"/>),
  copy: I(<><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></>),
  Mail: I(<><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/></>),
  LinkedIn: I(<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V16M8 7.8v.01M12 16v-5.5M12 13a2.5 2.5 0 0 1 5 0v3"/></>),
  GitHub: I(<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>),
}
const tap = { whileTap: { scale: .98 }, transition: { duration: .1 } }

function Section({ title, root, children, id }) {
  return <section id={id} className="cl-sec">
    <h2>{title}</h2>
    <div className="cl-sec-body">{children}</div>
  </section>
}
const Entry = ({ title, meta, when, lead, points, children, logo }) => <article className={`cl-entry${logo ? ' cl-boxed' : ''}`}>
  {logo && <img className="cl-logo" src={logo} alt="" draggable="false"/>}
  <div className="cl-entry-main">
    <div className="cl-entry-head"><h3>{title}</h3>{when && <span className="cl-when">{when}</span>}</div>
    {meta && <p className="cl-meta">{meta}</p>}
    {lead && <p className="cl-text">{lead}</p>}
    {points?.length > 0 && <ul className="cl-points">{points.map((p) => <li key={p}>{p}</li>)}</ul>}
    {children}
  </div>
</article>

// a button that shows what happened: "Copied", "Downloading…"
function FeedbackButton({ className = 'cl-btn', icon, label, done, doneLabel, onClick, href, download, target }) {
  const [state, setState] = useState(false)
  useEffect(() => { if (!state) return undefined; const t = window.setTimeout(() => setState(false), 1800); return () => window.clearTimeout(t) }, [state])
  const Tag = href ? motion.a : motion.button
  return <Tag className={`${className}${state ? ' is-done' : ''}`} href={href} download={download} target={target} rel={target ? 'noreferrer' : undefined} {...tap}
    onClick={(e) => { onClick?.(e); if (doneLabel) setState(true) }}>
    <span className="cl-btn-ico">{state ? done : icon}</span>
    <span>{state ? doneLabel : label}</span>
  </Tag>
}

export function ClassicSite({ contacts = [], onView, nate, slowNotice = false }) {
  const [theme, setTheme] = useState(() => store.get('classic-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => { store.set('classic-theme', theme) }, [theme])
  // light ↔ dark: a soft crossfade of the whole page where the browser supports it, colour transitions otherwise
  const flipTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(() => flushSync(() => setTheme(next)))
    else setTheme(next)
  }
  const scroller = useRef(null), [scrolled, setScrolled] = useState(false)
  const toTop = () => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
  const [city, setCity] = useState(0), [noticeGone, setNoticeGone] = useState(false)
  useEffect(() => { const t = window.setInterval(() => setCity((c) => (c + 1) % CITIES.length), 10000); return () => window.clearInterval(t) }, [])
  const [cert, setCert] = useState(null) // the certificate shown full size
  useEffect(() => { if (!cert) return undefined; const k = (e) => { if (e.key === 'Escape') setCert(null) }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [cert])

  return <div ref={scroller} className={`classic theme-${theme}`} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 120)}>
    <header className={`cl-bar${scrolled ? ' is-scrolled' : ''}`}>
      <button className="cl-brand" onClick={toTop} aria-label="Sameer Palkar, back to top"><b>Sameer Palkar</b><span>software engineer</span></button>
      <div className="cl-bar-tools">
        <motion.button className="cl-view-btn" onClick={() => onView?.('interactive')} {...tap}>{Icon.cube}<span>View in interactive 3D</span></motion.button>
        <button className={`cl-switch${theme === 'dark' ? ' on' : ''}`} role="switch" aria-checked={theme === 'dark'} aria-label="Dark mode" title={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={flipTheme}>
          <span className="cl-switch-ico">{Icon.sun}</span><span className="cl-switch-ico">{Icon.moon}</span>
          <i>{theme === 'dark' ? Icon.moon : Icon.sun}</i>
        </button>
      </div>
    </header>

    {slowNotice && !noticeGone && <div className="cl-notice" role="status">
      <span>The 3D room was taking too long to load on this device, so here’s the classic version. It keeps loading in the background.</span>
      <button onClick={() => setNoticeGone(true)} aria-label="Dismiss">{Icon.close}</button>
    </div>}
    <main className="cl-page">
      <section className="cl-hero">
        <img className="cl-photo" src="/photo-frame.jpg" alt="Sameer Palkar" draggable="false"/>
        <div className="cl-about">
          <h1>Sameer Palkar</h1>
                    <p className="cl-lede">I’m a software engineer working across backend development, full‑stack technologies, and artificial intelligence. I build scalable applications, solve complex problems, and explore new technologies to develop efficient and practical solutions for real‑world challenges.</p>
          <ul className="cl-facts">
            <li>B.Tech CSE, VIT Vellore · CGPA 9.27</li>
            <li>English · Hindi · Marathi</li>
          </ul>
          <div className="cl-row-btns">
            <FeedbackButton href={RESUME_DOWNLOAD} download="Sameer-Palkar-Resume.pdf" icon={Icon.down} label="Download résumé" done={Icon.check} doneLabel="Downloading…"/>
            <motion.a className="cl-btn ghost" href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }} {...tap}>{Icon.Mail}<span>Get in touch</span></motion.a>
          </div>
        </div>
      </section>

      <Section title="Work experience" root={scroller}>
        {WORK.map((w) => <Entry key={w.role} logo={w.logo} title={w.role} meta={w.org} when={w.when} points={w.points}/>)}
      </Section>

      <Section title="Technical skills" root={scroller}>
        <dl className="cl-skills cl-box">{SKILL_GROUPS.map(([group, items]) => <div key={group}><dt>{group}</dt><dd>{items.map((x) => <span key={x} className="cl-chip"><i><SkillLogo name={x}/></i>{x}</span>)}</dd></div>)}</dl>
      </Section>

      <Section title="Projects" root={scroller}>
        <div className="cl-cards">{PROJECTS.map((p) => <article key={p.id} className="cl-card" style={{ '--pc': p.color }}>
          <div className="cl-card-body">
            {p.category && <span className="cl-card-kicker">{p.category}</span>}
            <h3>{p.name || p.title}</h3>
            <p className="cl-text">{p.tagline || p.summary}</p>
            {p.points?.length > 0 && <ul className="cl-points">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>}
            <div className="cl-card-foot">
              <span className="cl-card-tools">{(p.tools || []).slice(0, 7).map((n) => <i key={n} title={n}><SkillLogo name={n}/></i>)}{p.tools?.length > 7 && <small>+{p.tools.length - 7}</small>}</span>
              <div className="cl-actions">{Object.entries(p.links || {}).filter(([k]) => LINK_LABEL[k]).map(([k, href], i) =>
                <motion.a key={k} className={`cl-btn sm${i ? ' ghost' : ''}`} href={href} target="_blank" rel="noreferrer" {...tap}>{Icon[LINK_ICON[k]]}<span>{LINK_LABEL[k]}</span></motion.a>)}</div>
            </div>
          </div>
        </article>)}</div>
      </Section>

      <Section title="Achievements" root={scroller}>
        {ACHIEVEMENTS.map((a) => <Entry key={a.id} title={`${a.place}, ${a.title}`} meta={a.event} when={a.date.replace(/^\d+[–-]\d+ /, '')} points={a.points}>
          <div className="cl-actions">
            <motion.button className="cl-btn sm" onClick={() => setCert({ src: a.image, title: `${a.title} certificate` })} {...tap}>{Icon.award}<span>View certificate</span></motion.button>
            {a.project && <motion.a className="cl-btn sm ghost" href={a.project} target="_blank" rel="noreferrer" {...tap}>{Icon.code}<span>Source code</span></motion.a>}
          </div>
        </Entry>)}
      </Section>

      <Section title="Certifications" root={scroller}>
        <Entry title="OCI 2023 AI Certified Foundations Associate" meta={`${OCI.issuer} · ID ${OCI.id}`} when="Jul 2024" lead="Machine learning, transformers, retrieval‑augmented generation and large language models on Oracle Cloud.">
          <div className="cl-actions">
            <motion.button className="cl-btn sm" onClick={() => setCert({ src: OCI.image, title: 'Oracle certificate', pdf: OCI.pdf })} {...tap}>{Icon.award}<span>View certificate</span></motion.button>
            <motion.a className="cl-btn sm ghost" href={OCI.link} target="_blank" rel="noreferrer" {...tap}>{Icon.shield}<span>Verify credential</span></motion.a>
          </div>
        </Entry>
      </Section>

      <Section title="Extracurriculars" root={scroller}>
        {EXTRA.map((x) => <Entry key={x.org} logo={x.logo} title={x.role} meta={x.org} when={x.when} points={x.points}/>)}
      </Section>

      <Section title="Contact me" root={scroller} id="contact">
        <div className="cl-group">
        <p className="cl-text">The quickest way to reach me is email.</p>
        <div className="cl-contact">
          {contacts.map((c) => <motion.a key={c.app} className="cl-cbtn" href={c.href} target={c.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer" {...tap}>
            <span className="cl-cico" style={{ background: c.tile }}>{c.icon}</span><span className="cl-ctext"><b>{c.app === 'Mail' ? 'Email' : c.app}</b><small>{c.line}</small></span>
          </motion.a>)}
        </div>
        </div>
      </Section>

      <Section title="Résumé" root={scroller}>
        <div className="cl-group">
        <p className="cl-text">One page, always the latest version.</p>
        <div className="cl-row-btns">
          <FeedbackButton href={RESUME_DOWNLOAD} download="Sameer-Palkar-Resume.pdf" icon={Icon.down} label="Download PDF" done={Icon.check} doneLabel="Downloading…"/>
          <motion.a className="cl-btn ghost" href={RESUME_VIEW} target="_blank" rel="noreferrer" {...tap}>{Icon.eye}<span>Open in a new tab</span></motion.a>
        </div>
        </div>
      </Section>

    </main>
    <footer className="cl-foot">
        <span className="cl-foot-id"><b>Sameer Palkar</b><span>software engineer · <AnimatePresence mode="wait" initial={false}><motion.span key={city} className="cl-city" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .3 }}>{CITIES[city]}</motion.span></AnimatePresence></span></span>
        <div className="cl-row-btns">
          <motion.button className="cl-btn ghost" onClick={toTop} {...tap}>{Icon.up}<span>Back to top</span></motion.button>
          <motion.button className="cl-btn ghost" onClick={() => onView?.('interactive')} {...tap}>{Icon.cube}<span>Explore the 3D room</span></motion.button>
        </div>
    </footer>
    {nate && <div className="cl-nate">{nate}</div>}
    <AnimatePresence>{cert && <motion.div key="cert" className="cl-lightbox" role="dialog" aria-label={cert.title} onClick={() => setCert(null)}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
      <motion.figure onClick={(e) => e.stopPropagation()} initial={{ scale: .94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 6 }} transition={{ duration: .25, ease: [.2, .8, .2, 1] }}>
        <img src={cert.src} alt={cert.title}/>
        <figcaption>
          <span>{cert.title}</span>
          <span className="cl-row-btns">
            {cert.pdf && <motion.a className="cl-btn sm ghost" href={cert.pdf} target="_blank" rel="noreferrer" {...tap}>{Icon.doc}<span>Open PDF</span></motion.a>}
            <motion.button className="cl-btn sm" onClick={() => setCert(null)} autoFocus {...tap}>{Icon.close}<span>Close</span></motion.button>
          </span>
        </figcaption>
      </motion.figure>
    </motion.div>}</AnimatePresence>
  </div>
}

// ── Switching versions: the loading screen's drafting board, drawing a résumé sheet (to classic) or the
// room's floor plan (to interactive). Same strokes engine, crosshair and command line as the loader.
const R = (x, y, w, h) => `M${x} ${y} h${w} v${h} h${-w} Z`
const C = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`
const SHEET = [
  { at: [0, .13], d: 'M70 30 H30 V390 H210 V30 H110', w: 2.6, layer: 'wall', cmd: 'PLINE', what: 'laying out the page' },
  { at: [.12, .2], d: R(46, 48, 44, 54), layer: 'furn', cmd: 'RECT', what: 'placing the photo' },
  { at: [.19, .26], d: 'M102 56 H190 M102 68 H168', w: 2.2, layer: 'wall', cmd: 'LINE', what: 'writing the name' },
  { at: [.25, .33], d: 'M102 84 H192 M102 92 H186 M102 100 H160', w: .8, layer: 'obj', cmd: 'LINE', what: 'writing about me' },
  { at: [.32, .38], d: 'M46 126 H104', w: 1.8, layer: 'wall', cmd: 'TEXT', what: 'work experience' },
  { at: [.37, .44], d: 'M46 140 H192 M46 148 H184 M46 156 H150', w: .8, layer: 'obj', cmd: 'LINE', what: 'work experience' },
  { at: [.43, .48], d: 'M46 180 H96', w: 1.8, layer: 'wall', cmd: 'TEXT', what: 'technical skills' },
  { at: [.47, .55], d: 'M46 194 H190 M46 202 H176 M46 210 H184', w: .8, layer: 'obj', cmd: 'LINE', what: 'technical skills' },
  { at: [.54, .59], d: 'M46 234 H90', w: 1.8, layer: 'wall', cmd: 'TEXT', what: 'projects' },
  { at: [.58, .68], d: R(46, 246, 68, 42) + ' ' + R(124, 246, 68, 42), layer: 'furn', cmd: 'RECT', what: 'projects' },
  { at: [.67, .72], d: 'M46 308 H112', w: 1.8, layer: 'wall', cmd: 'TEXT', what: 'achievements' },
  { at: [.71, .78], d: 'M46 322 H190 M46 330 H168', w: .8, layer: 'obj', cmd: 'LINE', what: 'achievements' },
  { at: [.77, .86], d: C(54, 356, 7) + ' ' + C(76, 356, 7) + ' ' + C(98, 356, 7), layer: 'obj', cmd: 'CIRCLE', what: 'adding contact links' },
  { at: [.85, .93], d: R(140, 348, 52, 16) + ' M160 352 v8 M156 357 l4 3 4 -3', layer: 'furn', cmd: 'RECT', what: 'filing the résumé' },
]
export function SwitchLoader({ to, onCover, onDone }) {
  const classic = to === 'classic', strokes = classic ? SHEET : STROKES
  const plan = useRef(null), pctRef = useRef(null), barRef = useRef(null), coordsRef = useRef(null)
  const [pen, setPen] = useState({ cmd: 'OPEN', what: classic ? 'classic.dwg' : 'room.dwg' }), [done, setDone] = useState(false)
  useEffect(() => {
    const DRAW = 1500, START = 340, cover = window.setTimeout(onCover, 340)
    let raf = 0, end = 0
    const t0 = performance.now(), ease = (x) => (x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
    const tick = (now) => {
      const v = ease(Math.min(1, Math.max(0, (now - t0 - START) / DRAW)))
      plan.current?.(v)
      if (pctRef.current) pctRef.current.firstChild.nodeValue = String(Math.round(v * 100)).padStart(2, '0')
      if (barRef.current) barRef.current.style.transform = `scaleX(${v})`
      if (v < 1) raf = requestAnimationFrame(tick); else { setDone(true); end = window.setTimeout(onDone, 480) }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(cover); window.clearTimeout(end) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return <motion.div className={`loader cad switch-cad${done ? ' is-done' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: .3 } }} exit={{ opacity: 0, transition: { duration: .45 } }}>
    <header className="cad-top">
      <div className="cad-menubar">
        {['File', 'Edit', 'View', 'Insert', 'Draw', 'Dimension', 'Modify', 'Window', 'Help'].map((m) => <span key={m} className="cad-menu">{m}</span>)}
        <span className="cad-size">{classic ? 'classic.dwg' : 'room.dwg'}</span>
      </div>
    </header>
    <main className="cad-view">
      <div className="cad-name"><b>sameer palkar</b><span>// {classic ? 'classic version' : 'interactive version'}</span></div>
      <FloorPlan api={plan} done={done} onPen={setPen} coordsRef={coordsRef} strokes={strokes} day={!classic} finalWhat={classic ? 'printing the page' : 'switching the lights on'} label={classic ? 'A résumé page being drafted' : 'The room being drafted'}/>
    </main>
    <footer className="cad-cmd">
      <div className="cad-pct" ref={pctRef}>00<span>%</span></div>
      <div className="cad-cmd-main">
        <div className="cad-bar"><i ref={barRef}/></div>
        <p className="cad-line">
          <span className="cad-prompt">Command:</span>{' '}
          {done ? <><b>{classic ? 'PLOT' : 'RENDER'}</b> <span className="cad-ok">✓ {classic ? 'opening the classic version' : 'coming in'}</span></> : <><b>{pen.cmd}</b> <span>{pen.what}</span><i className="cad-caret"/></>}
        </p>
      </div>
    </footer>
  </motion.div>
}
