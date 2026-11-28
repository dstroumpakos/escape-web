'use client';

import { useEffect, useRef } from 'react';
import { useMusicEnabled } from '@/lib/ambient';
import { usePageMode } from '@/lib/mode';

/**
 * Quiet spooky background music, made live in the browser (Web Audio): a slow
 * music-box lullaby in a long echo over a very soft pad and a faint wind.
 * No audio files, nothing to license. (The first version had a strong low
 * drone; it read as a hum, so the pad is now soft and the melody leads.)
 * Horror side: a dark minor chord. Puzzle side: a calmer, mysterious one.
 * Starts with the visitor's first click or key press (browsers block sound
 * before that), stops when switched off (lib/ambient.ts) and pauses while the
 * tab is hidden.
 */

const VOLUME = 0.14;

const SCALES = {
  // Soft pad an octave up (no low rumble); bells in order, low to high, for the melody
  horror: {
    drone: [146.83, 220.0, 174.61], // D3 A3 F3
    bells: [440.0, 523.25, 587.33, 659.25, 698.46, 880.0, 1046.5, 1174.66], // A4 C5 D5 E5 F5 A5 C6 D6
  },
  puzzle: {
    drone: [130.81, 196.0, 164.81], // C3 G3 E3
    bells: [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5], // G4 A4 C5 D5 E5 G5 A5 C6
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
  droneFilter.frequency.value = 420;
  droneFilter.Q.value = 0.4;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = 90;
  lfo.connect(lfoAmt).connect(droneFilter.frequency);
  lfo.start();
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.09;
  droneFilter.connect(droneGain);
  droneGain.connect(master);
  droneGain.connect(reverb);

  const voices: OscillatorNode[][] = SCALES[side].drone.map((f, i) => {
    const pair = [-4, 5].map((cents, j) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = 0.3;
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
  windGain.gain.value = 0.01;
  const windLfo = ctx.createOscillator();
  windLfo.frequency.value = 0.03;
  const windLfoAmt = ctx.createGain();
  windLfoAmt.gain.value = 0.008;
  windLfo.connect(windLfoAmt).connect(windGain.gain);
  windLfo.start();
  wind.connect(windFilter).connect(windGain).connect(master);
  windGain.connect(reverb);
  wind.start();

  // Music-box lullaby: slow steps up and down the scale, with rests
  let current: 'horror' | 'puzzle' = side;
  let timer: ReturnType<typeof setTimeout>;
  let idx = 2;
  const bell = () => {
    const notes = SCALES[current].bells;
    // Mostly a neighbour note, sometimes a small leap; stay in range
    const step = [-1, 1, 1, -1, 2, -2, 0][Math.floor(Math.random() * 7)];
    idx = Math.max(0, Math.min(notes.length - 1, idx + step));
    const f = notes[idx];
    const start = ctx.currentTime + 0.02;
    [1, 2.0, 3.01].forEach((mult, j) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const g = ctx.createGain();
      const peak = [0.05, 0.012, 0.004][j];
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(peak, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 4);
      o.connect(g);
      g.connect(reverb);
      const dry = ctx.createGain();
      dry.gain.value = 0.5;
      g.connect(dry).connect(master);
      o.start(start);
      o.stop(start + 4.2);
    });
    // Unhurried: a note every ~1.5 s, and now and then a longer rest
    const rest = Math.random() < 0.18 ? 4000 + Math.random() * 4000 : 1300 + Math.random() * 900;
    timer = setTimeout(bell, rest);
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
  const mode = usePageMode();
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
