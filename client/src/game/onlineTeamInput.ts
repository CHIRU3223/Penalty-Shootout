import type { Zone } from '@pk/shared';
import { canvasPointFromEvent, zoneFromPoint, type Layout } from './geometry';
import type { OnlineTeamStateMachine } from './onlineTeamState';

export function createOnlineTeamInputHandlers(
  getLayout: () => Layout,
  machine: OnlineTeamStateMachine,
  onAction?: () => void,
) {
  let canvas: HTMLCanvasElement | null = null;

  const getZone = (clientX: number, clientY: number): Zone | null => {
    if (!canvas) return null;
    const point = canvasPointFromEvent(canvas, clientX, clientY);
    return zoneFromPoint(getLayout(), point.x, point.y);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const snap = machine.snapshot;
    if (snap.phase !== 'PICK' || snap.playerLocked || snap.yourRole === 'spectator') return;

    const zone = getZone(e.clientX, e.clientY);
    if (zone !== null) {
      machine.pickZone(zone);
      onAction?.();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const snap = machine.snapshot;
    if (snap.phase === 'PICK' && !snap.playerLocked && snap.yourRole !== 'spectator') {
      machine.setHoverZone(getZone(e.clientX, e.clientY));
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  return {
    attach(target: HTMLCanvasElement) {
      canvas = target;
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
    },
    detach() {
      if (!canvas) return;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas = null;
    },
  };
}
