// Night Court — the one WebGL scene behind the whole story.
// Units are metres; court is centred on the origin, length along Z.
import * as THREE from 'three';
import { M } from './content.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const COL = {
  night: 0x0a1020,
  courtIn: '#2052a8',
  courtOut: '#7a3337',
  line: '#eef1ea',
  optic: 0xdfff4f,
  warm: 0xffd6a0,
};

// Camera stops, one per story section (hero, coach, method, programs, court, member, book)
const STOPS = [
  { p: [0.55, 2.2, 13.4], l: [-0.4, 1.4, 0] },
  { p: [-3.35, 0.95, 12.95], l: [-2.0, 0.12, 11.1] },
  { p: [14.5, 3.6, 1.5], l: [0, 0.9, 0] },
  { p: [0.6, 31, 7], l: [0, 0, 0.6] },
  { p: [8.6, 1.5, -17.2], l: [0, 2.2, -3] },
  { p: [-6, 4.2, 20], l: [0, 1.2, 0] },
  { p: [0, 17, 25], l: [0, 0, -3] },
];

// Rally shots (x, z) — ball alternates ends. Heights computed per shot.
const RALLY = [
  [0.8, 12.25], [-2.4, -4.6], [1.8, 11.2], [-3.4, -10.5], [3.6, 9.8], [0.2, -11.4],
  [-3.9, 10.6], [2.9, -8.8], [-0.8, 11.6], [3.8, -10.9], [-2.6, 7.2], [1.2, -11.8],
  [-3.2, 10.9], [2.4, -6.4], [0.4, 11.0], [-3.6, -10.2], [3.1, 10.4], [-1.0, -11.0],
  [2.2, 9.4], [-3.0, -9.6], [0.0, 11.8], [3.3, -10.8], [-2.0, 10.1], [0.9, -9.9],
  [-3.5, 11.2], [2.6, -11.3], [1.0, 10.0],
];

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}

function noise(ctx, w, h, alpha, n = 26000) {
  for (let i = 0; i < n; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
  }
}

function courtTexture() {
  // 18.3 m (x) × 36.6 m (z) → 1024 × 2048 px, 55.96 px per metre
  return canvasTex(1024, 2048, (g, w, h) => {
    const s = w / 18.3, cx = w / 2, cz = h / 2;
    g.fillStyle = COL.courtOut; g.fillRect(0, 0, w, h);
    g.fillStyle = COL.courtIn;
    g.fillRect(cx - 5.485 * s, cz - 11.885 * s, 10.97 * s, 23.77 * s);
    noise(g, w, h, 0.07, 90000);
    g.strokeStyle = COL.line; g.lineWidth = 0.06 * s; g.lineCap = 'square';
    const L = (x1, z1, x2, z2) => { g.beginPath(); g.moveTo(cx + x1 * s, cz + z1 * s); g.lineTo(cx + x2 * s, cz + z2 * s); g.stroke(); };
    g.strokeRect(cx - 5.485 * s, cz - 11.885 * s, 10.97 * s, 23.77 * s);
    L(-4.115, -11.885, -4.115, 11.885); L(4.115, -11.885, 4.115, 11.885);
    L(-4.115, -6.4, 4.115, -6.4); L(-4.115, 6.4, 4.115, 6.4);
    L(0, -6.4, 0, 6.4);
    L(0, -11.885, 0, -11.6); L(0, 11.885, 0, 11.6);
  });
}

function ballTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#e9ff6a'); grd.addColorStop(1, '#cfee3c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    noise(g, w, h, 0.18, 24000);
    g.strokeStyle = '#fbfbef'; g.lineWidth = 9;
    for (const off of [0, Math.PI]) {
      g.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h / 2 + Math.sin((x / w) * Math.PI * 2 * 2 + off) * h * 0.28;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
  });
}

function netTexture() {
  return canvasTex(1024, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(20,24,30,0.85)'; g.lineWidth = 1.2;
    for (let x = 0; x < w; x += 6) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, h); g.stroke(); }
    for (let y = 10; y < h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#f2f3ee'; g.fillRect(0, 0, w, 10);
  });
}

function gripTexture() {
  return canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#1c1f26'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2d313b'; g.lineWidth = 5;
    for (let y = -w; y < h + w; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + w * 0.6); g.stroke(); }
  });
}

function buildRacket() {
  const grp = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0e1726, metalness: 0.6, roughness: 0.35 });
  const accentMat = new THREE.MeshStandardMaterial({ color: COL.optic, emissive: 0x3a4a05, roughness: 0.5 });
  // head: ellipse ring
  const ringCurve = new THREE.EllipseCurve(0, 0, 0.13, 0.165, 0, Math.PI * 2);
  const pts = ringCurve.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0));
  const head = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 128, 0.011, 10, true), frameMat);
  grp.add(head);
  const stripe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(20, 44)), 40, 0.0115, 8), accentMat);
  grp.add(stripe);
  // strings
  const s = [];
  for (let x = -0.12; x <= 0.12; x += 0.016) {
    const y = 0.165 * Math.sqrt(Math.max(0, 1 - (x / 0.13) ** 2));
    s.push(x, -y, 0, x, y, 0);
  }
  for (let y = -0.155; y <= 0.155; y += 0.016) {
    const x = 0.13 * Math.sqrt(Math.max(0, 1 - (y / 0.165) ** 2));
    s.push(-x, y, 0, x, y, 0);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(s, 3));
  grp.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xe8ecef, transparent: true, opacity: 0.8 })));
  // throat
  for (const sx of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 0.1, -0.12, 0), new THREE.Vector3(sx * 0.05, -0.2, 0), new THREE.Vector3(sx * 0.014, -0.26, 0)]);
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.01, 8), frameMat));
  }
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.27, 8), new THREE.MeshStandardMaterial({ map: gripTexture(), roughness: 0.9 }));
  handle.position.y = -0.39; grp.add(handle);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 8), accentMat);
  cap.position.y = -0.53; grp.add(cap);
  grp.traverse((o) => { o.castShadow = true; });
  return grp;
}

export function createScene(canvas, { mobile = false, reduced = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.night);
  scene.fog = new THREE.FogExp2(COL.night, 0.014);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 400);

  // ── ground + court
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true;
  scene.add(ground);
  const court = new THREE.Mesh(new THREE.PlaneGeometry(18.3, 36.6), new THREE.MeshStandardMaterial({ map: courtTexture(), roughness: 0.82, metalness: 0.02 }));
  court.rotation.x = -Math.PI / 2; court.receiveShadow = true;
  scene.add(court);

  // ── net + posts
  const netMat = new THREE.MeshStandardMaterial({ map: netTexture(), transparent: true, side: THREE.DoubleSide, alphaTest: 0.05, roughness: 0.9 });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 0.97), netMat);
  net.position.set(0, 0.485, 0); net.castShadow = true;
  scene.add(net);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1b2a3c, metalness: 0.7, roughness: 0.3 });
  for (const x of [-6.4, 6.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.07, 12), postMat);
    post.position.set(x, 0.535, 0); post.castShadow = true; scene.add(post);
  }

  // ── indoor hall: purple banner walls with club logo discs, dark upper walls, roof trusses
  const wallCanvas = document.createElement('canvas'); wallCanvas.width = 2048; wallCanvas.height = 256;
  const wallTex = new THREE.CanvasTexture(wallCanvas); wallTex.colorSpace = THREE.SRGBColorSpace; wallTex.wrapS = THREE.RepeatWrapping; wallTex.anisotropy = 8;
  const wallMats = [];
  const drawWall = (logo) => {
    const g = wallCanvas.getContext('2d'), W = 2048, H = 256;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c1b52'); gr.addColorStop(1, '#3d2670');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 16) { g.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.02})`; g.fillRect(x, 0, 8, H); }
    for (let i = 0; i < 4; i++) {
      const cx = W / 8 + (i * W) / 4, cy = H / 2, r = H * 0.36;
      g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      if (logo) { g.save(); g.beginPath(); g.arc(cx, cy, r * 0.96, 0, Math.PI * 2); g.clip(); g.drawImage(logo, cx - r * 1.02, cy - r * 1.02, r * 2.04, r * 2.04); g.restore(); }
      else { g.strokeStyle = '#1b2a4a'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r * 0.82, 0, Math.PI * 2); g.stroke(); }
    }
    wallTex.needsUpdate = true; wallMats.forEach((t) => { t.needsUpdate = true; });
  };
  drawWall(null);
  const logoImg = new Image(); logoImg.onload = () => drawWall(logoImg); logoImg.src = M('logo.webp');
  const upperMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.9, metalness: 0.2 });
  const wall = (w, x, z, ry) => {
    const tex = wallTex.clone(); tex.repeat.set(w / 20, 1); tex.needsUpdate = true; wallMats.push(tex);
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.32, roughness: 0.85 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.6), mat);
    m.position.set(x, 1.8, z); m.rotation.y = ry; scene.add(m);
    const up = new THREE.Mesh(new THREE.PlaneGeometry(w, 8), upperMat);
    up.position.set(x, 7.6, z); up.rotation.y = ry; scene.add(up);
  };
  wall(22, 0, -19.2, 0); wall(22, 0, 19.2, Math.PI); wall(38.4, -10.9, 0, Math.PI / 2); wall(38.4, 10.9, 0, -Math.PI / 2);
  const steel = new THREE.MeshStandardMaterial({ color: 0x2a3140, metalness: 0.7, roughness: 0.45 });
  for (let z = -18; z <= 18; z += 6) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(22, 0.35, 0.25), steel); beam.position.set(0, 11.3, z); scene.add(beam);
    for (const x of [-10.6, 10.6]) { const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, 11.5, 0.3), steel); col.position.set(x, 5.75, z); scene.add(col); }
  }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(24, 40), new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: 1, side: THREE.DoubleSide }));
  roof.rotation.x = Math.PI / 2; roof.position.y = 11.8; scene.add(roof);

  // ── lights: high-bay lamps under the roof
  const hemi = new THREE.HemisphereLight(0x8a9cc8, 0x2a1a3a, 0.55);
  scene.add(hemi);
  const floods = [];
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(COL.warm) }, uStrength: { value: 0.16 } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float a = smoothstep(0.0, 1.0, vY) * f * uStrength; gl_FragColor = vec4(uColor*a, a); }`,
  });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: COL.warm, emissiveIntensity: 3 });
  for (let x = -6; x <= 6; x += 6) for (let z = -15; z <= 15; z += 6) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), lampMat); lamp.position.set(x, 10.9, z); scene.add(lamp);
  }
  const spotPos = [[-4.5, -9], [4.5, -9], [-4.5, 9], [4.5, 9]];
  spotPos.forEach(([x, z], i) => {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.35, 20), lampMat.clone());
    head.position.set(x, 10.6, z); scene.add(head);
    const spot = new THREE.SpotLight(COL.warm, 0, 60, 0.85, 0.65, 1.4);
    spot.position.copy(head.position);
    spot.target.position.set(x * 0.5, 0, z * 0.6);
    spot.castShadow = !mobile && i < 2;
    spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004;
    scene.add(spot, spot.target);
    const len = head.position.distanceTo(spot.target.position);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 6.4, len, 32, 1, true), beamMat);
    beam.position.copy(head.position).lerp(spot.target.position, 0.5);
    beam.lookAt(spot.target.position); beam.rotateX(-Math.PI / 2);
    scene.add(beam);
    floods.push({ spot, head, beam, base: 190 });
  });

  const DUST = mobile ? 250 : 650;
  const dustG = new THREE.BufferGeometry();
  const dp = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dp[i * 3] = (Math.random() - 0.5) * 24; dp[i * 3 + 1] = Math.random() * 9; dp[i * 3 + 2] = (Math.random() - 0.5) * 34; }
  dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dot = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ color: COL.warm, map: dot, size: 0.07, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  // ── ball + trail
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.034, 48, 32), new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.95, emissive: 0x4a5c0c, emissiveIntensity: 0.9 }));
  ball.castShadow = true;
  scene.add(ball);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: COL.optic, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.visible = false;
  const TRAIL = 48;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailCol = new Float32Array(TRAIL * 3);
  const trailG = new THREE.BufferGeometry();
  trailG.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailG.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
  const trail = new THREE.Line(trailG, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  trail.frustumCulled = false;
  scene.add(trail);
  const optic = new THREE.Color(COL.optic);

  // ── props: racket + spare balls near baseline (coach chapter close-up)
  const racket = buildRacket();
  racket.rotation.set(-Math.PI / 2, 0, 0.9);
  racket.position.set(-2.05, 0.022, 11.25);
  scene.add(racket);
  const spareMat = ball.material;
  [[-1.72, 11.52], [-1.66, 11.43], [-2.42, 10.82]].forEach(([x, z]) => {
    const b = new THREE.Mesh(ball.geometry, spareMat); b.position.set(x, 0.034, z); b.rotation.set(Math.random() * 3, Math.random() * 3, 0); b.castShadow = true; scene.add(b);
  });

  // ── post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.55, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ── state
  let s = 0, sTarget = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const camPos = new THREE.Vector3(...STOPS[0].p);
  const camLook = new THREE.Vector3(...STOPS[0].l);
  const tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();
  let running = true, visible = true, lightBoost = 0;
  const clock = { last: performance.now(), t: 0 };

  function stopAt(v) {
    const i = Math.min(STOPS.length - 2, Math.floor(v));
    const t = smooth(clamp01(v - i));
    const a = STOPS[i], b = STOPS[i + 1];
    tmpP.set(lerp(a.p[0], b.p[0], t), lerp(a.p[1], b.p[1], t), lerp(a.p[2], b.p[2], t));
    tmpL.set(lerp(a.l[0], b.l[0], t), lerp(a.l[1], b.l[1], t), lerp(a.l[2], b.l[2], t));
    // lift the path over the net when travelling between far-apart stops
    tmpP.y += Math.sin(t * Math.PI) * (i === 0 ? 3.5 : i === 2 ? 6 : 2);
  }

  function ballAt(v, time) {
    // v: story position. 0 → toss held; each story unit plays ~4 shots
    if (v < 0.04) {
      const bob = reduced ? 0 : Math.sin(time * 1.4) * 0.05;
      return [RALLY[0][0], 2.35 + bob, RALLY[0][1], 0];
    }
    const r = Math.min(RALLY.length - 1.0001, (v - 0.04) * 4.2);
    const i = Math.floor(r), f = r - i;
    const [x0, z0] = RALLY[i], [x1, z1] = RALLY[i + 1];
    const h0 = i === 0 ? 2.35 : 0.95;
    const bounce = 0.72;
    let y;
    if (f < bounce) { const t = f / bounce; y = lerp(h0, 0.034, t) + 4 * (i === 0 ? 0.25 : 1.35) * t * (1 - t); }
    else { const t = (f - bounce) / (1 - bounce); y = lerp(0.034, 0.95, t) + 4 * 0.55 * t * (1 - t); }
    return [lerp(x0, x1, f), y, lerp(z0, z1, f), r];
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w * (mobile ? 0.35 : 0.5), h * (mobile ? 0.35 : 0.5));
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 58 : 40;
    const portrait = w / h < 0.8;
    STOPS[0] = portrait ? { p: [0.85, 2.25, 13.55], l: [0.15, 1.55, 0] } : { p: [0.55, 2.2, 13.4], l: [-0.4, 1.4, 0] };
    STOPS[1] = portrait ? { p: [-2.6, 1.5, 12.9], l: [-2.0, 0.1, 11.1] } : { p: [-3.35, 0.95, 12.95], l: [-1.6, 0.25, 11.05] };
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) clock.last = performance.now(); });

  // initial trail fill
  for (let k = 0; k < TRAIL; k++) { trailPos.set([RALLY[0][0], 2.35, RALLY[0][1]], k * 3); }

  let lastBall = new THREE.Vector3(RALLY[0][0], 2.35, RALLY[0][1]);
  function frame(ts) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) return;
    const now = performance.now();
    const dt = Math.min(Math.max((now - clock.last) / 1000, 0), 0.1);
    clock.last = now; clock.t += dt;
    const time = clock.t;

    const k = reduced ? 1 : 1 - Math.pow(0.0009, dt); // frame-rate independent damping
    s += (sTarget - s) * k;
    const mk = 1 - Math.pow(0.08, dt); mouse.x += (mouse.tx - mouse.x) * mk; mouse.y += (mouse.ty - mouse.y) * mk;

    stopAt(s);
    const par = reduced ? 0 : (s < 1 ? 0.25 : 0.6);
    tmpP.x += mouse.x * par; tmpP.y -= mouse.y * par * 0.5;
    if (!reduced) { tmpP.y += Math.sin(time * 0.35) * 0.04; tmpP.x += Math.cos(time * 0.27) * 0.05; }
    const cl = reduced ? 1 : 1 - Math.pow(0.0005, dt); camPos.lerp(tmpP, cl); camLook.lerp(tmpL, cl);
    camera.position.copy(camPos); camera.lookAt(camLook);

    // floodlights: warm up on load, surge in the court chapter (s≈4)
    const surge = clamp01(1 - Math.abs(s - 4) / 0.9);
    const flicker = s > 3.3 && s < 3.7 && !reduced ? (Math.random() > 0.85 ? 0.35 : 1) : 1;
    lightBoost += (1 - lightBoost) * 0.03;
    floods.forEach((f) => {
      const I = f.base * lightBoost * (0.85 + surge * 0.35) * flicker;
      f.spot.intensity = I;
      f.head.material.emissiveIntensity = 1 + 3.5 * lightBoost * (0.7 + surge * 0.6) * flicker;
    });
    beamMat.uniforms.uStrength.value = 0.1 + surge * 0.12;
    renderer.toneMappingExposure = 1.02 - clamp01(s - 5) * 0.28;

    // ball
    const [bx, by, bz] = ballAt(reduced ? 0 : s, time);
    ball.position.set(bx, by, bz);
    const vel = ball.position.distanceTo(lastBall);
    ball.rotation.x += vel * 6 + (s < 0.04 && !reduced ? dt * 0.8 : 0);
    ball.rotation.z += vel * 3;
    lastBall.copy(ball.position);
    // trail: shift and push
    if (vel > 0.9) { for (let q = 0; q < TRAIL; q++) trailPos.set([bx, by, bz], q * 3); }
    else { trailPos.copyWithin(3, 0, (TRAIL - 1) * 3); trailPos.set([bx, by, bz], 0); }
    for (let i = 0; i < TRAIL; i++) {
      const a = (1 - i / TRAIL) ** 2 * clamp01(vel * 14) * 0.9;
      trailCol[i * 3] = optic.r * a; trailCol[i * 3 + 1] = optic.g * a; trailCol[i * 3 + 2] = optic.b * a;
    }
    trailG.attributes.position.needsUpdate = true;
    trailG.attributes.color.needsUpdate = true;
    glow.material.opacity = 0.1 + (s < 0.04 ? 0.08 + Math.sin(time * 2) * 0.03 : 0.04);

    if (!reduced) {
      const p = dustG.attributes.position.array;
      for (let i = 0; i < DUST; i++) { p[i * 3 + 1] += dt * 0.12; if (p[i * 3 + 1] > 9) p[i * 3 + 1] = 0; }
      dustG.attributes.position.needsUpdate = true;
    }
    composer.render();
  }
  frame();

  return {
    setStory(v) { sTarget = v; if (reduced) s = v; },
    get story() { return s; },
    destroy() { running = false; renderer.dispose(); },
  };
}
