import * as THREE from 'three';
import { disposeTree } from './kit.js';

const SKY_VERT = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 top;
  uniform vec3 bottom;
  uniform vec3 horizon;
  varying vec3 vPos;
  // cheap paper grain
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    float h = vPos.y;
    vec3 col = h > 0.0 ? mix(horizon, top, smoothstep(0.0, 0.6, h)) : mix(horizon, bottom, smoothstep(0.0, 0.3, -h));
    col += (hash(gl_FragCoord.xy) - 0.5) * 0.025;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class World {
  constructor(canvas) {
    // Some browsers (e.g. Brave with strict Shields) block WebGL. The story still runs
    // without a renderer: scenes are simulated, just not drawn.
    try {
      // ?no3d simulates a browser that blocks WebGL, for testing the fallback.
      if (new URLSearchParams(location.search).has('no3d')) throw new Error('WebGL disabled by ?no3d');
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
    } catch (err) {
      console.warn('WebGL unavailable; continuing without 3D', err);
      this.renderer = null;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    this.camera.position.set(0, 5, 14);

    this.skyUniforms = {
      top: { value: new THREE.Color(0x9cc6d4) },
      horizon: { value: new THREE.Color(0xf6ead2) },
      bottom: { value: new THREE.Color(0xe9dcc2) },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 32, 16),
      new THREE.ShaderMaterial({ uniforms: this.skyUniforms, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }),
    );
    sky.renderOrder = -100;
    this.scene.add(sky);
    this.sky = sky;

    this.scene.fog = new THREE.Fog(0xf3e9d6, 30, 90);

    this.hemi = new THREE.HemisphereLight(0xfff6e5, 0xa89a80, 1.4);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
    this.sun.position.set(8, 14, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    const sc = this.sun.shadow.camera;
    sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 60;
    this.scene.add(this.sun, this.sun.target);

    this.active = null;
    this.camPos = new THREE.Vector3(0, 5, 14);
    this.camLook = new THREE.Vector3(0, 1, 0);
    this.lookCur = this.camLook.clone();
    this.pointer = new THREE.Vector2();
    this.offsetX = 0; // fraction of width the focus should shift (panel on the right)
    this.timer = new THREE.Timer();
    this.beat = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer?.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 50 : 40;
    this.applyOffset();
  }

  setFocusOffset(fx, fy = 0) {
    this.offsetX = fx;
    this.offsetY = fy;
    this.applyOffset();
  }

  applyOffset() {
    const w = window.innerWidth, h = window.innerHeight;
    if (this.offsetX || this.offsetY) {
      this.camera.setViewOffset(w, h, this.offsetX * w, (this.offsetY || 0) * h, w, h);
    } else {
      this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();
  }

  show(sceneDef) {
    if (this.active) {
      this.scene.remove(this.active.root);
      disposeTree(this.active.root);
    }
    const s = sceneDef();
    this.active = s;
    this.beat = 0;
    this.scene.add(s.root);
    const sky = s.sky || {};
    this.skyUniforms.top.value.set(sky.top ?? 0x9cc6d4);
    this.skyUniforms.horizon.value.set(sky.horizon ?? 0xf6ead2);
    this.skyUniforms.bottom.value.set(sky.bottom ?? 0xe9dcc2);
    const fog = s.fog || {};
    this.scene.fog.color.set(fog.color ?? sky.horizon ?? 0xf3e9d6);
    this.scene.fog.near = fog.near ?? 30;
    this.scene.fog.far = fog.far ?? 90;
    const light = s.light || {};
    this.hemi.color.set(light.sky ?? 0xfff6e5);
    this.hemi.groundColor.set(light.ground ?? 0xa89a80);
    this.hemi.intensity = light.hemi ?? 1.4;
    this.sun.color.set(light.sun ?? 0xfff0d6);
    this.sun.intensity = light.sunIntensity ?? 2.2;
    this.sun.position.fromArray(light.sunPos ?? [8, 14, 10]);
    if (this.renderer) this.renderer.toneMappingExposure = light.exposure ?? 1.05;
    this.camPos.fromArray(s.cam.pos);
    this.camLook.fromArray(s.cam.look);
    // Start slightly behind the first shot so each chapter opens with a gentle dolly-in.
    this.camera.position.copy(this.camPos).add(new THREE.Vector3(0, 1.2, 3.5));
    this.lookCur.copy(this.camLook);
  }

  setBeat(b) {
    this.beat = b;
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.timer.update();
      this.step(Math.min(this.timer.getDelta(), 0.05));
    };
    loop();
  }

  step(dt) {
    {
      this.time = (this.time ?? 0) + dt;
      const t = this.time;
      const s = this.active;
      if (s) {
        s.update?.(t, dt, this.beat);
        if (s.cam) {
          this.camPos.fromArray(s.cam.pos);
          this.camLook.fromArray(s.cam.look);
        }
      }
      const drift = this.reducedMotion ? 0 : 1;
      // Portrait screens see less width, so dolly back along the view ray to keep the subject framed.
      const aspect = this.camera.aspect;
      const pull = aspect < 1 ? Math.min(0.8 / Math.max(aspect, 0.45), 1.7) : 1;
      const base = this.camLook.clone().lerp(this.camPos, Math.max(pull, 1));
      const target = base.add(new THREE.Vector3(
        this.pointer.x * 0.8 * drift + Math.sin(t * 0.15) * 0.4 * drift,
        -this.pointer.y * 0.4 * drift,
        0,
      ));
      const k = 1 - Math.exp(-dt * 1.6);
      this.camera.position.lerp(target, k);
      this.lookCur.lerp(this.camLook, k);
      this.camera.lookAt(this.lookCur);
      this.sun.target.position.copy(this.lookCur);
      this.renderer?.render(this.scene, this.camera);
    }
  }
}
