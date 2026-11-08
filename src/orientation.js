// Phones held sideways. Browsers can't lock a normal web page's orientation, so while a touch device is
// in landscape the app itself is turned back by -90° (styles.css: html[data-lock]) and keeps exactly its
// portrait layout. The sideways close-ups (book, camera, certificates) then read upright, filling the
// screen. Everything else asks the visitor to turn the phone upright (see RotateBack in App.jsx).
const root = typeof document !== 'undefined' ? document.documentElement : null
export const isLocked = () => !!root?.dataset.lock
export const viewW = () => (isLocked() ? window.innerHeight : window.innerWidth)
export const viewH = () => (isLocked() ? window.innerWidth : window.innerHeight)
// a pointer movement on screen → the same movement in the app's (portrait) frame
export const toLocal = (dx, dy) => (isLocked() ? [-dy, dx] : [dx, dy])
// how far along a horizontal (in the app) element a pointer is, 0..1
export const fracAlong = (rect, x, y) => (isLocked() ? (rect.bottom - y) / rect.height : (x - rect.left) / rect.width)
export const phoneLandscape = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth > window.innerHeight

export function setPortraitLock(on) {
  if (!root) return
  root.style.setProperty('--lw', `${window.innerWidth}px`); root.style.setProperty('--lh', `${window.innerHeight}px`)
  if (on) { mirrorPhoneRules(); root.dataset.lock = '1' } else delete root.dataset.lock
}

// The phone layout lives in narrow / portrait media queries, which a sideways screen no longer matches.
// While locked, copy those rules so they still apply (scoped to html[data-lock]).
const PHONE_MEDIA = /max-width:\s*(720|1180)px|max-aspect-ratio:\s*1\s*\/\s*1/
function mirrorPhoneRules() {
  let out = ''
  for (const sheet of document.styleSheets) {
    if (sheet.ownerNode?.id === 'portrait-lock-css') continue
    let rules; try { rules = sheet.cssRules } catch { continue }
    for (const r of rules) {
      if (!(r instanceof CSSMediaRule)) continue
      const q = r.conditionText || r.media.mediaText
      if (!PHONE_MEDIA.test(q) || /min-width/.test(q)) continue
      for (const c of r.cssRules) {
        if (!(c instanceof CSSStyleRule)) continue
        out += `${c.selectorText.split(',').map((x) => `html[data-lock] ${x.trim().replace(/^(html|:root)\s*/, '')}`).join(',')}{${c.style.cssText}}\n`
      }
    }
  }
  let tag = document.getElementById('portrait-lock-css')
  if (!tag) { tag = document.createElement('style'); tag.id = 'portrait-lock-css'; document.head.appendChild(tag) }
  if (tag.textContent !== out) tag.textContent = out
}
