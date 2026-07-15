export type StrikerPose = 'idle' | 'aiming' | 'windup' | 'kick';

export interface StrikerState {
  x: number;
  y: number;
  scale: number;
  pose: StrikerPose;
  kickProgress: number;
  idlePhase: number;
  isPlayer: boolean;
}

export function createStrikerState(
  x: number,
  y: number,
  scale: number,
  isPlayer = true,
): StrikerState {
  return {
    x,
    y,
    scale,
    pose: 'idle',
    kickProgress: 0,
    idlePhase: 0,
    isPlayer,
  };
}

export function syncStrikerLayout(
  striker: StrikerState,
  x: number,
  y: number,
  scale: number,
): void {
  striker.x = x;
  striker.y = y;
  striker.scale = scale;
}

export function setStrikerPose(striker: StrikerState, pose: StrikerPose): void {
  striker.pose = pose;
  if (pose !== 'kick') striker.kickProgress = 0;
}

export function startStrikerKick(striker: StrikerState): void {
  striker.pose = 'kick';
  striker.kickProgress = 0;
}

export function updateStriker(striker: StrikerState, dt: number): void {
  striker.idlePhase += dt * 2.5;

  if (striker.pose === 'kick') {
    striker.kickProgress = Math.min(1, striker.kickProgress + dt * 4);
    if (striker.kickProgress >= 1) {
      striker.pose = 'idle';
      striker.kickProgress = 0;
    }
  }
}

export function resetStriker(striker: StrikerState): void {
  striker.pose = 'idle';
  striker.kickProgress = 0;
}
