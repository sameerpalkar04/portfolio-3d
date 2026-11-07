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

// A phone lying face up (≈ 71.5 × 147 × 7.8 mm), screen off. Origin at the bottom centre.
export function createPhone() {
  const phone = new THREE.Group(); phone.name = 'desk-phone'
  const W = .0715, L = .147, T = .0078
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, T, L, 4, .0095),
    new THREE.MeshStandardMaterial({ color: '#c9c5bd', metalness: .85, roughness: .32 }))
  body.position.y = T / 2; body.castShadow = true; body.receiveShadow = true; phone.add(body)
  const screenGeo = new THREE.ShapeGeometry(roundedRect(W - .003, L - .003, .0085), 8); screenGeo.rotateX(-Math.PI / 2)
  const screen = new THREE.Mesh(screenGeo, new THREE.MeshPhysicalMaterial({ color: '#07080a', roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .04 }))
  screen.position.y = T + .0004; phone.add(screen)
  const islandGeo = new THREE.ShapeGeometry(roundedRect(.019, .0055, .00275), 6); islandGeo.rotateX(-Math.PI / 2)
  const island = new THREE.Mesh(islandGeo, new THREE.MeshBasicMaterial({ color: '#000000' }))
  island.position.set(0, T + .0006, -L / 2 + .0095); phone.add(island)
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
          place(box, p + w / 2, d / 2 + .01, top + h / 2)
          // spine label and finger hole on the room-facing side
          const label = new THREE.Mesh(new THREE.PlaneGeometry(w * .62, h * .28), labelMat)
          const hole = new THREE.Mesh(new THREE.CircleGeometry(w * .17, 20), holeMat)
          for (const [m, yy] of [[label, top + h * .66], [hole, top + h * .28]]) {
            if (alongZ) { m.rotation.y = depthSign > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(back + depthSign * (d + .0112), yy, p + w / 2) }
            else { m.rotation.y = depthSign > 0 ? 0 : Math.PI; m.position.set(p + w / 2, yy, back + depthSign * (d + .0112)) }
            group.add(m)
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
