export interface LoopCallbacks {
  update: (dt: number) => void;
  render: () => void;
}

export interface GameLoop {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

const MAX_DELTA = 0.05;

export function createGameLoop(callbacks: LoopCallbacks): GameLoop {
  let rafId = 0;
  let running = false;
  let lastTime = 0;
  let paused = false;

  const onVisibilityChange = () => {
    paused = document.hidden;
    if (!paused && running) {
      lastTime = performance.now();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  const frame = (now: number) => {
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    if (paused) return;

    const dt = Math.min(MAX_DELTA, (now - lastTime) / 1000);
    lastTime = now;
    if (dt <= 0) return;

    callbacks.update(dt);
    callbacks.render();
  };

  return {
    start() {
      if (running) return;
      running = true;
      paused = document.hidden;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
    isRunning: () => running,
  };
}

export function computeFps(samples: number[]): number {
  if (samples.length === 0) return 0;
  const avgDelta = samples.reduce((a, b) => a + b, 0) / samples.length;
  return avgDelta > 0 ? Math.round(1 / avgDelta) : 0;
}
