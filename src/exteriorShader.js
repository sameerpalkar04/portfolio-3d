import * as THREE from 'three'

// One garden photo drives both day and night. The night look is graded from the
// day photo in the shader, so the view outside never swaps to a different scene;
// it moves through dusk into night with lamps, a moon and stars fading in.

// Garden lamps, in photo coordinates (u, v from bottom, glow radius, pool radius).
// A negative pool radius also draws a bollard post (the photo has none there).
const LAMPS = [
  // path bollards visible in the panorama
  [0.068, 0.405, 0.010, 0.060],
  [0.884, 0.395, 0.010, 0.060],
  // lamps seen through the window
  [0.330, 0.200, 0.009, -0.075],
  [0.505, 0.195, 0.009, -0.075],
  // distant uplights under trees across the lawn
  [0.335, 0.505, 0.006, 0.030],
  [0.405, 0.512, 0.005, 0.026],
  [0.470, 0.508, 0.006, 0.030],
  [0.530, 0.503, 0.005, 0.026],
  [0.640, 0.505, 0.006, 0.030],
  [0.150, 0.505, 0.006, 0.030],
  [0.780, 0.505, 0.006, 0.030],
]

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const fragmentShader = /* glsl */`
  uniform sampler2D dayMap;
  uniform float nightMix;
  uniform float time;
  uniform vec2 uvOffset;
  uniform vec2 uvScale;
  uniform vec2 moonPos;
  uniform vec4 lamps[${LAMPS.length}];
  varying vec2 vUv;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

  void main(){
    vec2 st = uvOffset + vUv * uvScale;
    // Work in display (sRGB) space so the day view matches the photo exactly.
    vec3 day = pow(texture2D(dayMap, st).rgb, vec3(1.0 / 2.2));
    float n = smoothstep(0.0, 1.0, nightMix);
    float lum = dot(day, vec3(0.2126, 0.7152, 0.0722));
    float hi = max(day.r, max(day.g, day.b)), lo = min(day.r, min(day.g, day.b));
    float sat = hi - lo;

    // Sky: blue or bright, unsaturated cloud pixels above the horizon line.
    float blueSky = smoothstep(0.03, 0.12, day.b - day.r) * smoothstep(0.02, 0.08, day.b - day.g + 0.04) * smoothstep(0.35, 0.6, lum);
    float cloud = smoothstep(0.62, 0.8, lum) * (1.0 - smoothstep(0.08, 0.2, sat));
    float sky = clamp(max(blueSky, cloud), 0.0, 1.0) * smoothstep(0.50, 0.60, st.y);

    float duskAmt = 1.0 - abs(n * 2.0 - 1.0);   // peaks halfway through the change
    float deep = smoothstep(0.45, 1.0, n);      // how far into night we are

    // Ground: warm dusk tint, then a cool, desaturated moonlit grade.
    vec3 duskGround = day * vec3(1.0, 0.78, 0.6) * 0.72;
    vec3 moonGround = mix(vec3(lum), day, 0.4) * vec3(0.16, 0.2, 0.31);
    moonGround = pow(moonGround, vec3(1.05)) * 1.22;
    vec3 ground = n < 0.5 ? mix(day, duskGround, n * 2.0) : mix(duskGround, moonGround, n * 2.0 - 1.0);

    // Sky: blue → sunset → deep night blue with stars.
    float h = smoothstep(0.5, 0.92, st.y);
    vec3 duskSky = mix(vec3(1.0, 0.6, 0.36), vec3(0.42, 0.36, 0.62), h) * (0.75 + 0.35 * lum);
    vec3 nightSky = mix(vec3(0.05, 0.08, 0.17), vec3(0.01, 0.018, 0.05), h) + cloud * lum * vec3(0.05, 0.06, 0.09);
    vec3 skyCol = n < 0.5 ? mix(day, duskSky, n * 2.0) : mix(duskSky, nightSky, n * 2.0 - 1.0);

    vec2 grid = st * vec2(1400.0, 700.0);
    vec2 cell = floor(grid);
    float r = hash(cell);
    float star = step(0.9965, r) * smoothstep(0.5, 0.0, length(fract(grid) - 0.5));
    star *= 0.55 + 0.45 * sin(time * (1.0 + r * 3.0) + r * 40.0);
    skyCol += star * deep * deep * vec3(0.9, 0.93, 1.0);

    vec2 md = (st - moonPos) * vec2(2.0, 1.0);
    float moonD = length(md);
    skyCol += deep * (smoothstep(0.0115, 0.0095, moonD) * vec3(0.95, 0.94, 0.86) + exp(-moonD * moonD / 0.0016) * vec3(0.12, 0.14, 0.2));

    vec3 col = mix(ground, skyCol, sky);

    // Garden lamps light the real scene around them.
    float lampsOn = smoothstep(0.35, 0.8, n);
    vec3 warm = vec3(1.0, 0.7, 0.36);
    for(int i = 0; i < ${LAMPS.length}; i++){
      vec4 L = lamps[i];
      vec2 d = (st - L.xy) * vec2(2.0, 1.0);
      float dd = dot(d, d);
      float core = exp(-dd / (L.z * L.z));
      float pw = abs(L.w);
      vec2 pd = (st - (L.xy - vec2(0.0, pw * 0.35))) * vec2(2.0, 2.4);
      float pool = exp(-dot(pd, pd) / (pw * pw));
      col += lampsOn * (warm * core * 1.4 + day * warm * pool * 0.75 * (1.0 - sky));
    }

    // Short bronze bollard posts under the nearer lamps (present day and night).
    for(int i = 0; i < ${LAMPS.length}; i++){
      vec4 L = lamps[i];
      if(L.w > 0.0) continue;
      float post = step(abs(st.x - L.x), 0.0016) * step(L.y - 0.045, st.y) * step(st.y, L.y - 0.004);
      col = mix(col, mix(vec3(0.16, 0.14, 0.12), vec3(0.05, 0.045, 0.04), n), post);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`

export function createExteriorMaterial({ side = THREE.FrontSide, uvOffset = [0, 0], uvScale = [1, 1], moonPos = [0.505, 0.705], depthWrite = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: null },
      nightMix: { value: 0 },
      time: { value: 0 },
      uvOffset: { value: new THREE.Vector2(...uvOffset) },
      uvScale: { value: new THREE.Vector2(...uvScale) },
      moonPos: { value: new THREE.Vector2(...moonPos) },
      lamps: { value: LAMPS.map((l) => new THREE.Vector4(...l)) },
    },
    vertexShader,
    fragmentShader,
    side,
    depthWrite,
  })
}

// Window crop of the 1774×887 garden photo (x 500–980, y 100–800 from the top).
export const WINDOW_UV = { uvOffset: [500 / 1774, 1 - 100 / 887], uvScale: [480 / 1774, -700 / 887] }
