import * as THREE from 'three'

// Free-to-use Unsplash photos (Unsplash License), loaded straight from Unsplash's CDN.
export const BEACH_PHOTO_URL = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=1200&fit=crop&crop=entropy&q=80&fm=jpg'
const WALLPAPER_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=900&fit=crop&q=80&fm=jpg'

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
  let wallpaper = null

  const draw = () => {
    if (wallpaper) ctx.drawImage(wallpaper, 0, 0, W, H); else paintFallbackWallpaper(ctx, W, H)
    // Menu bar
    ctx.fillStyle = 'rgba(245,245,247,.72)'; ctx.fillRect(0, 0, W, 30)
    ctx.fillStyle = '#1d1d1f'; ctx.font = '600 17px -apple-system, "Helvetica Neue", Arial, sans-serif'; ctx.textBaseline = 'middle'
    ctx.beginPath(); ctx.arc(26, 15, 7, 0, Math.PI * 2); ctx.fill()
    let x = 50
    ctx.fillText('Finder', x, 16); x += 76
    ctx.font = '16px -apple-system, "Helvetica Neue", Arial, sans-serif'
    for (const item of ['File', 'Edit', 'View', 'Go', 'Window', 'Help']) { ctx.fillText(item, x, 16); x += ctx.measureText(item).width + 26 }
    const now = new Date()
    const clock = now.toLocaleDateString([], { weekday: 'short' }) + '  ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    ctx.textAlign = 'right'; ctx.fillText(clock, W - 22, 16)
    ctx.font = '15px -apple-system, "Helvetica Neue", Arial, sans-serif'; ctx.fillText('◉   ◔   ▮▮▮', W - 22 - ctx.measureText(clock).width - 28, 16); ctx.textAlign = 'left'
    // Dock
    const tiles = [['#2b8cff', '#0a5bd8'], ['#7b5cff', '#3d2bd0'], ['#9aa3ad', '#5f6973'], ['#38b6ff', '#0a7be0'], ['#5ac46a', '#2c9a3e'], ['#f5f5f5', '#d8d8d8'], ['#ff5f57', '#d9342b'], ['#ffd34d', '#f0a500'], ['#ffffff', '#e9e9ea'], ['#ff9f2e', '#f06a00'], ['#34c759', '#1f9c3f'], ['#fc5c7d', '#c9184a'], ['#a259ff', '#6a2bd9'], ['#1e90ff', '#0050c8'], ['#8e8e93', '#5a5a5f']]
    const size = 58, gap = 12, pad = 12, dockW = tiles.length * (size + gap) - gap + pad * 2, dockH = size + pad * 2
    const dx = (W - dockW) / 2, dy = H - dockH - 10
    ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(ctx, dx, dy, dockW, dockH, 20); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke()
    tiles.forEach(([a, b], i) => {
      const tx = dx + pad + i * (size + gap), ty = dy + pad
      const g = ctx.createLinearGradient(0, ty, 0, ty + size); g.addColorStop(0, a); g.addColorStop(1, b)
      ctx.fillStyle = g; rr(ctx, tx, ty, size, size, 14); ctx.fill()
      // simple glyphs so the tiles read as apps
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4
      const cx = tx + size / 2, cy = ty + size / 2
      switch (i % 5) {
        case 0: ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke(); break
        case 1: ctx.fillRect(cx - 14, cy - 3, 28, 6); ctx.fillRect(cx - 3, cy - 14, 6, 28); break
        case 2: rr(ctx, cx - 15, cy - 11, 30, 22, 4); ctx.stroke(); break
        case 3: ctx.beginPath(); ctx.moveTo(cx - 12, cy + 12); ctx.lineTo(cx, cy - 14); ctx.lineTo(cx + 12, cy + 12); ctx.closePath(); ctx.fill(); break
        default: for (let k = -1; k <= 1; k++) ctx.fillRect(cx - 14, cy + k * 9 - 2, 28, 4)
      }
    })
    texture.needsUpdate = true
  }

  draw()
  const img = new Image(); img.crossOrigin = 'anonymous'
  img.onload = () => { wallpaper = img; draw() }
  img.src = WALLPAPER_URL
  const timer = window.setInterval(draw, 60000) // keep the menu-bar clock current
  texture.userData.dispose = () => window.clearInterval(timer)
  return texture
}
