import type { Zone, ZoneGrid } from '@pk/shared';
import { PRO_ZONE_GRID } from '@pk/shared';

export type CameraMode = 'shooter' | 'keeper';

export interface Layout {
  width: number;
  height: number;
  mode: CameraMode;
  zoneRows: number;
  zoneCols: number;
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

export function computeShooterLayout(
  canvasWidth: number,
  canvasHeight: number,
  zoneGrid: ZoneGrid = PRO_ZONE_GRID,
): Layout {
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
    zoneRows: zoneGrid.rows,
    zoneCols: zoneGrid.cols,
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

export function computeKeeperLayout(
  canvasWidth: number,
  canvasHeight: number,
  zoneGrid: ZoneGrid = PRO_ZONE_GRID,
): Layout {
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
    zoneRows: zoneGrid.rows,
    zoneCols: zoneGrid.cols,
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
  zoneGrid: ZoneGrid = PRO_ZONE_GRID,
): Layout {
  return mode === 'shooter'
    ? computeShooterLayout(canvasWidth, canvasHeight, zoneGrid)
    : computeKeeperLayout(canvasWidth, canvasHeight, zoneGrid);
}

export function zoneCenter(layout: Layout, zone: Zone): { x: number; y: number } {
  const col = zone % layout.zoneCols;
  const row = Math.floor(zone / layout.zoneCols);
  const cellW = layout.goalW / layout.zoneCols;
  const cellH = layout.goalH / layout.zoneRows;
  return {
    x: layout.goalX + cellW * col + cellW / 2,
    y: layout.goalY + cellH * row + cellH / 2,
  };
}

export function zoneFromPoint(layout: Layout, x: number, y: number): Zone | null {
  const { goalX, goalY, goalW, goalH, zoneRows, zoneCols } = layout;
  if (x < goalX || x > goalX + goalW || y < goalY || y > goalY + goalH) {
    return null;
  }
  const col = Math.min(zoneCols - 1, Math.floor(((x - goalX) / goalW) * zoneCols));
  const row = Math.min(zoneRows - 1, Math.floor(((y - goalY) / goalH) * zoneRows));
  return (row * zoneCols + col) as Zone;
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
