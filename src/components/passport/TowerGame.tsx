'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowUp, ArrowDown, RotateCcw, RotateCw, Stamp, Gift, Lock, Loader2, Volume2, VolumeX, Ghost, Maximize2, Minimize2 } from 'lucide-react';
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
  ['####D####', '#...#...#', '#.#...#.#', '#.#.#.#.#', '#.......#', '##.###.##', '#C......#', '#.......#', '#########'],
  ['####D####', '#.......#', '#.##.##.#', '#.......#', '##.#.#.##', '#...#...#', '#.#...#C#', '#.......#', '#########'],
];
const FLOOR_KEY = 'unlocked_tower_floor';
const CHEST_KEY = 'unlocked_tower_chests';
const PREF_KEY = 'unlocked_tower_prefs';

type Props = { placed: number; chambers: number[]; pocket: number; onPlace: () => Promise<unknown>; busy: boolean };

function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function TowerGame({ placed, chambers, pocket, onPlace, busy }: Props) {
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
  const [full, setFull] = useState(false);
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
    const onFs = () => { if (!document.fullscreenElement) setFull(false); };
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040306);
    scene.fog = new THREE.Fog(0x040306, 1, 9);
    const cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 40);
    const size = () => {
      const w = host.clientWidth, h = host.clientHeight || (w * 9) / 16;
      renderer.setSize(w, h);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    size();

    let sd = 5;
    const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const tex = (draw: (x: CanvasRenderingContext2D) => void) => {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      draw(c.getContext('2d')!);
      const tx = new THREE.CanvasTexture(c);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      return tx;
    };
    const stone = tex((x) => {
      x.fillStyle = '#24202a'; x.fillRect(0, 0, 256, 256);
      for (let row = 0; row < 8; row++) for (let b = -1; b < 4; b++) {
        const off = (row % 2) * 32, n = r();
        x.fillStyle = `rgb(${(66 + n * 36) | 0},${(62 + n * 30) | 0},${(70 + n * 30) | 0})`; x.fillRect(b * 64 + off + 3, row * 32 + 3, 58, 26);
        x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(b * 64 + off + 3, row * 32 + 24, 58, 5);
      }
      x.strokeStyle = 'rgba(20,60,30,.35)'; x.lineWidth = 3;
      for (let i = 0; i < 5; i++) { x.beginPath(); const sx = r() * 256; x.moveTo(sx, 0); x.bezierCurveTo(sx + 20, 80, sx - 20, 160, sx + 10, 256); x.stroke(); }
    });
    const floorT = tex((x) => {
      x.fillStyle = '#1a1418'; x.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const n = r(); x.fillStyle = `rgb(${(44 + n * 20) | 0},${(36 + n * 16) | 0},${(40 + n * 16) | 0})`; x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
    });
    floorT.repeat.set(9, 11);
    const wallMat = new THREE.MeshStandardMaterial({ map: stone, roughness: 0.95 });
    const boxG = new THREE.BoxGeometry(1, 2.2, 1);

    // Door with stamp slots
    const doorC = document.createElement('canvas'); doorC.width = doorC.height = 256;
    const dx = doorC.getContext('2d')!; const doorT = new THREE.CanvasTexture(doorC);
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
    const ambient = new THREE.AmbientLight(0x2a2440, 0.45); scene.add(ambient);
    const hand = new THREE.PointLight(0xffa040, 1.5, 5, 2); scene.add(hand);

    // Monster and ghost
    const monster = new THREE.Group();
    {
      const dark = new THREE.MeshStandardMaterial({ color: 0x0d0a09, roughness: 1 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 1.1, 7), dark); body.position.y = 0.65; monster.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshStandardMaterial({ color: 0x9a8f86, roughness: 0.9 })); head.scale.set(1, 1.35, 1); head.position.y = 1.32; monster.add(head);
      const eyeM = new THREE.MeshBasicMaterial({ color: 0xff1a1a });
      [-0.06, 0.06].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeM); e.position.set(x, 1.37, 0.13); monster.add(e); });
      const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000 })); mouth.scale.set(1, 1.8, 0.5); mouth.position.set(0, 1.22, 0.14); monster.add(mouth);
      [-1, 1].forEach((s) => { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.9, 5), dark); arm.position.set(s * 0.2, 0.9, 0.12); arm.rotation.z = s * 0.35; arm.rotation.x = -0.7; monster.add(arm); });
    }
    const monsterEye = new THREE.PointLight(0xff0000, 0, 2.5); monsterEye.position.set(0, 1.37, 0.3); monster.add(monsterEye);
    monster.visible = false; scene.add(monster);
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0xd8e6ff, transparent: true, opacity: 0.35, depthWrite: false });
    const ghost = new THREE.Group();
    {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 12, 1, true), ghostMat); body.position.y = 0.9; body.rotation.x = Math.PI; ghost.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), ghostMat); head.position.y = 1.55; ghost.add(head);
      const em = new THREE.MeshBasicMaterial({ color: 0x000000 });
      [-0.06, 0.06].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), em); e.position.set(x, 1.58, 0.15); ghost.add(e); });
      const l = new THREE.PointLight(0x9fc0ff, 0.6, 2); l.position.y = 1.3; ghost.add(l);
    }
    ghost.visible = false; scene.add(ghost);

    // Sound, generated (no files)
    let ac: AudioContext | null = null;
    try {
      ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 44; g.gain.value = 0.05; o.connect(g).connect(ac.destination); o.start();
    } catch {}
    const noise = (sec: number, shape: (p: number) => number) => {
      const n = ac!.createBuffer(1, ac!.sampleRate * sec, ac!.sampleRate), d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * shape(i / d.length);
      const s = ac!.createBufferSource(); s.buffer = n; return s;
    };
    const canPlay = () => !!ac && live.current.sound;
    const sting = () => {
      if (!canPlay()) return; const a = ac!, tt = a.currentTime;
      const s = noise(0.9, (p) => Math.pow(1 - p, 2)), bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; const g = a.createGain(); g.gain.value = 0.9; s.connect(bp).connect(g).connect(a.destination); s.start(tt);
      [220, 233, 311].forEach((f) => { const o = a.createOscillator(), gg = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * 0.5, tt + 1); gg.gain.setValueAtTime(0.12, tt); gg.gain.exponentialRampToValueAtTime(0.001, tt + 1.1); o.connect(gg).connect(a.destination); o.start(tt); o.stop(tt + 1.2); });
    };
    const thunder = () => { if (!canPlay()) return; const a = ac!; const s = noise(2.5, (p) => Math.pow(1 - p, 1.5) * (p < 0.05 ? p * 20 : 1)), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; const g = a.createGain(); g.gain.value = 1.2; s.connect(lp).connect(g).connect(a.destination); s.start(); };
    const moan = () => { if (!canPlay()) return; const a = ac!, tt = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(320, tt); o.frequency.linearRampToValueAtTime(180, tt + 1.6); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.12, tt + 0.4); g.gain.linearRampToValueAtTime(0, tt + 1.8); o.connect(g).connect(a.destination); o.start(tt); o.stop(tt + 1.9); };

    // Level
    let level: THREE.Group | null = null;
    let MAP = LAYOUTS[0];
    let doorCell: [number, number] = [4, 0], chestCell: [number, number] = [3, 4];
    const windows: THREE.Mesh[] = [];
    const torches: THREE.PointLight[] = [];
    let px = 4, pz = 7, ang = 0, lift = 0, gotChest = false;
    const buildLevel = (f: number) => {
      if (level) scene.remove(level);
      level = new THREE.Group(); scene.add(level); windows.length = 0; torches.length = 0;
      MAP = LAYOUTS[f % LAYOUTS.length];
      MAP.forEach((row, z) => [...row].forEach((ch, x) => {
        if (ch === '#') { const m = new THREE.Mesh(boxG, wallMat); m.position.set(x, 1.1, z); level!.add(m); }
        if (ch === 'D') doorCell = [x, z];
        if (ch === 'C') chestCell = [x, z];
      }));
      for (const [x, z] of [[3, -1], [5, -1], [3, -2], [4, -2], [5, -2]]) { const m = new THREE.Mesh(boxG, wallMat); m.position.set(x, 1.1, z); level.add(m); }
      for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: 0x3a3036 })); st.position.set(4, 0.06 + i * 0.14, -0.6 - i * 0.2); level.add(st); }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), new THREE.MeshStandardMaterial({ map: floorT, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.position.set(4, 0, 3); level.add(fl);
      const ce = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), new THREE.MeshStandardMaterial({ color: 0x0b080c })); ce.rotation.x = Math.PI / 2; ce.position.set(4, 2.2, 3); level.add(ce);
      [[0, 2], [8, 4], [0, 6], [8, 6]].forEach(([x, z]) => {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.8), new THREE.MeshBasicMaterial({ color: 0x111a2a }));
        w.position.set(x === 0 ? 0.51 : 7.49, 1.4, z); w.rotation.y = x === 0 ? Math.PI / 2 : -Math.PI / 2; level!.add(w); windows.push(w);
      });
      [[1, 1], [7, 7], [7, 1]].forEach(([x, z]) => {
        const l = new THREE.PointLight(0xff8a2a, 1, 3.5, 2); l.position.set(x, 1.4, z); level!.add(l); torches.push(l);
        const fm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc060 })); fm.position.copy(l.position); level!.add(fm);
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
      px = 4; pz = 7; ang = 0;
    };
    buildLevel(floorRef.current);

    const solid = (x: number, z: number) => {
      const cx = Math.round(x), cz = Math.round(z);
      if (cz < 0) return !(cx === 4 && cz === -1);
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

    let raf = 0, t0 = performance.now(), nextScare = 8, nextGhost = 4, nextBolt = 5, walked = 0, shake = 0, climbing = false, boltT = -1, ghostT = -1, ghostDir = 1, lastNear = false;
    let scare: { t: number } | null = null;
    const fx = fxRef.current!, fade = fadeRef.current!;
    const climb = () => {
      if (climbing) return;
      climbing = true; fade.textContent = ''; fade.style.opacity = '1';
      setTimeout(() => {
        const f = Math.min(FLOORS - 1, floorRef.current + 1);
        floorRef.current = f; setFloor(f);
        try { localStorage.setItem(FLOOR_KEY, String(f)); } catch {}
        buildLevel(f);
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
      if (!climbing) { if (k.ArrowLeft || k.a) ang += 0.035; if (k.ArrowRight || k.d) ang -= 0.035; }
      const mv = climbing ? 0 : (k.ArrowUp || k.w ? 1 : 0) - (k.ArrowDown || k.s ? 1 : 0);
      if (mv && !scare) {
        const sp = 0.035 * mv, nx = px - Math.sin(ang) * sp, nz = pz - Math.cos(ang) * sp, rr = 0.22;
        if (!solid(nx + Math.sign(nx - px) * rr, pz)) px = nx;
        if (!solid(px, nz + Math.sign(nz - pz) * rr)) pz = nz;
        walked += Math.abs(sp);
      }
      if (doorOpen && pz < -0.55 && Math.abs(px - 4) < 0.5) climb();
      if (doorOpen && lift < 2.2) { lift += 0.025; door.position.y = 1.1 + lift; }

      // Lightning
      nextBolt -= dt;
      if (nextBolt <= 0) { nextBolt = 8 + Math.random() * 10; boltT = 0; setTimeout(thunder, 400 + Math.random() * 600); }
      if (boltT >= 0) {
        boltT += dt; const fl = boltT < 0.08 || (boltT > 0.18 && boltT < 0.26) ? 1 : 0;
        ambient.intensity = 0.45 + fl * 2.2; windows.forEach((w) => (w.material as THREE.MeshBasicMaterial).color.setHex(fl ? 0xdfe8ff : 0x111a2a));
        if (boltT > 0.4) { boltT = -1; ambient.intensity = 0.45; }
      }
      // Ghosts and monsters
      if (live.current.scares && walked > 0) {
        if (!scare) { nextScare -= dt * (mv ? 1 : 0.4); if (nextScare <= 0) { const sp = aheadSpot(1.6, 3); if (sp) { monster.visible = true; monster.position.set(sp[0], 0, sp[1]); monster.lookAt(px, 0, pz); scare = { t: 0 }; } nextScare = sp ? 12 + Math.random() * 14 : 1; } }
        if (ghostT < 0) { nextGhost -= dt; if (nextGhost <= 0) { const sp = aheadSpot(2, 4); if (sp) { ghost.visible = true; ghost.position.set(sp[0], 0.1, sp[1]); ghostDir = Math.random() < 0.5 ? -1 : 1; ghostT = 0; moan(); } nextGhost = 6 + Math.random() * 8; } }
      }
      if (ghostT >= 0) {
        ghostT += dt; ghost.position.x += Math.cos(ang) * ghostDir * 0.03; ghost.position.z += -Math.sin(ang) * ghostDir * 0.03;
        ghost.position.y = 0.1 + Math.sin(tt * 3) * 0.08; ghost.lookAt(px, ghost.position.y, pz);
        ghostMat.opacity = 0.35 * Math.max(0, Math.min(1, Math.min(ghostT, 2.4 - ghostT) * 2));
        if (ghostT > 2.4) { ghost.visible = false; ghostT = -1; }
      }
      if (scare) {
        scare.t += dt;
        if (scare.t < 0.35) hand.intensity = 0.05;
        else {
          if (scare.t < 0.37) { sting(); fx.style.opacity = '1'; shake = 0.6; }
          const tx = px - Math.sin(ang) * 0.45, tz = pz - Math.cos(ang) * 0.45;
          monster.position.x += (tx - monster.position.x) * 0.25; monster.position.z += (tz - monster.position.z) * 0.25; monster.lookAt(px, 0, pz); monsterEye.intensity = 3;
        }
        if (scare.t > 1.1) { monster.visible = false; monsterEye.intensity = 0; fx.style.opacity = '0'; scare = null; }
      }
      shake *= 0.88;
      cam.position.set(px + (Math.random() - 0.5) * shake * 0.15, 0.9 + Math.sin(tt * 8) * (mv ? 0.02 : 0) + (Math.random() - 0.5) * shake * 0.15, pz);
      cam.rotation.set(0, ang, (Math.random() - 0.5) * shake * 0.1);
      hand.position.set(px - Math.sin(ang) * 0.3, 1.05, pz - Math.cos(ang) * 0.3);
      if (!(scare && scare.t < 0.35)) hand.intensity = 1.5 + Math.sin(tt * 13) * 0.15;
      torches.forEach((l, i) => (l.intensity = 1 + Math.sin(tt * 11 + i) * 0.25));

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
      renderer.render(scene, cam);
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
      {started && (
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
        <div ref={wrap} className={`relative overflow-hidden bg-black select-none ${full ? 'w-full h-full' : 'w-full aspect-video rounded-xl'}`}>
          <div ref={fxRef} className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-150" style={{ background: 'radial-gradient(circle at center, rgba(0,0,0,0) 30%, rgba(160,0,0,.75) 100%)' }} />
          <div ref={fadeRef} className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500 bg-black flex items-center justify-center font-display text-2xl tracking-[0.2em] text-brand-bone" />
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/85">
              <p className="font-display text-2xl text-brand-bone mb-2">{t('tw.title')}</p>
              <p className="text-sm text-brand-text-secondary max-w-sm mb-5">{t('tw.warning')}</p>
              <button onClick={() => setStarted(true)} className="btn-primary">{t('tw.enter')}</button>
            </div>
          )}
          {full && (
            <>
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                <span className="px-2.5 py-1.5 rounded-md bg-black/50 text-sm text-brand-bone">{t('tw.floor', { n: String(floor + 1) })} · {t('mz.in_pocket', { n: String(pocket) })}</span>
                {switches}
              </div>
              <div className="absolute left-4 z-10" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>{pad}</div>
              <div className="absolute right-4 left-[190px] z-10 flex justify-end" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
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
