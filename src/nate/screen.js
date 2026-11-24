// "What's on my screen?" — Nate describes what the visitor is looking at, from the room's state and a peek
// at what's actually drawn (the open close-up, the page or photo showing, an open menu).
import { PLACES } from './places'

const q = (sel) => document.querySelector(sel)
const txt = (sel) => (q(sel)?.textContent || '').replace(/\s+/g, ' ').trim()
const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`)

// the visible text of what's on screen (elements actually drawn in the viewport), squeezed and capped
const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden' }
const seenText = (sel, max = 1400) => [...document.querySelectorAll(sel)].filter(onScreen).map((el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | ').slice(0, max)
// the frontmost window on the iMac
function topWindow() {
  const wins = [...document.querySelectorAll('.mac-desktop .mac-win')].filter(onScreen)
  return wins.sort((x, y) => (+getComputedStyle(y).zIndex || 0) - (+getComputedStyle(x).zIndex || 0))[0] || null
}

function closeUp(app) {
  switch (app) {
    case 'about': {
      const p = txt('.book-pageno'), page = seenText('.book-page', 1600)
      return `You're reading Sameer's book${p ? ` (${p.toLowerCase()})` : ''}: about him, his work experience, education and extracurriculars; the arrows turn the pages. The open pages read: ${page || '(not readable)'}`
    }
    case 'projects': {
      const w = topWindow()
      if (!w) return `You're at the iMac's desktop: folders and notes for his Projects, Skills and Certifications, plus widgets (weather, calendar, clocks, a photo of his dogs). Nothing is open yet. Visible: ${seenText('.desk-icon', 300)}`
      const title = (w.querySelector('.mac-win-title')?.textContent || '').trim()
      const kind = w.classList.contains('win-reader') ? `the project page "${title}" (a case study you can scroll: description, tools, problem statement, how it works; it may have GitHub, paper or demo buttons)`
        : w.classList.contains('win-projects') ? 'the Projects app, listing his projects as cards (double-click / tap one to open it)'
        : w.classList.contains('win-notes') ? 'the Notes app (his Skills and Certifications notes)'
        : w.classList.contains('win-pdf') ? 'his résumé as a PDF' : `a window${title ? ` "${title}"` : ''}`
      const body = w.querySelector('.mac-win-body') || w
      return `You're at the iMac with ${kind} open. What's in it: ${(body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2400) || '(not readable)'}`
    }
    case 'achievements': {
      const card = seenText('.cert-card, .cert-box', 900)
      return card ? `You're looking at one of his certificates up close, with its details card: ${card}` : 'You\'re at the awards wall above the iMac: his hackathon certificates in frames. Pick one (they open with a details card); Next certificate steps through them.'
    }
    case 'resume': return `You're looking at Sameer's résumé (one page), with buttons to download it or open it in a new tab. It covers his education, projects, awards, technical skills and extracurriculars.`
    case 'contact': return 'You\'re looking at the phone: its lock screen shows three notifications, his email (palkarsameer04@gmail.com), LinkedIn and GitHub. Tap one to get in touch.'
    case 'music': { const s = txt('.np-dock-text b, .music-row.on b'); return `You're at the speaker: a list of the songs he keeps on repeat, each playable here with a Spotify link${s ? `; "${s}" is selected` : ''}. There's a disco button too. The list: ${seenText('.music-row', 600)}` }
    case 'photos': { const c = txt('.cam-caption b'), d = txt('.cam-caption small'); return `You're flicking through the photos on his camera with the arrows${c ? `; this one is "${c}"${d ? ` (${d})` : ''}` : ''}.` }
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
