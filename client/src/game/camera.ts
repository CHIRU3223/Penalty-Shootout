import type { PlayerRole } from '@pk/shared';
import { computeLayout, type CameraMode, type Layout } from './geometry';

export interface CameraState {
  mode: CameraMode;
  layout: Layout;
}

export function createCameraState(width: number, height: number, role: PlayerRole): CameraState {
  const mode: CameraMode = role === 'shooter' ? 'shooter' : 'keeper';
  return {
    mode,
    layout: computeLayout(width, height, mode),
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
  camera.layout = computeLayout(width, height, mode);
}

export function resizeCamera(camera: CameraState, width: number, height: number): void {
  camera.layout = computeLayout(width, height, camera.mode);
}

export function getActiveLayout(camera: CameraState): Layout {
  return camera.layout;
}
