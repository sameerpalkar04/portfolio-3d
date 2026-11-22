// Nate's guided tour (heyclicky-style): a highlight ring moves from control to control (and to something
// in the room), with a card from Nate explaining each one. Next / Back / Skip; Esc ends it.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

const STEPS = {
  buttons: [
    { sel: '.onebar-nav .ob-btn:nth-child(1)', title: 'Work', text: 'The places that matter: his books, projects, achievements, résumé and phone. Pick one and you’ll walk straight there.' },
    { sel: '.onebar-nav .ob-btn:nth-child(2)', title: 'Life', text: 'The fun stuff: his camera, the speaker and his dogs, Rio & Bruno.' },
    { sel: '.onebar-nav .ob-btn:nth-child(3)', title: 'Settings', text: 'Change the time of day, or switch between buttons and the joystick.' },
    { sel: '.onebar-nav .ob-btn:nth-child(4)', title: 'Help', text: 'Every control, explained, whenever you need it.' },
    { spot: true, title: 'Things in the room', text: 'When you’re close to something, tap it (or INTERACT) to open it up.' },
    { sel: '.ob-nate .ai-btn', title: 'And me', text: 'Ask me anything about Sameer, or just tell me where you want to go.' },
  ],
  joystick: [
    { sel: '.joystick', title: 'Joystick', text: 'Push up or down to walk, left or right to turn. Drag anywhere else to look around.' },
    { sel: '.fab-menu', title: 'Menu', text: 'Shortcuts to every place, plus Life, Settings and Help.' },
    { spot: true, title: 'Things in the room', text: 'Walk up to anything and tap it (or INTERACT) to open it up.' },
    { sel: '.touch-fabs .ai-btn', title: 'And me', text: 'Ask me anything about Sameer, or just tell me where you want to go.' },
  ],
  laptop: [
    { sel: '.bar-spots, .sec-work', title: 'Shortcuts', text: 'Jump straight to any place: his books, computer, achievements, files or phone.' },
    { sel: '.sec-fun', title: 'Life', text: 'The fun stuff: his camera, the speaker and his dogs.' },
    { sel: '.sec-help', title: 'Instructions', text: 'Every control, explained.' },
    { sel: '.sec-time', title: 'Time of day', text: 'Sunrise to night. The room follows your clock, or pick a time yourself.' },
    { spot: true, title: 'Walk around', text: 'Arrow keys or WASD to walk, drag to look. Walk up to anything and press INTERACT (or Enter).' },
    { sel: '.ai-dock .ai-btn', title: 'And me', text: 'Ask me anything about Sameer, or just tell me where you want to go.' },
  ],
}

const visible = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null }

export default function NateTour({ mode, getSpot, onEnd }) {
  const steps = useMemo(() => STEPS[mode].filter((s) => (s.spot ? getSpot() : visible(document.querySelector(s.sel)))), [mode, getSpot])
  const [i, setI] = useState(0), [rect, setRect] = useState(null)
  const step = steps[i]
  // follow the target every frame (the room's objects move as the camera does)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      let r = null
      if (step?.spot) { const p = getSpot(); if (p) r = { left: p.x - 40, top: p.y - 40, width: 80, height: 80, round: true } }
      else if (step) { const b = visible(document.querySelector(step.sel)); if (b) r = { left: b.left, top: b.top, width: b.width, height: b.height } }
      if (r) setRect((o) => (o && Math.abs(o.left - r.left) + Math.abs(o.top - r.top) + Math.abs(o.width - r.width) < .5 ? o : r))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, getSpot])
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onEnd(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1)) }; window.addEventListener('keydown', k, true); return () => window.removeEventListener('keydown', k, true) })
  useEffect(() => { if (!steps.length) onEnd() }, [steps, onEnd])
  const next = () => (i < steps.length - 1 ? setI(i + 1) : onEnd())
  if (!step || !rect) return null
  const pad = 6, vw = window.innerWidth, vh = window.innerHeight
  const ring = { x: rect.left - pad, y: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
  const cw = Math.min(320, vw - 32), above = rect.top > vh * .45
  const cx = Math.min(vw - cw - 16, Math.max(16, rect.left + rect.width / 2 - cw / 2))
  const card = above ? { left: cx, bottom: vh - ring.y + 14 } : { left: cx, top: ring.y + ring.height + 14 }
  return createPortal(<div className="nate-tour" role="dialog" aria-label="Guided tour">
    <div className="nate-tour-block" onClick={(e) => e.stopPropagation()}/>
    <motion.div className={`nate-tour-ring${rect.round ? ' is-round' : ''}`} initial={false} animate={ring} transition={{ type: 'spring', stiffness: 260, damping: 28 }}/>
    <motion.div key={i} className="nate-tour-card" style={{ width: cw, ...card }} initial={{ opacity: 0, y: above ? 8 : -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25, ease: [.2, .8, .2, 1] }}>
      <small className="nate-tour-step">Nate’s tour · {i + 1} of {steps.length}</small>
      <b>{step.title}</b>
      <p>{step.text}</p>
      <div className="nate-tour-actions">
        <button className="ghost" onClick={onEnd}>Skip</button>
        <span/>
        {i > 0 && <button className="ghost" onClick={() => setI(i - 1)}>Back</button>}
        <button className="primary" onClick={next}>{i < steps.length - 1 ? 'Next' : 'Done'}</button>
      </div>
    </motion.div>
  </div>, document.body)
}
