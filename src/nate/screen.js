// "What's on my screen?" — Nate describes what the visitor is looking at, from the room's state and a peek
// at what's actually drawn (the open close-up, the page or photo showing, an open menu).
import { PLACES } from './places'

const q = (sel) => document.querySelector(sel)
const txt = (sel) => (q(sel)?.textContent || '').replace(/\s+/g, ' ').trim()
const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)

function closeUp(app) {
  switch (app) {
    case 'about': { const p = txt('.book-pageno'); return `You're reading Sameer's book${p ? ` (${p.toLowerCase()})` : ''}: about him, his work experience, education and extracurriculars. Turn the pages with the arrows.` }
    case 'projects': { const w = txt('.mac-win-title, .win-title, .mac-win-bar b'); return `You're at the iMac. Its desktop has his Projects and Certifications folders and a Skills note${w ? `; "${w}" is open` : ''}.` }
    case 'achievements': { const c = txt('.cert-card h3, .cert-head h3, .cert-card b'); return c ? `You're looking at one of his certificates: ${c}.` : 'You\'re at the certificate wall above the iMac. Pick a certificate to read about it.' }
    case 'resume': return 'You\'re looking at Sameer\'s résumé. You can open it in a new tab or download it.'
    case 'contact': return 'You\'re looking at the phone: it has his email (palkarsameer04@gmail.com), LinkedIn and GitHub. Tap one to get in touch.'
    case 'music': { const s = txt('.np-dock-text b, .music-row.on b'); return `You're at the speaker: his songs on repeat${s ? `, with "${s}" up next` : ''}. There's a disco button too.` }
    case 'photos': { const c = txt('.cam-caption b'), d = txt('.cam-caption small'); return `You're flicking through the photos on his camera${c ? `: "${c}"${d ? ` (${d})` : ''}` : ''}.` }
    default: return 'You\'re in a close-up.'
  }
}

export function describeScreen({ scene, systemOpen, systemApp, touch, buttonsMode }) {
  if (systemOpen) return closeUp(systemApp)
  const parts = []
  const panel = q('.bar-panel h4')?.textContent?.trim()
  if (panel) parts.push(`The ${panel} menu is open.`)
  const here = scene?.hotspotId?.()
  const seen = (scene?.inView?.() || []).map((v) => v.id).filter((id) => PLACES[id])
  if (here && PLACES[here]) parts.push(`You're right at ${PLACES[here].name} (${PLACES[here].opens}). ${touch ? 'Tap it, or INTERACT,' : 'Press INTERACT or Enter'} to open it.`)
  const others = seen.filter((id) => id !== here).slice(0, 5).map((id) => PLACES[id].name)
  if (others.length) parts.push(`${here ? 'Also in view' : 'In view'}: ${list(others)}.`)
  if (!here && !others.length) parts.push('You\'re in Sameer\'s office, but nothing to open is in view right now — try turning around.')
  parts.push(touch ? (buttonsMode ? 'The bar at the bottom has Work, Life, Settings and Help.' : 'Walk with the joystick; ☰ has shortcuts.') : 'The bar at the bottom has shortcuts to every place.')
  return parts.join(' ')
}
