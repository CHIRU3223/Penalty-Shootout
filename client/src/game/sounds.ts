export type SoundId = 'goal' | 'save' | 'miss' | 'kick' | 'whistle';

let enabled = true;
const ctx =
  typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function playSound(id: SoundId): void {
  if (!enabled || !ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const presets: Record<SoundId, { freq: number; dur: number; type: OscillatorType }> = {
    goal: { freq: 523, dur: 0.25, type: 'square' },
    save: { freq: 220, dur: 0.15, type: 'triangle' },
    miss: { freq: 110, dur: 0.2, type: 'sawtooth' },
    kick: { freq: 180, dur: 0.08, type: 'sine' },
    whistle: { freq: 880, dur: 0.12, type: 'sine' },
  };

  const p = presets[id];
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, now);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
  osc.start(now);
  osc.stop(now + p.dur);
}
