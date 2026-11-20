'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ArrowUp, ArrowDown, RotateCcw, RotateCw, Stamp, Gift, Lock, Loader2, Volume2, VolumeX, Ghost, Maximize2, Minimize2, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/**
 * The haunted tower (3D, first person). Floors joined by doors to the stairs
 * (one floor more than there are doors; new floors are added on the server); the door of floor f opens once `placed` >= chambers[f + 1] (first
 * door 5 stamps, then 10 more each). From floor 2 up every floor has a chest
 * with the gift of the door you just opened. Ghosts, monsters that jump at
 * you and lightning, all switchable off.
 *
 * Stamps are placed through `onPlace`; the server keeps the count.
 */

const LAYOUTS = [
  ['####D####', '#.......#', '#.#...#.#', '#.......#', '#..C....#', '#.......#', '#.#...#.#', '#.......#', '#########'],
  ['####D####', '#..#.#..#', '#.#...#.#', '#.#.#.#.#', '#.......#', '##.###.##', '#C......#', '#.......#', '#########'],
  ['####D####', '#.......#', '#.##.##.#', '#.......#', '##.#.#.##', '#...#...#', '#.#...#C#', '#.......#', '#########'],
];
// Film look on top of the render: vignette, grain, faded colour, and a colour
// split that jumps while a monster lunges (fear).
const FILM = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, fear: { value: 0 } },
  vertexShader: `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float fear; varying vec2 vUv;
float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 7.0) * 43758.5453); }
void main() {
  vec2 d = vUv - 0.5;
  float ab = 0.002 + fear * 0.012;
  vec3 c = vec3(texture2D(tDiffuse, vUv + d * ab).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ab).b);
  c *= mix(0.25, 1.0, smoothstep(0.9, 0.2, length(d)));
  c += (rnd(vUv * 731.0) - 0.5) * 0.05;
  float g = dot(c, vec3(0.3, 0.59, 0.11));
  c = mix(c, vec3(g) * vec3(1.06, 0.97, 0.9), 0.22);
  c.r += fear * 0.08;
  gl_FragColor = vec4(c, 1.0);
}`,
};

const FLOOR_KEY = 'unlocked_tower_floor';
const CHEST_KEY = 'unlocked_tower_chests';
const PREF_KEY = 'unlocked_tower_prefs';

type Props = {
  placed: number; chambers: number[]; pocket: number; onPlace: () => Promise<unknown>; busy: boolean;
  /** Inside the phone app: always full screen, and the corner button closes the game. */
  embedded?: boolean; onClose?: () => void;
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function TowerGame({ placed, chambers, pocket, onPlace, busy, embedded = false, onClose }: Props) {
  const { t } = useTranslation();
  const wrap = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const live = useRef({ placed, sound: true, scares: true });
  live.current.placed = placed;
  const doorsOpen = chambers.filter((c) => placed >= c).length - 1;
  const FLOORS = chambers.length; // floors = doors + 1

  const [started, setStarted] = useState(false);
  const [floor, setFloor] = useState(0);
  const [nearDoor, setNearDoor] = useState(false);
  const [chestMsg, setChestMsg] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [scares, setScares] = useState(true);
  const [hint, setHint] = useState('');
  const floorRef = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(embedded);
  // Real fullscreen where the browser allows it (not on iPhone): otherwise
  // the game simply covers the whole window.
  const toggleFull = async () => {
    const el = stage.current as any;
    if (!full) {
      setFull(true);
      try { await (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.()); } catch {}
    } else {
      setFull(false);
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}
    }
  };
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement && !embedded) setFull(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  useEffect(() => {
    // No page scrolling behind the game while it covers the window.
    document.body.style.overflow = full ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [full]);

  useEffect(() => {
    const prefs = readJSON(PREF_KEY, { sound: true, scares: true });
    setSound(prefs.sound);
    setScares(prefs.scares);
    const f = Math.max(0, Math.min(readJSON(FLOOR_KEY, 0), doorsOpen, FLOORS - 1));
    setFloor(f);
    floorRef.current = f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    live.current.sound = sound;
    live.current.scares = scares;
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ sound, scares })); } catch {}
  }, [sound, scares]);

  const need = (f: number) => chambers[f + 1] - chambers[f];
  const inDoor = (f: number) => Math.max(0, Math.min(need(f), placed - chambers[f]));

  // ── The 3D world ──
  useEffect(() => {
    if (!started || !wrap.current) return;
    const host = wrap.current;
    // Shadows and bloom on computers; phones and weak devices get the light version.
    const hi = !window.matchMedia('(pointer: coarse)').matches && ((navigator as any).deviceMemory ?? 8) >= 4;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const ratio = Math.min(hi ? 2 : 1.5, window.devicePixelRatio);
    renderer.setPixelRatio(ratio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    renderer.shadowMap.enabled = hi;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030206);
    scene.fog = new THREE.FogExp2(0x050309, 0.09);
    const cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 40);
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(ratio);
    composer.addPass(new RenderPass(scene, cam));
    if (hi) composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.55, 0.8));
    composer.addPass(new OutputPass());
    const film = new ShaderPass(FILM);
    composer.addPass(film);
    const size = () => {
      const w = host.clientWidth, h = host.clientHeight || (w * 9) / 16;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    size();

    let sd = 5;
    const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const tex = (draw: (x: CanvasRenderingContext2D) => void, sz = 256) => {
      const c = document.createElement('canvas');
      c.width = c.height = sz;
      draw(c.getContext('2d')!);
      const tx = new THREE.CanvasTexture(c);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tx;
    };
    // Relief from brightness: dark mortar and cracks sink, bright stone stands out.
    const reliefOf = (t: THREE.Texture, k: number) => {
      const src = t.image as HTMLCanvasElement, w = src.width, h = src.height;
      const g = src.getContext('2d')!.getImageData(0, 0, w, h).data;
      const L = (x: number, y: number) => { const i = (((y + h) % h) * w + ((x + w) % w)) * 4; return (g[i] + g[i + 1] + g[i + 2]) / 765; };
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const cx = c.getContext('2d')!, img = cx.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (L(x + 1, y) - L(x - 1, y)) * k, dy = (L(x, y + 1) - L(x, y - 1)) * k;
        const len = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
        img.data[i] = (-dx / len * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / len * 0.5 + 0.5) * 255; img.data[i + 2] = (0.5 / len + 0.5) * 255; img.data[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      const n = new THREE.CanvasTexture(c); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.copy(t.repeat);
      return n;
    };
    const grit = (x: CanvasRenderingContext2D, sz: number, n: number) => {
      for (let i = 0; i < n; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,240,220,.07)'; x.fillRect(r() * sz, r() * sz, 1 + r() * 2, 1 + r() * 2); }
    };
    const stone = tex((x) => {
      x.fillStyle = '#141216'; x.fillRect(0, 0, 512, 512);
      // 11 courses of blocks about 40 x 20 cm on a 1 x 2.2 m wall face
      for (let row = 0; row < 11; row++) for (let b = -1; b < 3; b++) {
        const RH = 512 / 11, BW = 205, off = (row % 2) * BW * 0.5 + r() * 20, n = r(), bx = b * BW + off + 4, by = row * RH + 4 + r() * 1.5, bw = BW - 8 - r() * 10, bh = RH - 7 - r() * 2;
        const base = 58 + n * 40;
        x.fillStyle = `rgb(${base | 0},${(base - 4 - r() * 6) | 0},${(base + 2) | 0})`; x.fillRect(bx, by, bw, bh);
        for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,245,230'},${0.04 + r() * 0.08})`; x.fillRect(bx + r() * bw * 0.8, by + r() * bh * 0.7, 8 + r() * 30, 4 + r() * 14); }
        x.fillStyle = 'rgba(255,240,220,.10)'; x.fillRect(bx, by, bw, 3); x.fillRect(bx, by, 3, bh);
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(bx, by + bh - 5, bw, 5); x.fillRect(bx + bw - 4, by, 4, bh);
        if (r() < 0.3) { x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 1.5; x.beginPath(); let cx = bx + r() * bw, cy = by; x.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (r() - 0.5) * 20; cy += bh / 4; x.lineTo(cx, cy); } x.stroke(); }
      }
      // Damp and moss running down from the top
      for (let i = 0; i < 7; i++) {
        const sx = r() * 512, gr = x.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0, 'rgba(18,40,22,.55)'); gr.addColorStop(0.5 + r() * 0.4, 'rgba(10,20,12,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gr; x.fillRect(sx, 0, 10 + r() * 40, 512);
      }
      grit(x, 512, 9000);
    }, 512);
    const floorT = tex((x) => {
      x.fillStyle = '#0d0a0c'; x.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const n = r(), fx = i * 128 + 4, fy = j * 128 + 4, base = 40 + n * 22;
        x.fillStyle = `rgb(${base | 0},${(base - 7) | 0},${(base - 3) | 0})`; x.fillRect(fx, fy, 120, 120);
        for (let k = 0; k < 18; k++) { x.fillStyle = `rgba(${r() < 0.6 ? '0,0,0' : '255,240,220'},${0.04 + r() * 0.07})`; x.beginPath(); x.arc(fx + r() * 120, fy + r() * 120, 4 + r() * 22, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = 'rgba(255,240,220,.08)'; x.fillRect(fx, fy, 120, 3);
        x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(fx, fy + 116, 120, 4);
        if (r() < 0.4) { x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.5; x.beginPath(); let cx = fx, cy = fy + r() * 120; x.moveTo(cx, cy); for (let k = 0; k < 5; k++) { cx += 24; cy += (r() - 0.5) * 30; x.lineTo(cx, cy); } x.stroke(); }
      }
      grit(x, 512, 8000);
    }, 512);
    floorT.repeat.set(9, 11);
    const wallMat = new THREE.MeshStandardMaterial({ map: stone, normalMap: reliefOf(stone, 5), normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorT, normalMap: reliefOf(floorT, 4), roughness: 0.72 });
    // Flame: a soft glowing blob (bloom makes it burn)
    const flameTex = (() => {
      const c = document.createElement('canvas'); c.width = 64; c.height = 128;
      const x = c.getContext('2d')!, gr = x.createRadialGradient(32, 80, 2, 32, 72, 52);
      gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.25, 'rgba(255,190,80,.9)'); gr.addColorStop(0.6, 'rgba(230,80,20,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 128);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const flameMat = new THREE.SpriteMaterial({ map: flameTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    const holderMat = new THREE.MeshStandardMaterial({ color: 0x22180f, roughness: 0.6, metalness: 0.4 });
    const boxG = new THREE.BoxGeometry(1, 2.2, 1);

    // Door with stamp slots
    const doorC = document.createElement('canvas'); doorC.width = doorC.height = 256;
    const dx = doorC.getContext('2d')!; const doorT = new THREE.CanvasTexture(doorC); doorT.colorSpace = THREE.SRGBColorSpace;
    const paintDoor = (f: number) => {
      const top = f >= FLOORS - 1;
      dx.fillStyle = '#3b2a1c'; dx.fillRect(0, 0, 256, 256);
      dx.fillStyle = '#4f3825'; for (let i = 0; i < 5; i++) dx.fillRect(10 + i * 50, 0, 40, 256);
      dx.fillStyle = '#c99a2e'; dx.font = 'bold 34px serif'; dx.textAlign = 'center';
      if (top) { dx.font = 'bold 26px serif'; dx.fillText(t('tw.soon_door'), 128, 140); doorT.needsUpdate = true; return; }
      const n = chambers[f + 1] - chambers[f], k = Math.max(0, Math.min(n, live.current.placed - chambers[f]));
      dx.fillStyle = '#2a2e33'; dx.fillRect(0, 90, 256, n > 5 ? 90 : 50);
      for (let i = 0; i < n; i++) {
        const col = i % 5, row = Math.floor(i / 5);
        dx.beginPath(); dx.arc(38 + col * 45, 115 + row * 42, 15, 0, Math.PI * 2);
        dx.fillStyle = i < k ? '#d22a28' : '#111417'; dx.fill(); dx.lineWidth = 3; dx.strokeStyle = '#c99a2e'; dx.stroke();
      }
      dx.fillStyle = '#c99a2e'; dx.fillText(`↑ ${f + 2}`, 128, 60);
      doorT.needsUpdate = true;
    };
    const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2.2, 0.15), new THREE.MeshStandardMaterial({ map: doorT, roughness: 0.8 }));
    scene.add(door);

    // Chest
    const chest = new THREE.Group();
    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), new THREE.MeshStandardMaterial({ color: 0x6b3f17 })); chestBody.position.y = 0.15;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.35), new THREE.MeshStandardMaterial({ color: 0x8a5422 })); lid.position.y = 0.35;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.37), new THREE.MeshStandardMaterial({ color: 0xc99a2e, metalness: 0.6 })); band.position.y = 0.22;
    chest.add(chestBody, lid, band); scene.add(chest);
    const glow = new THREE.PointLight(0xffd76a, 0, 2); scene.add(glow);
    const ambient = new THREE.AmbientLight(0x6e5f78, 1.0); scene.add(ambient);
    const hand = new THREE.PointLight(0xffa040, 8, 8, 2); scene.add(hand);
    // Dust drifting in the torchlight
    const dustN = hi ? 600 : 220, dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) { dustPos[i * 3] = 0.5 + Math.random() * 7; dustPos[i * 3 + 1] = Math.random() * 2.2; dustPos[i * 3 + 2] = -0.5 + Math.random() * 9; }
    const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustG, new THREE.PointsMaterial({ color: 0x9a8060, size: 0.008, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })));

    // Monster and ghost
    // The monster: a starved, hunched figure in rags, grey clammy skin with
    // veins, a long skull with sunken glowing eyes and teeth, and long arms
    // with claws that reach for you when it lunges. Its front faces +z.
    const monster = new THREE.Group();
    const mParts = { upper: new THREE.Group(), head: new THREE.Group(), jaw: new THREE.Group(), arms: [] as THREE.Group[], fingers: [] as THREE.Mesh[] };
    {
      const skinT = tex((x) => {
        x.fillStyle = '#8b8d82'; x.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '40,45,30' : '120,95,95'},${0.05 + r() * 0.12})`; x.beginPath(); x.arc(r() * 256, r() * 256, 3 + r() * 18, 0, Math.PI * 2); x.fill(); }
        for (let i = 0; i < 26; i++) {
          x.strokeStyle = `rgba(${r() < 0.5 ? '60,20,40' : '30,40,70'},${0.35 + r() * 0.3})`; x.lineWidth = 0.6 + r() * 1.4; x.beginPath();
          let vx = r() * 256, vy = r() * 256; x.moveTo(vx, vy);
          for (let k = 0; k < 6; k++) { vx += (r() - 0.5) * 40; vy += (r() - 0.5) * 40; x.lineTo(vx, vy); }
          x.stroke();
        }
        grit(x, 256, 3000);
      });
      const skin = new THREE.MeshStandardMaterial({ map: skinT, normalMap: reliefOf(skinT, 3), roughness: 0.5, metalness: 0.05 });
      const rag = new THREE.MeshStandardMaterial({ color: 0x17120f, roughness: 1, side: THREE.DoubleSide });
      const bone = new THREE.MeshStandardMaterial({ color: 0xc8bb98, roughness: 0.45 });
      const hole = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const glowEye = new THREE.MeshBasicMaterial({ color: 0xff2a10 });
      const jitter = (g: THREE.BufferGeometry, amt: number, f?: (v: THREE.Vector3) => void) => {
        const pos = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); f?.(v); v.x += (Math.random() - 0.5) * amt; v.y += (Math.random() - 0.5) * amt; v.z += (Math.random() - 0.5) * amt; pos.setXYZ(i, v.x, v.y, v.z); }
        g.computeVertexNormals(); return g;
      };
      // Tattered robe from the waist down, its hem torn
      const robeG = new THREE.LatheGeometry([0.05, 0.12, 0.16, 0.2, 0.24, 0.27].map((rr, i) => new THREE.Vector2(rr, 1.0 - i * 0.18)), 18);
      jitter(robeG, 0.03, (v) => { if (v.y < 0.2) v.y += Math.random() * 0.25; });
      const robe = new THREE.Mesh(robeG, rag); monster.add(robe);
      // Upper body, bent forward from the hips
      mParts.upper.position.y = 0.98; mParts.upper.rotation.x = 0.38; monster.add(mParts.upper);
      const torsoG = new THREE.LatheGeometry([[0.11, 0], [0.085, 0.14], [0.15, 0.32], [0.16, 0.44], [0.12, 0.56], [0.045, 0.62]].map(([a, b]) => new THREE.Vector2(a, b)), 16);
      const torso = new THREE.Mesh(jitter(torsoG, 0.008), skin); torso.scale.z = 0.72; mParts.upper.add(torso);
      for (let i = 0; i < 5; i++) { // ribs pushing through the skin
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.15 - Math.abs(i - 1.5) * 0.008, 0.0055, 5, 14, Math.PI * 0.7), skin);
        rib.position.set(0, 0.24 + i * 0.05, 0.005); rib.rotation.set(Math.PI / 2, 0, Math.PI * 0.15); rib.scale.set(1, 0.72, 1); mParts.upper.add(rib);
      }
      // Head: long skull, hollow cheeks
      mParts.head.position.set(0, 0.68, 0.04); mParts.upper.add(mParts.head);
      const skullG = jitter(new THREE.SphereGeometry(0.12, 24, 18), 0.006, (v) => { if (v.y < 0) v.y *= 1.5; if (v.y < -0.02 && Math.abs(v.x) > 0.05) v.x *= 0.82; v.z *= 0.95; });
      const skull = new THREE.Mesh(skullG, skin); skull.scale.set(0.9, 1.15, 1); mParts.head.add(skull);
      [-1, 1].forEach((s) => {
        const sock = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), hole); sock.position.set(s * 0.045, 0.02, 0.092); sock.scale.set(1, 0.8, 0.5); mParts.head.add(sock);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), glowEye); eye.position.set(s * 0.045, 0.018, 0.1); mParts.head.add(eye);
        const strand = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.35), rag); strand.position.set(s * (0.07 + Math.random() * 0.04), -0.05, 0.03); strand.rotation.z = s * 0.15; mParts.head.add(strand);
      });
      const mouthHole = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), hole); mouthHole.position.set(0, -0.085, 0.085); mouthHole.scale.set(1, 0.55, 0.4); mParts.head.add(mouthHole);
      for (let i = 0; i < 7; i++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.026, 5), bone); tooth.position.set(-0.033 + i * 0.011, -0.07, 0.1); tooth.rotation.x = Math.PI; mParts.head.add(tooth);
      }
      mParts.jaw.position.set(0, -0.1, 0.06); mParts.head.add(mParts.jaw);
      for (let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.024, 5), bone); tooth.position.set(-0.028 + i * 0.011, 0.005, 0.04); mParts.jaw.add(tooth);
      }
      const jawBone = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), skin); jawBone.scale.set(0.9, 0.6, 0.9); mParts.jaw.add(jawBone);
      // Long arms: shoulder -> elbow -> hand with four claws
      [-1, 1].forEach((s) => {
        const sh = new THREE.Group(); sh.position.set(s * 0.15, 0.52, 0); mParts.upper.add(sh); mParts.arms.push(sh);
        const up = new THREE.Mesh(jitter(new THREE.CylinderGeometry(0.03, 0.022, 0.42, 7), 0.004), skin); up.position.y = -0.21; sh.add(up);
        const el = new THREE.Group(); el.position.y = -0.42; el.rotation.x = -0.5; sh.add(el);
        const fo = new THREE.Mesh(jitter(new THREE.CylinderGeometry(0.022, 0.016, 0.46, 7), 0.004), skin); fo.position.y = -0.23; el.add(fo);
        const hand = new THREE.Group(); hand.position.y = -0.47; el.add(hand);
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), skin); hand.add(palm);
        for (let k = 0; k < 4; k++) {
          const fg = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.17, 5), bone); fg.position.set(-0.02 + k * 0.013, -0.1, 0); fg.rotation.set(0.15, 0, (k - 1.5) * 0.12); fg.rotation.x = Math.PI + 0.2; hand.add(fg); mParts.fingers.push(fg);
        }
        sh.rotation.set(-0.35, 0, s * 0.12);
      });
    }
    const monsterEye = new THREE.PointLight(0xff2010, 0, 2.5); scene.add(monsterEye);
    const tmpV = new THREE.Vector3();
    monster.scale.setScalar(0.8); monster.visible = false; scene.add(monster);

    // The ghost: a woman in a white gown, long black hair over the face, see-through
    // and glowing, the hem rippling as she drifts.
    const ghostTime = { value: 0 };
    const ghostMats: [THREE.Material, number][] = [];
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0xcdd8ea, emissive: 0x5d6f94, emissiveIntensity: 0.6, roughness: 0.9, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
    ghostMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = ghostTime;
      // The hem ripples, and the gown fades into nothing towards the floor.
      shader.vertexShader = 'uniform float uTime;\nvarying float vGy;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float hem = clamp(1.0 - position.y / 1.45, 0.0, 1.0);
        transformed.x += sin(position.y * 7.0 + uTime * 3.0 + position.z * 5.0) * 0.05 * hem;
        transformed.z += cos(position.y * 6.0 + uTime * 2.4 + position.x * 5.0) * 0.05 * hem;
        vGy = position.y;`);
      shader.fragmentShader = 'varying float vGy;\n' + shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
        gl_FragColor.a *= smoothstep(0.0, 0.75, vGy);`);
    };
    ghostMats.push([ghostMat, 0.4]);
    const ghost = new THREE.Group();
    {
      const faceT = tex((x) => {
        x.fillStyle = '#d9dde6'; x.fillRect(0, 0, 256, 256);
        const sock = (cx: number) => { const g = x.createRadialGradient(cx, 118, 4, cx, 118, 34); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(20,20,30,.8)'); g.addColorStop(1, 'rgba(60,60,80,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, 118, 34, 0, Math.PI * 2); x.fill(); };
        sock(100); sock(156);
        const m = x.createRadialGradient(128, 186, 2, 128, 186, 30); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(40,40,60,0)'); x.fillStyle = m; x.beginPath(); x.ellipse(128, 186, 16, 30, 0, 0, Math.PI * 2); x.fill();
      });
      const gownG = new THREE.LatheGeometry([[0.07, 1.45], [0.13, 1.38], [0.12, 1.15], [0.16, 0.8], [0.22, 0.4], [0.3, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 28);
      { // torn hem
        const gp = gownG.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < gp.count; i++) if (gp.getY(i) < 0.01) gp.setY(i, Math.random() * 0.3);
        gownG.computeVertexNormals();
      }
      const gown = new THREE.Mesh(gownG, ghostMat);
      ghost.add(gown);
      const faceMat = new THREE.MeshStandardMaterial({ map: faceT, emissive: 0x8090b0, emissiveIntensity: 0.5, roughness: 0.9, transparent: true, opacity: 0.6, depthWrite: false });
      ghostMats.push([faceMat, 0.6]);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), faceMat); face.scale.set(0.85, 1.15, 0.9); face.position.y = 1.58; face.rotation.y = -Math.PI / 2; ghost.add(face);
      // Hair: strands painted on soft see-through ribbons, thinning out at the ends
      const hairT = (() => {
        const c = document.createElement('canvas'); c.width = 128; c.height = 256;
        const x = c.getContext('2d')!;
        for (let i = 0; i < 70; i++) {
          const sx = Math.random() * 128, len = 150 + Math.random() * 106;
          const g = x.createLinearGradient(0, 0, 0, len); g.addColorStop(0, 'rgba(8,6,8,.95)'); g.addColorStop(0.75, 'rgba(8,6,8,.7)'); g.addColorStop(1, 'rgba(8,6,8,0)');
          x.strokeStyle = g; x.lineWidth = 1 + Math.random() * 2.5; x.beginPath(); x.moveTo(sx, 0);
          x.bezierCurveTo(sx + (Math.random() - 0.5) * 20, len * 0.4, sx + (Math.random() - 0.5) * 24, len * 0.7, sx + (Math.random() - 0.5) * 16, len); x.stroke();
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      })();
      const hairMat = new THREE.MeshStandardMaterial({ map: hairT, color: 0xffffff, roughness: 0.55, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
      ghostMats.push([hairMat, 0.95]);
      for (let i = 0; i < 9; i++) { // around the head, and hanging over the face
        const a = (i / 9) * Math.PI * 2, front = Math.cos(a) > 0.5;
        const h = new THREE.Mesh(new THREE.PlaneGeometry(0.11, front ? 0.6 : 0.85), hairMat);
        const rr = front ? 0.1 : 0.09;
        h.position.set(Math.sin(a) * rr, 1.66 - (front ? 0.26 : 0.38), Math.cos(a) * rr);
        h.rotation.set(front ? -0.12 : 0.05, a, (Math.random() - 0.5) * 0.1);
        ghost.add(h);
      }
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), new THREE.MeshStandardMaterial({ color: 0x080608, roughness: 0.5, transparent: true, opacity: 0.95, depthWrite: false }));
      crown.position.y = 1.6; ghostMats.push([crown.material as THREE.Material, 0.95]); ghost.add(crown);
      const armMat = faceMat;
      [-1, 1].forEach((s) => { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.6, 6), armMat); arm.position.set(s * 0.14, 1.08, 0.03); arm.rotation.z = s * 0.08; ghost.add(arm); });

    }
    ghost.scale.setScalar(0.85); ghost.visible = false; scene.add(ghost);
    const ghostLight = new THREE.PointLight(0x9fc0ff, 0, 3); scene.add(ghostLight);

    // Sound, generated (no files)
    let ac: AudioContext | null = null;
    let master: GainNode | null = null, windF: BiquadFilterNode | null = null, droneF: BiquadFilterNode | null = null;
    try {
      ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      ac.resume().catch(() => {});
      // Everything goes through one master volume, so the sound switch mutes it all.
      master = ac.createGain(); master.gain.value = live.current.sound ? 1 : 0; master.connect(ac.destination);
      // A low, uneasy drone that breathes slowly
      droneF = ac.createBiquadFilter(); droneF.type = 'lowpass'; droneF.frequency.value = 160;
      const dg = ac.createGain(); dg.gain.value = 0.07; droneF.connect(dg).connect(master);
      [41, 43.6, 61.8].forEach((fq) => { const o = ac!.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; o.connect(droneF!); o.start(); });
      // Wind howling through the tower
      const wb = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate), wd = wb.getChannelData(0);
      for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
      const ws = ac.createBufferSource(); ws.buffer = wb; ws.loop = true;
      windF = ac.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 500; windF.Q.value = 7;
      const wg = ac.createGain(); wg.gain.value = 0.06; ws.connect(windF).connect(wg).connect(master); ws.start();
    } catch {}
    const out = () => master!;
    const noise = (sec: number, shape: (p: number) => number) => {
      const n = ac!.createBuffer(1, ac!.sampleRate * sec, ac!.sampleRate), d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * shape(i / d.length);
      const s = ac!.createBufferSource(); s.buffer = n; return s;
    };
    const canPlay = () => !!ac && live.current.sound;
    const sting = () => {
      if (!canPlay()) return; const a = ac!, tt = a.currentTime;
      const s = noise(0.9, (p) => Math.pow(1 - p, 2)), bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; const g = a.createGain(); g.gain.value = 0.9; s.connect(bp).connect(g).connect(out()); s.start(tt);
      [220, 233, 311].forEach((f) => { const o = a.createOscillator(), gg = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * 0.5, tt + 1); gg.gain.setValueAtTime(0.12, tt); gg.gain.exponentialRampToValueAtTime(0.001, tt + 1.1); o.connect(gg).connect(out()); o.start(tt); o.stop(tt + 1.2); });
    };
    const thunder = () => { if (!canPlay()) return; const a = ac!; const s = noise(2.5, (p) => Math.pow(1 - p, 1.5) * (p < 0.05 ? p * 20 : 1)), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; const g = a.createGain(); g.gain.value = 1.2; s.connect(lp).connect(g).connect(out()); s.start(); };
    // A soft footstep on stone
    const footstep = () => {
      if (!canPlay()) return; const a = ac!, tt = a.currentTime;
      const s2 = noise(0.09, (q) => Math.pow(1 - q, 3)), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380 + Math.random() * 160;
      const g = a.createGain(); g.gain.value = 0.22 + Math.random() * 0.08; s2.connect(lp).connect(g).connect(out()); s2.start(tt);
    };
    const moan = () => { if (!canPlay()) return; const a = ac!, tt = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(320, tt); o.frequency.linearRampToValueAtTime(180, tt + 1.6); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.12, tt + 0.4); g.gain.linearRampToValueAtTime(0, tt + 1.8); o.connect(g).connect(out()); o.start(tt); o.stop(tt + 1.9); };
    // A wooden creak somewhere in the dark
    const creak = () => {
      if (!canPlay()) return; const a = ac!, tt = a.currentTime, o = a.createOscillator(), bp = a.createBiquadFilter(), g = a.createGain();
      const f0 = 55 + Math.random() * 40; o.type = 'square'; o.frequency.setValueAtTime(f0, tt); o.frequency.linearRampToValueAtTime(f0 * (1.4 + Math.random() * 0.6), tt + 0.9);
      bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 500; bp.Q.value = 9;
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.05, tt + 0.15); g.gain.linearRampToValueAtTime(0.03, tt + 0.6); g.gain.linearRampToValueAtTime(0, tt + 1);
      o.connect(bp).connect(g).connect(out()); o.start(tt); o.stop(tt + 1.05);
    };
    // A distant bell from the top of the tower
    const bell = () => {
      if (!canPlay()) return; const a = ac!, tt = a.currentTime;
      [1, 2.76, 5.4].forEach((m, i) => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 196 * m; g.gain.setValueAtTime(0.05 / (i + 1), tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 4.5 - i); o.connect(g).connect(out()); o.start(tt); o.stop(tt + 4.6); });
    };
    // One heartbeat: two low thumps
    const heart = () => {
      if (!canPlay()) return; const a = ac!;
      [0, 0.24].forEach((d, i) => { const tt = a.currentTime + d, o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(62, tt); o.frequency.exponentialRampToValueAtTime(34, tt + 0.16); g.gain.setValueAtTime(i ? 0.22 : 0.32, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.2); o.connect(g).connect(out()); o.start(tt); o.stop(tt + 0.22); });
    };

    // Level
    let level: THREE.Group | null = null;
    let MAP = LAYOUTS[0];
    let doorCell: [number, number] = [4, 0], chestCell: [number, number] = [3, 4];
    const windows: THREE.Mesh[] = [];
    const torches: THREE.PointLight[] = [];
    const flames: THREE.Sprite[] = [];
    let px = 4, pz = 7, ang = 0, lift = 0, gotChest = false;
    const buildLevel = (f: number, from: 'below' | 'above' = 'below') => {
      if (level) scene.remove(level);
      level = new THREE.Group(); scene.add(level); windows.length = 0; torches.length = 0; flames.length = 0;
      MAP = LAYOUTS[f % LAYOUTS.length];
      MAP.forEach((row, z) => [...row].forEach((ch, x) => {
        const stairsDown = f > 0 && x === 4 && z === 8;
        if (ch === '#' && !stairsDown) { const m = new THREE.Mesh(boxG, wallMat); m.position.set(x, 1.1, z); level!.add(m); }
        if (ch === 'D') doorCell = [x, z];
        if (ch === 'C') chestCell = [x, z];
      }));
      for (const [x, z] of [[3, -1], [5, -1], [3, -2], [4, -2], [5, -2]]) { const m = new THREE.Mesh(boxG, wallMat); m.position.set(x, 1.1, z); level.add(m); }
      for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: 0x3a3036 })); st.position.set(4, 0.06 + i * 0.14, -0.6 - i * 0.2); level.add(st); }
      // From floor 2 up: stairs down behind the start, back to the floor below
      if (f > 0) {
        for (const [x, z] of [[3, 9], [5, 9], [4, 10]]) { const m = new THREE.Mesh(boxG, wallMat); m.position.set(x, 1.1, z); level.add(m); }
        for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: 0x2a2228 })); st.position.set(4, -0.06 - i * 0.14, 8.15 + i * 0.25); level.add(st); }
        const cap = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshStandardMaterial({ color: 0x0b080c })); cap.rotation.x = Math.PI / 2; cap.position.set(4, 2.2, 9); level.add(cap);
        const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
        const c2 = cv.getContext('2d')!; c2.fillStyle = '#1a0f0b'; c2.fillRect(0, 0, 128, 64); c2.strokeStyle = '#8a6a3a'; c2.lineWidth = 4; c2.strokeRect(2, 2, 124, 60);
        c2.fillStyle = '#e8d9b5'; c2.font = 'bold 40px serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('↓ ' + f, 64, 34);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
        sign.position.set(4, 1.9, 9.49); sign.rotation.y = Math.PI; level.add(sign);
      }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), floorMat); fl.rotation.x = -Math.PI / 2; fl.position.set(4, 0, 3); level.add(fl);
      const ce = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), new THREE.MeshStandardMaterial({ color: 0x0b080c })); ce.rotation.x = Math.PI / 2; ce.position.set(4, 2.2, 3); level.add(ce);
      [[0, 2], [8, 4], [0, 6], [8, 6]].forEach(([x, z]) => {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.8), new THREE.MeshBasicMaterial({ color: 0x111a2a }));
        w.position.set(x === 0 ? 0.51 : 7.49, 1.4, z); w.rotation.y = x === 0 ? Math.PI / 2 : -Math.PI / 2; level!.add(w); windows.push(w);
      });
      [[1, 1], [7, 7], [7, 1]].forEach(([x, z]) => {
        const l = new THREE.PointLight(0xff8a2a, 7, 9, 2); l.position.set(x, 1.45, z); level!.add(l); torches.push(l);
        if (hi) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.001; l.shadow.normalBias = 0.03; l.shadow.camera.near = 0.05; l.shadow.camera.far = 7; }
        const fm = new THREE.Sprite(flameMat); fm.scale.set(0.2, 0.32, 1); fm.position.set(x, 1.47, z); level!.add(fm); flames.push(fm);
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.32, 6), holderMat); st.position.set(x, 1.22, z); st.userData.noShadow = true; level!.add(st);
      });
      const top = f >= FLOORS - 1;
      door.position.set(doorCell[0], 1.1, doorCell[1]);
      lift = !top && live.current.placed >= chambers[f + 1] ? 2.2 : 0;
      door.position.y = 1.1 + lift;
      paintDoor(f);
      // No chest on the ground floor; from floor 2 up, the gift of the door below.
      const opened = readJSON<number[]>(CHEST_KEY, []);
      chest.visible = f > 0;
      chest.position.set(chestCell[0], 0, chestCell[1]);
      gotChest = opened.includes(f);
      lid.rotation.x = gotChest ? -1.2 : 0; lid.position.z = gotChest ? -0.1 : 0;
      glow.position.set(chestCell[0], 0.6, chestCell[1]); glow.intensity = 0;
      // Everything solid casts and catches shadows (not the see-through ghost).
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && !(m.material as THREE.Material).transparent) { m.castShadow = !m.userData.noShadow; m.receiveShadow = true; }
      });
      // Coming up: start by the stairs. Coming down: stand in front of the (open) door, facing into the room.
      if (from === 'below') { px = 4; pz = 7; ang = 0; } else { px = 4; pz = 1; ang = Math.PI; }
    };
    buildLevel(floorRef.current);
    monster.visible = ghost.visible = true;
    renderer.compile(scene, cam);
    monster.visible = ghost.visible = false;

    const solid = (x: number, z: number) => {
      const cx = Math.round(x), cz = Math.round(z), fl = floorRef.current;
      if (cz < 0) return !(cx === 4 && cz === -1);
      if (cz > 8) return !(fl > 0 && cx === 4 && cz === 9);
      if (fl > 0 && cx === 4 && cz === 8) return false;
      const ch = MAP[cz]?.[cx];
      return !ch || ch === '#' || (ch === 'D' && lift < 1.8);
    };
    const aheadSpot = (minD: number, maxD: number): [number, number] | null => {
      for (let d = maxD; d >= minD; d -= 0.5) {
        const x = px - Math.sin(ang) * d, z = pz - Math.cos(ang) * d;
        let ok = true;
        for (let k = 0.3; k < d; k += 0.3) if (solid(px - Math.sin(ang) * k, pz - Math.cos(ang) * k)) { ok = false; break; }
        if (ok && !solid(x, z)) return [x, z];
      }
      return null;
    };

    let raf = 0, t0 = performance.now(), nextScare = 8, nextGhost = 4, nextBolt = 5, walked = 0, shake = 0, climbing = false, boltT = -1, ghostT = -1, ghostDir = 1, vel = 0, turnV = 0, stepPhase = 0, lastStep = 0, lastNear = false, nextAmb = 5, nextBeat = 0;
    let scare: { t: number } | null = null;
    const fx = fxRef.current!, fade = fadeRef.current!;
    // Move one floor up (+1) through an open door, or down (-1) by the stairs
    const go = (delta: 1 | -1) => {
      if (climbing) return;
      const f = Math.max(0, Math.min(FLOORS - 1, floorRef.current + delta));
      if (f === floorRef.current) return;
      climbing = true; fade.textContent = ''; fade.style.opacity = '1';
      if (delta < 0) creak();
      setTimeout(() => {
        floorRef.current = f; setFloor(f);
        try { localStorage.setItem(FLOOR_KEY, String(f)); } catch {}
        buildLevel(f, delta > 0 ? 'below' : 'above');
        fade.textContent = t('tw.floor_title', { n: String(f + 1) });
        setTimeout(() => { fade.style.opacity = '0'; climbing = false; }, 900);
      }, 650);
    };
    let lastPlaced = live.current.placed;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const tt = (now - t0) / 1000, dt = 1 / 60, k = keys.current, f = floorRef.current;
      if (live.current.placed !== lastPlaced) { lastPlaced = live.current.placed; paintDoor(f); }
      const doorOpen = f < FLOORS - 1 && live.current.placed >= chambers[f + 1];
      const turn = climbing ? 0 : (k.ArrowLeft || k.a ? 1 : 0) - (k.ArrowRight || k.d ? 1 : 0);
      turnV += (turn * 0.028 - turnV) * 0.18; ang += turnV;
      const mv = climbing ? 0 : (k.ArrowUp || k.w ? 1 : 0) - (k.ArrowDown || k.s ? 1 : 0);
      vel += ((scare ? 0 : mv) * (mv < 0 ? 0.016 : 0.024) - vel) * 0.1;
      if (Math.abs(vel) > 0.0004) {
        const sp = vel, nx = px - Math.sin(ang) * sp, nz = pz - Math.cos(ang) * sp, rr = 0.22;
        if (!solid(nx + Math.sign(nx - px) * rr, pz)) px = nx;
        if (!solid(px, nz + Math.sign(nz - pz) * rr)) pz = nz;
        walked += Math.abs(sp);
        stepPhase += Math.abs(sp) * 9;
        const st = Math.floor(stepPhase / Math.PI);
        if (st !== lastStep) { lastStep = st; footstep(); }
      }
      if (doorOpen && pz < -0.55 && Math.abs(px - 4) < 0.5) go(1);
      if (f > 0 && pz > 8.7 && Math.abs(px - 4) < 0.5) go(-1);

      // Ambience: master volume, slow wind and drone, random creaks and bells
      if (master) master.gain.value = live.current.sound ? 1 : 0;
      if (windF) windF.frequency.value = 450 + Math.sin(tt * 0.23) * 250 + Math.sin(tt * 0.61) * 120;
      if (droneF) droneF.frequency.value = 150 + Math.sin(tt * 0.13) * 60;
      nextAmb -= dt;
      if (nextAmb <= 0) { nextAmb = 7 + Math.random() * 12; (Math.random() < 0.7 ? creak : bell)(); }
      if (doorOpen && lift < 2.2) { lift += 0.025; door.position.y = 1.1 + lift; }

      // Lightning
      nextBolt -= dt;
      if (nextBolt <= 0) { nextBolt = 8 + Math.random() * 10; boltT = 0; setTimeout(thunder, 400 + Math.random() * 600); }
      if (boltT >= 0) {
        boltT += dt; const fl = boltT < 0.08 || (boltT > 0.18 && boltT < 0.26) ? 1 : 0;
        ambient.intensity = 1.0 + fl * 2.2; windows.forEach((w) => (w.material as THREE.MeshBasicMaterial).color.setHex(fl ? 0xdfe8ff : 0x111a2a));
        if (boltT > 0.4) { boltT = -1; ambient.intensity = 1.0; }
      }
      // Ghosts and monsters
      if (live.current.scares && walked > 0) {
        if (!scare) { nextScare -= dt * (mv ? 1 : 0.4); if (nextScare <= 0) { const sp = aheadSpot(1.6, 3); if (sp) { monster.visible = true; monster.position.set(sp[0], 0, sp[1]); monster.lookAt(px, 0, pz); scare = { t: 0 }; } nextScare = sp ? 12 + Math.random() * 14 : 1; } }
        if (ghostT < 0) { nextGhost -= dt; if (nextGhost <= 0) { const sp = aheadSpot(2, 4); if (sp) { ghost.visible = true; ghost.position.set(sp[0], 0.1, sp[1]); ghostDir = Math.random() < 0.5 ? -1 : 1; ghostT = 0; moan(); } nextGhost = 6 + Math.random() * 8; } }
      }
      if (ghostT >= 0) {
        ghostT += dt; ghost.position.x += Math.cos(ang) * ghostDir * 0.03; ghost.position.z += -Math.sin(ang) * ghostDir * 0.03;
        ghost.position.y = 0.1 + Math.sin(tt * 3) * 0.08; ghost.lookAt(px, ghost.position.y, pz);
        const gf = Math.max(0, Math.min(1, Math.min(ghostT, 2.4 - ghostT) * 2));
        ghostMats.forEach(([m, o]) => (m.opacity = o * gf));
        ghostLight.position.copy(ghost.localToWorld(tmpV.set(0, 1.2, 0.7))); ghostLight.intensity = 0.5 * gf;
        ghostTime.value = tt;
        if (ghostT > 2.4) { ghost.visible = false; ghostT = -1; ghostLight.intensity = 0; }
      }
      if (scare) {
        scare.t += dt;
        // Standing in the dark: head cocked, twitching. Then the lunge: it bends
        // down at you, jaw open, claws reaching, head shaking.
        const lunge = Math.max(0, Math.min(1, (scare.t - 0.35) * 5));
        mParts.head.rotation.set(-0.25 * lunge + (Math.random() - 0.5) * 0.12 * (1 + lunge * 2), (Math.random() - 0.5) * 0.15, 0.35 * (1 - lunge) + Math.sin(tt * 47) * 0.1 * lunge);
        mParts.jaw.rotation.x = 0.1 + lunge * 0.55 + Math.sin(tt * 60) * 0.05 * lunge;
        mParts.upper.rotation.x = 0.38 + lunge * 0.75;
        mParts.arms.forEach((a, i) => { a.rotation.x = -0.35 - lunge * 1.15 + Math.sin(tt * 30 + i) * 0.05 * lunge; a.rotation.z = (i ? 1 : -1) * (0.12 + lunge * 0.25); });
        mParts.fingers.forEach((f, i) => (f.rotation.z = ((i % 4) - 1.5) * (0.12 + lunge * 0.2)));
        if (scare.t < 0.35) { /* standing still in the dark */ }
        else {
          if (scare.t < 0.37) { sting(); fx.style.opacity = '1'; shake = 0.6; }
          const tx = px - Math.sin(ang) * 0.95, tz = pz - Math.cos(ang) * 0.95;
          monster.position.x += (tx - monster.position.x) * 0.25; monster.position.z += (tz - monster.position.z) * 0.25; monster.lookAt(px, 0, pz); monsterEye.intensity = 3; monsterEye.position.copy(monster.localToWorld(tmpV.set(0, 1.62, 0.35)));
        }
        if (scare.t > 1.1) { monster.visible = false; monsterEye.intensity = 0; fx.style.opacity = '0'; scare = null; }
      }
      shake *= 0.88;
      const walkAmt = Math.min(1, Math.abs(vel) / 0.024);
      const bob = Math.abs(Math.sin(stepPhase)) * 0.032 * walkAmt, sway = Math.sin(stepPhase) * 0.012 * walkAmt;
      cam.position.set(
        px + Math.cos(ang) * sway + (Math.random() - 0.5) * shake * 0.15,
        0.885 + bob + Math.sin(tt * 1.3) * 0.004 + (Math.random() - 0.5) * shake * 0.15,
        pz - Math.sin(ang) * sway,
      );
      cam.rotation.set(-walkAmt * 0.01, ang, Math.sin(stepPhase) * 0.006 * walkAmt - turnV * 0.4 + (Math.random() - 0.5) * shake * 0.1);
      hand.position.set(px - Math.sin(ang) * 0.3, 1.05, pz - Math.cos(ang) * 0.3);
      // The lantern: steady while you walk, nearly out while the monster is on you.
      hand.intensity = !scare ? 8 + Math.sin(tt * 13) * 0.5 : scare.t < 0.35 ? 0.05 : 0.25 + Math.random() * 0.5;
      torches.forEach((l, i) => {
        const fl = 0.85 + Math.sin(tt * 11 + i) * 0.1 + Math.sin(tt * 23.7 + i * 2) * 0.06 + (Math.random() - 0.5) * 0.08;
        l.intensity = 7 * fl;
        flames[i]?.scale.set(0.17 + fl * 0.05, 0.28 * fl + 0.04, 1);
      });
      for (let i = 0; i < dustN; i++) { dustPos[i * 3] += Math.cos(tt * 0.3 + i * 1.7) * 0.0012; dustPos[i * 3 + 1] += Math.sin(tt * 0.5 + i) * 0.0015; }
      dustG.attributes.position.needsUpdate = true;
      film.uniforms.time.value = tt % 100;
      film.uniforms.fear.value = scare && scare.t > 0.35 ? 1 : Math.max(0, film.uniforms.fear.value - 0.04);

      // Chest (floors 2+)
      if (f > 0 && !gotChest && Math.hypot(px - chestCell[0], pz - chestCell[1]) < 0.8) {
        gotChest = true; glow.intensity = 1.5;
        const opened = readJSON<number[]>(CHEST_KEY, []);
        if (!opened.includes(f)) { try { localStorage.setItem(CHEST_KEY, JSON.stringify([...opened, f])); } catch {} }
        setChestMsg(f);
      }
      if (gotChest && lid.rotation.x > -1.2) { lid.rotation.x -= 0.04; lid.position.z = -0.1; }
      const near = f < FLOORS - 1 && !doorOpen && Math.hypot(px - doorCell[0], pz - doorCell[1]) < 1.4;
      if (near !== lastNear) { lastNear = near; setNearDoor(near); setHint(''); }
      // Heartbeat while standing at a closed door
      if (near) { nextBeat -= dt; if (nextBeat <= 0) { nextBeat = 0.95; heart(); } } else nextBeat = 0;
      composer.render();
    };
    raf = requestAnimationFrame(frame);
    const down = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow') || 'wasd'.includes(e.key)) { keys.current[e.key] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    const ro = new ResizeObserver(size); ro.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      ro.disconnect();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      ac?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const place = async () => {
    if (!nearDoor || busy) return;
    if (pocket <= 0) { setHint(t('mz.no_stamps')); return; }
    await onPlace();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' && nearDoor) { e.preventDefault(); place(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[k] = true; },
    onPointerUp: () => { keys.current[k] = false; },
    onPointerLeave: () => { keys.current[k] = false; },
    onPointerCancel: () => { keys.current[k] = false; },
  });

  const pad = (
    <div className="grid grid-cols-3 gap-2 w-[156px] select-none">
      <span />
      <button {...hold('ArrowUp')} className="h-12 rounded-lg bg-white/15 active:bg-white/30 backdrop-blur-sm flex items-center justify-center" aria-label={t('tw.forward')}><ArrowUp className="w-5 h-5" /></button>
      <span />
      <button {...hold('ArrowLeft')} className="h-12 rounded-lg bg-white/15 active:bg-white/30 backdrop-blur-sm flex items-center justify-center" aria-label={t('tw.turn_left')}><RotateCcw className="w-5 h-5" /></button>
      <button {...hold('ArrowDown')} className="h-12 rounded-lg bg-white/15 active:bg-white/30 backdrop-blur-sm flex items-center justify-center" aria-label={t('tw.back')}><ArrowDown className="w-5 h-5" /></button>
      <button {...hold('ArrowRight')} className="h-12 rounded-lg bg-white/15 active:bg-white/30 backdrop-blur-sm flex items-center justify-center" aria-label={t('tw.turn_right')}><RotateCw className="w-5 h-5" /></button>
    </div>
  );
  const switches = (
    <div className="flex gap-2">
      <button onClick={() => setSound((v) => !v)} className="px-2.5 py-1.5 rounded-md bg-black/50 hover:bg-black/70 flex items-center gap-1.5 text-xs" aria-label={t('tw.sound')}>
        {sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} <span className="hidden sm:inline">{t('tw.sound')}</span>
      </button>
      <button onClick={() => setScares((v) => !v)} className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs ${scares ? 'bg-brand-red/40 text-white' : 'bg-black/50'}`}>
        <Ghost className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{scares ? t('tw.scares_on') : t('tw.scares_off')}</span>
      </button>
      {embedded ? (
        <button onClick={onClose} className="px-2.5 py-1.5 rounded-md bg-black/50 hover:bg-black/70 flex items-center gap-1.5 text-xs" aria-label={t('tw.exit_full')}>
          <X className="w-3.5 h-3.5" />
        </button>
      ) : started && (
        <button onClick={toggleFull} className="px-2.5 py-1.5 rounded-md bg-black/50 hover:bg-black/70 flex items-center gap-1.5 text-xs" aria-label={full ? t('tw.exit_full') : t('tw.full')}>
          {full ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />} <span className="hidden sm:inline">{full ? t('tw.exit_full') : t('tw.full')}</span>
        </button>
      )}
    </div>
  );
  const isLast = floor >= FLOORS - 1;
  const panel = chestMsg !== null ? (
    <div className="flex items-start gap-3">
      <Gift className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-brand-bone">{t('tw.chest', { n: String(chestMsg + 1) })}</p>
        <p className="text-brand-text-secondary">{t(`mz.gift_${chestMsg}`)} · {t('pp.won')}</p>
      </div>
      <button onClick={() => setChestMsg(null)} className="text-xs text-brand-text-muted hover:text-white">OK</button>
    </div>
  ) : nearDoor ? (
    <div>
      <p className="font-semibold text-brand-bone flex items-center gap-2">
        <Lock className="w-4 h-4 text-brand-red-light" /> {t('tw.door', { n: String(floor + 2), placed: String(inDoor(floor)), need: String(need(floor)) })}
      </p>
      <div className="flex flex-wrap gap-1.5 my-2">
        {Array.from({ length: need(floor) }, (_, i) => (
          <span key={i} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${i < inDoor(floor) ? 'border-brand-red bg-brand-red/30 text-brand-red-light' : 'border-dashed border-brand-border'}`}>
            {i < inDoor(floor) && <Stamp className="w-3 h-3" />}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={place} disabled={busy || pocket <= 0} className="btn-primary text-sm py-2! px-4! flex items-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />} {t('mz.place')}
        </button>
        <span className="text-xs text-brand-text-secondary">{pocket > 0 ? t('mz.in_pocket', { n: String(pocket) }) : t('mz.no_stamps')}</span>
      </div>
      {hint && <p className="text-xs text-brand-gold mt-1">{hint}</p>}
    </div>
  ) : (
    <p className="text-brand-text-secondary">{isLast ? t('tw.soon_hint') : floor === 0 ? t('tw.hint_first') : t('tw.hint')}</p>
  );

  return (
    <div>
      {!full && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-sm">
          <span className="text-brand-text-secondary">{t('tw.floor', { n: String(floor + 1) })}</span>
          {switches}
        </div>
      )}

      <div ref={stage} className={full ? 'fixed inset-0 z-[200] bg-black' : ''}>
        <div ref={wrap} className={`relative overflow-hidden bg-black select-none ${full ? 'w-full h-full' : 'w-full aspect-[4/5] sm:aspect-video rounded-xl'}`}>
          <div ref={fxRef} className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-150" style={{ background: 'radial-gradient(circle at center, rgba(0,0,0,0) 30%, rgba(160,0,0,.75) 100%)' }} />
          <div ref={fadeRef} className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500 bg-black flex items-center justify-center font-display text-2xl tracking-[0.2em] text-brand-bone" />
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-black/85">
              <p className="font-display text-xl sm:text-2xl text-brand-bone mb-2">{t('tw.title')}</p>
              <p className="text-xs sm:text-sm text-brand-text-secondary max-w-sm mb-4 sm:mb-5">{t('tw.warning')}</p>
              <button onClick={() => setStarted(true)} className="btn-primary">{t('tw.enter')}</button>
            </div>
          )}
          {full && (
            <>
              <div className="absolute left-3 right-3 flex items-center justify-between gap-2 z-10" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
                <span className="min-w-0 truncate px-2.5 py-1.5 rounded-md bg-black/50 text-xs sm:text-sm text-brand-bone">{t('tw.floor', { n: String(floor + 1) })} · {t('mz.in_pocket', { n: String(pocket) })}</span>
                {switches}
              </div>
              <div className="absolute left-4 z-10" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>{pad}</div>
              <div className="absolute z-10 flex justify-end left-3 right-3 top-[calc(env(safe-area-inset-top)+3.5rem)] sm:top-auto sm:left-[190px] sm:right-4 sm:bottom-6">
                <div className="max-w-md w-full rounded-md bg-black/65 backdrop-blur-sm px-4 py-3 text-sm">{panel}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {!full && (
        <>
          <div className="mt-3 min-h-[64px] rounded-md bg-black/45 px-4 py-3 text-sm">{panel}</div>
          <div className="flex justify-center mt-3">{pad}</div>
        </>
      )}
    </div>
  );
}
