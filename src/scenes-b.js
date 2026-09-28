import * as THREE from 'three';
import {
  C, mat, mesh, at, ground, backdrop, tree, bush, flower, rock, house, fence, table, book, figure, animateFigure,
  cloud, crane, flapCrane, textPlane, glowSprite, particles, glowMat, lantern, pig, scroll,
} from './kit.js';
import { damp, dampVec, pickable, setActive, animateHints, Bursts, walkTo, turnTo, faceYaw } from './fx.js';
import { YOU_ROBE } from './scenes-a.js';

function base() {
  const root = new THREE.Group();
  return {
    root,
    cam: { pos: [0, 4.5, 12], look: [0, 1, 0] },
    pickables: [],
    fx: new Bursts(root),
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
  };
}

const hitBox = (w, h, d) => mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { shadow: false });
const hitBall = (r) => mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), { shadow: false });

// ---------------------------------------------------------------- 囊萤映雪
export function firefliesScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 51, colors: ['#3b4a63', '#2c3950', '#1f2a3d'] }));
  const summer = ground({ radius: 7, color: 0x4f6b4a });
  summer.position.x = -4;
  const winter = ground({ radius: 7, color: C.snow });
  winter.position.x = 9;
  root.add(summer, winter);

  // Poor families' homes: plain wood instead of red lacquer.
  const hut = house({ w: 2.6, d: 2, h: 1.5, roof: 0x4a4038, wall: 0xcbb994, pillar: 0x6b5040 });
  hut.position.set(-5, 0, -2.5);
  root.add(hut);
  [[-8, -1, 2.2], [-1.2, -3, 2.6], [-7.5, 2.5, 1.6]].forEach(([x, z, h]) => root.add(at(tree({ kind: 'round', h, color: 0x3f5f45 }), x, 0, z)));
  for (let i = 0; i < 8; i++) root.add(at(bush(0x3f6040, 0.35 + (i % 3) * 0.1), -8 + i * 1.1, 0, 1.5 + Math.sin(i * 2) * 1.2));
  const moon = glowSprite(0xfff1c8, 5, 0.9);
  moon.position.set(0, 10, -18);
  const moonDisc = mesh(new THREE.CircleGeometry(0.9, 32), glowMat(0xfff4d8, 1.2), { shadow: false });
  moonDisc.position.set(0, 10, -18.1);
  root.add(moon, moonDisc);

  const mat_ = mesh(new THREE.BoxGeometry(1.4, 0.04, 1), mat(0xb49a64), { receive: true });
  mat_.position.set(-4.3, 0.02, -0.1);
  root.add(mat_);
  const desk = table(0.9, 0.5, 0.3);
  desk.position.set(-4.3, 0, 0.35);
  root.add(desk);
  const bk = book({ w: 0.5, d: 0.34 });
  bk.position.set(-4.3, desk.userData.top, 0.35);
  bk.rotation.y = Math.PI;
  root.add(bk);
  const cheyin = figure({ kind: 'child', robe: 0x7a6a8f });
  cheyin.position.set(-4.3, -0.28, -0.3);
  cheyin.rotation.y = 0;
  root.add(cheyin);

  const bag = new THREE.Group();
  bag.position.set(-3.75, desk.userData.top + 0.55, 0.45);
  const gauzeMat = new THREE.MeshBasicMaterial({ color: 0xf4ffe0, transparent: true, opacity: 0.25, depthWrite: false });
  const gauze = mesh(new THREE.SphereGeometry(0.2, 16, 12), gauzeMat, { shadow: false });
  gauze.scale.y = 1.2;
  const bagGlow = glowSprite(0xd8ff7a, 1.6, 0);
  const tie = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), mat(C.woodDark), { shadow: false });
  tie.position.y = 0.45;
  bag.add(gauze, bagGlow, tie);
  root.add(bag);
  const bagLight = new THREE.PointLight(0xd8ff7a, 0, 3.2, 1.6);
  bagLight.position.copy(bag.position);
  root.add(bagLight);

  const flies = [];
  for (let i = 0; i < 12; i++) {
    const f = new THREE.Group();
    const g = glowSprite(0xd8ff7a, 0.5, 0.95);
    const hit = hitBall(0.45);
    f.add(g, hit);
    f.userData.seed = Math.random() * 100;
    f.userData.home = new THREE.Vector3(-7.5 + Math.random() * 6, 0.6 + Math.random() * 1.6, 0.5 + Math.random() * 3);
    f.userData.caught = false;
    f.userData.glow = g;
    f.position.copy(f.userData.home);
    pickable(f, 'fly', { hintY: 0, hintScale: 1.2, color: 0xffffaa });
    root.add(f);
    flies.push(f);
  }

  // Sun Kang in the snow
  const hut2 = house({ w: 2.6, d: 2, h: 1.5, roof: 0xe9eef2, wall: 0xcbb994, pillar: 0x6b5040 });
  hut2.position.set(9.5, 0, -2.6);
  root.add(hut2);
  [[12.5, -1, 2.6], [6, -3, 2.2]].forEach(([x, z, h]) => root.add(at(tree({ kind: 'pine', h, color: 0x3d5a55 }), x, 0, z)));
  const sunkang = figure({ kind: 'man', robe: 0x5d6f7f });
  sunkang.position.set(9, 0, 0.3);
  root.add(sunkang);
  const bk2 = book({ w: 0.44, d: 0.3 });
  bk2.position.set(0, 0.62, 0.35);
  bk2.rotation.x = -0.6;
  sunkang.add(bk2);
  const drifts = [[7.2, 1.6], [10.8, 1.8], [9, 2.8]].map(([x, z]) => {
    const d = mesh(new THREE.SphereGeometry(0.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: 0xffffff, emissive: 0xbfd8ff, emissiveIntensity: 0 }));
    d.scale.y = 0.4;
    d.position.set(x, 0, z);
    d.add(hitBall(0.9));
    pickable(d, 'snow', { hintY: 0.9 });
    root.add(d);
    return d;
  });
  const snowGlow = glowSprite(0xcfe2ff, 6, 0);
  snowGlow.position.set(9, 0.8, 1);
  root.add(snowGlow);
  const snowfall = particles({ count: 220, color: 0xffffff, size: 0.09, box: [12, 7, 8], center: [9, 3.5, 0], additive: false });
  root.add(snowfall);

  s.pickables = [...flies, ...drifts];
  let state = 'dark', caught = 0, lit = 0, snowLit = 0;
  s.cam = { pos: [-4, 3.2, 7.5], look: [-4.2, 0.8, 0] };
  s.sky = { top: 0x0f1830, horizon: 0x2c3a5a, bottom: 0x141a2a };
  s.fog = { color: 0x1c2640, near: 18, far: 55 };
  s.light = { sky: 0x7f93c8, ground: 0x2a2a38, hemi: 0.75, sun: 0xaec4ff, sunIntensity: 0.8, sunPos: [0, 12, -8], exposure: 1.15 };

  s.setState = (st) => {
    state = st;
    flies.forEach((f) => setActive(f, st === 'catch' && !f.userData.caught));
    drifts.forEach((d) => setActive(d, st === 'snow' && !d.userData.lit));
    if (['reading', 'snow', 'lesson'].includes(st)) { caught = 8; lit = 1; }
    if (st === 'lesson') snowLit = 3;
    if (st === 'snow') s.cam = { pos: [9, 3.2, 7.5], look: [9, 0.8, 0] };
    else if (st === 'lesson') s.cam = { pos: [2.5, 6, 16], look: [2.5, 0.8, 0] };
    else if (st === 'catch') s.cam = { pos: [-4.5, 3, 8], look: [-4.5, 1, 0.8] };
    else s.cam = { pos: [-4, 2.4, 5.2], look: [-4.1, 0.6, 0] };
  };
  s.pick = (name, obj) => {
    if (name === 'fly' && state === 'catch' && !obj.userData.caught) {
      obj.userData.caught = true;
      setActive(obj, false);
      caught++;
      s.fx.sparkle(obj.position.clone(), { color: 0xd8ff7a, n: 8, size: 0.3 });
      if (caught === 4) return [{ say: { who: 'cheyin', zh: '越来越亮了！再多捉几只！', en: "It's getting brighter! Just a few more!" } }];
      if (caught >= 8) {
        flies.forEach((f) => setActive(f, false));
        return [{ ev: 'done' }];
      }
      return [];
    }
    if (name === 'snow' && state === 'snow' && !obj.userData.lit) {
      obj.userData.lit = true;
      setActive(obj, false);
      snowLit++;
      s.fx.sparkle(obj.position.clone().add(new THREE.Vector3(0, 0.3, 0)), { color: 0xdfeaff, n: 12 });
      return snowLit >= 3 ? [{ ev: 'done' }] : [];
    }
    return [];
  };

  s.tick = (t, dt) => {
    flies.forEach((f, i) => {
      const k = t + f.userData.seed;
      if (f.userData.caught) {
        const inBag = bag.position.clone().add(new THREE.Vector3(Math.sin(k * 3) * 0.08, Math.sin(k * 2) * 0.1, Math.cos(k * 3) * 0.08));
        dampVec(f.position, inBag, 4, dt);
        f.userData.glow.scale.setScalar(0.25);
      } else {
        const h = f.userData.home;
        f.position.set(h.x + Math.sin(k * 0.7) * 0.6, h.y + Math.sin(k * 1.3) * 0.3, h.z + Math.cos(k * 0.5) * 0.5);
        f.userData.glow.material.opacity = 0.5 + Math.sin(k * 4) * 0.45;
      }
      if (state === 'dark' && i > 4) f.visible = true;
    });
    const want = Math.min(caught / 8, 1);
    lit = damp(lit, want, 2, dt);
    bagGlow.material.opacity = lit * 0.85;
    bagLight.intensity = lit * 5;
    gauzeMat.opacity = 0.25 + lit * 0.5;
    const reading = ['reading', 'lesson'].includes(state) || (state === 'catch' && caught >= 8);
    animateFigure(cheyin, t, reading ? 'read' : state === 'catch' ? 'wave' : 'idle');
    if (state === 'dark') cheyin.userData.head.rotation.x = 0.4;
    animateFigure(sunkang, t, 'read');
    const sl = snowLit / 3;
    drifts.forEach((d) => { d.material.emissiveIntensity = damp(d.material.emissiveIntensity, d.userData.lit ? 0.6 : 0, 3, dt); });
    snowGlow.material.opacity = damp(snowGlow.material.opacity, sl * 0.6, 2, dt);
    const p = snowfall.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 0.6;
      if (y < 0) y = 7;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t + i) * 0.002);
    }
    p.needsUpdate = true;
  };
  return s;
}

// ---------------------------------------------------------------- 弟子规 总叙: seven lanterns
const LANTERNS = [
  ['入则孝', '在家要孝顺父母。', 'At home, love and respect your parents.'],
  ['出则弟', '出门要尊敬兄长和长辈。', 'Outside, respect older siblings and elders.'],
  ['谨', '做事要小心谨慎。', 'Be careful in everything you do.'],
  ['信', '说话要诚实守信。', 'Be honest and keep your word.'],
  ['泛爱众', '要关爱所有的人。', 'Care for everyone.'],
  ['亲仁', '要亲近有仁德的人。', 'Stay close to kind and wise people.'],
  ['余力学文', '做好这些，还有余力就读书学习。', 'With strength to spare, read and learn.'],
];

export function lanternsScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 61, colors: ['#6a5a78', '#4d4560', '#35324a'] }));
  root.add(ground({ radius: 10, color: 0x7d8a6a }));
  const bigScroll = scroll({ width: 5, height: 1.6, text: '弟子规' });
  bigScroll.position.set(0, 1.6, -3.5);
  root.add(bigScroll);
  for (const x of [-3.3, 3.3]) {
    const post = mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.6, 10), mat(C.red));
    post.position.set(x * 1.45, 2.3, -1);
    root.add(post);
  }
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.8, 4.4, -1), new THREE.Vector3(0, 3.2, -1), new THREE.Vector3(4.8, 4.4, -1));
  const rope = mesh(new THREE.TubeGeometry(curve, 40, 0.025, 6), mat(C.ink), { shadow: false });
  root.add(rope);
  const confucius = figure({ kind: 'elder', robe: 0x5b4a6e, sash: C.gold });
  confucius.position.set(-1.6, 0, 0.6);
  confucius.rotation.y = 0.3;
  const you = figure({ kind: 'child', robe: YOU_ROBE });
  you.position.set(1.4, 0, 1.3);
  you.rotation.y = -0.4;
  root.add(confucius, you);
  [[-6.5, -2, 'pine'], [6.5, -2.4, 'blossom']].forEach(([x, z, k]) => root.add(at(tree({ kind: k, h: 2.8 }), x, 0, z)));

  const lanterns = LANTERNS.map(([label], i) => {
    const u = (i + 0.5) / LANTERNS.length;
    const p = curve.getPoint(u);
    const l = lantern({ label, lit: true, scale: 0.78 });
    l.traverse((o) => { o.castShadow = false; });
    l.position.set(p.x, p.y - 0.75, p.z);
    l.userData.idx = i;
    l.userData.body = l.children[0];
    l.userData.glow = l.children.find((c) => c.isSprite);
    l.userData.level = 0;
    l.add(hitBall(0.7));
    pickable(l, 'lantern', { hintY: 1, hintScale: 1 });
    root.add(l);
    return l;
  });
  const skyGlow = glowSprite(0xffb070, 14, 0);
  skyGlow.position.set(0, 3, -2);
  root.add(skyGlow);

  s.pickables = lanterns;
  let state = 'dark', count = 0;
  s.cam = { pos: [0, 2.8, 9.5], look: [0, 2.4, -1] };
  s.sky = { top: 0x1f2346, horizon: 0x7a5a7a, bottom: 0x2a2438 };
  s.fog = { color: 0x3a3450, near: 20, far: 60 };
  s.light = { sky: 0xb0a0d0, ground: 0x40384a, hemi: 0.9, sun: 0xffc9a0, sunIntensity: 1, sunPos: [-6, 8, 8], exposure: 1.1 };

  s.setState = (st) => {
    state = st;
    lanterns.forEach((l) => setActive(l, st === 'dark' && !l.userData.lit));
    if (st !== 'dark') lanterns.forEach((l) => { l.userData.lit = true; });
    s.cam = st === 'lesson' ? { pos: [0, 3, 11.5], look: [0, 2.2, -1] } : { pos: [0, 2.8, 9.5], look: [0, 2.4, -1] };
  };
  s.pick = (name, obj) => {
    if (name !== 'lantern' || obj.userData.lit) return [];
    obj.userData.lit = true;
    setActive(obj, false);
    count++;
    s.fx.sparkle(obj.position.clone(), { color: 0xffc070, n: 16, size: 0.35 });
    const [label, zh, en] = LANTERNS[obj.userData.idx];
    const out = [{ say: { who: 'guide', zh: `${label}：${zh}`, en: `${label}: ${en}` } }];
    if (count === LANTERNS.length) out.push({ ev: 'done', delay: 1800 });
    return out;
  };
  s.autoTap = () => {
    const l = lanterns.find((x) => !x.userData.lit);
    return l ? s.pick('lantern', l) : [];
  };

  s.tick = (t, dt) => {
    lanterns.forEach((l, i) => {
      l.userData.level = damp(l.userData.level, l.userData.lit ? 1 : 0, 3, dt);
      const k = l.userData.level;
      l.userData.body.material.emissiveIntensity = 0.02 + k * 0.7;
      l.userData.body.material.color.setHex(0x4a2a30).lerp(new THREE.Color(C.red), k);
      l.userData.glow.material.opacity = k * 0.6;
      l.rotation.z = Math.sin(t * 1.2 + i) * 0.05;
    });
    skyGlow.material.opacity = (count / LANTERNS.length) * 0.35;
    animateFigure(confucius, t, state === 'all' || state === 'lesson' ? 'wave' : 'idle');
    animateFigure(you, t, state === 'all' ? 'cheer' : 'idle');
    you.userData.head.rotation.x = -0.3;
  };
  return s;
}

// ---------------------------------------------------------------- 父母呼 应勿缓
export function callHomeScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 71 }));
  root.add(ground({ radius: 9, color: 0xd6c59e }));
  const home = house({ w: 4.2, d: 2.4, h: 1.9 });
  home.position.set(1.2, 0, -3);
  root.add(home);
  root.add(at(tree({ kind: 'blossom', h: 2.6 }), -5, 0, -2.5), at(tree({ kind: 'round', h: 2.4 }), 5.8, 0, -1.5), at(fence(4), -4.5, 0, 2.8));
  const tb = table(1.6, 0.9, 0.55);
  tb.position.set(2.2, 0, -0.4);
  root.add(tb);
  const bowls = [-0.5, -0.15, 0.2, 0.55].map((x) => {
    const b = mesh(new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf4f1ea, { side: THREE.DoubleSide }));
    b.rotation.x = Math.PI;
    b.position.set(2.2 + x, tb.userData.top + 0.1, -0.35);
    b.scale.setScalar(0.001);
    root.add(b);
    return b;
  });
  const blockColors = [C.vermilion, C.gold, 0x3d6f9a, C.jade, 0x8a5bb0, C.vermilion, C.gold];
  const blocks = blockColors.map((c, i) => {
    const b = mesh(new THREE.BoxGeometry(0.45, 0.28, 0.45), mat(c));
    b.userData.home = new THREE.Vector3(-3 + (i % 2) * 0.05, 0.14 + i * 0.28, 1 + (i % 2) * 0.04);
    b.position.copy(b.userData.home);
    b.rotation.y = i * 0.3;
    b.userData.v = new THREE.Vector3();
    b.userData.spin = new THREE.Vector3();
    root.add(b);
    return b;
  });

  const mom = figure({ kind: 'woman', robe: 0xb0506a, sash: 0xf0d9a0 });
  mom.position.set(1.2, 0, -0.45);
  mom.add(hitBox(0.8, 1.9, 0.8).translateY(0.95));
  pickable(mom, 'mother', { hintY: 2.1 });
  const dad = figure({ kind: 'man', robe: 0x4f6d8a });
  dad.position.set(3.4, 0, -0.9);
  dad.rotation.y = -1.2;
  dad.visible = false;
  const ming = figure({ kind: 'child', robe: 0x3d7fb0 });
  ming.position.set(-2.2, 0, 1.4);
  root.add(mom, dad, ming);

  s.pickables = [mom];
  let state = 'blocks', fall = false;
  const spots = { blocks: [-2.2, 1.4], wait: [-2.2, 1.4], come: [1.9, 0.5], listen: [1.9, 0.5], lesson: [1.9, 0.5] };
  s.cam = { pos: [-0.5, 3.4, 8.5], look: [-0.5, 1, 0] };
  s.sky = { top: 0x94c6d6, horizon: 0xf8e9cc };
  s.light = { sunPos: [-8, 10, 8], sun: 0xffe0b0 };

  s.setState = (st) => {
    state = st;
    setActive(mom, st === 'blocks');
    if (st === 'wait' && !fall) {
      fall = true;
      blocks.forEach((b, i) => {
        b.userData.v.set((Math.random() - 0.2) * 2.5, Math.random() * 1.5, (Math.random() - 0.3) * 2);
        b.userData.spin.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        b.userData.delay = i * 0.04;
      });
    }
    dad.visible = ['come', 'listen', 'lesson'].includes(st) || dad.visible;
    s.cam = ['come', 'listen'].includes(st) ? { pos: [2, 2.8, 5.8], look: [2, 0.9, -0.5] } : st === 'lesson' ? { pos: [0, 3.8, 10], look: [0, 1.2, -1] } : { pos: [-0.5, 3.2, 8], look: [-0.5, 1, 0] };
  };
  s.pick = (name) => (name === 'mother' ? [{ ev: 'come', good: true }] : []);

  s.tick = (t, dt) => {
    if (fall) {
      blocks.forEach((b) => {
        if ((b.userData.delay -= dt) > 0) return;
        if (b.position.y > 0.14) {
          b.userData.v.y -= 9 * dt;
          b.position.addScaledVector(b.userData.v, dt);
          b.rotation.x += b.userData.spin.x * dt;
          b.rotation.z += b.userData.spin.z * dt;
        } else {
          b.position.y = 0.14;
          b.rotation.x = Math.round(b.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
          b.rotation.z = Math.round(b.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
        }
      });
    }
    const sp = spots[state] || spots.blocks;
    const w = walkTo(ming, new THREE.Vector3(sp[0], 0, sp[1]), dt, 2.6);
    if (!w) turnTo(ming, ['come', 'listen', 'lesson'].includes(state) ? faceYaw(ming.position, dad.position) : state === 'wait' ? 0.3 : -2.6, dt);
    animateFigure(ming, t, w ? 'walk' : state === 'listen' ? 'bow' : state === 'blocks' ? 'offer' : state === 'lesson' ? 'cheer' : 'idle');
    animateFigure(mom, t, state === 'blocks' || state === 'wait' ? 'call' : 'idle');
    turnTo(mom, faceYaw(mom.position, ming.position), dt);
    animateFigure(dad, t, state === 'come' ? 'offer' : 'idle');
    const showBowls = ['come', 'listen', 'lesson'].includes(state);
    bowls.forEach((b, i) => b.scale.setScalar(damp(b.scale.x, showBowls && !w ? 1 : 0.001, 4 - i * 0.6, dt)));
  };
  return s;
}

// ---------------------------------------------------------------- 曾子杀彘
export function promiseScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 81 }));
  root.add(ground({ radius: 9, color: 0xc7b88c }));
  const home = house({ w: 4, d: 2.4, h: 1.8 });
  home.position.set(-1, 0, -3.2);
  root.add(home);
  const pen = new THREE.Group();
  [[0, 1.1, 0], [0, -1.1, 0], [1.1, 0, Math.PI / 2], [-1.1, 0, Math.PI / 2]].forEach(([x, z, r]) => pen.add(at(fence(2.2), x, 0, z, r)));
  pen.position.set(3.8, 0, -1);
  root.add(pen);
  const piggy = pig();
  piggy.position.set(3.8, 0, -1);
  root.add(piggy);
  root.add(at(tree({ kind: 'round', h: 2.6 }), -5.5, 0, -1.5), at(tree({ kind: 'pine', h: 2.8 }), 6.5, 0, -3.5));
  const gate = new THREE.Group();
  for (const x of [-0.8, 0.8]) gate.add(at(mesh(new THREE.BoxGeometry(0.16, 2, 0.16), mat(C.red)), x, 1, 0));
  gate.add(at(mesh(new THREE.BoxGeometry(2, 0.18, 0.25), mat(C.roof)), 0, 2.05, 0));
  gate.position.set(-5, 0, 2.5);
  gate.rotation.y = 0.6;
  root.add(gate);

  const zengzi = figure({ kind: 'man', robe: 0x3f6b5a });
  const wife = figure({ kind: 'woman', robe: 0xa0587a });
  const son = figure({ kind: 'child', robe: 0xd29b3c });
  const basket = mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.2, 10), mat(0xb08850));
  basket.position.set(0.25, 0.75, 0.1);
  wife.add(basket);
  root.add(zengzi, wife, son);

  const feastTable = table(1.8, 1, 0.55);
  feastTable.position.set(0.2, 0, 0.4);
  feastTable.scale.setScalar(0.001);
  root.add(feastTable);
  const pot = mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.3, 14), mat(0x5a4a3a));
  pot.position.set(0, feastTable.userData.top + 0.15, 0);
  feastTable.add(pot);
  const steam = particles({ count: 30, color: 0xffffff, size: 0.25, box: [0.3, 1, 0.3], center: [0.2, 1.4, 0.4], additive: false, opacity: 0 });
  root.add(steam);
  const xin = textPlane('信', 1.4, { color: '#f2c14e', size: 240 });
  xin.position.set(0.2, 2.75, -0.6);
  xin.scale.setScalar(0.001);
  const xinGlow = glowSprite(0xffd27a, 3.5, 0);
  xinGlow.position.copy(xin.position);
  root.add(xin, xinGlow);
  const rainCloud = new THREE.Group();
  const cl = cloud(0.7, 0x8a8f99);
  rainCloud.add(cl);
  const drops = particles({ count: 30, color: 0x8fb0d0, size: 0.1, box: [1.4, 1.4, 0.8], center: [0, -0.9, 0], additive: false });
  rainCloud.add(drops);
  rainCloud.position.set(-2.2, 2.35, 1.2);
  rainCloud.scale.setScalar(0.001);
  root.add(rainCloud);

  const poses = {
    market: { z: [2, -0.8], w: [-3.6, 1.8], s: [-2.6, 1.2] },
    sad: { z: [2.2, -0.2], w: [-0.6, -1.4], s: [-2.2, 1.2] },
    feast: { z: [1.45, 0.5], w: [-1.05, 0.5], s: [0.2, -0.45] },
    lesson: { z: [1.45, 0.5], w: [-1.05, 0.5], s: [0.2, -0.45] },
  };
  let state = 'market', pose = poses.market, feast = 0;
  zengzi.position.set(2, 0, -0.8);
  wife.position.set(-3.6, 0, 1.8);
  son.position.set(-2.6, 0, 1.2);
  s.cam = { pos: [0, 3.6, 9], look: [0, 1, 0] };
  s.sky = { top: 0x9ac3cf, horizon: 0xf6e8cc };

  s.setState = (st) => {
    state = st;
    pose = poses[st] || pose;
    s.cam = st === 'sad' ? { pos: [-1.8, 2.6, 6.2], look: [-2, 1.4, 1] } : st === 'feast' ? { pos: [0.3, 2.8, 6.6], look: [0.2, 1.5, 0] } : st === 'lesson' ? { pos: [0.2, 3.4, 9.5], look: [0.2, 1.7, 0] } : { pos: [0, 3.6, 9], look: [0, 1, 0] };
  };

  s.tick = (t, dt) => {
    const place = (f, [x, z], mode) => {
      const w = walkTo(f, new THREE.Vector3(x, 0, z), dt, 2.2);
      if (!w && (state === 'feast' || state === 'lesson')) turnTo(f, faceYaw(f.position, feastTable.position), dt);
      animateFigure(f, t, w ? 'walk' : mode);
      return w;
    };
    const feasting = state === 'feast' || state === 'lesson';
    place(zengzi, pose.z, feasting ? 'offer' : state === 'market' ? 'idle' : 'idle');
    place(wife, pose.w, feasting ? 'idle' : 'idle');
    place(son, pose.s, feasting ? 'cheer' : 'idle');
    if (state === 'market' || state === 'sad') {
      son.userData.head.rotation.x = 0.45;
      son.userData.arms[0].rotation.set(-2, 0, -0.3);
      son.userData.arms[1].rotation.set(-2, 0, 0.3);
      son.position.y = state === 'sad' ? 0 : Math.abs(Math.sin(t * 9)) * 0.02;
    }
    // Zengzi kept his word: in the feast the pig has been prepared, so the pen is empty.
    piggy.visible = !feasting;
    piggy.position.x = 3.8 + Math.sin(t * 0.6) * 0.4;
    piggy.rotation.y = Math.cos(t * 0.6) > 0 ? 0 : Math.PI;
    feast = damp(feast, feasting ? 1 : 0, 3, dt);
    feastTable.scale.setScalar(Math.max(feast, 0.001));
    steam.material.opacity = feast * 0.5;
    const sp = steam.geometry.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      let y = sp.getY(i) + dt * 0.5;
      if (y > 2.1) y = 1.1;
      sp.setY(i, y);
    }
    sp.needsUpdate = true;
    const xs = damp(xin.scale.x, feasting ? 1 : 0.001, 3, dt);
    xin.scale.setScalar(xs);
    xin.position.y = 2.75 + Math.sin(t * 1.5) * 0.1;
    xinGlow.position.y = xin.position.y;
    xin.rotation.y = Math.sin(t * 0.8) * 0.3;
    xinGlow.material.opacity = xs * (0.55 + Math.sin(t * 2) * 0.1);
    rainCloud.scale.setScalar(damp(rainCloud.scale.x, state === 'sad' ? 1 : 0.001, 3, dt));
    const dp = drops.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      let y = dp.getY(i) - dt * 2;
      if (y < -1.6) y = -0.2;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;
  };
  return s;
}

// ---------------------------------------------------------------- 读书三到
function heartShape() {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.35);
  sh.bezierCurveTo(-0.1, -0.2, -0.45, -0.05, -0.4, 0.2);
  sh.bezierCurveTo(-0.35, 0.42, -0.08, 0.42, 0, 0.22);
  sh.bezierCurveTo(0.08, 0.42, 0.35, 0.42, 0.4, 0.2);
  sh.bezierCurveTo(0.45, -0.05, 0.1, -0.2, 0, -0.35);
  return new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
}

export function threeArrivalsScene() {
  const s = base();
  const { root } = s;
  const floor = mesh(new THREE.BoxGeometry(9, 0.2, 7), mat(0xa77b52), { receive: true });
  floor.position.y = -0.1;
  root.add(floor);
  const wall = mesh(new THREE.BoxGeometry(9, 4, 0.2), mat(0xe6d8bc), { receive: true });
  wall.position.set(0, 2, -3);
  root.add(wall);
  const shelf = new THREE.Group();
  for (let r = 0; r < 3; r++) {
    const board = mesh(new THREE.BoxGeometry(2, 0.06, 0.4), mat(C.woodDark));
    board.position.y = 0.6 + r * 0.7;
    shelf.add(board);
    for (let b = 0; b < 6; b++) {
      const bk = mesh(new THREE.BoxGeometry(0.12 + (b % 2) * 0.04, 0.5, 0.3), mat([0x3d5a80, 0x7a2e24, 0x5f7a4a, 0xb08a3e][(b + r) % 4]));
      bk.position.set(-0.8 + b * 0.28, 0.88 + r * 0.7, 0);
      shelf.add(bk);
    }
  }
  shelf.position.set(-3, 0, -2.6);
  root.add(shelf);
  const calligraphy = scroll({ width: 1.2, height: 1.8, text: '' });
  calligraphy.position.set(2.8, 2.2, -2.85);
  const ch = textPlane('读书', 0.5, { color: '#2b2622', vertical: true, size: 180 });
  ch.position.set(2.8, 2.2, -2.83);
  root.add(calligraphy, ch);

  const desk = table(1.8, 0.9, 0.55);
  desk.position.set(0, 0, 0);
  root.add(desk);
  const bk = book({ w: 0.8, d: 0.5 });
  bk.position.set(0, desk.userData.top, -0.05);
  bk.rotation.y = Math.PI;
  root.add(bk);
  const brushPot = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 10), mat(C.jade));
  brushPot.position.set(0.7, desk.userData.top + 0.1, -0.2);
  root.add(brushPot);
  const lamp = glowSprite(0xffd9a0, 1.4, 0.8);
  lamp.position.set(-0.7, desk.userData.top + 0.4, -0.2);
  root.add(lamp);
  const lampLight = new THREE.PointLight(0xffc98a, 3, 5, 1.6);
  lampLight.position.copy(lamp.position);
  root.add(lampLight);

  const you = figure({ kind: 'child', robe: YOU_ROBE });
  you.position.set(0, 0, -0.85);
  you.rotation.y = 0;
  root.add(you);

  const glyphs = [...'人之初性本善性相近习相远'].map((c, i) => {
    const g = textPlane(c, 0.32, { color: '#2b2622', size: 128 });
    g.userData.row = new THREE.Vector3(-0.8 + (i % 6) * 0.32, 1.6 + Math.floor(i / 6) * 0.36, -1.4);
    g.userData.seed = Math.random() * 100;
    g.position.set(0, 1, 0);
    root.add(g);
    return g;
  });

  const eye = new THREE.Group();
  const white = mesh(new THREE.SphereGeometry(0.3, 20, 14), mat(0xffffff));
  white.scale.set(1.4, 0.8, 0.5);
  const iris = mesh(new THREE.SphereGeometry(0.15, 16, 12), mat(0x2b2622));
  iris.position.z = 0.1;
  iris.scale.z = 0.5;
  const shine = mesh(new THREE.SphereGeometry(0.04, 8, 6), glowMat(0xffffff));
  shine.position.set(0.05, 0.05, 0.18);
  eye.add(white, iris, shine);
  const mouth = new THREE.Group();
  const lip = mesh(new THREE.TorusGeometry(0.2, 0.07, 10, 24, Math.PI), mat(0xd9534f));
  lip.rotation.z = Math.PI;
  const lip2 = mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 24, Math.PI), mat(0xd9534f));
  lip2.scale.y = 0.35;
  mouth.add(lip, lip2);
  const heart = mesh(heartShape(), new THREE.MeshToonMaterial({ color: 0xe0484f, emissive: 0x801010, emissiveIntensity: 0.2 }));
  heart.geometry.center();
  const icons = [
    [eye, 'eye', '眼到：眼睛看着书，一个字一个字看清楚。', 'Eyes arrive: look at the book and see each character clearly.', [-2.3, 1.8, 1]],
    [mouth, 'mouth', '口到：大声读出来，读清楚了才记得牢。', 'Mouth arrives: read aloud, clearly, so it stays in your memory.', [2.3, 1.8, 1]],
    [heart, 'heart', '心到：心里想着书上的意思。这一个最重要！', 'Heart arrives: think about what the words mean. This one matters most!', [0, 2.55, 1.2]],
  ].map(([obj, name, zh, en, pos]) => {
    const g = new THREE.Group();
    g.add(obj);
    g.add(hitBall(0.5));
    const glow = glowSprite(name === 'heart' ? 0xff8080 : 0xfff0a0, 1.6, 0);
    g.add(glow);
    const label = textPlane({ eye: '眼', mouth: '口', heart: '心' }[name], 0.36, { color: '#c8402f', size: 160 });
    label.position.y = -0.52;
    g.add(label);
    g.position.fromArray(pos);
    g.userData = { ...g.userData, name, zh, en, home: new THREE.Vector3(...pos), lit: false, glow };
    pickable(g, name, { hintY: 0.6 });
    root.add(g);
    return g;
  });
  const gather = { eye: new THREE.Vector3(-0.8, 2.15, 0.2), mouth: new THREE.Vector3(0.8, 2.15, 0.2), heart: new THREE.Vector3(0, 2.45, 0.2) };

  s.pickables = icons;
  let state = 'distracted', count = 0;
  s.cam = { pos: [0, 2.6, 6.2], look: [0, 1.6, 0] };
  s.sky = { top: 0xe8d9bc, horizon: 0xf3e6cc };
  s.light = { hemi: 1.2, sunIntensity: 1.6, sunPos: [4, 9, 8] };

  s.setState = (st) => {
    state = st;
    icons.forEach((i) => setActive(i, st === 'distracted' && !i.userData.lit));
    if (st !== 'distracted') icons.forEach((i) => { i.userData.lit = true; });
    s.cam = st === 'lesson' ? { pos: [0, 2.8, 7.5], look: [0, 1.6, 0] } : { pos: [0, 2.4, 6.4], look: [0, 1.65, 0] };
  };
  s.pick = (name, obj) => {
    if (state !== 'distracted' || obj.userData.lit) return [];
    obj.userData.lit = true;
    setActive(obj, false);
    count++;
    s.fx.sparkle(obj.position.clone(), { color: 0xfff0a0, n: 16, size: 0.35 });
    const out = [{ say: { who: 'guide', zh: obj.userData.zh, en: obj.userData.en } }];
    if (count === 3) out.push({ ev: 'done', delay: 2200 });
    return out;
  };
  s.autoTap = () => {
    const order = ['eye', 'mouth', 'heart'];
    const i = icons.filter((x) => !x.userData.lit).sort((a, b) => order.indexOf(a.userData.name) - order.indexOf(b.userData.name))[0];
    return i ? s.pick(i.userData.name, i) : [];
  };

  s.tick = (t, dt) => {
    const litCount = icons.filter((i) => i.userData.lit).length;
    glyphs.forEach((g) => {
      const k = t + g.userData.seed;
      const chaos = 1 - litCount / 3;
      const target = g.userData.row.clone().add(new THREE.Vector3(Math.sin(k * 1.7) * 1.2 * chaos, Math.sin(k * 2.3) * 0.5 * chaos, Math.cos(k * 1.3) * 0.4 * chaos));
      dampVec(g.position, target, 3, dt);
      g.rotation.z = damp(g.rotation.z, Math.sin(k * 3) * 0.6 * chaos, 4, dt);
    });
    icons.forEach((i, idx) => {
      const lit = i.userData.lit;
      const target = lit ? gather[i.userData.name] : i.userData.home.clone().add(new THREE.Vector3(0, Math.sin(t * 1.5 + idx) * 0.15, 0));
      dampVec(i.position, target, 3, dt);
      i.scale.setScalar(damp(i.scale.x, lit ? 0.6 : 1, 3, dt));
      i.userData.glow.material.opacity = damp(i.userData.glow.material.opacity, lit ? 0.7 : 0.15, 3, dt);
      i.rotation.y = Math.sin(t + idx) * 0.3;
    });
    heart.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
    animateFigure(you, t, state === 'distracted' ? 'idle' : 'read');
    if (state === 'distracted') you.userData.head.rotation.y = Math.sin(t * 2) * 0.5;
  };
  return s;
}

// ---------------------------------------------------------------- finale
export function finaleScene() {
  const s = base();
  const { root } = s;
  root.add(backdrop({ seedBase: 91 }));
  root.add(ground({ radius: 10 }));
  const mine = tree({ kind: 'blossom', h: 3.6 });
  root.add(mine);
  const blooms = new THREE.Group();
  root.add(blooms);
  const cast = [
    ['woman', 0x4d7f8f], ['child', 0xd29b3c], ['elder', 0x6b5b4a], ['child', 0x9c4a3c], ['child', C.vermilion],
    ['child', 0x7a6a8f], ['man', 0x3f6b5a], ['child', 0x3d7fb0], ['elder', 0x5b4a6e],
  ].map(([kind, robe], i, arr) => {
    const f = figure({ kind, robe });
    const a = Math.PI * 0.15 + (i / (arr.length - 1)) * Math.PI * 0.7;
    f.position.set(Math.cos(a + Math.PI) * -4.2, 0, Math.sin(a) * 2.2 + 0.8);
    f.rotation.y = faceYaw(f.position, new THREE.Vector3(0, 0, 8));
    root.add(f);
    return f;
  });
  const you = figure({ kind: 'child', robe: YOU_ROBE });
  you.position.set(0, 0, 2.2);
  root.add(you);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-6, 5.2, -2), new THREE.Vector3(0, 4.2, -2), new THREE.Vector3(6, 5.2, -2));
  root.add(mesh(new THREE.TubeGeometry(curve, 30, 0.02, 5), mat(C.ink), { shadow: false }));
  for (let i = 0; i < 7; i++) {
    const p = curve.getPoint((i + 0.5) / 7);
    const l = lantern({ scale: 0.5 });
    l.position.set(p.x, p.y - 0.6, p.z);
    root.add(l);
  }
  const cranes = [0, 1].map(() => { const c = crane(); c.scale.setScalar(0.7); root.add(c); return c; });
  const fireworks = [];

  s.cam = { pos: [0, 3.6, 11], look: [0, 2, 0] };
  s.sky = { top: 0x86b9d0, horizon: 0xfbe9cc };

  s.setState = (st, vars) => {
    const n = Math.min(vars.good ?? 0, 40);
    while (blooms.children.length) blooms.remove(blooms.children[0]);
    // One flower per good choice, spread over the front of the canopy.
    for (let i = 0; i < Math.max(n, 1); i++) {
      const u = (i + 0.5) / Math.max(n, 1);
      const yaw = (u - 0.5) * 2.6 + Math.sin(i * 7.3) * 0.2;
      const pitch = -0.2 + ((i * 0.618) % 1) * 0.9;
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      const f = new THREE.Group();
      const petal = mesh(new THREE.IcosahedronGeometry(0.13, 0), glowMat([0xffd0dc, 0xfff4b0, 0xffffff][i % 3], 1.1), { shadow: false });
      f.add(petal, glowSprite([0xffc0d0, 0xfff0a0, 0xffffff][i % 3], 0.7, 0.8));
      f.position.set(0, 2.9, 0).addScaledVector(dir, 1.45);
      blooms.add(f);
    }
    s.cam = st === 'lesson' ? { pos: [0, 3.6, 13.5], look: [0, 2.4, 0] } : { pos: [0, 3.2, 11.5], look: [0, 2.3, 0] };
  };

  let next = 0;
  s.tick = (t, dt) => {
    cast.forEach((f, i) => animateFigure(f, t + i, i % 3 === 0 ? 'wave' : 'cheer'));
    animateFigure(you, t, 'cheer');
    blooms.children.forEach((b, i) => { b.children[1].material.opacity = 0.55 + Math.sin(t * 2 + i) * 0.3; b.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.08); });
    cranes.forEach((c, i) => {
      const a = t * 0.3 + i * Math.PI;
      c.position.set(Math.cos(a) * 7, 6 + i, Math.sin(a) * 4 - 2);
      c.rotation.y = Math.atan2(-Math.cos(a) * 4, -Math.sin(a) * 7); // face along the flight path
      flapCrane(c, t + i);
    });
    if (t > next) {
      next = t + 1.2 + Math.random();
      const pos = new THREE.Vector3((Math.random() - 0.5) * 12, 6 + Math.random() * 2, -4 - Math.random() * 3);
      s.fx.sparkle(pos, { color: [0xffd27a, 0xff8a80, 0x9fe0ff, 0xc9a0ff][Math.floor(Math.random() * 4)], n: 28, speed: 3, size: 0.5, life: 1.4, gravity: -1.5 });
    }
  };
  return s;
}
