import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Fixed high-resolution image plates make this an interactive photo tour, not a real-time 3D scene.
const FRAMES = [
  { id: 'studio', title: 'OPEN STUDIO', subtitle: 'A bright, open-plan workspace', image: '/office-reference.png', x: 8, z: -8 },
  { id: 'meeting', title: 'MEETING ROOM', subtitle: 'A quiet space for collaboration', image: '/frames/meeting-room.png', x: -18, z: -14 },
  { id: 'lounge', title: 'LOUNGE & CAFÉ', subtitle: 'A place to pause and recharge', image: '/frames/lounge-cafe.png', x: -18, z: 4 },
  { id: 'desk', title: 'DESK 17', subtitle: 'Sameer’s workstation', image: '/frames/desk17.png', x: 3, z: 16 },
]

export default function PhotoOffice({ sceneRef, position, night, onPosition, onNearby, onSystem, onReady }) {
  const [frameIndex, setFrameIndex] = useState(0)
  const frameIndexRef = useRef(0)
  const pointer = useRef(null)
  const current = FRAMES[frameIndex]

  const goToFrame = useCallback((value) => {
    const index = Math.max(0, Math.min(FRAMES.length - 1, value))
    frameIndexRef.current = index
    setFrameIndex(index)
    const frame = FRAMES[index]
    onPosition({ x: frame.x, z: frame.z })
    onNearby(frame.id === 'desk')
  }, [onNearby, onPosition])

  useEffect(() => {
    if (sceneRef) sceneRef.current = { goToFrame, setMode: () => {} }
    return () => { if (sceneRef?.current?.goToFrame === goToFrame) sceneRef.current = null }
  }, [goToFrame, sceneRef])

  useEffect(() => { goToFrame(0) }, [goToFrame])

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (key === 'backspace' || key === 'delete') {
        event.preventDefault()
        onSystem(false)
      } else if (key === 'enter' && frameIndexRef.current === 3) {
        event.preventDefault()
        onSystem(true)
      } else if (key === 'arrowright' || key === 'arrowup') {
        event.preventDefault()
        goToFrame(frameIndexRef.current + 1)
      } else if (key === 'arrowleft' || key === 'arrowdown') {
        event.preventDefault()
        goToFrame(frameIndexRef.current - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    const preload = FRAMES.map(({ image }) => { const img = new Image(); img.src = image; return img })
    const ready = () => onReady?.()
    preload[0].complete ? ready() : preload[0].addEventListener('load', ready, { once: true })
    preload.forEach((img) => { img.loading = 'eager' })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goToFrame, onReady, onSystem])

  const swipeStart = (event) => { if (event.target.closest('.photo-frame-controls')) return; pointer.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture?.(event.pointerId) }
  const swipeEnd = (event) => {
    if (!pointer.current) return
    const dx = event.clientX - pointer.current.x
    if (Math.abs(dx) > 45) goToFrame(frameIndexRef.current + (dx < 0 ? 1 : -1))
    pointer.current = null
  }

  return <div className={`photo-office ${night ? 'photo-office-night' : ''}`} aria-label="Interactive fixed-view office photo tour" onPointerDown={swipeStart} onPointerUp={swipeEnd} onPointerCancel={() => { pointer.current = null }}>
    <AnimatePresence mode="wait">
      <motion.img key={current.id} className="office-photo" src={current.image} alt={`${current.title}: ${current.subtitle}`} draggable="false" initial={{ opacity: 0, scale: 1.035 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .58, ease: 'easeInOut' }} onLoad={onReady}/>
    </AnimatePresence>
    <div className="photo-night-wash"/><div className="photo-night-stars"/><div className="photo-night-leds"/>
    <div className="photo-view-caption" key={current.id}><span>{String(frameIndex + 1).padStart(2, '0')} / 04</span><div><b>{current.title}</b><small>{current.subtitle}</small></div></div>
    <div className="photo-frame-controls" aria-label="Move between photo views"><button onClick={() => goToFrame(frameIndex - 1)} aria-label="Previous photo view">←</button><div>{FRAMES.map((item, index) => <button key={item.id} className={index === frameIndex ? 'active' : ''} onClick={() => goToFrame(index)} aria-label={`Show ${item.title}`} />)}</div><button onClick={() => goToFrame(frameIndex + 1)} aria-label="Next photo view">→</button></div>
  </div>
}

export { FRAMES }
