<script setup>
// Brume procédurale (portée de l'Atelier MJ) : shader fragment FBM
// (Fractal Brownian Motion) custom. Approche légère et proche d'une
// « vraie » brume volumétrique ambiante : 2 couches de bruit de valeur
// animées à vitesses différentes, sommées en 5 octaves, contraste
// smoothstep + biais vertical pour densifier le bas. ~30 lignes GLSL,
// 1 drawcall / frame, pas de FBO, aucune dép hors three.
//
// Teinte : le shader sort la couleur d'accent du site (--accent, lue au
// mount — jamais de couleur en dur) avec la densité du bruit en alpha →
// brume rouge de la guilde, composée normalement sur le fond clair.
//
// Lazy-load de three dans onMounted pour ne pas alourdir le first paint.
import { onMounted, onBeforeUnmount, ref } from 'vue'

// `subtle` : brume d'ambiance beaucoup plus légère (ex. hero derrière du
// contenu) — opacité ~1/3 de la version pleine (voile d'arrivée).
defineProps({ subtle: { type: Boolean, default: false } })

const canvasEl = ref(null)

let disposeFn = null
let disposed = false

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;

// Vitesse globale d'animation. 1.0 = vitesse de référence (drift
// ~0.04 UV/s). Augmenter pour accélérer toute la brume.
const float SPEED = 1.5;

// Hachage sans sinus. Le classique fract(sin(dot(p, …)) * 43758.5) casse sur
// certains pilotes — Chrome sous Windows (ANGLE / Direct3D) notamment, qui
// calcule mal sin() sur de grands arguments : chaque case du quadrillage du
// bruit ressortait alors comme un rectangle net dans la brume. Formule de
// Dave Hoskins (hash12), stable en simple précision.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  // Les coordonnées de case sont repliées (période 289 cases) : la dérive dans
  // le temps ne fait plus grossir les nombres passés au hachage, et la brume
  // reste identique quel que soit le moment où on ouvre la page.
  vec2 i = mod(floor(p), 289.0);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

void main() {
  // UV normalisées par le plus petit côté : le bruit reste circulaire, et ses
  // volutes gardent la même taille quel que soit le format. En divisant par la
  // seule hauteur, un écran de téléphone (portrait) ne recevait pas même une
  // volute complète dans sa largeur : la brume s'y voyait comme un aplat.
  vec2 uv = vUv * uResolution / min(uResolution.x, uResolution.y);

  // Deux couches qui dérivent en sens inverses → illusion de profondeur.
  float t = uTime * SPEED;
  vec2 q1 = uv * 1.6 + vec2(t * 0.04, t * 0.015);
  vec2 q2 = uv * 2.4 + vec2(-t * 0.025, t * 0.030);

  float d = fbm(q1) * 0.6 + fbm(q2) * 0.4;

  // Contraste : 0.35..0.85 donne un look « brume franche mais douce ».
  d = smoothstep(0.35, 0.85, d);

  // Biais vertical : brume ~2.5x plus dense en bas, fade doucement vers
  // le haut. Effet « brouillard qui monte du sol ».
  float bottomBias = smoothstep(1.0, 0.0, vUv.y);
  d *= mix(0.35, 1.0, bottomBias);

  // Couleur d'accent, densité en alpha : brume teintée, transparente
  // là où le bruit est faible (compositing normal, pas de blend CSS).
  gl_FragColor = vec4(uColor, d);
}
`

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

async function mountShader(canvas) {
  const {
    WebGLRenderer,
    Scene,
    OrthographicCamera,
    Mesh,
    PlaneGeometry,
    ShaderMaterial,
    Vector2,
    Vector3,
  } = await import('three')
  if (disposed) return null

  const w = window.innerWidth
  const h = window.innerHeight

  // Sans WebGL (navigateur ancien, accélération désactivée, mode privé de
  // certains moteurs), three lève une erreur : on renonce à la brume et le
  // site s'affiche normalement, sur son fond uni.
  let renderer
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
    })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 1.5))
  renderer.setSize(w, h, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // Teinte de la brume = token --accent du site (parsé à la main en 0..1,
  // sans passer par three.Color pour éviter sa conversion colorimétrique).
  const accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b01e33').replace('#', '')
  const [cr, cg, cb] = [0, 1, 2].map((i) => parseInt(accent.slice(i * 2, i * 2 + 2), 16) / 255)

  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new Vector2(w, h) },
      uColor: { value: new Vector3(cr, cg, cb) },
    },
    depthTest: false,
    depthWrite: false,
  })

  // PlaneGeometry 2×2 en clip-space (le vertex shader plaque directement
  // position). Pas besoin de caméra, mais three veut un setup minimal.
  const mesh = new Mesh(new PlaneGeometry(2, 2), material)
  scene.add(mesh)

  const onResize = () => {
    const nw = window.innerWidth
    const nh = window.innerHeight
    renderer.setSize(nw, nh, false)
    material.uniforms.uResolution.value.set(nw, nh)
  }
  window.addEventListener('resize', onResize)

  const startTime = performance.now()
  let rafId = 0
  const tick = (now) => {
    if (disposed) return
    material.uniforms.uTime.value = (now - startTime) / 1000
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  return () => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    mesh.geometry.dispose()
    material.dispose()
    renderer.dispose()
  }
}

onMounted(async () => {
  // Honorer reduced-motion et low-end : pas de brume.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  if ((navigator.hardwareConcurrency ?? 8) < 4) return
  if (!canvasEl.value) return

  const fn = await mountShader(canvasEl.value)
  if (disposed) {
    // L'utilisateur a quitté la page pendant le lazy import.
    fn?.()
    return
  }
  disposeFn = fn
})

onBeforeUnmount(() => {
  disposed = true
  disposeFn?.()
})
</script>

<template>
  <canvas ref="canvasEl" class="welcome-fog" :class="{ 'welcome-fog--subtle': subtle }" aria-hidden="true" />
</template>

<style scoped>
/* Le shader sort une brume déjà teintée (--accent, densité en alpha) :
   compositing normal, seule l'opacité module l'intensité. */
.welcome-fog {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.55;
}

/* Variante « subtle » : brume d'ambiance légère derrière du contenu dense. */
.welcome-fog--subtle {
  opacity: 0.28;
}
</style>
