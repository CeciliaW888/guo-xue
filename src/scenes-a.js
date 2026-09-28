import * as THREE from 'three';
import {
  C, mat, mesh, at, ground, backdrop, tree, bush, flower, rock, house, fence, table, book, figure, animateFigure,
  cloud, crane, flapCrane, textPlane, glowSprite, pear, particles, glowMat,
} from './kit.js';
import { damp, dampVec, pickable, setActive, animateHints, Bursts, walkTo, turnTo, faceYaw } from './fx.js';

export const YOU_ROBE = 0x3f8f8a;

// Common frame: sets camera goals and runs per-frame bookkeeping.
function base(extra = {}) {
  const root = new THREE.Group();
  const s = {
    root,
    cam: { pos: [0, 4.5, 12], look: [0, 1, 0] },
    pickables: [],
    fx: new Bursts(root),
    state: null,
    vars: {},
    setState() {},
    pick() { return []; },
    tick() {},
    update(t, dt) {
      this.fx.update(dt);
      animateHints(this.pickables, t);
      this.tick(t, dt);
    },
    autoTap() {
      const act = this.pickables.filter((p) => p.userData.active && p.visible);
      if (!act.length) return [];
      const o = act[Math.floor(Math.random() * act.length)];
      return this.pick(o.userData.pick, o);
    },
    setCam(pos, look) { this.cam = { pos, look }; },
    ...extra,
  };
  return s;
}

function guideCrane(root, radius = 6, height = 6) {
  const c = crane();
  c.scale.setScalar(0.8);
  root.add(c);
  return (t) => {
    const a = t * 0.25;
    c.position.set(Math.cos(a) * radius, height + Math.sin(t * 0.7) * 0.4, Math.sin(a) * radius - 2);
    c.rotation.y = -a - Math.PI / 2; // model faces +x; align it with the circular flight path
    flapCrane(c, t);
  };
}

// ---------------------------------------------------------------- cover
export function coverScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 5 }));
  root.add(ground({ radius: 9 }));
  const hall = house({ w: 3.6, d: 2.4, h: 1.7, plaque: '书院' });
  at(hall, 0, 0, -4.2);
  root.add(hall);
  [[-5, -2, 'pine', 3], [5.2, -1.5, 'pine', 2.6], [-4, 2.5, 'blossom', 2.2], [4.3, 2.8, 'round', 2]].forEach(([x, z, k, h]) => root.add(at(tree({ kind: k, h }), x, 0, z)));
  for (let i = 0; i < 6; i++) root.add(at(flower([C.blossom, C.gold, 0xffffff][i % 3]), -2 + i * 0.8, 0, 3 + (i % 2) * 0.4));
  const bookG = book({ w: 2.2, d: 1.5, cover: 0x7a2e24 });
  bookG.position.set(0, 4.7, 1.4);
  bookG.rotation.x = 0.5;
  root.add(bookG);
  const chars = ['国', '学'].map((ch, i) => {
    const p = textPlane(ch, 0.9, { color: '#c8402f', size: 200 });
    p.position.set(i ? 0.6 : -0.6, 5.9, 1.6);
    root.add(p);
    return p;
  });
  const glow = glowSprite(0xffd27a, 5, 0.5);
  glow.position.set(0, 5.1, 1.4);
  root.add(glow);
  const clouds = [[-7, 6, -6, 1.3], [7, 7, -8, 1.6], [3, 5.2, -12, 1.1]].map(([x, y, z, sc]) => at(cloud(sc), x, y, z));
  root.add(...clouds);
  const fly = guideCrane(root, 7, 6.5);
  const petals = particles({ count: 60, color: 0xf6c2cf, size: 0.18, box: [18, 8, 12], center: [0, 4, 0], additive: false, opacity: 0.9 });
  root.add(petals);
  s.cam = { pos: [0, 4.6, 15.5], look: [0, 3, 0] };
  s.tick = (t) => {
    bookG.position.y = 4.7 + Math.sin(t) * 0.12;
    chars.forEach((c, i) => { c.position.y = 5.9 + Math.sin(t * 1.3 + i) * 0.12; });
    glow.material.opacity = 0.4 + Math.sin(t * 2) * 0.1;
    clouds.forEach((c, i) => { c.position.x += Math.sin(t * 0.1 + i) * 0.003; });
    fly(t);
    const p = petals.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - 0.008;
      if (y < 0) y = 8;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t + i) * 0.004);
    }
    p.needsUpdate = true;
  };
  return s;
}

// ---------------------------------------------------------------- 人之初: two seeds
export function seedsScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 11 }));
  root.add(ground({ radius: 9 }));
  root.add(at(tree({ kind: 'pine', h: 3 }), -6, 0, -3), at(tree({ kind: 'round', h: 2.4 }), 6.5, 0, -4), at(rock(0.7), 5, 0, -1.2));
  const sun = glowSprite(0xffd98a, 6, 0.9);
  sun.position.set(-9, 9, -14);
  root.add(sun);

  const mound = (x, z) => {
    const m = mesh(new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x9c7a55), { receive: true });
    m.scale.y = 0.35;
    m.position.set(x, 0, z);
    root.add(m);
    return m;
  };
  mound(-0.5, 0.5);
  mound(4, -1.4);

  const mine = tree({ kind: 'blossom', h: 2.8 });
  mine.position.set(-0.5, 0.2, 0.5);
  mine.scale.setScalar(0.001);
  root.add(mine);
  const sprout = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6), mat(C.leaf));
  stem.position.y = 0.25;
  sprout.add(stem);
  for (const side of [-1, 1]) {
    const leaf = mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x7fb35a));
    leaf.scale.set(1.3, 0.25, 0.6);
    leaf.position.set(side * 0.16, 0.48, 0);
    leaf.rotation.z = side * 0.4;
    sprout.add(leaf);
  }
  sprout.position.set(-0.5, 0.18, 0.5);
  sprout.scale.setScalar(0.001);
  root.add(sprout);
  const forgotten = tree({ kind: 'round', h: 2.8, color: 0xa6b58a });
  forgotten.position.set(4, 0.2, -1.4);
  forgotten.scale.setScalar(0.1);
  root.add(forgotten);

  const seed = mesh(new THREE.SphereGeometry(0.14, 12, 8), mat(0x8a5a2b, { emissive: 0x5a3010, unique: true }));
  seed.scale.set(1, 1.3, 1);
  const seedGlow = glowSprite(0xffe08a, 1.2, 0.8);
  seed.add(seedGlow);
  seed.position.set(-0.5, 1.2, 0.5);
  pickable(seed, 'seed', { hintY: 0.5, hintScale: 0.8 });
  root.add(seed);

  const can = new THREE.Group();
  const canBody = mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.35, 12), mat(0x5d8aa8));
  canBody.position.y = 0.18;
  const spout = mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.45, 6), mat(0x5d8aa8));
  spout.position.set(0.3, 0.3, 0);
  spout.rotation.z = -1;
  const handle = mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI), mat(0x5d8aa8));
  handle.position.y = 0.38;
  can.add(canBody, spout, handle);
  can.position.set(-2.1, 0, -0.6);
  can.rotation.y = -0.4;
  pickable(can, 'can', { hintY: 1 });
  root.add(can);

  const fenceG = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const f = fence(1.8);
    f.position.set(Math.cos(i * Math.PI / 2) * 0.9, 0, Math.sin(i * Math.PI / 2) * 0.9);
    f.rotation.y = -i * Math.PI / 2 + Math.PI / 2;
    fenceG.add(f);
  }
  fenceG.position.set(-0.5, 0, 0.5);
  fenceG.scale.setScalar(0.001);
  root.add(fenceG);

  const weeds = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const w = mesh(new THREE.ConeGeometry(0.12, 0.5, 5), mat(0x4e6b2f));
    w.position.set(-0.5 + Math.cos(a) * 1.25, 0.25, 0.5 + Math.sin(a) * 1.25);
    weeds.add(w);
  }
  weeds.scale.setScalar(0.001);
  root.add(weeds);

  const rain = particles({ count: 40, color: 0x9fd0ff, size: 0.12, box: [1.2, 1.5, 1.2], center: [-0.5, 1.8, 0.5] });
  rain.material.opacity = 0;
  root.add(rain);

  const you = figure({ kind: 'child', robe: YOU_ROBE });
  you.position.set(-2.4, 0, 1.2);
  you.rotation.y = 1.2;
  root.add(you);
  const fly = guideCrane(root, 6, 6);

  s.pickables = [seed, can];
  let growCur = 0.001, growTarget = 0.001, fenceT = 0.001, weedT = 0.001, rainT = 0, wind = 0, mode = 'idle', seedY = 1.2, youSpot = new THREE.Vector3(-2.4, 0, 1.2);
  s.cam = { pos: [1, 4, 11], look: [1, 1.2, 0] };

  s.setState = (state, vars) => {
    const care = vars.care || 0;
    const f = vars.flags;
    setActive(seed, state === 'intro');
    setActive(can, state === 'day1');
    seed.visible = state === 'intro';
    fenceT = f.has('fence') ? 1 : 0.001;
    weedT = state === 'day3' || (f.has('skip') && ['bloom', 'small', 'lesson'].includes(state) && !f.has('weed')) ? 1 : 0.001;
    if (f.has('weed')) weedT = 0.001;
    wind = state === 'day2' && !f.has('fence') ? 1 : 0;
    const stage = { intro: 0.001, day1: 0.14, day2: 0.2 + care * 0.08, day3: 0.26 + care * 0.1 };
    if (state in stage) growTarget = stage[state];
    if (state === 'bloom') growTarget = 0.55 + care * 0.18;
    if (state === 'small') growTarget = 0.28;
    if (state === 'lesson') growTarget = Math.max(growTarget, 0.28);
    mode = ['bloom'].includes(state) ? 'cheer' : 'idle';
    if (state === 'lesson') s.cam = { pos: [1.5, 4, 13.5], look: [1.5, 2, 0] };
    else if (state === 'bloom' || state === 'small') s.cam = { pos: [1, 3.6, 11.5], look: [1.2, 1.9, -0.4] };
    else s.cam = { pos: [0, 3.6, 9], look: [0, 1, 0.5] };
  };

  s.pick = (name) => {
    if (name === 'seed') {
      seedY = 0.2;
      s.fx.sparkle(new THREE.Vector3(-0.5, 0.4, 0.5));
      return [{ ev: 'seed' }];
    }
    if (name === 'can') return [{ ev: 'water', good: true, care: 1 }];
    return [];
  };

  s.onEvent = (ev) => {
    if (ev === 'water') { rainT = 1.6; youSpot.set(-1.3, 0, 1.4); }
    if (ev === 'fence' || ev === 'weed') s.fx.sparkle(new THREE.Vector3(-0.5, 0.6, 0.5), { color: 0xbfffb0 });
  };

  s.tick = (t, dt) => {
    growCur = damp(growCur, growTarget, 2, dt);
    // Below ~0.3 it is a green sprout; above, it becomes the blossom tree.
    const treeK = THREE.MathUtils.smoothstep(growCur, 0.3, 0.42);
    mine.scale.setScalar(Math.max(growCur * treeK, 0.001));
    sprout.scale.setScalar(Math.max(Math.min(growCur / 0.14, 1.6) * (1 - treeK), 0.001));
    sprout.rotation.z = Math.sin(t * 3) * 0.35 * wind;
    mine.rotation.z = Math.sin(t * 3) * 0.25 * wind + Math.sin(t) * 0.02;
    forgotten.rotation.z = Math.sin(t * 0.8) * 0.03;
    fenceG.scale.setScalar(damp(fenceG.scale.x, fenceT, 4, dt));
    weeds.scale.setScalar(damp(weeds.scale.x, weedT, 4, dt));
    seed.position.y = damp(seed.position.y, seedY, 3, dt) + (seedY > 1 ? Math.sin(t * 2) * 0.004 : 0);
    rainT = Math.max(0, rainT - dt);
    rain.material.opacity = Math.min(rainT, 1);
    const p = rain.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 3;
      if (y < 0.3) y = 2.5;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    const walking = walkTo(you, youSpot, dt, 1.5);
    if (!walking) turnTo(you, faceYaw(you.position, mine.position), dt);
    animateFigure(you, t, walking ? 'walk' : mode);
    fly(t);
  };
  return s;
}

// ---------------------------------------------------------------- 孟母三迁
export function mengmuScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 21, width: 170 }));
  // Keep the path and the three homes clear of grass and trees.
  root.add(ground({ radius: 20, clear: [[-10, -0.5, 4], [0, -0.5, 3.5], [10, -1, 4], [14, 1, 3], ...[-12, -6, 0, 6, 12].map((x) => [x, 1.8, 2])] }));
  const path = mesh(new THREE.BoxGeometry(26, 0.02, 1.4), mat(0xd8c49c), { shadow: false, receive: true });
  path.position.set(0, 0.01, 1.8);
  root.add(path);

  // graveyard (x = -10)
  const grave = new THREE.Group();
  grave.position.x = -10;
  for (const [x, z] of [[-1.2, -1], [0.6, -1.6], [1.8, -0.6]]) {
    const m = mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x8b7a5c));
    m.position.set(x, 0, z);
    m.scale.y = 0.6;
    const stone = mesh(new THREE.BoxGeometry(0.4, 0.7, 0.1), mat(0x8c8c86));
    stone.position.set(x, 0.35, z + 0.55);
    grave.add(m, stone);
  }
  grave.add(at(tree({ kind: 'pine', h: 3, color: 0x3c5a48 }), -2.5, 0, -2), at(tree({ kind: 'pine', h: 2.4, color: 0x3c5a48 }), 3, 0, -2.2));
  root.add(grave);

  // market (x = 0)
  const market = new THREE.Group();
  const stall = (x, color, goods) => {
    const st = new THREE.Group();
    st.add(table(1.8, 0.9, 0.7));
    for (const px of [-0.85, 0.85]) {
      const pole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6), mat(C.woodDark));
      pole.position.set(px, 0.95, -0.4);
      st.add(pole);
    }
    const awn = mesh(new THREE.BoxGeometry(2.1, 0.06, 1.2), mat(color));
    awn.position.set(0, 1.85, 0);
    awn.rotation.x = 0.25;
    st.add(awn);
    goods.forEach((c, i) => {
      const gd = mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(c));
      gd.position.set(-0.6 + i * 0.3, 0.83, (i % 2) * 0.2 - 0.1);
      st.add(gd);
    });
    st.position.x = x;
    return st;
  };
  market.add(stall(-1.3, C.vermilion, [C.pear, C.pear, 0xe07a3a, 0xe07a3a, C.leaf]), stall(1.4, 0x3d6f9a, [0xd94f4f, 0xd94f4f, C.gold, C.gold, 0x8a5bd0]));
  const merchant = figure({ kind: 'man', robe: 0x9a6b3e });
  merchant.position.set(-1.3, 0, -0.9);
  market.add(merchant);
  const merchant2 = figure({ kind: 'woman', robe: 0x6c8f5a });
  merchant2.position.set(1.4, 0, -0.9);
  market.add(merchant2);
  market.position.z = -0.6;
  pickable(market, 'market', { hintY: 2.6, hintScale: 1.4 });
  root.add(market);

  // school (x = 10)
  const school = house({ w: 3.4, d: 2.2, h: 1.7, roof: 0x2f4a5c, plaque: '学堂' });
  school.position.set(10, 0, -2);
  pickable(school, 'school', { hintY: 3.6, hintScale: 1.4 });
  root.add(school);
  const teacher = figure({ kind: 'elder', robe: 0x5b6f86 });
  teacher.position.set(10, 0, 0.3);
  root.add(teacher);
  const students = [0, 1].map((i) => {
    const st = figure({ kind: 'child', robe: [0x8a6fb0, 0x5c9a8a][i] });
    st.position.set(8.9 + i * 2.2, 0, 1.1);
    st.rotation.y = i ? -0.7 : 0.7;
    root.add(st);
    return st;
  });

  // home with loom (x = 14)
  const loom = new THREE.Group();
  loom.position.set(14, 0, 0.6);
  loom.rotation.y = -0.5;
  for (const x of [-0.8, 0.8]) {
    const post = mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), mat(C.woodDark));
    post.position.set(x, 0.75, 0);
    const foot = mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), mat(C.woodDark));
    foot.position.set(x, 0.05, 0.3);
    loom.add(post, foot);
  }
  const bar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), mat(C.wood));
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 1.45;
  const bar2 = bar.clone();
  bar2.position.set(0, 0.6, 0.5);
  loom.add(bar, bar2);
  const clothMat = mat(0xf2ead8, { side: THREE.DoubleSide, unique: true });
  const halves = [-1, 1].map((side) => {
    const piv = new THREE.Group();
    piv.position.set(side * 0.72, 1.45, 0);
    const c = mesh(new THREE.PlaneGeometry(0.72, 0.9), clothMat, { shadow: false });
    c.position.set(-side * 0.36, -0.45, 0.02);
    piv.add(c);
    for (let i = 0; i < 4; i++) {
      const stripe = mesh(new THREE.PlaneGeometry(0.72, 0.03), mat(0xc8402f, { side: THREE.DoubleSide }), { shadow: false });
      stripe.position.set(-side * 0.36, -0.2 - i * 0.2, 0.025);
      piv.add(stripe);
    }
    loom.add(piv);
    return piv;
  });
  root.add(loom);
  const stool = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.4, 10), mat(C.wood));
  stool.position.set(14.3, 0.2, 1.6);
  root.add(stool);
  root.add(at(tree({ kind: 'blossom', h: 2.4 }), 16.5, 0, -1.2), at(tree({ kind: 'round', h: 2.2 }), 5.5, 0, -2.8), at(tree({ kind: 'round', h: 2 }), -5, 0, -2.5));

  const mother = figure({ kind: 'woman', robe: 0x4d7f8f, sash: 0xe8d9b5 });
  const kid = figure({ kind: 'child', robe: 0xd29b3c });
  mother.position.set(-9, 0, 1.8);
  kid.position.set(-10, 0, 0.6);
  root.add(mother, kid);
  const scissors = mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 10), mat(0x777777));
  scissors.visible = false;
  root.add(scissors);

  s.pickables = [market, school];
  const spots = {
    grave: { m: [-9, 1.8], k: [-10.2, 0.2], cam: [[-5, 5.5, 13], [-4, 1, 0]], km: 'bow' },
    market: { m: [-0.5, 1.6], k: [0, 0.4], cam: [[0, 3.5, 8.5], [0, 1.1, 0]], km: 'call' },
    school: { m: [9, 1.9], k: [10.2, 1.2], cam: [[10, 3.4, 8.5], [10, 1.2, 0]], km: 'bow' },
    loom: { m: [15.1, 1.7], k: [13.2, 2.1], cam: [[13.4, 3, 9], [14.2, 1, 0.8]], km: 'idle' },
    cut: { m: [15.1, 1.7], k: [13.3, 2.1], cam: [[13.4, 2.8, 8.4], [14.2, 1, 0.8]], km: 'bow' },
    stay: { m: [15.1, 1.7], k: [13.3, 2.1], cam: [[13.4, 2.8, 8.4], [14.2, 1, 0.8]], km: 'cheer' },
    lesson: { m: [15.1, 1.7], k: [13.3, 2.1], cam: [[3, 5, 19], [3, 1, 0]], km: 'idle' },
  };
  let cur = spots.grave, cut = false, state = 'grave';
  s.cam = { pos: [0, 6, 19], look: [0, 1, 0] };

  s.setState = (st) => {
    state = st;
    cur = spots[st] || cur;
    setActive(market, st === 'grave');
    setActive(school, st === 'grave' || st === 'market');
    s.cam = st === 'grave' ? { pos: [1, 3.6, 15], look: [1, 1.1, -0.5] } : { pos: cur.cam[0], look: cur.cam[1] };
    if (st === 'cut') cut = true;
    if (st === 'stay') cut = false;
  };
  s.pick = (name) => [{ ev: name, good: name === 'school' }];

  s.tick = (t, dt) => {
    const mw = walkTo(mother, new THREE.Vector3(cur.m[0], 0, cur.m[1]), dt, 3.2);
    const kw = walkTo(kid, new THREE.Vector3(cur.k[0], 0, cur.k[1]), dt, 3.4);
    if (!mw) turnTo(mother, ['loom', 'cut', 'stay'].includes(state) ? faceYaw(mother.position, kid.position) : 0, dt);
    if (!kw) turnTo(kid, ['loom', 'cut', 'stay'].includes(state) ? faceYaw(kid.position, mother.position) : state === 'grave' ? Math.PI * 0.8 : Math.PI, dt);
    animateFigure(mother, t, mw ? 'walk' : state === 'cut' ? 'offer' : state === 'stay' ? 'wave' : 'idle');
    animateFigure(kid, t, kw ? 'walk' : state === 'tired' ? 'idle' : cur.km);
    if (state === 'loom' && !kw) kid.userData.head.rotation.x = 0.35;
    animateFigure(merchant, t, state === 'market' ? 'call' : 'idle');
    animateFigure(merchant2, t, 'idle');
    animateFigure(teacher, t, 'idle');
    students.forEach((st) => animateFigure(st, t, state === 'school' ? 'read' : 'idle'));
    halves.forEach((h, i) => {
      const side = i ? 1 : -1;
      h.rotation.z = damp(h.rotation.z, cut ? side * 0.9 : 0, 3, dt);
      h.rotation.x = damp(h.rotation.x, cut ? 0.3 : 0, 3, dt);
    });
  };
  return s;
}

// ---------------------------------------------------------------- 玉不琢
export function jadeScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 31 }));
  root.add(ground({ radius: 8, color: 0xc9b48a }));
  const floor = mesh(new THREE.BoxGeometry(7, 0.12, 5), mat(0xa77b52), { receive: true });
  floor.position.set(0, 0.06, -0.5);
  root.add(floor);
  const wall = mesh(new THREE.BoxGeometry(7, 3.2, 0.2), mat(C.wall), { receive: true });
  wall.position.set(0, 1.6, -3);
  root.add(wall);
  const shelf = mesh(new THREE.BoxGeometry(3, 0.08, 0.4), mat(C.wood));
  shelf.position.set(-1.6, 2, -2.75);
  root.add(shelf);
  [0, 1, 2].forEach((i) => {
    const bi = mesh(new THREE.TorusGeometry(0.16, 0.07, 8, 20), mat(C.jade));
    bi.position.set(-2.6 + i * 0.9, 2.25, -2.72);
    root.add(bi);
  });
  const scrollW = textPlane('玉', 0.9, { color: '#2f6b5b', bg: '#f8f0dc', size: 200 });
  scrollW.position.set(1.8, 1.9, -2.88);
  root.add(scrollW);
  root.add(at(tree({ kind: 'pine', h: 2.6 }), 4.8, 0, -1.5), at(bush(C.leaf, 0.5), -4.2, 0, 1));

  const bench = table(1.6, 1, 0.8);
  bench.position.set(0, 0.12, 0);
  root.add(bench);
  const top = 0.12 + bench.userData.top;
  const turntable = mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 20), mat(C.woodDark));
  turntable.position.y = top + 0.04;
  root.add(turntable);

  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const r = 0.12 + 0.2 * Math.sin(Math.PI * Math.min(t * 1.1, 1)) - (t > 0.8 ? (t - 0.8) * 0.3 : 0);
    pts.push(new THREE.Vector2(Math.max(0.05, r), t * 0.85));
  }
  const jadeMat = new THREE.MeshPhysicalMaterial({ color: C.jade, roughness: 0.8, transmission: 0, clearcoat: 0 });
  const vase = mesh(new THREE.LatheGeometry(pts, 24), jadeMat);
  vase.position.y = top + 0.08;
  const lid = mesh(new THREE.SphereGeometry(0.1, 12, 8), jadeMat);
  lid.position.y = 0.9;
  vase.add(lid);
  root.add(vase);
  const vaseGlow = glowSprite(0x9fffd0, 2, 0);
  vaseGlow.position.y = top + 0.5;
  root.add(vaseGlow);

  const stone = new THREE.Group();
  stone.position.y = top + 0.08;
  const chunks = [];
  const core = mesh(new THREE.DodecahedronGeometry(0.62, 0), mat(0x8e8a80, { unique: true }));
  core.position.y = 0.55;
  core.scale.y = 1.1;
  stone.add(core);
  for (let i = 0; i < 8; i++) {
    const a = (i / 4) * Math.PI * 2;
    const layer = i < 4 ? 0.3 : 0.85;
    const ch = mesh(new THREE.DodecahedronGeometry(0.34, 0), mat([0x8e8a80, 0x7d796f, 0x99958a][i % 3]));
    ch.position.set(Math.cos(a + layer) * 0.42, layer, Math.sin(a + layer) * 0.42);
    ch.rotation.set(i, i * 2, i * 3);
    stone.add(ch);
    chunks.push(ch);
  }
  root.add(stone);
  const stoneHit = mesh(new THREE.SphereGeometry(0.85, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { shadow: false });
  stoneHit.position.y = 0.45;
  stone.add(stoneHit);
  pickable(stone, 'stone', { hintY: 1.6 });

  const carver = figure({ kind: 'elder', robe: 0x6b5b4a });
  carver.position.set(1.4, 0.12, 0.6);
  carver.rotation.y = -1.1;
  const you = figure({ kind: 'child', robe: YOU_ROBE });
  you.position.set(-1.1, 0.12, 0.9);
  you.rotation.y = 0.9;
  root.add(carver, you);

  s.pickables = [stone];
  let taps = 0, state = 'rough', mode = 'idle', polish = 0, hammer = 0;
  s.cam = { pos: [0, 3, 6.5], look: [0, 1.2, 0] };

  s.setState = (st) => {
    state = st;
    setActive(stone, st === 'rough' || st === 'carving');
    if (st === 'vase') { while (taps < 8) knock(); }
    s.cam = st === 'lesson' ? { pos: [0, 3.4, 8.5], look: [0, 1.3, -0.5] } : st === 'vase' ? { pos: [0, 2.4, 4.6], look: [0, 1.4, 0] } : { pos: [0, 2.8, 5.6], look: [0, 1.2, 0] };
  };
  function knock() {
    const ch = chunks[taps];
    if (ch) {
      const wp = ch.getWorldPosition(new THREE.Vector3());
      s.fx.chunks(wp, { color: 0x8e8a80, n: 7 });
      ch.visible = false;
    }
    taps++;
    core.scale.setScalar(Math.max(0.05, 1 - taps / 8));
  }
  s.pick = () => {
    if (!((state === 'rough' && taps < 3) || (state === 'carving' && taps < 8))) return [];
    knock();
    hammer = 1;
    s.fx.sparkle(new THREE.Vector3(0, top + 0.6, 0.3), { color: 0xfff2c0, n: 6, size: 0.25 });
    if (state === 'rough' && taps === 3) return [{ ev: 'tired' }];
    if (state === 'carving' && taps === 8) return [{ ev: 'done' }];
    return [];
  };

  s.tick = (t, dt) => {
    polish = damp(polish, state === 'vase' || state === 'lesson' ? 1 : 0, 1.5, dt);
    jadeMat.roughness = 0.8 - polish * 0.6;
    jadeMat.clearcoat = polish;
    // Dull grey-green inside the rough stone; true jade appears as carving progresses, then polishes.
    const reveal = Math.min(taps / 8, 1);
    jadeMat.color.setHex(0x8a9488).lerp(new THREE.Color(C.jade), reveal).lerp(new THREE.Color(C.jadeLight), polish * 0.35);
    vaseGlow.material.opacity = polish * (0.45 + Math.sin(t * 2) * 0.1);
    stone.visible = taps < 8 || core.scale.x > 0.06;
    turntable.rotation.y += dt * (polish > 0.5 ? 0.6 : 0);
    vase.rotation.y = turntable.rotation.y;
    hammer = Math.max(0, hammer - dt * 4);
    mode = state === 'vase' ? 'cheer' : 'idle';
    animateFigure(you, t, mode);
    you.userData.arms[1].rotation.x = -1.2 - hammer * 0.8;
    animateFigure(carver, t, state === 'half' ? 'offer' : 'idle');
  };
  return s;
}

// ---------------------------------------------------------------- 黄香温席
export function warmBedScene() {
  const s = base();
  const { root } = s;
  const floor = mesh(new THREE.BoxGeometry(8, 0.2, 6), mat(0x8b6a4a), { receive: true });
  floor.position.y = -0.1;
  root.add(floor);
  const back = mesh(new THREE.BoxGeometry(8, 3.6, 0.2), mat(0xd9cbb0), { receive: true });
  back.position.set(0, 1.8, -3);
  const side = mesh(new THREE.BoxGeometry(0.2, 3.6, 6), mat(0xcfc0a4), { receive: true });
  side.position.set(-4, 1.8, 0);
  root.add(back, side);
  // round window with moon and falling snow
  const win = mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ color: 0x1d2b4a }), { shadow: false });
  win.position.set(1.8, 2.2, -2.89);
  const frame = mesh(new THREE.TorusGeometry(0.8, 0.07, 8, 32), mat(C.wood));
  frame.position.copy(win.position);
  root.add(win, frame);
  const moon = mesh(new THREE.CircleGeometry(0.2, 20), glowMat(0xfff4d0, 1.4), { shadow: false });
  moon.position.set(2.1, 2.45, -2.88);
  root.add(moon);
  const snow = particles({ count: 50, color: 0xffffff, size: 0.06, box: [1.4, 1.4, 0.05], center: [1.8, 2.2, -2.87], additive: false });
  root.add(snow);
  const door = mesh(new THREE.BoxGeometry(1.2, 2.4, 0.1), mat(C.woodDark));
  door.position.set(-3.9, 1.2, 1.3);
  door.rotation.y = Math.PI / 2;
  root.add(door);

  // Bed: long axis along local z, headboard and pillow at -z.
  const makeBed = (W, L, x, z, ry, quiltColor) => {
    const b = new THREE.Group();
    const frameB = mesh(new THREE.BoxGeometry(W, 0.45, L), mat(C.wood), { receive: true });
    frameB.position.y = 0.22;
    const head = mesh(new THREE.BoxGeometry(W + 0.1, 1, 0.12), mat(C.woodDark));
    head.position.set(0, 0.5, -L / 2);
    const mattress = mesh(new THREE.BoxGeometry(W - 0.1, 0.12, L - 0.1), mat(0xefe6d2), { receive: true });
    mattress.position.y = 0.5;
    const pillow = mesh(new THREE.CapsuleGeometry(0.13, W * 0.45, 4, 8), mat(0xf4efe4));
    pillow.rotation.z = Math.PI / 2;
    pillow.position.set(0, 0.62, -L / 2 + 0.28);
    const quilt = mesh(new THREE.BoxGeometry(W + 0.04, 0.14, L * 0.66), mat(quiltColor, { unique: true, emissive: 0x000000 }));
    quilt.position.set(0, 0.63, L * 0.16);
    b.add(frameB, head, mattress, pillow, quilt);
    b.position.set(x, 0, z);
    b.rotation.y = ry;
    b.userData = { quilt, L };
    return b;
  };
  const bigBed = makeBed(1.5, 2.3, -1.6, -1.5, 0, 0x6e88a8);
  const smallBed = makeBed(1.1, 1.7, 2.6, 0.2, -Math.PI / 2, 0x8a9a7a);
  root.add(bigBed, smallBed);
  const quilt = bigBed.userData.quilt;
  const quiltHit = mesh(new THREE.BoxGeometry(1.7, 0.9, 2.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { shadow: false });
  quiltHit.position.set(0, 0.6, 0);
  bigBed.add(quiltHit);
  pickable(bigBed, 'bed', { hintY: 1.5 });

  const warmLight = new THREE.PointLight(0xffa860, 0, 6, 1.5);
  warmLight.position.set(-1.6, 1.4, -1.2);
  root.add(warmLight);
  const warmGlow = glowSprite(0xffa860, 3, 0);
  warmGlow.position.set(-1.6, 0.9, -1.2);
  root.add(warmGlow);
  const moonLight = new THREE.PointLight(0x9fb8ff, 3, 8, 1.5);
  moonLight.position.set(1.8, 2.2, -2);
  root.add(moonLight);
  const frost = particles({ count: 40, color: 0xcfe6ff, size: 0.1, box: [7, 3, 5], center: [0, 1.5, 0] });
  root.add(frost);

  const hx = figure({ kind: 'child', robe: 0x9c4a3c });
  const dad = figure({ kind: 'man', robe: 0x4f5d6b });
  root.add(hx, dad);

  s.pickables = [bigBed];
  let warmth = 0, taps = 0, state = 'cold';
  s.cam = { pos: [1.5, 3.2, 6.5], look: [-0.3, 0.9, -1] };
  s.sky = { top: 0x1b2440, horizon: 0x2f3a5c, bottom: 0x1b2033 };
  s.fog = { color: 0x1d2438, near: 20, far: 60 };
  s.indoor = true;
  s.light = { sky: 0x8fa3d8, ground: 0x3a3040, hemi: 0.7, sun: 0x9fb8ff, sunIntensity: 0.9, sunPos: [6, 10, 6], exposure: 1.1 };

  const poses = {
    cold: { hx: [0.6, 0.9, 'idle', false], dad: [-2.9, 1.2, 'idle', false] },
    self: { hx: [2.7, 0.3, 'sleep', 'small'], dad: [-2.9, 1.2, 'idle', false] },
    warming: { hx: [0, 0, 'sleep', 'big'], dad: [-3.1, 0.1, 'idle', false] },
    warmed: { hx: [0, 0.2, 'bow', false], dad: [0, 0, 'sleep', 'big'] },
    lesson: { hx: [0, 0.2, 'idle', false], dad: [0, 0, 'sleep', 'big'] },
  };
  let pose = poses.cold;
  s.setState = (st) => {
    state = st;
    pose = poses[st] || pose;
    setActive(bigBed, st === 'warming');
    if (st === 'warmed' || st === 'lesson') warmth = 1;
    s.cam = st === 'warming' ? { pos: [0.6, 3.2, 4.6], look: [-1.5, 0.6, -1.4] } : st === 'lesson' ? { pos: [1.8, 3.6, 7.5], look: [-0.3, 1, -1] } : { pos: [1.5, 3.2, 6.5], look: [-0.3, 0.9, -1] };
  };
  s.pick = () => {
    if (state !== 'warming' || taps >= 6) return [];
    taps++;
    warmth = taps / 6;
    s.fx.sparkle(new THREE.Vector3(-1.6 + (Math.random() - 0.5), 0.9, -1.2 + (Math.random() - 0.5)), { color: 0xffb070, n: 8, size: 0.35, gravity: 1.5 });
    return taps === 6 ? [{ ev: 'done' }] : [];
  };

  const lying = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const place = (f, [x, z, mode, bed], t, dt) => {
    if (bed) {
      // Lie on the mattress with the head on the pillow, tucked under the quilt.
      const b = bed === 'big' ? bigBed : smallBed;
      const headLen = f.userData.head.position.y;
      const local = new THREE.Vector3(0, 0.52, -b.userData.L / 2 + 0.3 + headLen);
      f.position.lerp(local.applyEuler(b.rotation).add(b.position), 1 - Math.exp(-dt * 5));
      f.quaternion.copy(b.quaternion).multiply(lying);
      animateFigure(f, t, 'sleep');
      f.userData.lying = true;
      return;
    }
    if (f.userData.lying) { f.rotation.set(0, 0.4, 0); f.position.y = 0; f.userData.lying = false; }
    f.rotation.x = 0; f.rotation.z = 0;
    if (f.position.y > 0.01) f.position.y = damp(f.position.y, 0, 6, dt);
    const w = walkTo(f, new THREE.Vector3(x, 0, z), dt, 2);
    if (!w) turnTo(f, 0.4, dt);
    animateFigure(f, t, w ? 'walk' : mode);
  };

  s.tick = (t, dt) => {
    place(hx, pose.hx, t, dt);
    place(dad, pose.dad, t, dt);
    if (state === 'cold' || state === 'self') {
      dad.userData.arms[0].rotation.set(-1.2, 0, -0.5 + Math.sin(t * 8) * 0.1);
      dad.userData.arms[1].rotation.set(-1.2, 0, 0.5 - Math.sin(t * 8) * 0.1);
      dad.position.x += Math.sin(t * 30) * 0.003;
    }
    const w = damp(warmLight.userData.w ?? 0, warmth, 2, dt);
    warmLight.userData.w = w;
    warmLight.intensity = w * 8;
    warmGlow.material.opacity = w * 0.5;
    quilt.material.color.setHex(0x6e88a8).lerp(new THREE.Color(0xe39a5f), w);
    quilt.material.emissive.setHex(0x5a2408).multiplyScalar(w);
    frost.material.opacity = 1 - w;
    for (const b of [bigBed, smallBed]) {
      const occupied = [pose.hx[3], pose.dad[3]].includes(b === bigBed ? 'big' : 'small');
      const q = b.userData.quilt;
      q.position.y = damp(q.position.y, occupied ? 0.74 : 0.63, 5, dt);
      q.scale.y = damp(q.scale.y, occupied ? 2.3 : 1, 5, dt);
    }
    const p = snow.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 0.3;
      if (y < 1.5) y = 2.9;
      const dx = p.getX(i) - 1.8, dy = y - 2.2;
      p.setXYZ(i, p.getX(i), y, dx * dx + dy * dy < 0.6 ? -2.87 : -3.5);
    }
    p.needsUpdate = true;
  };
  return s;
}

// ---------------------------------------------------------------- 孔融让梨
export function pearsScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 41 }));
  root.add(ground({ radius: 9, color: 0xd9c9a3 }));
  const hall = house({ w: 5, d: 2.4, h: 1.8 });
  hall.position.set(0, 0, -4);
  root.add(hall);
  root.add(at(tree({ kind: 'blossom', h: 2.6 }), -4.8, 0, -2.2), at(tree({ kind: 'round', h: 2.6, color: 0x7aa05a }), 4.8, 0, -2.6));
  const tb = table(2.2, 1.2, 0.6);
  root.add(tb);
  const plate = mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.06, 24), mat(0xf4f1ea));
  plate.position.y = tb.userData.top + 0.03;
  root.add(plate);

  const sizes = [1.4, 1.2, 1.05, 0.9, 0.62];
  const onPlate = [[0, -0.05], [-0.34, -0.2], [0.34, -0.18], [-0.3, 0.24], [0.3, 0.28]];
  const pears = sizes.map((sz, i) => {
    const p = pear(sz * 0.72);
    const home = new THREE.Vector3(onPlate[i][0], tb.userData.top + 0.06, onPlate[i][1]);
    p.position.copy(home);
    p.userData.home = home;
    p.userData.target = home.clone();
    root.add(p);
    return p;
  });
  const big = pears[0], small = pears[4];
  pickable(big, 'big', { hintY: 0.9, hintScale: 0.7 });
  pickable(small, 'small', { hintY: 0.7, hintScale: 0.7 });
  [big, small].forEach((p) => {
    const hit = mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { shadow: false });
    hit.position.y = 0.25;
    p.add(hit);
  });

  const kr = figure({ kind: 'child', robe: C.vermilion });
  kr.scale.setScalar(0.85);
  const brothers = [0x3d6f9a, 0x6b8f4a, 0x8a5bb0].map((robe, i) => {
    const b = figure({ kind: 'child', robe });
    b.scale.setScalar(1.05 + i * 0.12);
    root.add(b);
    return b;
  });
  const elder = figure({ kind: 'man', robe: 0x5a4a3a });
  root.add(kr, elder);
  const seats = [[0, -1.15], [-1.6, -0.25], [1.6, -0.25], [1.05, -1.2]];
  [kr, ...brothers].forEach((f, i) => {
    f.position.set(seats[i][0], 0, seats[i][1]);
    f.rotation.y = faceYaw(f.position, new THREE.Vector3(0, 0, 0));
  });
  elder.position.set(-1.35, 0, -1.45);
  elder.rotation.y = faceYaw(elder.position, new THREE.Vector3(0, 0, 0.5));

  const handPos = (f) => new THREE.Vector3(0.18, 0.62, 0.35).multiplyScalar(f.scale.x).applyEuler(f.rotation).add(f.position);

  s.pickables = [big, small];
  let state = 'plate', eat = 1;
  s.cam = { pos: [0, 3.6, 6.2], look: [0, 0.7, 0] };

  s.setState = (st) => {
    state = st;
    setActive(big, st === 'plate');
    setActive(small, st === 'plate');
    pears.forEach((p) => p.userData.target.copy(p.userData.home));
    if (st === 'plate') { eat = 1; big.scale.setScalar(sizes[0] * 0.72); }
    if (st === 'big' || st === 'keep') big.userData.target = handPos(kr);
    if (st === 'small' || st === 'lesson') {
      small.userData.target = handPos(kr);
      brothers.forEach((b, i) => { pears[i].userData.target = handPos(b); });
    }
    s.cam = st === 'lesson' ? { pos: [0, 3.4, 7.4], look: [0, 0.9, -0.6] } : { pos: [0.2, 2.5, 4.6], look: [0, 0.85, -0.4] };
  };
  s.pick = (name) => [{ ev: name, good: name === 'small' }];

  s.tick = (t, dt) => {
    pears.forEach((p) => dampVec(p.position, p.userData.target, 5, dt));
    if (state === 'keep') {
      eat = Math.max(0.35, eat - dt * 0.15);
      big.scale.setScalar(sizes[0] * 0.72 * eat);
    }
    const happy = state === 'small' || state === 'lesson';
    const sad = state === 'big' || state === 'keep';
    animateFigure(kr, t, happy ? 'cheer' : state === 'big' || state === 'keep' ? 'offer' : 'idle');
    brothers.forEach((b) => {
      animateFigure(b, t, happy ? 'cheer' : 'idle');
      if (sad) b.userData.head.rotation.x = 0.35;
    });
    animateFigure(elder, t, happy ? 'wave' : 'idle');
    if (sad) elder.userData.head.rotation.x = 0.2;
  };
  return s;
}

