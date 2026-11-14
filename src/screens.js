import * as THREE from 'three'

// Free-to-use Unsplash photos (Unsplash License), loaded straight from Unsplash's CDN.
export const BEACH_PHOTO_URL = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=1200&fit=crop&crop=entropy&q=80&fm=jpg'
const WALLPAPER_URL = '/desktop/sonoma.jpg'
const AVATAR_URL = '/about/sameer-sketch.png?v=3'

const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }

// Fallback wallpaper (if the photo can't load): painted peaks at sunset.
function paintFallbackWallpaper(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#5b4a7a'); sky.addColorStop(.45, '#d98a7a'); sky.addColorStop(.7, '#f1b98a'); sky.addColorStop(1, '#3a2d3e')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
  const ridge = (base, amp, color, seed) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H)
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, base - Math.abs(Math.sin(x * .004 + seed) * amp + Math.sin(x * .013 + seed * 2) * amp * .35))
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
  }
  ridge(H * .62, H * .28, '#7d5f73', 1); ridge(H * .72, H * .2, '#4c3b4f', 3); ridge(H * .86, H * .12, '#2a2030', 5)
}

// A desktop for the iMac: wallpaper, menu bar with the time, and a dock of app tiles.
export function createDesktopTexture() {
  const W = 1600, H = 900
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false; texture.anisotropy = 8
  let wallpaper = null, avatar = null

  const draw = () => {
    if (wallpaper) ctx.drawImage(wallpaper, 0, 0, W, H); else paintFallbackWallpaper(ctx, W, H)
    // the lock screen (as on a Mac at rest): date and big time up top, one user, Sameer, at the bottom
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'
    const font = (wt, px) => { ctx.font = `${wt} ${px}px -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif` }
    const t = new Date()
    ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.18)'; ctx.shadowBlur = 20
    ctx.fillStyle = 'rgba(255,240,250,.86)'; font(600, 34); ctx.fillText(t.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), W / 2, 140)
    font(700, 196); ctx.fillText(t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, ''), W / 2, 318)
    ctx.restore()
    // status icons, top right
    ctx.fillStyle = 'rgba(255,255,255,.95)'; font(600, 15); ctx.textAlign = 'right'; ctx.fillText('U.S.', W - 120, 30)
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; rr(ctx, W - 92, 19, 28, 13, 4); ctx.stroke(); ctx.fillRect(W - 89, 22, 18, 7)
    ctx.beginPath(); ctx.arc(W - 38, 34, 3, 0, Math.PI * 2); ctx.fill()
    for (const r of [8, 13]) { ctx.beginPath(); ctx.arc(W - 38, 34, r, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke() }
    // the user
    const ax = W / 2, ay = 760
    ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, 42, 0, Math.PI * 2); ctx.fillStyle = '#d9d4cc'; ctx.fill(); ctx.clip()
    if (avatar) { const s = Math.max(84 / avatar.width, 84 / avatar.height) * 1.15; ctx.drawImage(avatar, ax - avatar.width * s / 2, ay - 42 - 4, avatar.width * s, avatar.height * s) }
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay, 42, 0, Math.PI * 2); ctx.stroke()
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; font(600, 19); ctx.fillText('Sameer', ax, ay + 72)
    ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(ctx, ax - 92, ay + 86, 184, 30, 15); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.8)'; font(400, 14); ctx.fillText('Enter Password', ax, ay + 106)
    ctx.textAlign = 'left'

    texture.needsUpdate = true
  }

  draw()
  const img = new Image(); img.crossOrigin = 'anonymous'
  img.onload = () => { wallpaper = img; draw() }
  img.src = WALLPAPER_URL
  const aimg = new Image(); aimg.onload = () => { avatar = aimg; draw() }; aimg.src = AVATAR_URL
  const timer = window.setInterval(draw, 15000) // keep the lock-screen clock current
  texture.userData.dispose = () => window.clearInterval(timer)
  return texture
}
