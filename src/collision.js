import * as THREE from 'three'

// Everything between ankle and head height blocks the player.
export const COLLIDE_MIN = .12, COLLIDE_MAX = 1.9, CELL = .04, BODY_RADIUS = .24

// Rasterise every triangle that sits between ankle and head height onto a 2D grid
// of the room, then grow it by the body radius. Walls, the closed door, the window
// seat and all furniture become solid.
export function buildCollisionGrid(meshes, roomBounds, floorY) {
  const minX = roomBounds.min.x - .2, minZ = roomBounds.min.z - .2
  const nx = Math.ceil((roomBounds.max.x - minX + .2) / CELL), nz = Math.ceil((roomBounds.max.z - minZ + .2) / CELL)
  const solid = new Uint8Array(nx * nz), yLo = floorY + COLLIDE_MIN, yHi = floorY + COLLIDE_MAX
  const mark = (x, z) => { const i = Math.floor((x - minX) / CELL), k = Math.floor((z - minZ) / CELL); if (i >= 0 && i < nx && k >= 0 && k < nz) solid[k * nx + i] = 1 }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), box = new THREE.Box3(), size = new THREE.Vector3()
  for (const mesh of meshes) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    if (!mesh.visible || mesh.name === 'background' || materials.every((m) => !m || m.name === 'hidden_material')) continue
    box.setFromObject(mesh); box.getSize(size)
    if (box.max.y < yLo || box.min.y > yHi) continue
    if (Math.max(size.x, size.z) < .6 && size.y < 1.5) { // small prop: block its footprint
      for (let x = box.min.x; x <= box.max.x + CELL; x += CELL) for (let z = box.min.z; z <= box.max.z + CELL; z += CELL) mark(Math.min(x, box.max.x), Math.min(z, box.max.z))
      continue
    }
    const position = mesh.geometry.attributes.position, index = mesh.geometry.index
    const triCount = index ? index.count / 3 : position.count / 3
    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3, i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1, i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
      a.fromBufferAttribute(position, i0).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(position, i1).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(position, i2).applyMatrix4(mesh.matrixWorld)
      if ((a.y < yLo && b.y < yLo && c.y < yLo) || (a.y > yHi && b.y > yHi && c.y > yHi)) continue
      const longest = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a))
      const steps = Math.max(1, Math.ceil(longest / (CELL * .7)))
      for (let i = 0; i <= steps; i++) for (let j = 0; j <= steps - i; j++) {
        const u = i / steps, v = j / steps
        const y = a.y + (b.y - a.y) * u + (c.y - a.y) * v
        if (y >= yLo && y <= yHi) mark(a.x + (b.x - a.x) * u + (c.x - a.x) * v, a.z + (b.z - a.z) * u + (c.z - a.z) * v)
      }
    }
  }
  const blocked = new Uint8Array(nx * nz), r = Math.ceil(BODY_RADIUS / CELL)
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    if (!solid[k * nx + i]) continue
    for (let dk = -r; dk <= r; dk++) for (let di = -r; di <= r; di++) {
      if (di * di + dk * dk > r * r) continue
      const ii = i + di, kk = k + dk
      if (ii >= 0 && ii < nx && kk >= 0 && kk < nz) blocked[kk * nx + ii] = 1
    }
  }
  return { minX, minZ, nx, nz, blocked }
}

export function createWalkTester(getGrid, getBounds) {
  const isFree = (x, z) => {
    const bounds = getBounds(), grid = getGrid()
    if (bounds && (x < bounds.min.x || x > bounds.max.x || z < bounds.min.z || z > bounds.max.z)) return false
    if (!grid) return true
    const i = Math.floor((x - grid.minX) / CELL), k = Math.floor((z - grid.minZ) / CELL)
    return i >= 0 && i < grid.nx && k >= 0 && k < grid.nz && !grid.blocked[k * grid.nx + i]
  }
  // Nearest walkable point (for spawn points that land inside furniture).
  const nearestFree = (x, z) => {
    if (isFree(x, z)) return { x, z }
    for (let ring = 1; ring < 80; ring++) {
      let best = null, bestD = Infinity
      for (let dk = -ring; dk <= ring; dk++) for (let di = -ring; di <= ring; di++) {
        if (Math.max(Math.abs(di), Math.abs(dk)) !== ring) continue
        const px = x + di * CELL, pz = z + dk * CELL, d = di * di + dk * dk
        if (d < bestD && isFree(px, pz)) { best = { x: px, z: pz }; bestD = d }
      }
      if (best) return best
    }
    return { x, z }
  }
  return { isFree, nearestFree }
}
