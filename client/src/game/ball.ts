import type { Zone } from '@pk/shared';
import { computeArcHeight } from './trajectory';

export interface BallTrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface BallState {
  active: boolean;
  progress: number;
  duration: number;
  power: number;
  startX: number;
  startY: number;
  targetZone: Zone;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  trail: BallTrailPoint[];
}

const TRAIL_LENGTH = 12;

export function createBallState(): BallState {
  return {
    active: false,
    progress: 0,
    duration: 0.55,
    power: 0.5,
    startX: 0,
    startY: 0,
    targetZone: 4,
    targetX: 0,
    targetY: 0,
    x: 0,
    y: 0,
    trail: [],
  };
}

export function startBallFlight(
  ball: BallState,
  startX: number,
  startY: number,
  targetZone: Zone,
  targetX: number,
  targetY: number,
  power = 0.5,
): void {
  ball.active = true;
  ball.progress = 0;
  ball.power = power;
  ball.startX = startX;
  ball.startY = startY;
  ball.targetZone = targetZone;
  ball.targetX = targetX;
  ball.targetY = targetY;
  ball.x = startX;
  ball.y = startY;
  ball.trail = [];
}

export function updateBall(ball: BallState, dt: number): boolean {
  if (!ball.active) return false;

  ball.progress = Math.min(1, ball.progress + dt / ball.duration);
  const t = easeOutCubic(ball.progress);
  ball.x = lerp(ball.startX, ball.targetX, t);
  const arcHeight = computeArcHeight(ball.startY, ball.targetY, ball.power);
  const baseY = lerp(ball.startY, ball.targetY, t);
  const arc = Math.sin(Math.PI * t) * arcHeight;
  ball.y = baseY - arc;

  ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 1 });
  if (ball.trail.length > TRAIL_LENGTH) {
    ball.trail.pop();
  }
  for (let i = 0; i < ball.trail.length; i++) {
    ball.trail[i].alpha = 1 - i / TRAIL_LENGTH;
  }

  if (ball.progress >= 1) {
    ball.active = false;
    return true;
  }
  return false;
}

export function resetBall(ball: BallState, x: number, y: number): void {
  ball.active = false;
  ball.progress = 0;
  ball.x = x;
  ball.y = y;
  ball.startX = x;
  ball.startY = y;
  ball.trail = [];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
