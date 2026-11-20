'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Stamp, Gift, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/**
 * The passport maze game (2D, seen from above). 11 halls joined by 10 iron
 * doors; door i opens once `placed` >= chambers[i]. The hero walks with a
 * torch through the dark; behind every door there is a chest with a gift.
 *
 * The maze comes from a fixed seed, so every player walks the same one.
 * Stamps are placed through `onPlace` (the server keeps the count).
 */

const T = 32; // tile size
const RW = 15; // hall width in tiles (walls included)
const RH = 11; // hall height
const HALLS = 11;
const W = HALLS * (RW - 1) + 1;
const H = RH;
const MID = 5; // row of the doors

type Tile = 0 | 1; // 0 floor, 1 wall

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
}

/** The same maze for everybody: one carved hall after another. */
function buildMaze() {
  const g: Tile[][] = Array.from({ length: H }, () => Array(W).fill(1));
  const r = rng(424242);
  for (let h = 0; h < HALLS; h++) {
    const ox = h * (RW - 1);
    const seen = new Set<string>();
    const stack: [number, number][] = [[1, MID]];
    g[MID][ox + 1] = 0;
    seen.add(`1,${MID}`);
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const dirs = ([[2, 0], [-2, 0], [0, 2], [0, -2]] as [number, number][])
        .filter(([dx, dy]) => {
          const nx = cx + dx, ny = cy + dy;
          return nx >= 1 && nx <= RW - 2 && ny >= 1 && ny <= RH - 2 && !seen.has(`${nx},${ny}`);
        });
      if (!dirs.length) {
        stack.pop();
        continue;
      }
      const [dx, dy] = dirs[Math.floor(r() * dirs.length)];
      g[cy + dy / 2][ox + cx + dx / 2] = 0;
      g[cy + dy][ox + cx + dx] = 0;
      seen.add(`${cx + dx},${cy + dy}`);
      stack.push([cx + dx, cy + dy]);
    }
    // A few extra openings, so the halls have loops and fewer dead ends.
    for (let k = 0; k < 7; k++) {
      const x = 2 + Math.floor(r() * (RW - 4)), y = 1 + Math.floor(r() * (RH - 2));
      if ((x + y) % 2 === 1) g[y][ox + x] = 0;
    }
    // The way in and out of the hall stays open.
    g[MID][ox + 1] = 0;
    g[MID][ox + RW - 2] = 0;
  }
  const doors = Array.from({ length: HALLS - 1 }, (_, i) => ({ x: (i + 1) * (RW - 1), y: MID }));
  const chests = Array.from({ length: HALLS - 1 }, (_, i) => ({ x: (i + 1) * (RW - 1) + 1, y: MID }));
  // Torches on walls that face a corridor.
  const torches: { x: number; y: number }[] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++)
      if (g[y][x] === 1 && g[y + 1]?.[x] === 0 && r() < 0.06) torches.push({ x, y });
  return { g, doors, chests, torches };
}

const MAZE = buildMaze();
const POS_KEY = 'unlocked_maze_pos';
const CHEST_KEY = 'unlocked_maze_chests';

export function MazeGame({
  placed,
  chambers,
  pocket,
  onPlace,
  busy,
}: {
  placed: number;
  chambers: number[];
  pocket: number; // stamps not placed yet
  onPlace: () => Promise<unknown>;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const state = useRef({ px: 1.5 * T, py: (MID + 0.5) * T, face: 1, step: 0, doorLift: Array(10).fill(0) as number[] });
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [nearDoor, setNearDoor] = useState<number | null>(null);
  const [chest, setChest] = useState<number | null>(null);
  const [opened, setOpened] = useState<number[]>([]);
  const [hint, setHint] = useState('');

  const doorOpen = (i: number) => placedRef.current >= chambers[i + 1];

  // Remember where the player was and which chests they opened (this browser only).
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (p && typeof p.x === 'number') Object.assign(state.current, { px: p.x, py: p.y });
      setOpened(JSON.parse(localStorage.getItem(CHEST_KEY) || '[]'));
    } catch {}
    // Doors already open start lifted.
    state.current.doorLift = state.current.doorLift.map((_, i) => (placed >= chambers[i + 1] ? T : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const place = useCallback(async () => {
    if (nearDoor === null || doorOpen(nearDoor) || busy) return;
    if (pocket <= 0) {
      setHint(t('mz.no_stamps'));
      return;
    }
    await onPlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearDoor, busy, pocket, onPlace]);

  useEffect(() => {
    const cv = canvas.current!;
    const cx = cv.getContext('2d')!;
    const noise: number[] = [];
    const r = rng(99);
    for (let i = 0; i < W * H; i++) noise.push(r());
    const off = document.createElement('canvas');
    let raf = 0, t0 = performance.now(), lastSave = 0, lastNear: number | null = null;

    const solid = (tx: number, ty: number) => {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
      if (MAZE.g[ty][tx] === 1) {
        const d = MAZE.doors.findIndex((d) => d.x === tx && d.y === ty);
        if (d >= 0) return state.current.doorLift[d] < T - 4;
        return true;
      }
      return false;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      const s = state.current;
      const k = keys.current;
      const dx = (k.ArrowRight || k.d ? 1 : 0) - (k.ArrowLeft || k.a ? 1 : 0);
      const dy = (k.ArrowDown || k.s ? 1 : 0) - (k.ArrowUp || k.w ? 1 : 0);
      if (dx || dy) {
        const sp = 2;
        if (dx) s.face = dx;
        const rr = 9;
        const free = (X: number, Y: number) =>
          !solid(Math.floor((X - rr) / T), Math.floor((Y - rr) / T)) &&
          !solid(Math.floor((X + rr) / T), Math.floor((Y - rr) / T)) &&
          !solid(Math.floor((X - rr) / T), Math.floor((Y + rr) / T)) &&
          !solid(Math.floor((X + rr) / T), Math.floor((Y + rr) / T));
        if (free(s.px + dx * sp, s.py)) s.px += dx * sp;
        if (free(s.px, s.py + dy * sp)) s.py += dy * sp;
        s.step += 0.25;
      }
      // Doors slide up once they're open.
      s.doorLift = s.doorLift.map((l, i) => (doorOpen(i) && l < T ? l + 0.6 : l));

      // Near a closed door?
      const near = MAZE.doors.findIndex((d, i) => !doorOpen(i) && Math.hypot(s.px - (d.x * T + 16), s.py - (d.y * T + 16)) < 48);
      const nd = near >= 0 ? near : null;
      if (nd !== lastNear) {
        lastNear = nd;
        setNearDoor(nd);
        setHint('');
      }
      // On a chest behind an open door?
      MAZE.chests.forEach((c, i) => {
        if (doorOpen(i) && Math.hypot(s.px - (c.x * T + 16), s.py - (c.y * T + 16)) < 18) {
          setOpened((o) => {
            if (o.includes(i)) return o;
            const next = [...o, i];
            try { localStorage.setItem(CHEST_KEY, JSON.stringify(next)); } catch {}
            setChest(i);
            return next;
          });
        }
      });
      if (now - lastSave > 1500) {
        lastSave = now;
        try { localStorage.setItem(POS_KEY, JSON.stringify({ x: s.px, y: s.py })); } catch {}
      }

      // ── Draw ──
      const vw = cv.width, vh = cv.height;
      const camX = Math.max(0, Math.min(W * T - vw, s.px - vw / 2));
      const camY = Math.max(0, Math.min(H * T - vh, s.py - vh / 2));
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.fillStyle = '#050302';
      cx.fillRect(0, 0, vw, vh);
      cx.setTransform(1, 0, 0, 1, -Math.round(camX), -Math.round(camY));
      const x0 = Math.floor(camX / T), x1 = Math.min(W - 1, Math.ceil((camX + vw) / T));
      for (let y = 0; y < H; y++)
        for (let x = x0; x <= x1; x++) {
          const n = noise[y * W + x];
          if (MAZE.g[y][x] === 0 || MAZE.doors.some((d) => d.x === x && d.y === y)) {
            cx.fillStyle = `rgb(${(38 + n * 14) | 0},${(30 + n * 10) | 0},${(26 + n * 8) | 0})`;
            cx.fillRect(x * T, y * T, T, T);
            cx.strokeStyle = 'rgba(0,0,0,.35)';
            cx.strokeRect(x * T + 0.5, y * T + 0.5, T / 2, T / 2);
            cx.strokeRect(x * T + T / 2 + 0.5, y * T + T / 2 + 0.5, T / 2 - 1, T / 2 - 1);
          } else {
            cx.fillStyle = '#1b1512';
            cx.fillRect(x * T, y * T, T, T);
            for (let row = 0; row < 4; row++) {
              const o = (row % 2) * 8;
              for (let b = -1; b < 3; b++) {
                const m = noise[(y * W + x + row + b + 7) % (W * H)];
                cx.fillStyle = `rgb(${(70 + m * 30) | 0},${(58 + m * 22) | 0},${(50 + m * 18) | 0})`;
                cx.fillRect(x * T + b * 16 + o + 1, y * T + row * 8 + 1, 14, 6);
              }
            }
            if (MAZE.g[y + 1]?.[x] === 0) {
              cx.fillStyle = 'rgba(0,0,0,.45)';
              cx.fillRect(x * T, y * T + T - 5, T, 5);
            }
          }
        }
      // Torches
      MAZE.torches.forEach((tc, i) => {
        if (tc.x < x0 - 1 || tc.x > x1 + 1) return;
        const f = Math.sin(t * 12 + i) * 0.5 + 0.5, bx = tc.x * T + 16, by = tc.y * T + 12;
        cx.fillStyle = '#5a3a1e'; cx.fillRect(bx - 2, by, 4, 12);
        cx.fillStyle = '#ffb43a'; cx.beginPath(); cx.ellipse(bx, by - 2, 4 + f * 1.5, 7 + f * 2, 0, 0, Math.PI * 2); cx.fill();
        cx.fillStyle = '#fff3b0'; cx.beginPath(); cx.ellipse(bx, by, 2, 3.5, 0, 0, Math.PI * 2); cx.fill();
      });
      // Doors (iron bars, stamp slots, number plate)
      MAZE.doors.forEach((d, i) => {
        const x = d.x * T, y = d.y * T, lift = s.doorLift[i];
        const need = chambers[i + 1] - chambers[i];
        const inDoor = Math.max(0, Math.min(need, placedRef.current - chambers[i]));
        cx.save(); cx.beginPath(); cx.rect(x, y, T, T); cx.clip();
        cx.fillStyle = '#3a3f45'; cx.fillRect(x, y - lift, T, T);
        cx.fillStyle = '#555c63'; for (let b = 0; b < 4; b++) cx.fillRect(x + 3 + b * 7, y - lift + 1, 3, T - 2);
        const per = need > 5 ? 5 : need;
        for (let j = 0; j < need; j++) {
          const col = j % per, row = Math.floor(j / per);
          cx.beginPath(); cx.arc(x + 5 + col * 5.5, y - lift + (need > 5 ? 12 + row * 8 : 16), 2.3, 0, Math.PI * 2);
          cx.fillStyle = j < inDoor ? '#e0312f' : '#15181b'; cx.fill();
        }
        cx.restore();
        cx.fillStyle = '#c99a2e'; cx.font = 'bold 9px sans-serif'; cx.textAlign = 'center';
        cx.fillText(String(i + 1), x + 16, y - 3);
      });
      // Chests
      MAZE.chests.forEach((c, i) => {
        const x = c.x * T + 6, y = c.y * T + 10, isOpen = opened.includes(i);
        cx.fillStyle = '#6b3f17'; cx.fillRect(x, y, 20, 14);
        cx.fillStyle = '#c99a2e'; cx.fillRect(x, y + 5, 20, 2); cx.fillRect(x + 9, y + 3, 2, 6);
        cx.fillStyle = isOpen ? '#8a5422' : '#7b4a1d';
        if (isOpen) { cx.fillRect(x, y - 8, 20, 5); cx.fillStyle = '#ffd76a'; cx.fillRect(x + 3, y - 2, 14, 3); } else cx.fillRect(x, y - 3, 20, 5);
      });
      // Hero
      const bob = Math.sin(s.step) * 1.5, hx = s.px, hy = s.py + bob;
      cx.fillStyle = 'rgba(0,0,0,.4)'; cx.beginPath(); cx.ellipse(s.px, s.py + 11, 8, 3, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = '#7a1414'; cx.fillRect(hx - 6, hy - 4, 12, 12);
      cx.fillStyle = '#e8c9a0'; cx.fillRect(hx - 4, hy - 11, 8, 7);
      cx.fillStyle = '#2a1a10'; cx.fillRect(hx - 4, hy - 12, 8, 3);
      cx.fillStyle = '#000'; cx.fillRect(hx - 2 + s.face * 1.2, hy - 8, 1.5, 1.5); cx.fillRect(hx + 1 + s.face * 1.2, hy - 8, 1.5, 1.5);
      cx.fillStyle = '#3a2414'; cx.fillRect(hx - 5, hy + 8, 3, 4 - Math.sin(s.step) * 1.5); cx.fillRect(hx + 2, hy + 8, 3, 4 + Math.sin(s.step) * 1.5);
      const tx = hx + s.face * 8;
      cx.fillStyle = '#5a3a1e'; cx.fillRect(tx - 1, hy - 6, 2, 9);
      cx.fillStyle = '#ffb43a'; cx.beginPath(); cx.ellipse(tx, hy - 8, 2.5, 4, 0, 0, Math.PI * 2); cx.fill();

      // Darkness with light around the hero and the torches
      off.width = vw; off.height = vh;
      const o = off.getContext('2d')!;
      o.fillStyle = 'rgba(4,2,2,0.92)'; o.fillRect(0, 0, vw, vh);
      o.globalCompositeOperation = 'destination-out';
      const lights: [number, number, number][] = [[tx - camX, hy - 8 - camY, 130 + Math.sin(t * 9) * 6]];
      MAZE.torches.forEach((tc, i) => {
        if (tc.x >= x0 - 3 && tc.x <= x1 + 3) lights.push([tc.x * T + 16 - camX, tc.y * T + 10 - camY, 90 + Math.sin(t * 11 + i) * 6]);
      });
      for (const [lx, ly, lr] of lights) {
        const gr = o.createRadialGradient(lx, ly, 4, lx, ly, lr);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        o.fillStyle = gr; o.beginPath(); o.arc(lx, ly, lr, 0, Math.PI * 2); o.fill();
      }
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.drawImage(off, 0, 0);
      cx.globalCompositeOperation = 'lighter';
      for (const [lx, ly, lr] of lights) {
        const gr = cx.createRadialGradient(lx, ly, 2, lx, ly, lr * 0.7);
        gr.addColorStop(0, 'rgba(255,140,40,.16)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
        cx.fillStyle = gr; cx.beginPath(); cx.arc(lx, ly, lr * 0.7, 0, Math.PI * 2); cx.fill();
      }
      cx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(frame);

    const down = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow') || 'wasd'.includes(e.key)) {
        keys.current[e.key] = true;
        if (e.key.startsWith('Arrow')) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // Space places a stamp at the door.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && nearDoor !== null) {
        e.preventDefault();
        place();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearDoor, place]);

  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[k] = true; },
    onPointerUp: () => { keys.current[k] = false; },
    onPointerLeave: () => { keys.current[k] = false; },
    onPointerCancel: () => { keys.current[k] = false; },
  });

  const doorInfo = nearDoor !== null && (() => {
    const need = chambers[nearDoor + 1] - chambers[nearDoor];
    const inDoor = Math.max(0, Math.min(need, placed - chambers[nearDoor]));
    return { need, inDoor };
  })();

  return (
    <div>
      <canvas ref={canvas} width={640} height={352} className="w-full rounded-xl bg-black block select-none" style={{ imageRendering: 'pixelated' }} aria-label={t('pp.tab_maze')} />

      <div className="mt-3 min-h-[64px] rounded-md bg-black/45 px-4 py-3 text-sm">
        {chest !== null ? (
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-brand-bone">{t('mz.chest_title', { n: String(chest + 1) })}</p>
              <p className="text-brand-text-secondary">{t(`mz.gift_${chest + 1}`)} · {t('pp.won')}</p>
            </div>
            <button onClick={() => setChest(null)} className="text-xs text-brand-text-muted hover:text-white">OK</button>
          </div>
        ) : doorInfo ? (
          <div>
            <p className="font-semibold text-brand-bone flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-red-light" /> {t('mz.door', { n: String(nearDoor! + 1), placed: String(doorInfo.inDoor), need: String(doorInfo.need) })}
            </p>
            <div className="flex flex-wrap gap-1.5 my-2">
              {Array.from({ length: doorInfo.need }, (_, i) => (
                <span key={i} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${i < doorInfo.inDoor ? 'border-brand-red bg-brand-red/30 text-brand-red-light' : 'border-dashed border-brand-border'}`}>
                  {i < doorInfo.inDoor && <Stamp className="w-3 h-3" />}
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
          <p className="text-brand-text-secondary">{t('mz.hint')}</p>
        )}
      </div>

      {/* Touch controls */}
      <div className="grid grid-cols-3 gap-2 w-[156px] mx-auto mt-3 select-none">
        <span />
        <button {...hold('ArrowUp')} className="h-12 rounded-lg bg-white/10 active:bg-white/20 flex items-center justify-center" aria-label="Up"><ArrowUp className="w-5 h-5" /></button>
        <span />
        <button {...hold('ArrowLeft')} className="h-12 rounded-lg bg-white/10 active:bg-white/20 flex items-center justify-center" aria-label="Left"><ArrowLeft className="w-5 h-5" /></button>
        <button {...hold('ArrowDown')} className="h-12 rounded-lg bg-white/10 active:bg-white/20 flex items-center justify-center" aria-label="Down"><ArrowDown className="w-5 h-5" /></button>
        <button {...hold('ArrowRight')} className="h-12 rounded-lg bg-white/10 active:bg-white/20 flex items-center justify-center" aria-label="Right"><ArrowRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
