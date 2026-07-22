import type { PlayerRole, ZoneGrid } from '@pk/shared';
import { PRO_ZONE_GRID } from '@pk/shared';
import { computeLayout, type CameraMode, type Layout } from './geometry';

export interface CameraState {
  mode: CameraMode;
  layout: Layout;
  zoneGrid: ZoneGrid;
}

export function createCameraState(
  width: number,
  height: number,
  role: PlayerRole,
  zoneGrid: ZoneGrid = PRO_ZONE_GRID,
): CameraState {
  const mode: CameraMode = role === 'shooter' ? 'shooter' : 'keeper';
  return {
    mode,
    zoneGrid,
    layout: computeLayout(width, height, mode, zoneGrid),
  };
}

export function setCameraRole(
  camera: CameraState,
  width: number,
  height: number,
  role: PlayerRole,
): void {
  const mode: CameraMode = role === 'shooter' ? 'shooter' : 'keeper';
  if (camera.mode === mode) return;
  camera.mode = mode;
  camera.layout = computeLayout(width, height, mode, camera.zoneGrid);
}

export function resizeCamera(camera: CameraState, width: number, height: number): void {
  camera.layout = computeLayout(width, height, camera.mode, camera.zoneGrid);
}

export function getActiveLayout(camera: CameraState): Layout {
  return camera.layout;
}
