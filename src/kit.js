// Shared low-poly "paper storybook" building blocks for every scene.
import * as THREE from 'three';
import { ASSETS } from './assets.js';
import { terrain, scatter, mountains, clouds, instancedFence, sharedMaterial } from './env.js';

export const C = {
  paper: 0xf3e9d6,
  ink: 0x2b2622,
  vermilion: 0xc8402f,
  red: 0xb8372b,
  jade: 0x5f9e84,
  jadeLight: 0x9fd4b8,
  gold: 0xd9a441,
  pine: 0x3f6b4f,
  leaf: 0x6f9a5b,
  blossom: 0xf2b8c6,
  wood: 0x8a5a3b,
  woodDark: 0x5e3b27,
  wall: 0xeee2c8,
  roof: 0x3d4a57,
  skin: 0xf6d2b2,
  hair: 0x1f1b1a,
  earth: 0xcdb58c,
  grass: 0x86b55e,
  snow: 0xf7f7f4,
  pear: 0xe3cf5a,
  sky: 0xa9cfd8,
};

// ---------- materials ----------
// Physically based (not toon) shading so light, shadow and haze read as a real place.
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.unique && matCache.has(key)) return matCache.get(key);
  const { unique, ...rest } = opts;
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...rest });
  if (!unique) matCache.set(key, m);
  return m;
}
export function glowMat(color, intensity = 1) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });
}

export function mesh(geo, material, { shadow = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = shadow;
  m.receiveShadow = receive;
  return m;
}

export function at(obj, x = 0, y = 0, z = 0, ry = 0, s = 1) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  if (s !== 1) obj.scale.setScalar(s);
  return obj;
}

// ---------- canvas helpers ----------
export const FONT_BRUSH = '"Ma Shan Zheng", "Kaiti SC", "STKaiti", "KaiTi", serif';
export const FONT_SERIF = '"Noto Serif SC", "Songti SC", serif';

export function textTexture(text, {
  size = 256, color = '#2b2622', bg = null, font = FONT_BRUSH, weight = '400', vertical = false, pad = 0.12, width, height,
} = {}) {
  const chars = [...text];
  const w = width || (vertical ? size : size * chars.length);
  const h = height || (vertical ? size * chars.length : size);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${weight} ${Math.floor(size * (1 - pad * 2))}px ${font}`;
  chars.forEach((ch, i) => {
    const x = vertical ? w / 2 : size * (i + 0.5);
    const y = vertical ? size * (i + 0.5) : h / 2;
    g.fillText(ch, x, y + size * 0.03);
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function textPlane(text, height = 1, opts = {}) {
  const tex = textTexture(text, opts);
  const aspect = tex.image.width / tex.image.height;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(height * aspect, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  );
  return m;
}

let glowTex;
export function glowTexture() {
  if (glowTex) return glowTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(cv);
  return glowTex;
}

export function glowSprite(color, scale = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  s.scale.setScalar(scale);
  return s;
}

// ---------- environment ----------
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = mulberry(7);

// Distant 3D mountains and instanced clouds. Dark `colors` (night scenes) dim both.
export function backdrop({ colors = ['#5f8a7e'], seedBase = 3 } = {}) {
  const g = new THREE.Group();
  const c = new THREE.Color(colors[0]);
  const dark = c.getHSL({}).l < 0.3;
  g.add(mountains({ seed: seedBase, color: dark ? 0x2a3444 : c.getHex(), radius: 150 }));
  g.add(mountains({ seed: seedBase + 7, color: dark ? 0x1f2735 : new THREE.Color(c).offsetHSL(0, 0.02, -0.08).getHex(), radius: 200, count: 26 }));
  const cl = clouds({ seed: seedBase, color: dark ? 0x6a7088 : 0xffffff, count: dark ? 8 : 14 });
  g.add(cl);
  g.userData.tick = (t) => cl.userData.drift(t);
  return g;
}

// Continuous landscape: flat where the scene happens, rolling hills and instanced
// vegetation beyond. A non-grass `color` becomes a courtyard/earth patch in the middle.
export function ground({ radius = 14, color = C.grass, clear, night = false, snowFrom = null, seed = 1, grass, trees, flowers } = {}) {
  const g = new THREE.Group();
  const t = terrain({ flat: radius, seed, snowFrom, color: night ? 0x3f5a3c : C.grass });
  g.add(t);
  const height = t.userData.height;
  if (color !== C.grass) {
    const shape = new THREE.Shape();
    const r = radius * 0.72;
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = r * (0.9 + 0.1 * Math.sin(a * 5 + seed) * Math.cos(a * 3));
      i ? shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const patch = mesh(new THREE.ShapeGeometry(shape, 8), mat(color, { roughness: 1 }), { shadow: false, receive: true });
    patch.rotation.x = -Math.PI / 2;
    patch.position.y = 0.01;
    g.add(patch);
  }
  const clearZones = clear ?? [[0, 0, color !== C.grass ? radius * 0.75 : radius * 0.45]];
  g.add(scatter(height, { flat: radius, seed: seed + 3, clear: clearZones, snowFrom, night, grass, trees, flowers }));
  g.userData.height = height;
  return g;
}

export function cloud(scale = 1, color = 0xffffff) {
  const g = new THREE.Group();
  const m = mat(color);
  const puffs = [[0, 0, 0, 1], [0.9, -0.1, 0.1, 0.75], [-0.9, -0.15, 0, 0.7], [0.4, 0.35, -0.1, 0.7], [-0.35, 0.3, 0.2, 0.6]];
  for (const [x, y, z, s] of puffs) {
    const p = mesh(new THREE.IcosahedronGeometry(s, 1), m, { shadow: false });
    p.position.set(x, y, z);
    p.scale.y = 0.7;
    g.add(p);
  }
  g.scale.setScalar(scale);
  return g;
}

// Auspicious swirl cloud (祥云) as a flat decorative shape.
export function xiangyun(color = C.gold, scale = 1) {
  const s = new THREE.Shape();
  s.moveTo(-1.2, 0);
  s.bezierCurveTo(-1.2, 0.6, -0.4, 0.7, -0.35, 0.25);
  s.bezierCurveTo(-0.2, 0.9, 0.7, 0.9, 0.6, 0.2);
  s.bezierCurveTo(1.2, 0.4, 1.4, -0.2, 1.0, -0.25);
  s.lineTo(-1.2, -0.25);
  s.closePath();
  const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), mat(color), { shadow: false });
  m.scale.setScalar(scale);
  return m;
}

// ---------- vegetation ----------
export function tree({ kind = 'round', h = 2.4, color } = {}) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.1 * h / 2.4, 0.16 * h / 2.4, h * 0.55, 7), mat(C.woodDark));
  trunk.position.y = h * 0.275;
  g.add(trunk);
  if (kind === 'pine') {
    const c = color ?? C.pine;
    for (let i = 0; i < 3; i++) {
      const cone = mesh(new THREE.ConeGeometry(h * (0.42 - i * 0.1), h * 0.42, 8), mat(c, { flatShading: true }));
      cone.position.y = h * (0.5 + i * 0.2);
      g.add(cone);
    }
  } else {
    const c = color ?? (kind === 'blossom' ? C.blossom : C.leaf);
    const blobs = [[0, 0.78, 0, 0.42], [0.28, 0.66, 0.1, 0.3], [-0.26, 0.68, -0.08, 0.32], [0.05, 0.95, -0.1, 0.28]];
    for (const [x, y, z, s] of blobs) {
      const b = mesh(new THREE.IcosahedronGeometry(s * h, 1), mat(c, { flatShading: true }));
      b.position.set(x * h, y * h, z * h);
      g.add(b);
    }
  }
  return g;
}

export function bush(color = C.leaf, s = 0.5) {
  const b = mesh(new THREE.IcosahedronGeometry(s, 0), mat(color));
  b.scale.y = 0.7;
  b.position.y = s * 0.4;
  return b;
}

export function flower(color = C.blossom) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), mat(C.pine), { shadow: false });
  stem.position.y = 0.175;
  const head = mesh(new THREE.IcosahedronGeometry(0.08, 0), mat(color), { shadow: false });
  head.position.y = 0.37;
  g.add(stem, head);
  return g;
}

export function rock(s = 0.5, color = 0x9a9a92) {
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), mat(color));
  r.scale.set(1, 0.6, 0.8);
  r.position.y = s * 0.3;
  return r;
}

// ---------- architecture ----------
function roofGeometry(w, d, h) {
  // Profile with concave slopes and upturned eaves, extruded along the ridge.
  const s = new THREE.Shape();
  const hw = d / 2 + 0.35;
  s.moveTo(-hw - 0.15, 0.12);
  s.quadraticCurveTo(-hw * 0.55, -0.02, 0, h);
  s.quadraticCurveTo(hw * 0.55, -0.02, hw + 0.15, 0.12);
  s.lineTo(hw, -0.05);
  s.lineTo(-hw, -0.05);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: w + 0.6, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -(w + 0.6) / 2);
  geo.rotateY(Math.PI / 2);
  return geo;
}

// Hall built in Blender (blender/build_hall.py): 3.2 x 2.0 body, 1.7 tall walls, front faces +z.
const HALL = { w: 3.2, d: 2.0, h: 1.7, plaque: new THREE.Vector3(0, 1.66, 1.36) };

export function house(opts = {}) {
  const { w = 3, d = 2.2, h = 1.6, wall = C.wall, roof = C.roof, pillar = C.red, plaque } = opts;
  if (!ASSETS.hall) {
    const g = proceduralHouse(opts);
    if (plaque) g.add(plaqueSign(plaque, new THREE.Vector3(0, 0.2 + h - 0.2, d / 2 + 0.12)));
    return g;
  }
  const g = new THREE.Group();
  const model = ASSETS.hall.clone(true);
  const roofC = new THREE.Color(roof);
  const colors = {
    Wall: wall, Roof: roof, Ridge: roofC.clone().multiplyScalar(0.72).getHex(), Pillar: pillar,
    Lattice: new THREE.Color(pillar).multiplyScalar(0.75).getHex(), Trim: C.gold, Door: 0x7a3b2a, Paper: 0xf6efdc, Base: 0xb9ab93,
  };
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.material = mat(colors[o.material.name] ?? 0xcccccc);
    o.castShadow = true;
    o.receiveShadow = true;
  });
  model.scale.set(w / HALL.w, h / HALL.h, d / HALL.d);
  g.add(model);
  if (plaque) g.add(plaqueSign(plaque, HALL.plaque.clone().multiply(model.scale)));
  g.userData.height = model.scale.y * 3.3;
  return g;
}

function plaqueSign(text, pos) {
  const p = textPlane(text, 0.34, { color: '#f5d77a', bg: '#3a2a20', size: 160 });
  p.position.copy(pos);
  return p;
}

function proceduralHouse({ w = 3, d = 2.2, h = 1.6, wall = C.wall, roof = C.roof, pillar = C.red, door = true, windows = true } = {}) {
  const g = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(w + 0.3, 0.2, d + 0.3), mat(0xb9ab93), { receive: true });
  base.position.y = 0.1;
  const body = mesh(new THREE.BoxGeometry(w, h, d), mat(wall), { receive: true });
  body.position.y = 0.2 + h / 2;
  g.add(base, body);
  for (const x of [-w / 2, w / 2]) {
    for (const z of [d / 2]) {
      const p = mesh(new THREE.CylinderGeometry(0.08, 0.08, h, 8), mat(pillar));
      p.position.set(x, 0.2 + h / 2, z + 0.02);
      g.add(p);
    }
  }
  const beam = mesh(new THREE.BoxGeometry(w + 0.2, 0.16, 0.12), mat(pillar));
  beam.position.set(0, 0.2 + h - 0.08, d / 2 + 0.04);
  g.add(beam);
  const r = mesh(roofGeometry(w, d, 1.1), mat(roof));
  r.position.y = 0.2 + h;
  g.add(r);
  const ridge = mesh(new THREE.BoxGeometry(w + 0.7, 0.12, 0.14), mat(roof));
  ridge.position.y = 0.2 + h + 1.12;
  g.add(ridge);
  if (door) {
    const dr = mesh(new THREE.BoxGeometry(w * 0.26, h * 0.7, 0.05), mat(C.woodDark));
    dr.position.set(0, 0.2 + h * 0.35, d / 2 + 0.03);
    g.add(dr);
    g.userData.door = dr;
  }
  if (windows) {
    for (const x of [-w * 0.32, w * 0.32]) {
      const wn = mesh(new THREE.CircleGeometry(h * 0.18, 20), mat(0x6b4a33), { shadow: false });
      wn.position.set(x, 0.2 + h * 0.55, d / 2 + 0.03);
      g.add(wn);
      const lattice = mesh(new THREE.RingGeometry(h * 0.16, h * 0.18, 20), mat(pillar), { shadow: false });
      lattice.position.copy(wn.position).z += 0.005;
      g.add(lattice);
    }
  }
  g.userData.height = 0.2 + h + 1.2;
  return g;
}

export function fence(length = 4, color = C.wood) {
  return instancedFence([[-length / 2, 0, 0], [length / 2, 0, 0]], { color });
}

export function table(w = 1.6, d = 0.9, h = 0.55, color = C.wood) {
  const g = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(w, 0.08, d), mat(color), { receive: true });
  top.position.y = h;
  g.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = mesh(new THREE.BoxGeometry(0.08, h, 0.08), mat(C.woodDark));
    leg.position.set(x * (w / 2 - 0.08), h / 2, z * (d / 2 - 0.08));
    g.add(leg);
  }
  g.userData.top = h + 0.04;
  return g;
}

export function book({ w = 0.5, d = 0.36, open = true, cover = 0x3d5a80 } = {}) {
  const g = new THREE.Group();
  if (open) {
    for (const side of [-1, 1]) {
      const page = mesh(new THREE.BoxGeometry(w / 2, 0.03, d), mat(0xfbf5e6));
      page.position.set(side * w / 4, 0.03, 0);
      page.rotation.z = -side * 0.08;
      g.add(page);
      for (let i = 0; i < 4; i++) {
        const line = mesh(new THREE.BoxGeometry(0.01, 0.005, d * 0.8), mat(C.ink), { shadow: false });
        line.position.set(side * (w / 4) + (i - 1.5) * 0.045, 0.05 + (side > 0 ? -0.005 : 0) + Math.abs(i - 1.5) * 0.003 * side, 0);
        line.rotation.z = -side * 0.08;
        g.add(line);
      }
    }
    const cv = mesh(new THREE.BoxGeometry(w + 0.04, 0.015, d + 0.04), mat(cover));
    g.add(cv);
  } else {
    const b = mesh(new THREE.BoxGeometry(w / 2, 0.08, d), mat(cover));
    b.position.y = 0.04;
    g.add(b);
  }
  return g;
}

// ---------- people ----------
// kind: 'child' | 'woman' | 'man' | 'elder'
export function figure({ kind = 'child', robe = C.vermilion, sash = C.gold, skin = C.skin, hair = C.hair, trim = 0xfbf3e2 } = {}) {
  const g = new THREE.Group();
  const isChild = kind === 'child';
  const H = isChild ? 1.0 : 1.55;
  const headR = isChild ? 0.27 : 0.25;

  const body = new THREE.Group();
  g.add(body);
  const robeGeo = new THREE.CylinderGeometry(H * 0.13, H * 0.26, H * 0.62, 12);
  const torso = mesh(robeGeo, mat(robe));
  torso.position.y = H * 0.31;
  body.add(torso);
  const collar = mesh(new THREE.TorusGeometry(H * 0.12, 0.03, 6, 16), mat(trim));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = H * 0.615;
  body.add(collar);
  const belt = mesh(new THREE.CylinderGeometry(H * 0.18, H * 0.185, 0.07, 12), mat(sash));
  belt.position.y = H * 0.4;
  body.add(belt);
  for (const x of [-0.08, 0.08]) {
    const shoe = mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(C.ink));
    shoe.scale.set(1, 0.6, 1.5);
    shoe.position.set(x * H, 0.03, 0.12 * H);
    body.add(shoe);
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * H * 0.14, H * 0.58, 0);
    const sleeve = mesh(new THREE.CylinderGeometry(0.06, 0.1, H * 0.32, 8), mat(robe));
    sleeve.position.y = -H * 0.16;
    const hand = mesh(new THREE.SphereGeometry(0.055, 8, 6), mat(skin));
    hand.position.y = -H * 0.34;
    pivot.add(sleeve, hand);
    pivot.rotation.z = side * 0.18;
    body.add(pivot);
    arms.push(pivot);
  }

  const head = new THREE.Group();
  head.position.y = H * 0.62 + headR * 0.95;
  body.add(head);
  const face = mesh(new THREE.SphereGeometry(headR, 20, 16), mat(skin));
  head.add(face);
  const hairCap = mesh(new THREE.SphereGeometry(headR * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(hair));
  hairCap.rotation.x = -0.35;
  hairCap.position.set(0, 0.01, -0.02);
  head.add(hairCap);
  if (isChild) {
    for (const side of [-1, 1]) {
      const bun = mesh(new THREE.SphereGeometry(headR * 0.36, 12, 10), mat(hair));
      bun.position.set(side * headR * 0.7, headR * 0.72, -0.02);
      head.add(bun);
      const tie = mesh(new THREE.TorusGeometry(headR * 0.28, 0.02, 6, 12), mat(C.red));
      tie.position.copy(bun.position).y -= headR * 0.18;
      tie.rotation.x = Math.PI / 2;
      head.add(tie);
    }
  } else if (kind === 'woman') {
    const bun = mesh(new THREE.SphereGeometry(headR * 0.5, 12, 10), mat(hair));
    bun.position.set(0, headR * 0.6, -headR * 0.55);
    head.add(bun);
    const pin = mesh(new THREE.CylinderGeometry(0.012, 0.012, headR * 1.6, 6), mat(C.gold));
    pin.rotation.z = Math.PI / 2.6;
    pin.position.copy(bun.position);
    head.add(pin);
  } else {
    const knot = mesh(new THREE.CylinderGeometry(headR * 0.22, headR * 0.28, headR * 0.45, 10), mat(kind === 'elder' ? 0xd8d4cc : hair));
    knot.position.set(0, headR * 1.05, -0.02);
    head.add(knot);
    if (kind === 'elder') {
      hairCap.material = mat(0xd8d4cc);
      const beard = mesh(new THREE.ConeGeometry(headR * 0.4, headR * 1.2, 8), mat(0xeeeeea));
      beard.rotation.x = Math.PI;
      beard.position.set(0, -headR * 0.85, headR * 0.55);
      head.add(beard);
    }
  }
  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(headR * 0.08, 8, 6), mat(C.ink), { shadow: false });
    eye.position.set(side * headR * 0.36, headR * 0.05, headR * 0.93);
    eye.scale.y = 1.4;
    head.add(eye);
    const cheek = mesh(new THREE.CircleGeometry(headR * 0.12, 12), new THREE.MeshBasicMaterial({ color: 0xf2a0a0, transparent: true, opacity: 0.7 }), { shadow: false });
    cheek.position.set(side * headR * 0.55, -headR * 0.22, headR * 0.83);
    cheek.lookAt(cheek.position.clone().multiplyScalar(2));
    head.add(cheek);
  }
  const mouth = mesh(new THREE.TorusGeometry(headR * 0.1, 0.012, 4, 10, Math.PI), mat(0x9a4a3a), { shadow: false });
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -headR * 0.3, headR * 0.96);
  head.add(mouth);

  g.userData = { body, head, arms, H, phase: rng() * 10 };
  return g;
}

// Idle breathing / bobbing. `mode` adds simple gestures.
export function animateFigure(f, t, mode = 'idle') {
  const { body, head, arms, phase } = f.userData;
  const k = t + phase;
  body.position.y = 0;
  body.rotation.z = 0;
  head.rotation.set(Math.sin(k * 0.8) * 0.04, Math.sin(k * 0.5) * 0.12, 0);
  arms[0].rotation.set(0, 0, -0.18);
  arms[1].rotation.set(0, 0, 0.18);
  body.scale.y = 1 + Math.sin(k * 2) * 0.012;
  if (mode === 'walk') {
    body.position.y = Math.abs(Math.sin(k * 8)) * 0.06;
    arms[0].rotation.x = Math.sin(k * 8) * 0.6;
    arms[1].rotation.x = -Math.sin(k * 8) * 0.6;
  } else if (mode === 'wave') {
    arms[1].rotation.z = 2.4 + Math.sin(k * 7) * 0.35;
  } else if (mode === 'read') {
    head.rotation.x = 0.35;
    arms[0].rotation.set(-1.1, 0, -0.35);
    arms[1].rotation.set(-1.1, 0, 0.35);
  } else if (mode === 'offer') {
    arms[1].rotation.set(-1.3, 0, 0.1);
  } else if (mode === 'bow') {
    body.rotation.x = 0.35 + Math.sin(k * 1.5) * 0.05;
    arms[0].rotation.set(-1.2, 0, -0.5);
    arms[1].rotation.set(-1.2, 0, 0.5);
  } else if (mode === 'cheer') {
    body.position.y = Math.abs(Math.sin(k * 5)) * 0.15;
    arms[0].rotation.z = -2.5 + Math.sin(k * 5) * 0.2;
    arms[1].rotation.z = 2.5 - Math.sin(k * 5) * 0.2;
  } else if (mode === 'call') {
    arms[0].rotation.set(-0.3, 0, -1.9);
    arms[1].rotation.set(-0.3, 0, 1.9 + Math.sin(k * 6) * 0.25);
  } else if (mode === 'sleep') {
    head.rotation.z = 0.25;
  }
}

// ---------- props ----------
export function lantern({ color = C.red, label = '', lit = true, scale = 1 } = {}) {
  const g = new THREE.Group();
  const bodyMat = lit ? new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.55 }) : mat(color);
  const b = mesh(new THREE.SphereGeometry(0.5, 20, 14), bodyMat);
  b.scale.set(1, 0.85, 1);
  g.add(b);
  for (const y of [0.42, -0.42]) {
    const cap = mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.1, 16), mat(C.gold));
    cap.position.y = y;
    g.add(cap);
  }
  for (let i = 0; i < 6; i++) {
    const rib = mesh(new THREE.TorusGeometry(0.5, 0.008, 4, 24, Math.PI), mat(C.gold), { shadow: false });
    rib.rotation.y = (i / 6) * Math.PI;
    rib.rotation.z = Math.PI / 2;
    rib.scale.set(0.85, 1, 1);
    g.add(rib);
  }
  const tassel = mesh(new THREE.CylinderGeometry(0.02, 0.07, 0.45, 6), mat(C.red));
  tassel.position.y = -0.7;
  g.add(tassel);
  const string = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), mat(C.ink), { shadow: false });
  string.position.y = 0.75;
  g.add(string);
  if (label) {
    const n = [...label].length;
    const tp = textPlane(label, Math.min(0.24 * n, 0.72), { color: '#fff4c8', vertical: true, size: 128 });
    tp.position.z = 0.51;
    g.add(tp);
  }
  if (lit) {
    const glow = glowSprite(0xffb070, 2.4, 0.55);
    g.add(glow);
  }
  g.scale.setScalar(scale);
  return g;
}

export function scroll({ width = 3, height = 1.6, text = '', color = '#2b2622' } = {}) {
  const g = new THREE.Group();
  const paper = mesh(new THREE.PlaneGeometry(width, height), mat(0xf8f0dc, { side: THREE.DoubleSide }), { shadow: false, receive: true });
  g.add(paper);
  for (const x of [-width / 2, width / 2]) {
    const rod = mesh(new THREE.CylinderGeometry(0.07, 0.07, height + 0.3, 12), mat(C.woodDark));
    rod.position.x = x;
    g.add(rod);
    for (const y of [1, -1]) {
      const knob = mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(C.gold));
      knob.position.set(x, y * (height / 2 + 0.17), 0);
      g.add(knob);
    }
  }
  if (text) {
    const tp = textPlane(text, height * 0.55, { color, size: 200 });
    const maxW = width * 0.9;
    const tw = tp.geometry.parameters.width;
    if (tw > maxW) tp.scale.setScalar(maxW / tw);
    tp.position.z = 0.01;
    g.add(tp);
  }
  return g;
}

export function particles({ count = 100, color = 0xffffff, size = 0.15, box = [10, 5, 10], center = [0, 2.5, 0], additive = true, opacity = 1 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + (rng() - 0.5) * box[0];
    pos[i * 3 + 1] = center[1] + (rng() - 0.5) * box[1];
    pos[i * 3 + 2] = center[2] + (rng() - 0.5) * box[2];
    seeds[i] = rng() * 100;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color, size, map: glowTexture(), transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false,
  });
  const p = new THREE.Points(geo, m);
  p.userData = { seeds, base: pos.slice(), box, center };
  return p;
}

// ---------- animals ----------
export function dog(color = 0xd9a45a) {
  const g = new THREE.Group();
  const m = mat(color);
  const body = mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 10), m);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.42;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(0.45, 0.68, 0);
  g.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.2, 12, 10), m);
  const snout = mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(0xf1d8b0));
  snout.position.set(0.17, -0.05, 0);
  const nose = mesh(new THREE.SphereGeometry(0.035, 6, 6), mat(C.ink));
  nose.position.set(0.26, -0.02, 0);
  head.add(skull, snout, nose);
  for (const z of [-0.1, 0.1]) {
    const ear = mesh(new THREE.ConeGeometry(0.07, 0.18, 6), mat(0xb07d3e));
    ear.position.set(-0.02, 0.2, z);
    head.add(ear);
    const eye = mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(C.ink), { shadow: false });
    eye.position.set(0.14, 0.05, z * 0.8);
    head.add(eye);
  }
  for (const [x, z] of [[-0.25, -0.12], [-0.25, 0.12], [0.25, -0.12], [0.25, 0.12]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 6), m);
    leg.position.set(x, 0.16, z);
    g.add(leg);
  }
  const tail = mesh(new THREE.ConeGeometry(0.05, 0.3, 6), m);
  tail.position.set(-0.45, 0.6, 0);
  tail.rotation.z = 0.8;
  g.add(tail);
  g.userData = { head, tail };
  return g;
}

export function rooster() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.3, 14, 10), mat(0xf4efe4));
  body.scale.set(1.2, 1, 0.9);
  body.position.y = 0.5;
  g.add(body);
  const neck = new THREE.Group();
  neck.position.set(0.25, 0.75, 0);
  g.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xf4efe4));
  neck.add(head);
  const comb = mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), mat(C.vermilion));
  comb.position.set(0, 0.14, 0);
  const wattle = mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(C.vermilion));
  wattle.position.set(0.08, -0.12, 0);
  const beak = mesh(new THREE.ConeGeometry(0.04, 0.12, 6), mat(C.gold));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.17, 0, 0);
  neck.add(comb, wattle, beak);
  for (const z of [-0.07, 0.07]) {
    const eye = mesh(new THREE.SphereGeometry(0.02, 6, 6), mat(C.ink), { shadow: false });
    eye.position.set(0.09, 0.03, z);
    neck.add(eye);
  }
  const tailCols = [0x2f6b5b, 0xb8372b, 0x2b2622];
  tailCols.forEach((c, i) => {
    const f = mesh(new THREE.ConeGeometry(0.08, 0.5, 6), mat(c));
    f.position.set(-0.4, 0.75 + i * 0.05, (i - 1) * 0.08);
    f.rotation.z = 0.7 + i * 0.25;
    g.add(f);
  });
  for (const z of [-0.08, 0.08]) {
    const leg = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), mat(C.gold));
    leg.position.set(0, 0.13, z);
    g.add(leg);
  }
  g.userData = { neck };
  return g;
}

export function pig() {
  const g = new THREE.Group();
  const m = mat(0xf0b6b0);
  const body = mesh(new THREE.SphereGeometry(0.4, 14, 10), m);
  body.scale.set(1.3, 0.95, 0.95);
  body.position.y = 0.45;
  g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.25, 12, 10), m);
  head.position.set(0.5, 0.55, 0);
  g.add(head);
  const snout = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), mat(0xe29890));
  snout.rotation.z = Math.PI / 2;
  snout.position.set(0.74, 0.52, 0);
  g.add(snout);
  for (const z of [-0.12, 0.12]) {
    const ear = mesh(new THREE.ConeGeometry(0.07, 0.14, 4), m);
    ear.position.set(0.48, 0.8, z);
    ear.rotation.x = z > 0 ? 0.4 : -0.4;
    g.add(ear);
    const eye = mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(C.ink), { shadow: false });
    eye.position.set(0.68, 0.62, z * 0.9);
    g.add(eye);
  }
  for (const [x, z] of [[-0.25, -0.18], [-0.25, 0.18], [0.25, -0.18], [0.25, 0.18]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 6), m);
    leg.position.set(x, 0.1, z);
    g.add(leg);
  }
  return g;
}

export function bee() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(C.gold));
  body.scale.set(1.4, 1, 1);
  g.add(body);
  for (const x of [-0.05, 0.06]) {
    const stripe = mesh(new THREE.TorusGeometry(0.105, 0.02, 4, 12), mat(C.ink), { shadow: false });
    stripe.rotation.y = Math.PI / 2;
    stripe.position.x = x;
    g.add(stripe);
  }
  const wings = [];
  for (const z of [-1, 1]) {
    const w = mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }), { shadow: false });
    w.position.set(0, 0.1, z * 0.08);
    w.rotation.x = Math.PI / 2 + z * 0.4;
    g.add(w);
    wings.push(w);
  }
  g.userData.wings = wings;
  return g;
}

export function silkworm() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const seg = mesh(new THREE.SphereGeometry(0.06 - Math.abs(i - 2) * 0.005, 8, 6), mat(0xf6f3ea));
    seg.position.x = i * 0.08;
    g.add(seg);
  }
  return g;
}

export function pear(scale = 1) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const r = 0.18 * Math.sin(Math.PI * t) * (1 - 0.45 * t) + 0.03 * Math.sin(Math.PI * t);
    pts.push(new THREE.Vector2(Math.max(r, 0.001), t * 0.42));
  }
  const body = mesh(new THREE.LatheGeometry(pts, 14), mat(C.pear));
  g.add(body);
  const stem = mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.08, 4), mat(C.woodDark));
  stem.position.y = 0.45;
  stem.rotation.z = 0.25;
  const leaf = mesh(new THREE.SphereGeometry(0.04, 6, 4), mat(C.leaf));
  leaf.scale.set(1.6, 0.3, 0.8);
  leaf.position.set(0.05, 0.47, 0);
  g.add(stem, leaf);
  g.scale.setScalar(scale);
  return g;
}

export function crane() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.25, 10, 8), mat(0xffffff));
  body.scale.set(1.8, 0.7, 0.7);
  g.add(body);
  const neck = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 6), mat(0xffffff));
  neck.rotation.z = -1.2;
  neck.position.set(0.55, 0.12, 0);
  g.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(C.ink));
  head.position.set(0.82, 0.22, 0);
  const crown = mesh(new THREE.SphereGeometry(0.03, 6, 4), mat(C.vermilion));
  crown.position.set(0.82, 0.28, 0);
  g.add(head, crown);
  const wings = [];
  for (const z of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.z = z * 0.12;
    const w = mesh(new THREE.BoxGeometry(0.5, 0.02, 0.9), mat(0xffffff));
    w.position.z = z * 0.45;
    const tip = mesh(new THREE.BoxGeometry(0.3, 0.021, 0.3), mat(C.ink));
    tip.position.set(-0.1, 0, z * 0.78);
    pivot.add(w, tip);
    g.add(pivot);
    wings.push({ pivot, z });
  }
  g.userData.wings = wings;
  return g;
}

export function flapCrane(c, t) {
  for (const { pivot, z } of c.userData.wings) pivot.rotation.x = z * Math.sin(t * 4) * 0.6;
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) {
        if ([...matCache.values()].includes(m) || sharedMaterial(m)) continue;
        if (m.map) m.map.dispose();
        m.dispose();
      }
    }
  });
}
