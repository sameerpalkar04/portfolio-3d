import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createExteriorMaterial, WINDOW_UV } from './exteriorShader'
import { buildCollisionGrid, createWalkTester } from './collision'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { toLocal, isLocked } from './orientation'
import { ACHIEVEMENTS } from './achievements'
import { PHONE, BOOK, CAMERA_SCREEN, createOpenBook, createDigitalCamera, createTableLamp, createGlobe, createCertificateWall, createPolaroid, createModelAirplane, createPhone, createFloorPlant, createSpeaker, createPictureLight, createLedStrip, createPlant, createPendant, createBonsai, createShelfContents, createNightLight, createFileFolder, FOLDER } from './props'
import { createDesktopTexture, BEACH_PHOTO_URL } from './screens'

const MODEL_URL = '/models/home-office.glb'
const SPOT_RATIOS = [
  { x: .50, z: .16 }, // start at the far end of the room
  { x: .20, z: .94 }, // window-side corner
  { x: .80, z: .24 }, // opposite end of the room
  { x: .52, z: .90 }, // work desk
  { x: .48, z: .50 }, // center of the room
  { x: .80, z: .82 }, // opposite corner
]

const EYE_HEIGHT = 1.58         // metres above the floor (standing adult)
const DEFAULT_FOV = 80          // opening view: fully zoomed out (the widest the scroll allows)
const SUN_DAY = 4.6             // direct sunlight strength in day mode
const WALK_SPEED = 1.9          // metres per second
// Time of day → how dark it is outside (0 day … 1 night) and how warm/golden the light is.
// Lamps follow the darkness, the sky passes through a golden dusk around sunrise and sunset.
const DAY_KEYS = [ // [hour, night, warmth]
  [0, 1, 0], [5, 1, 0], [6, .5, .9], [7.5, .15, .45], [9, 0, 0], [14, 0, 0], [16.5, .05, .3],
  [18, .5, 1], [19.5, .78, .4], [20.5, .86, .12], [22, 1, 0], [24, 1, 0],
]
export function lightAt(hour) {
  const h = ((hour % 24) + 24) % 24
  for (let i = 0; i < DAY_KEYS.length - 1; i++) {
    const [h0, n0, w0] = DAY_KEYS[i], [h1, n1, w1] = DAY_KEYS[i + 1]
    if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0 || 1); return { night: n0 + (n1 - n0) * t, warm: w0 + (w1 - w0) * t } }
  }
  return { night: 1, warm: 0 }
}
// Plain cloth-bound colours that replace the printed book covers.
const BOOK_COLORS = ['#2f3e46', '#b5523b', '#d9a441', '#6b8f71', '#e6dfd2', '#3b3b3d', '#8c5e3c', '#9fb2c4', '#c97c5d', '#5b4b6b', '#a4a08a', '#1f4e5f']


// Flat UVs across a mesh's broad face, normalised to its bounds (the door has none).
function addPlanarUVs(mesh) {
  const geometry = mesh.geometry
  geometry.computeBoundingBox()
  const size = geometry.boundingBox.getSize(new THREE.Vector3()), min = geometry.boundingBox.min
  const axes = [0, 1, 2].sort((a, b) => size.getComponent(a) - size.getComponent(b))
  const uAxis = axes[1], vAxis = axes[2] // width, height (thinnest axis is the slab depth)
  const position = geometry.attributes.position, uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getComponent(i, uAxis) - min.getComponent(uAxis)) / (size.getComponent(uAxis) || 1)
    uv[i * 2 + 1] = (position.getComponent(i, vAxis) - min.getComponent(vAxis)) / (size.getComponent(vAxis) || 1)
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

// Light oak veneer door with recessed panel grooves (symmetrical, so orientation doesn't matter).
function createDoorTexture() {
  const W = 512, H = 1024
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const x0 = 0, y0 = 0, w = W, h = H
  ctx.fillStyle = '#d2b48a'; ctx.fillRect(x0, y0, w, h)
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let x = x0; x < x0 + w; x += 3) {
    const tone = rand()
    ctx.strokeStyle = tone > .66 ? 'rgba(255,240,214,.16)' : tone > .33 ? 'rgba(140,100,60,.10)' : 'rgba(120,84,48,.06)'
    ctx.lineWidth = 1 + rand() * 1.5
    const bend = (rand() - .5) * 10
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x + bend, y0 + h * .33, x - bend, y0 + h * .66, x + bend * .3, y0 + h); ctx.stroke()
  }
  const groove = (x, y, gw, gh) => {
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(92,62,34,.45)'; ctx.strokeRect(x, y, gw, gh)
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,240,215,.35)'; ctx.strokeRect(x + 3, y + 3, gw - 6, gh - 6)
  }
  const gx = x0 + w * .14, gw = w * .72
  groove(gx, y0 + h * .08, gw, h * .39); groove(gx, y0 + h * .53, gw, h * .39)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function createScene(canvas, handlers) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene(), dayColor = new THREE.Color('#9ec7e2'), nightColor = new THREE.Color('#050b18')
  scene.background = nightColor.clone(); scene.fog = new THREE.Fog(dayColor, 48, 120)
  const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, 1, .08, 180); camera.rotation.order = 'YXZ'
  const hemi = new THREE.HemisphereLight('#f3f7ff','#756b5d',1.05); scene.add(hemi)
  const sun = new THREE.DirectionalLight('#ffe7c4',SUN_DAY); sun.position.set(-20,27,12); sun.castShadow=true
  // The shadow camera is fitted to the room once the model loads, so sunlight through the
  // window falls as crisp patches on the seat, floor and chair.
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-90; sun.shadow.camera.right=90; sun.shadow.camera.top=90; sun.shadow.camera.bottom=-90; sun.shadow.camera.far=180; sun.shadow.bias=-.0004; sun.shadow.normalBias=.03
  scene.add(sun)
  const sunDay = new THREE.Color('#ffe7c4'), moonColor = new THREE.Color('#9fb6ff'), sunGold = new THREE.Color('#ff9a52')
  const fill = new THREE.AmbientLight('#dce7f2',.36); scene.add(fill)
  // Extra warm lights that only switch on at night: { light, max, glow?: material, glowMax }
  const nightLights = []
  // Lights that stay on day and night (the desk lamp): { light, max, glow?, glowMax }
  const alwaysOnLights = []
  // Daytime-only fill (dayFillLights) and the shelf LED mood lights (moodLights): { light, max, glow?, glowMax }
  const dayFillLights = [], moodLights = []
  let windowSun=null
  const loader = new GLTFLoader()
  const panoramaLoader = new THREE.TextureLoader()
  const wallCanvas = document.createElement('canvas'); wallCanvas.width=1024; wallCanvas.height=1024
  const wallTexture = new THREE.CanvasTexture(wallCanvas)
  wallTexture.colorSpace=THREE.SRGBColorSpace; wallTexture.wrapS=wallTexture.wrapT=THREE.RepeatWrapping; wallTexture.repeat.set(1.25,1.25); wallTexture.flipY=false
  const wallSource = panoramaLoader.load('/models/textures/wall-plaster.jpg', (loaded) => {
    const ctx=wallCanvas.getContext('2d'); ctx.fillStyle='#f0e4d5'; ctx.fillRect(0,0,1024,1024)
    ctx.globalAlpha=.12; ctx.drawImage(loaded.image,0,0,1024,1024); ctx.globalAlpha=1
    wallTexture.needsUpdate=true
  })
  const floorCanvas = document.createElement('canvas'); floorCanvas.width=1024; floorCanvas.height=1024
  const floorTexture = new THREE.CanvasTexture(floorCanvas)
  floorTexture.colorSpace=THREE.SRGBColorSpace; floorTexture.wrapS=floorTexture.wrapT=THREE.RepeatWrapping; floorTexture.flipY=false
  const cabinetCanvas=document.createElement('canvas');cabinetCanvas.width=1024;cabinetCanvas.height=1024
  const cabinetTexture=new THREE.CanvasTexture(cabinetCanvas)
  cabinetTexture.colorSpace=THREE.SRGBColorSpace;cabinetTexture.wrapS=cabinetTexture.wrapT=THREE.RepeatWrapping;cabinetTexture.flipY=false
  const doorTexture = createDoorTexture()
  const desktopTexture = createDesktopTexture()
  const screenMaterial = new THREE.MeshBasicMaterial({ map: desktopTexture, color: '#f2f2f2', toneMapped: false })
  const textureLoader = new THREE.TextureLoader(); textureLoader.setCrossOrigin('anonymous')
  const floorCtx=floorCanvas.getContext('2d'), plankW=128, plankH=512
  floorCtx.fillStyle='#e8d5b2';floorCtx.fillRect(0,0,1024,1024)
  for(let row=-1;row<3;row++) for(let col=-1;col<9;col++) {
    const x=col*plankW+(row%2?plankW/2:0),y=row*plankH
    floorCtx.fillStyle=(row+col)%3===0?'#efdfc2':(row+col)%3===1?'#e8d5b2':'#ecdabb';floorCtx.fillRect(x+2,y+2,plankW-4,plankH-4)
    floorCtx.strokeStyle='rgba(139,112,78,.20)';floorCtx.lineWidth=2;floorCtx.strokeRect(x+1,y+1,plankW-2,plankH-2)
    for(let grain=0;grain<7;grain++){
      const gx=x+18+grain*16, bend=(grain%3-1)*3
      floorCtx.strokeStyle=grain%2?'rgba(255,250,237,.24)':'rgba(164,132,92,.09)';floorCtx.lineWidth=1
      floorCtx.beginPath();floorCtx.moveTo(gx,y+8);floorCtx.bezierCurveTo(gx+bend,y+160,gx-bend,y+340,gx,y+plankH-8);floorCtx.stroke()
    }
  }
  floorTexture.needsUpdate=true
  const cabinetCtx=cabinetCanvas.getContext('2d');cabinetCtx.fillStyle='#ddc69e';cabinetCtx.fillRect(0,0,1024,1024)
  for(let x=0;x<1024;x+=12){cabinetCtx.strokeStyle=x%4?'rgba(255,248,231,.14)':'rgba(145,112,70,.07)';cabinetCtx.lineWidth=1;cabinetCtx.beginPath();cabinetCtx.moveTo(x,0);cabinetCtx.bezierCurveTo(x+2,280,x-3,690,x+1,1024);cabinetCtx.stroke()}
  cabinetTexture.needsUpdate=true

  // One garden photo for both day and night; the shader grades it into dusk and night.
  const panoramaMaterial = createExteriorMaterial({ side: THREE.BackSide, depthWrite: false })
  const windowImageMaterial = createExteriorMaterial({ ...WINDOW_UV, side: THREE.DoubleSide, depthWrite: false })
  const exteriorMaterials = [panoramaMaterial, windowImageMaterial]
  const panorama = new THREE.Mesh(new THREE.SphereGeometry(140, 48, 32), panoramaMaterial)
  panorama.renderOrder = -10; scene.add(panorama)
  const exteriorTexture = panoramaLoader.load('/exterior-campus.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    exteriorMaterials.forEach((material) => { material.uniforms.dayMap.value = texture })
  })

  let model = null, bounds = null, roomBounds = null, walkBounds = null, floorY = 0, desk = null, spots = [], meshColliders = [], ground = null, groundMaterial = null, windowGlassMaterials = [], loadError = false
  let grid = null, computer = null
  // Explorable spots (computer, phone, files, books, speaker) and an optional walk-to tween.
  let hotspots = [], travel = null
  const state = { x: 0, z: 0, yaw: -Math.PI/2, pitch: 0, nearby: false, system: false, hotspot: null }

  const { isFree, nearestFree } = createWalkTester(() => grid, () => walkBounds)

  loader.load(MODEL_URL, (gltf) => {
    model = gltf.scene
    // The supplied FBX uses centimeters; scale it to meters before positioning it.
    model.scale.setScalar(.01)
    model.updateMatrixWorld(true)
    // three.js sanitises node names on load ('room base' → 'room_base', 'Icosphere.001' → 'Icosphere001').
    const find = (name) => model.getObjectByName(name) || model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name))
    const source = new THREE.Box3().setFromObject(model), center = source.getCenter(new THREE.Vector3())
    model.position.set(-center.x,-source.min.y,-center.z); model.updateMatrixWorld(true)
    bounds = new THREE.Box3().setFromObject(model)
    const roomBase = find('room base')
    roomBounds = roomBase ? new THREE.Box3().setFromObject(roomBase) : bounds.clone()
    floorY = roomBounds.min.y
    walkBounds = roomBounds.clone()
    // Hard limit just inside the walls; the collision grid handles the rest.
    const wallInset = .12
    walkBounds.min.x += wallInset; walkBounds.max.x -= wallInset
    walkBounds.min.z += wallInset; walkBounds.max.z -= wallInset
    const width = roomBounds.max.x-roomBounds.min.x, depth = roomBounds.max.z-roomBounds.min.z
    const spotInset = Math.min(.38, width*.16, depth*.10)
    const spotMinX = roomBounds.min.x+spotInset, spotMaxZ = roomBounds.max.z-spotInset
    const spotWidth = width-spotInset*2, spotDepth = depth-spotInset*2
    spots = SPOT_RATIOS.map((p) => ({ x: spotMinX+spotWidth*p.x, z: spotMaxZ-spotDepth*p.z }))
    desk = spots[3]
    model.traverse((object) => {
      if (!object.isMesh) return
      // Everything casts shadows: small parts like the ceiling downlights fill holes in the
      // ceiling, and without them sunlight leaked through as bright blobs on the far wall.
      object.castShadow=true; object.receiveShadow = true; meshColliders.push(object)
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      // Blender boolean cutters (CTRL_Hole…, CTRL_Baseboard…) were exported as white slabs; one of
      // them stood in front of the door and hid it. They are not meant to be seen.
      if (materials.some((m) => m?.name === 'hidden_material')) { object.visible = false; return }
      for (const material of materials) if (material) {
        const name=(material.name||'').toLowerCase()
        material.side = THREE.DoubleSide
        material.normalMap=null;material.bumpMap=null;material.roughnessMap=null;material.metalnessMap=null
        if (object.name.toLowerCase()==='window' && name==='glass') { windowGlassMaterials.push(material); material.roughness=.12; material.metalness=.08 }
        if (name === 'white wall') {
          material.map=wallTexture; material.color.set('#f7f1e9'); material.roughness=.88
        } else if (name === 'wod floring') {
          material.map=floorTexture; material.color.set('#fffefa'); material.roughness=.5 // a little sheen so sunlight reflects
        } else if (name === 'handle_material') {
          material.color.set('#b8b4ac'); material.metalness=.75; material.roughness=.32
        } else if (name.includes('door')) {
          material.map=cabinetTexture;material.color.set('#eee0c7');material.roughness=.74
        } else if (name === 'plywood' || name === 'plywood 1' || name === 'plywood 2') {
          material.map=cabinetTexture; material.color.set('#fff8eb'); material.roughness=.68
        } else if (name === 'glass') {               // iMac front glass (and window pane): clear, not milky
          material.transparent=true; material.opacity=.1; material.color.set('#ffffff'); material.roughness=.05; material.metalness=0
          material.transmission=0; material.thickness=0; material.depthWrite=false
        } else if (name === 'aluminium' || name === 'matt white plastic') { // iMac chin, back and stand: silver aluminium
          material.map=null; material.color.set('#dcdee1'); material.metalness=.18; material.roughness=.38
        } else if (name === 'display frame' || name === 'glass frame') { // iMac bezel: black glass
          material.color.set('#0a0a0b'); material.roughness=.35
        } else if (material.name === 'metal.001') {   // iMac Apple logo (the lamp's 'Metal.001' is left alone)
          material.color.set('#1d1d1f'); material.metalness=.2; material.roughness=.35
        } else if (name === 'material.002' || name === 'material.003') { // coffee mug: red glazed ceramic
          material.color.set('#c0161d'); material.roughness=.26; material.metalness=0
        } else if (name === 'material.001') {        // coffee in the mug
          material.color.set('#3b200f'); material.roughness=.12; material.metalness=0
        } else if (name === 'material.004') {        // glass over the standing photo: clear, so the picture shows
          material.transparent=true; material.opacity=.08; material.depthWrite=false; material.color.set('#ffffff'); material.roughness=.05; material.transmission=0
        } else if (name === 'frame') {               // standing photo frame on the cabinet: black border
          material.map=null; material.color.set('#111113'); material.roughness=.42; material.metalness=.1
        } else if (name === 'photo (big)') {         // wall photo: the beach picture is swapped in below
          material.color.set('#ffffff'); material.roughness=.4
        } else if (name === 'cushion') {
          material.color.set('#d5c1aa')
        } else if (name === 'pillow 1') {          // larger cushion: warm grey linen
          material.color.set('#a9a69f'); material.roughness=.92
        } else if (name === 'pillow 2') {          // smaller cushion: bright yellow
          material.color.set('#f4e01e'); material.roughness=.9
        } else if (/^material__6\d\d$/.test(name)) { // printed book covers → plain solid colours
          material.map=null; material.color.set(BOOK_COLORS[Number(name.slice(-3))%BOOK_COLORS.length]); material.roughness=.78
        }
        material.needsUpdate = true
      }
    })
    // iMac screen: a lit desktop (wallpaper, menu bar, dock) instead of a black panel.
    model.traverse((o) => { if (o.isMesh && o.material?.name === 'display') o.material = screenMaterial })
    // Book and magazine page edges: the model uses a streaky stock photo of paper; plain paper white reads cleaner
    const pageMaterial = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: .92, metalness: 0 })
    model.traverse((o) => { if (o.isMesh && o.material?.name === 'Material__41') { o.material.dispose(); o.material = pageMaterial } })
    // Wall photo: a beach scene. If the photo can't load, the original print stays.
    textureLoader.load(BEACH_PHOTO_URL, (beach) => {
      beach.colorSpace = THREE.SRGBColorSpace; beach.flipY = false; beach.anisotropy = 8
      beach.center.set(.5, .5); beach.rotation = -Math.PI / 2 // the print's UVs run sideways
      model.traverse((o) => { if (o.isMesh && o.material?.name === 'photo (big)') { o.material.map = beach; o.material.needsUpdate = true } })
    })
    // Standing photo frame on the cabinet: my photo. The print's UVs cover only part of the
    // texture square, so the picture is stretched onto exactly that patch.
    textureLoader.load('/photo-frame.jpg', (photo) => {
      photo.colorSpace = THREE.SRGBColorSpace; photo.flipY = false; photo.anisotropy = 8
      const u0 = .214, u1 = .799, v0 = .153, v1 = .843
      photo.repeat.set(1 / (u1 - u0), 1 / (v1 - v0)); photo.offset.set(-u0 / (u1 - u0), -v0 / (v1 - v0))
      model.traverse((o) => { if (o.isMesh && o.material?.name === 'photos') { o.material.map = photo; o.material.color.set('#ffffff'); o.material.roughness = .45
        // the print sits exactly on the mount board's face; nudge it forward so it isn't hidden behind it
        o.material.polygonOffset = true; o.material.polygonOffsetFactor = -2; o.material.polygonOffsetUnits = -4; o.material.needsUpdate = true } })
    })
    // The door and its frame come without UVs, so textures could not show. Give them
    // flat UVs and their own materials: oak veneer door, painted frame.
    const doorMesh = find('Door'), doorFrame = find('DoorFrame')
    if (doorMesh?.isMesh) {
      addPlanarUVs(doorMesh)
      doorMesh.material = new THREE.MeshStandardMaterial({ map: doorTexture, color: '#ffffff', roughness: .58, side: THREE.DoubleSide })
    }
    if (doorFrame?.isMesh) {
      addPlanarUVs(doorFrame)
      doorFrame.material = new THREE.MeshStandardMaterial({ color: '#efe7da', roughness: .55, side: THREE.DoubleSide })
    }
    const windowNode=find('Window')
    if(windowNode){
      const windowImage=new THREE.Mesh(new THREE.PlaneGeometry(1.24,1.9),windowImageMaterial)
      windowImage.rotation.x=Math.PI/2;windowImage.position.set(0,-.15,1.025);windowImage.renderOrder=10;windowImage.name='garden-window-view';windowNode.add(windowImage)
      // The pillows were modelled leaning back past the glass, so the garden view drew over
      // them. Slide each one into the room until it sits fully in front of the window.
      model.updateMatrixWorld(true)
      const planePoint=windowImage.getWorldPosition(new THREE.Vector3())
      const roomCenter=roomBounds.getCenter(new THREE.Vector3())
      const intoRoom=new THREE.Vector3(roomCenter.x-planePoint.x,0,roomCenter.z-planePoint.z)
      intoRoom.set(Math.abs(intoRoom.x)>Math.abs(intoRoom.z)?Math.sign(intoRoom.x):0,0,Math.abs(intoRoom.z)>=Math.abs(intoRoom.x)?Math.sign(intoRoom.z):0)
      for(const pillowName of ['pillow','pillow.001']){
        const pillow=find(pillowName); if(!pillow) continue
        const box=new THREE.Box3().setFromObject(pillow)
        const back=intoRoom.z? (intoRoom.z>0?box.min.z:box.max.z) : (intoRoom.x>0?box.min.x:box.max.x)
        const planeCoord=intoRoom.z?planePoint.z:planePoint.x
        const gap=(back-planeCoord)*(intoRoom.z||intoRoom.x), clearance=.06
        if(gap<clearance){
          const world=pillow.getWorldPosition(new THREE.Vector3()).addScaledVector(intoRoom,clearance-gap)
          pillow.position.copy(pillow.parent.worldToLocal(world)); pillow.updateMatrixWorld(true)
        }
      }
      const trimMaterial=new THREE.MeshStandardMaterial({color:'#3f403e',roughness:.48,metalness:.08})
      const trimDepth=.075,trim=.065,windowW=1.24,windowH=1.9,bottom=.075,top=1.975,mid=1.06,frontY=-.163
      const rails=[[-windowW/2-trim/2,(top+bottom)/2,trim,top-bottom+trim*2],[windowW/2+trim/2,(top+bottom)/2,trim,top-bottom+trim*2],[0,bottom-trim/2,windowW,trim],[0,top+trim/2,windowW,trim],[0,mid,windowW,trim*.8]]
      for(const [x,z,w,h] of rails){const rail=new THREE.Mesh(new THREE.BoxGeometry(w,trimDepth,h),trimMaterial);rail.position.set(x,frontY,z);rail.castShadow=true;rail.renderOrder=11;windowNode.add(rail)}
      const glassTint=new THREE.Mesh(new THREE.PlaneGeometry(windowW,windowH),new THREE.MeshBasicMaterial({color:'#dceaf0',transparent:true,opacity:.12,side:THREE.DoubleSide,depthTest:true,depthWrite:false}))
      glassTint.rotation.x=Math.PI/2;glassTint.position.set(0,-.158,1.025);glassTint.renderOrder=12;windowNode.add(glassTint)
      const sill=new THREE.Mesh(new THREE.BoxGeometry(windowW+.18,.18,.095),new THREE.MeshStandardMaterial({color:'#e4d4bb',roughness:.65}));sill.position.set(0,-.14,bottom-.08);sill.castShadow=true;windowNode.add(sill)
    }
    const groundTexture = panoramaLoader.load('/ground-grass.png')
    groundTexture.colorSpace=THREE.SRGBColorSpace; groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping
    groundTexture.repeat.set(Math.ceil((width+420)/7),Math.ceil((depth+420)/7))
    groundMaterial = new THREE.MeshStandardMaterial({ map:groundTexture,roughness:1,color:'#d4d7c4' })
    ground = new THREE.Mesh(new THREE.PlaneGeometry(width+420,depth+420),groundMaterial)
    ground.rotation.x=-Math.PI/2; ground.position.set((roomBounds.min.x+roomBounds.max.x)/2,floorY-.045,(roomBounds.min.z+roomBounds.max.z)/2)
    ground.receiveShadow=true; scene.add(ground)
    const floorOverlayMaterial=new THREE.MeshStandardMaterial({map:floorTexture,color:'#fffefa',roughness:.74})
    const floorOverlay=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),floorOverlayMaterial)
    // Kept out of the scene: the floor mesh already carries this texture, and now that the
    // floor height is found correctly this plane would sit 3.5 cm above it.
    floorOverlay.rotation.x=-Math.PI/2;floorOverlay.position.set((roomBounds.min.x+roomBounds.max.x)/2,floorY+.035,(roomBounds.min.z+roomBounds.max.z)/2);floorOverlay.receiveShadow=true;floorOverlay.name='light-oak-floor-overlay'
    scene.add(model)
    model.updateMatrixWorld(true)
    const ceilingY = roomBounds.max.y-.24
    // Daylight bounce: soft, fixture-less fill so the far (door) end of the room isn't dark
    // by day. These fade out completely at night.
    for (const ratio of [.45, .85]) {
      const bounce = new THREE.PointLight('#fff5e8', 0, 7, 1.1)
      bounce.position.set((roomBounds.min.x+roomBounds.max.x)/2, ceilingY-.2, roomBounds.min.z+depth*ratio); scene.add(bounce)
      dayFillLights.push({ light: bounce, max: ratio > .6 ? 2.2 : 1.4 })
    }

    // ---- Night lighting ------------------------------------------------------
    const worldPos = (object) => object.getWorldPosition(new THREE.Vector3())
    // Desk lamp: always on. The bulb glows, a soft point light warms the wall and a
    // spotlight throws a pool of light onto the desk below the shade.
    const filament = find('filament'), lampBase = find('base')
    const deskTopY = lampBase ? new THREE.Box3().setFromObject(lampBase).min.y : floorY + .77
    if (filament) {
      const bulb = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffcf87', emissiveIntensity: 3, roughness: .3 })
      filament.traverse((o) => { if (o.isMesh) o.material = bulb })
      const p = worldPos(filament)
      const lamp = new THREE.PointLight('#ffc983', 0, 3, 1.7); lamp.position.copy(p).add(new THREE.Vector3(0, -.06, 0)); scene.add(lamp)
      alwaysOnLights.push({ light: lamp, day: 1.1, night: 1.8 })
      const pool = new THREE.SpotLight('#ffcb88', 0, 2.2, .75, .7, 1.6); pool.position.copy(p).add(new THREE.Vector3(0, -.04, 0))
      pool.target.position.set(p.x, deskTopY, p.z); scene.add(pool); scene.add(pool.target)
      alwaysOnLights.push({ light: pool, day: 4, night: 3 })
    }
    // A phone lying beside the lamp base, on the chair side of the desk.
    if (lampBase) {
      const b = new THREE.Box3().setFromObject(lampBase), phone = createPhone()
      const roomMidX = (roomBounds.min.x + roomBounds.max.x) / 2, towardChair = Math.sign(roomMidX - b.getCenter(new THREE.Vector3()).x) || -1
      const lampCenter = b.getCenter(new THREE.Vector3())
      phone.position.set(lampCenter.x + towardChair * ((b.max.x - b.min.x) / 2 + .1), b.min.y + .001, lampCenter.z - .06)
      phone.rotation.y = towardChair * Math.PI / 2 + .12 // top of the phone points away from whoever stands at the desk
      scene.add(phone)
    }
    // A fabric speaker on the low cabinet, next to the vase of white roses.
    const roses = find('white rose'), cabinet = find('Cube.009')
    if (roses && cabinet) {
      const rb = new THREE.Box3().setFromObject(roses), cb = new THREE.Box3().setFromObject(cabinet), speaker = createSpeaker()
      const cabinetMidX = (cb.min.x + cb.max.x) / 2
      speaker.position.set(cabinetMidX, cb.max.y, rb.min.z - .14); speaker.rotation.y = .4
      scene.add(speaker)
    }
    // Ceiling lights: the model's two round downlights are swapped for black linear pendants
    // hung from the ceiling, at the same spots.
    const ceilingHit = new THREE.Raycaster(new THREE.Vector3(roomBounds.getCenter(new THREE.Vector3()).x, floorY + 1.5, roomBounds.getCenter(new THREE.Vector3()).z), new THREE.Vector3(0, 1, 0))
      .intersectObject(roomBase || model, true)[0]
    const ceilingSurfaceY = ceilingHit ? ceilingHit.point.y : floorY + 2.6
    for (const [bulbName, housings] of [['Icosphere', ['Cylinder', 'Cylinder.001']], ['Icosphere.001', ['Cylinder.002', 'Cylinder.003']]]) {
      const bulb = find(bulbName)
      if (!bulb) continue
      const p = worldPos(bulb)
      for (const n of [bulbName, ...housings]) { const o = find(n); if (o) o.visible = false }
      const { group, glow } = createPendant(1.0, .42)
      group.position.set(p.x, ceilingSurfaceY, p.z); scene.add(group)
      const lamp = new THREE.PointLight('#ffe2b4', 0, 6, 1.4); lamp.position.set(p.x, ceilingSurfaceY - .5, p.z); scene.add(lamp)
      nightLights.push({ light: lamp, max: 2.4, glow, glowMax: 2.4 })
    }
    // Low LED glow under the window seat.
    if (windowNode) {
      const windowBox = new THREE.Box3().setFromObject(windowNode), c = windowBox.getCenter(new THREE.Vector3())
      const roomMid = new THREE.Vector3((roomBounds.min.x+roomBounds.max.x)/2, 0, (roomBounds.min.z+roomBounds.max.z)/2)
      const inward = new THREE.Vector3(roomMid.x-c.x, 0, roomMid.z-c.z).normalize()
      const stripMat = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffcf8f', emissiveIntensity: 0 })
      const strip = new THREE.Mesh(new THREE.BoxGeometry(Math.max(windowBox.max.x-windowBox.min.x, windowBox.max.z-windowBox.min.z)*.9, .015, .02), stripMat)
      strip.position.set(c.x+inward.x*.62, floorY+.47, c.z+inward.z*.62); strip.rotation.y = Math.atan2(inward.x, inward.z); scene.add(strip)
      nightLights.push({ light: null, max: 0, glow: stripMat, glowMax: 2.2 })
      // Night light on the front of the window-seat base: a small brass-framed panel that is
      // visible (switched off) by day and at night throws a warm pool across the floor.
      // find the seat base's front face: cast from just in front of it (past the chair) toward the window
      const probe = new THREE.Vector3(c.x + inward.x * 1.15, floorY + .24, c.z + inward.z * 1.15)
      const faceHit = new THREE.Raycaster(probe, inward.clone().negate(), 0, 1.2).intersectObject(model, true).find((h) => h.object.visible)
      if (faceHit) {
        const { group: nightLamp, glow: nightGlow, lightPoint } = createNightLight()
        nightLamp.position.set(faceHit.point.x + inward.x * .002, floorY + .24, faceHit.point.z + inward.z * .002)
        nightLamp.position.addScaledVector(new THREE.Vector3(inward.z, 0, -inward.x), -.32) // off-centre, on the walkway side away from the chair
        nightLamp.rotation.y = Math.atan2(inward.x, inward.z); scene.add(nightLamp); nightLamp.updateMatrixWorld(true)
        const origin = nightLamp.localToWorld(lightPoint.clone())
        const pool = new THREE.SpotLight('#ffc983', 0, 2.6, .9, .85, 1.6); pool.position.copy(origin)
        pool.target.position.set(origin.x + inward.x * 1.1, floorY, origin.z + inward.z * 1.1); scene.add(pool); scene.add(pool.target)
        nightLights.push({ light: pool, max: 3.2, glow: nightGlow, glowMax: 2.6 })
        const halo = new THREE.PointLight('#ffcf8f', 0, .7, 2); halo.position.copy(origin).addScaledVector(inward, .03); scene.add(halo)
        nightLights.push({ light: halo, max: .35 })
      }
    }
    // Picture light above the beach photo: bar lamp on the wall, washing the print at night.
    const print = find('Cube.030')
    if (print) {
      const pb = new THREE.Box3().setFromObject(print), pc = pb.getCenter(new THREE.Vector3()), size = pb.getSize(new THREE.Vector3())
      const alongX = size.x > size.z, roomMid = roomBounds.getCenter(new THREE.Vector3())
      // wall normal pointing into the room
      const normal = alongX ? new THREE.Vector3(0, 0, Math.sign(roomMid.z - pc.z)) : new THREE.Vector3(Math.sign(roomMid.x - pc.x), 0, 0)
      const wallFace = alongX ? (normal.z > 0 ? pb.max.z : pb.min.z) : (normal.x > 0 ? pb.max.x : pb.min.x)
      const { group, glow, lightPoint } = createPictureLight(Math.max(size.x, size.z) * .9)
      group.position.set(alongX ? pc.x : wallFace, pb.max.y + .1, alongX ? wallFace : pc.z)
      group.rotation.y = Math.atan2(normal.x, normal.z); scene.add(group)
      group.updateMatrixWorld(true)
      const wash = new THREE.SpotLight('#ffd49c', 0, 2.4, .62, .75, 1.5)
      wash.position.copy(group.localToWorld(lightPoint.clone()))
      wash.target.position.copy(pc).addScaledVector(normal, .02); scene.add(wash); scene.add(wash.target)
      nightLights.push({ light: wash, max: 5, glow, glowMax: 3.2 })
      const halo = new THREE.PointLight('#ffd49c', 0, 1.2, 2); halo.position.copy(wash.position).addScaledVector(normal, .05); scene.add(halo)
      nightLights.push({ light: halo, max: .5 })
      // A tall ficus in the corner to the left of the photo (as you face it), clear of both walls.
      const left = new THREE.Vector3(-normal.z, 0, normal.x) // facing the wall (−normal), this points left
      const ficus = createFloorPlant()
      const along = alongX ? (left.x > 0 ? roomBounds.max.x : roomBounds.min.x) : (left.z > 0 ? roomBounds.max.z : roomBounds.min.z)
      const fx = alongX ? along - Math.sign(left.x) * .34 : wallFace + normal.x * .32
      const fz = alongX ? wallFace + normal.z * .32 : along - Math.sign(left.z) * .34
      ficus.position.set(fx, floorY, fz); ficus.rotation.y = .8; scene.add(ficus)
      ficus.updateMatrixWorld(true)
      const pot = ficus.getObjectByName('ficus-pot'); if (pot) meshColliders.push(pot) // can't walk through it
    }
    // LED mood strips under both wall shelves, washing the wall below with warm light.
    RectAreaLightUniformsLib.init()
    for (const shelfName of ['Cube.027', 'Cube.028']) {
      const shelf = find(shelfName); if (!shelf) continue
      const sb = new THREE.Box3().setFromObject(shelf), sc = sb.getCenter(new THREE.Vector3()), size = sb.getSize(new THREE.Vector3())
      const alongZ = size.z > size.x, length = (alongZ ? size.z : size.x) * .97
      const roomMid = roomBounds.getCenter(new THREE.Vector3())
      // the shelf's front edge is the side facing the room
      const front = alongZ ? (roomMid.x > sc.x ? sb.max.x : sb.min.x) : (roomMid.z > sc.z ? sb.max.z : sb.min.z)
      const back = alongZ ? (roomMid.x > sc.x ? sb.min.x : sb.max.x) : (roomMid.z > sc.z ? sb.min.z : sb.max.z)
      const { strip, glow } = createLedStrip(length)
      const inset = (front - back) * .1
      strip.position.set(alongZ ? front - inset : sc.x, sb.min.y - .003, alongZ ? sc.z : front - inset)
      if (!alongZ) strip.rotation.y = Math.PI / 2
      scene.add(strip)
      const holder = new THREE.Group(); holder.position.set(alongZ ? (front + back) / 2 : sc.x, sb.min.y - .006, alongZ ? sc.z : (front + back) / 2)
      if (alongZ) holder.rotation.y = Math.PI / 2
      const area = new THREE.RectAreaLight('#ffd29a', 0, length, Math.abs(front - back) * .8)
      area.rotation.x = -Math.PI / 2; holder.add(area); scene.add(holder)
      moodLights.push({ light: area, max: 7, glow, glowMax: 2.6 })
    }
    // Fill both wall shelves with books and box files, around what's already on them
    // (storage boxes, book stacks, magazines) and stopping at the window wall.
    {
      const shelves = ['Cube.027', 'Cube.028'].map(find).filter(Boolean).map((o) => ({ o, box: new THREE.Box3().setFromObject(o) })).sort((p, q) => p.box.min.y - q.box.min.y)
      const windowWall = find('room 1'), wallBox = windowWall ? new THREE.Box3().setFromObject(windowWall) : null
      const roomMid = roomBounds.getCenter(new THREE.Vector3()), tmp = new THREE.Box3()
      shelves.forEach(({ o, box }, idx) => {
        const size = box.getSize(new THREE.Vector3()), alongZ = size.z > size.x
        const lo = alongZ ? box.min.z : box.min.x, hi = alongZ ? box.max.z : box.max.x
        const towardRoom = alongZ ? roomMid.x > box.getCenter(new THREE.Vector3()).x : roomMid.z > box.getCenter(new THREE.Vector3()).z
        const back = alongZ ? (towardRoom ? box.min.x : box.max.x) : (towardRoom ? box.min.z : box.max.z)
        const front = alongZ ? (towardRoom ? box.max.x : box.min.x) : (towardRoom ? box.max.z : box.min.z)
        let from = lo, to = hi
        // don't run into the thick window wall
        if (wallBox && alongZ) { if (wallBox.max.z > from && wallBox.max.z < to && wallBox.getCenter(new THREE.Vector3()).z < box.getCenter(new THREE.Vector3()).z) from = wallBox.max.z + .02 }
        const occupied = []
        model.traverse((m) => {
          if (!m.isMesh || !m.visible || m === o) return
          tmp.setFromObject(m)
          const onTop = tmp.min.y > box.max.y - .03 && tmp.min.y < box.max.y + .06 && tmp.max.y - tmp.min.y < .6
          const overlaps = alongZ ? (tmp.max.x > box.min.x && tmp.min.x < box.max.x && tmp.max.z > lo && tmp.min.z < hi)
                                  : (tmp.max.z > box.min.z && tmp.min.z < box.max.z && tmp.max.x > lo && tmp.min.x < hi)
          if (onTop && overlaps) occupied.push(alongZ ? [tmp.min.z - .03, tmp.max.z + .03] : [tmp.min.x - .03, tmp.max.x + .03])
        })
        const above = shelves[idx + 1]
        const maxHeight = above ? Math.min(.36, above.box.min.y - box.max.y - .03) : .33
        scene.add(createShelfContents({ top: box.max.y, back, front, from, to, alongZ, maxHeight, occupied, seed: idx + 3 }))
      })
    }
    // Replace the protea arrangement on the desk with a bonsai in a shallow glazed pot.
    const vase = find('Clay_Vase_01')
    if (vase) {
      const vb = new THREE.Box3().setFromObject(vase), vc = vb.getCenter(new THREE.Vector3())
      for (const n of ['Clay_Vase_01', 'Protea_1', 'Protea_002', 'BabyBreaths_01a', 'BabyBreaths_01a.001', 'BabyBreaths_01b', 'Gum_branch_01', 'Gum_branch_02']) { const o = find(n); if (o) o.visible = false }
      const bonsai = createBonsai()
      bonsai.position.set(vc.x, vb.min.y, vc.z); bonsai.rotation.y = Math.PI / 2 + .3
      scene.add(bonsai)
    }
    // Replace the vase of white roses with a potted pothos on a wooden tray.
    if (roses && cabinet) {
      const rb = new THREE.Box3().setFromObject(roses), cb = new THREE.Box3().setFromObject(cabinet)
      roses.visible = false
      const plant = createPlant()
      plant.position.set((cb.min.x + cb.max.x) / 2, cb.max.y, (rb.min.z + rb.max.z) / 2); plant.rotation.y = .5
      scene.add(plant)
    }

    // Light switch beside the door: charcoal plate, black rockers.
    for (const [n, color] of [['Cube.018', '#3b3d41'], ['Cube.023', '#17181a'], ['Cube.024', '#17181a']]) {
      const o = find(n); if (!o) continue
      o.material = o.material.clone(); o.material.color.set(color); o.material.roughness = .5; o.material.map = null; o.material.needsUpdate = true
    }
    // Cabinet top by the photo frame: an open book, a model airliner, and a camera where the
    // single green book used to lie.
    let cameraSpot = null
    {
      const stack = find('Line023'), single = find('Line040.001')
      if (stack) {
        const sb = new THREE.Box3().setFromObject(stack), cab = find('Cube.008')
        const top = cab ? new THREE.Box3().setFromObject(cab).max.y : sb.min.y // cabinet top (the stack's own base sits higher)
        const sc = sb.getCenter(new THREE.Vector3())
        // the cabinet runs along Z against the wall at −X (or the mirror of that)
        const intoRoom = Math.sign(roomBounds.getCenter(new THREE.Vector3()).x - sc.x) || 1
        const book = createOpenBook()
        book.position.set(sc.x + intoRoom * .03, top, sb.max.z + .19)
        book.rotation.y = intoRoom > 0 ? Math.PI / 2 : -Math.PI / 2 // top of the pages toward the wall
        scene.add(book); meshColliders.push(book.children[0])
        const plane = createModelAirplane()
        plane.position.set(sc.x - intoRoom * .02, top, sb.max.z + .5); plane.rotation.y = intoRoom > 0 ? Math.PI / 2 - .5 : -Math.PI / 2 + .5
        scene.add(plane)
      }
      if (single) {
        const gb = new THREE.Box3().setFromObject(single), gc = gb.getCenter(new THREE.Vector3())
        for (const n of ['Line040.001', 'Object038.001']) { const o = find(n); if (o) o.visible = false }
        cameraSpot = new THREE.Vector3(gc.x, gb.min.y, gc.z)
        // a compact black digital camera, lens pointing straight out at whoever is looking
        const camModel = createDigitalCamera()
        camModel.position.copy(cameraSpot)
        camModel.rotation.y = Math.sign(roomBounds.getCenter(new THREE.Vector3()).x - cameraSpot.x) >= 0 ? Math.PI / 2 : -Math.PI / 2
        scene.add(camModel)
      }
      // table lamp in the corner at the window end of this cabinet
      const top = find('Cube.008')
      if (top) {
        const tb = new THREE.Box3().setFromObject(top)
        const wallX = Math.abs(tb.min.x - roomBounds.min.x) < Math.abs(tb.max.x - roomBounds.max.x) ? tb.min.x + .13 : tb.max.x - .13
        const towardEnd = Math.abs(tb.min.z - roomBounds.min.z) < Math.abs(tb.max.z - roomBounds.max.z) ? -1 : 1
        // the cabinet runs into the wall, so find where the wall actually is above the top
        const probe = new THREE.Raycaster(new THREE.Vector3((tb.min.x + tb.max.x) / 2, tb.max.y + .15, cameraSpot ? cameraSpot.z : (tb.min.z + tb.max.z) / 2), new THREE.Vector3(0, 0, towardEnd), 0, 6)
        const wallHit = probe.intersectObject(model, true).find((h) => h.object.visible)
        const endZ = (wallHit ? wallHit.point.z : (towardEnd < 0 ? tb.min.z : tb.max.z)) - towardEnd * .14
        // a desk globe in the corner, Africa / the Indian Ocean turned toward the room
        const globe = createGlobe()
        globe.position.set(wallX + (wallX < (tb.min.x + tb.max.x) / 2 ? .01 : -.01), tb.max.y, endZ - towardEnd * .01)
        globe.rotation.y = wallX < (tb.min.x + tb.max.x) / 2 ? Math.PI / 2 : -Math.PI / 2 // axis leans sideways as seen from the room
        const ball = globe.getObjectByName('globe-ball'); if (ball) ball.rotation.y = -Math.PI / 2
        scene.add(globe)
        // a few instant prints scattered between the camera and the lamp
        if (cameraSpot) {
          const intoRoom = Math.sign(roomBounds.getCenter(new THREE.Vector3()).x - cameraSpot.x) || 1
          const face = intoRoom > 0 ? Math.PI / 2 : -Math.PI / 2 // bottom margin toward the room
          ;[[.13, .015, .25], [.2, -.03, -.35], [.165, .045, .05]].forEach(([dz, dx, rot], i) => {
            const p = createPolaroid(i)
            p.position.set(cameraSpot.x + intoRoom * dx, cameraSpot.y + .0004 + i * .0011, cameraSpot.z + towardEnd * dz)
            p.rotation.y = face + rot
            scene.add(p)
          })
        }
      }
    }
    grid = buildCollisionGrid(meshColliders, roomBounds, floorY)
    const imac = find('Apple iMac 27 - display')
    if (imac) { const p = imac.getWorldPosition(new THREE.Vector3()); computer = { x: p.x, z: p.z } }
    // Achievements: framed certificates on the wall above the iMac
    let achievementsWall = null
    if (imac) {
      const ib = new THREE.Box3().setFromObject(imac), ic = ib.getCenter(new THREE.Vector3())
      const toWall = new THREE.Vector3(ic.x - roomBounds.getCenter(new THREE.Vector3()).x, 0, 0).normalize()
      const probe = new THREE.Raycaster(new THREE.Vector3(ic.x, ib.max.y + .3, ic.z), toWall, 0, 2)
      const hit = probe.intersectObject(model, true).find((h) => h.object.visible)
      if (hit) {
        const wall = createCertificateWall({ certs: ACHIEVEMENTS })
        const n = toWall.clone().negate()
        wall.position.set(hit.point.x + n.x * .004, ib.max.y + .1 + wall.userData.size.h / 2 + .06, ic.z)
        wall.lookAt(wall.position.clone().add(n))
        scene.add(wall); achievementsWall = wall
        // a picture light over the cluster, like the one above the beach print
        const { group: pl, glow: plGlow, lightPoint: plPoint } = createPictureLight(.95)
        pl.quaternion.copy(wall.quaternion); pl.position.copy(wall.position).add(new THREE.Vector3(0, wall.userData.size.h / 2 + .09, 0))
        scene.add(pl); pl.updateMatrixWorld(true)
        const wash = new THREE.SpotLight('#ffd49c', 0, 2.4, .75, .75, 1.5)
        wash.position.copy(pl.localToWorld(plPoint.clone()))
        wash.target.position.copy(wall.position).addScaledVector(n, .02); scene.add(wash); scene.add(wash.target)
        nightLights.push({ light: wash, max: 5, glow: plGlow, glowMax: 3.2 })
        const halo = new THREE.PointLight('#ffd49c', 0, 1.2, 2); halo.position.copy(wash.position).addScaledVector(n, .05); scene.add(halo)
        nightLights.push({ light: halo, max: .5 })
      }
    }
    // Explorable spots: what each object opens, and where to stand to use it.
    {
      const centerX=(walkBounds.min.x+walkBounds.max.x)/2
      const at=(obj)=>obj?new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()):null
      // The files: a run of box files on the shelves, away from the speaker and the book stack.
      const filesSpot=()=>{
        const files=[]; scene.traverse((m)=>{ if(m.name==='box-file') files.push(m.getWorldPosition(new THREE.Vector3())) })
        if(!files.length) return null
        const avoid=[at(scene.getObjectByName('cabinet-speaker')),at(find('Line023'))].filter(Boolean)
        const score=(p)=>avoid.reduce((sum,a)=>sum+Math.min(1.5,Math.hypot(p.x-a.x,p.z-a.z)),0)-p.y*.4
        const best=files.reduce((a,b)=>score(b)>score(a)?b:a)
        const run=files.filter((p)=>Math.abs(p.y-best.y)<.05&&p.distanceTo(best)<.45)
        return run.reduce((s,p)=>s.add(p),new THREE.Vector3()).divideScalar(run.length)
      }
      const spots=[
        // obj / reach: what a tap has to land on (the object itself, or within reach of the spot)
        { id:'projects', app:'projects', label:'Computer', pos:at(imac), vertical:true, obj:imac, reach:.42 },
        { id:'achievements', app:'achievements', label:'Achievements', pos:achievementsWall?achievementsWall.position.clone():null, vertical:true, viewFrom:imac?at(imac):null, obj:achievementsWall, reach:.75 },
        { id:'contact', app:'contact', label:'Phone', pos:at(scene.getObjectByName('desk-phone')), obj:scene.getObjectByName('desk-phone'), reach:.14 },
        { id:'resume', app:'resume', label:'Files', pos:filesSpot(), reach:.5 },
        { id:'photos', app:'photos', label:'Camera', pos:cameraSpot ? cameraSpot.clone().add(new THREE.Vector3(0,.04,0)) : null, obj:scene.getObjectByName('desk-camera'), reach:.14 },
        { id:'about', app:'about', label:'Books', pos:at(scene.getObjectByName('open-book')) || at(find('Line023')), obj:scene.getObjectByName('open-book'), reach:.2 },
        { id:'music', app:'music', label:'Speaker', pos:at(scene.getObjectByName('cabinet-speaker')), obj:scene.getObjectByName('cabinet-speaker'), reach:.14 },
      ]
      hotspots=spots.filter((h)=>h.pos).map((h)=>{
        // stand in the walkway about an arm's length back from the object, facing it
        const base=h.viewFrom||h.pos
        const v=nearestFree(base.x+THREE.MathUtils.clamp(centerX-base.x,-1.15,1.15),base.z+.15)
        return {...h,view:v}
      })
    }
    // Opening view: stand at the door end of the room, centred, looking straight down the
    // room toward the window (shelves on the left, desk on the right).
    const windowAt = find('Window') ? new THREE.Box3().setFromObject(find('Window')).getCenter(new THREE.Vector3()) : new THREE.Vector3(spots[3].x, 0, spots[3].z)
    const farEnd = Math.abs(walkBounds.max.z - windowAt.z) > Math.abs(walkBounds.min.z - windowAt.z) ? walkBounds.max.z - .2 : walkBounds.min.z + .2
    const start = nearestFree((roomBounds.min.x + roomBounds.max.x) / 2, farEnd)
    state.x=start.x;state.z=start.z
    state.yaw=Math.atan2(-(windowAt.x-state.x),-(windowAt.z-state.z));state.pitch=0
    if(windowNode){
      const windowBox=new THREE.Box3().setFromObject(windowNode),windowCenter=windowBox.getCenter(new THREE.Vector3())
      const inward=new THREE.Vector3(state.x-windowCenter.x,0,state.z-windowCenter.z).normalize()
      if(inward.lengthSq()<.01)inward.set(0,0,1)
      // Aim the sun through the middle of the window, slightly from the side, at ~37° elevation.
      const side=new THREE.Vector3(inward.z,0,-inward.x), sunDir=inward.clone().addScaledVector(side,.22).add(new THREE.Vector3(0,-.62,0)).normalize()
      sun.position.copy(windowCenter).addScaledVector(sunDir,-9)
      sun.target.position.copy(windowCenter).addScaledVector(sunDir,4);scene.add(sun.target)
      const sc=sun.shadow.camera; sc.left=-4.5; sc.right=4.5; sc.top=4.5; sc.bottom=-4.5; sc.near=1; sc.far=22; sc.updateProjectionMatrix()
      // Glass and the garden backdrop must not block the sun.
      windowNode.traverse((o)=>{ if(o.isMesh&&o.name!==''&&!o.geometry?.type?.startsWith('Box')) o.castShadow=false })
      const backdrop=find('background'); if(backdrop) backdrop.traverse((o)=>{ if(o.isMesh) o.castShadow=false })
      windowSun=new THREE.PointLight('#fff1d6',2.1,7,1.3);windowSun.position.set(windowCenter.x+inward.x*.45,windowCenter.y+.2,windowCenter.z+inward.z*.45);scene.add(windowSun)
    }
    handlers.onPosition?.({ x:state.x,z:state.z,minX:walkBounds.min.x,maxX:walkBounds.max.x,minZ:walkBounds.min.z,maxZ:walkBounds.max.z })
    handlers.onReady?.(); if (import.meta.env.DEV && !disposed) window.__dbg = { scene, camera, state, THREE }
  }, (xhr) => { if (xhr.total) handlers.onProgress?.(xhr.loaded / xhr.total, xhr.loaded, xhr.total) }, (error) => { console.error('Unable to load the home-office model.',error); loadError=true; handlers.onReady?.() })

  // Phone close-up: the camera glides down to look straight onto the phone lying on the desk.
  let focus=null, speakerObj=null, pendantsHidden=false
  const tmpM=new THREE.Matrix4(), tmpV=new THREE.Vector3(), tmpQ=new THREE.Quaternion(), tmpSize=new THREE.Vector2()
  // Close-ups: the camera glides down to look straight onto an object lying on a surface.
  const FOCUS = {
    contact: { name: 'desk-phone', y: PHONE.T, L: PHONE.L, W: PHONE.W, rect: { w: PHONE.displayW, l: PHONE.displayL, y: PHONE.T + .0003, r: PHONE.displayR }, fill: .97 },
    about: { name: 'open-book', y: BOOK.pageY, L: BOOK.L, W: BOOK.W, rect: { w: BOOK.pagesW, l: BOOK.pagesL, y: BOOK.pageY, r: 0 }, fill: .94 },
  }
  // Speaker close-up: a three-quarter view from the room side, the speaker on the left of the screen
  // (laptop) or in the top half (phone) so the song card has the rest.
  const speakerView=()=>{
    const obj=scene.getObjectByName('cabinet-speaker'); if(!obj)return null
    obj.updateWorldMatrix(true,false)
    const H=obj.userData.height||.16, target=new THREE.Vector3(0,H*.55,0).applyMatrix4(obj.matrixWorld)
    const W=canvas.clientWidth, Hh=canvas.clientHeight, aspect=W/Hh, fov=36, t=Math.tan(THREE.MathUtils.degToRad(fov/2))
    const portrait=aspect<1
    const toRoom=roomBounds.getCenter(new THREE.Vector3()).sub(target); toRoom.y=0; toRoom.normalize()
    // distance: the speaker (≈ .2 m tall incl. perspective) fills ≈ 50% of the height, or ≈ 62% of the width on a phone
    const dist=portrait?Math.max(.2/(.4*2*t),.14/(.8*2*t*aspect)):.2/(.7*2*t)
    const pitch=.42 // looking down a little
    const back=toRoom.clone().multiplyScalar(Math.cos(pitch)*dist)
    const pos=target.clone().add(back); pos.y+=Math.sin(pitch)*dist
    tmpM.lookAt(pos,target,new THREE.Vector3(0,1,0))
    const quat=new THREE.Quaternion().setFromRotationMatrix(tmpM)
    const right=new THREE.Vector3(1,0,0).applyQuaternion(quat), up=new THREE.Vector3(0,1,0).applyQuaternion(quat)
    // move the camera so the speaker lands at x≈26% (laptop) or y≈25% from the top (phone)
    if(portrait) pos.addScaledVector(up,-(.5-.24)*2*t*dist)
    else pos.addScaledVector(right,(.5-.26)*2*t*aspect*dist)
    return {pos,quat,fov,id:'music'}
  }
  // phones: how far along the wall the view has been swiped (m from the centre; null = start at the left end)
  let wallPan=null, wallPanMax=0, wallPxPerM=1000
  const wallView=()=>{
    const wall=scene.getObjectByName('achievements-wall'); if(!wall)return null
    wall.updateWorldMatrix(true,false)
    const {w,h}=wall.userData.size, n=new THREE.Vector3(0,0,1).transformDirection(wall.matrixWorld)
    const W=canvas.clientWidth, H=canvas.clientHeight, aspect=W/H, fov=36, t=Math.tan(THREE.MathUtils.degToRad(fov/2))
    const center=wall.getWorldPosition(new THREE.Vector3())
    // never back out through the opposite wall: stay inside the room
    const back=new THREE.Raycaster(center.clone().addScaledVector(n,.05),n,0,10).intersectObject(model,true).find((x)=>x.object.visible)
    const maxDist=back?Math.max(.4,back.distance+.05-.25):2
    if(window.matchMedia?.('(pointer: coarse)').matches&&H>W){
      // upright phone: up close, so the certificates are big enough to tap, and the wall wider than the
      // screen: swipe sideways along it (wallPan, starting at its left end). The two cues sit above.
      const right=new THREE.Vector3(1,0,0).transformDirection(wall.matrixWorld), wUp=new THREE.Vector3(0,1,0).transformDirection(wall.matrixWorld)
      const top=214, bottom=160, usable=(H-top-bottom)/H
      let tt=t, dist=(h*.49)/(tt*usable)
      if(dist>maxDist){dist=maxDist;tt=(h*.49)/(dist*usable)} // no room to back off: a wider lens instead
      const visHalf=tt*aspect*dist
      wallPanMax=Math.max(0,w/2+.02-visHalf); wallPxPerM=W/(2*visHalf)
      if(wallPan==null)wallPan=-wallPanMax
      wallPan=THREE.MathUtils.clamp(wallPan,-wallPanMax,wallPanMax)
      const pos=center.clone().addScaledVector(n,dist).addScaledVector(right,wallPan).addScaledVector(wUp,((top-bottom)/H)*tt*dist)
      tmpM.lookAt(pos,pos.clone().sub(n),wUp)
      return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov:THREE.MathUtils.radToDeg(2*Math.atan(tt)),id:'achievements'}
    }
    const reserved=window.matchMedia?.('(pointer: coarse)').matches?150:166 // (laptop: the bar, and the cue above it)
    const usable=(H-reserved-40)/H
    const dist=Math.min(maxDist,Math.max((h/2)/(t*usable*.92),(w/2)/(t*aspect*.92)))
    const pos=center.clone().addScaledVector(n,dist)
    pos.y-=((reserved-40)/2/(H/2))*t*dist // keep the frames clear of the bar
    tmpM.lookAt(pos,pos.clone().sub(n),new THREE.Vector3(0,1,0))
    return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov,id:'achievements'}
  }
  // The computer: sit in front of the iMac, looking straight at its (slightly tilted) screen.
  let screenCache=null
  const screenInfo=()=>{
    if(screenCache)return screenCache
    let mesh=null; scene.traverse((o)=>{ if(o.isMesh&&o.material===screenMaterial)mesh=o })
    if(!mesh)return null
    mesh.updateWorldMatrix(true,false)
    const pa=mesh.geometry.attributes.position, pts=[]
    for(let i=0;i<pa.count;i++)pts.push(new THREE.Vector3().fromBufferAttribute(pa,i).applyMatrix4(mesh.matrixWorld))
    const c=pts.reduce((a,p)=>a.add(p),new THREE.Vector3()).divideScalar(pts.length)
    const edges=pts.slice(1).map((p)=>p.clone().sub(pts[0])).sort((a,b)=>a.length()-b.length()).slice(0,2) // the two sides (not the diagonal)
    let [U,R]=Math.abs(edges[0].y)>Math.abs(edges[1].y)?edges:[edges[1],edges[0]]
    const h=U.length(), w=R.length(); U=U.clone().normalize(); if(U.y<0)U.negate(); R=R.clone().normalize()
    let n=new THREE.Vector3().crossVectors(R,U)
    if(n.dot(roomBounds.getCenter(new THREE.Vector3()).sub(c))<0){R.negate();n.negate()} // face into the room
    return (screenCache={c,R,U,n,w,h})
  }
  const screenView=()=>{
    const sc=screenInfo(); if(!sc)return null
    const W=canvas.clientWidth, H=canvas.clientHeight, aspect=W/H, fov=36, t=Math.tan(THREE.MathUtils.degToRad(fov/2))
    const coarse=window.matchMedia?.('(pointer: coarse)').matches
    if(sideways()){
      // upright phone: the screen turned sideways so its long side runs down the phone, as big as fits
      // above the controls (its top on the right; the visitor is asked to rotate the phone)
      const top=16, bottom=152, usable=(H-top-bottom)/H
      const dist=Math.max((sc.w/2)/(t*usable*.99),(sc.h/2)/(t*aspect*.98))
      const up=sc.R.clone().negate()
      const pos=sc.c.clone().addScaledVector(sc.n,dist).addScaledVector(sc.R,((bottom-top)/2/(H/2))*t*dist)
      tmpM.lookAt(pos,pos.clone().sub(sc.n),up)
      return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov,id:'projects',turn:true}
    }
    // laptop: the screen fills the view above the bar; phone held sideways: clear of the buttons at the sides
    // (phone sideways: BACK TO ROOM and the menu sit on the right, so the screen moves left of them)
    const reserved=coarse?16:100, left=coarse?14:24, right=coarse?(W>H?168:14):24
    const usable=(H-reserved-(coarse?12:28))/H, across=(W-left-right)/W
    const dist=Math.max((sc.h/2)/(t*usable),(sc.w/2)/(t*aspect*across))
    const pos=sc.c.clone().addScaledVector(sc.n,dist).addScaledVector(sc.U,-((reserved-(coarse?12:28))/2/(H/2))*t*dist)
      .addScaledVector(sc.R,((right-left)/2/(W/2))*t*aspect*dist)
    tmpM.lookAt(pos,pos.clone().sub(sc.n),sc.U)
    return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov,id:'projects'}
  }
  // One certificate, straight on: on the left of a laptop screen (its description card takes the right),
  // or near the top of an upright phone (description below).
  const certFrame=(id)=>scene.getObjectByName('achievements-wall')?.userData.frames.find((f)=>f.userData.cert===id)
  const certView=(id)=>{
    const f=certFrame(id); if(!f)return null
    f.updateWorldMatrix(true,false)
    const n=new THREE.Vector3(0,0,1).transformDirection(f.matrixWorld), right=new THREE.Vector3(1,0,0).transformDirection(f.matrixWorld), up=new THREE.Vector3(0,1,0).transformDirection(f.matrixWorld)
    const center=f.getWorldPosition(new THREE.Vector3()), {w:fw,h:fh}=f.userData.outer
    const W=canvas.clientWidth, H=canvas.clientHeight, aspect=W/H, fov=36, t=Math.tan(THREE.MathUtils.degToRad(fov/2))
    const back=new THREE.Raycaster(center.clone().addScaledVector(n,.05),n,0,10).intersectObject(model,true).find((x)=>x.object.visible)
    const maxDist=back?Math.max(.3,back.distance+.05-.25):2
    const phone=window.matchMedia?.('(pointer: coarse)').matches&&H>W
    // where the frame's centre goes on screen (NDC) and how much of the screen it may fill
    const nx=phone?0:-.395, ny=phone?1-2*(24+(W*.9*fh/fw)/2)/H:((100-24)/2)/(H/2)
    let tt=t, dist=phone?(fw/2)/(tt*aspect*.9):Math.max((fw/2)/(tt*aspect*.54),(fh/2)/(tt*.8))
    // phone: the frame itself fills the width (its details card goes below); with no room to back off
    // that far from the wall, a longer lens instead
    if(dist>maxDist){ if(phone)tt=(fw/2)/(maxDist*aspect*.9); dist=maxDist }
    const pos=center.clone().addScaledVector(n,dist).addScaledVector(right,-nx*tt*aspect*dist).addScaledVector(up,-ny*tt*dist)
    tmpM.lookAt(pos,pos.clone().sub(n),up)
    return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov:THREE.MathUtils.radToDeg(2*Math.atan(tt)),id:'cert:'+id}
  }
  // glide from wherever the camera is now to another view (keeping the walking fov to return to);
  // `chain` follows straight after (the "next certificate" move: out to the wall, then in to the next)
  const refocus=(to,chain=null,pan=false)=>{
    if(!to)return
    focus={phase:'in',t:0,from:{pos:camera.position.clone(),quat:camera.quaternion.clone(),fov:camera.fov},to,chain,pan,savedFov:focus?.savedFov??camera.fov}
  }
  let bookSide=-1 // phones: which page of the open book is on screen
  // the pull-back between two certificates: the whole wall
  const wallBackView=()=>wallView()
  let certSel=null
  const certIds=()=>ACHIEVEMENTS.map((a)=>a.id).filter((id)=>certFrame(id))
  const openCert=(id)=>{ if(certSel===id)return; certSel=id; refocus(certView(id)); handlers.onCert?.(id) }
  const backToWall=()=>{ if(!certSel)return; const f=certFrame(certSel); if(f)wallPan=f.position.x; certSel=null; refocus(wallView()); handlers.onCert?.(null) }
  const nextCert=()=>{
    const ids=certIds(); if(!ids.length)return
    const j=ids[(ids.indexOf(certSel)+1)%ids.length]
    if(!certSel){openCert(j);return}
    certSel=j; refocus(wallBackView(),certView(j)); handlers.onCert?.(j)
  }
  const focusView=(id)=>{
    if(String(id).startsWith('cert:'))return certView(String(id).slice(5))
    if(id==='cert-back')return wallBackView()
    if(id==='music')return speakerView()
    if(id==='projects')return screenView()
    if(id==='achievements')return wallView()
    const spec=FOCUS[id], obj=spec&&scene.getObjectByName(spec.name); if(!obj)return null
    obj.updateWorldMatrix(true,false)
    const center=new THREE.Vector3(0,spec.y,0).applyMatrix4(obj.matrixWorld)
    const r={width:canvas.clientWidth,height:canvas.clientHeight}, fov=36, half=Math.tan(THREE.MathUtils.degToRad(fov/2))
    if(id==='about'&&sideways()){
      // upright phone: one page of the real book at a time, upright and filling the width (bookSide:
      // -1 left page, 1 right page); the camera pans across as the pages turn. The cue sits above it,
      // the controls below.
      const up=new THREE.Vector3(0,0,-1).transformDirection(obj.matrixWorld); up.y=0; up.normalize()
      const pw=spec.rect.w/2, pl=spec.rect.l, top=150, bottom=144, usable=(r.height-top-bottom)/r.height
      const h=Math.max((pw/2)/(half*(r.width/r.height)*.93),(pl/2)/(half*usable*.98))
      const c=new THREE.Vector3(bookSide*pw/2,spec.y,0).applyMatrix4(obj.matrixWorld)
      const shift=(((bottom-top)/2)/(r.height/2))*h*half
      const pos=c.addScaledVector(up,-shift); pos.y+=h
      const look=pos.clone(); look.y-=1
      tmpM.lookAt(pos,look,up)
      return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov,id}
    }
    const up=new THREE.Vector3(0,0,-1).transformDirection(obj.matrixWorld); up.y=0; up.normalize()
    const reserved=window.matchMedia?.('(pointer: coarse)').matches?172:(r.width<=720?150:id==='about'?168:104) // keep clear of the bottom bar (and the book's arrows cue above it)
    const usableH=Math.max(200,r.height-reserved-40), screenFrac=usableH/r.height
    const hForLength=(spec.L/2)/(half*screenFrac*spec.fill), hForWidth=(spec.W/2)/(half*(r.width/r.height)*.92)
    const h=Math.max(hForLength,hForWidth)
    const shiftPx=(reserved-40)/2, shift=(shiftPx/(r.height/2))*h*half
    const pos=center.clone().addScaledVector(up,-shift); pos.y+=h
    const look=pos.clone(); look.y-=1
    tmpM.lookAt(pos,look,up)
    return {pos,quat:new THREE.Quaternion().setFromRotationMatrix(tmpM),fov,id}
  }
  // Picking up the camera: it rises off the cabinet and turns its back screen to the visitor.
  let hold=null, disposed=false
  const HOLD_FOV=30 // zoom in while holding, so the camera can sit at arm's length without clipping
  // On a phone held upright the camera is shown turned sideways (landscape), so it can be big;
  // the visitor is asked to rotate the phone.
  const sideways=()=>window.matchMedia?.('(pointer: coarse)').matches && canvas.clientHeight>canvas.clientWidth
  const heldPose=()=>{
    const fov=THREE.MathUtils.degToRad(HOLD_FOV), H=canvas.clientHeight, W=canvas.clientWidth, t=Math.tan(fov/2)
    const coarse=window.matchMedia?.('(pointer: coarse)').matches, turn=sideways()
    let d, lift
    if(turn){
      // long side vertical: body ≈ 62% of the height (room for buttons above and below), ≈ 80% of the width
      // long side vertical, as big as fits: full width, and the height above the bottom controls
      const top=20, bottom=152, usable=(H-top-bottom)/H
      const dH=(.105/2)/(t*usable*.96), dW=(.06/2)/(t*(W/H)*.9)
      d=Math.max(dH,dW); lift=(((bottom-top)/2)/(H/2))*d*t // centred in the space above the controls
    }else{
      const reserved=coarse?172:(W<=720?150:104)
      // body ≈ 62% of the view height, and narrow enough to leave room for the arrow buttons either side
      const side=2*(56+28), bodyFrac=Math.max(.42,Math.min(.62,(W-side)/W))
      const dH=(.06/2)/(t*.5), dW=(.105/2)/(t*(W/H)*bodyFrac)
      d=Math.max(dH,dW); lift=((reserved-20)/2/(H/2))*d*t
    }
    const q=camera.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI))
    if(turn)q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2)) // top of the camera to the right
    // centre the camera body on the view
    const local=new THREE.Vector3(0,.03,CAMERA_SCREEN.z)
    const pos=new THREE.Vector3(0,lift,-d).applyQuaternion(camera.quaternion).add(camera.position).sub(local.applyQuaternion(q))
    return {pos,quat:q}
  }
  // The files: the nearest box file slides off the shelf, turns to face the visitor a little way off,
  // opens, then zooms in on the résumé. u runs 0 → 1 and back to 0 when closing.
  let folder=null, resumePage=null, resumeBottom=null, resumeFull=false // px kept free at the bottom (bar + buttons), from the UI
  const FOLDER_IN=2.9, FOLDER_OUT=2.1
  // far: how many times further than the reading distance; centerX: which local x lands mid-screen
  const folderPose=(far=1,centerX=FOLDER.sheetX,maxD=Infinity)=>{
    const W=canvas.clientWidth, H=canvas.clientHeight, aspect=W/H, t=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))
    const sw=FOLDER.sheetW, sh=sw*(resumePage?.aspect||1.4142)
    const coarse=window.matchMedia?.('(pointer: coarse)').matches, narrow=W<=720
    // upright phone: the sheet uses the width, with the download button between it and the controls;
    // laptop: the sheet as tall as fits above the bar, buttons on its right
    const top=narrow?(coarse?100:24):28, bottom=resumeBottom??(narrow?(coarse?150:140):104), fW=narrow||resumeFull?.9:Math.min(.62,(W-400)/W)
    const fH=(H-top-bottom)/H*.97
    const d0=Math.max((sh/2)/(t*fH),(sw/2)/(t*aspect*fW)), d=Math.max(d0,Math.min(d0*far,maxD))
    const q=camera.quaternion.clone()
    const pos=new THREE.Vector3(0,((bottom-top)/2)/(H/2)*t*d,-d).applyQuaternion(q).add(camera.position)
      .sub(new THREE.Vector3(centerX,0,0).applyQuaternion(q))
    return {pos,quat:q}
  }
  // How far back the file can open: start at the preferred distance and come closer until the
  // fully opened file (cover laid out to the left) is clear of the furniture, i.e. nothing sits between
  // the eye and any of its corners.
  const folderRay=new THREE.Raycaster()
  const shown=(o)=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
  const pickFar=(f,want,maxD)=>{
    const ud=f.obj.userData, C=ud.openCenter, x0=-ud.width/2-ud.depth-ud.width, x1=ud.width/2, h=ud.height/2
    const targets=scene.children.filter((o)=>o!==f.obj&&!o.isLight)
    const m=new THREE.Matrix4(), p=new THREE.Vector3(), dir=new THREE.Vector3()
    for(let k=want;k>1;k-=.1){
      const pose=folderPose(k,C,maxD); m.compose(pose.pos,pose.quat,new THREE.Vector3(1,1,1))
      let clear=true
      for(const x of [x0,(x0+x1)/2,x1])for(const y of [-h,0,h])for(const z of [-.01,ud.width*.5]){ // z: the cover's swing toward the eye
        p.set(x,y,z).applyMatrix4(m); dir.subVectors(p,camera.position); const dist=dir.length()
        folderRay.set(camera.position,dir.normalize()); folderRay.far=dist+.02
        if(folderRay.intersectObjects(targets,true).some((hit)=>shown(hit.object))){clear=false;break}
      }
      if(clear)return k
    }
    return 1
  }
  const startFolder=()=>{
    if(folder){folder.dir=1;return}
    const spot=state.hotspot; let box=null, best=Infinity
    scene.traverse((m)=>{ if(m.name==='box-file'&&m.visible){ const dd=m.getWorldPosition(tmpV).distanceTo(spot.pos); if(dd<best){best=dd;box=m} } })
    if(!box)return
    const {w,h,d,alongZ,depthSign,color}=box.userData
    const obj=createFileFolder({color,thickness:w,height:h,width:d})
    const n=alongZ?new THREE.Vector3(depthSign,0,0):new THREE.Vector3(0,0,depthSign) // out of the shelf
    const x=n.clone().negate(), y=new THREE.Vector3(0,1,0), z=new THREE.Vector3().crossVectors(x,y)
    const quat=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z))
    const pos=box.getWorldPosition(new THREE.Vector3()).addScaledVector(z,-(obj.userData.depth/2-.006)) // file centred where the box was
    obj.position.copy(pos); obj.quaternion.copy(quat); scene.add(obj)
    if(resumePage)obj.userData.setPage(resumePage.canvas,resumePage.aspect)
    box.visible=false
    folder={obj,box,u:0,dir:1,rest:{pos,quat},out:pos.clone().addScaledVector(n,d+.06)}
    // never further back than where it came off the shelf, and only as far as there's free room
    const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion)
    folder.maxD=folder.out.clone().sub(camera.position).dot(fwd)-.12-obj.userData.depth
    folder.far=pickFar(folder,canvas.clientWidth<=720?3.2:2.5,folder.maxD)
  }
  const enterSystem=()=>{
    if(!state.hotspot||state.system)return
    state.system=true; keys.clear(); travel=null
    if(state.hotspot.id==='photos'){
      const obj=scene.getObjectByName('desk-camera')
      if(obj){ if(!obj.userData.rest)obj.userData.rest={pos:obj.position.clone(),quat:obj.quaternion.clone()}; hold={phase:'in',t:0,obj,from:{pos:obj.position.clone(),quat:obj.quaternion.clone(),fov:camera.fov},savedFov:camera.fov} }
    }
    if(state.hotspot.id==='resume')startFolder()
    if(state.hotspot.id==='about')bookSide=-1
    if(state.hotspot.id==='achievements')wallPan=null // phones: start at the wall's left end
    if(FOCUS[state.hotspot.id]||['music','achievements','projects'].includes(state.hotspot.id)){
      const to=focusView(state.hotspot.id)
      if(to)focus={phase:'in',t:0,from:{pos:camera.position.clone(),quat:camera.quaternion.clone(),fov:camera.fov},to,savedFov:camera.fov}
    }
    handlers.onSystem(true,state.hotspot.app)
  }
  const exitSystem=()=>{
    if(!state.system)return
    state.system=false
    if(certSel){certSel=null;handlers.onCert?.(null)}
    canvas.style.cursor=''
    if(focus)focus={...focus,phase:'out',t:0,from:{pos:camera.position.clone(),quat:camera.quaternion.clone(),fov:camera.fov}}
    if(folder)folder.dir=-1
    if(hold)hold={...hold,phase:'out',t:0,from:{pos:hold.obj.position.clone(),quat:hold.obj.quaternion.clone(),fov:camera.fov}}
    handlers.onSystem(false)
  }
  const keys = new Set()
  const onDown = (event) => {
    const key=event.key.toLowerCase()
    if (state.system && ['backspace','delete','escape'].includes(key)) { event.preventDefault(); exitSystem(); return }
    if (!state.system && key==='enter' && state.hotspot && state.allowOpen!==false) { event.preventDefault(); enterSystem(); return }
    if (!state.system && ['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) { event.preventDefault(); if(state.allowWalk===false)return; keys.add(key); travel=null }
  }
  const onUp=(event)=>keys.delete(event.key.toLowerCase()), clearKeys=()=>keys.clear()
  window.addEventListener('keydown',onDown); window.addEventListener('keyup',onUp); window.addEventListener('blur',clearKeys)
  let pointer=null
  const pointerDown=(event)=>{ if(event.button!==0)return; travel=null; pointer={id:event.pointerId,x:event.clientX,y:event.clientY,x0:event.clientX,y0:event.clientY,t0:performance.now()}; canvas.setPointerCapture?.(event.pointerId) }
  // Phones: a quick tap (not a drag) on the object the cue is about opens it, like the Interact button.
  const tapRay=new THREE.Raycaster(), tapNdc=new THREE.Vector2()
  const isPart=(o,root)=>{for(let p=o;p;p=p.parent)if(p===root)return true;return false}
  const visibleHit=(o)=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
  // pointer position → normalised device coords (the sideways phone has the app turned -90°)
  const setNdc=(event)=>{
    const r=canvas.getBoundingClientRect()
    if(isLocked()){ const lx=r.bottom-event.clientY, ly=event.clientX-r.left; tapNdc.set(lx/canvas.clientWidth*2-1,-(ly/canvas.clientHeight)*2+1) }
    else tapNdc.set((event.clientX-r.left)/r.width*2-1,-((event.clientY-r.top)/r.height)*2+1)
  }
  // which certificate (with a real achievement behind it) is under the pointer, if any
  const pickCert=(event)=>{
    const wall=scene.getObjectByName('achievements-wall'); if(!wall)return null
    setNdc(event); tapRay.setFromCamera(tapNdc,camera)
    const hit=tapRay.intersectObject(wall,true)[0]; if(!hit)return null
    for(let o=hit.object;o;o=o.parent)if(o.name==='cert-frame')return o.userData.cert
    return null
  }
  const inAchievements=()=>state.system&&state.hotspot?.id==='achievements'
  const tapOpen=(event)=>{
    const spot=state.hotspot; if(!spot||state.system||state.allowOpen===false)return
    setNdc(event)
    tapRay.setFromCamera(tapNdc,camera)
    const hit=tapRay.intersectObjects(scene.children,true).find((h)=>h.object.isMesh&&visibleHit(h.object))
    if(!hit)return
    if((spot.obj&&isPart(hit.object,spot.obj))||hit.point.distanceTo(spot.pos)<(spot.reach||.2))enterSystem()
  }
  const pointerUp=(event)=>{
    const p=pointer; pointer=null
    if(!p||event.type!=='pointerup')return
    const tap=Math.hypot(event.clientX-p.x0,event.clientY-p.y0)<10&&performance.now()-p.t0<(event.pointerType==='touch'?350:600)
    if(!tap)return
    // achievements: click / tap a certificate to see it; anywhere else goes back to the whole wall
    if(inAchievements()){ const id=pickCert(event); if(id)openCert(id); else backToWall(); return }
    if(event.pointerType==='touch')tapOpen(event)
  }
  // laptop: a hand cursor over the certificates that open
  const hoverCert=(event)=>{ if(pointer||event.pointerType!=='mouse'||!inAchievements())return; canvas.style.cursor=pickCert(event)?'pointer':'' }
  const pointerMove=(event)=>{
    // phones, on the achievements wall: drag sideways to move along it (drag right → further right)
    if(pointer&&pointer.id===event.pointerId&&inAchievements()&&!certSel&&wallPanMax>0){
      const [dx]=toLocal(event.clientX-pointer.x,event.clientY-pointer.y); pointer.x=event.clientX; pointer.y=event.clientY
      wallPan=THREE.MathUtils.clamp((wallPan??-wallPanMax)+dx/wallPxPerM,-wallPanMax,wallPanMax); return
    }
    if(!pointer||pointer.id!==event.pointerId||state.system||state.allowLook===false)return; const [dx,dy]=toLocal(event.clientX-pointer.x,event.clientY-pointer.y); pointer.x=event.clientX;pointer.y=event.clientY;state.yaw-=dx*.003;state.pitch=THREE.MathUtils.clamp(state.pitch-dy*.002,-.75,.32) }

  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointermove',hoverCert);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp)
  const onWheel=(event)=>{event.preventDefault();camera.fov=THREE.MathUtils.clamp(camera.fov+Math.sign(event.deltaY)*2,46,80);camera.updateProjectionMatrix()}
  canvas.addEventListener('wheel',onWheel,{passive:false})
  const resize=()=>{const r={width:canvas.clientWidth,height:canvas.clientHeight};renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(r.height,1);camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize()
  const nowHour=new Date().getHours()+new Date().getMinutes()/60
  // `light` eases toward `lightTarget` (set from the time of day); `night` is the eased darkness.
  let frame=0,last=performance.now(),uiTime=0,lightTarget=lightAt(nowHour),light={...lightTarget},progress=light.night,night=light.night
  const walkDirection=new THREE.Vector3()
  const tick=(now)=>{
    const dt=Math.min((now-last)/1000,.04);last=now;uiTime+=dt
    light.night=THREE.MathUtils.damp(light.night,lightTarget.night,2.2,dt); light.warm=THREE.MathUtils.damp(light.warm,lightTarget.warm,2.2,dt)
    progress=light.night
    night=progress*progress*(3-2*progress)
    const warm=light.warm
    scene.background.copy(dayColor).lerp(nightColor,night);scene.fog.color.copy(scene.background)
    exteriorMaterials.forEach((material)=>{material.uniforms.nightMix.value=progress;material.uniforms.time.value=now/1000})
    const lerp=THREE.MathUtils.lerp
    hemi.intensity=lerp(.95,.22,night);fill.intensity=lerp(.3,.12,night)
    sun.intensity=lerp(SUN_DAY,.3,night)*(1-warm*.25);sun.color.copy(sunDay).lerp(sunGold,warm).lerp(moonColor,night*(1-warm*.5))
    // Lamps come on during dusk, before it is fully dark.
    const lampsOn=THREE.MathUtils.smoothstep(progress,.3,.85)
    dayFillLights.forEach((entry)=>{entry.light.intensity=entry.max*(1-night)})
    // Shelf LEDs: a faint glow by day, full mood lighting at night.
    moodLights.forEach((entry)=>{const k=lerp(.12,1,lampsOn);entry.light.intensity=entry.max*k;entry.glow.emissiveIntensity=entry.glowMax*k})
    alwaysOnLights.forEach((entry)=>{entry.light.intensity=lerp(entry.day,entry.night,night)})
    nightLights.forEach((entry)=>{if(entry.light)entry.light.intensity=entry.max*lampsOn;if(entry.glow)entry.glow.emissiveIntensity=entry.glowMax*lampsOn})
    if(windowSun){windowSun.intensity=lerp(2.1,.22,night);windowSun.color.copy(sunDay).lerp(sunGold,warm).lerp(moonColor,night*(1-warm*.5))}
    if (groundMaterial) groundMaterial.color.setRGB(1-.62*night,1-.58*night,1-.5*night)
    const turn=Number(keys.has('arrowright'))-Number(keys.has('arrowleft')), forward=Number(keys.has('arrowup'))-Number(keys.has('arrowdown'))
    if(turn&&!state.system)state.yaw-=turn*1.6*dt
    if(forward&&!state.system&&walkBounds){
      // forward = +1 walks ahead, -1 walks backwards.
      const step=WALK_SPEED*dt
      walkDirection.set(-Math.sin(state.yaw)*forward,0,-Math.cos(state.yaw)*forward)
      const nextX=state.x+walkDirection.x*step, nextZ=state.z+walkDirection.z*step
      const stuck=!isFree(state.x,state.z) // never trap someone who starts inside a collider
      if(stuck||isFree(nextX,nextZ)){state.x=nextX;state.z=nextZ}
      else if(isFree(nextX,state.z))state.x=nextX   // slide along the obstacle
      else if(isFree(state.x,nextZ))state.z=nextZ
      if(walkBounds){state.x=THREE.MathUtils.clamp(state.x,walkBounds.min.x,walkBounds.max.x);state.z=THREE.MathUtils.clamp(state.z,walkBounds.min.z,walkBounds.max.z)}
    }
    // Walking to a spot from the shortcut buttons: ease position and view over ~1.2 s.
    if(travel){
      travel.t=Math.min(1,travel.t+dt/travel.duration); const e=travel.t<.5?4*travel.t**3:1-Math.pow(-2*travel.t+2,3)/2
      state.x=THREE.MathUtils.lerp(travel.from.x,travel.to.x,e); state.z=THREE.MathUtils.lerp(travel.from.z,travel.to.z,e)
      state.yaw=travel.from.yaw+travel.dYaw*e; state.pitch=THREE.MathUtils.lerp(travel.from.pitch,travel.to.pitch,e)
      if(travel.t>=1)travel=null
    }
    // Which spot is the visitor at? The one in front of them and close enough (or right beside them).
    let active=null, best=Infinity
    // the computer and the certificates above it share a spot: whichever is nearer the line of sight wins
    // (split halfway between their elevations, nudged up so a level gaze favours the computer)
    const eyeY=floorY+EYE_HEIGHT, elevOf=(p)=>Math.atan2(p.y-eyeY,Math.max(.3,Math.hypot(p.x-state.x,p.z-state.z)))
    const vComp=hotspots.find((h)=>h.id==='projects'), vAch=hotspots.find((h)=>h.id==='achievements')
    const lookingUp=vComp&&vAch?state.pitch>(elevOf(vComp.pos)+elevOf(vAch.pos))/2+.08:false
    for(const spot of hotspots){
      const dx=spot.pos.x-state.x, dz=spot.pos.z-state.z, dist=Math.hypot(dx,dz)
      const ang=Math.abs(Math.atan2(Math.sin(Math.atan2(-dx,-dz)-state.yaw),Math.cos(Math.atan2(-dx,-dz)-state.yaw)))
      let score=dist+ang*1.2
      if(spot.vertical&&vComp&&vAch&&(spot.id==='achievements')!==lookingUp)continue
      if(((dist<1.6&&ang<.55)||(dist<1.05&&ang<1))&&score<best){best=score;active=spot}
    }
    // approaching the desk corner (computer + certificates above it): tell the UI so it can explain the look up / down choice
    if(computer){
      const dx=computer.x-state.x, dz=computer.z-state.z, d=Math.hypot(dx,dz)
      const a=Math.abs(Math.atan2(Math.sin(Math.atan2(-dx,-dz)-state.yaw),Math.cos(Math.atan2(-dx,-dz)-state.yaw)))
      const near=d<2.1&&a<1.05
      if(near!==state.deskNear){state.deskNear=near;handlers.onDeskNear?.(near)}
    }
    if(active!==state.hotspot){state.hotspot=active;state.nearby=!!active;handlers.onHotspot?.(active?active.id:null);handlers.onNearby?.(!!active)}
    camera.position.set(state.x,roomBounds?floorY+EYE_HEIGHT:EYE_HEIGHT,state.z);camera.rotation.set(state.pitch,state.yaw,0)
    if(focus){
      focus.t=Math.min(1,focus.t+dt/(focus.phase==='in'?1.15:.9))
      let e=focus.t<.5?4*focus.t**3:1-Math.pow(-2*focus.t+2,3)/2
      if(focus.phase==='in'){
        if(focus.t>=1){const v=focusView(focus.to.id);if(v)focus.to=v} // follow window resizes
        // the next leg (Next certificate: wall → next one) starts here, from where this one ended
        if(focus.t>=1&&focus.chain){const c=focusView(focus.chain.id)||focus.chain; focus={...focus,t:0,from:{pos:focus.to.pos.clone(),quat:focus.to.quat.clone(),fov:focus.to.fov},to:c,chain:null}; e=0}
        camera.position.lerpVectors(focus.from.pos,focus.to.pos,e); tmpQ.copy(focus.from.quat).slerp(focus.to.quat,e); camera.quaternion.copy(tmpQ)
        camera.fov=THREE.MathUtils.lerp(focus.from.fov,focus.to.fov,e)
      }else{
        tmpV.copy(camera.position); tmpQ.copy(camera.quaternion) // the normal walking view
        camera.position.lerpVectors(focus.from.pos,tmpV,e); camera.quaternion.copy(focus.from.quat).slerp(tmpQ,e)
        camera.fov=THREE.MathUtils.lerp(focus.from.fov,focus.savedFov,e)
        if(focus.t>=1){camera.fov=focus.savedFov;focus=null}
      }
      camera.updateProjectionMatrix()
      // the desk lamp sits right beside the phone; ease the exposure down so the wood still reads
      renderer.toneMappingExposure=.9-.28*(focus&&!['music','achievements','projects'].includes(focus.to.id)&&!String(focus.to.id).startsWith('cert')?(focus.phase==='in'?e:1-e):0)
    } else renderer.toneMappingExposure=.9
    // the ceiling pendants hang between the far end of the room and the certificate wall: hide their
    // fittings (not their light) while the wall close-up is on screen
    const hidePend=!!(focus&&focus.to.id==='achievements'&&focus.to.turn)
    if(hidePend!==pendantsHidden){pendantsHidden=hidePend;scene.traverse((o)=>{if(o.name==='linear-pendant')o.traverse((m)=>{if(m.isMesh)m.visible=!hidePend})})}
    // the speaker's top lights up while its song card is open
    if(!speakerObj)speakerObj=scene.getObjectByName('cabinet-speaker')
    const sg=speakerObj?.userData.glow
    if(sg){
      const want=state.system&&state.hotspot?.id==='music'?1:0
      sg.level+=(want-sg.level)*Math.min(1,dt*3)
      sg.onMat.opacity=sg.level; sg.idle.opacity=.55*(1-sg.level)
      if(sg.level>.01)sg.on.rotation.z-=dt*.7
    }
    if(uiTime>.12){handlers.onPosition?.({x:state.x,z:state.z,minX:walkBounds?.min.x??-1,maxX:walkBounds?.max.x??1,minZ:walkBounds?.min.z??-1,maxZ:walkBounds?.max.z??1});uiTime=0}
    if(hold){
      hold.t=Math.min(1,hold.t+dt/(hold.phase==='in'?1:.8))
      const e=hold.t<.5?4*hold.t**3:1-Math.pow(-2*hold.t+2,3)/2
      const to=hold.phase==='in'?heldPose():hold.obj.userData.rest
      hold.obj.position.lerpVectors(hold.from.pos,to.pos,e)
      // a small arc: rise a little more in the middle of the move
      if(hold.t<1)hold.obj.position.y+=Math.sin(Math.PI*e)*.05
      hold.obj.quaternion.copy(hold.from.quat).slerp(to.quat,e)
      camera.fov=THREE.MathUtils.lerp(hold.from.fov,hold.phase==='in'?HOLD_FOV:hold.savedFov,e); camera.updateProjectionMatrix()
      if(hold.phase==='out'&&hold.t>=1)hold=null
    }
    if(folder){
      const f=folder
      f.u=THREE.MathUtils.clamp(f.u+f.dir*dt/(f.dir>0?FOLDER_IN:FOLDER_OUT),0,1)
      const seg=(a,b)=>{const k=THREE.MathUtils.clamp((f.u-a)/(b-a),0,1);return k<.5?4*k**3:1-Math.pow(-2*k+2,3)/2}
      // slide out → turn to face the visitor, held back so the whole file shows → open → zoom in
      const s1=seg(0,.2), s2=seg(.2,.46), s3=seg(.46,.7), s4=seg(.7,1)
      // held back only as far as there's free room (worked out when it came off the shelf)
      const C=f.obj.userData.openCenter, far=f.far, maxD=f.maxD
      if(s4>0){const a=folderPose(far,C,maxD), b=folderPose(); f.obj.position.lerpVectors(a.pos,b.pos,s4); f.obj.quaternion.copy(b.quat)}
      else if(s2>0){const a=folderPose(far,C*s3,maxD); f.obj.position.lerpVectors(f.out,a.pos,s2); f.obj.position.y+=Math.sin(Math.PI*s2)*.03; f.obj.quaternion.copy(f.rest.quat).slerp(a.quat,s2)}
      else{f.obj.position.lerpVectors(f.rest.pos,f.out,s1); f.obj.quaternion.copy(f.rest.quat)}
      f.obj.userData.open(s3)
      if(f.dir<0&&f.u<=0){scene.remove(f.obj);f.obj.userData.dispose();f.box.visible=true;folder=null}
    }
    // phones resize the page without always telling the observer (address bar, rotation)
    const size=renderer.getSize(tmpSize); if(Math.abs(size.x-canvas.clientWidth)>1||Math.abs(size.y-canvas.clientHeight)>1)resize()
        renderer.render(scene,camera);frame=requestAnimationFrame(tick)
  }
  frame=requestAnimationFrame(tick)
  return {
    setTimeOfDay(hour){lightTarget=lightAt(hour)},
    // Walk to one of the explorable spots and face it.
    goTo(id){
      const spot=hotspots.find((h)=>h.id===id); if(!spot||state.system||state.allowWalk===false||state.allowOpen===false)return // not during the walkthrough
      const view=spot.view, yaw=Math.atan2(-(spot.pos.x-view.x),-(spot.pos.z-view.z))
      const eyeY=floorY+EYE_HEIGHT, pitch=THREE.MathUtils.clamp(Math.atan2(spot.pos.y-eyeY,Math.hypot(spot.pos.x-view.x,spot.pos.z-view.z)),-.75,.5)
      const dYaw=Math.atan2(Math.sin(yaw-state.yaw),Math.cos(yaw-state.yaw))
      travel={t:0,duration:Math.min(1.8,.7+Math.hypot(view.x-state.x,view.z-state.z)*.35),from:{x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch},to:{x:view.x,z:view.z,pitch},dYaw}
    },
    openSpot(){ if(state.allowOpen!==false)enterSystem() },
    // first-visit walkthrough: which controls are live yet
    setControls({walk=true,look=true,open=true}={}){ state.allowWalk=walk; state.allowLook=look; state.allowOpen=open; if(!walk)keys.clear() },
    closeSystem(){ exitSystem() },
    // Where the phone's screen is on the page once the camera has settled over it (null until then).
    // Where the close-up surface (phone screen, book pages) is on the page once the camera has
    // settled over it (null until then).
    focusRect(id){
      // (also while panning across the book from one page to the other)
      if(!focus||focus.phase!=='in'||(focus.t<1&&!focus.pan)||focus.to.id!==id)return null
      const spec=FOCUS[id], obj=scene.getObjectByName(spec.name); if(!obj)return null
      // relative to the canvas (the overlay covers it exactly), using its CSS size
      const W=canvas.clientWidth, H=canvas.clientHeight, w=spec.rect.w/2, l=spec.rect.l/2
      let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity
      for(const [x,z] of [[-w,-l],[w,-l],[w,l],[-w,l]]){
        tmpV.set(x,spec.rect.y,z).applyMatrix4(obj.matrixWorld).project(camera)
        const px=(tmpV.x+1)/2*W, py=(1-tmpV.y)/2*H
        x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)
      }
      return {left:x0,top:y0,width:x1-x0,height:y1-y0,radius:(x1-x0)*spec.rect.r/spec.rect.w,rotated:!!focus.to.turn}
    },
    phoneScreenRect(){ return this.focusRect('contact') },
    // phones: show the left (-1) or right (1) page of the open book
    setBookSide(side){ if(side===bookSide)return; bookSide=side; if(state.system&&focus?.to.id==='about'&&sideways())refocus(focusView('about'),null,true) },
    // achievements: open / step through / leave the certificates
    openCert(id){ if(inAchievements())openCert(id) },
    nextCert(){ if(inAchievements())nextCert() },
    backToWall(){ backToWall() },
    // the certificate on screen once the camera has settled on it: {id, left, top, width, height} (null until then)
    certRect(){
      if(!focus||focus.phase!=='in'||focus.t<1||focus.chain||!String(focus.to.id).startsWith('cert:'))return null
      const id=focus.to.id.slice(5), f=certFrame(id); if(!f)return null
      const art=f.userData.art, W=canvas.clientWidth, H=canvas.clientHeight; art.updateWorldMatrix(true,false)
      const g=art.geometry.parameters; let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity
      for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        tmpV.set(a*g.width/2,b*g.height/2,0).applyMatrix4(art.matrixWorld).project(camera)
        const px=(tmpV.x+1)/2*W, py=(1-tmpV.y)/2*H
        x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)
      }
      // and the whole frame's bottom edge (the phone's details card starts below it)
      const o=f.userData.outer; f.updateWorldMatrix(true,false)
      tmpV.set(0,-o.h/2,0).applyMatrix4(f.matrixWorld).project(camera)
      return {id,left:x0,top:y0,width:x1-x0,height:y1-y0,frameBottom:(1-tmpV.y)/2*H}
    },
    // The iMac's screen once the camera has settled in front of it (null until then).
    computerScreenRect(){
      if(!focus||focus.phase!=='in'||focus.t<1||focus.to.id!=='projects')return null
      const sc=screenInfo(); if(!sc)return null
      const W=canvas.clientWidth, H=canvas.clientHeight
      let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity
      for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        tmpV.copy(sc.c).addScaledVector(sc.R,a*sc.w/2).addScaledVector(sc.U,b*sc.h/2).project(camera)
        const px=(tmpV.x+1)/2*W, py=(1-tmpV.y)/2*H
        x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)
      }
      return {left:x0,top:y0,width:x1-x0,height:y1-y0,rotated:!!focus.to.turn}
    },
    // The résumé sheet in the open file, once it has settled in front of the visitor (null until then).
    resumeRect(){
      if(!folder||folder.dir<0||folder.u<1)return null
      const s=folder.obj.userData.sheet; s.updateWorldMatrix(true,false)
      const W=canvas.clientWidth, H=canvas.clientHeight
      let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity
      for(const [x,y] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
        tmpV.set(x,y,0).applyMatrix4(s.matrixWorld).project(camera)
        const px=(tmpV.x+1)/2*W, py=(1-tmpV.y)/2*H
        x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)
      }
      return {left:x0,top:y0,width:x1-x0,height:y1-y0}
    },
    // The rendered résumé page, laid on the sheet in the file (aspect = height / width).
    setResumeInsets({bottom=null,full=false}={}){ resumeBottom=bottom; resumeFull=full },
    setResumePage(canvas,aspect){ resumePage={canvas,aspect}; folder?.obj.userData.setPage(canvas,aspect) },
    // The camera's rear screen once it has been picked up (null until then).
    cameraScreenRect(){
      if(!hold||hold.phase!=='in'||hold.t<1)return null
      const W=canvas.clientWidth, H=canvas.clientHeight, s=CAMERA_SCREEN
      let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity
      hold.obj.updateMatrixWorld(true)
      for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        tmpV.set(s.x+dx*s.w/2,s.y+dy*s.h/2,s.z).applyMatrix4(hold.obj.matrixWorld).project(camera)
        const px=(tmpV.x+1)/2*W, py=(1-tmpV.y)/2*H
        x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py)
      }
      // the camera body's left/right edges on the page, for the buttons either side
      let bx0=Infinity,bx1=-Infinity,by0=Infinity,by1=-Infinity
      for(const dx of [-.0525,.0525]){ tmpV.set(dx,.03,0).applyMatrix4(hold.obj.matrixWorld).project(camera); const px=(tmpV.x+1)/2*W, py=(1-tmpV.y)/2*H; bx0=Math.min(bx0,px); bx1=Math.max(bx1,px); by0=Math.min(by0,py); by1=Math.max(by1,py) }
      return {left:x0,top:y0,width:x1-x0,height:y1-y0,bodyLeft:bx0,bodyRight:bx1,bodyTop:by0,bodyBottom:by1,rotated:sideways()}
    },
    goToSpot(index){if(!spots[index])return;const spot=nearestFree(spots[index].x,spots[index].z);state.x=spot.x;state.z=spot.z;const target=index===3?spots[0]:desk;state.yaw=target?Math.atan2(-(target.x-state.x),-(target.z-state.z)):-Math.PI/2;state.pitch=0},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',onDown);window.removeEventListener('keyup',onUp);window.removeEventListener('blur',clearKeys);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointermove',hoverCert);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('wheel',onWheel);scene.traverse((object)=>{object.geometry?.dispose();if(Array.isArray(object.material))object.material.forEach((m)=>m.dispose());else object.material?.dispose()});groundMaterial?.map?.dispose();wallTexture.dispose();wallSource.dispose();floorTexture.dispose();cabinetTexture.dispose();doorTexture.dispose();desktopTexture.userData.dispose?.();desktopTexture.dispose();exteriorTexture.dispose();renderer.dispose()},
  }
}

export default function OfficeScene({sceneRef,onPosition,onNearby,onHotspot,onDeskNear,onSystem,onReady,onProgress,onCert}){
  const canvasRef=useRef(null)
  useEffect(()=>{if(!canvasRef.current)return undefined;const office=createScene(canvasRef.current,{onPosition,onNearby,onHotspot,onDeskNear,onSystem,onReady,onProgress,onCert});sceneRef.current=office;return()=>{office.dispose();if(sceneRef.current===office)sceneRef.current=null}},[sceneRef,onPosition,onNearby,onHotspot,onDeskNear,onSystem,onReady,onProgress,onCert])
  return <canvas ref={canvasRef} className="office-canvas" aria-label="First-person walkthrough of the home office. Use arrow keys to move, drag to look, and press Enter at the work desk." />
}
