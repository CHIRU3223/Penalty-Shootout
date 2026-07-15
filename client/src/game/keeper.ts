import type { Zone } from '@pk/shared';

export interface KeeperState {
  diving: boolean;
  progress: number;
  duration: number;
  targetZone: Zone;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  w: number;
  h: number;
  targetX: number;
  targetY: number;
  lean: number;
  idlePhase: number;
}

export function createKeeperState(
  baseX: number,
  baseY: number,
  w: number,
  h: number,
): KeeperState {
  return {
    diving: false,
    progress: 0,
    duration: 0.38,
    targetZone: 4,
    baseX,
    baseY,
    x: baseX,
    y: baseY,
    w,
    h,
    targetX: baseX,
    targetY: baseY,
    lean: 0,
    idlePhase: 0,
  };
}

export function startKeeperDive(
  keeper: KeeperState,
  targetZone: Zone,
  targetX: number,
  targetY: number,
): void {
  keeper.diving = true;
  keeper.progress = 0;
  keeper.targetZone = targetZone;
  keeper.targetX = targetX - keeper.w / 2;
  keeper.targetY = targetY - keeper.h * 0.35;
  const dir = targetX - (keeper.baseX + keeper.w / 2);
  keeper.lean = Math.max(-1, Math.min(1, dir / (keeper.w * 0.8)));
}

export function updateKeeper(keeper: KeeperState, dt: number): boolean {
  keeper.idlePhase += dt * 2;

  if (!keeper.diving) return false;

  keeper.progress = Math.min(1, keeper.progress + dt / keeper.duration);
  const t = easeOutQuad(keeper.progress);
  keeper.x = lerp(keeper.baseX, keeper.targetX, t);
  keeper.y = lerp(keeper.baseY, keeper.targetY, t * 0.9);

  if (keeper.progress >= 1) {
    keeper.diving = false;
    return true;
  }
  return false;
}

export function resetKeeper(keeper: KeeperState): void {
  keeper.diving = false;
  keeper.progress = 0;
  keeper.x = keeper.baseX;
  keeper.y = keeper.baseY;
  keeper.targetX = keeper.baseX;
  keeper.targetY = keeper.baseY;
  keeper.lean = 0;
}

export function syncKeeperLayout(
  keeper: KeeperState,
  baseX: number,
  baseY: number,
  w: number,
  h: number,
): void {
  const dx = keeper.x - keeper.baseX;
  const dy = keeper.y - keeper.baseY;
  keeper.baseX = baseX;
  keeper.baseY = baseY;
  keeper.w = w;
  keeper.h = h;
  if (!keeper.diving) {
    keeper.x = baseX;
    keeper.y = baseY;
  } else {
    keeper.x = baseX + dx;
    keeper.y = baseY + dy;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
