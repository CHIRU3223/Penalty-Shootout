import type { Zone } from '@pk/shared';

export type CameraMode = 'shooter' | 'keeper';

export interface Layout {
  width: number;
  height: number;
  mode: CameraMode;
  goalX: number;
  goalY: number;
  goalW: number;
  goalH: number;
  spotX: number;
  spotY: number;
  keeperBaseX: number;
  keeperBaseY: number;
  keeperW: number;
  keeperH: number;
  strikerX: number;
  strikerY: number;
  strikerScale: number;
  ballRadius: number;
}

export function computeShooterLayout(canvasWidth: number, canvasHeight: number): Layout {
  const width = canvasWidth;
  const height = canvasHeight;
  const goalW = width * 0.78;
  const goalH = height * 0.3;
  const goalX = (width - goalW) / 2;
  const goalY = height * 0.06;
  const spotX = width / 2;
  const spotY = height * 0.8;
  const keeperW = goalW * 0.18;
  const keeperH = goalH * 0.7;

  return {
    width,
    height,
    mode: 'shooter',
    goalX,
    goalY,
    goalW,
    goalH,
    spotX,
    spotY,
    keeperBaseX: width / 2 - keeperW / 2,
    keeperBaseY: goalY + goalH * 0.15,
    keeperW,
    keeperH,
    strikerX: spotX,
    strikerY: spotY - height * 0.06,
    strikerScale: Math.max(1, width / 400),
    ballRadius: Math.max(8, width * 0.018),
  };
}

export function computeKeeperLayout(canvasWidth: number, canvasHeight: number): Layout {
  const width = canvasWidth;
  const height = canvasHeight;
  const goalW = width * 0.88;
  const goalH = height * 0.38;
  const goalX = (width - goalW) / 2;
  const goalY = height * 0.52;
  const spotX = width / 2;
  const spotY = height * 0.12;
  const keeperW = goalW * 0.28;
  const keeperH = goalH * 0.85;

  return {
    width,
    height,
    mode: 'keeper',
    goalX,
    goalY,
    goalW,
    goalH,
    spotX,
    spotY,
    keeperBaseX: width / 2 - keeperW / 2,
    keeperBaseY: goalY + goalH * 0.08,
    keeperW,
    keeperH,
    strikerX: spotX,
    strikerY: spotY,
    strikerScale: Math.max(0.45, width / 900),
    ballRadius: Math.max(6, width * 0.012),
  };
}

export function computeLayout(
  canvasWidth: number,
  canvasHeight: number,
  mode: CameraMode = 'shooter',
): Layout {
  return mode === 'shooter'
    ? computeShooterLayout(canvasWidth, canvasHeight)
    : computeKeeperLayout(canvasWidth, canvasHeight);
}

export function zoneCenter(layout: Layout, zone: Zone): { x: number; y: number } {
  const col = zone % 3;
  const row = Math.floor(zone / 3);
  const cellW = layout.goalW / 3;
  const cellH = layout.goalH / 3;
  return {
    x: layout.goalX + cellW * col + cellW / 2,
    y: layout.goalY + cellH * row + cellH / 2,
  };
}

export function zoneFromPoint(layout: Layout, x: number, y: number): Zone | null {
  const { goalX, goalY, goalW, goalH } = layout;
  if (x < goalX || x > goalX + goalW || y < goalY || y > goalY + goalH) {
    return null;
  }
  const col = Math.min(2, Math.floor(((x - goalX) / goalW) * 3));
  const row = Math.min(2, Math.floor(((y - goalY) / goalH) * 3));
  return (row * 3 + col) as Zone;
}

/** Project drag direction from penalty spot onto the goal to pick a zone. */
export function zoneFromDrag(
  layout: Layout,
  pointerX: number,
  pointerY: number,
): Zone | null {
  const direct = zoneFromPoint(layout, pointerX, pointerY);
  if (direct !== null) return direct;

  const { spotX, spotY, goalX, goalY, goalW, goalH } = layout;
  const targetY = goalY + goalH * 0.5;

  // Must be aiming upward toward the goal
  if (pointerY >= spotY - 12) return null;

  const dy = pointerY - spotY;
  const dx = pointerX - spotX;
  const slope = dx / dy;
  const ix = spotX + slope * (targetY - spotY);
  const clampedX = Math.max(goalX + goalW * 0.04, Math.min(goalX + goalW * 0.96, ix));
  return zoneFromPoint(layout, clampedX, targetY);
}

export function canvasPointFromEvent(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
