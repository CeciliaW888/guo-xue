import * as THREE from 'three';
import { disposeTree, glowSprite } from './kit.js';
import { stars } from './env.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

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
    // Warm only in a thin band at the horizon, blue quickly above it.
    // Three stops so cream never mixes into grey: warm horizon -> clear light blue -> deep top.
    vec3 mid = mix(top, vec3(0.78, 0.88, 0.95), 0.55);
    vec3 up = mix(mid, top, smoothstep(0.1, 0.5, h));
    vec3 col = h > 0.0 ? mix(horizon, up, smoothstep(0.0, 0.1, h)) : mix(horizon, bottom, smoothstep(0.0, 0.3, -h));
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
      const mobile = window.matchMedia('(pointer: coarse)').matches;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
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

    this.scene.fog = new THREE.Fog(0xf3e9d6, 40, 220);

    // Soft image-based fill light, a sun in the sky, and stars for night scenes.
    if (this.renderer) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      // Bloom makes lanterns, fireflies and the sun glow; MSAA target keeps edges clean.
      const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
      this.composer = new EffectComposer(this.renderer, target);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.5, 0.96);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    this.sunSprite = glowSprite(0xfff1c8, 26, 0.7);
    this.sunSprite.material.fog = false;
    this.scene.add(this.sunSprite);
    this.stars = stars();
    this.scene.add(this.stars);

    this.hemi = new THREE.HemisphereLight(0xfff6e5, 0xa89a80, 1.4);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
    this.sun.position.set(8, 14, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 3;
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
    this.composer?.setSize(w, h);
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
    this.tickers = [];
    s.root.traverse((o) => o.userData.tick && this.tickers.push(o.userData.tick));
    const sky = s.sky || {};
    // Default: clear late-afternoon sky, deep blue overhead, warm at the horizon.
    this.skyUniforms.top.value.set(sky.top ?? 0x5d9fd6);
    this.skyUniforms.horizon.value.set(sky.horizon ?? 0xf6dcae);
    this.skyUniforms.bottom.value.set(sky.bottom ?? 0xe9dcc2);
    const fog = s.fog || {};
    this.scene.fog.color.set(fog.color ?? sky.horizon ?? 0xf3e9d6);
    this.scene.fog.near = fog.near ?? 45;
    this.scene.fog.far = fog.far ?? 330;
    const light = s.light || {};
    this.hemi.color.set(light.sky ?? 0xfff6e5);
    this.hemi.groundColor.set(light.ground ?? 0xa89a80);
    this.hemi.intensity = (light.hemi ?? 1.4) * 0.6;
    this.sun.color.set(light.sun ?? 0xffe2b8);
    this.sun.intensity = (light.sunIntensity ?? 2.2) * 1.25;
    // Low sun for long, soft shadows.
    this.sun.position.fromArray(light.sunPos ?? [14, 10, 8]);
    if (this.renderer) this.renderer.toneMappingExposure = light.exposure ?? 1.0;
    // Night when the sky top is dark: stars on, sun off, less ambient fill.
    const night = new THREE.Color(sky.top ?? 0x9cc6d4).getHSL({}).l < 0.25;
    this.stars.visible = night && !s.indoor;
    this.sunSprite.visible = !night && !s.indoor;
    this.sunSprite.position.copy(this.sun.position).normalize().multiplyScalar(180);
    this.scene.environmentIntensity = light.env ?? (night ? 0.08 : 0.22);
    if (this.bloom) {
      this.bloom.strength = light.bloom ?? (night ? 0.45 : 0.22);
      this.bloom.threshold = night ? 0.78 : 0.96;
    }
    this.camPos.fromArray(s.cam.pos);
    this.camLook.fromArray(s.cam.look);
    // Start slightly behind the first shot so each chapter opens with a gentle dolly-in.
    this.camera.position.copy(this.camPos).add(new THREE.Vector3(0, 1.2, 3.5));
    this.lookCur.copy(this.camLook);
  }

  // A new narrated line: start a fresh slow push-in from a slightly different angle.
  cue() {
    this.shot = { k: 1, side: (this.shot?.side ?? 1) * -1 };
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
        for (const tk of this.tickers) tk(t, dt);
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
      if (this.shot && !this.reducedMotion) {
        // Ease the shot in over ~6s: start pulled back and off to one side, drift toward the framing.
        this.shot.k *= Math.exp(-dt / 2.2);
        const back = this.camPos.clone().sub(this.camLook).normalize();
        const side = new THREE.Vector3(back.z, 0, -back.x).normalize();
        base.addScaledVector(back, 1.4 * this.shot.k).addScaledVector(side, 0.9 * this.shot.k * this.shot.side);
        base.y += 0.35 * this.shot.k;
      }
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
      if (this.composer) this.composer.render(dt);
      else this.renderer?.render(this.scene, this.camera);
    }
  }
}
