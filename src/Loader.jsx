import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Loading screen, styled as a CAD program drafting the office: a dark workspace with a drawing grid, a
// crosshair that draws the floor plan stroke by stroke (walls, window, furniture, then each place you can
// visit, labelled), and a command line at the bottom with the real download progress. When the room has
// loaded, the drawing is "rendered" (the lamp and window light up) and Enter appears.

const mb = (bytes) => (bytes / 1048576).toFixed(1)
const seg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)))
const circ = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`

// [start, end] of each stroke along the progress, its path, weight, layer and the command that draws it
const STROKES = [
  { at: [0, .14], d: 'M70 20 H20 V400 H220 V372 M220 330 V20 H170', w: 3.2, layer: 'wall', cmd: 'PLINE', what: 'putting up the walls' },
  { at: [.13, .19], d: 'M70 17 H170 M70 20 H170 M70 23 H170', w: .8, layer: 'wall', cmd: 'LINE', what: 'fitting the window' },
  { at: [.18, .24], d: 'M220 372 H180 M180 372 A40 40 0 0 1 220 332', w: .8, layer: 'wall', cmd: 'ARC', what: 'hanging the door' },
  { at: [.23, .3], d: 'M64 26 H176 V60 H64 Z M70 52 H170', layer: 'furn', cmd: 'RECT', what: 'building the window seat' },
  { at: [.29, .4], d: 'M24 74 H66 V356 H24', layer: 'furn', cmd: 'PLINE', what: 'moving the desks in' },
  { at: [.31, .4], d: 'M24 86 H44 V250 H24', w: .7, layer: 'furn', dash: '3 3', cmd: 'LINE', what: 'putting up the shelves' },
  { at: [.37, .48], d: 'M216 110 H170 V316 H216', layer: 'furn', cmd: 'PLINE', what: 'moving the desks in' },
  { at: [.47, .54], d: circ(150, 200, 13) + ' M137 200 H131', layer: 'furn', cmd: 'CIRCLE', what: 'rolling the chair in' },
  { at: [.52, .58], d: 'M206 182 V226 M206 204 H198', w: 2, layer: 'obj', cmd: 'LINE', what: 'setting up the computer' },
  { at: [.57, .62], d: circ(186, 268, 7), layer: 'obj', cmd: 'CIRCLE', what: 'plugging in the lamp' },
  { at: [.59, .63], d: 'M191 234 h10 v17 h-10 Z', layer: 'obj', cmd: 'RECT', what: 'charging the phone' },
  { at: [.61, .66], d: circ(46, 318, 8), layer: 'obj', cmd: 'CIRCLE', what: 'placing the speaker' },
  { at: [.63, .67], d: 'M36 140 h18 v11 h-18 Z ' + circ(45, 145.5, 3), layer: 'obj', cmd: 'RECT', what: 'putting the camera down' },
  { at: [.65, .7], d: circ(46, 290, 11) + ' M46 279 V301 M35 290 H57', layer: 'obj', cmd: 'CIRCLE', what: 'watering the plant' },
  { at: [.67, .71], d: circ(46, 112, 6), layer: 'obj', cmd: 'CIRCLE', what: 'spinning the globe' },
  { at: [.69, .74], d: 'M28 168 h28 M28 172 h28 M28 176 h24 M30 196 h22 v14 h-22 Z', w: .8, layer: 'obj', cmd: 'LINE', what: 'filling the shelves' },
  { at: [.73, .78], d: circ(104, 42, 7) + ' ' + circ(134, 40, 8), layer: 'obj', cmd: 'CIRCLE', what: 'waking up Rio & Bruno' },
  { at: [.77, .82], d: 'M222 166 V176 M222 184 V196 M222 204 V214 M222 222 V234', w: 1.8, layer: 'obj', cmd: 'LINE', what: 'hanging the certificates' },
  { at: [.81, .86], d: 'M32 336 h24 v13 h-24 Z M32 340 h24', layer: 'obj', cmd: 'RECT', what: 'filing the résumé' },
]
const LABELS = [
  { at: .66, x: 46, y: 186, lx: -8, ly: 186, end: true, t: 'BOOKS' },
  { at: .7, x: 45, y: 145, lx: -8, ly: 140, end: true, t: 'CAMERA' },
  { at: .74, x: 46, y: 318, lx: -8, ly: 316, end: true, t: 'SPEAKER' },
  { at: .78, x: 119, y: 41, lx: -8, ly: 34, end: true, t: 'RIO & BRUNO' },
  { at: .82, x: 204, y: 204, lx: 258, ly: 204, t: 'COMPUTER' },
  { at: .85, x: 222, y: 170, lx: 258, ly: 162, t: 'ACHIEVEMENTS' },
  { at: .88, x: 196, y: 242, lx: 258, ly: 246, t: 'PHONE' },
  { at: .91, x: 44, y: 344, lx: -8, ly: 350, end: true, t: 'FILES' },
]

// the ribbon: the drawing tools, the one in use lit up as the plan draws
const ti = (d) => <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const CAD_TOOLS = [
  ['LINE', 'Line', ti(<path d="M4 16 16 4"/>)],
  ['PLINE', 'Polyline', ti(<path d="M3 15 8 6l5 7 4-9"/>)],
  ['CIRCLE', 'Circle', ti(<circle cx="10" cy="10" r="6"/>)],
  ['ARC', 'Arc', ti(<path d="M4 15a7 7 0 0 1 12-6"/>)],
  ['RECT', 'Rectangle', ti(<rect x="4" y="5" width="12" height="10"/>)],
  ['DIM', 'Dimension', ti(<path d="M3 13h14M3 10v6M17 10v6M5 13l2-1.5M5 13l2 1.5M15 13l-2-1.5M15 13l-2 1.5"/>)],
  ['LAYER', 'Layers', ti(<path d="M10 3 3 7l7 4 7-4-7-4ZM3 11l7 4 7-4"/>)],
  ['REGEN', 'Regen', ti(<path d="M15 6a6 6 0 1 0 1 6M15 3v3h-3"/>)],
  ['RENDER', 'Render', ti(<><circle cx="10" cy="9" r="3.5"/><path d="M10 2v1.5M10 14.5V16M3 9h1.5M15.5 9H17M5 4l1 1M15 4l-1 1"/></>)],
]

// Drawn without React re-renders: the playhead in Loader calls plan.draw(p) every frame, which only touches
// the strokes, labels and title block that change; the crosshair glides in its own loop.
function FloorPlan({ api, done, onPen, coordsRef }) {
  const paths = useRef([]), labels = useRef([]), leads = useRef([]), title = useRef(null)
  const cursor = useRef(null), want = useRef(null), at = useRef(null), lastCmd = useRef(''), lens = useRef([])
  api.current = (p) => {
    STROKES.forEach((s, i) => {
      const el = paths.current[i]; if (!el) return
      const k = seg(p, s.at[0], s.at[1])
      if (s.dash) el.style.opacity = k; else el.style.strokeDashoffset = 1 - k
    })
    LABELS.forEach((l, i) => { const k = seg(p, l.at, l.at + .05); const g = labels.current[i]; if (g) g.style.opacity = k; const d = leads.current[i]; if (d) d.style.strokeDashoffset = 1 - k })
    if (title.current) title.current.style.opacity = seg(p, .02, .1)
    // where the pen is: the point being drawn on the newest stroke that has started
    let i = -1; STROKES.forEach((s, j) => { if (p >= s.at[0]) i = j })
    const el = paths.current[i]; if (!el) return
    const s = STROKES[i], k = seg(p, s.at[0], s.at[1])
    const L = lens.current[i] ?? (lens.current[i] = el.getTotalLength()), pt = el.getPointAtLength(L * k)
    want.current = { x: pt.x, y: pt.y }
    const last = i === STROKES.length - 1 && k >= 1
    const cmd = last ? 'REGEN' : k < 1 ? s.cmd : 'SELECT', what = last ? 'switching the lights on' : s.what
    if (cmd + what !== lastCmd.current) { lastCmd.current = cmd + what; onPen?.({ cmd, what }) }
  }
  // the crosshair glides after the pen (so it never jumps from the end of one stroke to the start of the next)
  useEffect(() => {
    let raf = 0, t0 = performance.now()
    const tick = (now) => {
      const dt = Math.max(0, Math.min(.05, (now - t0) / 1000)); t0 = now // rAF's clock can trail performance.now()
      const w = want.current
      if (w) {
        if (!at.current) at.current = { ...w }
        // follow smoothly, but never faster than a hand would move it (no leaps between far-apart strokes)
        const f = 1 - Math.exp(-dt * 14), dx = (w.x - at.current.x) * f, dy = (w.y - at.current.y) * f, step = Math.hypot(dx, dy), max = 520 * dt
        const sc = step > max && step > 0 ? max / step : 1
        at.current.x += dx * sc; at.current.y += dy * sc
        cursor.current?.setAttribute('transform', `translate(${at.current.x.toFixed(2)} ${at.current.y.toFixed(2)})`)
        if (coordsRef?.current) coordsRef.current.textContent = `X ${at.current.x.toFixed(2).padStart(7, ' ')}   Y ${at.current.y.toFixed(2).padStart(7, ' ')}`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [coordsRef])
  return <svg className={`cad-plan${done ? ' is-done' : ''}`} viewBox="-90 0 420 425" role="img" aria-label="The office's floor plan being drafted">
    <defs><clipPath id="cad-clip"><rect x="-90" y="0" width="420" height="425"/></clipPath></defs>
    <rect x="72" y="24" width="96" height="36" className="cad-day"/>
    {STROKES.map((s, i) => <path key={i} ref={(el) => (paths.current[i] = el)} d={s.d} className={`cad-${s.layer}`} fill="none" strokeWidth={s.w || 1.2} strokeLinecap="round" strokeLinejoin="round"
      pathLength={s.dash ? undefined : 1} strokeDasharray={s.dash || 1} style={s.dash ? { opacity: 0 } : { strokeDashoffset: 1 }}/>)}
    {LABELS.map((l, i) => <g key={l.t} ref={(el) => (labels.current[i] = el)} className="cad-label" style={{ opacity: 0 }}>
      <path ref={(el) => (leads.current[i] = el)} d={`M${l.x} ${l.y} L${l.lx} ${l.ly}`} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }}/>
      <circle cx={l.x} cy={l.y} r="1.7"/>
      <text x={l.lx + (l.end ? -4 : 4)} y={l.ly + 3} textAnchor={l.end ? 'end' : 'start'}>{l.t}</text>
    </g>)}
    {/* the crosshair: full-length hairlines with a pick box, like a CAD cursor */}
    <g clipPath="url(#cad-clip)" className="cad-cursor-wrap" style={{ opacity: done ? 0 : 1 }}>
      <g ref={cursor} className="cad-cursor">
        <line x1="-600" y1="0" x2="600" y2="0"/><line x1="0" y1="-600" x2="0" y2="600"/>
        <rect x="-4" y="-4" width="8" height="8"/>
      </g>
    </g>
    <g ref={title} className="cad-titleblock" style={{ opacity: 0 }}>
      <line x1="20" y1="413" x2="220" y2="413"/>
      <text x="20" y="422">PLAN · HOME OFFICE</text><text x="220" y="422" textAnchor="end">1:40</text>
    </g>
  </svg>
}

export default function Loader({ progress, loaded, total, ready, onEnter }) {
  // The drawing (and the number) move at a steady, CAD-like pace: never faster than DRAW_S for the whole
  // plan, never ahead of the real download, easing out over the last stretch. A fast or cached load
  // still gets the full animation; a slow one just draws as far as the download has got.
  const DRAW_S = 5.2
  const goal = useRef(0); goal.current = ready ? 1 : Math.min(.97, progress * .97)
  const [finished, setFinished] = useState(false)
  const shownRef = useRef(0), plan = useRef(null), pctRef = useRef(null), barRef = useRef(null)
  const paint = (v) => { plan.current?.(v); if (pctRef.current) pctRef.current.firstChild.nodeValue = String(Math.round(v * 100)).padStart(2, '0'); if (barRef.current) barRef.current.style.transform = `scaleX(${v})` }
  useEffect(() => {
    // a short beat on the empty grid first: the room file is parsed in these first moments and the
    // browser stutters while it does, so the drawing starts once that's out of the way
    // Start once the room has finished setting itself up (that's when the browser freezes for a moment), or,
    // on a slow connection where that's a while off, after a short beat so there's something to watch.
    let raf = 0, last = performance.now(), mount = last, readyAt = 0, started = false
    const tick = (now) => {
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now
      if (!started) {
        // ready = the room is built and has been drawn once (its shaders compiled): the browser's freeze is behind us
        if (goal.current >= 1 && window.__sceneWarm && !readyAt) readyAt = now
        started = (readyAt && now - readyAt > 150) || (now - mount > 1800 && goal.current < .9) || now - mount > 6000
        if (!started) { raf = requestAnimationFrame(tick); return }
      }
      const v = shownRef.current, room = goal.current - v
      if (room > 0) {
        const slow = v > .88 ? .55 + .45 * (1 - v) / .12 : 1 // ease into the finish
        shownRef.current = Math.min(goal.current, v + dt / DRAW_S * slow, 1)
        if (1 - shownRef.current < .0015 && goal.current >= 1) shownRef.current = 1
        paint(shownRef.current)
      }
      if (shownRef.current < 1) raf = requestAnimationFrame(tick); else setFinished(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const done = ready && finished
  const [pen, setPen] = useState({ cmd: 'NEW', what: 'opening the drawing' })
  // tell the 3D room to idle behind us while we're up
  useEffect(() => { window.__loaderUp = true; return () => { window.__loaderUp = false } }, [])
  const coordsRef = useRef(null)

  // once it's drawn and rendered, hold a beat on the lit plan, then go straight into the room
  useEffect(() => {
    if (!done) return undefined
    const t = window.setTimeout(onEnter, 900)
    return () => window.clearTimeout(t)
  }, [done, onEnter])

  return <motion.div className={`loader cad${done ? ' is-done' : ''}`} initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .45 }}>
    <header className="cad-top">
      <div className="cad-menubar">
        {['File', 'Edit', 'View', 'Insert', 'Draw', 'Dimension', 'Modify', 'Window', 'Help'].map((m) => <span key={m} className="cad-menu">{m}</span>)}
        <span className="cad-size">{total ? `${mb(loaded)} / ${mb(total)} MB` : ''}</span>
      </div>
      <div className="cad-ribbon">
        {CAD_TOOLS.map(([id, label, icon]) => <span key={id} className={`cad-tool${(done ? 'RENDER' : pen.cmd) === id ? ' on' : ''}`} title={label}>{icon}<small>{label}</small></span>)}
        <span className="cad-tab">office.dwg<i aria-hidden="true">×</i></span>
      </div>
    </header>
    <main className="cad-view">
      <div className="cad-name"><b>sameer palkar</b><span>// software engineer</span></div>
      <FloorPlan api={plan} done={done} onPen={setPen} coordsRef={coordsRef}/>
      <div className="cad-coords" aria-hidden="true" ref={coordsRef}>X    0.00   Y    0.00</div>
    </main>
    <footer className="cad-cmd">
      <div className="cad-pct" ref={pctRef}>{done ? '100' : '00'}<span>%</span></div>
      <div className="cad-cmd-main">
        <div className="cad-bar"><i ref={barRef} style={{ transform: done ? 'scaleX(1)' : undefined }}/></div>
        <p className="cad-line">
          <span className="cad-prompt">Command:</span>{' '}
          {done ? <><b>RENDER</b> <span className="cad-ok">✓ coming in</span></> : <><b>{pen.cmd}</b> <span>{pen.what}</span><i className="cad-caret"/></>}
        </p>
      </div>
    </footer>
  </motion.div>
}
