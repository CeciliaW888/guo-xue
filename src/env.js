// Continuous landscape: rolling terrain, distant mountains, and instanced set dressing
// (grass, flowers, trees, rocks, clouds). Everything repeated is an InstancedMesh.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------- noise ----------
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 4) {
  let f = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < oct; i++) {
    f += amp * valueNoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return f;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// ---------- terrain ----------
// Height is 0 inside `flat` (where scenes place props) and rolls into hills beyond it.
export function makeHeightFn({ flat = 10, hill = 5, seed = 1, cx = 0, cz = 0 } = {}) {
  const o = seed * 17.3;
  return (x, z) => {
    const d = Math.hypot(x - cx, z - cz);
    const k = smooth(flat, flat + 18, d);
    const rolling = (fbm(x * 0.035 + o, z * 0.035 - o) - 0.35) * hill * 2.2;
    const far = smooth(flat + 25, flat + 90, d) * 10 * fbm(x * 0.02 - o, z * 0.02 + o, 3);
    return Math.max(rolling, -0.4) * k + far - 0.02 * (1 - k);
  };
}

const MAT = new Map();
function stdMat(key, opts) {
  if (!MAT.has(key)) MAT.set(key, new THREE.MeshStandardMaterial(opts));
  return MAT.get(key);
}

export function terrain({ flat = 10, color = 0x8fb36a, snowFrom = null, seed = 1, size = 260 } = {}) {
  const height = makeHeightFn({ flat, seed });
  const seg = 180;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(color);
  const dry = new THREE.Color(0xc9b47a), dark = new THREE.Color(0x4f7a45), snow = new THREE.Color(0xf4f6f8), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = height(x, z);
    pos.setY(i, y);
    const n = fbm(x * 0.08 + seed, z * 0.08 - seed, 3);
    c.copy(base).lerp(dark, Math.max(0, n - 0.45) * 1.2).lerp(dry, Math.max(0, 0.42 - n) * 1.4 + Math.max(0, y - 6) * 0.04);
    if (snowFrom !== null) c.lerp(snow, smooth(snowFrom - 1.5, snowFrom + 1.5, x));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  mesh.receiveShadow = true;
  mesh.userData.height = height;
  return mesh;
}

// ---------- instanced set dressing ----------
function grassTuftGeometry() {
  const blades = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.ConeGeometry(0.035, 0.32 + i * 0.05, 3, 1, true);
    g.translate(0, (0.32 + i * 0.05) / 2, 0);
    g.rotateZ((i - 1.5) * 0.22);
    g.rotateY(i * 1.7);
    g.translate((i - 1.5) * 0.04, 0, ((i * 7) % 3 - 1) * 0.04);
    blades.push(g);
  }
  return mergeGeometries(blades);
}

let tuftGeo, flowerGeo, trunkGeo, crownGeo, pineGeo, rockGeo, puffGeo;
function geos() {
  if (tuftGeo) return;
  tuftGeo = grassTuftGeometry();
  const stem = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 3);
  stem.translate(0, 0.16, 0);
  const head = new THREE.IcosahedronGeometry(0.065, 0);
  head.translate(0, 0.34, 0);
  // stem is recoloured green via a vertex colour so one instanced mesh can hold both parts
  const stemC = new Float32Array(stem.attributes.position.count * 3).fill(0);
  for (let i = 0; i < stemC.length; i += 3) stemC.set([0.3, 0.5, 0.25], i);
  stem.setAttribute('color', new THREE.BufferAttribute(stemC, 3));
  const headC = new Float32Array(head.attributes.position.count * 3).fill(1);
  head.setAttribute('color', new THREE.BufferAttribute(headC, 3));
  flowerGeo = mergeGeometries([stem.toNonIndexed(), head.toNonIndexed()]);
  trunkGeo = new THREE.CylinderGeometry(0.1, 0.16, 1.4, 6);
  trunkGeo.translate(0, 0.7, 0);
  const crown = [new THREE.IcosahedronGeometry(0.9, 1), new THREE.IcosahedronGeometry(0.65, 1), new THREE.IcosahedronGeometry(0.6, 1)];
  crown[0].translate(0, 1.9, 0);
  crown[1].translate(0.5, 1.6, 0.2);
  crown[2].translate(-0.45, 1.65, -0.15);
  crownGeo = mergeGeometries(crown);
  const pine = [0, 1, 2].map((i) => {
    const g = new THREE.ConeGeometry(0.95 - i * 0.22, 1.1, 7);
    g.translate(0, 1.3 + i * 0.55, 0);
    return g;
  });
  pineGeo = mergeGeometries(pine);
  rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
  puffGeo = new THREE.IcosahedronGeometry(1, 1);
  // Cached across scenes: never dispose these when a scene unloads.
  for (const g of [tuftGeo, flowerGeo, trunkGeo, crownGeo, pineGeo, rockGeo, puffGeo]) g.userData.shared = true;
}

function inClear(x, z, clear) {
  for (const [cx, cz, r] of clear) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
  return false;
}

const dummy = new THREE.Object3D();
const tmpC = new THREE.Color();

// Scatters instanced vegetation over the terrain. `clear` circles ([x, z, r]) keep props readable.
export function scatter(height, { flat = 10, seed = 3, clear = [], grass = 2600, flowers = 360, trees = 90, rocks = 40, palette, snowFrom = null, night = false } = {}) {
  geos();
  const rnd = seeded(seed * 9973);
  const group = new THREE.Group();
  const snowy = (x) => snowFrom !== null && x > snowFrom;

  // grass: denser near the action, thinning toward the hills
  const grassMesh = new THREE.InstancedMesh(tuftGeo, stdMat('grass', { color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide }), grass);
  let n = 0;
  for (let tries = 0; n < grass && tries < grass * 4; tries++) {
    const r = Math.sqrt(rnd()) * (flat + 30);
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (inClear(x, z, clear) || snowy(x)) continue;
    dummy.position.set(x, height(x, z), z);
    dummy.rotation.set(0, rnd() * 6.28, 0);
    dummy.scale.setScalar(0.7 + rnd() * 0.9);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(n, dummy.matrix);
    tmpC.setHSL(0.24 + rnd() * 0.06, 0.45 + rnd() * 0.2, (night ? 0.18 : 0.3) + rnd() * 0.12);
    grassMesh.setColorAt(n, tmpC);
    n++;
  }
  grassMesh.count = n;
  grassMesh.receiveShadow = true;
  group.add(grassMesh);

  // flowers in small clusters
  const fColors = palette || [0xf2b8c6, 0xffffff, 0xf4d35e, 0xc9a0dc, 0xe8735a];
  const flowerMesh = new THREE.InstancedMesh(flowerGeo, stdMat('flower', { vertexColors: true, color: 0xffffff, roughness: 0.7 }), flowers);
  n = 0;
  for (let tries = 0; n < flowers && tries < flowers * 6;) {
    const r = flat * 0.4 + rnd() * (flat + 14);
    const a = rnd() * Math.PI * 2;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const col = fColors[Math.floor(rnd() * fColors.length)];
    for (let k = 0; k < 6 && n < flowers; k++, tries++) {
      const x = cx + (rnd() - 0.5) * 1.6, z = cz + (rnd() - 0.5) * 1.6;
      if (inClear(x, z, clear) || snowy(x)) continue;
      dummy.position.set(x, height(x, z), z);
      dummy.rotation.set(0, rnd() * 6.28, 0);
      dummy.scale.setScalar(0.8 + rnd() * 0.6);
      dummy.updateMatrix();
      flowerMesh.setMatrixAt(n, dummy.matrix);
      flowerMesh.setColorAt(n, tmpC.setHex(col));
      n++;
    }
  }
  flowerMesh.count = n;
  group.add(flowerMesh);

  // forest ring: round and pine trees share instanced trunks
  const trunks = new THREE.InstancedMesh(trunkGeo, stdMat('trunk', { color: 0x5e3b27, roughness: 0.9 }), trees);
  const crowns = new THREE.InstancedMesh(crownGeo, stdMat('crown', { color: 0xffffff, roughness: 0.85, flatShading: true }), trees);
  const pines = new THREE.InstancedMesh(pineGeo, stdMat('pine', { color: 0xffffff, roughness: 0.85, flatShading: true }), trees);
  let nt = 0, nc = 0, np = 0;
  for (let tries = 0; nt < trees && tries < trees * 8; tries++) {
    const r = flat + 3 + Math.pow(rnd(), 0.7) * 55;
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (inClear(x, z, clear)) continue;
    const s = 0.8 + rnd() * 1.1;
    dummy.position.set(x, height(x, z) - 0.05, z);
    dummy.rotation.set(0, rnd() * 6.28, 0);
    dummy.scale.set(s, s * (0.9 + rnd() * 0.4), s);
    dummy.updateMatrix();
    trunks.setMatrixAt(nt++, dummy.matrix);
    const isPine = snowy(x) || rnd() < 0.35;
    if (isPine) {
      pines.setMatrixAt(np, dummy.matrix);
      pines.setColorAt(np++, tmpC.setHSL(0.36 + rnd() * 0.05, 0.35, night ? 0.14 : 0.24 + rnd() * 0.06));
    } else {
      crowns.setMatrixAt(nc, dummy.matrix);
      const autumn = rnd() < 0.12;
      crowns.setColorAt(nc++, autumn ? tmpC.setHSL(0.08 + rnd() * 0.05, 0.6, 0.45) : tmpC.setHSL(0.22 + rnd() * 0.08, 0.45, night ? 0.16 : 0.3 + rnd() * 0.1));
    }
  }
  trunks.count = nt; crowns.count = nc; pines.count = np;
  for (const m of [trunks, crowns, pines]) { m.castShadow = true; m.receiveShadow = true; }
  group.add(trunks, crowns, pines);

  const rockMesh = new THREE.InstancedMesh(rockGeo, stdMat('rock', { color: 0xffffff, roughness: 1, flatShading: true }), rocks);
  n = 0;
  for (let tries = 0; n < rocks && tries < rocks * 6; tries++) {
    const r = flat * 0.7 + rnd() * 40;
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (inClear(x, z, clear)) continue;
    const s = 0.2 + rnd() * rnd() * 1.4;
    dummy.position.set(x, height(x, z) + s * 0.1, z);
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    dummy.scale.set(s * 1.3, s * 0.7, s);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(n, dummy.matrix);
    rockMesh.setColorAt(n++, tmpC.setHSL(0.1, 0.05, 0.5 + rnd() * 0.15));
  }
  rockMesh.count = n;
  rockMesh.castShadow = true;
  group.add(rockMesh);

  for (const m of group.children) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false; // instances span the whole world
  }
  return group;
}

// Distant mountain ranges as real geometry so fog gives aerial perspective.
export function mountains({ seed = 5, color = 0x6f8a86, radius = 120, count = 22, snowCaps = true } = {}) {
  const rnd = seeded(seed * 131);
  const base = new THREE.ConeGeometry(1, 1, 9, 4);
  base.translate(0, 0.5, 0);
  const p = base.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const wob = 1 + (hash2(p.getX(i) * 3.1, p.getZ(i) * 2.7) - 0.5) * 0.35 * (1 - y);
    p.setX(i, p.getX(i) * wob);
    p.setZ(i, p.getZ(i) * wob);
  }
  base.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(base, stdMat('mountain' + color, { color, roughness: 1, flatShading: true }), count);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rnd() * 0.2;
    const r = radius * (0.85 + rnd() * 0.35);
    const h = 9 + rnd() * 16;
    dummy.position.set(Math.cos(a) * r, -3, Math.sin(a) * r);
    dummy.rotation.set(0, rnd() * 6, 0);
    dummy.scale.set(h * (1.6 + rnd() * 1.2), h, h * (1.6 + rnd() * 1.2));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, tmpC.setHex(color).offsetHSL(0, 0, (rnd() - 0.5) * 0.08));
  }
  mesh.frustumCulled = false;
  return mesh;
}

// Clouds: one instanced mesh of soft puffs, grouped into drifting clusters.
export function clouds({ count = 14, seed = 2, height = 26, color = 0xffffff, spread = 90 } = {}) {
  geos();
  const rnd = seeded(seed * 71);
  const perCloud = 6;
  const mesh = new THREE.InstancedMesh(puffGeo, stdMat('cloud' + color, { color, roughness: 1, emissive: color, emissiveIntensity: 0.25, flatShading: true }), count * perCloud);
  const centers = [];
  let n = 0;
  for (let c = 0; c < count; c++) {
    const a = rnd() * Math.PI * 2, r = 35 + rnd() * spread;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r, cy = height + rnd() * 10;
    const s = 2 + rnd() * 2.5;
    centers.push({ cx, cy, cz, s, start: n });
    for (let k = 0; k < perCloud; k++) {
      dummy.position.set(cx + (k - 2.5) * s * 0.55, cy + (rnd() - 0.3) * s * 0.4, cz + (rnd() - 0.5) * s * 0.6);
      dummy.scale.set(s * (0.6 + rnd() * 0.5), s * (0.35 + rnd() * 0.2), s * (0.5 + rnd() * 0.3));
      dummy.rotation.set(0, rnd() * 6, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(n++, dummy.matrix);
    }
  }
  mesh.frustumCulled = false;
  mesh.userData.drift = (t) => {
    mesh.position.x = Math.sin(t * 0.01) * 8;
  };
  return mesh;
}

export function stars(count = 700, radius = 150) {
  const rnd = seeded(99);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rnd(), v = rnd() * 0.45 + 0.05;
    const th = u * Math.PI * 2, ph = Math.acos(1 - v);
    pos.set([Math.sin(ph) * Math.cos(th) * radius, Math.cos(ph) * radius, Math.sin(ph) * Math.sin(th) * radius], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.85 }));
}

// Instanced fence: every post and rail of a fence is two draw calls.
export function instancedFence(points, { color = 0x8a5a3b, postH = 0.6, spacing = 0.4 } = {}) {
  const posts = [], rails = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]);
    const len = a.distanceTo(b), n = Math.max(1, Math.round(len / spacing));
    for (let k = 0; k <= n; k++) posts.push(a.clone().lerp(b, k / n));
    rails.push([a, b, len]);
  }
  const g = new THREE.Group();
  const mat = stdMat('fence' + color, { color, roughness: 0.9 });
  const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, postH, 0.08), mat, posts.length);
  posts.forEach((p, i) => { dummy.position.set(p.x, postH / 2, p.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); pm.setMatrixAt(i, dummy.matrix); });
  const rm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.06, 0.05), mat, rails.length * 2);
  rails.forEach(([a, b, len], i) => {
    for (const [k, y] of [[0, 0.2], [1, 0.45]]) {
      dummy.position.set((a.x + b.x) / 2, y * (postH / 0.6), (a.z + b.z) / 2);
      dummy.rotation.set(0, -Math.atan2(b.z - a.z, b.x - a.x), 0);
      dummy.scale.set(len, 1, 1);
      dummy.updateMatrix();
      rm.setMatrixAt(i * 2 + k, dummy.matrix);
    }
  });
  pm.castShadow = rm.castShadow = true;
  g.add(pm, rm);
  return g;
}

export function sharedMaterial(m) { return [...MAT.values()].includes(m); }
