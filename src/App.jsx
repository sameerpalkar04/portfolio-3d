import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import OfficeScene from './OfficeScene'
import Loader from './Loader'
import { viewW, viewH, fracAlong, phoneLandscape, setPortraitLock } from './orientation'
import { ACHIEVEMENTS } from './achievements'

// Songs on the speaker: add your picks here as { title, artist, link? }.
const songs = []

function Playlist() {
  if (!songs.length) return <><p>A few songs I keep on repeat while I work.</p><p className="note">The playlist is being put together. Check back soon.</p></>
  return <><p>A few songs I keep on repeat while I work.</p><ol className="playlist">{songs.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.artist}</span>{s.link && <a href={s.link} target="_blank" rel="noreferrer">listen ↗</a>}</li>)}</ol></>
}

// The résumé is the latest PDF in my Google Drive folder, served by /api/resume (api/resume.js).
const RESUME_URL = '/api/resume', RESUME_VIEW = '/api/resume?view=1', RESUME_DOWNLOAD = '/api/resume?dl=1', RESUME_NAME = 'Sameer-Palkar-Resume.pdf'
function ResumeLink() {
  return <a className="mail-link" href={RESUME_DOWNLOAD} download={RESUME_NAME}>Download résumé (PDF) <Arrow dir="down" size={13}/></a>
}
// Fetch the PDF once and render its first page with pdf.js (served from /public/pdfjs):
// { canvas, url (image), aspect (height / width), links: [{ href, left, top, width, height } in %] }
let resumeJob = null
function loadResume() {
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
      setGeo({ k, x: viewW() / 2 - W / 2 - left, y: viewH() / 2 - H / 2 - top })
    }
    measure()
    document.fonts?.ready.then(measure) // the web font changes the width once it loads
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const inCenter = phase === 'center'
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
  { id: 'achievements', object: 'Achievements', opens: 'Certificates' },
  { id: 'resume', object: 'Files', opens: 'Résumé' },
  { id: 'contact', object: 'Phone', opens: 'Contact' },
]
// Explorable but without a shortcut in the bar (the bar keeps to the professional things).
const ALL_SPOTS = [...SPOTS, { id: 'music', object: 'Speaker', opens: 'Song picks' }, { id: 'photos', object: 'Camera', opens: 'Through my lens' }, { id: 'pets', object: 'Rio & Bruno', opens: 'Pet them' }]

// A slider built from plain elements so dragging works the same with a mouse, a finger or a pen
// (the native range input fights with touch scrolling on phones). Arrow keys also work.
function TimeSlider({ value, onChange }) {
  const track = useRef(null)
  const set = (clientX, clientY) => { const r = track.current.getBoundingClientRect(); onChange(Math.min(5, Math.max(0, fracAlong(r, clientX, clientY) * 5))) }
  return <div ref={track} className="tslider" role="slider" tabIndex={0} aria-label="Time of day" aria-valuemin={0} aria-valuemax={5} aria-valuenow={+value.toFixed(2)}
    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX, e.clientY) }}
    onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e.clientX, e.clientY) }}
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
function AiButton({ compact }) {
  const [soon, setSoon] = useState(false)
  const [hover, setHover] = useState(false) // laptop: "Ask Nate" on hover
  useEffect(() => { if (!soon) return undefined; const t = window.setTimeout(() => setSoon(false), 2400); return () => window.clearTimeout(t) }, [soon])
  return <div className={`ai-wrap${compact ? ' is-fab' : ''}`}>
    <button className="ai-btn" onClick={() => setSoon(true)} aria-label="Ask Nate, my AI assistant (coming soon)"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true) }} onPointerLeave={() => setHover(false)}>
      <AiIcon size={compact ? 34 : 32}/>
    </button>
    <AnimatePresence>{soon && <motion.div key="soon" className="ai-soon" role="status" initial={{ opacity: 0, y: 6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: .22 }}>
      <b>Nate</b><small>Coming soon: ask me anything about my work</small>
    </motion.div>}
    {hover && !soon && <motion.div key="hint" className="ai-soon ai-hint" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 3 }} transition={{ duration: .16 }}><b>Ask Nate</b></motion.div>}
    </AnimatePresence>
  </div>
}

function BottomBar({ hour, auto, onHour, onAuto, hotspot, onGo, onOpen, interacting, onBack, locked }) {
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
  // during the first-visit walkthrough only Instructions and the appearance slider work
  const here = locked ? null : ALL_SPOTS.find((s) => s.id === hotspot)
  // Phones: the bar folds away into one menu button so the room gets the screen.
  // Only the action that matters right now (INTERACT / BACK TO ROOM) floats beside it.
  const compact = isTouch()
  const [open, setOpen] = useState(false)
  // phone: while the menu is open, the close-up controls (page / photo buttons, rotate cue) step aside
  useEffect(() => { document.body.classList.toggle('menu-open', open); return () => document.body.classList.remove('menu-open') }, [open])
  useEffect(() => { if (interacting) setOpen(false) }, [interacting])
  if (compact && !open) return <motion.div key="fabs" className="touch-fabs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
    <AnimatePresence>
      {interacting
        ? <motion.button key="back" className="fab-action" onClick={onBack} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }}><Arrow dir="left"/> BACK TO ROOM</motion.button>
        : here && <motion.button key="interact" className="fab-action" onClick={onOpen} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }}>INTERACT <Arrow/></motion.button>}
    </AnimatePresence>
    <AiButton compact/>
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
          {SPOTS.map((s) => <button key={s.id} className={hotspot === s.id && !locked ? 'here' : ''} disabled={locked} onClick={() => { setPanel(null); setOpen(false); onGo(s.id) }} title={locked ? 'Finish the walkthrough first' : `Go to the ${s.object.toLowerCase()} · ${s.opens}`}>{s.object}</button>)}
        </div>
        {compact
          ? <button className="bar-open is-close" onClick={() => { setPanel(null); setOpen(false) }} aria-label="Close menu"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg> CLOSE</button>
          : interacting
          ? <button className="bar-open is-back" onClick={onBack} title="Back to the room"><Arrow dir="left"/> BACK TO ROOM</button>
          : <button className="bar-open" onClick={onOpen} disabled={!here} title={here ? (here.id === 'pets' ? 'Pet Rio & Bruno' : `Open ${here.opens.toLowerCase()}`) : locked ? 'Finish the walkthrough first' : 'Walk up to something first'}>INTERACT <Arrow/></button>}
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
  achievements: { name: 'my achievements', tap: 'the certificates', does: 'view my achievements', icon: SVG(<><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21l4.5-2.5 4.5 2.5L15 13.5"/></>) },
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

// Shown once at the start, after the look-around cue: what there is to find in the room.
function ExploreCue({ onDismiss }) {
  const touch = isTouch()
  return <motion.div className={`look-cue explore-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
    <span className="tour-step">Step 3 of 3</span>
    <b>Things to explore</b>
    <ul className="explore-rows">{ALL_SPOTS.map((s) => <li key={s.id}><span className="cue-cam">{CUES[s.id]?.icon}</span><span className="ex-name">{s.object}</span><small>{s.opens}</small></li>)}
      <li key="ai"><span className="cue-cam ex-ai"><AiIcon size={18}/></span><span className="ex-name">Ask Nate</span><small>AI assistant · soon</small></li>
    </ul>
    <small className="explore-foot">{touch ? 'Walk up to one, or use the menu to go straight there' : 'Walk up to one, or use the shortcuts in the bar'}</small>
    <button className="tour-start" onClick={onDismiss}>Start exploring <Arrow dir="right" size={16}/></button>
  </motion.div>
}

// First-visit walkthrough: walk → look around → see what's in the room → start exploring.
// Each step waits for the visitor to actually do it.
function TourCue({ step, onDone }) {
  const touch = isTouch()
  useEffect(() => {
    if (step === 'walk') {
      let t = 0
      const onKey = (e) => { if (e.key.startsWith('Arrow') && !t) t = window.setTimeout(onDone, 700) }
      window.addEventListener('keydown', onKey)
      return () => { window.removeEventListener('keydown', onKey); window.clearTimeout(t) }
    }
    if (step === 'look') {
      let down = null, moved = 0, done = false
      const onDown = (e) => { if (e.target.closest?.('.office-canvas')) { down = { x: e.clientX, y: e.clientY }; moved = 0 } }
      const onMove = (e) => { if (!down || done) return; moved += Math.hypot(e.clientX - down.x, e.clientY - down.y); down = { x: e.clientX, y: e.clientY }; if (moved > 60) { done = true; window.setTimeout(onDone, 400) } }
      const onUp = () => { down = null }
      window.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
      return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    }
    return undefined
  }, [step, onDone])
  const n = step === 'walk' ? 1 : 2
  return <motion.div className={`look-cue tour-cue${touch ? ' is-touch' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: .4 }}>
    <span className="tour-step">Step {n} of 3</span>
    {step === 'walk'
      ? <><span className="cue-arrows"><i><Arrow dir="up" size={12}/></i><i><Arrow dir="left" size={12}/></i><i><Arrow dir="down" size={12}/></i><i><Arrow dir="right" size={12}/></i></span><b>{touch ? 'Tap the arrows to walk' : 'Use the arrow keys to walk'}</b><small>{touch ? 'Try it now: tap any arrow' : 'Try it now: press any arrow key'}</small></>
      : <>{touch ? <span className="cue-swipe"><svg viewBox="0 0 48 24" width="48" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h36M11 7l-5 5 5 5M37 7l5 5-5 5"/><circle cx="24" cy="12" r="4.5" fill="currentColor" stroke="none"/></svg></span> : <span className="cue-mouse"><i/></span>}<b>{touch ? 'Drag on the screen to look around' : 'Click and drag to look around'}</b><small>Try it now</small></>}
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
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55 + i * .12, duration: .45, ease: [.2, .8, .2, 1] }}
          whileHover={{ y: -1, transition: { duration: .15 } }} whileTap={{ scale: .98, transition: { duration: .1 } }}>
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
    const key = (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowRight' ? 1 : -1) } }
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
  return <motion.div className="phone-overlay" onClick={onClose} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
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
  return <motion.div className="phone-overlay mac-overlay" onClick={onClose} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    {rect && <>
      <motion.div className="mac-display" onClick={(e) => e.stopPropagation()}
        style={rect.rotated
          ? { left: rect.left + rect.width / 2 - long / 2, top: rect.top + rect.height / 2 - short / 2, width: long, height: short, rotate: 90 }
          : { left: rect.left, top: rect.top, width: long, height: short }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }}>
        <div className="mac-frame" style={{ width: DW, height: DH, transform: `scale(${scale})` }}><PortfolioSystem onClose={onClose}/></div>
      </motion.div>
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
const placeTone = (place) => (/^1/.test(place) ? 'gold' : /^2/.test(place) ? 'silver' : /^3/.test(place) ? 'bronze' : 'gold')
const MedalIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3h8l-2.5 6h-3z"/><circle cx="12" cy="15" r="5.5"/><path d="m12 12.3.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z" fill="currentColor" stroke="none"/></svg>
function CertDetails({ a, cue }) {
  return <>
    <div className="cert-head">
      <span className={`cert-place ${placeTone(a.place)}`}><MedalIcon/>{a.place}</span>
      {/* phones: a nudge that there's more to read below, gone once they slide */}
      <AnimatePresence>{cue && <motion.span key="cue" className="cert-scroll-cue" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: .5, duration: .3 }}>
        <Arrow dir="up" size={13}/>Slide up to read more</motion.span>}</AnimatePresence>
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

// phone details box: the text scrolls inside; the slide cue shows while there's more below and nothing has been scrolled
function CertScroll({ a }) {
  const ref = useRef(null)
  const [cue, setCue] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const check = () => setCue((c) => c === 'done' ? c : el.scrollHeight - el.clientHeight > 8)
    check(); const t = setTimeout(check, 400)
    return () => clearTimeout(t)
  }, [a])
  return <div className="cert-box-scroll" ref={ref} onScroll={(e) => { if (e.currentTarget.scrollTop > 6) setCue('done') }}>
    <CertDetails a={a} cue={cue === true}/>
  </div>
}

// a hand swiping right
const SwipeIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M12 11.5v-1a1.5 1.5 0 0 1 3 0v1.5M15 11.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a5 5 0 0 1-4-2l-2.6-3.5a1.5 1.5 0 0 1 2.3-1.9L9 15"/><path d="M15 3.5h5M18 1.5l2 2-2 2"/></svg>

// Achievements: the camera faces the framed certificates above the iMac. Click (or tap) a certificate to
// see it up close with its description; Next pans out to the wall and in to the next one.
function AchievementsView({ certId, getRect, onNext, onBack }) {
  const phone = isTouch() // phones: the wall is shown sideways; a certificate opens upright with its details below
  const [rect, setRect] = useState(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const r = getRect(); setRect((p) => (!r ? null : p && p.id === r.id && Math.abs(p.left - r.left) + Math.abs(p.top - r.top) + Math.abs(p.width - r.width) < 1 ? p : r))
      // phones: where the buttons start (the details box stops the same distance above them as below the frame)
      const b = document.querySelector('.cert-next')?.getBoundingClientRect().top
      if (b) setBtnTop((p) => (Math.abs((p || 0) - b) < 1 ? p : b))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getRect])
  const dock = useBarSpot()
  const [btnTop, setBtnTop] = useState(null)
  const a = ACHIEVEMENTS.find((x) => x.id === certId)
  const shown = a && rect && rect.id === certId ? a : null
  const nextStyle = dock ? (dock.mode === 'beside' ? { left: dock.right + 8, bottom: viewH() - dock.mid - 22 } : { right: viewW() - dock.right, bottom: viewH() - dock.top + 8 }) : undefined
  return <motion.div className="phone-overlay achv-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <AnimatePresence>{!certId && <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      {/* the same cue boxes as "Pinch to zoom" on the résumé; phones also get one for swiping along the wall */}
      {phone
        // phones: one box with two rows, like the cue at the desk corner
        ? <motion.div className="look-cue cam-cue desk-cue is-touch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8, duration: .35 }}>
            <span className="dc-row on"><span className="cue-cam"><SwipeIcon/></span><span className="cue-text"><b>Swipe left to see the whole wall</b><small>Drag across to move along it</small></span></span>
            <span className="dc-row on"><span className="cue-cam">{CUES.achievements.icon}</span><span className="cue-text"><b>Tap a certificate to view it</b><small>See what each achievement was for</small></span></span>
          </motion.div>
        : <motion.div className="look-cue cam-cue achv-cue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8, duration: .35 }}>
            <span className="cue-cam">{CUES.achievements.icon}</span>
            <span className="cue-text"><b>Click a certificate to view it</b><small>See what each achievement was for</small></span>
          </motion.div>}
    </motion.div>}</AnimatePresence>
    <AnimatePresence>{shown && (phone
      // phone: the framed certificate on the wall up top (the room stays in view), its details below
      ? <motion.div key={shown.id} className="cert-sheet" onClick={(e) => { if (e.target === e.currentTarget) onBack() }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}>
          {/* fixed in place, equal gaps above and below; its text scrolls inside it */}
          <article className="cert-box fixed" style={{ top: rect.frameBottom + 16, bottom: viewH() - (btnTop ?? viewH() - 130) + 16 }}>
            <CertScroll a={shown}/>
          </article>
        </motion.div>
      // laptop: the certificate on the left, this card on the right
      : <div key={shown.id} className="cert-card-wrap" style={{ left: rect.left + rect.width * 1.11 + 24 }}>
          <motion.i className="cert-scrim" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .35 }}/>
          <motion.article className="cert-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: .35, ease: [.2, .8, .2, 1] }}>
            <CertDetails a={shown}/>
          </motion.article>
        </div>)}</AnimatePresence>
    {/* beside the bar (laptop) or bottom-left (phone): back to the whole wall, and on to the next certificate */}
    {certId && <motion.div className={`resume-actions cert-next${dock ? (dock.mode === 'above' ? ' row' : '') : ' stacked'}`} style={nextStyle}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
      {/* like the résumé: the dark button on top, the white one level with the bar */}
      {ACHIEVEMENTS.length > 1 && <button className="resume-btn primary" onClick={onNext}>Next certificate <Arrow size={14}/></button>}
      <button className="resume-btn" onClick={onBack}><Arrow dir="left" size={14}/> Back to certificates</button>
    </motion.div>}
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
    on('ended', () => playRef.current((curRef.current + 1) % SONGS.length))
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
  return <motion.div className="phone-overlay music-overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
    <motion.article ref={card} className="music-card" onClick={stop} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ delay: .75, duration: .4, ease: [.2, .8, .2, 1] }}>
      <header><h3>On my speaker</h3><span className="music-sub">Songs on repeat</span></header>
      <p className="music-tag">The songs that keep me going.</p>
      {/* now playing */}
      <div className={`np${playing ? ' is-playing' : ''}`}>
        <img src={song.art} alt="" width="64" height="64"/>
        <div className="np-text">
          <small>{missing ? 'No preview for this one' : loading ? 'Loading…' : playing ? 'Now playing' : 'Tap play to listen'}</small>
          <b>{song.title}</b><span>{song.by}</span>
          <div className="np-bar"><i style={{ width: `${prog * 100}%` }}/></div>
        </div>
        {missing
          ? <a className="np-btn" href={`https://open.spotify.com/track/${song.id}`} target="_blank" rel="noreferrer" aria-label="Open in Spotify"><OutIcon/></a>
          : <button className="np-btn primary" onClick={() => playAt(cur)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <PauseIcon/> : <PlayIcon/>}</button>}
        <button className="np-btn" onClick={next} aria-label="Next song"><NextIcon/></button>
      </div>
      <ol className="music-list">{SONGS.map((s, i) => <li key={s.id}>
        <div className={`music-row${i === cur ? ' on' : ''}`} role="button" tabIndex={0} onClick={() => playAt(i)} onKeyDown={(e) => { if (e.key === 'Enter') playAt(i) }} aria-label={`Play ${s.title}`}>
          <span className="music-n">{i === cur && playing ? <Eq/> : i + 1}</span>
          <img src={s.art} alt={`${s.title} cover art`} loading="lazy" width="48" height="48"/>
          <span className="music-text"><b>{s.title}</b><small>{s.by}</small></span>
          <a className="music-go" href={s.href || `https://open.spotify.com/track/${s.id}`} target="_blank" rel="noreferrer" onClick={stop}>Spotify <OutIcon/></a>
        </div>
      </li>)}</ol>
    </motion.article>
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
  return <motion.div className="phone-overlay resume-overlay" onClick={onClose} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
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
      {/* laptop only: a cue above the bar until the arrows are first used (phones stay as they are) */}
      <AnimatePresence>{!isTouch() && hint && <ArrowCue key="arrows" title="Use the arrows to browse the photos" hint="Click ← → or press the arrow keys"/>}</AnimatePresence>
      {rect.rotated ? <>
        <button className="cam-nav stack-nav up" onClick={(e) => { e.stopPropagation(); step(-1) }} disabled={n < 2} aria-label="Previous photo"><Arrow dir="up" size={22}/></button>
        <button className="cam-nav stack-nav down" onClick={(e) => { e.stopPropagation(); step(1) }} disabled={n < 2} aria-label="Next photo"><Arrow dir="down" size={22}/></button>
        <div className="rotate-hint"><RotateIcon/>Rotate your phone for a bigger view</div>
      </> : <>
        <button className="cam-nav" style={{ left: Math.max(8, rect.bodyLeft - 56 - 22), top: rect.top + rect.height / 2 - 28 }} onClick={(e) => { e.stopPropagation(); step(-1) }} disabled={n < 2} aria-label="Previous photo"><Arrow dir="left" size={22}/></button>
        <button className="cam-nav" style={{ left: Math.min(viewW() - 64, rect.bodyRight + 22), top: rect.top + rect.height / 2 - 28 }} onClick={(e) => { e.stopPropagation(); step(1) }} disabled={n < 2} aria-label="Next photo"><Arrow dir="right" size={22}/></button>
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
  const lockOn = land // the computer too: same portrait layout, turned back, as the book and the camera
  useLayoutEffect(() => { setPortraitLock(lockOn); window.dispatchEvent(new Event('portrait-lock')) }, [lockOn, land])
  const sceneRef = useRef(null)
  const updateHotspot = useCallback((v) => setHotspot(v), [])
  const [deskNear, setDeskNear] = useState(false)
  const updateDeskNear = useCallback((v) => setDeskNear(v), [])
  const updateSystem = useCallback((open, app) => { if (open && app) setSystemApp(app); setSystemOpen(open) }, [])
  const updateReady = useCallback(() => setSceneReady(true), [])
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
  const dismissCue = useCallback(() => {
    if (tourStep === 'walk') { setShowCue(false); window.setTimeout(() => { setTourStep('look'); setShowCue(true) }, 350); return }
    setShowCue(false); window.setTimeout(() => setShowExplore(true), 350)
  }, [tourStep])
  const dismissExplore = useCallback(() => { setShowExplore(false); setTourStep('done') }, [])
  // only the control being taught is live; after "Start exploring" everything is
  useEffect(() => {
    const scene = sceneRef.current; if (!scene?.setControls) return
    scene.setControls(tourStep === 'done' ? { walk: true, look: true, open: true }
      : tourStep === 'walk' ? { walk: true, look: false, open: false }
      : tourStep === 'look' && !showExplore ? { walk: false, look: true, open: false }
      : { walk: false, look: false, open: false })
  }, [tourStep, showExplore, introPhase])
  const onKey = (key, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key, bubbles: true }))
  const closeSystem = () => sceneRef.current?.closeSystem()
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
  useEffect(() => {
    if (!sceneReady) return
    const t = window.setTimeout(() => loadResume().then((r) => sceneRef.current?.setResumePage(r.canvas, r.aspect)).catch(() => {}), 1500)
    return () => window.clearTimeout(t)
  }, [sceneReady])
  useEffect(() => { sceneRef.current?.setTimeOfDay(hour) }, [hour, sceneReady])
  useEffect(() => { const timer = window.setInterval(() => setClockHour(systemHour()), 60000); return () => window.clearInterval(timer) }, [])
  return <main className="app-shell"><OfficeScene sceneRef={sceneRef} onHotspot={updateHotspot} onDeskNear={updateDeskNear} onSystem={updateSystem} onReady={updateReady} onProgress={updateProgress} onCert={updateCert}/>
    <div className="ambient-vignette"/>
    <AnimatePresence>{loading && <Loader progress={load.progress} loaded={load.loaded} total={load.total} ready={sceneReady} onEnter={finishLoading}/>}</AnimatePresence>
    <AnimatePresence>{land && !landOK && <RotateBack key="rotate-back"/>}</AnimatePresence>
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
      ? <AchievementsView key="achievements" certId={certId} getRect={getCertRect} onNext={() => sceneRef.current?.nextCert()} onBack={() => sceneRef.current?.backToWall()}/>
      : systemApp === 'resume'
      ? <ResumeView key="resume" onClose={closeSystem} getRect={getResumeRect} setInsets={setResumeInsets}/>
      : <SpotCard key={systemApp} app={systemApp} onClose={closeSystem}/>)}</AnimatePresence>
    {!loading && <div className={`office-hud${systemOpen ? ' is-interacting' : ''}`}>
      {introPhase !== 'hidden' && !systemOpen && <NameTag phase={introPhase}/>}
      {introPhase === 'corner' && <>
        {/* laptop: the AI assistant button sits at the far right, level with the bar (phones: beside the menu button) */}
        {!isTouch() && <div className="ai-dock"><AiButton/></div>}
        <BottomBar hour={hour} auto={manualHour === null} onHour={setManualHour} onAuto={() => { setManualHour(null); setClockHour(systemHour()) }} hotspot={hotspot}
          onGo={(id) => { if (systemOpen) closeSystem(); sceneRef.current?.goTo(id) }} onOpen={() => sceneRef.current?.openSpot()}
          interacting={systemOpen} onBack={closeSystem} locked={tourStep !== 'done'}/>
        {isTouch() && !systemOpen && <MobileControls onKey={onKey}/>}
      </>}
      <AnimatePresence>{showCue && introPhase === 'corner' && !systemOpen && <TourCue key={tourStep} step={tourStep} onDone={dismissCue}/>}</AnimatePresence>
      <AnimatePresence>{showExplore && introPhase === 'corner' && !systemOpen && <ExploreCue key="explore" onDismiss={dismissExplore}/>}</AnimatePresence>
      <AnimatePresence>{!showCue && !showExplore && tourStep === 'done' && introPhase === 'corner' && !systemOpen && (deskNear && (!hotspot || hotspot === 'projects' || hotspot === 'achievements')
        ? <DeskCue key="desk" hotspot={hotspot}/>
        : hotspot && <SpotCue key={hotspot} id={hotspot}/>)}</AnimatePresence>
    </div>}
  </main>
}
