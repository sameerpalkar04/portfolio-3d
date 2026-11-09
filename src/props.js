import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const roundedRect = (w, h, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// A phone lying face up (≈ 71.5 × 147 × 7.8 mm), screen off. Origin at the bottom centre; the top
// (camera island) is local -Z. PHONE describes the display so the lock screen can be laid exactly over it.
export const PHONE = { W: .0715, L: .147, T: .0078, R: .0112, displayW: .0715 - .0046, displayL: .147 - .0046, displayR: .0112 - .0023 }
export function createPhone() {
  const phone = new THREE.Group(); phone.name = 'desk-phone'
  const { W, L, T, R } = PHONE, bevel = .0011
  // titanium frame: a rounded slab with softened edges
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W - bevel * 2, L - bevel * 2, R - bevel), { depth: T - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 14 })
  bodyGeo.rotateX(-Math.PI / 2); bodyGeo.translate(0, bevel, 0)
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: '#5b2a34', metalness: .75, roughness: .36 }))
  body.castShadow = true; body.receiveShadow = true; phone.add(body)
  // cover glass (black bezel) and the display beneath it, both following the frame's corners
  const glassGeo = new THREE.ShapeGeometry(roundedRect(W - .0018, L - .0018, R - .0009), 14); glassGeo.rotateX(-Math.PI / 2)
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({ color: '#050506', roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .04 }))
  glass.position.y = T + .0002; phone.add(glass)
  const displayGeo = new THREE.ShapeGeometry(roundedRect(PHONE.displayW, PHONE.displayL, PHONE.displayR), 14); displayGeo.rotateX(-Math.PI / 2)
  const display = new THREE.Mesh(displayGeo, new THREE.MeshPhysicalMaterial({ color: '#0b0c10', roughness: .05, metalness: 0, clearcoat: 1, clearcoatRoughness: .03 }))
  display.position.y = T + .0003; phone.add(display)
  const islandGeo = new THREE.ShapeGeometry(roundedRect(.019, .0055, .00275), 6); islandGeo.rotateX(-Math.PI / 2)
  const island = new THREE.Mesh(islandGeo, new THREE.MeshBasicMaterial({ color: '#000000' }))
  island.position.set(0, T + .0005, -L / 2 + .0095); phone.add(island)
  return phone
}

function fabricTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const ctx = c.getContext('2d'); ctx.fillStyle = '#7a7b7e'; ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 2) for (let x = 0; x < 256; x += 2) {
    const v = 110 + ((x * 7 + y * 13) % 17) * 3 + (Math.random() * 18 | 0)
    ctx.fillStyle = `rgb(${v},${v},${v + 3})`; ctx.fillRect(x, y, 1.6, 1.6)
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 4); t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Compact fabric-wrapped smart speaker (≈ 13 cm wide, 16 cm tall). Origin at the bottom centre.
export function createSpeaker() {
  const speaker = new THREE.Group(); speaker.name = 'cabinet-speaker'
  const R = .066, H = .158, r = .02
  const pts = [new THREE.Vector2(0, 0)]
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(R - r + Math.cos(a) * r, r + Math.sin(a) * r)) }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(R - r + Math.cos(a) * r, H - r + Math.sin(a) * r)) }
  pts.push(new THREE.Vector2(0, H))
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64),
    new THREE.MeshStandardMaterial({ map: fabricTexture(), color: '#b9b8b4', roughness: .95 }))
  body.castShadow = true; body.receiveShadow = true; speaker.add(body)
  const top = new THREE.Mesh(new THREE.CircleGeometry(R - r * .55, 48), new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: .25, clearcoat: .6 }))
  top.rotation.x = -Math.PI / 2; top.position.y = H + .0006; speaker.add(top)
  const glow = new THREE.Mesh(new THREE.RingGeometry(.016, .021, 48), new THREE.MeshBasicMaterial({ color: '#d9e4ff', transparent: true, opacity: .55 }))
  glow.rotation.x = -Math.PI / 2; glow.position.y = H + .0012; speaker.add(glow)
  // "on" glow: a swirl of teal / violet / magenta light across the top, faded in while music is open
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d')
  const cg = ctx.createConicGradient ? ctx.createConicGradient(0, 128, 128) : null
  if (cg) { [['#22d3ee', 0], ['#6366f1', .25], ['#e040fb', .5], ['#38bdf8', .75], ['#22d3ee', 1]].forEach(([col, t]) => cg.addColorStop(t, col)); ctx.fillStyle = cg } else ctx.fillStyle = '#7c8cff'
  ctx.beginPath(); ctx.arc(128, 128, 128, 0, Math.PI * 2); ctx.fill()
  const fade = ctx.createRadialGradient(128, 128, 10, 128, 128, 128); fade.addColorStop(0, 'rgba(0,0,0,.85)'); fade.addColorStop(.45, 'rgba(0,0,0,.25)'); fade.addColorStop(.8, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,.6)')
  ctx.fillStyle = fade; ctx.fill()
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  const onMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  const on = new THREE.Mesh(new THREE.CircleGeometry(R - r * .6, 64), onMat); on.rotation.x = -Math.PI / 2; on.position.y = H + .0016; speaker.add(on)
  speaker.userData.glow = { on, onMat, idle: glow.material, level: 0 }
  speaker.userData.height = H
  return speaker
}

// ---- Picture light ---------------------------------------------------------
// Black bar lamp with brass end caps on a wall mount (like a gallery picture light).
// Built along local X; the wall is behind it (−Z) and it shines down/forward (+Z).
// Returns { group, glow } — `glow` is the emissive strip material to fade on and off.
export function createPictureLight(length = .55) {
  const group = new THREE.Group(); group.name = 'picture-light'
  const black = new THREE.MeshStandardMaterial({ color: '#141414', roughness: .45, metalness: .3 })
  const brass = new THREE.MeshStandardMaterial({ color: '#c8963e', roughness: .3, metalness: .85 })
  const glow = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffcf8a', emissiveIntensity: 0, roughness: .4 })
  const mount = new THREE.Mesh(new RoundedBoxGeometry(.13, .055, .045, 3, .02), black)
  mount.position.set(0, 0, .0225); group.add(mount)
  for (const x of [-.022, .022]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .13, 12), brass)
    arm.rotation.x = Math.PI / 2 - .55; arm.position.set(x, .045, .09); group.add(arm)
  }
  const barY = .085, barZ = .145, R = .017
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(R, R, length, 24, 1, false, Math.PI * .1, Math.PI * 1.15), black)
  bar.rotation.z = Math.PI / 2; bar.position.set(0, barY, barZ); group.add(bar)
  const strip = new THREE.Mesh(new THREE.CylinderGeometry(R * .96, R * .96, length * .98, 24, 1, false, Math.PI * 1.25, Math.PI * .85), glow)
  strip.rotation.z = Math.PI / 2; strip.position.set(0, barY, barZ); group.add(strip)
  for (const s of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass)
    cap.rotation.z = -s * Math.PI / 2; cap.position.set(s * length / 2, barY, barZ); group.add(cap)
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = true })
  strip.castShadow = false
  return { group, glow, lightPoint: new THREE.Vector3(0, barY - .01, barZ) }
}

// ---- LED strip under a shelf ---------------------------------------------------
export function createLedStrip(length) {
  const glow = new THREE.MeshStandardMaterial({ color: '#fff4e0', emissive: '#ffd59c', emissiveIntensity: 0, roughness: .5 })
  const strip = new THREE.Mesh(new THREE.BoxGeometry(.012, .005, length), glow)
  strip.name = 'shelf-led'
  return { strip, glow }
}

// ---- Potted plant ----------------------------------------------------------
function leafTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, '#3f8f2c'); g.addColorStop(1, '#2d6e1f')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)
  let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 26; i++) { // golden variegation streaks, like pothos
    ctx.strokeStyle = `rgba(214,226,120,${.25 + rand() * .35})`; ctx.lineWidth = 2 + rand() * 7
    const x = rand() * 256, y = rand() * 256
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30 * rand(), y - 40, x + 60 * rand(), y - 20, x + 90 * rand(), y - 70 * rand()); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(220,235,150,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(128, 256); ctx.lineTo(128, 10); ctx.stroke()
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function leafGeometry() {
  // heart-shaped leaf, tip at +Y, base at origin, slightly cupped along the midrib
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(.045, -.012, .06, .03, .045, .065)
  s.bezierCurveTo(.032, .095, .012, .115, 0, .13)
  s.bezierCurveTo(-.012, .115, -.032, .095, -.045, .065)
  s.bezierCurveTo(-.06, .03, -.045, -.012, 0, 0)
  const geo = new THREE.ShapeGeometry(s, 12)
  const pos = geo.attributes.position, uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    pos.setZ(i, Math.abs(x) * Math.abs(x) * 6 - y * y * .6) // cup + droop
    uv[i * 2] = x / .12 + .5; uv[i * 2 + 1] = y / .13
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.computeVertexNormals()
  return geo
}

// Pothos-style plant in a glossy white pot on a round wooden tray. Origin at the bottom centre.
export function createPlant() {
  const plant = new THREE.Group(); plant.name = 'pothos-plant'
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .014, 48),
    new THREE.MeshStandardMaterial({ color: '#b98a5a', roughness: .6 }))
  tray.position.y = .007; plant.add(tray)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.147, .006, 8, 48), tray.material)
  lip.rotation.x = Math.PI / 2; lip.position.y = .016; plant.add(lip)
  const potProfile = [[0, 0], [.068, 0], [.072, .004], [.088, .135], [.092, .15], [.086, .152], [.08, .14], [0, .14]].map(([x, y]) => new THREE.Vector2(x, y))
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 48),
    new THREE.MeshPhysicalMaterial({ color: '#f7f7f5', roughness: .18, clearcoat: .8, clearcoatRoughness: .15 }))
  pot.position.y = .014; plant.add(pot)
  const soil = new THREE.Mesh(new THREE.CircleGeometry(.08, 32), new THREE.MeshStandardMaterial({ color: '#2b1d14', roughness: 1 }))
  soil.rotation.x = -Math.PI / 2; soil.position.y = .148; plant.add(soil)

  const stemMat = new THREE.MeshStandardMaterial({ color: '#4f7f2a', roughness: .7 })
  // a touch of emissive keeps leaves that face away from the light from turning black
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTexture(), roughness: .45, side: THREE.DoubleSide, emissive: '#1d3a12', emissiveIntensity: .35 })
  const leafGeo = leafGeometry()
  let seed = 5; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const LEAVES = 22
  for (let i = 0; i < LEAVES; i++) {
    const a = i * 2.4 + rand() * .4                     // golden-angle spiral around the pot
    const h = .16 + .12 + rand() * .2                   // leaf height above the tray
    const reach = .05 + (1 - (h - .28) / .2) * .13 + rand() * .04
    const tip = new THREE.Vector3(Math.cos(a) * reach, h, Math.sin(a) * reach)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * .015, .15, Math.sin(a) * .015),
      new THREE.Vector3(Math.cos(a) * reach * .4, h * .8, Math.sin(a) * reach * .4),
      tip,
    ])
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .0028, 6), stemMat); plant.add(stem)
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    const s = 1 + rand() * .6; leaf.scale.setScalar(s)
    leaf.position.copy(tip)
    // face outward and tilt the leaf tip up-and-out
    leaf.rotation.order = 'YXZ'
    leaf.rotation.y = -a - Math.PI / 2
    leaf.rotation.x = -.6 - rand() * .5
    leaf.rotation.z = (rand() - .5) * .5
    leaf.castShadow = true; plant.add(leaf)
  }
  plant.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return plant
}

// ---- Linear pendant light ------------------------------------------------------
// Matte black bar hung on two thin wires; the underside is an opal diffuser.
// Origin at the ceiling attachment point; the bar runs along local Z.
export function createPendant(length = 1, drop = .55) {
  const group = new THREE.Group(); group.name = 'linear-pendant'
  const black = new THREE.MeshStandardMaterial({ color: '#111111', roughness: .55, metalness: .25 })
  const glow = new THREE.MeshStandardMaterial({ color: '#fbf3e6', emissive: '#ffe2b0', emissiveIntensity: 0, roughness: .6 })
  const W = .05, H = .045
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, length), black)
  body.position.y = -drop - H / 2; body.castShadow = true; group.add(body)
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(W * .82, .004, length * .97), glow)
  diffuser.position.y = -drop - H - .001; group.add(diffuser)
  const wireMat = new THREE.MeshBasicMaterial({ color: '#2a2a2a' })
  for (const z of [-length * .38, length * .38]) {
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0012, drop, 6), wireMat)
    wire.position.set(0, -drop / 2, z); group.add(wire)
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .012, 24), black)
    canopy.position.set(0, -.006, z); group.add(canopy)
  }
  // cover plate over the hole left by the old downlight
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .008, 32), black)
  plate.position.y = -.004; group.add(plate)
  return { group, glow }
}

// ---- Bonsai ------------------------------------------------------------------
// Small juniper-style bonsai in a shallow glazed pot. Origin at the bottom centre.
export function createBonsai() {
  const tree = new THREE.Group(); tree.name = 'bonsai'
  let seed = 17; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  // pot: shallow rounded rectangle, dark glaze, with little feet
  const potMat = new THREE.MeshPhysicalMaterial({ color: '#6a4030', roughness: .35, clearcoat: .6, clearcoatRoughness: .25 })
  const pot = new THREE.Mesh(new RoundedBoxGeometry(.22, .055, .15, 4, .012), potMat)
  pot.position.y = .012 + .0275; tree.add(pot)
  for (const [x, z] of [[-.085, -.05], [.085, -.05], [-.085, .05], [.085, .05]]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.022, .012, .022), potMat); foot.position.set(x, .006, z); tree.add(foot)
  }
  const soilY = .012 + .057 // just above the pot rim so the soil shows
  const soil = new THREE.Mesh(new THREE.BoxGeometry(.2, .004, .13), new THREE.MeshStandardMaterial({ color: '#3b2a1c', roughness: 1 }))
  soil.position.y = soilY; tree.add(soil)
  const mossMat = new THREE.MeshStandardMaterial({ color: '#5d7d34', roughness: 1 })
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(.012 + rand() * .012, 8, 6), mossMat)
    m.scale.y = .3; m.position.set((rand() - .5) * .16, soilY + .002, (rand() - .5) * .09); tree.add(m)
  }
  // trunk: an S-curve, tapering as it rises
  const barkMat = new THREE.MeshStandardMaterial({ color: '#5a4434', roughness: .9 })
  const trunkPts = [[-.02, soilY, 0], [-.035, soilY + .05, .01], [.005, soilY + .1, -.005], [.035, soilY + .15, .008], [.01, soilY + .2, 0], [-.015, soilY + .235, -.005]]
    .map(([x, y, z]) => new THREE.Vector3(x, y, z))
  const trunkCurve = new THREE.CatmullRomCurve3(trunkPts)
  const segs = 14
  for (let i = 0; i < segs; i++) {
    const a = trunkCurve.getPoint(i / segs), b = trunkCurve.getPoint((i + 1) / segs)
    const r0 = .016 * (1 - i / segs * .7), r1 = .016 * (1 - (i + 1) / segs * .7)
    const len = a.distanceTo(b)
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 10), barkMat)
    seg.position.copy(a).add(b).multiplyScalar(.5)
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); tree.add(seg)
    const joint = new THREE.Mesh(new THREE.SphereGeometry(r1, 10, 8), barkMat); joint.position.copy(b); tree.add(joint)
  }
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(.016, .028, .02, 12), barkMat); flare.position.set(-.02, soilY + .008, 0); tree.add(flare)
  // branches ending in foliage pads
  const pads = [
    { from: .35, to: [-.11, soilY + .1, .02], size: [.07, .03, .05] },
    { from: .55, to: [.11, soilY + .15, -.01], size: [.075, .032, .055] },
    { from: .75, to: [-.07, soilY + .2, -.02], size: [.06, .028, .05] },
    { from: .95, to: [.01, soilY + .26, 0], size: [.075, .04, .06] },
    { from: .65, to: [.04, soilY + .19, .06], size: [.05, .025, .04] },
  ]
  const leafColors = ['#2f5a24', '#3b6b2a', '#467a30', '#2a4f20']
  const blob = new THREE.IcosahedronGeometry(1, 1)
  for (const pad of pads) {
    const start = trunkCurve.getPoint(pad.from), end = new THREE.Vector3(...pad.to)
    const mid = start.clone().lerp(end, .5).add(new THREE.Vector3(0, .015, 0))
    const branch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, mid, end), 8, .0045, 6), barkMat)
    tree.add(branch)
    const count = 26
    const leaves = new THREE.InstancedMesh(blob, new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true }), count)
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const u = rand() * Math.PI * 2, v = rand()
      pos.set(Math.cos(u) * pad.size[0] * Math.sqrt(v), (rand() - .3) * pad.size[1], Math.sin(u) * pad.size[2] * Math.sqrt(v)).add(end)
      const r = .011 + rand() * .01; sc.set(r, r * .7, r)
      q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3))
      leaves.setMatrixAt(i, m.compose(pos, q, sc)); leaves.setColorAt(i, col.set(leafColors[i % leafColors.length]))
    }
    leaves.castShadow = true; tree.add(leaves)
  }
  tree.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return tree
}

// ---- Shelf contents: books and box files ------------------------------------------
const BOOK_SPINES = ['#2f3e46', '#b5523b', '#d9a441', '#6b8f71', '#e6dfd2', '#3b3b3d', '#8c5e3c', '#9fb2c4', '#c97c5d', '#5b4b6b', '#a4a08a', '#1f4e5f', '#7a2e2e', '#f0ebe0']
const FILE_COLORS = ['#20242a', '#2f4a6b', '#e9e6df', '#8a8d91', '#3c5a46']

// Fill the free stretches of a shelf with rows of upright books and lever-arch files.
// shelf: { top, back, front (x or z of the edges), from, to (run along the shelf),
//          alongZ (true if the shelf runs along Z), maxHeight }, occupied: [[a, b], ...]
export function createShelfContents({ top, back, front, from, to, alongZ, maxHeight, occupied = [], seed = 1 }) {
  const group = new THREE.Group(); group.name = 'shelf-books'
  let s = seed * 7919 + 13; const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  const mats = new Map(), mat = (color, rough = .7) => {
    const key = color + rough; if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough })); return mats.get(key)
  }
  const labelMat = mat('#f4f1ea', .8), holeMat = mat('#111111', .6), bandMat = mat('#d8c48a', .4)
  const depthSign = Math.sign(front - back) // +1 if the room side is the larger coordinate
  // free intervals along the shelf
  const busy = occupied.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]).sort((p, q) => p[0] - q[0])
  const free = []; let cursor = from
  for (const [a, b] of busy) { if (a > cursor + .08) free.push([cursor, a]); cursor = Math.max(cursor, b) }
  if (to > cursor + .08) free.push([cursor, to])

  const place = (mesh, along, depthOffset, y) => {
    const d = back + depthSign * depthOffset
    if (alongZ) mesh.position.set(d, y, along); else mesh.position.set(along, y, d)
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh)
  }
  for (const [a, b] of free) {
    let p = a + .02
    while (p < b - .03) {
      // a run of 5–12 items, then a small breathing gap
      const run = 5 + Math.floor(rand() * 8)
      const useFiles = rand() < .3
      for (let i = 0; i < run && p < b - .03; i++) {
        if (useFiles) {
          const w = .06 + rand() * .015, h = Math.min(maxHeight - .02, .3 + rand() * .02), d = .27
          if (p + w > b) break
          const color = FILE_COLORS[Math.floor(rand() * FILE_COLORS.length)]
          const box = new THREE.Mesh(alongZ ? new THREE.BoxGeometry(d, h, w) : new THREE.BoxGeometry(w, h, d), mat(color, .55))
          box.name = 'box-file'
          box.userData = { w, h, d, alongZ, depthSign, color }
          place(box, p + w / 2, d / 2 + .01, top + h / 2)
          // spine label and finger hole on the room-facing side (children, so they move with the file)
          const label = new THREE.Mesh(new THREE.PlaneGeometry(w * .62, h * .28), labelMat)
          const hole = new THREE.Mesh(new THREE.CircleGeometry(w * .17, 20), holeMat)
          for (const [m, yy] of [[label, h * .16], [hole, -h * .22]]) {
            if (alongZ) { m.rotation.y = depthSign > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(depthSign * (d / 2 + .0012), yy, 0) }
            else { m.rotation.y = depthSign > 0 ? 0 : Math.PI; m.position.set(0, yy, depthSign * (d / 2 + .0012)) }
            box.add(m)
          }
          p += w + .002
        } else {
          const w = .018 + rand() * .03, h = Math.min(maxHeight - .02, .19 + rand() * .1), d = .14 + rand() * .07
          if (p + w > b) break
          const color = BOOK_SPINES[Math.floor(rand() * BOOK_SPINES.length)]
          const lean = (i === run - 1 && rand() < .35) ? .18 : 0 // the last book sometimes leans
          const book = new THREE.Mesh(alongZ ? new THREE.BoxGeometry(d, h, w) : new THREE.BoxGeometry(w, h, d), mat(color, .75))
          place(book, p + w / 2 + (lean ? h * Math.sin(lean) / 2 : 0), d / 2 + .01, top + h / 2 * Math.cos(lean))
          if (lean) { if (alongZ) book.rotation.x = -lean; else book.rotation.z = lean }
          if (!lean && rand() < .45) { // a pale title band on some spines
            const band = new THREE.Mesh(new THREE.PlaneGeometry(w * .7, .012), rand() < .5 ? bandMat : labelMat)
            const yy = top + h * (.72 + rand() * .12)
            if (alongZ) { band.rotation.y = depthSign > 0 ? Math.PI / 2 : -Math.PI / 2; band.position.set(back + depthSign * (d + .0105), yy, p + w / 2) }
            else { band.rotation.y = depthSign > 0 ? 0 : Math.PI; band.position.set(p + w / 2, yy, back + depthSign * (d + .0105)) }
            group.add(band)
          }
          p += w + (lean ? h * Math.sin(lean) : .001)
        }
      }
      p += .06 + rand() * .12
    }
  }
  return group
}

// ---- Plug-in style wall night light ------------------------------------------------
// Slim brass-framed panel with an opal diffuser and a small motion-sensor dot.
// Origin at the wall, facing +Z. Returns { group, glow, lightPoint }.
export function createNightLight() {
  const group = new THREE.Group(); group.name = 'night-light'
  const W = .065, H = .115, D = .014
  const brass = new THREE.MeshStandardMaterial({ color: '#c49a4a', roughness: .32, metalness: .8 })
  const frame = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, .005), brass)
  frame.position.z = D / 2; group.add(frame)
  const glow = new THREE.MeshStandardMaterial({ color: '#fbf4e6', emissive: '#ffcf8a', emissiveIntensity: 0, roughness: .5 })
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(W * .72, H * .66), glow)
  panel.position.set(0, H * .1, D + .0006); group.add(panel)
  const sensor = new THREE.Mesh(new THREE.CircleGeometry(.0055, 20), new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: .1, clearcoat: 1 }))
  sensor.position.set(0, -H * .36, D + .0006); group.add(sensor)
  frame.castShadow = true
  return { group, glow, lightPoint: new THREE.Vector3(0, H * .1, D + .02) }
}

// A tall ficus (weeping fig) in a grey cement pot, ≈ 1.65 m. Origin at the bottom centre.
export function createFloorPlant() {
  const plant = new THREE.Group(); plant.name = 'floor-ficus'
  let seed = 23; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  // cement pot: slightly tapered cylinder with a rolled lip, mottled grey
  const potProfile = [[0, 0], [.135, 0], [.14, .01], [.165, .3], [.172, .31], [.168, .318], [.155, .312], [.15, .29], [0, .29]].map(([x, y]) => new THREE.Vector2(x, y))
  const potTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d')
    ctx.fillStyle = '#8e8d89'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 900; i++) { const v = 110 + rand() * 60 | 0; ctx.fillStyle = `rgba(${v},${v},${v - 4},${.12 + rand() * .2})`; ctx.beginPath(); ctx.arc(rand() * 256, rand() * 256, 2 + rand() * 9, 0, Math.PI * 2); ctx.fill() }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t
  })()
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 56), new THREE.MeshStandardMaterial({ map: potTex, color: '#a9a8a4', roughness: .92 }))
  pot.name = 'ficus-pot'; plant.add(pot)
  const soil = new THREE.Mesh(new THREE.CircleGeometry(.15, 40), new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 1 }))
  soil.rotation.x = -Math.PI / 2; soil.position.y = .285; plant.add(soil)

  // two slender trunks twisting around each other
  const bark = new THREE.MeshStandardMaterial({ color: '#7b5a41', roughness: .85 })
  const top = 1.32
  for (const phase of [0, Math.PI]) {
    const pts = []
    for (let i = 0; i <= 10; i++) { const t = i / 10, a = phase + t * 3.2, r = .012 * (1 - t * .6); pts.push(new THREE.Vector3(Math.cos(a) * r + t * .02, .27 + t * (top - .27), Math.sin(a) * r)) }
    plant.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .011, 7), bark))
  }
  // twigs fanning out from the upper trunk; leaves gather along and around their ends
  const twigTips = []
  const twigMat = new THREE.MeshStandardMaterial({ color: '#6d5a3c', roughness: .85 })
  for (let i = 0; i < 18; i++) {
    const h = .62 + rand() * .72, a = i * 2.39 + rand() * .5, reach = .16 + rand() * .2 * (1 - Math.abs(h - 1.05) * .9)
    const start = new THREE.Vector3(.01, h, 0), end = new THREE.Vector3(Math.cos(a) * reach, h + .06 + rand() * .12, Math.sin(a) * reach)
    const mid = start.clone().lerp(end, .5).add(new THREE.Vector3(0, .03, 0))
    plant.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 8, .004, 5), twigMat))
    twigTips.push({ start, end })
  }
  // leaves: small glossy ovals, two greens, drooping slightly
  const s = new THREE.Shape(); s.moveTo(0, 0)
  s.bezierCurveTo(.022, .01, .024, .045, 0, .075); s.bezierCurveTo(-.024, .045, -.022, .01, 0, 0)
  const leafGeo = new THREE.ShapeGeometry(s, 6)
  const pos = leafGeo.attributes.position
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, x * x * 5 - y * y * .9) }
  leafGeo.computeVertexNormals()
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .42, side: THREE.DoubleSide, emissive: '#16300f', emissiveIntensity: .3 })
  const COUNT = 760, leaves = new THREE.InstancedMesh(leafGeo, leafMat, COUNT)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color()
  const greens = ['#2f6b2a', '#3d7f31', '#4f9a3a', '#285e25', '#5aa645']
  for (let i = 0; i < COUNT; i++) {
    const tw = twigTips[i % twigTips.length], t = .35 + rand() * .75
    p.copy(tw.start).lerp(tw.end, Math.min(1, t))
    p.x += (rand() - .5) * .2; p.y += (rand() - .5) * .16; p.z += (rand() - .5) * .2
    const out = Math.atan2(p.z, p.x)
    e.set(-.5 - rand() * .9, -out + Math.PI / 2 + (rand() - .5) * 1.4, (rand() - .5) * .8, 'YXZ'); q.setFromEuler(e)
    const k = .8 + rand() * .45; sc.set(k, k, k)
    m.compose(p, q, sc); leaves.setMatrixAt(i, m)
    leaves.setColorAt(i, col.set(greens[(rand() * greens.length) | 0]))
  }
  leaves.instanceMatrix.needsUpdate = true; leaves.instanceColor.needsUpdate = true
  plant.add(leaves)
  plant.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return plant
}

// An open hardcover book lying flat, ≈ 34 × 24 cm open. Origin at the bottom centre; the top
// edge of the pages is local −Z. BOOK describes the two-page spread so pages can be laid over it.
export const BOOK = { W: .34, L: .236, pageY: .0165, pagesW: .328, pagesL: .226 }
export function createOpenBook() {
  const book = new THREE.Group(); book.name = 'open-book'
  const cover = new THREE.Mesh(new THREE.BoxGeometry(BOOK.W + .008, .005, BOOK.L + .01), new THREE.MeshStandardMaterial({ color: '#7d1d22', roughness: .6 }))
  cover.position.y = .0025; book.add(cover)
  // two page blocks: thick near the spine, thinning toward the outer edges, with a soft gutter
  const paper = new THREE.MeshStandardMaterial({ color: '#f7f4ec', roughness: .9 })
  const edge = new THREE.MeshStandardMaterial({ color: '#e9e3d4', roughness: .95 })
  for (const side of [-1, 1]) {
    const seg = 24, w = BOOK.pagesW / 2, l = BOOK.pagesL
    const geo = new THREE.PlaneGeometry(w, l, seg, 1); geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + w / 2 // 0 at the spine side … w at the outer edge (before mirroring)
      const u = x / w
      pos.setY(i, BOOK.pageY - .004 * u + (u < .12 ? -.006 * (1 - u / .12) ** 2 : 0))
      pos.setX(i, side * (x + .001))
    }
    geo.computeVertexNormals()
    const page = new THREE.Mesh(geo, paper); page.name = 'book-page'; if (side < 0) page.scale.x = 1; book.add(page)
    // page edges (the paper block seen from the side)
    const block = new THREE.Mesh(new THREE.BoxGeometry(w, .009, l), edge)
    block.position.set(side * (w / 2 + .001), .0095, 0); book.add(block)
  }
  // ribbon bookmark down the gutter
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(.006, BOOK.L + .03), new THREE.MeshStandardMaterial({ color: '#b3202a', roughness: .6, side: THREE.DoubleSide }))
  ribbon.rotation.x = -Math.PI / 2; ribbon.position.set(.004, BOOK.pageY - .005, .012); book.add(ribbon)
  book.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return book
}

// A desk model of a twin-engine airliner on a chrome stand with a dark wooden base (plain livery).
// Nose points along local +Z. About 30 cm long.
export function createModelAirplane() {
  const plane = new THREE.Group(); plane.name = 'model-airplane'
  const white = new THREE.MeshPhysicalMaterial({ color: '#f4f5f7', roughness: .32, clearcoat: .6, clearcoatRoughness: .2 })
  const navy = new THREE.MeshStandardMaterial({ color: '#0f1f3d', roughness: .4 })
  const grey = new THREE.MeshStandardMaterial({ color: '#b9bcc2', metalness: .6, roughness: .3 })
  const dark = new THREE.MeshStandardMaterial({ color: '#1a1c20', roughness: .5 })
  const craft = new THREE.Group()
  // fuselage: lathe profile along Y, then laid along Z
  const prof = [[0, -.15], [.008, -.145], [.014, -.13], [.017, -.1], [.017, .09], [.0165, .11], [.014, .127], [.009, .14], [.003, .148], [0, .15]].map(([r, y]) => new THREE.Vector2(r, y))
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), white); body.rotation.x = Math.PI / 2; body.scale.set(1, 1, 1); craft.add(body)
  // tail sweeps upward: shift the rear section by squashing
  // cockpit windows and the line of cabin windows
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(.016, .004, .008), dark); cockpit.position.set(0, .011, .133); cockpit.rotation.x = -.5; craft.add(cockpit)
  for (const s of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.0004, .0022, .17), dark); strip.position.set(s * .0168, .006, .005); craft.add(strip)
  }
  // swept main wings
  const wingShape = new THREE.Shape([new THREE.Vector2(0, .03), new THREE.Vector2(.135, -.03), new THREE.Vector2(.135, -.045), new THREE.Vector2(0, -.015)])
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: .0025, bevelEnabled: false }); wingGeo.rotateX(Math.PI / 2)
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, white); wing.scale.x = s; wing.position.set(0, -.006, .01); wing.rotation.z = s * .07; craft.add(wing)
    // engine under each wing
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(.0105, .009, .045, 24, 1, true), white); eng.rotation.x = Math.PI / 2; eng.position.set(s * .05, -.018, .03); craft.add(eng)
    const lip = new THREE.Mesh(new THREE.TorusGeometry(.0102, .0016, 8, 24), grey); lip.position.set(s * .05, -.018, .0525); craft.add(lip)
    const fan = new THREE.Mesh(new THREE.CircleGeometry(.0098, 24), dark); fan.position.set(s * .05, -.018, .051); craft.add(fan)
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(.003, .01, .03), white); pylon.position.set(s * .05, -.01, .022); craft.add(pylon)
    // horizontal stabiliser
    const stab = new THREE.Mesh(wingGeo, white); stab.scale.set(s * .42, 1, .5); stab.position.set(0, .004, -.128); craft.add(stab)
  }
  // vertical fin in navy
  const finShape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.05, 0), new THREE.Vector2(.075, .058), new THREE.Vector2(.058, .058)])
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: .002, bevelEnabled: false }); finGeo.rotateY(Math.PI / 2)
  const fin = new THREE.Mesh(finGeo, navy); fin.position.set(-.001, .01, -.095); craft.add(fin)
  // tail cone in navy
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.012, .004, .03, 24), navy); cone.rotation.x = -Math.PI / 2; cone.position.set(0, .002, -.135); craft.add(cone)
  // landing gear
  for (const [x, z] of [[0, .11], [-.02, 0], [.02, 0]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.0012, .0012, .018, 6), grey); leg.position.set(x, -.024, z); craft.add(leg)
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .004, 12), dark); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, -.034, z); craft.add(wheel)
  }
  craft.rotation.x = -.16 // nose-up, climbing
  craft.position.y = .17
  plane.add(craft)
  // stand: angled chrome rod on a wooden base
  const base = new THREE.Mesh(new THREE.BoxGeometry(.075, .018, .11), new THREE.MeshStandardMaterial({ color: '#4a1f1b', roughness: .45 }))
  base.position.set(0, .009, -.02); plane.add(base)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .165, 10), new THREE.MeshStandardMaterial({ color: '#d8dade', metalness: .9, roughness: .2 }))
  rod.position.set(0, .095, -.005); rod.rotation.x = .28; plane.add(rod)
  plane.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return plane
}

// A compact digital camera (point-and-shoot) in black, ≈ 10.5 × 6 × 3 cm. Origin at the bottom
// centre; the lens points along local +Z.
// Where the camera's rear screen sits (local coords, facing −Z), so photos can be laid over it.
export const CAMERA_SCREEN = { w: .062, h: .042, x: .01, y: .031, z: -.0146 }
export function createDigitalCamera() {
  const cam = new THREE.Group(); cam.name = 'desk-camera'
  const W = .105, H = .06, D = .028, bevel = .004
  const black = new THREE.MeshStandardMaterial({ color: '#141416', roughness: .5, metalness: .15 })
  const satin = new THREE.MeshStandardMaterial({ color: '#2a2b2f', roughness: .35, metalness: .6 })
  const glass = new THREE.MeshPhysicalMaterial({ color: '#07090d', roughness: .05, clearcoat: 1, clearcoatRoughness: .02 })
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W - bevel * 2, H - bevel * 2, .008), { depth: D - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 })
  bodyGeo.translate(0, H / 2, -D / 2 + bevel)
  const body = new THREE.Mesh(bodyGeo, black); cam.add(body)
  // lens: stepped barrel with a glass element, slightly right of centre
  const lx = .016, ly = H / 2 - .002, front = D / 2
  const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(.021, .022, .008, 40), satin); barrel1.rotation.x = Math.PI / 2; barrel1.position.set(lx, ly, front + .004); cam.add(barrel1)
  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(.016, .017, .01, 40), black); barrel2.rotation.x = Math.PI / 2; barrel2.position.set(lx, ly, front + .012); cam.add(barrel2)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.0135, .0018, 8, 40), satin); ring.position.set(lx, ly, front + .0172); cam.add(ring)
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.0125, 40), glass); lens.position.set(lx, ly, front + .0171); cam.add(lens)
  const glint = new THREE.Mesh(new THREE.CircleGeometry(.0035, 20), new THREE.MeshBasicMaterial({ color: '#3a4a66', transparent: true, opacity: .55 })); glint.position.set(lx - .004, ly + .004, front + .0173); cam.add(glint)
  // flash window and a small sensor dot on the front
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(.014, .007), new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: .2, emissive: '#2a2a28' })); flash.position.set(-.03, H - .013, front + .0005); cam.add(flash)
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.0018, 12), new THREE.MeshStandardMaterial({ color: '#6b4a1a', roughness: .3 })); dot.position.set(-.012, H - .013, front + .0005); cam.add(dot)
  // grip strip on the left of the front
  const grip = new THREE.Mesh(new THREE.BoxGeometry(.012, H * .62, .003), satin); grip.position.set(-.04, H * .45, front + .0012); cam.add(grip)
  // top: shutter button with a zoom ring, power button and mode dial
  const top = H
  const zoomRing = new THREE.Mesh(new THREE.CylinderGeometry(.0065, .0065, .002, 24), satin); zoomRing.position.set(.03, top + .001, 0); cam.add(zoomRing)
  const shutter = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0048, .004, 24), satin); shutter.position.set(.03, top + .003, 0); cam.add(shutter)
  const power = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, .0015, 16), black); power.position.set(.012, top + .0008, 0); cam.add(power)
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.0075, .0075, .004, 24), black); dial.position.set(-.028, top + .002, 0); cam.add(dial)
  // back: LCD screen (photos are shown over it) and a few buttons beside it
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(CAMERA_SCREEN.w + .004, CAMERA_SCREEN.h + .004), new THREE.MeshPhysicalMaterial({ color: '#050608', roughness: .08, clearcoat: 1 }))
  lcd.rotation.y = Math.PI; lcd.position.set(CAMERA_SCREEN.x, CAMERA_SCREEN.y, CAMERA_SCREEN.z + .0002); cam.add(lcd)
  for (const [bx, by, r] of [[-.04, H * .7, .0045], [-.04, H * .42, .0085], [-.04, H * .18, .003]]) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .002, 20), satin); btn.rotation.x = Math.PI / 2; btn.position.set(bx, by, -D / 2 - .001); cam.add(btn)
  }
  cam.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return cam
}


// A modern square table lamp: low wooden plinth, slim brass post and a tall square linen shade
// that glows warm at night.
export function createTableLamp() {
  const group = new THREE.Group(); group.name = 'table-lamp'
  const wood = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: .55 })
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a35a', roughness: .3, metalness: .85 })
  const base = new THREE.Mesh(new RoundedBoxGeometry(.11, .028, .11, 3, .004), wood); base.position.y = .014; group.add(base)
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .05, 12), brass); post.position.y = .05; group.add(post)
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d')
  ctx.fillStyle = '#eee4cf'; ctx.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 1600; i++) { ctx.fillStyle = `rgba(${150 + Math.random() * 60},${130 + Math.random() * 50},${100 + Math.random() * 40},.12)`; ctx.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1) }
  const linen = new THREE.CanvasTexture(c); linen.colorSpace = THREE.SRGBColorSpace; linen.wrapS = linen.wrapT = THREE.RepeatWrapping; linen.repeat.set(2, 3)
  const glow = new THREE.MeshStandardMaterial({ map: linen, color: '#f3ead6', emissive: '#ffc777', emissiveMap: linen, emissiveIntensity: 0, roughness: .95, side: THREE.DoubleSide })
  const H = .25, S = .1
  const shadeGeo = new THREE.CylinderGeometry(S / Math.SQRT2, S / Math.SQRT2, H, 4, 1, true); shadeGeo.rotateY(Math.PI / 4)
  const shade = new THREE.Mesh(shadeGeo, glow); shade.position.y = .07 + H / 2; group.add(shade)
  group.traverse((o) => { if (o.isMesh) { o.castShadow = o !== shade; o.receiveShadow = true } })
  return { group, glow, lightPoint: new THREE.Vector3(0, .07 + H * .45, 0) }
}

// An instant (Polaroid-style) print lying flat, ≈ 8.8 × 10.7 cm, with a painted snapshot.
// Origin at the bottom centre; the thick bottom margin of the frame is toward local +Z.
const POLAROID_SCENES = [
  // sunset over the sea
  (ctx, w, h) => {
    let g = ctx.createLinearGradient(0, 0, 0, h * .62); g.addColorStop(0, '#3d4f8a'); g.addColorStop(.55, '#e98a5c'); g.addColorStop(1, '#ffd58a')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * .62)
    ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(w * .58, h * .6, w * .11, Math.PI, 0); ctx.fill()
    g = ctx.createLinearGradient(0, h * .62, 0, h); g.addColorStop(0, '#d9835f'); g.addColorStop(1, '#2c3b62')
    ctx.fillStyle = g; ctx.fillRect(0, h * .62, w, h * .38)
    ctx.fillStyle = 'rgba(255,230,170,.55)'; for (let i = 0; i < 14; i++) ctx.fillRect(w * .58 - w * (.12 - i * .006), h * (.64 + i * .024), w * (.24 - i * .012), 2)
  },
  // mountains over a lake
  (ctx, w, h) => {
    let g = ctx.createLinearGradient(0, 0, 0, h * .55); g.addColorStop(0, '#7fb2d8'); g.addColorStop(1, '#dbe9ef')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    const ridge = (col, base, amp, seed) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h * .6); for (let x = 0; x <= w; x += w / 12) ctx.lineTo(x, h * (base - amp * Math.abs(Math.sin(x / w * 5.3 + seed)))); ctx.lineTo(w, h * .6); ctx.fill() }
    ridge('#8a9bb0', .42, .2, 1); ridge('#4f6a6a', .52, .12, 2.4); ridge('#2f4a3c', .58, .06, 4)
    g = ctx.createLinearGradient(0, h * .6, 0, h); g.addColorStop(0, '#5d8193'); g.addColorStop(1, '#2a4552')
    ctx.fillStyle = g; ctx.fillRect(0, h * .6, w, h * .4)
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 9; i++) ctx.fillRect(w * Math.random(), h * (.66 + Math.random() * .3), w * .2, 1.5)
  },
  // a city skyline at dusk
  (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d2347'); g.addColorStop(.6, '#7b4f7a'); g.addColorStop(1, '#f0a36b')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    let x = 0, k = 7
    while (x < w) {
      const bw = w * (.07 + ((k * 37) % 9) / 90), bh = h * (.25 + ((k * 53) % 11) / 22)
      ctx.fillStyle = '#16182a'; ctx.fillRect(x, h - bh, bw - 2, bh)
      ctx.fillStyle = 'rgba(255,214,140,.85)'
      for (let wy = h - bh + 6; wy < h - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 6; wx += 7) if (((wx * 13 + wy * 7 + k) % 5) < 2) ctx.fillRect(wx, wy, 3, 4)
      x += bw; k++
    }
  },
]
export function createPolaroid(scene = 0) {
  const W = .088, L = .107, T = .0009
  const c = document.createElement('canvas'); c.width = 352; c.height = 428; const ctx = c.getContext('2d')
  ctx.fillStyle = '#f6f4ee'; ctx.fillRect(0, 0, c.width, c.height)
  const m = 22, pw = c.width - m * 2, ph = pw // square photo, thick margin below
  ctx.save(); ctx.translate(m, m); ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip()
  POLAROID_SCENES[scene % POLAROID_SCENES.length](ctx, pw, ph)
  const v = ctx.createRadialGradient(pw / 2, ph / 2, pw * .3, pw / 2, ph / 2, pw * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,.35)')
  ctx.fillStyle = v; ctx.fillRect(0, 0, pw, ph)
  for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},.06)`; ctx.fillRect(Math.random() * pw, Math.random() * ph, 1, 1) }
  ctx.restore()
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.strokeRect(m, m, pw, ph)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8
  const paper = new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: .85 })
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: .45 })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, T, L), [paper, paper, face, paper, paper, paper])
  mesh.position.y = T / 2; mesh.castShadow = true; mesh.receiveShadow = true
  const g = new THREE.Group(); g.name = 'polaroid'; g.add(mesh)
  return g
}

// A desk globe: domed brushed-steel foot, slim stem, a dark graduated meridian half-ring and an earth
// ball tilted 23.5°. About 29 cm tall. Origin at the bottom centre. The map is /globe-map.jpg.
export function createGlobe() {
  const group = new THREE.Group(); group.name = 'desk-globe'
  const steel = new THREE.MeshStandardMaterial({ color: '#c9ccd1', roughness: .28, metalness: .92 })
  const dark = new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: .45, metalness: .6 })
  // foot: a low dome flaring to a lip
  const prof = [[0, 0], [.074, 0], [.076, .004], [.074, .009], [.06, .014], [.04, .022], [.022, .032], [.012, .044], [.009, .056], [0, .056]].map(([x, y]) => new THREE.Vector2(x, y))
  const foot = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), steel); group.add(foot)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.0065, .008, .03, 20), steel); stem.position.y = .07; group.add(stem)
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .006, 20), steel); collar.position.y = .086; group.add(collar)
  const R = .1, cy = .086 + .003 + R + .012
  const tilt = new THREE.Group(); tilt.position.y = cy; tilt.rotation.z = THREE.MathUtils.degToRad(23.5); group.add(tilt)
  const map = new THREE.TextureLoader().load('/globe-map.jpg'); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshPhysicalMaterial({ map, roughness: .35, clearcoat: .6, clearcoatRoughness: .25 }))
  ball.name = 'globe-ball'; tilt.add(ball)
  // meridian half-ring on one side, pole to pole, with pins at the poles
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + .009, .0035, 10, 72, Math.PI), dark); ring.rotation.z = -Math.PI / 2; ring.scale.z = 1.8; tilt.add(ring)
  for (const s of [1, -1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .016, 10), steel); pin.position.y = s * (R + .004); tilt.add(pin)
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.0045, 14, 10), steel); knob.position.y = s * (R + .013); tilt.add(knob)
  }
  // short arm from the collar up to the bottom of the ring
  const bottom = new THREE.Vector3(0, -(R + .009), 0).applyEuler(tilt.rotation).add(tilt.position)
  const from = new THREE.Vector3(0, .089, 0), len = from.distanceTo(bottom)
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.004, .005, len, 12), steel)
  arm.position.copy(from).add(bottom).multiplyScalar(.5); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bottom.clone().sub(from).normalize()); group.add(arm)
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
  return group
}

// An achievements wall: a salon-style cluster of thin black frames holding certificates, a plaque and a
// badge. Built in the XY plane facing +Z, centred on the origin, ≈ 1.1 × .66 m.
function certificateArt(kind, accent) {
  const c = document.createElement('canvas'); const ctx = c.getContext('2d')
  const W = c.width = kind === 'portrait' ? 400 : kind === 'square' ? 400 : 560, H = c.height = kind === 'portrait' ? 520 : kind === 'square' ? 400 : 400
  if (kind === 'plaque') {
    ctx.fillStyle = '#121214'; ctx.fillRect(0, 0, W, H)
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f1d58a'); g.addColorStop(.5, '#b8862f'); g.addColorStop(1, '#f6e2a6')
    ctx.fillStyle = g
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 34 : 80; ctx.lineTo(W / 2 + Math.cos(a) * r, 150 + Math.sin(a) * r) } ctx.fill()
    ctx.fillRect(W * .18, 270, W * .64, 70); ctx.fillStyle = '#3a2a0c'; for (let i = 0; i < 3; i++) ctx.fillRect(W * .26, 286 + i * 16, W * (.48 - i * .1), 5)
  } else if (kind === 'square') {
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 10; ctx.lineJoin = 'round'
    // a trophy outline
    ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(260, 110); ctx.quadraticCurveTo(262, 220, 200, 236); ctx.quadraticCurveTo(138, 220, 140, 110); ctx.stroke()
    ctx.beginPath(); ctx.arc(140, 150, 30, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(260, 150, 30, -Math.PI / 2, Math.PI / 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(200, 236); ctx.lineTo(200, 270); ctx.moveTo(160, 290); ctx.lineTo(240, 290); ctx.stroke()
  } else {
    ctx.fillStyle = '#fbf8f1'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = accent; ctx.lineWidth = 8; ctx.strokeRect(18, 18, W - 36, H - 36); ctx.lineWidth = 2; ctx.strokeRect(32, 32, W - 64, H - 64)
    ctx.fillStyle = '#2a2a2e'; ctx.textAlign = 'center'
    ctx.font = `600 ${kind === 'portrait' ? 34 : 38}px Georgia, serif`; ctx.fillText('CERTIFICATE', W / 2, kind === 'portrait' ? 110 : 96)
    ctx.font = '500 15px Georgia, serif'; ctx.fillStyle = accent; ctx.fillText('OF ACHIEVEMENT', W / 2, kind === 'portrait' ? 138 : 122)
    ctx.fillStyle = '#c9c4b8'; const y0 = kind === 'portrait' ? 200 : 170
    ctx.fillRect(W * .2, y0, W * .6, 3); for (let i = 0; i < 3; i++) ctx.fillRect(W * (.25 + i * .02), y0 + 40 + i * 22, W * (.5 - i * .04), 3)
    // gold seal with ribbons, bottom right; signature line bottom left
    const sx = W - 110, sy = H - (kind === 'portrait' ? 110 : 90)
    ctx.fillStyle = '#9c1c24'; ctx.beginPath(); ctx.moveTo(sx - 22, sy); ctx.lineTo(sx - 34, sy + 62); ctx.lineTo(sx - 16, sy + 50); ctx.lineTo(sx - 4, sy + 66); ctx.lineTo(sx, sy); ctx.fill()
    ctx.beginPath(); ctx.moveTo(sx + 22, sy); ctx.lineTo(sx + 34, sy + 62); ctx.lineTo(sx + 16, sy + 50); ctx.lineTo(sx + 4, sy + 66); ctx.lineTo(sx, sy); ctx.fill()
    const sg = ctx.createRadialGradient(sx - 8, sy - 8, 4, sx, sy, 36); sg.addColorStop(0, '#f6dd92'); sg.addColorStop(1, '#b07d26')
    ctx.fillStyle = sg; ctx.beginPath(); for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, r = i % 2 ? 32 : 36; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r) } ctx.fill()
    ctx.fillStyle = '#c9c4b8'; ctx.fillRect(70, sy + 20, 130, 2)
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}
export function createCertificateWall() {
  const wall = new THREE.Group(); wall.name = 'achievements-wall'
  const frameMat = new THREE.MeshStandardMaterial({ color: '#121214', roughness: .45, metalness: .2 })
  const matMat = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: .9 })
  // [x, y, art width, art height, kind, accent]
  const layout = [
    // ≈ 5 cm between frames, 6 cm between the rows
    [-.376, .2, .34, .243, 'landscape', '#1f3c6e'],
    [0, .2, .16, .215, 'plaque', ''],
    [.376, .2, .34, .243, 'landscape', '#7a5a1c'],
    [-.504, -.188, .17, .17, 'square', '#2f6f5e'],
    [-.193, -.188, .2, .26, 'portrait', '#8a1c2b'],
    [.163, -.188, .26, .186, 'landscape', '#2f6f5e'],
    [.504, -.188, .17, .17, 'square', '#1f3c6e'],
  ]
  const F = .016, M = .022, D = .018
  for (const [x, y, w, h, kind, accent] of layout) {
    const g = new THREE.Group(); g.position.set(x, y, 0)
    const ow = w + 2 * (M + F), oh = h + 2 * (M + F)
    for (const [bw, bh, bx, by] of [[ow, F, 0, (oh - F) / 2], [ow, F, 0, -(oh - F) / 2], [F, oh - 2 * F, -(ow - F) / 2, 0], [F, oh - 2 * F, (ow - F) / 2, 0]]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, D), frameMat); bar.position.set(bx, by, D / 2); g.add(bar)
    }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(ow - 2 * F, oh - 2 * F), kind === 'plaque' || kind === 'square' ? frameMat : matMat); back.position.z = .004; g.add(back)
    const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: certificateArt(kind, accent), roughness: .7 })); art.position.z = .005; g.add(art)
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(ow - 2 * F, oh - 2 * F), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: .06, roughness: .05, clearcoat: 1 })); glass.position.z = D - .002; g.add(glass)
    g.traverse((o) => { if (o.isMesh) { o.castShadow = o !== glass; o.receiveShadow = true } })
    wall.add(g)
  }
  wall.userData.size = { w: 1.3, h: .74 }
  return wall
}

// The résumé file pulled off the shelf: a lever-arch file that opens like a book.
// Local frame: the résumé sheet is centred at the origin on z = 0, facing +z; the spine is on -x.
export const FOLDER = { sheetW: .19, sheetX: .012 }
export function createFileFolder({ color = '#2f4a6b', thickness = .065, height = .3, width = .27 } = {}) {
  const T = thickness, H = height, D = width
  const g = new THREE.Group(); g.name = 'resume-folder'
  const shell = new THREE.MeshStandardMaterial({ color, roughness: .55 })
  const lining = new THREE.MeshStandardMaterial({ color: '#B1D3B9', emissive: '#B1D3B9', emissiveIntensity: .45, roughness: .85 }) // inside: pale pastel green (lifted so the room light doesn't dull it)
  const metal = new THREE.MeshStandardMaterial({ color: '#c3c7cd', metalness: .35, roughness: .35 })
  const add = (geo, mat, x, y, z, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m }
  // Built like a book lying open-side up: the back cover is flat at the back, the résumé lies on it
  // (z = 0), and the spine and front cover fold over it. Opening lays both flat to the left,
  // in the same plane as the back cover.
  const L = T // closed thickness: back cover to front cover
  add(new THREE.BoxGeometry(D, H, .004), [shell, shell, shell, shell, lining, shell], 0, 0, -.004)
  // lever-arch mechanism beside the sheet
  add(new THREE.BoxGeometry(.026, H * .62, .003), metal, -D / 2 + .026, 0, -.0005)
  for (const y of [-H * .2, H * .2]) {
    const ring = add(new THREE.TorusGeometry(.011, .0018, 8, 20, Math.PI), metal, -D / 2 + .026, y, 0)
    ring.rotation.x = Math.PI / 2
  }
  // the résumé (unlit, so it reads like the overlay laid on it later)
  const sheetMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })
  const sheet = add(new THREE.PlaneGeometry(1, 1), sheetMat, FOLDER.sheetX, 0, .0004)
  sheet.castShadow = false; sheet.scale.set(FOLDER.sheetW, FOLDER.sheetW * 1.4142, 1)
  // spine, hinged at the back cover's edge, with its label and finger hole
  const spine = new THREE.Group(); spine.position.set(-D / 2, 0, -.006); g.add(spine)
  add(new THREE.BoxGeometry(.004, H, L), [shell, shell, shell, shell, shell, shell], -.002, 0, L / 2, spine)
  const label = add(new THREE.PlaneGeometry(T * .62, H * .28), new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: .8 }), -.0042, H * .16, L / 2, spine)
  const hole = add(new THREE.CircleGeometry(T * .17, 20), new THREE.MeshStandardMaterial({ color: '#111111', roughness: .6 }), -.0042, -H * .22, L / 2, spine)
  label.rotation.y = hole.rotation.y = -Math.PI / 2
  // front cover, hinged at the spine's other edge
  const cover = new THREE.Group(); cover.position.set(0, 0, L); spine.add(cover)
  add(new THREE.BoxGeometry(D, H, .004), [shell, shell, shell, shell, shell, lining], D / 2, 0, -.002, cover)
  let tex = null
  g.userData = {
    sheet,
    depth: L, width: D, height: H, // closed: from z = -.006 to L - .006
    openCenter: -(L + D) / 2, // middle of the opened file along x
    open(k) { spine.rotation.y = -Math.PI / 2 * k; cover.rotation.y = -Math.PI / 2 * k },
    setPage(canvas, aspect) {
      tex?.dispose(); tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8
      sheetMat.map = tex; sheetMat.needsUpdate = true
      sheet.scale.y = FOLDER.sheetW * Math.min(aspect, (H - .03) / FOLDER.sheetW)
    },
    dispose() { tex?.dispose(); g.traverse((o) => { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose()) }) },
  }
  return g
}
