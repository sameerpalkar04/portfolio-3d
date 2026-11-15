// Illustrated visuals for each project (used on the Finder cover cards and the case-study hero).
// They're drawn in SVG/CSS from what each project does, so no screenshots are needed.

// tiny deterministic noise so the "satellite" tiles look the same every render
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const LAND = ['#2f6b3a', '#d8c27a', '#6fa3c8'] // vegetation, built-up, water
const GRID = 10
const before = Array.from({ length: GRID * GRID }, (_, i) => {
  const x = i % GRID, y = Math.floor(i / GRID)
  if (x + y * .6 > 11.5) return 2
  return rnd(i) > .78 ? 1 : 0
})
// "after": a built-up area spreads in the top-left, some vegetation cleared
const after = before.map((c, i) => {
  const x = i % GRID, y = Math.floor(i / GRID)
  if (c !== 2 && Math.hypot(x - 2.5, y - 2.5) < 3.2) return 1
  return c
})
function Tile({ cells, label, change, style }) {
  return <div className="pv-tile" style={style}>
    <div className="pv-grid">{cells.map((c, i) => <i key={i} style={{ background: change ? (before[i] !== after[i] ? '#ff6b4a' : 'rgba(255,255,255,.08)') : LAND[c] }}/>)}</div>
    <span>{label}</span>
  </div>
}
function GeoVisual() {
  return <div className="pv pv-geo">
    <Tile cells={before} label="Before" style={{ '--r': '-6deg', '--x': '-34%', '--y': '-8%' }}/>
    <Tile cells={after} label="After" style={{ '--r': '4deg', '--x': '6%', '--y': '-14%' }}/>
    <Tile cells={after} label="Change" change style={{ '--r': '-1deg', '--x': '-12%', '--y': '22%' }}/>
  </div>
}

const WORDS = ['BONJOUR', 'नमस्ते', 'HELLO', 'こんにちは']
function ScriptVisual() {
  return <div className="pv pv-script">
    <div className="pv-frame">
      <div className="pv-scene"><i className="pv-sun"/><i className="pv-hill a"/><i className="pv-hill b"/></div>
      <div className="pv-sign">{WORDS.map((w, i) => <b key={w} style={{ animationDelay: `${i * 2}s` }}>{w}</b>)}</div>
      <div className="pv-wave">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${20 + rnd(i + 40) * 80}%`, animationDelay: `${(i % 7) * .12}s` }}/>)}</div>
    </div>
    <div className="pv-strip">{Array.from({ length: 7 }, (_, i) => <i key={i} className={[0, 3, 5].includes(i) ? 'ocr' : ''}>{[0, 3, 5].includes(i) ? 'OCR' : 'skip'}</i>)}</div>
  </div>
}

const NODES = [[50, 46, 'idea', 0], [22, 24, 'reading', 1], [78, 22, 'project', 2], [18, 70, 'journal', 1], [80, 72, 'research', 2], [50, 12, 'quote', 0], [50, 86, 'todo', 3], [34, 50, '', 3], [66, 52, '', 0]]
const EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5], [3, 6], [4, 6], [0, 7], [0, 8], [7, 3], [8, 4], [1, 7], [2, 8]]
const sc = (v) => 8 + v * .84 // keep nodes inside the frame
const TAGC = ['#b8e986', '#ffd38a', '#9fd7ff', '#ffb3c7']
function MindVisual() {
  return <div className="pv pv-mind">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {EDGES.map(([a, b]) => <line key={`${a}-${b}`} x1={sc(NODES[a][0])} y1={sc(NODES[a][1])} x2={sc(NODES[b][0])} y2={sc(NODES[b][1])} stroke="rgba(255,255,255,.35)" strokeWidth=".5" vectorEffect="non-scaling-stroke"/>)}
    </svg>
    {NODES.map(([x, y, label, t], i) => <span key={i} className={`pv-node${label ? '' : ' dot'}${i === 0 ? ' main' : ''}`} style={{ left: `${sc(x)}%`, top: `${sc(y)}%`, '--c': TAGC[t], animationDelay: `${i * .4}s` }}>{label}</span>)}
  </div>
}

function AfterVisual() {
  return <div className="pv pv-after">
    <div className="pv-card back"/>
    <div className="pv-card mid"/>
    <div className="pv-card front">
      <div className="pv-ep"><b>S2 · E5</b><span>Recap ready</span></div>
      <h4>Previously…</h4>
      {[92, 100, 84, 96, 60].map((w, i) => <i key={i} style={{ width: `${w}%` }}/>)}
      <div className="pv-foot"><span>⏱ 1 min read</span><span>★ Saved</span></div>
    </div>
  </div>
}

export const PROJECT_VISUALS = { 'geospatial-segmentation': GeoVisual, scriptsync: ScriptVisual, mindgarden: MindVisual, afterword: AfterVisual }
export function ProjectVisual({ id }) { const V = PROJECT_VISUALS[id]; return V ? <V/> : null }
