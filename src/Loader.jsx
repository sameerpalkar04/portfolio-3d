import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Minimal loading screen: name, a percentage that follows the real download of the room,
// one status line, and an Enter button once everything is ready.

const mb = (bytes) => (bytes / 1048576).toFixed(1)

// Background: a quiet dot grid that reacts to the cursor. Dots near the pointer brighten and
// drift away from it, then spring back. Once loading is done they glow green near the cursor.
function DotField({ done }) {
  const ref = useRef(null)
  const doneRef = useRef(done)
  doneRef.current = done
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d')
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const GAP = 26, RADIUS = 150
    let w = 0, h = 0, dpr = 1, dots = [], raf = 0
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 }
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = []
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 })
    }
    const onMove = (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; if (mouse.x < -999) { mouse.x = mouse.tx; mouse.y = mouse.ty } }
    const onLeave = () => { mouse.tx = mouse.ty = -9999 }
    const frame = () => {
      mouse.x += (mouse.tx - mouse.x) * .18; mouse.y += (mouse.ty - mouse.y) * .18
      if (mouse.tx < -999) mouse.x = mouse.y = -9999
      ctx.clearRect(0, 0, w, h)
      // soft light following the cursor
      if (mouse.x > -999) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 320)
        g.addColorStop(0, doneRef.current ? 'rgba(126,226,168,.06)' : 'rgba(232,234,237,.045)'); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      }
      const tint = doneRef.current ? [126, 226, 168] : [232, 234, 237]
      for (const d of dots) {
        const dx = d.ox - mouse.x, dy = d.oy - mouse.y, dist = Math.hypot(dx, dy)
        const near = Math.max(0, 1 - dist / RADIUS)
        if (!reduce && near > 0) { const push = near * near * 14; d.vx += (dx / (dist || 1)) * push * .08; d.vy += (dy / (dist || 1)) * push * .08 }
        d.vx += (d.ox - d.x) * .08; d.vy += (d.oy - d.y) * .08 // spring home
        d.vx *= .78; d.vy *= .78; d.x += d.vx; d.y += d.vy
        const a = .09 + near * .55, r = .9 + near * 1.3
        ctx.fillStyle = near > 0 ? `rgba(${tint[0]},${tint[1]},${tint[2]},${a})` : 'rgba(232,234,237,.09)'
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    resize(); frame()
    window.addEventListener('resize', resize); window.addEventListener('pointermove', onMove); document.addEventListener('pointerleave', onLeave)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave) }
  }, [])
  return <canvas ref={ref} className="loader-field" aria-hidden="true"/>
}

export default function Loader({ progress, loaded, total, ready, onEnter }) {
  // Ease the shown number toward the real progress so it counts up smoothly.
  const target = ready ? 1 : Math.min(.97, progress * .97)
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)
  useEffect(() => {
    let raf = 0, last = performance.now()
    const tick = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now
      const next = shownRef.current + (target - shownRef.current) * Math.min(1, dt * (ready ? 6 : 4))
      shownRef.current = Math.abs(target - next) < .002 ? target : next
      setShown(shownRef.current)
      if (shownRef.current !== target) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ready])
  const done = ready && shown >= .999

  useEffect(() => {
    if (!done) return undefined
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); onEnter() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [done, onEnter])

  const pct = Math.round(shown * 100)
  const status = done ? 'ready'
    : total ? `fetching home-office.glb · ${mb(loaded)} / ${mb(total)} MB`
    : progress >= 1 ? 'setting up the scene' : 'connecting'

  return <motion.div className={`loader${done ? ' is-done' : ''}`}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .45 }}>
    <DotField done={done}/>
    <div className="loader-inner">
      <p className="loader-name">sameer palkar <span>// software engineer</span></p>
      <div className="loader-pct">{String(pct).padStart(2, '0')}<span>%</span></div>
      <div className="loader-bar"><i style={{ transform: `scaleX(${shown})` }}/></div>
      <p className="loader-status"><span className={done ? 'ok' : ''}>{done ? '✓' : '›'}</span> {status}{!done && <b className="loader-caret"/>}</p>
      <div className="loader-cta">
        {done && <motion.button className="loader-enter" onClick={onEnter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
          Enter <span aria-hidden="true">→</span>
        </motion.button>}
        {done && <small>or press ↵</small>}
      </div>
    </div>
  </motion.div>
}
