'use client';

import { useEffect, useRef } from 'react';
import { useMusicEnabled } from '@/lib/ambient';
import { useMode } from '@/lib/mode';

/**
 * Quiet spooky background music, made live in the browser (Web Audio): a low
 * drone that slowly breathes, a soft wind and now and then a few music-box
 * notes in a long echo. No audio files, nothing to license.
 * Horror side: a dark minor chord. Puzzle side: a calmer, mysterious one.
 * Starts with the visitor's first click or key press (browsers block sound
 * before that), stops when switched off (lib/ambient.ts) and pauses while the
 * tab is hidden.
 */

const VOLUME = 0.16;

const SCALES = {
  horror: {
    drone: [73.42, 110.0, 174.61], // D2 A2 F3
    bells: [587.33, 698.46, 880.0, 1046.5, 1174.66, 622.25], // D5 F5 A5 C6 D6 Eb5
  },
  puzzle: {
    drone: [65.41, 98.0, 164.81], // C2 G2 E3
    bells: [523.25, 659.25, 783.99, 880.0, 1046.5, 1174.66], // C5 E5 G5 A5 C6 D6
  },
} as const;

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  setChord: (side: 'horror' | 'puzzle') => void;
  stop: () => void;
};

function makeImpulse(ctx: AudioContext, seconds: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

function startEngine(side: 'horror' | 'puzzle'): Engine | null {
  const AC: typeof AudioContext | undefined =
    typeof window !== 'undefined' ? window.AudioContext || (window as any).webkitAudioContext : undefined;
  if (!AC) return null;
  const ctx = new AC();
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(VOLUME, now + 5);
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx, 5);
  const wet = ctx.createGain();
  wet.gain.value = 0.7;
  reverb.connect(wet).connect(master);

  // Drone: detuned pairs through a slowly breathing low-pass
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 520;
  droneFilter.Q.value = 2;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = 260;
  lfo.connect(lfoAmt).connect(droneFilter.frequency);
  lfo.start();
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.32;
  droneFilter.connect(droneGain);
  droneGain.connect(master);
  droneGain.connect(reverb);

  const voices: OscillatorNode[][] = SCALES[side].drone.map((f, i) => {
    const pair = [-4, 5].map((cents, j) => {
      const o = ctx.createOscillator();
      o.type = j === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.28;
      o.connect(g).connect(droneFilter);
      o.start();
      return o;
    });
    return pair;
  });

  // Wind: filtered noise that swells and fades
  const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const wind = ctx.createBufferSource();
  wind.buffer = noise;
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.8;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.025;
  const windLfo = ctx.createOscillator();
  windLfo.frequency.value = 0.03;
  const windLfoAmt = ctx.createGain();
  windLfoAmt.gain.value = 0.02;
  windLfo.connect(windLfoAmt).connect(windGain.gain);
  windLfo.start();
  wind.connect(windFilter).connect(windGain).connect(master);
  windGain.connect(reverb);
  wind.start();

  // Music-box notes, sparse, mostly heard through the echo
  let current: 'horror' | 'puzzle' = side;
  let timer: ReturnType<typeof setTimeout>;
  const bell = () => {
    const t = ctx.currentTime;
    const notes = SCALES[current].bells;
    const count = Math.random() < 0.35 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const f = notes[Math.floor(Math.random() * notes.length)];
      const start = t + k * (0.35 + Math.random() * 0.4);
      [1, 2.01].forEach((mult, j) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f * mult;
        const g = ctx.createGain();
        const peak = j === 0 ? 0.06 : 0.015;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(peak, start + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 3.2);
        o.connect(g);
        g.connect(reverb);
        const dry = ctx.createGain();
        dry.gain.value = 0.35;
        g.connect(dry).connect(master);
        o.start(start);
        o.stop(start + 3.4);
      });
    }
    timer = setTimeout(bell, 4000 + Math.random() * 7000);
  };
  timer = setTimeout(bell, 3000);

  return {
    ctx,
    master,
    setChord: (s) => {
      if (s === current) return;
      current = s;
      const t = ctx.currentTime;
      SCALES[s].drone.forEach((f, i) => voices[i].forEach((o) => o.frequency.setTargetAtTime(f, t, 1.5)));
    },
    stop: () => {
      clearTimeout(timer);
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 1.2);
      setTimeout(() => ctx.close().catch(() => {}), 1400);
    },
  };
}

export function AmbientMusic() {
  const on = useMusicEnabled();
  const mode = useMode();
  const side: 'horror' | 'puzzle' = mode === 'puzzle' ? 'puzzle' : 'horror';
  const engine = useRef<Engine | null>(null);
  const sideRef = useRef(side);
  sideRef.current = side;

  // Follow the side the visitor picked
  useEffect(() => {
    engine.current?.setChord(side);
  }, [side]);

  // On: start now if the page already had a click (toggle click), else on the first one
  useEffect(() => {
    if (!on) {
      engine.current?.stop();
      engine.current = null;
      return;
    }
    const start = () => {
      if (engine.current) {
        engine.current.ctx.resume().catch(() => {});
        return;
      }
      engine.current = startEngine(sideRef.current);
    };
    const hasGesture = (navigator as any).userActivation?.hasBeenActive;
    if (hasGesture) start();
    const onGesture = () => start();
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [on]);

  // Quiet while the tab is hidden
  useEffect(() => {
    const onVis = () => {
      const e = engine.current;
      if (!e) return;
      if (document.hidden) e.ctx.suspend().catch(() => {});
      else e.ctx.resume().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Leaving the player site (company portal etc.) stops it
  useEffect(() => () => engine.current?.stop(), []);

  return null;
}
