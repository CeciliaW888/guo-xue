// Small shared helpers for scene animation and tap interaction.
import * as THREE from 'three';
import { glowSprite, mesh, mat } from './kit.js';

export const damp = THREE.MathUtils.damp;

export function dampVec(v, target, lambda, dt) {
  v.x = damp(v.x, target.x, lambda, dt);
  v.y = damp(v.y, target.y, lambda, dt);
  v.z = damp(v.z, target.z, lambda, dt);
}

// Mark an object as tappable. `name` is what the scene's pick() receives.
// A soft pulsing halo floats above active pickables so children know where to tap.
export function pickable(obj, name, { hintY = 1.2, hintScale = 0.9, color = 0xffe08a } = {}) {
  obj.userData.pick = name;
  obj.userData.active = false;
  const halo = glowSprite(color, hintScale, 0);
  halo.position.y = hintY;
  halo.userData.isHint = true;
  obj.add(halo);
  obj.userData.halo = halo;
  return obj;
}

export function setActive(obj, on) {
  obj.userData.active = on;
}

export function animateHints(list, t) {
  for (const o of list) {
    const h = o.userData.halo;
    if (!h) continue;
    const target = o.userData.active ? 0.55 + Math.sin(t * 4) * 0.3 : 0;
    h.material.opacity += (target - h.material.opacity) * 0.15;
    h.position.y = h.position.y + (((o.userData.hintBase ??= h.position.y) + Math.sin(t * 3) * 0.08) - h.position.y) * 0.3;
    h.visible = h.material.opacity > 0.01;
  }
}

// Short-lived particle bursts (dust, sparkles, hearts).
export class Bursts {
  constructor(parent) {
    this.parent = parent;
    this.items = [];
  }

  sparkle(pos, { color = 0xffe08a, n = 14, speed = 2, size = 0.35, life = 0.9, gravity = -1 } = {}) {
    for (let i = 0; i < n; i++) {
      const s = glowSprite(color, size, 1);
      s.position.copy(pos);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.2, Math.random() - 0.5).normalize();
      this.parent.add(s);
      this.items.push({ o: s, v: dir.multiplyScalar(speed * (0.5 + Math.random())), life, age: 0, gravity, sprite: true });
    }
  }

  chunks(pos, { color = 0x8f8a80, n = 6, size = 0.08, speed = 2.5, life = 1.2 } = {}) {
    for (let i = 0; i < n; i++) {
      const m = mesh(new THREE.TetrahedronGeometry(size * (0.6 + Math.random() * 0.8)), mat(color));
      m.position.copy(pos);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.3, Math.random() - 0.2).normalize();
      this.parent.add(m);
      this.items.push({ o: m, v: dir.multiplyScalar(speed * (0.6 + Math.random())), life, age: 0, gravity: -9, spin: Math.random() * 10 });
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.age += dt;
      it.v.y += it.gravity * dt;
      it.o.position.addScaledVector(it.v, dt);
      if (it.spin) { it.o.rotation.x += it.spin * dt; it.o.rotation.z += it.spin * dt; }
      const k = 1 - it.age / it.life;
      if (it.sprite) it.o.material.opacity = Math.max(k, 0);
      else it.o.scale.setScalar(Math.max(k, 0.01));
      if (it.age >= it.life) {
        this.parent.remove(it.o);
        it.o.geometry?.dispose?.();
        if (it.sprite) it.o.material.dispose();
        this.items.splice(i, 1);
      }
    }
  }
}

// Move a figure toward a target on the ground, facing its direction. Returns true while walking.
export function walkTo(fig, target, dt, speed = 2.2) {
  const p = fig.position;
  const dx = target.x - p.x, dz = target.z - p.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05) return false;
  const step = Math.min(d, speed * dt);
  p.x += (dx / d) * step;
  p.z += (dz / d) * step;
  const yaw = Math.atan2(dx, dz);
  fig.rotation.y = lerpAngle(fig.rotation.y, yaw, 1 - Math.exp(-dt * 10));
  return true;
}

export function turnTo(fig, yaw, dt) {
  fig.rotation.y = lerpAngle(fig.rotation.y, yaw, 1 - Math.exp(-dt * 6));
}

export function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function faceYaw(from, to) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}
